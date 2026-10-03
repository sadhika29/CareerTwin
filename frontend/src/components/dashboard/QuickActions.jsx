import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Search, Target, BookOpen, MessageSquareText } from 'lucide-react';

export default function QuickActions() {
  const actions = [
    { to: '/resume', label: 'Optimize Resume', desc: 'Improve ATS score', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { to: '/jobs', label: 'Find Jobs', desc: 'Matching opportunities', icon: Search, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { to: '/skills', label: 'Analyze Skills', desc: 'Identify skill gaps', icon: Target, color: 'text-purple-500', bg: 'bg-purple-50' },
    { to: '/preparation', label: 'Start Preparation', desc: 'Daily practice tasks', icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-50' },
    { to: '/interview', label: 'Take Mock Interview', desc: 'Practice with AI', icon: MessageSquareText, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
        {actions.map((action, i) => (
          <Link 
            key={i} 
            to={action.to}
            className="shrink-0 w-60 bg-white border border-slate-200 rounded-xl p-4 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all group snap-start"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${action.bg} ${action.color}`}>
              <action.icon size={20} strokeWidth={2.5} />
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{action.label}</h3>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{action.desc}</p>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-[#5B4AEF] group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
