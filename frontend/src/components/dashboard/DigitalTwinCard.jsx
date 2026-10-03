import { Link } from 'react-router-dom';
import { ArrowRight, UserSquare2 } from 'lucide-react';

export default function DigitalTwinCard({ scores }) {
  return (
    <div className="bg-[#1E293B] rounded-xl p-6 shadow-sm text-white relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <UserSquare2 size={120} />
      </div>
      
      <div className="relative z-10 mb-6">
        <h2 className="text-xl font-semibold mb-1">Your Placement Digital Twin</h2>
        <p className="text-xs text-slate-400">Last updated 2 hours ago</p>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center py-4">
        {/* Abstract Radar visualization placeholder using pure CSS */}
        <div className="w-32 h-32 relative flex items-center justify-center mb-2">
          <div className="absolute inset-0 border border-slate-600 rounded-full"></div>
          <div className="absolute inset-4 border border-slate-600 rounded-full opacity-50"></div>
          <div className="absolute inset-8 border border-slate-600 rounded-full opacity-25"></div>
          
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <polygon 
              points="50,15 85,35 75,80 25,80 15,35" 
              fill="rgba(91, 74, 239, 0.4)" 
              stroke="#8B5CF6" 
              strokeWidth="2" 
            />
            <circle cx="50" cy="15" r="3" fill="#38BDF8" />
            <circle cx="85" cy="35" r="3" fill="#38BDF8" />
            <circle cx="75" cy="80" r="3" fill="#38BDF8" />
            <circle cx="25" cy="80" r="3" fill="#38BDF8" />
            <circle cx="15" cy="35" r="3" fill="#38BDF8" />
          </svg>
        </div>
        
        <div className="text-center mt-4 mb-2">
          <span className="text-emerald-400 text-sm font-bold block">↑ Your readiness improved +6% this month.</span>
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <Link to="/digital-twin" className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors border border-white/10">
          Explore Digital Twin <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
