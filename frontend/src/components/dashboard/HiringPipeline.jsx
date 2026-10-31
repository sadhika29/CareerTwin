import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HiringPipeline({ activeStage = 'Technical Assessment' }) {
  const stages = [
    { label: 'Resume Screen', status: 'completed' },
    { label: 'Coding Assessment', status: 'current' },
    { label: 'Technical Interview', status: 'upcoming' },
    { label: 'Final Round', status: 'upcoming' },
    { label: 'Offer', status: 'upcoming' }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">Application Journey</h2>
      
      <div className="flex flex-col md:flex-row justify-between relative mb-8">
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        {stages.map((stage, i) => (
          <div key={i} className="flex md:flex-col items-center gap-3 relative z-10 mb-4 md:mb-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              stage.status === 'completed' ? 'bg-emerald-500 text-white' :
              stage.status === 'current' ? 'bg-[#5B4AEF] text-white ring-4 ring-[#5B4AEF]/20' :
              'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              {stage.status === 'completed' ? <CheckCircle2 size={16} /> : 
               stage.status === 'current' ? <Clock size={16} /> : 
               <span>{i + 1}</span>}
            </div>
            <span className={`text-xs font-semibold ${
              stage.status === 'current' ? 'text-[#5B4AEF]' : 'text-slate-600'
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
        <Link to="/skills" className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-md transition-colors">
          Improve This Stage →
        </Link>
      </div>
    </div>
  );
}
