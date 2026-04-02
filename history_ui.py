import streamlit as st
import pandas as pd
from Medi_Audit.backend.database import Session, AuditRecord
import json

def render_history_page():
    st.title("📊 Audit History & Analytics")
    st.caption("Complete record of all processed medical claims and fraud risk assessments.")

    # Create a database session
    session = Session()
    records = session.query(AuditRecord).order_by(AuditRecord.timestamp.desc()).all()
    session.close()

    if not records:
        st.info("No records found in the database. Run your first audit to see history!")
        return

    # Prepare data for the display table
    history_list = []
    for r in records:
        history_list.append({
            "ID": r.id,
            "Timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M"),
            "Hospital/Bill": r.filename,
            "Insurer": r.insurer,
            "Verdict": r.verdict,
            "Risk Score": f"{r.avg_risk_score:.1f}/100"
        })

    df = pd.DataFrame(history_list)

    # 1. Summary Metrics at the top
    c1, c2, c3 = st.columns(3)
    c1.metric("Total Audits", len(df))
    c2.metric("Avg. System Risk", f"{df['Risk Score'].str.replace('/100','').astype(float).mean():.1f}")
    c3.metric("Latest Verdict", df["Verdict"].iloc[0])

    st.divider()

    # 2. Search and Filter
    search = st.text_input("🔍 Search history by Bill Name or Insurer")
    if search:
        df = df[df['Hospital/Bill'].str.contains(search, case=False) | 
                df['Insurer'].str.contains(search, case=False)]

    # 3. The Main Data Table
    st.dataframe(df, use_container_width=True, hide_index=True)

    # 4. Detail View (Expander)
    st.subheader("📝 Detailed View")
    selected_id = st.selectbox("Select an Audit ID to see full breakdown", df["ID"].tolist())
    
    if selected_id:
        session = Session()
        record = session.query(AuditRecord).filter(AuditRecord.id == selected_id).first()
        session.close()
        
        with st.expander(f"View Full Data for Audit #{selected_id}", expanded=True):
            col_a, col_b = st.columns(2)
            col_a.markdown(f"**Extracted Text:**\n\n{record.extracted_text}")
            col_b.json(json.loads(record.full_json_result))