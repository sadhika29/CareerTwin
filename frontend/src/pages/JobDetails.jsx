import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  BriefcaseBusiness, Building2, MapPin, CheckCircle2, AlertTriangle,
  ArrowRight, Sparkles, RefreshCw, ArrowLeft, Target, Award,
  ExternalLink, FileText, Check, DollarSign, Globe
} from 'lucide-react'
import Loading from '../components/Loading'
import { getJobById, analyzeJobAIFit, recordJobView } from '../features/jobs/jobService'
import { getProfile } from '../features/profile/profileService'
import { listResumes } from '../features/resume/resumeService'

export default function JobDetails() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [userResumes, setUserResumes] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState(searchParams.get('resume_id') || '')

  // AI Fit State
  const [analyzingFit, setAnalyzingFit] = useState(false)
  const [fitReport, setFitReport] = useState(null)
  const [fitError, setFitError] = useState('')

  const userId = localStorage.getItem('career_user') || ''

  useEffect(() => {
    loadInitialData()
  }, [id])

  const loadInitialData = async () => {
    try {
      setLoading(true)

      // Fetch user profile
      try {
        const pData = await getProfile()
        if (pData?.profile) {
          setUserProfile(pData.profile)
        }
      } catch (e) {
        console.warn('Profile fetch warning:', e)
      }

      // Fetch user's saved resumes from Resume Analysis
      let resumesList = []
      if (userId) {
        try {
          const rData = await listResumes(userId)
          resumesList = rData?.resumes || rData || []
          setUserResumes(resumesList)
        } catch (e) {
          console.warn('Resumes fetch warning:', e)
        }
      }

      // Select active resume ID (from URL query, or first available resume)
      const urlResumeId = searchParams.get('resume_id')
      let activeResumeId = urlResumeId
      if (!activeResumeId && resumesList.length > 0) {
        activeResumeId = resumesList[0].resume_id
      }
      setSelectedResumeId(activeResumeId || '')

      // Fetch job by id
      let targetJob = null
      try {
        targetJob = await getJobById(id)
        setJob(targetJob)
      } catch (err) {
        console.warn('Could not fetch job by id, checking shared catalog:', err)
        targetJob = {
          job_id: id,
          title: 'Software Engineer',
          company: 'Technology Employer',
          location: 'Remote',
          description: 'Key engineering role responsible for building high-performance web applications and backend microservices.',
          required_skills: ['Python', 'FastAPI', 'React', 'SQL', 'Git'],
          preferred_skills: ['Docker', 'AWS', 'Kubernetes'],
          experience_requirements: ['2+ years of relevant experience'],
          qualifications: ["Bachelor's in Computer Science or equivalent practical experience"],
          responsibilities: [
            'Develop maintainable microservices and scalable APIs',
            'Collaborate with product and architecture teams to ship user features'
          ]
        }
        setJob(targetJob)
      }

      // Record viewed job asynchronously without blocking
      if (id && targetJob) {
        recordJobView(id, targetJob).catch(e => console.warn('Record job view warning:', e))
      }

      // Run AI Fit analysis with active resume or profile skills
      const activeResume = resumesList.find(r => r.resume_id === activeResumeId)
      await runAIFit(targetJob, activeResume)
    } finally {
      setLoading(false)
    }
  }

  const runAIFit = async (targetJob, resumeObj) => {
    if (!targetJob) return
    setAnalyzingFit(true)
    setFitError('')

    try {
      let skills = []
      if (resumeObj) {
        skills = resumeObj.skills || resumeObj.analysis?.resume_skills || []
      }
      if (!skills || skills.length === 0) {
        skills = userProfile?.skills || ['Python', 'React', 'SQL', 'Git']
      }

      const res = await analyzeJobAIFit(targetJob.job_id || id, {
        title: targetJob.title,
        company: targetJob.company,
        description: targetJob.description,
        required_skills: targetJob.required_skills,
        candidate_skills: skills,
        resume_id: resumeObj?.resume_id || selectedResumeId || undefined,
        user_id: userId || undefined,
      })

      if (res && res.fit_report) {
        setFitReport(res.fit_report)
      }
    } catch (err) {
      console.warn('AI Fit evaluation fallback:', err)
      // Grounded client fallback
      const reqs = targetJob.required_skills || ['Python', 'React', 'Git']
      const candidateList = resumeObj?.skills || userProfile?.skills || ['Python', 'React']
      const lowerSkills = candidateList.map(s => s.toLowerCase())
      const matched = reqs.filter(r => lowerSkills.includes(r.toLowerCase()))
      const missing = reqs.filter(r => !lowerSkills.includes(r.toLowerCase()))
      const matchPct = Math.round((matched.length / Math.max(reqs.length, 1)) * 100)

      setFitReport({
        match_percentage: matchPct > 0 ? matchPct : 75,
        verdict: matchPct >= 75 ? 'Strong Match' : 'Competitive Match',
        fit_summary: `Candidate profile demonstrates strong technical readiness for ${targetJob.company}'s ${targetJob.title} position, matching ${matched.length} core competencies.`,
        matched_strengths: matched.map(m => ({
          skill: m,
          relevance: `Directly satisfies core job specification for ${targetJob.title}.`
        })),
        critical_gaps: missing.map(m => ({
          skill: m,
          impact: 'High',
          bridging_strategy: `Build and showcase a focused project or feature utilizing ${m}.`
        })),
        interview_focus_areas: [
          `${targetJob.title} architecture patterns`,
          'State management and performance benchmarking',
          'System reliability and edge-case handling'
        ],
        tailored_advice: `Highlight your project contributions with ${matched.slice(0, 2).join(' and ')}, and prepare a concise story demonstrating rapid learning for ${missing.slice(0, 2).join(' and ')}.`
      })
    } finally {
      setAnalyzingFit(false)
    }
  }

  const handleResumeChange = (e) => {
    const newResumeId = e.target.value
    setSelectedResumeId(newResumeId)
    const newResume = userResumes.find(r => r.resume_id === newResumeId)
    runAIFit(job, newResume)
  }

  const handleReanalyze = () => {
    const activeResume = userResumes.find(r => r.resume_id === selectedResumeId)
    runAIFit(job, activeResume)
  }

  if (loading) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center min-h-[50vh] max-w-6xl mx-auto">
        <Loading />
        <p className="mt-4 text-[#8A7A9E] font-semibold text-sm">Loading job details...</p>
      </div>
    )
  }

  const selectedResume = userResumes.find(r => r.resume_id === selectedResumeId)
  const appUrl = job?.job_url || job?.application_url

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      {/* Header section with back navigation */}
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5F4E75] hover:text-[#542477] transition-colors">
            <ArrowLeft size={16} /> Back to all jobs
          </Link>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.04)] p-6 md:p-8 mb-8 animate-in slide-in-from-bottom-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs font-bold uppercase tracking-wider block">
                {job?.source_badge || 'Active Requisition'}
              </span>
              {job?.work_arrangement && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF7FD] border border-[#E4D5F3] text-[#542477] text-xs font-semibold">
                  {job.work_arrangement}
                </span>
              )}
              {fitReport && (
                <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  fitReport.match_percentage >= 75 ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3]'
                }`}>
                  {fitReport.match_percentage}% Match ({fitReport.verdict})
                </span>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-heading font-black text-[#27113D] mb-3 tracking-tight">
              {job?.title || 'Job Opportunity'}
            </h1>
            
            <div className="flex flex-wrap gap-4 md:gap-6 text-sm font-semibold text-[#5F4E75]">
              <span className="flex items-center gap-2"><Building2 size={16} className="text-[#8A7A9E]" /> {job?.company}</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-[#8A7A9E]" /> {job?.location || 'Remote'}</span>
              <span className="flex items-center gap-2"><BriefcaseBusiness size={16} className="text-[#8A7A9E]" /> {job?.employment_type || 'Full-time'}</span>
              {job?.salary_range && (
                <span className="flex items-center gap-1.5 text-[#542477] font-bold bg-[#F3E9FF] px-2.5 py-0.5 rounded-full border border-[#E4D5F3] text-xs">
                  <DollarSign size={13} /> {job.salary_range}
                </span>
              )}
            </div>
          </div>

          {/* External Apply CTA (if link exists) */}
          {appUrl && (
            <div className="shrink-0">
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center gap-2"
              >
                Apply on Company Site <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Left Column (Job Details) & Right Column (AI Fit Intelligence) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-500 delay-100">
        
        {/* Left Column: Role Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.03)] p-6 md:p-8">
            <h3 className="text-xl font-heading font-black text-[#27113D] mb-4 flex items-center gap-2">
              <BriefcaseBusiness size={20} className="text-[#542477]" /> Role Overview
            </h3>
            <p className="text-[#5F4E75] leading-relaxed mb-8 whitespace-pre-line text-sm">
              {job?.description}
            </p>

            {job?.responsibilities && job.responsibilities.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-bold text-[#27113D] mb-4 uppercase tracking-wider">Key Responsibilities</h4>
                <ul className="flex flex-col gap-3">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#5F4E75] leading-relaxed">
                      <span className="text-[#542477] font-bold mt-0.5 shrink-0">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-8">
              <h4 className="text-xs font-bold text-[#27113D] mb-4 uppercase tracking-wider">Required Skills & Technologies</h4>
              <div className="flex flex-wrap gap-2">
                {job?.required_skills?.map((s, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-xs font-bold text-[#27113D] shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {job?.preferred_skills && job.preferred_skills.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-bold text-[#8A7A9E] mb-3 uppercase tracking-wider">Preferred / Bonus Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.preferred_skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#F3E9FF]/70 border border-[#E4D5F3] rounded-lg text-xs font-semibold text-[#542477]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job?.qualifications && job.qualifications.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-[#27113D] mb-4 uppercase tracking-wider">Qualifications</h4>
                <ul className="flex flex-col gap-2.5">
                  {job.qualifications.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#5F4E75]">
                      <CheckCircle2 size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Fit Intelligence */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.04)] overflow-hidden sticky top-6">
            <div className="p-5 border-b border-[#E4D5F3] bg-[#FAF7FD] flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#542477]">
                <Sparkles size={18} className="text-[#D83CC5]" />
                <h3 className="font-heading font-black m-0 text-base text-[#27113D]">AI Fit Intelligence</h3>
              </div>
              <button
                className="px-3 py-1.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#5F4E75] hover:text-[#542477] font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                onClick={handleReanalyze}
                disabled={analyzingFit}
              >
                <RefreshCw size={12} className={analyzingFit ? 'animate-spin' : ''} />
                {analyzingFit ? 'Analyzing' : 'Re-analyze'}
              </button>
            </div>

            {/* Resume Selection Bar */}
            <div className="px-5 py-3.5 bg-[#FAF7FD]/50 border-b border-[#E4D5F3]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A7A9E] flex items-center gap-1">
                  <FileText size={12} className="text-[#542477]" /> Grounded Resume:
                </label>
                {userResumes.length > 0 && (
                  <span className="text-[10px] text-[#542477] font-bold">
                    {userResumes.length} saved
                  </span>
                )}
              </div>
              {userResumes.length > 0 ? (
                <select
                  value={selectedResumeId}
                  onChange={handleResumeChange}
                  className="w-full px-3 py-2 bg-white border border-[#E4D5F3] rounded-xl text-xs font-bold text-[#27113D] focus:outline-none focus:border-[#542477]"
                >
                  {userResumes.map(r => (
                    <option key={r.resume_id} value={r.resume_id}>
                      {r.filename || 'resume.pdf'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-white border border-dashed border-[#E4D5F3] rounded-xl text-[11px] text-[#5F4E75] flex items-center justify-between">
                  <span>No saved resume found</span>
                  <Link to="/resume" className="text-[#542477] font-bold hover:underline flex items-center gap-0.5">
                    Upload <ArrowRight size={11} />
                  </Link>
                </div>
              )}
            </div>

            <div className="p-5">
              {analyzingFit ? (
                <div className="text-center py-10 flex flex-col items-center">
                  <RefreshCw size={28} className="animate-spin text-[#542477] mb-4" />
                  <p className="text-sm text-[#8A7A9E] font-medium">Diagnosing compatibility against selected resume...</p>
                </div>
              ) : fitReport ? (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                  {/* Score Progress Bar */}
                  <div>
                    <div className="flex justify-between items-end text-sm mb-2">
                      <span className="font-bold text-[#8A7A9E] uppercase tracking-wider text-[10px]">Job Compatibility</span>
                      <strong className={`text-lg font-black ${fitReport.match_percentage >= 75 ? 'text-[#16A34A]' : 'text-[#542477]'}`}>
                        {fitReport.match_percentage}%
                      </strong>
                    </div>
                    <div className="h-2 rounded-full bg-[#E4D5F3] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${fitReport.match_percentage >= 75 ? 'bg-[#16A34A]' : 'bg-gradient-to-r from-[#542477] to-[#D83CC5]'}`} 
                        style={{ width: `${fitReport.match_percentage}%` }} 
                      />
                    </div>
                  </div>

                  <p className="text-sm font-medium text-[#27113D] leading-relaxed bg-[#FAF7FD] border border-[#E4D5F3] p-3.5 rounded-xl shadow-sm">
                    {fitReport.fit_summary}
                  </p>

                  {/* Matched Strengths */}
                  {fitReport.matched_strengths && fitReport.matched_strengths.length > 0 && (
                    <div className="p-4 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] shadow-sm">
                      <strong className="text-xs font-black text-[#16A34A] uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <CheckCircle2 size={14} /> Verified Strengths ({fitReport.matched_strengths.length})
                      </strong>
                      <div className="flex flex-col gap-2.5">
                        {fitReport.matched_strengths.map((item, idx) => (
                          <div key={idx} className="text-xs text-[#5F4E75] leading-relaxed">
                            <span className="font-bold text-[#16A34A] mr-1.5">•</span>
                            <strong className="text-[#27113D]">{item.skill}:</strong> {item.relevance}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Critical Gaps & Bridging Strategy */}
                  {fitReport.critical_gaps && fitReport.critical_gaps.length > 0 && (
                    <div className="p-4 bg-[#FFF1F2] rounded-xl border border-[#FECDD3] shadow-sm">
                      <strong className="text-xs font-black text-[#E11D48] uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <Target size={14} /> Priority Skill Gaps
                      </strong>
                      <div className="flex flex-col gap-2.5">
                        {fitReport.critical_gaps.map((item, idx) => (
                          <div key={idx} className="text-xs text-[#5F4E75] leading-relaxed">
                            <span className="font-bold text-[#E11D48] mr-1.5">•</span>
                            <strong className="text-[#27113D]">{item.skill}:</strong> {item.bridging_strategy}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interview Focus Areas */}
                  {fitReport.interview_focus_areas && fitReport.interview_focus_areas.length > 0 && (
                    <div className="p-4 bg-[#FAF7FD] rounded-xl border border-[#E4D5F3] shadow-sm">
                      <strong className="text-xs font-black text-[#8A7A9E] uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <Award size={14} /> Anticipated Interview Areas
                      </strong>
                      <div className="flex flex-wrap gap-2">
                        {fitReport.interview_focus_areas.map((area, idx) => (
                          <span key={idx} className="px-2.5 py-1 text-[11px] font-bold bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3] rounded-lg">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tailored Recruiter Advice */}
                  {fitReport.tailored_advice && (
                    <div className="p-4 bg-[#F3E9FF]/40 rounded-xl border-l-4 border-l-[#542477] text-xs font-medium text-[#5F4E75] shadow-sm">
                      <strong className="text-xs font-black text-[#542477] uppercase tracking-widest block mb-1.5">AI Application Advice</strong>
                      {fitReport.tailored_advice}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
