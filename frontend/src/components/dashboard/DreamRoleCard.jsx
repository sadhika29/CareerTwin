import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DreamRoleCard() {
  const reqSkills = ['Java', 'DSA', 'SQL', 'React', 'System Design', 'Cloud'];

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 rounded-xl p-6 shadow-md h-full flex flex-col relative overflow-hidden">
      <div className="absolute -top-10 -right-10 opacity-10">
        <Trophy size={140} />
      </div>

      <div className="relative z-10 flex items-center gap-2 mb-1">
        <Trophy size={16} className="text-amber-400" />
        <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Your Dream Role</h2>
      </div>
      
      <h3 className="text-2xl font-bold mb-6 relative z-10">Software Engineer</h3>

      <div className="relative z-10 mb-6">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Required Core Skills</span>
        <div className="flex flex-wrap gap-2">
          {reqSkills.map(skill => (
            <span key={skill} className="bg-slate-700/50 border border-slate-600 px-2.5 py-1 rounded text-xs font-medium text-slate-200">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-auto bg-slate-800/80 border border-slate-700 rounded-lg p-4 flex items-center justify-between mb-4 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Match</span>
          <span className="text-2xl font-black text-white">76%</span>
        </div>
        <div className="w-16 h-16 relative flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="40" fill="none" 
              stroke="#F59E0B" strokeWidth="8" 
              strokeDasharray="251" 
              strokeDashoffset={251 - (251 * 76) / 100} 
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <Link to="/profile" className="relative z-10 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg">
        Improve Match <ArrowRight size={16} />
      </Link>
    </div>
  );
}
