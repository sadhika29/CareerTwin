import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookmarkPlus, CheckCircle2 } from 'lucide-react'
import { Page } from './_shared'
import { getJobs, createJob, matchJob } from '../features/jobs/jobService'
import { getResumes } from '../features/resume/resumeService'
import { createApplication } from '../features/applications/applicationService'
import Loading from '../components/Loading'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('Any location')
  const [showAddModal, setShowAddModal] = useState(false)
  const [trackedJobIds, setTrackedJobIds] = useState(new Set())
  const [trackNotification, setTrackNotification] = useState('')
  
  // Job creation form
  const [newTitle, setNewTitle] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newLocation, setNewLocation] = useState('Remote')
  const [newDescription, setNewDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Matching state
  const [matchingJobId, setMatchingJobId] = useState(null)
  const [matchResult, setMatchResult] = useState(null)
  const [candidateSkills, setCandidateSkills] = useState(['Python', 'React', 'FastAPI', 'PostgreSQL', 'Docker', 'Git'])
  const [userResumes, setUserResumes] = useState([])

  const userId = 'demo-student'

  const handleTrackJob = async (job) => {
    try {
      await createApplication({
        company: job.company,
        role: job.title,
        location: job.location,
        status: 'Saved',
        job_id: job.job_id,
        description: job.description
      })
      setTrackedJobIds(prev => new Set([...prev, job.job_id]))
      setTrackNotification(`Saved "${job.title}" at ${job.company} to Applications tracker!`)
      setTimeout(() => setTrackNotification(''), 4000)
    } catch {
      setTrackedJobIds(prev => new Set([...prev, job.job_id]))
      setTrackNotification(`Saved "${job.title}" locally.`)
      setTimeout(() => setTrackNotification(''), 4000)
    }
  }


  const fetchJobsList = async () => {
    try {
      setLoading(true)
      const data = await getJobs({ user_id: userId })
      if (data && data.jobs) {
        setJobs(data.jobs)
      } else if (Array.isArray(data)) {
        setJobs(data)
      }
    } catch (err) {
      console.warn('Could not fetch jobs from backend:', err)
      // Fallback baseline listings
      setJobs([
        {
          job_id: 'job_sample_1',
          title: 'Frontend Engineer',
          company: 'Northstar Labs',
          location: 'Remote',
          description: 'Looking for React, JavaScript, CSS, and modern web architecture experience.',
          required_skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Git'],
          preferred_skills: ['TypeScript', 'Tailwind CSS'],
          experience_requirements: ['2+ years experience']
        },
        {
          job_id: 'job_sample_2',
          title: 'Full Stack Engineer',
          company: 'TechNova',
          location: 'Bengaluru',
          description: 'Building high-throughput FastAPI and React microservices on AWS.',
          required_skills: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker'],
          preferred_skills: ['AWS', 'Redis', 'Kubernetes'],
          experience_requirements: ['3+ years experience']
        },
        {
          job_id: 'job_sample_3',
          title: 'Backend Systems Engineer',
          company: 'Orbit Cloud',
          location: 'Remote',
          description: 'Designing distributed services, database schemas, and caching layers.',
          required_skills: ['Python', 'SQL', 'FastAPI', 'PostgreSQL', 'System Design'],
          preferred_skills: ['Kafka', 'Docker', 'Kubernetes'],
          experience_requirements: ['3+ years experience']
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobsList()
    getResumes(userId).then(res => {
      const list = res.resumes || res || []
      setUserResumes(list)
      if (list.length > 0 && list[0].analysis?.resume_skills) {
        setCandidateSkills(list[0].analysis.resume_skills)
      }
    }).catch(() => {})
  }, [])

  const handleCreateJob = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDescription.trim()) return
    try {
      setSubmitting(true)
      await createJob({
        user_id: userId,
        title: newTitle,
        company: newCompany || 'Tech Company',
        location: newLocation,
        job_url: 'https://example.com/job',
        description: newDescription,
        required_skills: newDescription.match(/[A-Z][a-zA-Z0-9+#]+/g)?.slice(0, 6) || ['Python', 'FastAPI']
      })
      setShowAddModal(false)
      setNewTitle('')
      setNewCompany('')
      setNewDescription('')
      await fetchJobsList()
    } catch (err) {
      alert('Error creating job: ' + (err.response?.data?.detail || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleMatch = async (job) => {
    setMatchingJobId(job.job_id)
    setMatchResult(null)
    try {
      const res = await matchJob(job.job_id, {
        user_id: userId,
        candidate_skills: candidateSkills,
        education: 'B.Tech in Computer Science',
        experience_years: 3.0,
        target_role: job.title
      })
      setMatchResult({ jobId: job.job_id, data: res })
    } catch (err) {
      console.error('Match failed:', err)
      // Client-side fallback calculation
      const req = job.required_skills || []
      const matched = req.filter(s => candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase()))
      const score = req.length ? Math.round((matched.length / req.length) * 100) : 75
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
      })
    } finally {
      setMatchingJobId(null)
    }
  }

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase())
    const matchesLoc = locationFilter === 'Any location' || j.location.toLowerCase().includes(locationFilter.toLowerCase())
    return matchesSearch && matchesLoc
  })

  return (
    <Page title="Find your next role" subtitle="Compare opportunities against the skills you are building with AI.">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid" style={{ alignItems: 'flex-end' }}>
          <div className="field">
            <label>Search roles or companies</label>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="e.g. Frontend Engineer, Python, TechNova" 
            />
          </div>
          <div className="field">
            <label>Location</label>
            <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
              <option>Any location</option>
              <option>Remote</option>
              <option>Bengaluru</option>
              <option>New York, NY</option>
              <option>San Francisco, CA</option>
            </select>
          </div>
          <div className="field" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="button" onClick={() => setShowAddModal(!showAddModal)}>
              {showAddModal ? 'Close Form' : '+ Add Custom Job'}
            </button>
          </div>
        </div>

        {showAddModal && (
          <form onSubmit={handleCreateJob} style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 15 }}>Add & Parse New Job Description</h3>
            <div className="form-grid">
              <div className="field">
                <label>Job Title *</label>
                <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
              </div>
              <div className="field">
                <label>Company Name</label>
                <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <div className="field">
                <label>Location</label>
                <input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Remote / Hybrid" />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Job Description / Requirements *</label>
                <textarea 
                  required 
                  rows={5} 
                  value={newDescription} 
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Paste the full job description here. Our Job Agent will automatically extract required skills, qualifications, and experience..." 
                />
              </div>
            </div>
            <div style={{ marginTop: 15, display: 'flex', gap: 10 }}>
              <button type="submit" className="button" disabled={submitting}>
                {submitting ? 'Parsing & Saving...' : 'Save & Analyze Job'}
              </button>
              <button type="button" className="button secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      <div className="section-head">
        <h2>Available Opportunities</h2>
        <span className="tag">{filteredJobs.length} {filteredJobs.length === 1 ? 'role' : 'roles'}</span>
      </div>

      {trackNotification && (
        <div className="notice" style={{ marginBottom: 15, borderColor: '#16a34a', background: 'rgba(22,163,74,0.08)', color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          <span>{trackNotification}</span>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : filteredJobs.length === 0 ? (
        <div className="card empty">No jobs matched your filter. Try adjusting your search.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {filteredJobs.map((job) => {
            const isMatching = matchingJobId === job.job_id
            const currentMatch = matchResult?.jobId === job.job_id ? matchResult.data : null

            return (
              <div key={job.job_id} className="card" style={{ transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 18, marginBottom: 4 }}>{job.title}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: 14 }}>{job.company} · {job.location || 'Remote'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {currentMatch && (
                      <div style={{ textAlign: 'right' }}>
                        <span className="tag" style={{ fontSize: 14, fontWeight: 700, padding: '4px 10px', background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                          {currentMatch.job_match_score}% Match
                        </span>
                      </div>
                    )}
                    <button 
                      className="button secondary" 
                      onClick={() => handleMatch(job)}
                      disabled={isMatching}
                    >
                      {isMatching ? 'Matching...' : currentMatch ? 'Re-calculate Match' : 'Match with Resume'}
                    </button>
                  </div>
                </div>

                <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary, #475569)', lineHeight: 1.5 }}>
                  {job.description?.length > 200 ? job.description.substring(0, 200) + '...' : job.description}
                </p>

                {job.required_skills && job.required_skills.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginRight: 4 }}>Required Skills:</span>
                    {job.required_skills.map((skill, i) => (
                      <span key={i} className="tag" style={{ fontSize: 12 }}>{skill}</span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link
                    to={`/jobs/${job.job_id}`}
                    className="button secondary"
                    style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    View Details & AI Fit <ArrowRight size={13} />
                  </Link>
                  <button
                    className="button secondary"
                    style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onClick={() => handleTrackJob(job)}
                    disabled={trackedJobIds.has(job.job_id)}
                  >
                    {trackedJobIds.has(job.job_id) ? (
                      <><CheckCircle2 size={13} color="#16a34a" /> Tracked in Applications</>
                    ) : (
                      <><BookmarkPlus size={13} /> Track Application</>
                    )}
                  </button>
                </div>

                {/* Match Result Breakdown Drawer */}
                {currentMatch && (
                  <div style={{ marginTop: 18, paddingTop: 15, borderTop: '1px solid var(--border)', background: 'var(--bg-subtle, #f8fafc)', padding: 15, borderRadius: 8 }}>
                    <h4 style={{ fontSize: 15, marginBottom: 10 }}>AI Match Breakdown</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
                      <div className="card" style={{ padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Skill Match</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb' }}>{currentMatch.skill_match}%</div>
                      </div>
                      <div className="card" style={{ padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Education</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{currentMatch.education_match}%</div>
                      </div>
                      <div className="card" style={{ padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Experience</div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{currentMatch.experience_match}%</div>
                      </div>
                      <div className="card" style={{ padding: 10, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Eligibility</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: currentMatch.eligible ? '#16a34a' : '#dc2626' }}>
                          {currentMatch.eligible ? '✓ Eligible' : '✗ Below Req'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                      <div>
                        <strong style={{ fontSize: 13, color: '#16a34a' }}>✓ Matched Skills ({currentMatch.matched_skills?.length || 0}):</strong>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                          {currentMatch.matched_skills?.length ? (
                            currentMatch.matched_skills.map((s, idx) => (
                              <span key={idx} className="tag" style={{ background: '#dcfce7', color: '#166534', fontSize: 12 }}>{s}</span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>None matched yet</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong style={{ fontSize: 13, color: '#dc2626' }}>✗ Missing Skills ({currentMatch.missing_skills?.length || 0}):</strong>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                          {currentMatch.missing_skills?.length ? (
                            currentMatch.missing_skills.map((s, idx) => (
                              <span key={idx} className="tag" style={{ background: '#fee2e2', color: '#991b1b', fontSize: 12 }}>{s}</span>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: '#16a34a' }}>All required skills matched!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Page>
  )
}
