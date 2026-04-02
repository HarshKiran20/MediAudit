import { useState, useRef, useEffect } from 'react';
import { Upload, Check, AlertCircle, FileText, X, Brain, Zap, Search, Activity, ArrowRight } from 'lucide-react';
import {
  uploadBill,
  getPolicies,
  crossCheckBill,
  Policy,
  AnalysisRow,
} from '../api/services';

const Audit = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [filename, setFilename] = useState('');
  const [auditId, setAuditId] = useState<number | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [insurerName, setInsurerName] = useState('');
  const [verdict, setVerdict] = useState('');
  const [analysisRows, setAnalysisRows] = useState<AnalysisRow[]>([]);
  const [eligibilitySummary, setEligibilitySummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(''); // NEW: Real-time feedback
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const data = await getPolicies();
        const formatted = data.map((name: string) => ({
          id: name,
          name: name.replace('_', ' ').toUpperCase(),
          content: '' 
        }));
        setPolicies(formatted);
      } catch (err) {
        console.error("Policy fetch error:", err);
      }
    };
    fetchPolicies();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setStatusMessage("🔍 Initializing OCR Engine...");

    try {
      setTimeout(() => setStatusMessage("📑 Extracting clinical data..."), 1200);
      const response = await uploadBill(file);
      setExtractedText(response.extracted_text);
      setFilename(response.filename);
      
      if (response.detected_insurer) {
        const matching = policies.find(p => 
          p.id.includes(response.detected_insurer.toLowerCase().replace(' ', '_'))
        );
        if (matching) setSelectedPolicy(matching.id);
      }
      setCurrentStep(2);
    } catch (err) {
      setError('OCR processing failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCrossCheck = async () => {
    if (!selectedPolicy || !insurerName) {
      setError('Please select a policy and insurer.');
      return;
    }
    setLoading(true);
    setError('');
    setStatusMessage("🧠 Groq AI comparing bill with policy...");

    try {
      setTimeout(() => setStatusMessage("⚖️ Calculating risk scores..."), 1500);
      const response = await crossCheckBill({
        bill_text: extractedText,
        policy_name: selectedPolicy,
        filename,
        insurer_name: insurerName,
      });

      if (response.id) setAuditId(response.id);
      setVerdict(response.analysis.eligibility.verdict);
      setAnalysisRows(response.analysis.rows);
      setEligibilitySummary(response.analysis.eligibility.summary);
      setCurrentStep(3);
    } catch (err) {
      setError('Audit failed.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (v: string) => {
    const low = v.toLowerCase();
    if (low.includes('eligible') && !low.includes('not')) return 'text-green-400 bg-green-400/20 border-green-400/30';
    return low.includes('not') ? 'text-red-400 bg-red-400/20 border-red-400/30' : 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] py-12 px-4 text-white font-sora">
      <div className="max-w-5xl mx-auto">
        
        {/* Enhanced Progress Steps */}
<div className="mb-12 max-w-2xl mx-auto">
  <div className="flex items-center justify-between relative">
    {/* Background connecting line */}
    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>
    
    {[
      { id: 1, label: 'Upload Bill' },
      { id: 2, label: 'Select Policy' },
      { id: 3, label: 'View Results' }
    ].map((step) => (
      <div key={step.id} className="relative z-10 flex flex-col items-center">
        {/* Step Number Circle */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 border-2 ${
          currentStep >= step.id 
            ? 'bg-teal border-teal text-navy shadow-[0_0_20px_rgba(0,212,170,0.4)]' 
            : 'bg-[#0a0f1e] border-white/10 text-white/40'
        }`}>
          {currentStep > step.id ? <Check size={20} /> : step.id}
        </div>
        
        {/* Step Label */}
        <span className={`absolute -bottom-8 whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
          currentStep >= step.id ? 'text-teal' : 'text-white/20'
        }`}>
          {step.label}
        </span>

        {/* Progress Fill Line (Only for completed steps) */}
        {step.id < 3 && currentStep > step.id && (
          <div className="absolute top-1/2 left-full w-full h-0.5 bg-teal -translate-y-1/2 -z-10" 
               style={{ width: 'calc(100% * 2.5)' }}></div>
        )}
      </div>
    ))}
  </div>
</div>

        {error && <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 flex items-center animate-shake"><AlertCircle className="mr-3"/>{error}</div>}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-10 shadow-2xl">
          
          {/* STEP 1: UPLOAD & VISUAL PREVIEW */}
          {currentStep === 1 && !loading && (
            <div className="text-center animate-fade-in">
              <div 
                className={`border-2 border-dashed rounded-3xl p-16 transition-all duration-300 ${dragActive ? 'border-teal bg-teal/10' : 'border-white/10 hover:border-teal/40'}`} 
                onDragOver={handleDrag} onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                {!file ? (
                  <>
                    <div className="bg-teal/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Upload className="text-teal" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Ready to get started?</h3>
                    <p className="text-white/40 mb-8 max-w-sm mx-auto">Upload your medical bill and experience the power of AI-driven claim auditing.</p>
                    <button onClick={() => fileInputRef.current?.click()} className="bg-teal hover:bg-teal/90 text-navy px-10 py-4 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-xl shadow-teal/20">Begin Your Audit <ArrowRight className="inline ml-2" size={20} /></button>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* VISUAL PREVIEW BOX */}
                    <div className="relative group mb-6">
                       {file.type.startsWith('image/') ? (
                         <img src={URL.createObjectURL(file)} alt="Preview" className="w-40 h-52 object-cover rounded-2xl border-2 border-teal shadow-2xl" />
                       ) : (
                         <div className="w-40 h-52 bg-teal/10 flex items-center justify-center rounded-2xl border-2 border-teal">
                           <FileText size={60} className="text-teal" />
                         </div>
                       )}
                       <button onClick={() => setFile(null)} className="absolute -top-3 -right-3 bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg">
                          <X size={18} />
                       </button>
                    </div>
                    <p className="text-xl font-bold text-teal">{file.name}</p>
                    <p className="text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for OCR</p>
                  </div>
                )}
              </div>
              {file && <button onClick={handleUpload} className="w-full mt-10 bg-teal hover:bg-teal/90 text-navy py-5 rounded-2xl font-bold text-xl shadow-2xl flex items-center justify-center gap-3 group">Extract Medical Data <Zap className="group-hover:fill-current" size={24} /></button>}
            </div>
          )}

          {/* AI STATUS LOADER (GLOW PULSE) */}
          {loading && (
            <div className="text-center py-20">
               <div className="relative w-32 h-32 mx-auto mb-10">
                  <div className="absolute inset-0 border-4 border-teal/10 rounded-full animate-glow-pulse"></div>
                  <div className="absolute inset-0 border-4 border-t-teal border-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="text-teal animate-pulse" size={48} />
                  </div>
               </div>
               <h3 className="text-3xl font-bold mb-3 text-teal">AI Processing</h3>
               <p className="text-white/60 text-lg animate-pulse">{statusMessage}</p>
            </div>
          )}

          {/* STEP 2: AUDIT PARAMETERS */}
          {currentStep === 2 && !loading && (
            <div className="space-y-8 animate-fade-in">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <label className="text-teal font-bold text-xs uppercase tracking-widest mb-4 block">Extracted Bill Content</label>
                <textarea value={extractedText} readOnly className="w-full h-48 bg-transparent text-white/70 text-sm leading-relaxed scrollbar-hide focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-white/40 text-xs font-bold uppercase mb-3 block">Insurance Provider</label>
                    <select value={selectedPolicy} onChange={(e) => setSelectedPolicy(e.target.value)} className="w-full bg-[#161b2c] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-teal/50">
                      <option value="">Select Policy Plan...</option>
                      {policies.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-white/40 text-xs font-bold uppercase mb-3 block">Policy Name</label>
                    <input type="text" value={insurerName} onChange={(e) => setInsurerName(e.target.value)} placeholder="e.g. Care Supreme" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder-white/20 outline-none focus:border-teal/50" />
                 </div>
              </div>
              <div className="flex gap-6 pt-6">
                <button onClick={() => setCurrentStep(1)} className="flex-1 border border-white/10 py-5 rounded-2xl hover:bg-white/5 transition-colors font-bold text-lg text-white/60">Back</button>
                <button onClick={handleCrossCheck} className="flex-1 bg-teal hover:bg-teal/90 text-navy py-5 rounded-2xl font-bold text-xl shadow-xl">Start AI Audit</button>
              </div>
            </div>
          )}

          {/* STEP 3: FINAL AUDIT RESULTS */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center p-8 bg-teal/5 rounded-[24px] border border-teal/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal/10 rounded-xl"><Activity className="text-teal" /></div>
                  <div>
                     <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Final Verdict</p>
                     <h3 className="text-3xl font-bold text-white">Audit Complete</h3>
                  </div>
                </div>
                <span className={`px-8 py-3 rounded-2xl font-bold text-lg border ${getVerdictColor(verdict)}`}>{verdict}</span>
              </div>
              
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-teal text-xs font-bold uppercase tracking-widest">
                    <tr>
                      <th className="p-5">Clinical Item</th><th className="p-5">Claimed</th><th className="p-5">Approved</th><th className="p-5 text-center">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-white/2">
                    {analysisRows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-5 text-white font-medium">{row.item}</td>
                        <td className="p-5 text-white/60">₹{row.claimed}</td>
                        <td className="p-5 text-white/60">₹{row.approved}</td>
                        <td className="p-5 text-center">
                           <span className={`px-4 py-1.5 rounded-xl text-xs font-bold ${row.risk_score < 30 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                             {row.risk_score}% Risk
                           </span>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`px-4 py-1.5 rounded-xl text-xs font-bold ${
                            row.risk_score > 70 
                            ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/50' 
                            : 'bg-green-500/20 text-green-400'
                          }`}>
                            {row.risk_score}% {row.risk_score > 70 ? 'CRITICAL' : 'Risk'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-8 bg-white/2 border border-white/10 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <Search size={22} className="text-teal" />
                  <h4 className="text-teal font-bold text-sm uppercase tracking-widest">Auditor's Remarks</h4>
                </div>
                <p className="text-white/70 text-lg leading-relaxed font-light italic">"{eligibilitySummary}"</p>
              </div>

              <div className="flex gap-6">
                <button onClick={() => setCurrentStep(1)} className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-5 rounded-2xl font-bold text-lg transition-all">New Audit</button>
                <button onClick={() => window.open(`http://localhost:8000/audit/download/${auditId}`, '_blank')} className="flex-1 bg-teal hover:bg-teal/90 text-navy py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-teal/30">Download PDF Report</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Audit;