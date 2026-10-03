import { CheckCircle2, Circle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HiringPipeline() {
  const stages = [
    { label: 'Resume', status: 'done' },
    { label: 'Aptitude', status: 'done' },
    { label: 'Coding', status: 'progress' },
    { label: 'Technical', status: 'todo' },
    { label: 'HR', status: 'todo' },
    { label: 'Offer', status: 'todo' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8 overflow-hidden">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Hiring Pipeline Readiness</h2>
      
      <div className="relative flex justify-between items-center mb-8 px-2 max-w-3xl">
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
        
        {stages.map((stage, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
            {stage.status === 'done' ? (
              <CheckCircle2 size={24} className="text-emerald-500 bg-white" />
            ) : stage.status === 'progress' ? (
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center border-2 border-amber-500">
                <Zap size={14} className="animate-pulse" />
              </div>
            ) : (
              <Circle size={24} className="text-slate-200 bg-white" />
            )}
            <span className={`text-xs font-bold uppercase tracking-wider ${
              stage.status === 'done' ? 'text-emerald-600' : 
              stage.status === 'progress' ? 'text-amber-600' : 'text-slate-400'
            }`}>
              {stage.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between bg-amber-50 rounded-lg p-4 border border-amber-100">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-amber-800">Current bottleneck: Coding Rounds</span>
        </div>
        <Link to="/preparation" className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-md transition-colors">
          Improve This Stage →
        </Link>
      </div>
    </div>
  );
}
