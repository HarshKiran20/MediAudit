"""
app.py - MediAudit – Claim Validator (Final End-to-End Version)
"""
from __future__ import annotations
import base64
import logging
from pathlib import Path
import pandas as pd
import streamlit as st

# --- NEW END-TO-END IMPORTS ---
from Medi_Audit.backend.database import init_db, save_audit
from history_ui import render_history_page
from Medi_Audit.backend.processors.policy_engine import get_all_providers, load_policy, generate_ui_markdown

# ── Page config ───────────────────────────────────────────────────────────
st.set_page_config(
    page_title="MediAudit – Claim Validator",
    page_icon="🏥",
    layout="wide",
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)

# ── Global UI Constants ───────────────────────────────────────────────────
STATUS_COLOURS = {"✅": "#d4edda", "⚠️": "#fff3cd", "❌": "#f8d7da"}
RISK_COLOURS = {"Low": "#28a745", "Medium": "#fd7e14", "High": "#dc3545", "Critical": "#7b0000"}
VERDICT_COLOURS = {"Eligible": "#d4edda", "Partially Eligible": "#fff3cd", "Not Eligible": "#f8d7da"}
VERDICT_ICONS = {"Eligible": "✅", "Partially Eligible": "⚠️", "Not Eligible": "❌"}

# ── Helpers ───────────────────────────────────────────────────────────────
def _get_api_key() -> str:
    try:
        return st.secrets["GROQ_API_KEY"]
    except (KeyError, FileNotFoundError):
        st.error("❌ **GROQ_API_KEY not found.** Add it to `.streamlit/secrets.toml`")
        st.stop()

def _available_policies() -> list[Path]:
    return sorted(DATA_DIR.glob("*.pdf"))

def _colour_row(row: pd.Series) -> list[str]:
    status = str(row.get("Status", "")).strip()
    bg = STATUS_COLOURS.get(status, "#1e1e1e")
    fg = "#111111" if status in STATUS_COLOURS else "#ffffff"
    return [f"background-color: {bg}; color: {fg}"] * len(row)

def _init_state() -> None:
    defaults = {
        "bill_bytes": None, "bill_filename": None, "bill_text": None,
        "audit_result": None, "input_mode": "Upload File",
        "camera_active": False, "uploaded_file_id": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

# ── Original Auditor Interface Logic ──────────────────────────────────────
def render_original_auditor():
    # ── Sidebar ───────────────────────────────────────────────────────────
    with st.sidebar:
        st.markdown(
            "<h2 style='text-align:center'>🏥 MediAudit</h2>"
            "<p style='text-align:center;color:grey'>Insurance Claim Validator</p>",
            unsafe_allow_html=True,
        )
        st.divider()

        # NEW: JSON Policy Selector
        st.subheader("Select Insurer")
        available_policies = get_all_providers()
        if available_policies:
            selected_policy_file = st.selectbox("Choose Provider", available_policies)
            active_policy_data = load_policy(selected_policy_file)
            st.success(f"Loaded: {active_policy_data['provider_name']}")
            
            # Show Dynamic Rules
            with st.expander(f"📖 View Rules: {active_policy_data['provider_name']}", expanded=False):
                st.markdown(generate_ui_markdown(active_policy_data))
        else:
            st.warning("No policy files found in /policies folder.")
            active_policy_data = None

        st.divider()

        # Optional uploaded policy PDF logic
        policies = _available_policies()
        if policies:
            policy_names = ["— Use baseline only —"] + [p.name for p in policies]
            selected = st.selectbox("📋 Extra Policy PDF (Optional)", policy_names)
            policy_choice = None if selected.startswith("—") else DATA_DIR / selected
        else:
            policy_choice = None

    # ── Main Header ───────────────────────────────────────────────────────
    st.title("🏥 MediAudit – Claim Validator")
    st.caption("Upload or capture a medical bill to cross-check against policy rules.")
    st.divider()

    # ── STEP 1 : Input ────────────────────────────────────────────────────
    st.subheader("Step 1 — Provide Medical Bill")
    tab_upload, tab_camera = st.tabs(["📁 Upload File", "📷 Capture from Camera"])

    with tab_upload:
        uploaded = st.file_uploader("Upload bill", type=["pdf", "png", "jpg", "jpeg", "tiff"], key="file_uploader")
        if uploaded:
            if uploaded.file_id != st.session_state.get("uploaded_file_id"):
                st.session_state.bill_bytes = uploaded.read()
                st.session_state.bill_filename = uploaded.name
                st.session_state.bill_text = None
                st.session_state.audit_result = None
                st.session_state.uploaded_file_id = uploaded.file_id
            st.info(f"📄 File loaded: {uploaded.name}")

    with tab_camera:
        if st.button("📷 Open Camera", type="primary"):
            st.session_state.camera_active = True
        if st.session_state.get("camera_active"):
            cam_img = st.camera_input("Capture Bill")
            if cam_img:
                st.session_state.bill_bytes = cam_img.getvalue()
                st.session_state.bill_filename = "camera_capture.jpg"
                st.session_state.camera_active = False
                st.rerun()

    # ── STEP 2 : Extract ──────────────────────────────────────────────────
    st.divider()
    st.subheader("Step 2 — Extract Details")
    if st.button("🔬 Extract Details", type="primary", disabled=st.session_state.bill_bytes is None):
        from Medi_Audit.backend.processors.ocr_engine import extract_text_from_bytes
        from groq import Groq
        client = Groq(api_key=_get_api_key())
        with st.spinner("🤖 Vision AI reading bill..."):
            try:
                text = extract_text_from_bytes(st.session_state.bill_bytes, st.session_state.bill_filename, client)
                st.session_state.bill_text = text
            except Exception as e:
                st.error(f"Extraction failed: {e}")

    if st.session_state.bill_text:
        with st.container(border=True):
            st.markdown(st.session_state.bill_text)

    # ── STEP 3 : Cross Check & SAVE ───────────────────────────────────────
    st.divider()
    st.subheader("Step 3 — Cross Check")
    if st.button("⚖️ Cross Check", type="primary", disabled=not st.session_state.bill_text):
        from Medi_Audit.backend.processors.claim_auditor import audit_claim
        from Medi_Audit.backend.processors.claim_auditor import configure_groq, audit_claim
        from Medi_Audit.backend.processors.policy_engine import format_policy_for_ai 
        from groq import Groq
        
        api_key = _get_api_key()
        
        # --- ADD THIS LINE TO INITIALIZE THE AUDITOR ---
        configure_groq(api_key) 
        
        groq_client = Groq(api_key=api_key)
        
        with st.spinner("⚖️ Groq is cross-checking against policy..."):
            try:
                # Prepare the policy text from our loaded JSON
                policy_text = format_policy_for_ai(active_policy_data) if 'active_policy_data' in locals() else "Use baseline."
                
                result = audit_claim(
                    bill_text=st.session_state.bill_text,
                    policy_baseline_text=policy_text, # Pass the dynamic text here
                )
                st.session_state.audit_result = result
                
                # SAVE TO DB
                rows = result.get("rows", [])
                avg_risk = sum(r.get("risk_score", 0) for r in rows) / len(rows) if rows else 0
                
                save_audit(
                    filename=st.session_state.bill_filename,
                    insurer=active_policy_data.get('provider_name', 'Baseline') if 'active_policy_data' in locals() else "Baseline",
                    verdict=result.get("eligibility", {}).get("verdict", "Unknown"),
                    risk_score=avg_risk,
                    extracted_text=st.session_state.bill_text,
                    result_dict=result
                )
                st.toast("✅ Saved to History!")
            except Exception as exc:
                st.error(f"Audit failed: {exc}")

    # ── STEP 4 : Results ──────────────────────────────────────────────────
    if st.session_state.audit_result:
        res = st.session_state.audit_result
        rows = res.get("rows", [])
        v_type = res['eligibility']['verdict']
        
        st.markdown(f"<div style='background:{VERDICT_COLOURS.get(v_type)}; padding:15px; border-radius:10px; color:black;'><h3>{VERDICT_ICONS.get(v_type)} {v_type}</h3><p>{res['eligibility']['summary']}</p></div>", unsafe_allow_html=True)
        
        if rows:
            df = pd.DataFrame(rows).rename(columns={"parameter": "Parameter", "status": "Status", "risk_score": "Risk"})
            st.dataframe(df.style.apply(_colour_row, axis=1), use_container_width=True)

        from Medi_Audit.backend.processors.report_gen import generate_pdf_report
    
        st.divider()
        st.subheader("🏁 Finalize Audit")
    
        # 1. Generate the PDF (returns bytearray)
        pdf_output = generate_pdf_report(
            st.session_state.audit_result, 
            st.session_state.bill_filename,
            active_policy_data['provider_name'] if 'active_policy_data' in locals() else "Baseline"
        )
    
        # 2. CONVERT bytearray to bytes (This fixes the error)
        pdf_bytes = bytes(pdf_output)
    
        # 3. Pass the standard bytes to the button
        st.download_button(
            label="📥 Download Official Audit Report (PDF)",
            data=pdf_bytes,
            file_name=f"MediAudit_{st.session_state.bill_filename}.pdf",
            mime="application/pdf",
            type="primary"
        )
# ── MAIN NAVIGATION ──
def main() -> None:
    init_db()
    _init_state()

    with st.sidebar:
        st.markdown("---")
        st.subheader("🧭 Navigation")
        page = st.radio("Select View", ["Live Auditor 🏥", "Audit History 📊"])
        st.markdown("---")

    if page == "Live Auditor 🏥":
        render_original_auditor()
    else:
        render_history_page()

if __name__ == "__main__":
    main()