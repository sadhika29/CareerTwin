import { useState } from 'react';

export default function ProgressOverview({ scores }) {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Resume', 'Skills', 'Assessments'];

  const progressData = [
    { label: 'Resume Optimization', value: scores.resume, category: 'Resume' },
    { label: 'DSA Practice', value: scores.dsa, category: 'Skills' },
    { label: 'Aptitude Practice', value: scores.aptitude, category: 'Skills' },
    { label: 'Mock Interviews', value: scores.interview, category: 'Assessments' },
    { label: 'Technical Skills', value: scores.technical, category: 'Skills' },
  ];

  const filtered = activeTab === 'All' ? progressData : progressData.filter(d => d.category === activeTab);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Your Progress</h2>
      
      <div className="flex gap-2 border-b border-slate-100 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors shrink-0 ${
              activeTab === tab 
                ? 'text-[#5B4AEF] border-b-2 border-[#5B4AEF]' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((item, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-700">{item.label}</span>
              <span className="text-slate-500 font-bold">{item.value}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#5B4AEF] h-2 rounded-full transition-all duration-500"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
