import { ArrowRight, MapPin, Building, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JobRecommendations({ jobs = [] }) {
  const defaultJobs = [
    { id: 1, title: 'Software Engineer', company: 'Google', location: 'Remote / Hybrid', match: 95, exp: '0-2 Yrs' },
    { id: 2, title: 'Frontend Developer', company: 'Microsoft', location: 'On-site', match: 88, exp: '1-3 Yrs' },
    { id: 3, title: 'Backend Developer', company: 'Amazon', location: 'Hybrid', match: 82, exp: '0-2 Yrs' },
  ];

  const jobsToUse = jobs.length ? jobs : defaultJobs;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Recommended Jobs</h2>
        <div className="flex gap-2">
          {['All', 'Remote', 'Hybrid', 'On-site'].map((filter, i) => (
            <button key={i} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${i === 0 ? 'bg-[#5B4AEF] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {jobsToUse.map(job => (
          <div key={job.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-slate-100 bg-slate-50 rounded-xl hover:border-[#5B4AEF]/30 transition-colors group">
            <div className="flex items-start sm:items-center gap-4 mb-4 sm:mb-0">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-400 text-xl shrink-0 shadow-sm">
                {job.company.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium"><Building size={12} /> {job.company}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  <span className="flex items-center gap-1"><Briefcase size={12} /> {job.exp}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-200 sm:border-none pt-3 sm:pt-0">
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Match</span>
                <span className="font-black text-slate-800">{job.match}%</span>
              </div>
              <Link to={`/jobs/${job.id}`} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-[#5B4AEF] hover:border-[#5B4AEF]/30 transition-colors shadow-sm">
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
