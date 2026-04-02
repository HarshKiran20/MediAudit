"""
claim_auditor.py
----------------
Groq-powered comparison engine.

Compares extracted bill text against:
  1. The MediAudit generalised policy baseline (from policy_engine.py)
  2. Any user-uploaded insurer-specific policy PDF (optional)

Returns a structured audit result containing:
  - Per line-item breakdown (parameter, bill detail, policy clause, status, lag reason)
  - Risk score (0–100) per finding
  - Overall insurance eligibility verdict
  - Recommended next steps for the patient
"""

from __future__ import annotations

import json
import logging
import re
import textwrap
from typing import Any

from groq import Groq  # type: ignore

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level client (initialised once via configure_groq)
# ---------------------------------------------------------------------------
_client: Groq | None = None

# ---------------------------------------------------------------------------
# Few-shot examples
# ---------------------------------------------------------------------------

FEW_SHOT_EXAMPLES: str = textwrap.dedent("""
<examples>

  # Change the expected_row format in FEW_SHOT_EXAMPLES (around line 40)
  <example id="1">
    <scenario>Room rent sub-limit violation</scenario>
    <bill_snippet>Room Charges: ICU stay – 5 days × ₹8,000/day = ₹40,000</bill_snippet>
    <policy_snippet>ICU room rent capped at ₹10,000/day</policy_snippet>
    <expected_row>
      {
        "item": "ICU Room Rent",
        "claimed": "40000",
        "approved": "40000",
        "parameter": "ICU Room Rent",
        "bill_detail": "₹8,000/day × 5 days = ₹40,000",
        "policy_clause": "ICU sub-limit: ₹10,000/day",
        "status": "✅",
        "lag_reason": "Daily ICU rate is within the ₹10,000/day sub-limit. Fully admissible.",
        "risk_score": 5,
        "risk_label": "Low"
      }
    </expected_row>
  </example>

  <example id="2">
    <scenario>Waiting period not satisfied – knee replacement</scenario>
    <bill_snippet>Knee Replacement Surgery – Date: 14-Mar-2024. Policy Inception: 01-Feb-2024</bill_snippet>
    <policy_snippet>Joint replacement: 24-month waiting period</policy_snippet>
    <expected_row>
      {
        "item": "Knee Replacement Surgery"
        "claimed": "5050000"
        "approved": "250000"
        "parameter": "Knee Replacement Surgery",
        "bill_detail": "Procedure on 14-Mar-2024 (policy age ≈ 1.5 months)",
        "policy_clause": "Waiting Period – Joint replacement: 24 months",
        "status": "❌",
        "lag_reason": "Waiting period not met. Remaining: ≈22.5 months. Claim not admissible.",
        "risk_score": 95,
        "risk_label": "Critical"
      }
    </expected_row>
  </example>

  <example id="3">
    <scenario>Pre-existing diabetes complication</scenario>
    <bill_snippet>Diabetic Nephropathy treatment – ₹80,000</bill_snippet>
    <policy_snippet>PED covered after 2-year waiting period</policy_snippet>
    <expected_row>
      {
        "item":"Diabetic Nephropathy"
        "claimed":"50000"
        "approved":"30000"
        "parameter": "Diabetic Nephropathy",
        "bill_detail": "₹80,000 – complication of pre-existing diabetes",
        "policy_clause": "Pre-Existing Disease (PED) – 2-year waiting period",
        "status": "⚠️",
        "lag_reason": "Diabetes is a known PED. Covered only if policy is >2 years old. 10% co-pay applies.",
        "risk_score": 60,
        "risk_label": "Medium"
      }
    </expected_row>
  </example>

  <example id="4">
    <scenario>Excluded treatment – cosmetic</scenario>
    <bill_snippet>Rhinoplasty (nose reshaping) – ₹1,20,000</bill_snippet>
    <policy_snippet>Cosmetic surgery explicitly excluded</policy_snippet>
    <expected_row>
      {
        "item": "Rhinoplasty"
        "claimed": "400000"
        "approved": "200000"
        "parameter": "Rhinoplasty",
        "bill_detail": "₹1,20,000 – elective cosmetic procedure",
        "policy_clause": "Exclusion – Cosmetic/aesthetic treatments",
        "status": "❌",
        "lag_reason": "Elective cosmetic surgery is a hard exclusion. Claim fully rejected.",
        "risk_score": 100,
        "risk_label": "Critical"
      }
    </expected_row>
  </example>

  <example id="5">
    <scenario>Co-pay – senior citizen non-network hospital</scenario>
    <bill_snippet>Patient age 63. Total bill ₹2,00,000. Non-network hospital.</bill_snippet>
    <policy_snippet>Senior citizen co-pay 20%; Non-network co-pay 20% (max combined 30%)</policy_snippet>
    <expected_row>
      {
        "item": "Senior + Non-network Co-pay"
        "claimed": "250000"
        "approved": "250000"
        "parameter": "Senior + Non-network Co-pay",
        "bill_detail": "₹2,00,000 – age 63, non-network hospital",
        "policy_clause": "Co-pay – Senior citizen 20% + Non-network 20% (capped at 30%)",
        "status": "⚠️",
        "lag_reason": "Combined co-pay capped at 30%. Patient liability: ₹60,000. Admissible: ₹1,40,000.",
        "risk_score": 40,
        "risk_label": "Medium"
      }
    </expected_row>
  </example>

</examples>
""")

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT: str = textwrap.dedent("""
You are MediAudit, a senior insurance underwriting and claim validation expert
with 20+ years of experience across Indian health insurance policies.

You will receive:
  1. <policy_baseline>  – A generalised insurance policy with standard rules.
  2. <uploaded_policy>  – An insurer-specific policy (may be empty; use baseline if so).
  3. <bill>             – Extracted medical bill text.
  4. <examples>         – Few-shot labelled examples showing exact output format.

Your tasks:
  A. For EACH line item in the bill, produce one JSON row with these exact keys:
       "item"         – clinical name of the service/charge (e.g. "Consultation")
       "claimed"      – numerical amount billed (e.g. "500")
       "approved"     – numerical amount eligible under policy (e.g. "450")
       "parameter"    – treatment / charge name for UI
       "bill_detail"  – amount + description from bill
       "policy_clause"– matching policy rule
       "status"       – exactly one of: ✅  ⚠️  ❌
       "lag_reason"   – 1–2 sentence explanation
       "risk_score"   – integer 0–100
       "risk_label"   – one of: "Low" | "Medium" | "High" | "Critical"
       
  B. After the rows, produce an "eligibility" object:
       "verdict"      – one of: "Eligible" | "Partially Eligible" | "Not Eligible"
       "summary"      – 2–3 sentence plain-English explanation for the patient
       "next_steps"   – list of 3–5 concrete action strings the patient should take

  C. Risk scoring guide:
       0–20   → Low      (no issue or minor informational flag)
       21–50  → Medium   (partial coverage, co-pay, sub-limit breach)
       51–80  → High     (waiting period issue, PED concern)
       81–100 → Critical (hard exclusion, fraud risk, full rejection)

  D. Blend the uploaded policy with the baseline:
       - If uploaded policy has a stricter rule → use uploaded
       - If baseline has a stricter rule and uploaded is silent → use baseline
       - Use LLM reasoning for anything neither document covers explicitly


  E. ANOMALY & FRAUD DETECTION:
  Evaluate each line item for the following 'Red Flags':
  1. PRICE INFLATION: Flag if an item (e.g., 'Consultation') exceeds ₹2,000 without specialist justification.
  2. UNBUNDLING: Flag if 'Surgery' and 'Surgical Supplies/Sutures' are billed separately (supplies are usually bundled).
  3. CHRONOLOGICAL ERRORS: Flag if 'Post-Op Consultation' occurs before 'Surgery' date.
  4. QUANTITY ANOMALY: Flag if 'Medicine X' is billed for 30 units for a 2-day stay.

  If an anomaly is detected:
  - Set 'status' to ❌ or ⚠️.
  - Increase 'risk_score' by 40+.
  - Add '⚠️ POTENTIAL ANOMALY:' to the start of 'lag_reason'.

Output ONLY a valid JSON object with two keys: "rows" and "eligibility".
No markdown fences. No commentary outside the JSON.
""").strip()

# ---------------------------------------------------------------------------
# User message builder
# ---------------------------------------------------------------------------

def _build_user_message(
    bill_text: str,
    policy_baseline_text: str,
    uploaded_policy_text: str,
) -> str:
    return textwrap.dedent(f"""
    {FEW_SHOT_EXAMPLES}

    <policy_baseline>
    {policy_baseline_text}
    </policy_baseline>

    <uploaded_policy>
    {uploaded_policy_text if uploaded_policy_text.strip() else "No insurer-specific policy uploaded. Use baseline only."}
    </uploaded_policy>

    <bill>
    {bill_text}
    </bill>

    Now perform the full audit and return the JSON object.
    """).strip()

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def configure_groq(api_key: str) -> None:
    """Initialise the Groq client. Call once at application startup."""
    global _client
    _client = Groq(api_key=api_key)
    logger.info("Groq client initialised.")


def audit_claim(
    bill_text: str,
    policy_baseline_text: str,
    uploaded_policy_text: str = "",
    model_name: str = "llama-3.3-70b-versatile",
    temperature: float = 0.1,
) -> dict[str, Any]:
    """
    Audit a medical bill against the generalised policy baseline and any
    uploaded insurer-specific policy.

    Args:
        bill_text:             Extracted text from the medical bill.
        policy_baseline_text:  Compact text from policy_engine.get_policy_as_prompt_text().
        uploaded_policy_text:  Extracted text from a user-uploaded policy PDF (optional).
        model_name:            Groq model to use.
        temperature:           Sampling temperature.

    Returns:
        Dict with two keys:
          "rows"        – list of per-line-item dicts
          "eligibility" – dict with verdict, summary, next_steps
    """
    if _client is None:
        raise RuntimeError(
            "Groq client not initialised. Call configure_groq(api_key) first."
        )

    user_message = _build_user_message(
        bill_text, policy_baseline_text, uploaded_policy_text
    )

    logger.info("Sending audit request to Groq (%s)…", model_name)

    response = _client.chat.completions.create(
        model=model_name,
        temperature=temperature,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
    )

    raw: str = response.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw)

    parsed: dict[str, Any] = json.loads(raw)

    # Normalise: some models may return rows at top level
    if "rows" not in parsed:
        # Try to find a list and an eligibility object
        rows = next((v for v in parsed.values() if isinstance(v, list)), [])
        eligibility = parsed.get("eligibility", {
            "verdict": "Unknown",
            "summary": "Could not determine eligibility.",
            "next_steps": ["Please review manually."],
        })
        parsed = {"rows": rows, "eligibility": eligibility}

    logger.info(
        "Audit complete – %d rows | verdict: %s",
        len(parsed.get("rows", [])),
        parsed.get("eligibility", {}).get("verdict", "?"),
    )
    for row in parsed.get("rows", []):
        # If the LLM used 'parameter' but forgot 'item', sync them
        if "item" not in row or not row["item"]:
            row["item"] = row.get("parameter", "Medical Service")
        
        # Ensure numerical values are present for the PDF
        if "claimed" not in row:
            # Try to extract the number from 'bill_detail' if 'claimed' is missing
            amounts = re.findall(r'\d+', str(row.get("bill_detail", "")))
            row["claimed"] = amounts[0] if amounts else "0"
            
        if "approved" not in row:
             row["approved"] = row["claimed"] if row["status"] == "✅" else "0"
    
    return parsed