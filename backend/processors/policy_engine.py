import json
import os
from pathlib import Path

POLICY_DIR = Path(__file__).parent.parent / "policies"

def load_policy(provider_filename: str):
    """Loads a specific insurance policy from a JSON file."""
    path = POLICY_DIR / provider_filename
    if not path.exists():
        return None
    with open(path, 'r') as f:
        return json.load(f)

def get_all_providers():
    """Returns a list of available JSON policies."""
    if not POLICY_DIR.exists():
        os.makedirs(POLICY_DIR)
    return [f.name for f in POLICY_DIR.glob("*.json")]

def format_policy_for_ai(policy_data: dict):
    """Converts the JSON data into a clean string for the Groq Prompt."""
    return f"""
    INSURER: {policy_data['provider_name']}
    RULES:
    - Room Limit: {policy_data['limits']['room_rent_limit']}
    - ICU Limit: {policy_data['limits']['icu_limit']}
    - Exclusions: {', '.join(policy_data['exclusions'])}
    - Fraud Thresholds: {json.dumps(policy_data['fraud_checks'])}
    """

def generate_ui_markdown(policy_data: dict) -> str:
    """Generates a human-readable Markdown summary from JSON policy data."""
    if not policy_data:
        return "No policy data available."
    
    # Use .get() with an empty dict fallback to prevent KeyErrors
    limits = policy_data.get("limits", {})
    exclusions = policy_data.get("exclusions", [])
    fraud = policy_data.get("fraud_checks", {})

    md = f"## {policy_data.get('provider_name', 'Unknown Provider')}\n"
    md += f"### Plan: {policy_data.get('plan_name', 'Standard')}\n\n"
    
    md += "#### 💰 Coverage Limits\n"
    if not limits:
        md += "- No specific limits defined.\n"
    else:
        for key, value in limits.items():
            clean_key = key.replace('_', ' ').title()
            if isinstance(value, (int, float)):
                md += f"- **{clean_key}:** ₹{value:,}\n"
            else:
                md += f"- **{clean_key}:** {value}\n"
    
    md += "\n#### 🚫 Key Exclusions\n"
    if not exclusions:
        md += "- Refer to base policy exclusions.\n"
    else:
        for item in exclusions:
            md += f"- {item}\n"
            
    return md

def format_policy_for_ai(policy_data: dict) -> str:
    """Converts the JSON policy data into a clean string for the Groq Prompt."""
    if not policy_data:
        return "Use generalized insurance baseline rules."
    
    # Using json.dumps makes it very easy for the AI to read the whole policy
    import json
    return f"CURRENT_POLICY_RULES: {json.dumps(policy_data)}"