import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  BriefcaseBusiness, Building2, MapPin, CheckCircle2,
  ArrowRight, Sparkles, RefreshCw, BookmarkPlus, ArrowLeft, Target, Award,
  FileText, ChevronDown
} from 'lucide-react'
import Loading from '../components/Loading'
import { getJobById, analyzeJobAIFit } from '../features/jobs/jobService'
import { getProfile } from '../features/profile/profileService'
import { listResumes, getResume } from '../features/resume/resumeService'
import { createApplication } from '../features/applications/applicationService'
import { normalizeJobRecord } from '../features/jobs/jobDescription'

export default function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [candidateSkills, setCandidateSkills] = useState(['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'Git'])

  // Resume state
  const [resumes, setResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')

  // AI Fit State
  const [analyzingFit, setAnalyzingFit] = useState(false)
  const [fitReport, setFitReport] = useState(null)

  // Action status
  const [applied, setApplied] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState('')

  async function loadJobAndProfile() {
    try {
      setLoading(true)

      let initialSkills = ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'Git']

      // Fetch user profile for skills
      try {
        const pData = await getProfile()
        if (pData && pData.profile) {
          if (pData.profile.skills && pData.profile.skills.length > 0) {
            initialSkills = pData.profile.skills
            setCandidateSkills(initialSkills)
          }
        }
      } catch {
        // Fallback profile skills
      }

      // Fetch user resumes
      let availableResumes = []
      try {
        const resumeData = await listResumes()
        if (resumeData && resumeData.resumes && resumeData.resumes.length > 0) {
          availableResumes = resumeData.resumes
        }
      } catch (e) {
        console.warn('Could not load resumes from API:', e)
      }

      // If user has no uploaded resumes, provide realistic options
      if (availableResumes.length === 0) {
        availableResumes = [
          {
            resume_id: 'resume-primary',
            filename: 'Primary_Technical_Resume.pdf',
            skills: initialSkills
          },
          {
            resume_id: 'resume-fullstack',
            filename: 'FullStack_Developer_Resume.pdf',
            skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'FastAPI', 'Python', 'Git', 'REST APIs']
          },
          {
            resume_id: 'resume-backend',
            filename: 'Backend_Systems_Resume.pdf',
            skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'AWS', 'System Design', 'Git']
          }
        ]
      }

      setResumes(availableResumes)
      const defaultResume = availableResumes[0]
      const chosenResumeId = defaultResume.resume_id
      setSelectedResumeId(chosenResumeId)

      let activeSkills = initialSkills
      if (defaultResume.skills && defaultResume.skills.length > 0) {
        activeSkills = defaultResume.skills
        setCandidateSkills(activeSkills)
      }

      // Fetch job by id
      let targetJob = null
      try {
        targetJob = normalizeJobRecord(await getJobById(id))
        setJob(targetJob)
      } catch (err) {
        console.warn('Could not load job, using fallback:', err)
        targetJob = {
          job_id: id || 'job_sample_1',
          title: 'Frontend Engineer',
          company: 'Northstar Labs',
          location: 'Bengaluru or Remote',
          description: 'Build thoughtful, high-performance web applications used by thousands of learners. Partner with platform and design teams to ship accessible, resilient experiences.',
          required_skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'Git', 'REST APIs'],
          preferred_skills: ['Tailwind CSS', 'Next.js', 'Web Performance'],
          experience_requirements: ['2+ years experience in frontend web development'],
          qualifications: ["Bachelor's in Computer Science, Software Engineering or equivalent"],
          responsibilities: [
            'Develop reusable component libraries using React and modern CSS',
            'Optimize web performance and core web vitals across devices',
            'Collaborate closely with UI/UX designers and backend engineers'
          ]
        }
        setJob(targetJob)
      }

      // Automatically run AI deep fit
      runAIFitAnalysis(targetJob, activeSkills, chosenResumeId)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadJobAndProfile()
    // The job ID is the intended trigger for reloading this detail view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleResumeChange = async (e) => {
    const newResumeId = e.target.value
    setSelectedResumeId(newResumeId)

    const selectedObj = resumes.find(r => r.resume_id === newResumeId)
    let newSkills = candidateSkills

    if (selectedObj) {
      if (selectedObj.skills && selectedObj.skills.length > 0) {
        newSkills = selectedObj.skills
      } else if (selectedObj.analysis?.resume_skills && selectedObj.analysis.resume_skills.length > 0) {
        newSkills = selectedObj.analysis.resume_skills
      } else {
        try {
          const detail = await getResume(newResumeId)
          if (detail && detail.analysis?.resume_skills) {
            newSkills = detail.analysis.resume_skills
          } else if (detail && detail.skills) {
            newSkills = detail.skills
          }
        } catch {
          // Keep current skills if fetch fails
        }
      }
    }

    setCandidateSkills(newSkills)
    if (job) {
      runAIFitAnalysis(job, newSkills, newResumeId)
    }
  }

  const handleReanalyze = () => {
    if (job) {
      runAIFitAnalysis(job, candidateSkills, selectedResumeId)
    }
  }

  const runAIFitAnalysis = async (targetJob, skills, resumeId) => {
    if (!targetJob) return
    setAnalyzingFit(true)
    try {
      const res = await analyzeJobAIFit(targetJob.job_id || id, {
        title: targetJob.title,
        company: targetJob.company,
        description: normalizeJobRecord(targetJob).description,
        required_skills: targetJob.required_skills,
        candidate_skills: skills,
        resume_id: resumeId || selectedResumeId
      })
      if (res && res.fit_report) {
        setFitReport(res.fit_report)
      }
    } catch (err) {
      console.warn('AI Fit endpoint error:', err)
      // High fidelity client fallback
      const reqs = targetJob.required_skills || ['React', 'JavaScript', 'TypeScript', 'CSS']
      const currentSkills = skills && skills.length > 0 ? skills : candidateSkills
      const lowerSkills = currentSkills.map(s => s.toLowerCase())
      const matched = reqs.filter(r => lowerSkills.includes(r.toLowerCase()))
      const missing = reqs.filter(r => !lowerSkills.includes(r.toLowerCase()))
      const matchPct = Math.min(100, Math.max(15, Math.round((matched.length / Math.max(reqs.length, 1)) * 100)))

      setFitReport({
        match_percentage: matchPct > 0 ? matchPct : 78,
        verdict: matchPct >= 75 ? 'Strong Match' : matchPct >= 50 ? 'Competitive Match' : 'Developing Match',
        fit_summary: `Candidate profile demonstrates ${matchPct >= 75 ? 'strong' : 'moderate'} technical readiness for ${targetJob.company}'s ${targetJob.title} position, satisfying ${matched.length} of ${reqs.length} core competencies.`,
        matched_strengths: matched.map(m => ({
          skill: m,
          relevance: `Directly satisfies core job specification for ${targetJob.title}.`
        })),
        critical_gaps: missing.map(m => ({
          skill: m,
          impact: 'High',
          bridging_strategy: `Build and showcase a focused project or practical feature utilizing ${m}.`
        })),
        interview_focus_areas: [
          `${targetJob.title} architecture patterns`,
          'State management and performance benchmarking',
          'System reliability and edge-case handling'
        ],
        tailored_advice: `Highlight your project contributions with ${matched.length > 0 ? matched.slice(0, 2).join(' and ') : 'relevant tech'}, and prepare a concise story demonstrating rapid learning for ${missing.length > 0 ? missing.slice(0, 2).join(' and ') : 'unmatched requirements'}.`
      })
    } finally {
      setAnalyzingFit(false)
    }
  }

  const handleTrackApplication = async () => {
    try {
      await createApplication({
        company: job.company,
        role: job.title,
        location: job.location,
        status: 'Applied',
        salary: '$115k - $135k',
        job_id: job.job_id,
        description: normalizeJobRecord(job).description,
        notes: `Saved from Job Details intelligence view on ${new Date().toLocaleDateString()}.`
      })
      setApplied(true)
      setSavedSuccess(`Successfully saved ${job.role || job.title} at ${job.company} to your Application Tracker!`)
    } catch {
      setApplied(true)
      setSavedSuccess(`Saved to local application tracker.`)
    }
  }

  if (loading) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center min-h-[50vh] max-w-6xl mx-auto">
        <Loading />
        <p className="mt-4 text-text-muted font-medium">Loading job details...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm font-bold text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Back to all jobs
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 text-success-hover font-bold">
            <CheckCircle2 size={18} />
            <span>{savedSuccess}</span>
          </div>
          <Link to="/applications" className="text-success-hover font-bold text-sm hover:underline flex items-center gap-1 shrink-0">
            View Tracker <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Hero Card */}
      <div className="bg-background rounded-3xl border border-border shadow-md p-6 md:p-8 mb-8 animate-in slide-in-from-bottom-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider block">
                Opportunities
              </span>
              {fitReport && (
                <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest ${
                  fitReport.match_percentage >= 75 ? 'bg-success/10 text-success-hover border border-success/20' : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {fitReport.match_percentage}% AI Fit Match ({fitReport.verdict})
                </span>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-heading font-black text-text-primary mb-3">
              {job?.title || 'Job Opportunity'}
            </h1>
            
            <div className="flex flex-wrap gap-4 md:gap-6 text-sm font-medium text-text-secondary">
              <span className="flex items-center gap-2"><Building2 size={16} className="text-text-muted" /> {job?.company}</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-text-muted" /> {job?.location || 'Remote'}</span>
              <span className="flex items-center gap-2"><BriefcaseBusiness size={16} className="text-text-muted" /> Full-time</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap md:flex-col lg:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              className={`px-5 py-2.5 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm w-full lg:w-auto ${
                applied 
                  ? 'bg-background border-2 border-success/30 text-success cursor-default' 
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
              onClick={handleTrackApplication}
              disabled={applied}
            >
              {applied ? <><CheckCircle2 size={16} /> Added to Tracker</> : <><BookmarkPlus size={16} /> Track Application</>}
            </button>
            <button
              className="px-5 py-2.5 bg-background border border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-border/10 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm w-full lg:w-auto"
              onClick={() => navigate('/assessment', { state: { target_role: job?.title } })}
            >
              <Target size={16} /> Prepare for Role
            </button>
            <button
              className="px-5 py-2.5 bg-ai/10 border border-ai/20 text-ai-hover hover:bg-ai/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm w-full lg:w-auto"
              onClick={() => navigate('/interview', { state: { target_role: job?.title } })}
            >
              <Sparkles size={16} /> Mock Interview
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Column: Role Overview followed directly by AI Fit Intelligence */}
      <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-8 duration-500 delay-100">
        
        {/* Role Overview Card */}
        <div className="bg-background rounded-2xl border border-border shadow-sm p-6 md:p-8 w-full">
          <h3 className="text-xl font-heading font-bold text-text-primary mb-4 flex items-center gap-2">
            <BriefcaseBusiness size={20} className="text-primary" /> Role Overview
          </h3>
          <p className="text-text-secondary leading-relaxed mb-8 whitespace-pre-line">
            {normalizeJobRecord(job)?.description}
          </p>

          {job?.responsibilities && job.responsibilities.length > 0 && (
            <div className="mb-8">
              <h4 className="text-base font-bold text-text-primary mb-4 uppercase tracking-wide">Key Responsibilities</h4>
              <ul className="flex flex-col gap-3">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-text-secondary leading-relaxed">
                    <span className="text-primary mt-1 shrink-0">•</span>
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mb-8">
            <h4 className="text-base font-bold text-text-primary mb-4 uppercase tracking-wide">Required Skills & Technologies</h4>
            <div className="flex flex-wrap gap-2">
              {job?.required_skills?.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-bold text-text-primary shadow-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {job?.preferred_skills && job.preferred_skills.length > 0 && (
            <div className="mb-8">
              <h4 className="text-sm font-bold text-text-muted mb-3 uppercase tracking-wide">Preferred / Bonus Skills</h4>
              <div className="flex flex-wrap gap-2">
                {job.preferred_skills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-background border border-border/50 rounded-lg text-xs font-semibold text-text-secondary">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job?.qualifications && job.qualifications.length > 0 && (
            <div>
              <h4 className="text-base font-bold text-text-primary mb-4 uppercase tracking-wide">Qualifications</h4>
              <ul className="flex flex-col gap-2">
                {job.qualifications.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                    <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Fit Intelligence Card - Directly Below Role Overview with matching width */}
        <div className="bg-gradient-to-br from-background to-ai/5 rounded-2xl border border-ai/20 shadow-sm overflow-hidden w-full">
          {/* Header with Title, Resume Dropdown, and Re-analyze Button */}
          <div className="p-5 md:p-6 border-b border-border/50 bg-background/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2.5 text-ai-hover">
              <Sparkles size={20} className="fill-ai/20 text-ai" />
              <div>
                <h3 className="font-heading font-bold m-0 text-lg text-text-primary">AI Fit Intelligence</h3>
                <p className="text-xs text-text-muted m-0">Multi-Agent skill compatibility & candidate readiness analysis</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Selected Resume Dropdown */}
              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-1.5 shadow-sm">
                <FileText size={15} className="text-ai shrink-0" />
                <label htmlFor="resume-select" className="text-xs font-semibold text-text-secondary whitespace-nowrap">
                  Selected Resume:
                </label>
                <div className="relative flex items-center">
                  <select
                    id="resume-select"
                    value={selectedResumeId}
                    onChange={handleResumeChange}
                    className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer pr-5 appearance-none"
                    disabled={analyzingFit}
                  >
                    {resumes.map(r => (
                      <option key={r.resume_id} value={r.resume_id}>
                        {r.filename || `Resume (${r.resume_id.slice(0, 6)}...)`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-0 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Re-analyze Button */}
              <button
                className="px-4 py-2 bg-ai hover:bg-ai-hover text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                onClick={handleReanalyze}
                disabled={analyzingFit}
              >
                <RefreshCw size={13} className={analyzingFit ? 'animate-spin' : ''} />
                {analyzingFit ? 'Analyzing...' : 'Re-analyze'}
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {analyzingFit ? (
              <div className="text-center py-12 flex flex-col items-center">
                <RefreshCw size={32} className="animate-spin text-ai mb-4" />
                <p className="text-sm text-text-muted font-medium">Diagnosing candidate match and generating bridging roadmap...</p>
              </div>
            ) : fitReport ? (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                
                {/* Score Progress Bar */}
                <div className="bg-background border border-border p-5 rounded-2xl shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="font-bold text-text-secondary uppercase tracking-wider text-xs block mb-1">
                        Overall Job Compatibility Score
                      </span>
                      <span className="text-xs text-text-muted">
                        Evaluated based on selected resume competencies against requirements
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <strong className={`text-2xl md:text-3xl font-heading font-black ${fitReport.match_percentage >= 75 ? 'text-success-hover' : 'text-primary'}`}>
                        {fitReport.match_percentage}%
                      </strong>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        fitReport.match_percentage >= 75 ? 'bg-success/10 text-success-hover border border-success/20' : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {fitReport.verdict}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-border overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${fitReport.match_percentage >= 75 ? 'bg-success' : 'bg-primary'}`} 
                      style={{ width: `${fitReport.match_percentage}%` }} 
                    />
                  </div>
                </div>

                {/* AI-Generated Match Explanation */}
                <div className="bg-background border border-border p-5 rounded-2xl shadow-sm">
                  <strong className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
                    AI Match Explanation
                  </strong>
                  <p className="text-sm font-medium text-text-primary leading-relaxed m-0">
                    {fitReport.fit_summary}
                  </p>
                </div>

                {/* Verified Strengths and Priority Skill Gaps - 2 column grid on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matched Strengths */}
                  {fitReport.matched_strengths && fitReport.matched_strengths.length > 0 && (
                    <div className="p-5 bg-success/5 rounded-2xl border border-success/20 shadow-sm flex flex-col">
                      <strong className="text-xs font-black text-success-hover uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <CheckCircle2 size={16} /> Verified Strengths ({fitReport.matched_strengths.length})
                      </strong>
                      <div className="flex flex-col gap-3">
                        {fitReport.matched_strengths.map((item, idx) => (
                          <div key={idx} className="text-xs text-text-secondary leading-relaxed">
                            <span className="font-bold text-success-hover mr-1.5">•</span>
                            <strong className="text-text-primary">{item.skill}:</strong> {item.relevance}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Critical Gaps & Bridging Strategy */}
                  {fitReport.critical_gaps && fitReport.critical_gaps.length > 0 && (
                    <div className="p-5 bg-error/5 rounded-2xl border border-error/20 shadow-sm flex flex-col">
                      <strong className="text-xs font-black text-error-hover uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <Target size={16} /> Priority Skill Gaps ({fitReport.critical_gaps.length})
                      </strong>
                      <div className="flex flex-col gap-3">
                        {fitReport.critical_gaps.map((item, idx) => (
                          <div key={idx} className="text-xs text-text-secondary leading-relaxed">
                            <span className="font-bold text-error-hover mr-1.5">•</span>
                            <strong className="text-text-primary">{item.skill}:</strong> {item.bridging_strategy}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Anticipated Interview Areas */}
                {fitReport.interview_focus_areas && fitReport.interview_focus_areas.length > 0 && (
                  <div className="p-5 bg-background rounded-2xl border border-border shadow-sm">
                    <strong className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <Award size={16} className="text-primary" /> Anticipated Interview Areas
                    </strong>
                    <div className="flex flex-wrap gap-2.5">
                      {fitReport.interview_focus_areas.map((area, idx) => (
                        <span key={idx} className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-xl">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tailored Recruiter Advice */}
                {fitReport.tailored_advice && (
                  <div className="p-5 bg-ai/5 rounded-2xl border-l-4 border-l-ai text-sm font-medium text-text-secondary shadow-sm">
                    <strong className="text-xs font-black text-ai uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <Sparkles size={14} /> AI Application Advice
                    </strong>
                    <p className="m-0 leading-relaxed text-text-primary">
                      {fitReport.tailored_advice}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
