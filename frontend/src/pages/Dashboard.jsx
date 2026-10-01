import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpenCheck, BriefcaseBusiness, MessageSquareText,
  Target, Zap, TrendingUp, RefreshCw
} from 'lucide-react'
import { getCareerState, getDigitalTwin, demoCareer } from '../features/career/careerService'
import { Page, ScoreGrid } from './_shared'
import Loading from '../components/Loading'
import ScoreCard from '../components/ScoreCard'
import axiosClient from '../api/axiosClient'

const demoScores = { resume: 82, ats: 78, job_match: 76, dsa: 61, aptitude: 74, technical: 70, communication: 72, interview: 65 }

function StatCard({ label, value, color = 'var(--accent)' }) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'Manrope, sans-serif' }}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const [career, setCareer] = useState(null)
  const [twin, setTwin] = useState(null)
  const [insight, setInsight] = useState(null)
  const [state, setState] = useState('loading')

  const load = async () => {
    setState('loading')
    try {
      const [careerData, twinData] = await Promise.all([
        getCareerState().catch(() => null),
        getDigitalTwin().catch(() => null),
      ])
      setCareer(careerData?.readiness_score != null ? careerData : demoCareer)
      setTwin(twinData)
      setState(careerData?.readiness_score != null ? 'ready' : 'demo')

      // Load AI insight in background
      axiosClient.get('/dashboard/insight').then(res => {
        if (res.data?.ai_insight) setInsight(res.data.ai_insight)
      }).catch(() => {})
    } catch {
      setCareer(demoCareer)
      setState('demo')
    }
  }

  useEffect(() => { load() }, [])

  if (state === 'loading') {
    return <Page title="Your career pulse" subtitle="Loading your personalized career intelligence..."><Loading /></Page>
  }

  const scores = twin ? {
    resume: twin.resume_score || twin.resume || demoScores.resume,
    job_match: twin.job_match_score || twin.job_match || demoScores.job_match,
    dsa: twin.dsa_score || twin.dsa || demoScores.dsa,
    aptitude: twin.aptitude_score || twin.aptitude || demoScores.aptitude,
    technical: twin.technical_score || twin.technical || demoScores.technical,
    interview: twin.interview_score || twin.interview || demoScores.interview,
  } : demoScores

  const readiness = career?.readiness_score || twin?.overall_score || 72
  const nextAction = career?.next_action || insight?.next_action || 'Take your first assessment to unlock recommendations.'

  return (
    <Page eyebrow="Good morning 👋" title="Your Career Dashboard" subtitle="Everything you need to make progress toward your next role.">
      {state === 'demo' && (
        <div className="notice" style={{ marginBottom: 18 }}>
          Showing demo data. Start a career analysis to see your real readiness scores.
        </div>
      )}

      {/* Hero row */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div className="score-ring" style={{ '--score': `${readiness}%` }}>
            <strong>{readiness}%</strong>
          </div>
          <div>
            <div className="eyebrow">Overall Career Readiness</div>
            <h2 style={{ margin: '8px 0' }}>
              {readiness >= 75 ? 'Strong foundation 🚀' : readiness >= 55 ? 'Building momentum' : 'Just getting started'}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
              {insight?.summary || nextAction}
            </p>
            <Link className="button" to="/preparation">
              Continue preparation <ArrowRight size={15} style={{ marginLeft: 7 }} />
            </Link>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap size={18} color="#f59e0b" />
            <h2 style={{ margin: 0 }}>AI Next Best Action</h2>
          </div>
          {insight ? (
            <>
              <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                {insight.next_action || nextAction}
              </p>
              {insight.highlight && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--accent)11', borderLeft: '3px solid var(--accent)',
                  fontSize: 13, color: 'var(--text)', lineHeight: 1.5
                }}>
                  💡 {insight.highlight}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
                Focus your next session on the area with the highest readiness impact.
              </p>
              <strong style={{ color: 'var(--text)', fontSize: 14 }}>{nextAction}</strong>
              {state === 'demo' && (
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={11} /> AI insight loads after career analysis
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <Link className="text-button" to="/what-if">
              Explore what to improve <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="section-head"><h2>Quick Statistics</h2></div>
      <div className="grid grid-4">
        <StatCard label="Career Readiness" value={`${readiness}%`} color="var(--accent)" />
        <StatCard label="Resume Score" value={`${scores.resume}%`} color="#6366f1" />
        <StatCard label="Job Match" value={`${scores.job_match}%`} color="#10b981" />
        <StatCard label="DSA Score" value={`${scores.dsa}%`} color="#f59e0b" />
      </div>

      {/* Readiness dimensions */}
      <div className="section-head" style={{ marginTop: 24 }}>
        <h2>Readiness Dimensions</h2>
        <Link className="button secondary" to="/digital-twin">Open Digital Twin</Link>
      </div>
      <ScoreGrid scores={scores} keys={['resume', 'job_match', 'dsa', 'aptitude', 'technical', 'interview']} />

      {/* Continue journey */}
      <div className="section-head" style={{ marginTop: 24 }}><h2>Continue Your Journey</h2></div>
      <div className="grid grid-3">
        {[
          { to: '/resume', icon: <BookOpenCheck size={20} />, title: 'Resume Health', copy: 'Review your ATS signals and AI improvement suggestions.' },
          { to: '/applications', icon: <BriefcaseBusiness size={20} />, title: 'Application Tracker', copy: 'Track every opportunity, status, and next step.' },
          { to: '/interview', icon: <MessageSquareText size={20} />, title: 'AI Interview Room', copy: 'Start a mock interview and get detailed AI coaching.' },
        ].map(item => (
          <Link key={item.to} className="card" to={item.to} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ color: 'var(--accent)', marginBottom: 14 }}>{item.icon}</div>
            <h3 style={{ marginBottom: 6 }}>{item.title}</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{item.copy}</p>
          </Link>
        ))}
      </div>

      <button onClick={load} style={{ display: 'none' }} aria-label="retry">Retry</button>
    </Page>
  )
}
