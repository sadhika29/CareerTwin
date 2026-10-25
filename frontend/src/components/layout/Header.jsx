import { useState, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, Sparkles } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { getProfile } from '../../features/profile/profileService';

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const title = location.pathname.split('/')[1] || 'overview';
  const [profileName, setProfileName] = useState('Yamini');
  const [profileCompletion, setProfileCompletion] = useState(85);

  useEffect(() => {
    getProfile()
      .then(res => {
        if (res?.profile) {
          const p = res.profile;
          if (p.full_name || p.name) {
            setProfileName(p.full_name || p.name);
          }
          // Calculate realistic profile completion percentage based on filled fields
          let filled = 0;
          const fields = ['full_name', 'email', 'phone', 'location', 'target_role', 'experience_level', 'skills', 'education', 'bio'];
          fields.forEach(f => {
            if (p[f] && (Array.isArray(p[f]) ? p[f].length > 0 : String(p[f]).trim().length > 0)) {
              filled += 1;
            }
          });
          const pct = Math.max(65, Math.min(100, Math.round((filled / fields.length) * 100)));
          setProfileCompletion(pct);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-[74px] bg-white/85 backdrop-blur-md border-b border-[#E4D5F3] flex items-center justify-between px-6 sm:px-8 shrink-0 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-[#78678C] hover:text-[#4C2365] hover:bg-[#F3E9FF] rounded-xl transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D] capitalize">
          {title.replace('-', ' ')}
        </h1>
      </div>

      {/* Global AI Search */}
      <div className="flex-1 max-w-md px-6 hidden md:block mx-auto">
        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7A9E] group-focus-within:text-[#542477] transition-colors" />
          <input 
            type="text"
            placeholder="Ask CareerTwin AI anything..."
            className="w-full bg-[#FAF7FD] border border-[#E4D5F3] text-[#27113D] placeholder-[#8A7A9E] text-xs sm:text-sm rounded-full py-2 pl-11 pr-14 focus:outline-none focus:ring-2 focus:ring-[#7951D1]/20 focus:border-[#542477] focus:bg-white transition-all shadow-xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
            <span className="text-[10px] font-bold text-[#8A7A9E] bg-white border border-[#E4D5F3] px-1.5 py-0.5 rounded-md">⌘K</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        <button 
          title="CareerTwin AI Copilot"
          className="relative p-2 text-[#78678C] hover:text-[#542477] hover:bg-[#F3E9FF] rounded-full transition-colors cursor-pointer group"
        >
          <Sparkles size={19} className="group-hover:scale-110 transition-transform text-[#7951D1]" />
        </button>

        <button 
          title="Notifications"
          className="relative p-2 text-[#78678C] hover:text-[#542477] hover:bg-[#F3E9FF] rounded-full transition-colors cursor-pointer"
        >
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E11D48] rounded-full ring-2 ring-white"></span>
        </button>
        
        <div className="h-6 w-px bg-[#E4D5F3] mx-1"></div>
        
        <Link 
          to="/profile" 
          className="flex items-center gap-2.5 hover:bg-[#F3E9FF]/70 p-1.5 pr-3 rounded-full border border-transparent hover:border-[#E4D5F3] transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4C2365] to-[#7951D1] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-sm font-semibold text-[#27113D] group-hover:text-[#542477] transition-colors">
                {profileName}
              </span>
              <ChevronDown size={13} className="text-[#8A7A9E]" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-12 h-1 bg-[#E4D5F3] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#542477] to-[#16A34A] rounded-full transition-all duration-500" 
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-[#16A34A] leading-none">
                {profileCompletion}%
              </span>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
