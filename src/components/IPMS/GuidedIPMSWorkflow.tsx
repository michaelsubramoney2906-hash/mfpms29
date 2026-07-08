import React, { useEffect, useRef, useState } from 'react';
import { 
  Lock, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Award, 
  Trophy, 
  Play, 
  X, 
  PartyPopper,
  Volume2,
  VolumeX,
  Compass
} from 'lucide-react';

// Define the 10 sequential steps in the IPMS pipeline (omitting 2nd & 3rd layer SDBIP)
export interface WorkflowStep {
  id: string;
  name: string;
  desc: string;
  rolesRequired?: string[];
  actionLabel?: string;
  moduleIcon?: string;
}

export const GUIDE_STEPS: WorkflowStep[] = [
  { 
    id: 'ipms-kpa', 
    name: 'IPMS KPA', 
    desc: 'Establish and weight Key Performance Areas (KPAs) exactly to 100% total sum.',
    actionLabel: 'Define Key Performance Areas'
  },
  { 
    id: 'jsc', 
    name: 'Job specific Competencies', 
    desc: 'Review and select core job specific professional and behavioral competency requirements.',
    actionLabel: 'Configure Job Competency Matrix'
  },
  { 
    id: 'ipms-kpi', 
    name: 'IPMS KPI', 
    desc: 'Detail strategic and operational Key Performance Indicators and quantitative targets.',
    actionLabel: 'Establish Performance Indicators'
  },
  { 
    id: 'pplan', 
    name: 'Performance Plan', 
    desc: 'Determine organizational timelines, strategic alignment objectives, and action plans.',
    actionLabel: 'Draft Multi-Layer Performance Plan'
  },
  { 
    id: 'pdp', 
    name: 'Personal Development Plans', 
    desc: 'Assess individual development gaps and map required training interventions.',
    actionLabel: 'Formulate Personal Development Plan (PDP)'
  },
  { 
    id: 'pa', 
    name: 'Performance Agreement', 
    desc: 'Harmonize terms, review timetables, annexures, and apply digital sign-offs.',
    actionLabel: 'Finalise Performance Agreement Contract'
  },
  { 
    id: 'ipms-evaluation', 
    name: 'Self Evaluation', 
    desc: 'Empower individual employees to grade deliverables and provide performance logs.',
    actionLabel: 'Initiate Self-Evaluation Assessment'
  },
  { 
    id: 'ipms-manager-review', 
    name: 'Manager Approval', 
    desc: 'Analyze, validate ratings, and collaborate on manager score adjustments.',
    actionLabel: 'Perform Line Manager Approval'
  },
  { 
    id: 'ipms-internal-audit', 
    name: 'Internal Audit Review', 
    desc: 'Verify legislative compliance, data validation, and issue formal audit opinions.',
    actionLabel: 'Publish Internal Audit Assessment'
  },
  { 
    id: 'ipms-reports', 
    name: 'Reports & Analytics', 
    desc: 'Compile comprehensive performance oversight directories, analytics, and printouts.',
    actionLabel: 'Access Analytics & Oversight Reports'
  }
];

interface GuidedIPMSWorkflowProps {
  activeTenantId: string;
  currentUser: any;
  activeSubModule: any;
  setActiveSubModule: (sub: any) => void;
  completedIPMSSteps: string[];
  setCompletedIPMSSteps: React.Dispatch<React.SetStateAction<string[]>>;
  availableSubModules: any[];
}

export const GuidedIPMSWorkflow: React.FC<GuidedIPMSWorkflowProps> = ({
  activeTenantId,
  currentUser,
  activeSubModule,
  setActiveSubModule,
  completedIPMSSteps,
  setCompletedIPMSSteps,
  availableSubModules
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [lastCompletedStepName, setLastCompletedStepName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(-1);

  // Synchronize current active index based on activeSubModule id
  useEffect(() => {
    if (activeSubModule) {
      const idx = GUIDE_STEPS.findIndex(s => s.id === activeSubModule.id);
      setActiveStepIdx(idx);
    } else {
      setActiveStepIdx(-1);
    }
  }, [activeSubModule]);

  // Determine if a given index is unlocked
  const isStepUnlockedInput = (index: number): boolean => {
    if (index === 0) return true;
    const prevStep = GUIDE_STEPS[index - 1];
    return completedIPMSSteps.includes(prevStep.id);
  };

  // Safe navigation handler
  const handleNavigateToStepIdx = (index: number) => {
    if (!isStepUnlockedInput(index)) return;
    const stepDef = GUIDE_STEPS[index];
    const matchingSub = availableSubModules.find(m => m.id === stepDef.id);
    if (matchingSub) {
      setActiveSubModule(matchingSub);
    }
  };

  // Trigger high-perf canvas particles
  const triggerCelebrationEngine = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Audio tone cue if sound is enabled
    if (soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Play nested positive arpeggio
        const playTone = (freq: number, delay: number, dur: number) => {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
            osc.start();
            osc.stop(audioCtx.currentTime + dur);
          }, delay);
        };
        playTone(523.25, 0, 0.4); // C5
        playTone(659.25, 120, 0.4); // E5
        playTone(783.99, 240, 0.4); // G5
        playTone(1046.50, 360, 0.7); // C6
      } catch (err) {
        console.warn("Audio Context blocked by browser policy:", err);
      }
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      size: number;
      decay: number;
      gravity: number;
      shape: 'star' | 'circle' | 'square';
    }

    const particles: Particle[] = [];
    const colors = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#FFEB3B', '#FFFFFF'];

    const spawnFirework = (x: number, y: number) => {
      const count = 80 + Math.random() * 50;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        particles.push({
          x: x * window.devicePixelRatio,
          y: y * window.devicePixelRatio,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (1 + Math.random() * 3),
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          size: 4 + Math.random() * 6,
          decay: 0.012 + Math.random() * 0.015,
          gravity: 0.12,
          shape: Math.random() > 0.4 ? 'circle' : Math.random() > 0.5 ? 'star' : 'square'
        });
      }
    };

    // Spawn 5 random primary bursts instantly, then add continuous confetti spray
    for (let c = 0; c < 5; c++) {
      setTimeout(() => {
        const randX = window.innerWidth * (0.15 + Math.random() * 0.7);
        const randY = window.innerHeight * (0.2 + Math.random() * 0.45);
        spawnFirework(randX, randY);
      }, c * 350);
    }

    // Continuous ticker
    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Periodically trigger tiny sparkles/side confetti while below 5.5 seconds limit
      if (Date.now() - startTime < 5500 && Math.random() < 0.18) {
        // Spray from bottom corners
        const isLeft = Math.random() > 0.5;
        const angle = isLeft ? -Math.PI / 4 - Math.random() * Math.PI / 8 : -Math.PI * 3 / 4 + Math.random() * Math.PI / 8;
        const force = 12 + Math.random() * 8;
        const sX = isLeft ? 100 : window.innerWidth - 100;
        const sY = window.innerHeight - 50;

        for (let j = 0; j < 12; j++) {
          particles.push({
            x: sX * window.devicePixelRatio,
            y: sY * window.devicePixelRatio,
            vx: Math.cos(angle) * force * (0.8 + Math.random() * 0.4),
            vy: Math.sin(angle) * force * (0.8 + Math.random() * 0.4),
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            size: 3 + Math.random() * 5,
            decay: 0.01 + Math.random() * 0.012,
            gravity: 0.15,
            shape: 'circle'
          });
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        if (p.shape === 'star') {
          // Spark star
          const spikes = 5;
          const outerRadius = p.size;
          const innerRadius = p.size / 2;
          let rot = Math.PI / 2 * 3;
          let cx = p.x;
          let cy = p.y;
          let xStar = cx;
          let yStar = cy;
          const stepStar = Math.PI / spikes;

          ctx.moveTo(cx, cy - outerRadius);
          for (let s = 0; s < spikes; s++) {
            xStar = cx + Math.cos(rot) * outerRadius;
            yStar = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(xStar, yStar);
            rot += stepStar;

            xStar = cx + Math.cos(rot) * innerRadius;
            yStar = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(xStar, yStar);
            rot += stepStar;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'square') {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (Date.now() - startTime < 6000 || particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        window.removeEventListener('resize', resizeCanvas);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  };

  // Perform step completion with persistent Supabase integration
  const completeStep = async (stepId: string) => {
    if (loading) return;
    setLoading(true);

    const stepDef = GUIDE_STEPS.find(s => s.id === stepId);
    const stepName = stepDef ? stepDef.name : stepId;
    setLastCompletedStepName(stepName);

    const updated = Array.from(new Set([...completedIPMSSteps, stepId]));
    
    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/ipms-progress?userId=${currentUser?.email || 'default'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedSteps: updated })
      });

      if (response.ok) {
        setCompletedIPMSSteps(updated);
        // Fire celebrations!
        setTimeout(() => {
          triggerCelebrationEngine();
          setShowCelebrationModal(true);
        }, 80);
      } else {
        console.error("Failed response saving progress to Supabase:", await response.text());
        // Fallback update to keep app functional
        setCompletedIPMSSteps(updated);
      }
    } catch (err) {
      console.error("Failed saving IPMS workflow progress to Supabase:", err);
      setCompletedIPMSSteps(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleNextUnlockedStep = () => {
    setShowCelebrationModal(false);
    // Find next step relative to the active step
    if (activeStepIdx !== -1 && activeStepIdx < GUIDE_STEPS.length - 1) {
      const nextIdx = activeStepIdx + 1;
      if (isStepUnlockedInput(nextIdx)) {
        handleNavigateToStepIdx(nextIdx);
      }
    }
  };

  // Compute stats
  const totalSteps = GUIDE_STEPS.length;
  const completedCount = completedIPMSSteps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <>
      {/* Full screen fixed pointer-events-none Canvas layer for Fireworks */}
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-[9999]"
      />

      {/* Progress Card header overlay inside Active Sub-module or Landing Dashboard */}
      <div id="guided-ipms-wizard-bar" className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 xl:p-5 shadow-2xl relative mb-6">
        <div className="absolute top-3 right-4 flex items-center gap-2">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await fetch(`/api/tenant/${activeTenantId}/ipms-progress?userId=${currentUser?.email || 'default'}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ completedSteps: [] })
                });
              } catch(e) {
                console.error("Failed to reset:", e);
              } finally {
                setCompletedIPMSSteps([]);
                const firstSub = availableSubModules.find(m => m.id === GUIDE_STEPS[0].id);
                if (firstSub) setActiveSubModule(firstSub);
                setLoading(false);
              }
            }}
            className="p-1 px-2 rounded-md bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition"
            title="Reset Journey to Start"
            disabled={loading}
          >
            Reset Journey
          </button>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 px-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition"
            title="Toggle Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            Sound: {soundEnabled ? "On" : "Off"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/40">
                ✨
              </span>
              <h2 className="text-base font-extrabold text-white tracking-tight inline-flex items-center gap-1.5">
                IPMS Interactive Journey Companion
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 font-semibold px-2 py-0.5 rounded-full uppercase leading-none font-mono">Workflow Mode</span>
              </h2>
            </div>
            <p className="text-gray-400 text-xs text-justify leading-relaxed max-w-3xl">
              Welcome to the guided, step-by-step Individual Performance Management Suite (IPMS). Complete each strategic phase in order—from configuring KPA weights up to synthesizing legislative oversight reports.
            </p>
          </div>

          <div className="flex flex-col items-stretch lg:items-end justify-center gap-1.5 flex-shrink-0 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
              <span>Overall Completion:</span>
              <span className="text-emerald-400 text-sm font-black">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 font-mono text-right font-bold mt-0.5 uppercase tracking-wide">
              {completedCount} / {totalSteps} Core Stages Validated
            </div>
          </div>
        </div>

        {/* Guided Wizard visual track bar */}
        <div className="mt-5 border-t border-slate-800/80 pt-4 overflow-x-auto hide-scrollbar flex items-center justify-between gap-1.5 pb-1 max-w-full">
          {GUIDE_STEPS.map((step, idx) => {
            const isCompleted = completedIPMSSteps.includes(step.id);
            const isCurrent = activeSubModule && activeSubModule.id === step.id;
            const isUnlocked = isStepUnlockedInput(idx);

            return (
              <React.Fragment key={step.id}>
                {/* Step circle node */}
                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => handleNavigateToStepIdx(idx)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 outline-none flex-1 min-w-[105px] group ${
                    isCompleted 
                      ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-950 text-emerald-300 cursor-pointer' 
                      : isCurrent 
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 shadow-md ring-2 ring-indigo-500/20' 
                      : isUnlocked 
                      ? 'bg-slate-800/60 border-slate-750 hover:bg-slate-800 text-slate-200 cursor-pointer' 
                      : 'bg-slate-950/80 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                  }`}
                  title={`${step.name} - ${isCompleted ? 'Completed' : isUnlocked ? 'Unlocked' : 'Locked'}`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-[10px] font-mono font-bold bg-white/10 px-1 py-0.5 rounded leading-none">0{idx + 1}</span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20 group-hover:scale-110 transition-transform" />
                    ) : !isUnlocked ? (
                      <Lock className="w-3 h-3 text-slate-600" />
                    ) : (
                      <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-indigo-400 animate-ping' : 'bg-slate-400'}`} />
                    )}
                  </div>
                  <span className="text-[10.5px] font-bold truncate w-full text-left leading-tight tracking-tight group-hover:text-indigo-300 transition-colors">
                    {step.name}
                  </span>
                </button>

                {/* Arrow connector */}
                {idx < GUIDE_STEPS.length - 1 && (
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${
                    isCompleted ? 'text-emerald-500/50' : 'text-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Floating guide context actions for active step */}
        {activeStepIdx !== -1 && (
          <div className="mt-4 bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in/10">
            <div className="flex items-start gap-2 text-xs">
              <span className="text-emerald-400 font-extrabold text-base leading-none">✦</span>
              <div>
                <span className="font-extrabold text-slate-250">Active Stage 0{activeStepIdx + 1} Instructions:</span>{' '}
                <span className="text-slate-300 font-medium">{GUIDE_STEPS[activeStepIdx].desc}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto flex-shrink-0">
              {!completedIPMSSteps.includes(GUIDE_STEPS[activeStepIdx].id) ? (
                <button
                  type="button"
                  onClick={() => completeStep(GUIDE_STEPS[activeStepIdx].id)}
                  disabled={loading}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black rounded-lg shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer border-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {loading ? "Saving State..." : "Mark Step Complete & Celebrate! 🌟"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-1 rounded inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Step Verified
                  </span>
                  {activeStepIdx < GUIDE_STEPS.length - 1 && isStepUnlockedInput(activeStepIdx + 1) && (
                    <button
                      type="button"
                      onClick={() => handleNavigateToStepIdx(activeStepIdx + 1)}
                      className="px-3 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold tracking-wider uppercase rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      Next Step <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Satisfying celebration popup modal upon step completion */}
      {showCelebrationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[10000] animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-md p-6 xl:p-8 text-center shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Visual ambient sparkles backgrounds */}
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            
            <button 
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 text-white flex items-center justify-center mb-5 shadow-lg scale-110 rotate-3 animate-bounce">
              <Trophy className="w-8 h-8 text-white filter drop-shadow" />
            </div>

            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-3 py-1 rounded-full uppercase tracking-widest font-black mb-2">
              🎉 Stage Completed!
            </span>

            <h3 className="text-xl font-black text-white leading-tight mb-2 tracking-tight">
              Congratulations!
            </h3>

            <p className="text-gray-300 text-xs text-justify leading-relaxed mb-6 font-medium">
              You have successfully completed and finalized the <strong className="text-emerald-400">"{lastCompletedStepName}"</strong>. Your outputs have been committed securely to the persistent Supabase records database. 
              {activeStepIdx < GUIDE_STEPS.length - 1 ? (
                <span> You have unlocked the next stage of your Individual Performance Management (IPMS) journey!</span>
              ) : (
                <span> Amazing work! You have reached the final analytics and reporting package of your Individual Performance Management (IPMS).</span>
              )}
            </p>

            <div className="flex gap-3 w-full justify-center">
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-black rounded-lg transition w-full border-0 cursor-pointer"
              >
                Stay Here
              </button>
              {activeStepIdx < GUIDE_STEPS.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextUnlockedStep}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.02] text-white text-xs font-black rounded-lg shadow-lg shadow-emerald-500/20 transition-all w-full border-0 cursor-pointer flex items-center justify-center gap-1"
                >
                  Proceed to Next Step <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
