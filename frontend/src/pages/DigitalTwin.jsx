import { useEffect, useState } from 'react'
import { getDigitalTwin, getReadinessHistory } from '../features/career/careerService'
import { Page, TrendChart } from './_shared'
import Loading from '../components/Loading'
import axiosClient from '../api/axiosClient'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts'

const DIMENSION_COLORS = {
  resume: '#6366f1', job_match: '#10b981', dsa: '#f59e0b',
  aptitude: '#3b82f6', technical: '#ec4899', interview: '#8b5cf6'
}

const DEFAULT_SCORES = {
  resume: 82, job_match: 76, dsa: 61, aptitude: 74, technical: 70, interview: 65
}

function DimensionBar({ label, score, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{label.replace('_', ' ')}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{score}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${score}%`, background: color,
          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }} />
      </div>
    </div>
  )
}

export default function DigitalTwin() {
  const [twin, setTwin] = useState(null)
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDigitalTwin().catch(() => null),
      getReadinessHistory().catch(() => []),
    ]).then(([twinData]) => {
      setTwin(twinData || DEFAULT_SCORES)
    }).finally(() => setLoading(false))

    // AI insight in background
    axiosClient.get('/dashboard/insight').then(res => {
      if (res.data?.ai_insight) setInsight(res.data.ai_insight)
    }).catch(() => {})
  }, [])

  if (loading) {
    return <Page title="Digital Twin" subtitle="A living snapshot of your placement readiness."><Loading /></Page>
  }

  const scores = {
    resume: twin?.resume_score ?? twin?.resume ?? DEFAULT_SCORES.resume,
    job_match: twin?.job_match_score ?? twin?.job_match ?? DEFAULT_SCORES.job_match,
    dsa: twin?.dsa_score ?? twin?.dsa ?? DEFAULT_SCORES.dsa,
    aptitude: twin?.aptitude_score ?? twin?.aptitude ?? DEFAULT_SCORES.aptitude,
    technical: twin?.technical_score ?? twin?.technical ?? DEFAULT_SCORES.technical,
    interview: twin?.interview_score ?? twin?.interview ?? DEFAULT_SCORES.interview,
  }

  const overallScore = Math.round(
    twin?.overall_score ??
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
  )

  const radarData = Object.entries(scores).map(([key, val]) => ({
    area: key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: val,
    fullMark: 100,
  }))

  const barData = Object.entries(scores).map(([key, val]) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    score: val,
    color: DIMENSION_COLORS[key] || '#6366f1',
  }))

  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]
  const strongest = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]

  return (
    <Page eyebrow="CareerTwin · Digital Twin" title="Career Readiness Profile" subtitle="A real-time AI snapshot of your placement readiness across 6 core dimensions.">

      {/* Readiness ring + AI insight */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div className="score-ring" style={{ '--score': `${overallScore}%` }}>
            <strong>{overallScore}%</strong>
          </div>
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 6 }}>Placement Readiness</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 10 }}>
              Aggregated in real-time across your resume, job match, DSA, aptitude, technical, and interview scores.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Strongest</div>
                <div style={{ fontWeight: 800, color: '#22c55e', fontSize: 14, textTransform: 'capitalize' }}>
                  {strongest?.[0]?.replace('_', ' ')} ({strongest?.[1]})
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Focus Area</div>
                <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 14, textTransform: 'capitalize' }}>
                  {weakest?.[0]?.replace('_', ' ')} ({weakest?.[1]})
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 17 }}>AI Career Insight</h3>
          {insight ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>{insight.summary}</p>
              {insight.next_action && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--accent)11', borderLeft: '3px solid var(--accent)', fontSize: 13 }}>
                  🎯 {insight.next_action}
                </div>
              )}
              {insight.highlight && (
                <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>💡 {insight.highlight}</div>
              )}
            </div>
          ) : (
            <div className="empty">AI insight loading… start a career analysis to unlock personalised coaching.</div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {/* Radar */}
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Skill Radar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Radar name="Score" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar */}
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Dimension Scores</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dimension detail bars */}
      <div className="section-head"><h2>Dimension Breakdown</h2><span className="tag">6 Core Pillars</span></div>
      <div className="grid grid-2">
        <div className="card">
          {Object.entries(scores).slice(0, 3).map(([key, val]) => (
            <DimensionBar key={key} label={key} score={val} color={DIMENSION_COLORS[key] || 'var(--accent)'} />
          ))}
        </div>
        <div className="card">
          {Object.entries(scores).slice(3).map(([key, val]) => (
            <DimensionBar key={key} label={key} score={val} color={DIMENSION_COLORS[key] || 'var(--accent)'} />
          ))}
        </div>
      </div>

      {/* Trend */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Readiness Over Time</h3>
        <TrendChart />
      </div>
    </Page>
  )
}
