import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, UserRound, FileText, BriefcaseBusiness, 
  Target, BookOpen, ClipboardCheck, Sparkles, Network, 
  Map, MessageSquareText, Settings, HelpCircle, LogOut,
  BarChart2
} from 'lucide-react';

export default function Sidebar({ open, onNavigate }) {
  const mainLinks = [
    { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
    { to: '/career', label: 'Career Twin', Icon: Sparkles },
    { to: '/resume', label: 'Resume', Icon: FileText },
    { to: '/jobs', label: 'Jobs', Icon: BriefcaseBusiness },
    { to: '/applications', label: 'Applications', Icon: ClipboardCheck },
    { to: '/skills', label: 'Skills', Icon: Target },
    { to: '/preparation', label: 'Preparation', Icon: BookOpen },
    { to: '/interview', label: 'Interview', Icon: MessageSquareText },
    { to: '/performance', label: 'Performance', Icon: BarChart2 },
    { to: '/what-if', label: 'What-If Planner', Icon: Network },
  ];

  const bottomLinks = [
    { to: '/profile', label: 'Profile', Icon: UserRound },
    { to: '/settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-border/10 transform transition-transform duration-200 ease-in-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Brand */}
      <div className="h-[72px] flex items-center px-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-heading font-bold text-lg shadow-subtle">
            C
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-white leading-tight">CareerTwin</span>
            <span className="text-[10px] font-medium text-ai uppercase tracking-wide">AI Assistant</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8 scrollbar-hide">
        <nav className="flex flex-col gap-1.5">
          {mainLinks.map(({ to, label, Icon }) => (
            <NavLink 
              key={to} 
              to={to} 
              onClick={onNavigate}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary shadow-sm border border-primary/20' 
                    : 'text-text-muted hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-primary' : 'text-text-muted opacity-80'} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Footer Options */}
      <div className="p-4 border-t border-white/5 shrink-0 flex flex-col gap-1.5">
        {bottomLinks.map(({ to, label, Icon }) => (
          <NavLink 
            key={to} 
            to={to} 
            onClick={onNavigate}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-text-muted hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="opacity-80" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-error/10 hover:text-error transition-colors w-full text-left mt-2">
          <LogOut size={18} className="opacity-80" strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  );
}
