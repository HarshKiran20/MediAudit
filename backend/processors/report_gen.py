from fpdf import FPDF
from datetime import datetime
import io

class AuditReport(FPDF):
    def header(self):
        # Logo placeholder (optional)
        self.set_font('helvetica', 'B', 20)
        self.set_text_color(0, 128, 128) # Teal color
        self.cell(0, 10, 'MediAudit Analysis Report', ln=True, align='C')
        self.ln(5)
        self.set_draw_color(0, 128, 128)
        self.line(10, 25, 200, 25)
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()} | Generated on {datetime.now().strftime("%Y-%m-%d %H:%M")}', align='C')

def generate_pdf(data):
    # --- NEW: UNICODE CLEANUP LOGIC ---
    # This replaces the Rupee symbol and other problematic characters
    def clean_text(text):
        if not text: return ""
        return str(text).replace("₹", "Rs.").replace("–", "-").replace("\u20b9", "Rs.")
    
    pdf = AuditReport()
    pdf.add_page()
    
    # Apply cleanup to summary fields
    insurer = clean_text(data['insurer_name'])
    filename = clean_text(data['filename'])
    verdict = clean_text(data['verdict'])
    eligibility = clean_text(data['eligibility_summary'])
    
    # 1. Summary Section
    pdf.set_font('helvetica', 'B', 14)
    pdf.cell(0, 10, 'Audit Summary', ln=True)
    pdf.set_font('helvetica', '', 11)
    pdf.multi_cell(0, 8, f"Insurer: {data['insurer_name']}\nFile: {data['filename']}\nVerdict: {data['verdict'].upper()}")
    pdf.ln(5)

    # 2. Detailed Findings Table
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(0, 10, 'Line Item Analysis', ln=True)
    
    # Table Header
    pdf.set_fill_color(240, 240, 240)
    pdf.set_font('helvetica', 'B', 10)
    pdf.cell(60, 10, 'Item', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Claimed', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Approved', 1, 0, 'C', True)
    pdf.cell(20, 10, 'Risk', 1, 0, 'C', True)
    pdf.cell(50, 10, 'Remarks', 1, 1, 'C', True)

    # Table Rows
    pdf.set_font('helvetica', '', 9)
    for row in data['rows']:
        # Check for multiple possible AI naming variations
        item_name = clean_text(row.get('item') or row.get('description') or row.get('particulars') or 'Service/Item')
        claimed = clean_text(row.get('claimed') or row.get('amount') or row.get('billed') or '0')
        approved = clean_text(row.get('approved') or row.get('eligible_amount') or '0')
        risk = clean_text(row.get('risk_score') or '5')
        remarks = clean_text(row.get('remarks') or 'Verified')

        pdf.cell(60, 10, item_name, 1)
        pdf.cell(30, 10, claimed, 1)
        pdf.cell(30, 10, approved, 1)
        pdf.cell(20, 10, risk, 1, 0, 'C')
        pdf.cell(50, 10, remarks, 1, 1)

    # 3. AI Eligibility Summary
    pdf.ln(10)
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(0, 10, 'AI Eligibility Explanation', ln=True)
    pdf.set_font('helvetica', '', 10)
    pdf.multi_cell(0, 6, eligibility) # Using the cleaned version here

    return bytes(pdf.output())