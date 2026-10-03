import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SkillGapChart() {
  const skills = [
    { name: 'DSA', current: 60, required: 85 },
    { name: 'System Design', current: 40, required: 70 },
    { name: 'Web Dev', current: 80, required: 75 },
    { name: 'Cloud', current: 30, required: 60 },
    { name: 'Java', current: 75, required: 80 },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-1">Skill Gap Analysis</h2>
        <p className="text-xs text-slate-500">Compare your current skills with your target role.</p>
      </div>

      <div className="flex-1 flex flex-col justify-end gap-3 mb-6">
        {skills.map(skill => (
          <div key={skill.name} className="flex items-center gap-3">
            <span className="w-24 text-xs font-semibold text-slate-600 truncate">{skill.name}</span>
            <div className="flex-1 h-3 bg-slate-100 rounded-sm flex relative">
              {/* Required level background */}
              <div 
                className="absolute inset-y-0 left-0 bg-slate-200 rounded-sm"
                style={{ width: `${skill.required}%` }}
              />
              {/* Current level */}
              <div 
                className={`absolute inset-y-0 left-0 rounded-sm transition-all duration-1000 ${
                  skill.current >= skill.required ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${skill.current}%` }}
              />
            </div>
          </div>
        ))}
        
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-amber-400 rounded-sm"></div> Current</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-slate-200 rounded-sm"></div> Required</div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="px-3 py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg mb-4 inline-block">
          3 critical gaps identified
        </div>
        <Link to="/skills" className="w-full py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
          View Skill Gap Analysis <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
