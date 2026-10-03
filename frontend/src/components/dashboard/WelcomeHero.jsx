import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function WelcomeHero({ readiness = 78, nextAction, insight }) {
  return (
    <div className="bg-gradient-to-br from-[#5B4AEF] to-[#8B5CF6] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden mb-6">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl transform -translate-y-1/2"></div>
      
      <div className="relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Good morning, Yamini 👋</h1>
          <p className="text-[#E0E7FF] text-lg">Your CareerTwin is ready to guide your placement journey.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[#C7D2FE] text-sm uppercase tracking-wider font-semibold mb-1">Target Role</span>
              <span className="font-bold text-lg">Software Engineer</span>
            </div>
            <div className="w-px h-10 bg-white/20 hidden md:block"></div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[#C7D2FE] text-sm uppercase tracking-wider font-semibold mb-1">Target Companies</span>
              <span className="font-bold text-lg">Tech / Product</span>
            </div>
          </div>

          <div className="flex flex-col items-end border-t border-white/20 md:border-none pt-4 md:pt-0 w-full md:w-auto">
            <span className="text-[#C7D2FE] text-xs font-semibold mb-1 uppercase tracking-wider">Readiness</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black">{readiness}%</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-lg mt-1 shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1 text-[#E0E7FF]">✨ CareerTwin Insight</h3>
              <p className="text-sm leading-relaxed max-w-2xl text-white">
                {insight || "Your resume is strong, but improving DSA and technical interview performance will have the highest impact on your current readiness."}
              </p>
            </div>
          </div>
          <Link to="/interview" className="shrink-0 bg-white text-[#5B4AEF] hover:bg-[#F8FAFC] px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow hover:shadow-md flex items-center gap-2 group">
            Chat with CareerTwin
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
