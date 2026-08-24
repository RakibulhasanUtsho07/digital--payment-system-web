import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, ChevronRight, ChevronLeft, CheckCircle2, XCircle } from "lucide-react";

interface SystemStoryViewerProps {
  onClose: () => void;
}

const storySteps = [
  { id: 1, title: "Request Arrives", service: "API Gateway", status: "success", duration: "12ms" },
  { id: 2, title: "Authentication", service: "Auth Service", status: "success", duration: "18ms" },
  { id: 3, title: "Wallet Validation", service: "Wallet Service", status: "success", duration: "45ms" },
  { id: 4, title: "Transaction Processing", service: "Transfer Service", status: "processing", duration: "---" },
  { id: 5, title: "Database Write", service: "Database", status: "failed", duration: "5000ms timeout" },
  { id: 6, title: "Failure Notification", service: "Notification", status: "success", duration: "32ms" },
];

export function SystemStoryViewer({ onClose }: SystemStoryViewerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= storySteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1500); // 1.5 seconds per step

    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col"
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              System Story Mode
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">Demo</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">Trace ID: trace_73a8f9b2</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Story Playback Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          <div className="w-full max-w-4xl relative">
            
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-500"
                animate={{ width: `${((currentStep + 1) / storySteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="mt-12 space-y-6">
              {storySteps.map((step, index) => {
                const isActive = index === currentStep;
                const isPast = index < currentStep;
                
                if (index > currentStep) return null; // Hide future steps

                return (
                  <motion.div 
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-6 p-4 rounded-xl border ${
                      isActive ? "bg-slate-900 border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]" : "bg-slate-900/40 border-slate-800"
                    }`}
                  >
                    <div className="w-12 flex justify-center">
                      {step.status === "failed" ? (
                        <XCircle className="w-8 h-8 text-rose-500" />
                      ) : step.status === "processing" && isActive ? (
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className={`w-8 h-8 ${isPast ? "text-emerald-500" : "text-slate-600"}`} />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{step.service}</div>
                      <div className={`text-lg font-medium ${isActive ? "text-white" : "text-slate-300"}`}>{step.title}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-mono text-slate-400">{step.duration}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-center gap-6">
          <button 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="p-3 rounded-full hover:bg-slate-800 disabled:opacity-50 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={() => setCurrentStep(Math.min(storySteps.length - 1, currentStep + 1))}
            disabled={currentStep === storySteps.length - 1}
            className="p-3 rounded-full hover:bg-slate-800 disabled:opacity-50 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}