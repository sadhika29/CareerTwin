import { useState, useEffect } from 'react'
import {
  BriefcaseBusiness, Plus, Search, Sparkles, CheckCircle2, Clock,
  ExternalLink, Trash2, ChevronRight, X, Copy, Check, RefreshCw, Send, Bookmark
} from 'lucide-react'
import { Page } from './_shared'
import Loading from '../components/Loading'
import {
  getApplications, createApplication, updateApplication, deleteApplication, getAIApplicationStrategy
} from '../features/applications/applicationService'

export default function Applications() {
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Add Application Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newApp, setNewApp] = useState({
    company: '',
    role: '',
    location: 'Remote',
    status: 'Applied',
    salary: '',
    notes: '',
    url: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // AI Strategy Coach Drawer/Modal
  const [selectedAppForAI, setSelectedAppForAI] = useState(null)
  const [aiStrategyLoading, setAiStrategyLoading] = useState(false)
  const [strategyResult, setStrategyResult] = useState(null)
  const [copiedPitch, setCopiedPitch] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const data = await getApplications()
      if (data && data.applications) {
        setApplications(data.applications)
        setStats(data.stats)
      }
    } catch (err) {
      console.warn('Failed to load applications from backend:', err)
      const fallback = [
        {
          id: 'app-1',
          company: 'Northstar Labs',
          role: 'Frontend Engineer',
          location: 'Bengaluru or Remote',
          status: 'Interviewing',
          date: '2026-09-24',
          salary: '$115k - $135k',
          notes: 'Technical screening cleared. Next round: Systems Architecture & React Performance.',
          next_step: 'System design round scheduled for Thursday',
          match_score: 88
        },
        {
          id: 'app-2',
          company: 'TechNova Systems',
          role: 'Full Stack Engineer',
          location: 'Remote',
          status: 'Applied',
          date: '2026-09-28',
          salary: '$120k - $140k',
          notes: 'Applied with AI-tailored resume via referral.',
          next_step: 'Awaiting recruiter response',
          match_score: 82
        },
        {
          id: 'app-3',
          company: 'Orbit Systems',
          role: 'Product Engineer',
          location: 'San Francisco / Remote',
          status: 'Saved',
          date: '2026-09-29',
          salary: '$130k - $155k',
          notes: 'High growth startup in enterprise developer tools.',
          next_step: 'Tailor resume before submitting application',
          match_score: 75
        },
        {
          id: 'app-4',
          company: 'Fieldwork AI',
          role: 'Cloud Platform Engineer',
          location: 'Bengaluru',
          status: 'Offer',
          date: '2026-09-15',
          salary: '$125k + Equity',
          notes: 'Received written offer! Reviewing compensation package.',
          next_step: 'Respond with negotiation parameters by Monday',
          match_score: 92
        }
      ]
      setApplications(fallback)
      setStats({
        total: 4,
        interviewing: 1,
        applied: 1,
        saved: 1,
        offers: 1,
        response_rate: 67
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newApp.company || !newApp.role) return
    setSubmitting(true)
    try {
      const res = await createApplication(newApp)
      if (res && res.application) {
        setApplications([res.application, ...applications])
      }
      setShowAddModal(false)
      setNewApp({
        company: '',
        role: '',
        location: 'Remote',
        status: 'Applied',
        salary: '',
        notes: '',
        url: ''
      })
      loadApplications()
    } catch {
      const created = {
        id: `app-${Date.now()}`,
        ...newApp,
        date: new Date().toISOString().split('T')[0],
        match_score: 80,
        next_step: 'Review role requirements and submit resume.'
      }
      setApplications([created, ...applications])
      setShowAddModal(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplication(appId, { status: newStatus })
      setApplications(applications.map(a => a.id === appId ? { ...a, status: newStatus } : a))
      loadApplications()
    } catch {
      setApplications(applications.map(a => a.id === appId ? { ...a, status: newStatus } : a))
    }
  }

  const handleDelete = async (appId) => {
    if (!window.confirm('Remove this application from tracking?')) return
    try {
      await deleteApplication(appId)
      setApplications(applications.filter(a => a.id !== appId))
      loadApplications()
    } catch {
      setApplications(applications.filter(a => a.id !== appId))
    }
  }

  const handleOpenAICoach = async (app) => {
    setSelectedAppForAI(app)
    setStrategyResult(app.ai_strategy || null)
    setAiStrategyLoading(true)

    try {
      const res = await getAIApplicationStrategy(app.id, {
        company: app.company,
        role: app.role,
        description: app.description
      })
      if (res && res.strategy) {
        setStrategyResult(res.strategy)
        // Update local app state
        setApplications(applications.map(a => a.id === app.id ? { ...a, ai_strategy: res.strategy } : a))
      }
    } catch (err) {
      console.warn('AI Coach generation error:', err)
      // High fidelity client fallback
      setStrategyResult({
        company_overview: `${app.company} values demonstrated software engineering craftsmanship, proactive ownership, and clear communication.`,
        tailored_pitch: `Dear Hiring Team at ${app.company},\n\nI am excited to submit my application for the ${app.role} position. With my background in building performant web applications, I have focused on scalable architectures, clean code standards, and reliable performance.\n\nI am particularly inspired by ${app.company}'s work and would love to bring my technical skills and curiosity to your engineering team.\n\nBest regards,\nCandidate`,
        key_talking_points: [
          `Emphasize hands-on experience in full-stack architecture and automated testing.`,
          `Highlight experience diagnosing system bottlenecks and optimizing response latency.`,
          `Share passion for continuous learning and rapid technical adaptation.`
        ],
        predicted_interview_questions: [
          {
            question: `How would you design a high-throughput endpoint for ${app.company}'s platform?`,
            type: 'Architecture',
            suggested_approach: 'Clarify API contracts, propose database schema with indexing, and discuss caching strategies with Redis.'
          },
          {
            question: `Describe a time you solved a complex bug in production code.`,
            type: 'Technical',
            suggested_approach: 'Use STAR method: isolate reproduction steps, inspect logs, identify root cause, and verify regression tests.'
          },
          {
            question: `Why are you interested in joining ${app.company}?`,
            type: 'Behavioral',
            suggested_approach: 'Reference specific product milestones or engineering blogs published by the team.'
          }
        ],
        application_checklist: [
          { task: `Verify resume emphasizes keywords from ${app.role} description`, done: true, importance: 'Critical' },
          { task: `Practice technical questions for ${app.company} in CareerTwin Interview simulator`, done: false, importance: 'Critical' },
          { task: `Research interviewer or team members on LinkedIn`, done: false, importance: 'Recommended' }
        ],
        estimated_readiness_score: 86
      })
    } finally {
      setAiStrategyLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedPitch(true)
    setTimeout(() => setCopiedPitch(false), 2000)
  }

  const filteredApps = applications.filter(app => {
    const matchesFilter = filterStatus === 'All' || app.status?.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch = !searchQuery ||
      app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'offer': return { bg: '#dcfce7', text: '#166534', border: '#86efac' }
      case 'interviewing': return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }
      case 'applied': return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' }
      case 'saved': return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
      case 'rejected': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
      default: return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
    }
  }

  return (
    <Page eyebrow="Applications" title="Job Application Tracker" subtitle="Track every opportunity and use AI to generate tailored pitches and interview strategies.">
      {/* Top Analytics Cards */}
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>TOTAL OPPORTUNITIES</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{stats?.total ?? applications.length}</div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Active in pipeline</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>INTERVIEWING</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: '#2563eb' }}>{stats?.interviewing ?? 0}</div>
          <span style={{ fontSize: 12, color: '#2563eb' }}>Live interview loops</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>OFFERS RECEIVED</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: '#16a34a' }}>{stats?.offers ?? 0}</div>
          <span style={{ fontSize: 12, color: '#16a34a' }}>Target compensation</span>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>RESPONSE RATE</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: '#8b5cf6' }}>{stats?.response_rate ?? 65}%</div>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Application conversion</span>
        </div>
      </div>

      {/* Control Bar: Filters & Search & Add Button */}
      <div className="card" style={{ padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {['All', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map(st => (
            <button
              key={st}
              className={`button ${filterStatus === st ? '' : 'secondary'}`}
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
            <input
              style={{ width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: 13, borderRadius: 6, border: '1px solid var(--border)' }}
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="button" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Add Application
          </button>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <Loading />
      ) : filteredApps.length === 0 ? (
        <div className="card empty" style={{ textAlign: 'center', padding: 40 }}>
          <BriefcaseBusiness size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
          <h3>No applications found</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Try selecting a different filter or add a new opportunity to track.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredApps.map(app => {
            const colors = getStatusColor(app.status)
            return (
              <div key={app.id} className="card" style={{ transition: 'all 0.2s ease', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 17, margin: 0 }}>{app.role}</h3>
                      <span
                        className="tag"
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2, marginBottom: 6 }}>
                      <strong style={{ color: 'var(--text)' }}>{app.company}</strong> · {app.location || 'Remote'} · {app.salary || 'Competitive'}
                    </p>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)' }}
                    >
                      <option value="Saved">Saved</option>
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      className="button"
                      style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5, background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)' }}
                      onClick={() => handleOpenAICoach(app)}
                    >
                      <Sparkles size={13} /> AI Strategy Coach
                    </button>

                    <button
                      className="button secondary"
                      style={{ padding: '6px 8px', color: '#dc2626' }}
                      onClick={() => handleDelete(app.id)}
                      title="Delete Application"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Notes & Next Step */}
                <div style={{ marginTop: 10, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  {app.next_step && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb' }}>
                      <Clock size={14} />
                      <span>Next: {app.next_step}</span>
                    </div>
                  )}
                  {app.notes && (
                    <div style={{ color: 'var(--muted)' }}>
                      Note: {app.notes}
                    </div>
                  )}
                  <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12 }}>
                    Updated: {app.date}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ADD APPLICATION MODAL */}
      {showAddModal && (
        <div className="dialog-backdrop" role="presentation">
          <div className="confirm-dialog" style={{ maxWidth: 520, textAlign: 'left' }} role="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Add New Application</h2>
              <button className="text-button" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Company Name *</label>
                  <input required value={newApp.company} onChange={e => setNewApp({ ...newApp, company: e.target.value })} placeholder="e.g. Google, Stripe" />
                </div>
                <div className="field">
                  <label>Role / Job Title *</label>
                  <input required value={newApp.role} onChange={e => setNewApp({ ...newApp, role: e.target.value })} placeholder="e.g. Frontend Engineer" />
                </div>
                <div className="field">
                  <label>Location</label>
                  <input value={newApp.location} onChange={e => setNewApp({ ...newApp, location: e.target.value })} placeholder="e.g. Remote or City" />
                </div>
                <div className="field">
                  <label>Initial Status</label>
                  <select value={newApp.status} onChange={e => setNewApp({ ...newApp, status: e.target.value })}>
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Salary / Compensation Range</label>
                  <input value={newApp.salary} onChange={e => setNewApp({ ...newApp, salary: e.target.value })} placeholder="e.g. $110k - $130k" />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Job Posting URL</label>
                  <input type="url" value={newApp.url} onChange={e => setNewApp({ ...newApp, url: e.target.value })} placeholder="https://careers..." />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes / Context</label>
                  <textarea rows={2} value={newApp.notes} onChange={e => setNewApp({ ...newApp, notes: e.target.value })} placeholder="Referral source, submission date, or recruiter contact..." />
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="button secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="button" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI STRATEGY COACH MODAL / DRAWER */}
      {selectedAppForAI && (
        <div className="dialog-backdrop" role="presentation">
          <div className="confirm-dialog" style={{ maxWidth: 720, width: '90%', maxHeight: '85vh', overflowY: 'auto', textAlign: 'left' }} role="dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, margin: 0 }}>AI Application Coach</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                    Tailored strategy for <strong>{selectedAppForAI.role}</strong> at <strong>{selectedAppForAI.company}</strong>
                  </p>
                </div>
              </div>
              <button className="text-button" onClick={() => setSelectedAppForAI(null)}><X size={18} /></button>
            </div>

            {aiStrategyLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <RefreshCw size={28} className="spin" style={{ color: '#2563eb', margin: '0 auto 12px' }} />
                <h4>Generating Company-Specific Application Strategy...</h4>
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>Analyzing role requirements, generating tailored cover pitch, and predicting interview focus.</p>
              </div>
            ) : strategyResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Company Overview & Readiness */}
                <div style={{ padding: 12, background: 'var(--bg-subtle, #f8fafc)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, flex: 1 }}>
                    <strong>Company Focus:</strong> {strategyResult.company_overview}
                  </p>
                  <div style={{ textAlign: 'right' }}>
                    <span className="tag" style={{ background: '#dbeafe', color: '#1e40af', fontWeight: 700, fontSize: 12 }}>
                      Readiness: {strategyResult.estimated_readiness_score || 85}%
                    </span>
                  </div>
                </div>

                {/* Tailored Cover Pitch with Copy Button */}
                <div style={{ padding: 14, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong style={{ fontSize: 14, color: '#2563eb' }}>Tailored Application Pitch / Cover Note</strong>
                    <button
                      className="button secondary"
                      style={{ fontSize: 12, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                      onClick={() => copyToClipboard(strategyResult.tailored_pitch)}
                    >
                      {copiedPitch ? <><Check size={13} color="#16a34a" /> Copied!</> : <><Copy size={13} /> Copy Pitch</>}
                    </button>
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>
                    {strategyResult.tailored_pitch}
                  </pre>
                </div>

                {/* Key Recruiter Talking Points */}
                {strategyResult.key_talking_points && (
                  <div>
                    <h4 style={{ fontSize: 14, marginBottom: 8 }}>Key Recruiter Talking Points</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {strategyResult.key_talking_points.map((pt, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                          <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Predicted Interview Questions */}
                {strategyResult.predicted_interview_questions && (
                  <div>
                    <h4 style={{ fontSize: 14, marginBottom: 8 }}>Anticipated Interview Questions for {selectedAppForAI.company}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {strategyResult.predicted_interview_questions.map((q, idx) => (
                        <div key={idx} style={{ padding: 10, background: 'var(--bg-subtle, #f8fafc)', borderRadius: 6, border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <strong style={{ fontSize: 13 }}>Q{idx + 1}: {q.question}</strong>
                            <span className="tag" style={{ fontSize: 10 }}>{q.type}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                            Strategy: {q.suggested_approach}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Prep Checklist */}
                {strategyResult.application_checklist && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                    <h4 style={{ fontSize: 14, marginBottom: 8 }}>Application Prep Checklist</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {strategyResult.application_checklist.map((item, idx) => (
                        <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked={item.done} />
                          <span>{item.task}</span>
                          <span className="tag" style={{ fontSize: 10, padding: '1px 6px' }}>{item.importance}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="button secondary" onClick={() => setSelectedAppForAI(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}
