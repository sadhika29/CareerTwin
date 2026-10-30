import { Link } from 'react-router-dom';
import { ArrowRight, Network } from 'lucide-react';

export default function WhatIfCard() {
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
          <Network size={18} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">What should I improve first?</h2>
      </div>
      
      <div className="flex-1 mt-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">If you improve DSA</div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-slate-800">60%</span>
            <ArrowRight size={16} className="text-indigo-500" />
            <span className="text-xl font-bold text-indigo-600">80%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Career Readiness</div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold line-through text-slate-400 text-sm">78%</span>
              <span className="text-emerald-500 text-sm font-bold">→ 84%</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Interview Ready</div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold line-through text-slate-400 text-sm">40%</span>
              <span className="text-emerald-500 text-sm font-bold">→ 52%</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg mb-4">
          <span>Suggested Time</span>
          <span className="text-slate-800 font-bold">4 weeks</span>
        </div>
      </div>

      <div className="mt-auto">
        <Link to="/career" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
          Explore Career Roadmap <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
