import React, { useState, useMemo } from 'react';
import { Shield, Zap, Layers, ArrowRight, FileText, Lock, Hammer, TrendingUp, X, Loader2, Settings, BarChart3, Target, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getConsultantResponse } from '../services/geminiService';
import ReactMarkdown, { Components } from 'react-markdown';

const markdownComponents: Components = {
  img: ({node, ...props}) => <img {...props} src={props.src || undefined} />
};

export const StrategyOS = () => {
  const [selectedAction, setSelectedAction] = useState<{ title: string, desc: string } | null>(null);
  const [actionResult, setActionResult] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dynamic Parameters
  const [stacksCount, setStacksCount] = useState(76);
  const [playbookReadiness, setPlaybookReadiness] = useState(65);
  const [trustLevel, setTrustLevel] = useState(40);
  const [stealthLevel, setStealthLevel] = useState(30);
  const [scalingLevel, setScalingLevel] = useState(20);

  // Calculate Strategic Score
  const strategicScore = useMemo(() => {
    const base = (stacksCount / 100) * 20;
    const playbook = (playbookReadiness / 100) * 25;
    const trust = (trustLevel / 100) * 20;
    const stealth = (stealthLevel / 100) * 15;
    const scaling = (scalingLevel / 100) * 20;
    return Math.round(base + playbook + trust + stealth + scaling);
  }, [stacksCount, playbookReadiness, trustLevel, stealthLevel, scalingLevel]);

  const handleActionClick = async (title: string, desc: string) => {
    setSelectedAction({ title, desc });
    setIsProcessing(true);
    setActionResult('');
    
    try {
      const prompt = `I want to focus on the "${title}" phase of my Project OS: ${desc}. 
      Current System Stats: Stacks: ${stacksCount}, Playbook: ${playbookReadiness}%, Trust: ${trustLevel}%, Stealth: ${stealthLevel}%, Scaling: ${scalingLevel}%.
      Strategic Score: ${strategicScore}/100.
      Please provide a detailed, actionable, and structured step-by-step guide on how to execute this phase effectively given these current parameters. 
      Include key milestones, potential risks, and required resources. Respond in Thai with a professional and strategic tone.`;
      const stream = getConsultantResponse(prompt);
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setActionResult(fullText);
      }
    } catch (error) {
      console.error("Error getting strategy response:", error);
      setActionResult("ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setSelectedAction(null);
    setActionResult('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-4 md:p-8 font-sans relative overflow-x-hidden">
      {/* Background Ambient Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Section */}
      <header className="mb-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="w-20 h-1 bg-gold-500 mb-6" />
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-zinc-600 bg-clip-text text-transparent uppercase">
              PROJECT <br />
              <span className="text-gold-500">O.S.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed font-light border-l border-white/10 pl-6">
              การสร้างระบบการทำงานที่แข็งแกร่งสำหรับโครงการของคุณ เปลี่ยนจากการแก้ปัญหาแบบตั้งรับไปสู่ระบบการทำงานเชิงรุกที่สามารถนำกลับมาใช้ใหม่ได้ ซึ่งเป็นระบบที่ประกอบด้วยหลายส่วน
            </p>
          </div>

          {/* Score Gauge */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gold-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-zinc-900/80 border border-white/10 rounded-full w-48 h-48 flex flex-col items-center justify-center backdrop-blur-xl">
              <span className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold mb-1">Strategic Score</span>
              <motion.span 
                key={strategicScore}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl font-black text-white font-mono"
              >
                {strategicScore}
              </motion.span>
              <div className="w-24 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${strategicScore}%` }}
                  className="h-full bg-gold-500"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Configuration Console */}
      <section className="mb-16 grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        <div className="lg:col-span-1 bg-zinc-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-8 text-gold-500">
            <Settings className="w-5 h-5" />
            <h2 className="text-sm uppercase tracking-widest font-bold">System Configuration</h2>
          </div>
          
          <div className="space-y-8">
            {/* Stacks Slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-zinc-500">Stacks Cataloged</span>
                <span className="text-white">{stacksCount}</span>
              </div>
              <input 
                type="range" min="0" max="100" value={stacksCount} 
                onChange={(e) => setStacksCount(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>

            {/* Playbook Slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-zinc-500">Playbook Readiness</span>
                <span className="text-white">{playbookReadiness}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={playbookReadiness} 
                onChange={(e) => setPlaybookReadiness(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>

            {/* Trust Slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-zinc-500">Trust Engine</span>
                <span className="text-white">{trustLevel}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={trustLevel} 
                onChange={(e) => setTrustLevel(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>

            {/* Stealth Slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-zinc-500">Stealth Strategy</span>
                <span className="text-white">{stealthLevel}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={stealthLevel} 
                onChange={(e) => setStealthLevel(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>

            {/* Scaling Slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span className="text-zinc-500">Modular Scaling</span>
                <span className="text-white">{scalingLevel}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={scalingLevel} 
                onChange={(e) => setScalingLevel(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Core Modules Display */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Module: The Playbook */}
          <div 
            onClick={() => handleActionClick('คู่มือการเล่น (The Playbook)', 'การตัดสินใจด้านการออกแบบ กฎหมาย และการเงิน ไม่ใช่การตัดสินใจแบบเฉพาะหน้าอีกต่อไป แต่จะถูกดำเนินการผ่านระบบที่สร้างไว้ล่วงหน้า')}
            className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 bg-gold-500/5 rounded-full blur-3xl group-hover:bg-gold-500/10 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gold-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-zinc-500">MODULE 01</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">คู่มือการเล่น (The Playbook)</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                การตัดสินใจด้านการออกแบบ กฎหมาย และการเงิน ไม่ใช่การตัดสินใจแบบเฉพาะหน้าอีกต่อไป แต่จะถูกดำเนินการผ่านระบบที่สร้างไว้ล่วงหน้า
              </p>
              <div className="flex items-center gap-2 text-gold-500 text-xs font-bold uppercase tracking-widest">
                <span>View Stacks</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Module: The Trust Engine */}
          <div 
            onClick={() => handleActionClick('เครื่องมือความไว้วางใจ (Trust Engine)', 'แทนที่การโน้มน้าวใจด้วย "หลักฐาน" ชุดเอกสารสำหรับธนาคาร (Bank Packs), ด่านตรวจสอบคุณภาพ (QC Gates) และบันไดราคา (Pricing Ladders)')}
            className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-zinc-500">MODULE 02</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">เครื่องมือความไว้วางใจ (Trust Engine)</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                แทนที่การโน้มน้าวใจด้วย "หลักฐาน" ชุดเอกสารสำหรับธนาคาร (Bank Packs), ด่านตรวจสอบคุณภาพ (QC Gates) และบันไดราคา (Pricing Ladders) ช่วยลดอุปสรรคในการขายและการเจรจาทางกฎหมาย
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-zinc-500 border border-white/5">Bank Packs</span>
                <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-zinc-500 border border-white/5">QC Gates</span>
                <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] text-zinc-500 border border-white/5">Pricing Ladders</span>
              </div>
            </div>
          </div>

          {/* Module: Stealth Strategy */}
          <div 
            onClick={() => handleActionClick('กลยุทธ์การลอบเร้น (Stealth Strategy)', 'LLA (Legal-Logic Modality) และวิธีการขายตรงถึงผู้ซื้อ (Direct-to-Buyer) ช่วยหลีกเลี่ยงผู้ควบคุมดูแลที่มีค่าใช้จ่ายสูง')}
            className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-zinc-500">MODULE 03</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">กลยุทธ์การลอบเร้น (Stealth Strategy)</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                LLA (Legal-Logic Modality) และวิธีการขายตรงถึงผู้ซื้อ (Direct-to-Buyer) ช่วยหลีกเลี่ยงผู้ควบคุมดูแลที่มีค่าใช้จ่ายสูง โดยใช้สถาปัตยกรรมข้อมูลที่เหนือกว่า
              </p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[8px] font-bold">LLA</div>
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[8px] font-bold">D2B</div>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Narrative Control</span>
              </div>
            </div>
          </div>

          {/* Module: Modular Scaling */}
          <div 
            onClick={() => handleActionClick('การปรับขนาดแบบโมดูลาร์ (Modular Scaling)', 'ไม่ใช่แค่การสร้างบ้าน แต่เป็นการสร้างเครื่องจักรที่สร้างบ้านได้ แผนงานแบบเป็นขั้นตอนและคู่มือการจำลองแบบ')}
            className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2rem] hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-12 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-purple-500">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono text-zinc-500">MODULE 04</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">การปรับขนาดแบบโมดูลาร์ (Modular Scaling)</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                ไม่ใช่แค่การสร้างบ้าน แต่เป็นการสร้างเครื่องจักรที่สร้างบ้านได้ แผนงานแบบเป็นขั้นตอนและคู่มือการจำลองแบบ
              </p>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-zinc-300">Scalable Replication Playbook</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Plan Section */}
      <section className="relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <Target className="w-8 h-8 text-gold-500" />
          <h2 className="text-3xl font-bold text-white">ควรติดตั้ง "ระบบปฏิบัติการ" นี้ที่ไหนก่อน?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => handleActionClick('ดำเนินการ (Execute)', 'เริ่มต้น "แผนงานแบบแบ่งระยะ" สำหรับบ้านตัวอย่าง/โซนสีเหลือง')}
            className="group text-left p-8 rounded-3xl bg-zinc-900/50 hover:bg-gold-500 border border-white/10 transition-all duration-500"
          >
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:bg-black/20 group-hover:text-black transition-colors">
              <Hammer className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold mb-3 group-hover:text-black transition-colors">ดำเนินการ (Execute)</h4>
            <p className="text-sm text-zinc-500 group-hover:text-black/70 transition-colors">เริ่มต้น "แผนงานแบบแบ่งระยะ" สำหรับบ้านตัวอย่าง/โซนสีเหลือง</p>
          </button>

          <button 
            onClick={() => handleActionClick('นำเสนอ (Pitch)', 'จัดทำ "แผนธุรกิจระดับนักลงทุน" ให้เสร็จสมบูรณ์เพื่อขอรับเงินทุน')}
            className="group text-left p-8 rounded-3xl bg-zinc-900/50 hover:bg-gold-500 border border-white/10 transition-all duration-500"
          >
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:bg-black/20 group-hover:text-black transition-colors">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold mb-3 group-hover:text-black transition-colors">นำเสนอ (Pitch)</h4>
            <p className="text-sm text-zinc-500 group-hover:text-black/70 transition-colors">จัดทำ "แผนธุรกิจระดับนักลงทุน" ให้เสร็จสมบูรณ์เพื่อขอรับเงินทุน</p>
          </button>

          <button 
            onClick={() => handleActionClick('ปกป้อง (Protect)', 'เปิดใช้งาน "ชุดเครื่องมือช่วยเหลือทางกฎหมายฉุกเฉิน" เพื่อแก้ไขปัญหาข้อพิพาททางกฎหมาย')}
            className="group text-left p-8 rounded-3xl bg-zinc-900/50 hover:bg-gold-500 border border-white/10 transition-all duration-500"
          >
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:bg-black/20 group-hover:text-black transition-colors">
              <Lock className="w-7 h-7" />
            </div>
            <h4 className="text-xl font-bold mb-3 group-hover:text-black transition-colors">ปกป้อง (Protect)</h4>
            <p className="text-sm text-zinc-500 group-hover:text-black/70 transition-colors">เปิดใช้งาน "ชุดเครื่องมือช่วยเหลือทางกฎหมายฉุกเฉิน" เพื่อแก้ไขปัญหาข้อพิพาททางกฎหมาย</p>
          </button>
        </div>
      </section>

      {/* Action Modal */}
      <AnimatePresence>
        {selectedAction && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 md:p-12 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-[0_0_100px_rgba(201,141,58,0.1)]"
            >
              <button 
                onClick={closeModal}
                className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mb-12 pr-16">
                <div className="flex items-center gap-4 mb-4">
                  <div className="px-3 py-1 bg-gold-500/10 text-gold-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold-500/20">
                    Strategic Action
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">SCORE: {strategicScore}</div>
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">{selectedAction.title}</h3>
                <p className="text-zinc-400 text-lg font-light leading-relaxed">{selectedAction.desc}</p>
              </div>

              <div className="bg-black/40 rounded-[2rem] p-8 min-h-[400px] border border-white/5">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center h-full py-24 text-gold-500">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gold-500/20 blur-xl rounded-full animate-pulse" />
                      <Loader2 className="w-16 h-16 animate-spin relative z-10" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] animate-pulse">Analyzing Strategic Context...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-gold max-w-none prose-p:text-zinc-400 prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold prose-strong:text-gold-400">
                    <ReactMarkdown components={markdownComponents}>{actionResult}</ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="mt-12 flex justify-end">
                <button 
                  onClick={closeModal}
                  className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gold-500 transition-colors"
                >
                  Close Console
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Micro-details */}
      <footer className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 opacity-30 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
          <Cpu className="w-3 h-3" />
          <span>System Status: Operational</span>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest">
          © 2026 StrategyOS v4.2.0
        </div>
      </footer>
    </div>
  );
};
