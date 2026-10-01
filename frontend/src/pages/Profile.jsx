import { useState, useEffect } from 'react'
import {
  BriefcaseBusiness, GraduationCap, LogOut, Pencil, ShieldCheck, UserRound,
  Sparkles, CheckCircle2, ArrowRight, RefreshCw, BookmarkCheck, Target, Lightbulb
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../features/auth/authService'
import { getProfile, updateProfile, runAIProfileAdvisor, applyAIPersona } from '../features/profile/profileService'
import { Page } from './_shared'
import Loading from '../components/Loading'

export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    target_role: '',
    education: '',
    graduation_year: '',
    skills_text: '',
    interests: '',
    dream_companies_text: '',
    bio: ''
  })

  // AI Career Advisor interactive state
  const [advisorInput, setAdvisorInput] = useState('')
  const [analyzingAdvisor, setAnalyzingAdvisor] = useState(false)
  const [advisorResult, setAdvisorResult] = useState(null)
  const [applyingPersona, setApplyingPersona] = useState(false)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const data = await getProfile()
      if (data && data.profile) {
        setProfile(data.profile)
        populateForm(data.profile)
      }
    } catch (err) {
      console.warn('Could not load profile from backend, using baseline:', err)
      const fallback = {
        full_name: 'Navya Sharma',
        username: 'navya',
        email: 'navya@example.com',
        target_role: 'Full Stack Engineer',
        education: 'B.Tech Computer Science & Engineering',
        graduation_year: '2027',
        skills: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'Git'],
        interests: 'Scalable cloud distributed systems, modern AI-native applications, web performance',
        dream_companies: ['Google', 'Stripe', 'Microsoft', 'Atlassian'],
        bio: 'Passionate engineering student building high-performance web applications and mastering distributed systems.',
        ai_persona: {
          career_persona_title: 'Aspiring Full Stack & Cloud Systems Engineer',
          executive_summary: 'High-potential software engineering student combining strong Python/React full-stack acumen with deep passion for distributed cloud architecture.',
          elevator_pitch: 'I build robust, full-stack web applications with Python, FastAPI, and React, focusing on resilient system architecture and seamless user experiences.',
          top_priority_skills: ['System Design', 'Docker', 'PostgreSQL', 'FastAPI', 'React'],
          immediate_actions: [
            { action: 'Simulate technical architecture mock interview', impact: 'Critical', timeframe: 'This week' },
            { action: 'Complete Docker containerization project', impact: 'High', timeframe: 'Next 7 days' }
          ]
        }
      }
      setProfile(fallback)
      populateForm(fallback)
    } finally {
      setLoading(false)
    }
  }

  const populateForm = (p) => {
    setForm({
      full_name: p.full_name || '',
      username: p.username || '',
      email: p.email || '',
      target_role: p.target_role || '',
      education: p.education || '',
      graduation_year: p.graduation_year || '',
      skills_text: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ''),
      interests: p.interests || '',
      dream_companies_text: Array.isArray(p.dream_companies) ? p.dream_companies.join(', ') : '',
      bio: p.bio || ''
    })
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedMessage('')

    const updated = {
      full_name: form.full_name,
      username: form.username,
      email: form.email,
      target_role: form.target_role,
      education: form.education,
      graduation_year: form.graduation_year,
      skills: form.skills_text.split(',').map(s => s.trim()).filter(Boolean),
      interests: form.interests,
      dream_companies: form.dream_companies_text.split(',').map(s => s.trim()).filter(Boolean),
      bio: form.bio,
    }

    try {
      const res = await updateProfile(updated)
      setProfile(res.profile || updated)
      setEditing(false)
      setSavedMessage('Profile updated and synchronized with your Career Twin.')
    } catch {
      setProfile(updated)
      setEditing(false)
      setSavedMessage('Profile updated locally.')
    } finally {
      setSaving(false)
    }
  }

  const handleRunAdvisor = async () => {
    if (!advisorInput.trim()) return
    setAnalyzingAdvisor(true)
    try {
      const res = await runAIProfileAdvisor(advisorInput, profile)
      setAdvisorResult(res)
    } catch (err) {
      console.warn('AI Advisor error:', err)
      // Client fallback simulation
      setAdvisorResult({
        intent_analysis: {
          predicted_target_role: profile?.target_role || 'Full Stack Engineer',
          underlying_intention: `Transition towards high-impact systems engineering based on your aspirations: "${advisorInput}"`,
          ambition_level: 'Specialized Lead',
          implicit_strengths: ['Algorithmic Thinking', 'Technical Curiosity', 'Rapid Learning'],
          career_archetype: 'Systems Architect'
        },
        roadmap: {
          milestones: [
            { phase: 'Phase 1: Foundations', focus: 'Data structures, algorithms & cloud basics', key_deliverable: 'Complete 30 core algorithmic patterns' },
            { phase: 'Phase 2: Production Systems', focus: 'Microservices, Docker & caching layers', key_deliverable: 'Deploy distributed full-stack application' },
            { phase: 'Phase 3: Interview Mastery', focus: 'System design & behavioral rounds', key_deliverable: 'Pass 5 mock technical interview loops' }
          ]
        },
        executive_persona: {
          career_persona_title: `High-Performance ${profile?.target_role || 'Full Stack Engineer'}`,
          executive_summary: `Engineered for modern software complexity. Combines strong full-stack proficiency with deep curiosity for scalable systems architecture.`,
          elevator_pitch: `I specialize in building resilient full stack services with Python, React, and cloud-native architecture, delivering reliable solutions from database to user interface.`,
          top_priority_skills: ['System Design', 'Docker', 'PostgreSQL', 'FastAPI', 'Distributed Caching'],
          immediate_actions: [
            { action: 'Practice 2 technical mock interviews in CareerTwin', impact: 'Critical', timeframe: 'Next 3 days' },
            { action: 'Review weak topics in DSA assessment', impact: 'High', timeframe: 'This weekend' }
          ]
        }
      })
    } finally {
      setAnalyzingAdvisor(false)
    }
  }

  const handleApplyPersona = async () => {
    setApplyingPersona(true)
    try {
      const res = await applyAIPersona()
      if (res && res.profile) {
        setProfile(res.profile)
        populateForm(res.profile)
      }
      setSavedMessage('AI Persona recommendations successfully adopted into your active profile.')
    } catch {
      if (advisorResult?.executive_persona) {
        const p = { ...profile }
        if (advisorResult.executive_persona.target_role) {
          p.target_role = advisorResult.executive_persona.target_role
        }
        if (advisorResult.executive_persona.top_priority_skills) {
          p.skills = Array.from(new Set([...(p.skills || []), ...advisorResult.executive_persona.top_priority_skills]))
        }
        setProfile(p)
        populateForm(p)
      }
      setSavedMessage('AI recommendations adopted locally.')
    } finally {
      setApplyingPersona(false)
    }
  }

  const logout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  if (loading) return <Page eyebrow="Account" title="Your Profile" subtitle="Loading career profile..."><Loading /></Page>

  const persona = profile?.ai_persona

  return (
    <Page eyebrow="Account" title="Your Career Profile" subtitle="Manage your profile, target roles, and AI Career Twin persona.">
      {/* Profile Header Hero */}
      <div className="profile-hero card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 220, height: 220, background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="profile-avatar">
          {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="profile-identity">
          <div className="eyebrow">Verified Student Profile</div>
          <h2>{profile?.full_name || 'Student'}</h2>
          <p>@{profile?.username || 'user'} · {profile?.email || 'user@example.com'}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="tag" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb', fontWeight: 600 }}>
              {profile?.target_role || 'Software Engineer'}
            </span>
            <span className="tag">{profile?.education || 'Computer Science'}</span>
            <span className="tag">Class of {profile?.graduation_year || '2027'}</span>
          </div>
        </div>
        <button className="button secondary profile-edit" onClick={() => setEditing(!editing)}>
          <Pencil size={15} />
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {savedMessage && (
        <div className="notice" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, borderColor: '#16a34a', background: 'rgba(22,163,74,0.08)', color: '#166534' }}>
          <CheckCircle2 size={16} />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Editing Mode */}
      {editing ? (
        <form className="card profile-form" onSubmit={handleSaveProfile} style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Edit Career Profile</h3>
          <div className="form-grid">
            <div className="field">
              <label>Full Name</label>
              <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="field">
              <label>Username</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="field">
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label>Target Career Role</label>
              <input value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value })} placeholder="e.g. Full Stack Engineer, Cloud Architect" required />
            </div>
            <div className="field">
              <label>Degree / Education</label>
              <input value={form.education} onChange={e => setForm({ ...form, education: e.target.value })} placeholder="e.g. B.Tech Computer Science" />
            </div>
            <div className="field">
              <label>Graduation Year</label>
              <input value={form.graduation_year} onChange={e => setForm({ ...form, graduation_year: e.target.value })} placeholder="e.g. 2027" />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Current Technical Skills (comma-separated)</label>
              <input value={form.skills_text} onChange={e => setForm({ ...form, skills_text: e.target.value })} placeholder="Python, React, FastAPI, Docker, SQL, Git..." />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Dream Companies / Target Sectors (comma-separated)</label>
              <input value={form.dream_companies_text} onChange={e => setForm({ ...form, dream_companies_text: e.target.value })} placeholder="Google, Microsoft, Stripe, Atlassian..." />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Career Interests & Passion Areas</label>
              <textarea rows={3} value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })} placeholder="e.g. Scalable distributed systems, AI-native products, frontend performance..." />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Professional Bio</label>
              <textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Short statement summarizing your engineering focus and career direction..." />
            </div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
            <button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
          {/* Information Cards Grid */}
          <div className="grid grid-2 profile-sections">
            <section className="card info-card">
              <div className="info-card-title">
                <span><UserRound size={19} /></span>
                <h2>Personal & Identity</h2>
              </div>
              <div className="profile-info"><span>Full Name</span><strong>{profile?.full_name}</strong></div>
              <div className="profile-info"><span>Username</span><strong>@{profile?.username}</strong></div>
              <div className="profile-info"><span>Email</span><strong>{profile?.email}</strong></div>
              <div className="profile-info"><span>Bio</span><p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{profile?.bio || 'No bio provided'}</p></div>
            </section>

            <section className="card info-card">
              <div className="info-card-title">
                <span><BriefcaseBusiness size={19} /></span>
                <h2>Target Career & Skills</h2>
              </div>
              <div className="profile-info"><span>Target Role</span><strong style={{ color: '#2563eb' }}>{profile?.target_role}</strong></div>
              <div className="profile-info">
                <span>Active Skills</span>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, i) => <span key={i} className="tag">{skill}</span>)
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>No skills listed</span>
                  )}
                </div>
              </div>
              <div className="profile-info">
                <span>Dream Companies</span>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                  {profile?.dream_companies?.map((c, i) => (
                    <span key={i} className="tag" style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}>{c}</span>
                  ))}
                </div>
              </div>
              <div className="profile-info"><span>Interests</span><p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{profile?.interests}</p></div>
            </section>

            <section className="card info-card">
              <div className="info-card-title">
                <span><GraduationCap size={19} /></span>
                <h2>Education & Academic</h2>
              </div>
              <div className="profile-info"><span>Degree</span><strong>{profile?.education || 'Computer Science'}</strong></div>
              <div className="profile-info"><span>Expected Graduation</span><strong>{profile?.graduation_year || '2027'}</strong></div>
              <div className="profile-info"><span>Status</span><span className="tag" style={{ background: '#dcfce7', color: '#166534' }}>Undergraduate In Good Standing</span></div>
            </section>

            <section className="card info-card">
              <div className="info-card-title">
                <span><ShieldCheck size={19} /></span>
                <h2>Account & Privacy</h2>
              </div>
              <div className="profile-info"><span>Authentication</span><strong>Email & Password (JWT)</strong></div>
              <div className="profile-info"><span>Career Twin Sync</span><strong>Real-time AI Active</strong></div>
              <div className="profile-info"><span>Data Sharing</span><strong>Private to your account</strong></div>
            </section>
          </div>

          {/* MULTI-AGENT AI CAREER ADVISOR & AMBITION DIAGNOSTICS */}
          <div className="card" style={{ border: '1px solid rgba(139,92,246,0.25)', background: 'linear-gradient(180deg, rgba(139,92,246,0.03) 0%, rgba(37,99,235,0.03) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, margin: 0 }}>Multi-Agent AI Career Advisor</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                    Type your unvarnished career aspirations — our 3-stage AI analyzes your intent, synthesizes a roadmap, and refines your executive persona.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <input
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}
                placeholder="e.g. 'I know basic Python & React, and I want to work at top tech companies building distributed AI systems...'"
                value={advisorInput}
                onChange={e => setAdvisorInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRunAdvisor()}
              />
              <button
                className="button"
                onClick={handleRunAdvisor}
                disabled={analyzingAdvisor || !advisorInput.trim()}
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {analyzingAdvisor ? (
                  <><RefreshCw size={15} className="spin" /> Cascading AI Agents...</>
                ) : (
                  <><Sparkles size={15} /> Analyze Intent & Refine</>
                )}
              </button>
            </div>

            {/* AI Advisor 3-Stage Result Display */}
            {advisorResult && (
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Stage 1: Intent Diagnosis */}
                <div style={{ padding: 14, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span className="tag" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: 11, fontWeight: 700 }}>STAGE 1: INTENT DIAGNOSIS</span>
                    <strong style={{ fontSize: 14 }}>Predicted Target: {advisorResult.intent_analysis?.predicted_target_role}</strong>
                    <span className="tag" style={{ fontSize: 11 }}>{advisorResult.intent_analysis?.career_archetype}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
                    {advisorResult.intent_analysis?.underlying_intention}
                  </p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Implicit Strengths:</span>
                    {advisorResult.intent_analysis?.implicit_strengths?.map((s, idx) => (
                      <span key={idx} className="tag" style={{ fontSize: 11, background: 'rgba(22,163,74,0.1)', color: '#166534' }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* Stage 2: Synthesized Roadmap */}
                {advisorResult.roadmap?.milestones && (
                  <div style={{ padding: 14, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span className="tag" style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700 }}>STAGE 2: SYNTHESIZED ROADMAP</span>
                      <strong style={{ fontSize: 14 }}>Target Competencies & Milestones</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                      {advisorResult.roadmap.milestones.map((m, idx) => (
                        <div key={idx} style={{ padding: 10, background: 'var(--bg-subtle, #f8fafc)', borderRadius: 6, border: '1px solid var(--border)' }}>
                          <strong style={{ fontSize: 13, color: '#2563eb' }}>{m.phase}</strong>
                          <p style={{ fontSize: 12, margin: '4px 0', color: 'var(--text)' }}>{m.focus}</p>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Deliverable: {m.key_deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage 3: Refined Executive Persona */}
                {advisorResult.executive_persona && (
                  <div style={{ padding: 16, background: 'rgba(37,99,235,0.04)', borderRadius: 8, border: '1px solid rgba(37,99,235,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      <div>
                        <span className="tag" style={{ background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 700 }}>STAGE 3: REFINED EXECUTIVE PERSONA</span>
                        <h4 style={{ fontSize: 16, margin: '6px 0 2px 0' }}>{advisorResult.executive_persona.career_persona_title}</h4>
                      </div>
                      <button
                        className="button"
                        onClick={handleApplyPersona}
                        disabled={applyingPersona}
                        style={{ fontSize: 13, padding: '6px 14px' }}
                      >
                        {applyingPersona ? 'Applying...' : 'Adopt AI Persona into Profile'}
                      </button>
                    </div>

                    <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)', marginBottom: 10 }}>
                      {advisorResult.executive_persona.executive_summary}
                    </p>

                    <div style={{ padding: 10, background: 'var(--surface)', borderRadius: 6, borderLeft: '3px solid #2563eb', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 2 }}>READY-TO-USE ELEVATOR PITCH</span>
                      <p style={{ fontSize: 13, fontStyle: 'italic', margin: 0, color: 'var(--text)' }}>
                        "{advisorResult.executive_persona.elevator_pitch}"
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Priority Skills to Target:</span>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                          {advisorResult.executive_persona.top_priority_skills?.map((s, idx) => (
                            <span key={idx} className="tag" style={{ background: '#ede9fe', color: '#5b21b6' }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Immediate Action Items:</span>
                        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {advisorResult.executive_persona.immediate_actions?.map((act, idx) => (
                            <div key={idx} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#2563eb' }}>•</span>
                              <span>{act.action}</span>
                              <span className="tag" style={{ fontSize: 10, padding: '1px 6px' }}>{act.timeframe}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Existing Active Persona Snapshot if not running advisor */}
            {!advisorResult && persona && (
              <div style={{ marginTop: 16, padding: 14, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <span className="tag" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', fontSize: 11, fontWeight: 700 }}>ACTIVE AI CAREER PERSONA</span>
                <h4 style={{ fontSize: 15, margin: '6px 0 4px 0' }}>{persona.career_persona_title}</h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 8px 0', lineHeight: 1.5 }}>{persona.executive_summary}</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {persona.top_priority_skills?.map((s, idx) => <span key={idx} className="tag">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sign Out Card */}
      <div className="account-actions card" style={{ marginTop: 24 }}>
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>Sign out of CareerTwin?</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>End your active session on this device. Your career progress is saved.</p>
        </div>
        <button className="signout-button" onClick={() => setConfirming(true)}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {confirming && (
        <div className="dialog-backdrop" role="presentation">
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="signout-title">
            <div className="dialog-icon"><LogOut size={19} /></div>
            <h2 id="signout-title">Sign out of CareerTwin?</h2>
            <p>Are you sure you want to end your current session?</p>
            <div className="dialog-actions">
              <button className="button secondary" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="signout-button" onClick={logout}>Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  )
}
