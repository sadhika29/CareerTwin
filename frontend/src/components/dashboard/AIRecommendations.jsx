import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIRecommendations({ recommendations = [] }) {
  const defaultRecs = [
    { priority: 'HIGH PRIORITY', title: 'Improve DSA', desc: 'Practice a skills assessment to identify your current strengths and gaps.', to: '/assessment', btnText: 'Take Assessment' },
    { priority: 'MEDIUM', title: 'Build Portfolio Project', desc: 'Add 2 real-world projects to strengthen your profile and improve resume score.', to: '/resume', btnText: 'Update Profile' },
    { priority: 'MEDIUM', title: 'Practice Technical Interviews', desc: 'Your current interview score is 40%. Practice mock interviews.', to: '/interview', btnText: 'Mock Interview' },
    { priority: 'LOW', title: 'Apply to Jobs', desc: 'You have 5 highly matching jobs available.', to: '/jobs', btnText: 'View Jobs' }
  ];

  const recsToUse = recommendations.length ? recommendations : defaultRecs;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Sparkles size={100} />
      </div>
      <div className="flex items-center gap-2 mb-6 relative z-10">
        <Sparkles size={20} className="text-[#5B4AEF]" />
        <h2 className="text-xl font-semibold text-slate-800">Recommended for You</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4 relative z-10">
        {recsToUse.map((rec, i) => (
          <div key={i} className="border border-slate-100 bg-slate-50 rounded-xl p-5 hover:border-[#5B4AEF]/30 hover:bg-[#5B4AEF]/5 transition-colors group">
            <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded mb-3 inline-block ${
              rec.priority.includes('HIGH') ? 'bg-rose-100 text-rose-700' : 
              rec.priority.includes('MEDIUM') ? 'bg-amber-100 text-amber-700' : 
              'bg-emerald-100 text-emerald-700'
            }`}>
              {rec.priority}
            </span>
            <h3 className="font-bold text-slate-800 mb-2">{rec.title}</h3>
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{rec.desc}</p>
            <Link to={rec.to} className="text-sm font-semibold text-[#5B4AEF] flex items-center gap-1.5 group-hover:gap-2 transition-all">
              {rec.btnText} <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
