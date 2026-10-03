import { useState } from 'react';

export default function ProgressOverview({ scores }) {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Resume', 'Skills', 'Preparation', 'Assessments'];

  const progressData = [
    { label: 'Resume Optimization', value: scores.resume, category: 'Resume' },
    { label: 'DSA Preparation', value: scores.dsa, category: 'Preparation' },
    { label: 'Aptitude', value: scores.aptitude, category: 'Preparation' },
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

      <div className="flex flex-col gap-5">
        {filtered.map(item => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-semibold text-slate-700">{item.label}</span>
              <span className="text-sm font-bold text-slate-800">{item.value}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#5B4AEF] to-[#8B5CF6] rounded-full transition-all duration-1000"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
