import { useEffect, useState } from 'react';
// import { Clock, FileText } from 'lucide-react';
import { getAuditHistory, HistoryRecord } from '../api/services';
import { Clock, FileText, AlertCircle, Check, Activity } from 'lucide-react';
const History = () => {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getAuditHistory();
        setRecords(data);
      } catch (err) {
        setError('Failed to load audit history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getVerdictColor = (verdict: string) => {
    const lower = verdict.toLowerCase();
    if (lower.includes('approve') || lower.includes('valid')) return 'text-green-400 bg-green-400/20 border-green-400/30';
    if (lower.includes('reject') || lower.includes('invalid')) return 'text-red-400 bg-red-400/20 border-red-400/30';
    return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score < 70) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal/30 border-t-teal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-sora font-bold text-white mb-2">Audit History</h1>
          <p className="text-white/60">View all your previous medical bill audits</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        
        {/* NEW: Analytics Metric Cards */}
        {!loading && !error && records.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Total Audits</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-bold text-white">{records.length}</h3>
                <div className="p-2 bg-teal/10 rounded-lg">
                  <FileText className="text-teal w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Avg. Risk Score</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-bold text-yellow-400">
                  {Math.round(records.reduce((acc, r) => acc + r.risk_score, 0) / records.length)}%
                </h3>
                <div className="p-2 bg-yellow-400/10 rounded-lg">
                  <AlertCircle className="text-yellow-400 w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Approval Rate</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-bold text-green-400">
                  {Math.round((records.filter(r => r.verdict.toLowerCase().includes('eligible')).length / records.length) * 100)}%
                </h3>
                <div className="p-2 bg-green-400/10 rounded-lg">
                  <Check className="text-green-400 w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Critical Risks</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-bold text-red-400">
                  {records.filter(r => r.risk_score > 70).length}
                </h3>
                <div className="p-2 bg-red-400/10 rounded-lg">
                  <AlertCircle className="text-red-400 w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* --- ADD THIS: Risk Trends & Data Volume Check --- */}
        {!loading && !error && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-teal font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={18} /> Claim Risk Distribution
            </h3>

            {records.length === 0 ? (
              /* Empty State for Graph */
              <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/2">
                <p className="text-white/20 text-sm italic">No data points yet.</p>
                <p className="text-white/10 text-[10px] uppercase mt-1 tracking-tighter">Perform an audit to populate trends</p>
              </div>
            ) : (
              /* The Graph with Number conversion for height */
              <div className="flex items-end gap-3 h-40 px-2">
                {records.slice(0, 15).reverse().map((record, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-teal text-navy text-[10px] font-bold py-1 px-2 rounded shadow-xl z-20 whitespace-nowrap">
                      Risk: {record.risk_score}%
                    </div>
            
                    {/* The Bar */}
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 group-hover:brightness-125 group-hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] ${
                      Number(record.risk_score) > 70 ? 'bg-red-500/50' : 'bg-teal/50'
                    }`}
                    style={{ 
                      // Force number conversion and provide a 5% min-height so it's always visible
                      height: `${Math.max(Number(record.risk_score), 5)}%` 
                    }}
                  ></div>
            
                  {/* X-Axis Label */}
                  <span className="text-[8px] text-white/20 mt-3 rotate-45 origin-left truncate w-8 font-mono">
                    {record.insurer_name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
     

        {records.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
            <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Audit Records</h3>
            <p className="text-white/60 mb-6">
              You haven't performed any audits yet. Start your first audit to see records here.
            </p>
            <a
              href="/audit"
              className="inline-block bg-teal hover:bg-teal/90 text-navy px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Start Audit
            </a>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/60 font-medium py-4 px-6">Filename</th>
                    <th className="text-left text-white/60 font-medium py-4 px-6">Insurer</th>
                    <th className="text-left text-white/60 font-medium py-4 px-6">Verdict</th>
                    <th className="text-left text-white/60 font-medium py-4 px-6">Risk Score</th>
                    <th className="text-left text-white/60 font-medium py-4 px-6">Timestamp</th>
                    <th className="text-left text-white/60 font-medium py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-teal mr-2" />
                          <span className="text-white font-medium">{record.filename}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white">{record.insurer_name}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium border ${getVerdictColor(record.verdict)}`}
                        >
                          {record.verdict}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskScoreColor(record.risk_score)}`}
                        >
                          {record.risk_score}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-white/70">
                          <Clock className="w-4 h-4 mr-2" />
                          {formatTimestamp(record.timestamp)}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => window.open(`http://localhost:8000/audit/download/${record.id}`, '_blank')}
                          className="text-teal hover:text-teal/80 font-medium text-sm transition-colors"
                        >
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
