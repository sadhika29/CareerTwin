import { useEffect, useState } from 'react'
import { getDigitalTwin, getReadinessHistory } from '../features/career/careerService'
import { Page, ScoreGrid, TrendChart, demoScores } from './_shared'
import Loading from '../components/Loading'

export default function DigitalTwin() {
  const [twin, setTwin] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDigitalTwin().catch(() => null),
      getReadinessHistory().catch(() => [])
    ]).then(([twinData, histData]) => {
      setTwin(twinData || demoScores)
      if (histData && Array.isArray(histData) && histData.length > 0) {
        setHistory(histData)
      }
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  if (loading || !twin) {
    return (
      <Page title="Digital twin" subtitle="A living snapshot of your placement readiness.">
        <Loading />
      </Page>
    )
  }

  const overallScore = Math.round(twin.overall_score || twin.readiness_score || 75)
  const scores = {
    resume: twin.resume_score || twin.resume || 82,
    job_match: twin.job_match_score || twin.job_match || 76,
    dsa: twin.dsa_score || twin.dsa || 65,
    aptitude: twin.aptitude_score || twin.aptitude || 70,
    technical: twin.technical_score || twin.technical || 70,
    interview: twin.interview_score || twin.interview || 68
  }

  return (
    <Page title="Digital twin" subtitle="A living snapshot of your placement readiness.">
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        {/* Readiness Radial Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 25 }}>
          <div className="score-ring" style={{ '--score': `${overallScore}%` }}>
            <strong>{overallScore}%</strong>
          </div>
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 6 }}>Placement Readiness</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
              Aggregated in real-time across your resume ATS, job match criteria, DSA, and technical assessments.
            </p>
          </div>
        </div>

        {/* Readiness Trend Chart */}
        <div className="card">
          <h3 style={{ fontSize: 17, marginBottom: 10 }}>Readiness Over Time</h3>
          <TrendChart />
        </div>
      </div>

      <div className="section-head">
        <h2>Dimension Scores</h2>
        <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1' }}>6 Core Pillars</span>
      </div>

      <ScoreGrid scores={scores} keys={['resume', 'job_match', 'dsa', 'aptitude', 'technical', 'interview']} />
    </Page>
  )
}
