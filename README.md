# 🏥 MediAudit: AI-Powered Medical Claim Verifier

![GitHub repo size](https://img.shields.io/github/repo-size/HarshKiran20/MediAudit?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/HarshKiran20/MediAudit?style=for-the-badge&color=teal)
![License](https://img.shields.io/github/license/HarshKiran20/MediAudit?style=for-the-badge)

**MediAudit** is a high-performance, end-to-end AI solution that transforms how medical claims are audited. Leveraging a decoupled cloud architecture and cutting-edge LLMs, it automates discrepancy detection, quantifies risk through intelligent scoring, and delivers detailed, audit-ready reports with precision and speed.
🚀 **[Live Demo (Frontend)](https://medi-audit.vercel.app)** | ⚙️ **[Backend API](https://mediaudit-api.onrender.com)**

---

## 🌟 Key Features

- **🔍 Intelligent OCR:** Extracts structured clinical data from unstructured medical bill images/PDFs.
- **🧠 AI Policy Cross-Check:** Uses Groq-accelerated Llama-3 to compare bill line-items against insurance coverage rules.
- **📊 Risk Scoring:** Automatically identifies high-risk claims with percentage-based fraud detection.
- **📄 PDF Report Generation:** Generates downloadable, professional audit summaries for patients and providers.
- **📱 Responsive UI:** Dark-themed, modern dashboard built for seamless user experience.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **Icons:** Lucide-React
- **Deployment:** Vercel

### Backend
- **Framework:** FastAPI (Python)
- **Inference:** Groq Cloud (LLM API)
- **Database:** PostgreSQL
- **Deployment:** Render

---

## 🏗️ Architecture
The system follows a **Distributed Decoupled Architecture**:
1. **Client (React)** handles file uploads and state management.
2. **Server (FastAPI)** manages business logic and OCR processing.
3. **AI Layer (Groq)** performs semantic reasoning for policy compliance.
4. **Storage (PostgreSQL)** persists audit history and metadata.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API Key
- PostgreSQL Database URL

### 📂 Directory Structure

```text
MediAudit/
├── backend/                # FastAPI Application (Python)
│   ├── main.py             # Entry point: API routes & CORS setup
│   ├── models.py           # SQLAlchemy Database schemas
│   ├── database.py         # PostgreSQL connection logic
│   ├── schemas.py          # Pydantic data validation
│   ├── processors/         # Core AI & Logic Engines
│   │   ├── ocr_engine.py   # Text extraction from images/PDFs
│   │   └── report_gen.py   # PDF generation logic (FPDF)
│   ├── policies/           # Knowledge base for insurance rules
│   ├── .env                # Secrets (GROQ_API_KEY, DATABASE_URL)
│   └── requirements.txt    # Backend dependencies
├── frontend/               # React + Vite Application (TypeScript)
│   ├── src/
│   │   ├── api/            # Axios services & API client
│   │   ├── components/     # Reusable UI (Navbar, Progress Bar)
│   │   ├── pages/          # Main views (Audit.tsx, History.tsx)
│   │   └── assets/         # Global styles & icons
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Vite build configuration
├── data/                   # Sample medical bills for testing
├── screenshots/            # UI previews for documentation
└── README.md               # Project documentation

```
### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/HarshKiran20/MediAudit.git](https://github.com/HarshKiran20/MediAudit.git)
   cd MediAudit

2. **Setup Backend**
   ```
    # Navigate to backend directory
   cd backend

   # Create a virtual environment (Optional but recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Create a .env file and add your credentials
   # GROQ_API_KEY=your_key_here
   # DATABASE_URL=your_postgres_url_here

   # Start the FastAPI server
   uvicorn main:app --reload

3. ** Setup Frontend **
```
   cd ../frontend
   npm install
   npm run dev
```

Screenshots:

1.Homepage
<img width="1905" height="993" alt="Screenshot 2026-04-04 000825" src="https://github.com/user-attachments/assets/ce99ac78-44a5-437d-888b-e09f7bdce31f" />

2. Results
<img width="1903" height="966" alt="Screenshot 2026-04-04 001156" src="https://github.com/user-attachments/assets/8d6f06b5-8c55-4999-94e4-82e18cd7d237" />
