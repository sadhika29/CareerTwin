export default function ReadinessCard({ scores, overall }) {
  const metrics = [
    { label: 'Resume', value: scores.resume, color: '#38BDF8' },
    { label: 'DSA', value: scores.dsa, color: '#F59E0B' },
    { label: 'Aptitude', value: scores.aptitude, color: '#10B981' },
    { label: 'Technical', value: scores.technical, color: '#8B5CF6' },
    { label: 'Communication', value: scores.communication, color: '#6366F1' },
    { label: 'Interview', value: scores.interview, color: '#EF4444' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Career Readiness</h2>
      
      <div className="flex flex-col items-center mb-8 relative">
        {/* Simple CSS Circle Progress */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#F1F5F9" strokeWidth="10" />
            <circle 
              cx="50" cy="50" r="45" fill="none" 
              stroke="#5B4AEF" strokeWidth="10" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * overall) / 100} 
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-slate-800">{overall}%</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Ready</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 justify-end">
        {metrics.map(metric => (
          <div key={metric.label} className="flex items-center gap-3">
            <span className="w-24 text-xs font-semibold text-slate-600">{metric.label}</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
              />
            </div>
            <span className="w-8 text-right text-xs font-bold text-slate-700">{metric.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
