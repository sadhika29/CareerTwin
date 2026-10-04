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
    <header className="h-[72px] bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-text-secondary hover:bg-black/5 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-heading font-bold text-text-primary capitalize hidden sm:block">
          {title.replace('-', ' ')}
        </h1>
      </div>

      <div className="flex-1 max-w-lg px-6 hidden md:block ml-auto">
        <div className="relative group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Ask CareerTwin AI..."
            className="w-full bg-white border border-border text-text-primary text-sm rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <span className="text-[10px] font-medium text-text-muted bg-background border border-border px-1.5 py-0.5 rounded">⌘K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto md:ml-0">
        <button className="relative p-2 text-text-secondary hover:bg-black/5 rounded-full transition-colors group">
          <Sparkles size={18} className="group-hover:text-ai transition-colors" />
        </button>
        <button className="relative p-2 text-text-secondary hover:bg-black/5 rounded-full transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-background"></span>
        </button>
        
        <div className="h-6 w-px bg-border mx-1"></div>
        
        <Link to="/profile" className="flex items-center gap-2.5 hover:bg-black/5 p-1.5 pr-3 rounded-full transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                {profileName}
              </span>
              <ChevronDown size={13} className="text-text-muted" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full transition-all duration-500" 
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-success leading-none">
                {profileCompletion}% Complete
              </span>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
