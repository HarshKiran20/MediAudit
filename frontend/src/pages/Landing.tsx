import { useState } from 'react';
import { ArrowRight, Zap, Shield, FileSearch, Github, Linkedin, Mail, Cpu, Database, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';


const Home = () => {
  const [formStatus, setFormStatus] = useState('');

  const handleFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('Sending...');
    
    // Simulating an API call to your backend or an email service
    setTimeout(() => {
      setFormStatus('✅ Feedback Sent!');
      setTimeout(() => setFormStatus(''), 3000); // Reset after 3 seconds
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-navy text-white font-sora">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,212,170,0.05)_0%,transparent_70%)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-bold mb-6 animate-fade-in">
            <Zap size={14} /> AI-POWERED MEDICAL AUDITING v1.0
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
            Medi<span className="text-teal">Audit</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-white/60 text-lg mb-10 leading-relaxed">
            Stop overpaying on medical bills. Our Agentic AI analyzes your claims against 
            insurance policies in seconds with 99% accuracy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/audit" 
              className="group bg-teal hover:bg-teal/90 text-navy px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,212,170,0.3)]"
            >
              Start Your Audit <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* TECH STACK BADGES */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="flex items-center gap-2 font-mono text-sm"><Layout size={18}/> React/Vite</div>
             <div className="flex items-center gap-2 font-mono text-sm"><Cpu size={18}/> Llama 3.3 (Groq)</div>
             <div className="flex items-center gap-2 font-mono text-sm"><Database size={18}/> PostgreSQL</div>
             <div className="flex items-center gap-2 font-mono text-sm"><Shield size={18}/> FastAPI</div>
          </div>
        </div>
      </section>

      {/* 2. FEATURE CARDS */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <FileSearch className="text-teal" />, title: "OCR Extraction", desc: "Advanced Tesseract engine extracts precise clinical data from blurry hospital bills." },
            { icon: <Shield className="text-teal" />, title: "Policy Cross-Check", desc: "Llama 3.3 identifies hidden sub-limits and co-pay clauses your insurer missed." },
            { icon: <Zap className="text-teal" />, title: "Instant PDF Report", desc: "Download a certified medical audit report with a quantified risk score immediately." }
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-teal/30 transition-all group hover:-translate-y-2">
              <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. UPDATED PROFESSIONAL FOOTER */}
      <footer className="border-t border-white/10 bg-black/20 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16">
          
          {/* Developer Bio */}
          <div className="space-y-4">
            <h4 className="text-teal font-bold uppercase tracking-widest text-xs">The Developer</h4>
            <h3 className="text-2xl font-bold text-white">Harsh Kiran</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Machine Learning Engineer <br/>
              B.Tech CSE Specialization in (Machine Learning) from <br/>
              <span className="text-white/60">Gautam Buddha University, Greater Noida.</span>
            </p>
            <div className="flex gap-4 pt-2">
              {/* UPDATED: Add your actual profile links here */}
              <a href="https://linkedin.com/in/YOUR_PROFILE" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-teal/20 hover:text-teal transition-all">
                <Linkedin size={18}/>
              </a>
              <a href="https://github.com/YOUR_GITHUB" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-lg hover:bg-teal/20 hover:text-teal transition-all">
                <Github size={18}/>
              </a>
              <a href="mailto:hky20042003@gmail.com" className="p-2 bg-white/5 rounded-lg hover:bg-teal/20 hover:text-teal transition-all">         
                <Mail size={18}/>
              </a>
            </div>
          </div>

          {/* Project Abstract */}
          <div className="space-y-4">
             <h4 className="text-teal font-bold uppercase tracking-widest text-xs">Project Vision</h4>
             <p className="text-white/40 text-sm leading-relaxed">
               MediAudit was developed as a Capstone project to solve the lack of transparency in Indian medical billing. 
               By using Generative AI, we empower patients with the same tools used by insurance adjusters.
             </p>
          </div>

          {/* Contact Form */}
          <div className="space-y-4">
            <h4 className="text-teal font-bold uppercase tracking-widest text-xs">Inquiry / Feedback</h4>
            {/* UPDATED: Added onSubmit handler */}
            <form action="https://formspree.io/f/mzdkvrnv" method="POST" onSubmit={handleFeedback} className='space-y-2'>
              <input required type="text" placeholder="Your Name" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm focus:border-teal/50 outline-none text-white" />
              <textarea required placeholder="Message" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-sm h-20 focus:border-teal/50 outline-none text-white"></textarea>
              
              <button 
                type="submit" 
                disabled={formStatus !== ''}
                className="w-full bg-teal text-navy font-bold py-3 rounded-xl hover:bg-teal/90 transition-all disabled:opacity-50"
              >
                {formStatus || 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-white/20 text-[10px] uppercase tracking-[0.2em]">
            Developed by Harsh Kiran |
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;