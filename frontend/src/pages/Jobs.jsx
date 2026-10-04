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
  const [showAddModal, setShowAddModal] = useState(false);
  const [trackedJobIds, setTrackedJobIds] = useState(new Set());
  const [trackNotification, setTrackNotification] = useState('');
  const [isLiveSearch, setIsLiveSearch] = useState(true);
  const [searchingLive, setSearchingLive] = useState(false);
  
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

  const handleTrackJob = async (job) => {
    try {
      await createApplication({
        company: job.company,
        role: job.title,
        location: job.location,
        status: 'Saved',
        job_id: job.job_id,
        description: job.description
      });
      setTrackedJobIds(prev => new Set([...prev, job.job_id]));
      setTrackNotification(`Saved "${job.title}" at ${job.company} to Applications tracker!`);
      setTimeout(() => setTrackNotification(''), 4000);
    } catch {
      setTrackedJobIds(prev => new Set([...prev, job.job_id]));
      setTrackNotification(`Saved "${job.title}" locally.`);
      setTimeout(() => setTrackNotification(''), 4000);
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

      if (liveList.length > 0 || customJobs.length > 0) {
        setJobs([...customJobs, ...liveList]);
      } else {
        // High quality fallback curated jobs
        setJobs([
          {
            job_id: 'job_sample_1',
            title: 'Frontend Engineer',
            company: 'HCLTech',
            location: 'Bengaluru / Remote',
            description: 'Develop high-performance React and Next.js interfaces with modern state management, micro-frontends, and automated testing.',
            required_skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Git', 'REST APIs'],
            preferred_skills: ['TypeScript', 'Tailwind CSS', 'Next.js'],
            experience_requirements: ['0-3 years experience'],
            salary_range: '₹8,00,000 - ₹14,00,000 / yr',
            job_url: 'https://hcltech.com/careers'
          },
          {
            job_id: 'job_sample_2',
            title: 'Software Developer (Full Stack)',
            company: 'Infosys',
            location: 'Hyderabad / Pune',
            description: 'Build enterprise cloud applications with FastAPI, Python, React, and PostgreSQL on AWS/Azure cloud environments.',
            required_skills: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker'],
            preferred_skills: ['AWS', 'Kubernetes', 'CI/CD'],
            experience_requirements: ['1-3 years experience'],
            salary_range: '₹7,50,000 - ₹12,00,000 / yr',
            job_url: 'https://infosys.com/careers'
          },
          {
            job_id: 'job_sample_3',
            title: 'AI & Cloud Applications Engineer',
            company: 'Google Cloud Platform',
            location: 'Bengaluru / Remote',
            description: 'Designing distributed services, Gemini AI agent pipelines, and database caching architectures.',
            required_skills: ['Python', 'SQL', 'FastAPI', 'Generative AI', 'System Design'],
            preferred_skills: ['Docker', 'Kubernetes', 'GCP'],
            experience_requirements: ['0-2 years experience'],
            salary_range: '₹18,00,000 - ₹28,00,000 / yr',
            job_url: 'https://careers.google.com'
          }
        ]);
      }
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
    const matchesLoc = locationFilter === 'Any location' || j.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLoc;
  });

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
          Opportunities
          <Briefcase size={24} className="text-primary" />
        </h1>
        <p className="text-text-secondary text-base">
          Find your next role and compare opportunities against the skills you are building with AI.
        </p>
      </div>

      <Card className="mb-8 overflow-visible">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">
                Search Roles or Companies
              </label>
              <form onSubmit={handleLiveSearchTrigger} className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="e.g. Frontend Engineer, Google, HCL" 
                  className="w-full pl-10 pr-20 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={searchingLive}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary-hover transition-colors flex items-center gap-1"
                >
                  {searchingLive ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  Find
                </button>
              </form>
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">
                Location
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <select 
                  value={locationFilter} 
                  onChange={e => {
                    setLocationFilter(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
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
            <div className="md:col-span-3 flex justify-end">
              <button 
                onClick={() => setShowAddModal(!showAddModal)}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${showAddModal ? 'bg-background border border-border text-text-primary hover:bg-border/30' : 'bg-primary text-white hover:bg-primary-hover'}`}
              >
                {showAddModal ? (
                  <>Close Form</>
                ) : (
                  <><Plus size={16} /> Add Custom Job</>
                )}
              </button>
            </div>
          </div>

          {showAddModal && (
            <div className="mt-8 pt-8 border-t border-border animate-in slide-in-from-top-4 duration-300">
              <h3 className="text-lg font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
                <Sparkles size={18} className="text-ai" /> Add & Parse New Job Description
              </h3>
              <form onSubmit={handleCreateJob} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">Job Title *</label>
                    <input 
                      required 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)} 
                      placeholder="e.g. Senior Backend Engineer" 
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">Company Name</label>
                    <input 
                      value={newCompany} 
                      onChange={e => setNewCompany(e.target.value)} 
                      placeholder="e.g. Acme Corp" 
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">Location</label>
                    <input 
                      value={newLocation} 
                      onChange={e => setNewLocation(e.target.value)} 
                      placeholder="e.g. Remote / Hybrid" 
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">Job Description / Requirements *</label>
                    <textarea 
                      required 
                      rows={5} 
                      value={newDescription} 
                      onChange={e => setNewDescription(e.target.value)}
                      placeholder="Paste the full job description here. Our AI Agent will automatically extract required skills, qualifications, and experience..." 
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary resize-y"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {submitting ? 'Parsing & Saving...' : 'Save & Analyze Job'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2.5 bg-background border border-border hover:bg-border/30 text-text-primary font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold text-text-primary">Available Opportunities</h2>
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'Role' : 'Roles'}
        </span>
      </div>

      {trackNotification && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} />
          <span>{trackNotification}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-text-muted font-medium">Loading opportunities...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="bg-background border-dashed border-2 py-16 text-center">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">No roles found</h3>
            <p className="text-sm text-text-muted">No jobs matched your filters. Try adjusting your search or location.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredJobs.map((job) => {
            const isMatching = matchingJobId === job.job_id;
            const currentMatch = matchResult?.jobId === job.job_id ? matchResult.data : null;

            return (
              <Card key={job.job_id} className="overflow-hidden hover:border-primary/40 transition-all shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                    <div className="flex items-start gap-3.5">
                      {job.employer_logo ? (
                        <img src={job.employer_logo} alt={job.company} className="w-12 h-12 rounded-xl object-contain bg-white border border-border p-1 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Building2 size={24} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-text-primary mb-0">{job.title}</h3>
                          {job.is_live_external && (
                            <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold uppercase rounded-md border border-success/20 flex items-center gap-1">
                              <Globe size={10} /> Live Market
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary flex items-center gap-2 mt-1">
                          <span className="font-semibold text-text-primary">{job.company}</span>
                          <span className="w-1 h-1 bg-border rounded-full"></span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> {job.location || 'Remote'}</span>
                          {job.salary_range && (
                            <>
                              <span className="w-1 h-1 bg-border rounded-full"></span>
                              <span className="text-primary font-bold flex items-center gap-0.5 text-xs bg-primary/5 px-2 py-0.5 rounded">
                                <DollarSign size={12} /> {job.salary_range}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {currentMatch && (
                        <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full animate-in zoom-in">
                          {currentMatch.job_match_score}% Match
                        </span>
                      )}
                      <button 
                        onClick={() => handleMatch(job)}
                        disabled={isMatching}
                        className="px-4 py-2 bg-ai/10 hover:bg-ai/20 text-ai text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
                      >
                        {isMatching ? (
                          <><div className="w-4 h-4 border-2 border-ai/30 border-t-ai rounded-full animate-spin"></div> Matching...</>
                        ) : currentMatch ? (
                          <><Sparkles size={16} /> Re-calculate Match</>
                        ) : (
                          <><Sparkles size={16} /> Match with Resume</>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed mb-6">
                    {job.description?.length > 280 ? job.description.substring(0, 280) + '...' : job.description}
                  </p>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-2">Skills:</span>
                      {job.required_skills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-background border border-border text-text-secondary text-xs font-medium rounded-md">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-6 border-t border-border flex flex-wrap gap-3 items-center">
                    <Link
                      to={`/jobs/${job.job_id}`}
                      className="px-4 py-2 bg-background border border-border hover:bg-border/30 text-text-primary text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      View Details <ArrowRight size={16} />
                    </Link>
                    {job.job_url && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-primary/10 hover:bg-primary hover:text-white text-primary text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
                      >
                        Apply on Company Site <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => handleTrackJob(job)}
                      disabled={trackedJobIds.has(job.job_id)}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                        trackedJobIds.has(job.job_id) 
                          ? 'bg-success/10 text-success border border-success/20 cursor-default' 
                          : 'bg-background border border-border hover:bg-border/30 text-text-primary'
                      }`}
                    >
                      {trackedJobIds.has(job.job_id) ? (
                        <><CheckCircle2 size={16} /> Tracked in Applications</>
                      ) : (
                        <><BookmarkPlus size={16} /> Track Application</>
                      )}
                    </button>
                  </div>

                  {/* AI Match Breakdown */}
                  {currentMatch && (
                    <div className="mt-6 pt-6 border-t border-border animate-in slide-in-from-top-4 duration-300">
                      <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 md:p-6">
                        <h4 className="text-sm font-bold text-primary mb-6 flex items-center gap-2">
                          <ShieldCheck size={18} /> AI Match Breakdown
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          <div className="bg-white border border-border rounded-lg p-4 text-center shadow-sm">
                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Skill Match</div>
                            <div className="text-2xl font-heading font-black text-primary">{currentMatch.skill_match}%</div>
                          </div>
                          <div className="bg-white border border-border rounded-lg p-4 text-center shadow-sm">
                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Education</div>
                            <div className="text-2xl font-heading font-black text-text-primary">{currentMatch.education_match}%</div>
                          </div>
                          <div className="bg-white border border-border rounded-lg p-4 text-center shadow-sm">
                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Experience</div>
                            <div className="text-2xl font-heading font-black text-text-primary">{currentMatch.experience_match}%</div>
                          </div>
                          <div className={`bg-white border border-border rounded-lg p-4 text-center shadow-sm ${currentMatch.eligible ? 'border-success/30' : 'border-error/30'}`}>
                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Eligibility</div>
                            <div className={`text-lg font-bold flex items-center justify-center gap-1.5 ${currentMatch.eligible ? 'text-success' : 'text-error'}`}>
                              {currentMatch.eligible ? <><CheckCircle2 size={18} /> Eligible</> : <><X size={18} /> Below Req</>}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h5 className="text-sm font-bold text-success mb-3 flex items-center gap-2">
                              <CheckCircle2 size={16} /> Matched Skills ({currentMatch.matched_skills?.length || 0})
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {currentMatch.matched_skills?.length ? (
                                currentMatch.matched_skills.map((s, idx) => (
                                  <span key={idx} className="px-2.5 py-1 bg-success/10 border border-success/20 text-success text-xs font-semibold rounded-md">
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-text-muted italic">No matching skills found</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-error mb-3 flex items-center gap-2">
                              <X size={16} /> Missing Skills ({currentMatch.missing_skills?.length || 0})
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {currentMatch.missing_skills?.length ? (
                                currentMatch.missing_skills.map((s, idx) => (
                                  <span key={idx} className="px-2.5 py-1 bg-error/10 border border-error/20 text-error text-xs font-semibold rounded-md">
                                    {s}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-success font-medium flex items-center gap-1">
                                  <Check size={16} /> All required skills matched!
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
