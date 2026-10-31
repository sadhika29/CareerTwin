import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserRound, FileText, BriefcaseBusiness, 
  Target, MessageSquareText, Settings, LogOut,
  X, Sparkles
} from 'lucide-react';
import { signOut } from '../../features/auth/authService';

export default function Sidebar({ open, onNavigate }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const mainLinks = [
    { to: '/dashboard', label: 'Overview', Icon: LayoutDashboard },
    { to: '/resume', label: 'Resume', Icon: FileText },
    { to: '/jobs', label: 'Jobs', Icon: BriefcaseBusiness },
    { to: '/skills', label: 'Skills', Icon: Target },
    { to: '/interview', label: 'Interview', Icon: MessageSquareText },
  ];

  const bottomLinks = [
    { to: '/profile', label: 'Profile', Icon: UserRound },
    { to: '/settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <aside 
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#FBF8FF] border-r border-[#E4D5F3] transform transition-transform duration-200 ease-in-out flex flex-col shadow-sm ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-[74px] flex items-center justify-between px-6 border-b border-[#E4D5F3] shrink-0 bg-white/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4C2365] to-[#D83CC5] flex items-center justify-center text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[20px] tracking-tight leading-none font-sans">
              <span className="text-[#4C2365]">Career</span>
              <span className="text-[#7F5D99]">Twin</span>
            </span>
            <span className="text-[10px] font-semibold text-[#8A7A9E] tracking-wider uppercase mt-1">
              AI Platform
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button 
          onClick={onNavigate}
          className="lg:hidden p-1.5 text-[#78678C] hover:text-[#4C2365] hover:bg-[#F3E9FF] rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-5 px-3.5 flex flex-col gap-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#8A7A9E]">
            Menu
          </div>
          <nav className="flex flex-col gap-1">
            {mainLinks.map(({ to, label, Icon }) => (
              <NavLink 
                key={to} 
                to={to} 
                onClick={onNavigate}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                    isActive 
                      ? 'bg-[#F3E9FF] text-[#4C2365] font-semibold border border-[#E4D5F3] shadow-xs' 
                      : 'text-[#78678C] hover:bg-[#F3E9FF]/50 hover:text-[#27113D]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon 
                      size={18} 
                      className={isActive ? 'text-[#542477]' : 'text-[#8A7A9E]'} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Footer Options */}
      <div className="p-3.5 border-t border-[#E4D5F3] shrink-0 flex flex-col gap-1 bg-white/40">
        <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8A7A9E]">
          Account
        </div>
        {bottomLinks.map(({ to, label, Icon }) => (
          <NavLink 
            key={to} 
            to={to} 
            onClick={onNavigate}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
                isActive 
                  ? 'bg-[#F3E9FF] text-[#4C2365] font-semibold border border-[#E4D5F3]' 
                  : 'text-[#78678C] hover:bg-[#F3E9FF]/50 hover:text-[#27113D]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-[#542477]' : 'text-[#8A7A9E]'} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium text-[#E11D48] hover:bg-[#FFF1F2] transition-colors w-full text-left mt-1 cursor-pointer"
        >
          <LogOut size={18} strokeWidth={2} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
