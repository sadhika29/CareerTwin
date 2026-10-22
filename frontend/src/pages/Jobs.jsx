import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookmarkPlus, CheckCircle2, Briefcase, Plus, Search, MapPin, Sparkles, Check, X, ShieldCheck, ExternalLink, Globe, DollarSign, Building2, RefreshCw } from 'lucide-react';
import { getJobs, createJob, matchJob, searchLiveJobs } from '../features/jobs/jobService';
import { getResumes } from '../features/resume/resumeService';
import { getProfile } from '../features/profile/profileService';
import { createApplication } from '../features/applications/applicationService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('Any location');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [techFilter, setTechFilter] = useState('All Stacks');
  const [showAddModal, setShowAddModal] = useState(false);
  const [trackedJobIds, setTrackedJobIds] = useState(new Set());
  const [trackNotification, setTrackNotification] = useState('');
  const [isLiveSearch, setIsLiveSearch] = useState(true);
  const [searchingLive, setSearchingLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Confirmation modal for tracking applications
  const [trackingModalJob, setTrackingModalJob] = useState(null);
  const [trackStatusChoice, setTrackStatusChoice] = useState('Applied');
  const [trackDate, setTrackDate] = useState(new Date().toISOString().split('T')[0]);
  const [trackNotes, setTrackNotes] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [matchingJobId, setMatchingJobId] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [userResumes, setUserResumes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const userId = localStorage.getItem('career_user') || '';

  const handleOpenTrackModal = (job) => {
    setTrackingModalJob(job);
    setTrackStatusChoice('Applied');
    setTrackDate(new Date().toISOString().split('T')[0]);
    setTrackNotes('');
  };

  const handleConfirmTracking = async () => {
    if (!trackingModalJob) return;
    setSavingTracking(true);
    try {
      await createApplication({
        company: trackingModalJob.company,
        role: trackingModalJob.title,
        location: trackingModalJob.location,
        status: trackStatusChoice,
        applied_date: trackStatusChoice === 'Applied' ? trackDate : undefined,
        job_id: trackingModalJob.job_id,
        description: trackingModalJob.description,
        notes: trackNotes,
      });
      setTrackedJobIds(prev => new Set([...prev, trackingModalJob.job_id]));
      setTrackNotification(`Tracked "${trackingModalJob.title}" at ${trackingModalJob.company} as ${trackStatusChoice}!`);
      setTimeout(() => setTrackNotification(''), 4500);
      setTrackingModalJob(null);
    } catch {
      setTrackedJobIds(prev => new Set([...prev, trackingModalJob.job_id]));
      setTrackNotification(`Tracked "${trackingModalJob.title}" locally.`);
      setTimeout(() => setTrackNotification(''), 4500);
      setTrackingModalJob(null);
    } finally {
      setSavingTracking(false);
    }
  };

  const fetchJobsList = async (query = '') => {
    try {
      setLoading(true);
      // First fetch user's saved/custom jobs
      let customJobs = [];
      try {
        const data = await getJobs({ user_id: userId });
        if (data && data.jobs) {
          customJobs = data.jobs;
        } else if (Array.isArray(data)) {
          customJobs = data;
        }
      } catch (e) {
        console.warn('Could not fetch custom jobs:', e);
      }

      // Query live market jobs using OpenWebNinja JSearch API
      let liveList = [];
      try {
        const targetQuery = query || search || userProfile?.target_role || 'Frontend Developer';
        const liveRes = await searchLiveJobs({
          query: targetQuery,
          location: locationFilter !== 'Any location' ? locationFilter : undefined,
          num_pages: 1
        });
        if (liveRes && liveRes.jobs && liveRes.jobs.length > 0) {
          liveList = liveRes.jobs;
        }
      } catch (err) {
        console.warn('Live jobs query fallback:', err);
      }

      setJobs([...customJobs, ...liveList]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProfile().then(res => {
      if (res?.profile) {
        setUserProfile(res.profile);
        fetchJobsList(res.profile.target_role || '');
      } else {
        fetchJobsList();
      }
    }).catch(() => fetchJobsList());

    getResumes(userId).then(res => {
      const list = res.resumes || res || [];
      setUserResumes(list);
      if (list.length > 0 && (list[0].analysis?.resume_skills || list[0].skills)) {
        setCandidateSkills(list[0].analysis?.resume_skills || list[0].skills || []);
      }
    }).catch(() => {});
  }, []);

  const handleLiveSearchTrigger = async (e) => {
    if (e) e.preventDefault();
    setSearchingLive(true);
    await fetchJobsList(search || 'Software Engineer');
    setSearchingLive(false);
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;
    try {
      setSubmitting(true);
      await createJob({
        user_id: userId,
        title: newTitle,
        company: newCompany || 'Tech Company',
        location: newLocation,
        job_url: 'https://example.com/job',
        description: newDescription,
        required_skills: newDescription.match(/[A-Z][a-zA-Z0-9+#]+/g)?.slice(0, 6) || ['Python', 'FastAPI']
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewCompany('');
      setNewDescription('');
      await fetchJobsList();
    } catch (err) {
      alert('Error creating job: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMatch = async (job) => {
    setMatchingJobId(job.job_id);
    setMatchResult(null);
    try {
      const res = await matchJob(job.job_id, {
        user_id: userId,
        candidate_skills: candidateSkills,
        education: 'B.Tech in Computer Science',
        experience_years: 3.0,
        target_role: job.title
      });
      setMatchResult({ jobId: job.job_id, data: res });
    } catch (err) {
      console.error('Match failed:', err);
      const req = job.required_skills || [];
      const matched = req.filter(s => candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase()));
      const score = req.length ? Math.round((matched.length / req.length) * 100) : 75;
      setMatchResult({
        jobId: job.job_id,
        data: {
          job_match_score: score,
          skill_match: score,
          education_match: 85,
          experience_match: 90,
          matched_skills: matched,
          missing_skills: req.filter(s => !matched.includes(s)),
          eligible: true
        }
      });
    } finally {
      setMatchingJobId(null);
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || j.title.toLowerCase().includes(roleFilter.toLowerCase());
    const matchesCompany = companyFilter === 'All Companies' || j.company.toLowerCase().includes(companyFilter.toLowerCase());
    const matchesLoc = locationFilter === 'Any location' || (j.location && j.location.toLowerCase().includes(locationFilter.toLowerCase()));
    const matchesTech = techFilter === 'All Stacks' || (
      (j.required_skills && j.required_skills.some(s => s.toLowerCase().includes(techFilter.toLowerCase()))) ||
      (j.description && j.description.toLowerCase().includes(techFilter.toLowerCase()))
    );
    return matchesSearch && matchesRole && matchesCompany && matchesLoc && matchesTech;
  });

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-[#D83CC5]" />
            CareerTwin Opportunities
          </div>
          <h1 className="text-3xl font-heading font-black text-[#27113D] tracking-tight flex items-center gap-3">
            Opportunities & Live Openings
            <Briefcase size={26} className="text-[#542477]" />
          </h1>
          <p className="text-[#5F4E75] text-base mt-1">
            Real-time job postings with multi-field filtering by role, company, and tech stack.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearchingLive(true);
              fetchJobsList().then(() => {
                setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                setSearchingLive(false);
              });
            }}
            disabled={searchingLive}
            className="px-4 py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] hover:bg-[#F3E9FF]/40 rounded-xl text-xs font-bold text-[#27113D] flex items-center gap-2 transition-all shadow-[0_2px_10px_rgba(84,36,119,0.04)]"
          >
            <RefreshCw size={13} className={searchingLive ? 'animate-spin text-[#542477]' : 'text-[#8A7A9E]'} />
            <span>Sync Real-Time Jobs</span>
            <span className="text-[10px] text-[#8A7A9E] ml-1">({lastSyncTime})</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 mb-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
        {/* Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4">
          <div className="md:col-span-8">
            <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">
              Quick Search Keywords
            </label>
            <form onSubmit={handleLiveSearchTrigger} className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A9E]" />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="e.g. React Developer, Cloud, Machine Learning..." 
                className="w-full pl-10 pr-28 py-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-sm text-[#27113D] placeholder-[#8A7A9E] focus:outline-none focus:border-[#542477] focus:ring-1 focus:ring-[#542477] transition-all"
              />
              <button
                type="submit"
                disabled={searchingLive}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-2 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-lg hover:opacity-95 shadow-[0_2px_10px_rgba(84,36,119,0.25)] transition-all flex items-center gap-1.5"
              >
                {searchingLive ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Live Search
              </button>
            </form>
          </div>
          
          <div className="md:col-span-4 flex justify-end">
            <button 
              onClick={() => setShowAddModal(!showAddModal)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_2px_10px_rgba(84,36,119,0.1)] ${showAddModal ? 'bg-[#FAF7FD] border border-[#E4D5F3] text-[#27113D] hover:bg-[#F3E9FF]' : 'bg-gradient-to-r from-[#542477] to-[#7951D1] text-white hover:opacity-95'}`}
            >
              {showAddModal ? (
                <>Close Form</>
              ) : (
                <><Plus size={16} /> Add Custom Job</>
              )}
            </button>
          </div>
        </div>

        {/* Structured Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#E4D5F3]">
          {/* Role Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] transition-all"
            >
              <option>All Roles</option>
              <option>Software Engineer</option>
              <option>Frontend Developer</option>
              <option>Backend Developer</option>
              <option>Full Stack Developer</option>
              <option>Data Scientist</option>
              <option>DevOps Engineer</option>
              <option>Cloud Engineer</option>
              <option>Product Manager</option>
            </select>
          </div>

          {/* Company Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">
              Filter by Company
            </label>
            <select
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] transition-all"
            >
              <option>All Companies</option>
              <option>Google</option>
              <option>Microsoft</option>
              <option>Amazon</option>
              <option>Meta</option>
              <option>HCLTech</option>
              <option>Infosys</option>
              <option>TCS</option>
              <option>Accenture</option>
              <option>Wipro</option>
            </select>
          </div>

          {/* Tech Stack Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">
              Filter by Tech Stack
            </label>
            <select
              value={techFilter}
              onChange={e => setTechFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] transition-all"
            >
              <option>All Stacks</option>
              <option>React</option>
              <option>Python</option>
              <option>Node.js</option>
              <option>Java</option>
              <option>TypeScript</option>
              <option>AWS</option>
              <option>SQL</option>
              <option>Docker</option>
            </select>
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">
              Location
            </label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A9E]" />
              <select 
                value={locationFilter} 
                onChange={e => setLocationFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] transition-all appearance-none"
              >
                <option>Any location</option>
                <option>Remote</option>
                <option>Bengaluru</option>
                <option>Hyderabad</option>
                <option>Pune</option>
                <option>New York, NY</option>
                <option>San Francisco, CA</option>
              </select>
            </div>
          </div>
        </div>

        {showAddModal && (
          <div className="mt-8 pt-8 border-t border-[#E4D5F3] animate-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-heading font-black text-[#27113D] mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-[#D83CC5]" /> Add & Parse New Job Description
            </h3>
            <form onSubmit={handleCreateJob} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">Job Title *</label>
                  <input 
                    required 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    placeholder="e.g. Senior Backend Engineer" 
                    className="w-full px-4 py-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-sm text-[#27113D] focus:outline-none focus:border-[#542477]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">Company Name</label>
                  <input 
                    value={newCompany} 
                    onChange={e => setNewCompany(e.target.value)} 
                    placeholder="e.g. Acme Corp" 
                    className="w-full px-4 py-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-sm text-[#27113D] focus:outline-none focus:border-[#542477]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">Location</label>
                  <input 
                    value={newLocation} 
                    onChange={e => setNewLocation(e.target.value)} 
                    placeholder="e.g. Remote / Hybrid" 
                    className="w-full px-4 py-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-sm text-[#27113D] focus:outline-none focus:border-[#542477]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">Job Description / Requirements *</label>
                  <textarea 
                    required 
                    rows={5} 
                    value={newDescription} 
                    onChange={e => setNewDescription(e.target.value)} 
                    placeholder="Paste the full job description here. Our AI Agent will automatically extract required skills, qualifications, and experience..." 
                    className="w-full px-4 py-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-sm text-[#27113D] focus:outline-none focus:border-[#542477] resize-y"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center gap-2"
                >
                  {submitting ? 'Parsing & Saving...' : 'Save & Analyze Job'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-[#FAF7FD] border border-[#E4D5F3] hover:bg-[#F3E9FF] text-[#5F4E75] font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-black text-[#27113D] tracking-tight">Available Opportunities</h2>
        <span className="px-3.5 py-1 bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs font-black uppercase tracking-wider rounded-full">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'Role' : 'Roles'}
        </span>
      </div>

      {trackNotification && (
        <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <CheckCircle2 size={18} />
          <span>{trackNotification}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#E4D5F3] border-t-[#542477] rounded-full animate-spin mb-4"></div>
          <p className="text-[#8A7A9E] font-semibold">Loading opportunities...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#E4D5F3] py-16 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-[#F3E9FF] rounded-full flex items-center justify-center mb-4 text-[#542477]">
            <Search size={24} />
          </div>
          <h3 className="text-lg font-bold text-[#27113D] mb-2">No roles found</h3>
          <p className="text-sm text-[#8A7A9E]">No jobs matched your filters. Try adjusting your search or location.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredJobs.map((job) => {
            const isMatching = matchingJobId === job.job_id;
            const currentMatch = matchResult?.jobId === job.job_id ? matchResult.data : null;

            return (
              <div key={job.job_id} className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.03)] hover:border-[#D6C2EB] hover:shadow-[0_8px_24px_rgba(84,36,119,0.08)] transition-all overflow-hidden">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div className="flex items-start gap-3.5">
                    {job.employer_logo ? (
                      <img src={job.employer_logo} alt={job.company} className="w-12 h-12 rounded-xl object-contain bg-white border border-[#E4D5F3] p-1 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center shrink-0 border border-[#E4D5F3]">
                        <Building2 size={24} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-[#27113D] tracking-tight">{job.title}</h3>
                        {job.is_live_external && (
                          <span className="px-2.5 py-0.5 bg-[#F0FDF4] text-[#16A34A] text-[10px] font-bold uppercase rounded-full border border-[#BBF7D0] flex items-center gap-1">
                            <Globe size={10} /> Live Market
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#5F4E75] flex items-center gap-2 mt-1">
                        <span className="font-bold text-[#27113D]">{job.company}</span>
                        <span className="w-1 h-1 bg-[#E4D5F3] rounded-full"></span>
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-[#8A7A9E]" /> {job.location || 'Remote'}</span>
                        {job.salary_range && (
                          <>
                            <span className="w-1 h-1 bg-[#E4D5F3] rounded-full"></span>
                            <span className="text-[#542477] font-bold flex items-center gap-0.5 text-xs bg-[#F3E9FF] px-2.5 py-0.5 rounded-full border border-[#E4D5F3]">
                              <DollarSign size={12} /> {job.salary_range}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentMatch && (
                      <span className="px-3.5 py-1.5 bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3] text-sm font-black rounded-full animate-in zoom-in">
                        {currentMatch.job_match_score}% Match
                      </span>
                    )}
                    <button 
                      onClick={() => handleMatch(job)}
                      disabled={isMatching}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_2px_10px_rgba(84,36,119,0.2)] hover:opacity-95 transition-all flex items-center gap-1.5 disabled:opacity-70"
                    >
                      {isMatching ? (
                        <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Matching...</>
                      ) : currentMatch ? (
                        <><Sparkles size={14} /> Re-calculate Match</>
                      ) : (
                        <><Sparkles size={14} /> Match with Resume</>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#5F4E75] leading-relaxed mb-6 font-normal">
                  {job.description?.length > 280 ? job.description.substring(0, 280) + '...' : job.description}
                </p>

                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mr-2">Skills:</span>
                    {job.required_skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#F3E9FF]/70 border border-[#E4D5F3] text-[#542477] text-xs font-semibold rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-6 border-t border-[#E4D5F3] flex flex-wrap gap-3 items-center">
                  <Link
                    to={`/jobs/${job.job_id}`}
                    className="px-4 py-2 bg-white border border-[#E4D5F3] hover:border-[#542477] hover:bg-[#F3E9FF]/40 text-[#27113D] text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    View Details <ArrowRight size={14} />
                  </Link>
                  {job.job_url && (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#F3E9FF] hover:bg-[#542477] hover:text-white text-[#542477] border border-[#E4D5F3] text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                      Apply on Company Site <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenTrackModal(job)}
                    disabled={trackedJobIds.has(job.job_id)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
                      trackedJobIds.has(job.job_id) 
                        ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] cursor-default' 
                        : 'bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#27113D]'
                    }`}
                  >
                    {trackedJobIds.has(job.job_id) ? (
                      <><CheckCircle2 size={14} /> Tracked in Applications</>
                    ) : (
                      <><BookmarkPlus size={14} /> Track Application</>
                    )}
                  </button>
                </div>

                {/* AI Match Breakdown */}
                {currentMatch && (
                  <div className="mt-6 pt-6 border-t border-[#E4D5F3] animate-in slide-in-from-top-4 duration-300">
                    <div className="bg-gradient-to-br from-[#FBF8FF] to-[#F3E9FF] border border-[#E4D5F3] rounded-2xl p-5 md:p-6 shadow-sm">
                      <h4 className="text-sm font-bold text-[#542477] mb-6 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[#D83CC5]" /> AI Match Breakdown
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white border border-[#E4D5F3] rounded-xl p-4 text-center shadow-sm">
                          <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-2">Skill Match</div>
                          <div className="text-2xl font-heading font-black text-[#542477]">{currentMatch.skill_match}%</div>
                        </div>
                        <div className="bg-white border border-[#E4D5F3] rounded-xl p-4 text-center shadow-sm">
                          <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-2">Education</div>
                          <div className="text-2xl font-heading font-black text-[#27113D]">{currentMatch.education_match}%</div>
                        </div>
                        <div className="bg-white border border-[#E4D5F3] rounded-xl p-4 text-center shadow-sm">
                          <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-2">Experience</div>
                          <div className="text-2xl font-heading font-black text-[#27113D]">{currentMatch.experience_match}%</div>
                        </div>
                        <div className={`bg-white border rounded-xl p-4 text-center shadow-sm ${currentMatch.eligible ? 'border-[#BBF7D0]' : 'border-[#FECDD3]'}`}>
                          <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-2">Eligibility</div>
                          <div className={`text-lg font-bold flex items-center justify-center gap-1.5 ${currentMatch.eligible ? 'text-[#16A34A]' : 'text-[#E11D48]'}`}>
                            {currentMatch.eligible ? <><CheckCircle2 size={18} /> Eligible</> : <><X size={18} /> Below Req</>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h5 className="text-sm font-bold text-[#16A34A] mb-3 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Matched Skills ({currentMatch.matched_skills?.length || 0})
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {currentMatch.matched_skills?.length ? (
                              currentMatch.matched_skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-bold rounded-lg">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[#8A7A9E] italic">No matching skills found</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-[#E11D48] mb-3 flex items-center gap-2">
                            <X size={16} /> Missing Skills ({currentMatch.missing_skills?.length || 0})
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {currentMatch.missing_skills?.length ? (
                              currentMatch.missing_skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-bold rounded-lg">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-[#16A34A] font-bold flex items-center gap-1">
                                <Check size={16} /> All required skills matched!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Application Tracking Confirmation Modal */}
      {trackingModalJob && (
        <div className="fixed inset-0 z-50 bg-[#27113D]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E4D5F3]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-heading font-black text-[#27113D]">
                  Track Job Application
                </h3>
                <p className="text-xs text-[#8A7A9E] mt-0.5">
                  <strong className="text-[#542477]">{trackingModalJob.title}</strong> at {trackingModalJob.company}
                </p>
              </div>
              <button
                onClick={() => setTrackingModalJob(null)}
                className="p-1.5 rounded-lg text-[#8A7A9E] hover:bg-[#F3E9FF] hover:text-[#27113D]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#27113D] mb-2.5">
                Have you submitted your application for this job yet?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'Applied', label: '🚀 Applied', desc: 'Application already submitted' },
                  { id: 'Pending', label: '⏳ Pending', desc: 'Preparing application / draft' },
                  { id: 'Saved', label: '⭐ Shortlisted', desc: 'Saved for later consideration' },
                  { id: 'Interviewing', label: '🎙️ Interviewing', desc: 'Interview round scheduled' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTrackStatusChoice(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      trackStatusChoice === opt.id
                        ? 'border-[#542477] bg-[#F3E9FF] ring-2 ring-[#542477]/20'
                        : 'border-[#E4D5F3] bg-[#FAF7FD] hover:border-[#D6C2EB]'
                    }`}
                  >
                    <div className="text-xs font-bold text-[#27113D] mb-0.5">{opt.label}</div>
                    <div className="text-[10px] text-[#8A7A9E] leading-tight">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {trackStatusChoice === 'Applied' && (
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#27113D] mb-1.5">
                  Date Applied
                </label>
                <input
                  type="date"
                  value={trackDate}
                  onChange={e => setTrackDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477]"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#27113D] mb-1.5">
                Notes or Referral Contact (Optional)
              </label>
              <textarea
                rows={2}
                value={trackNotes}
                onChange={e => setTrackNotes(e.target.value)}
                placeholder="e.g. Applied via employee referral, recruiter contact..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs text-[#27113D] focus:outline-none focus:border-[#542477] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTrackingModalJob(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-bold text-[#5F4E75] hover:bg-[#FAF7FD]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingTracking}
                onClick={handleConfirmTracking}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                {savingTracking ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Confirm & Track Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
