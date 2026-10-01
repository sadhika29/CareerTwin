import { useState, useEffect } from 'react'
import { Page, TrendChart } from './_shared'
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RotateCcw, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import { analyzePerformance } from '../features/preparation/preparationService'

const demoScores = { dsa: 61, aptitude: 74, technical: 70, communication: 72, interview: 65, job_match: 76 }

function ScoreBar({ label, score }) {
  const color = score >= 75 ? '#22c55e' : score >= 55 ? '#f97316' : '#ef4444'
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{label.replace('_', ' ')}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{score}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, width: `${score}%`, background: color, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

export default function Performance() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [scores, setScores] = useState(demoScores)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    // Load backend reports
    axiosClient.get('/preparation/reports').then(res => {
      if (res.data?.reports?.length > 0) setReports(res.data.reports)
    }).catch(() => {}).finally(() => setLoading(false))

    // Load career scores for display
    axiosClient.get('/career/readiness').then(res => {
      const d = res.data
      if (d) setScores(prev => ({
        ...prev,
        dsa: d.dsa_score ?? prev.dsa,
        aptitude: d.aptitude_score ?? prev.aptitude,
        technical: d.technical_score ?? prev.technical,
        communication: d.communication_score ?? prev.communication,
        interview: d.interview_score ?? prev.interview,
        job_match: d.job_match_score ?? prev.job_match,
      }))
    }).catch(() => {})
  }, [])

  const handleAIAnalysis = async () => {
    setAiLoading(true)
    try {
      const result = await analyzePerformance({
        assessment_history: reports,
        target_role: 'Software Engineer',
      })
      setAiAnalysis(result)
    } catch {
      setAiAnalysis({ trend: 'stable', weak_topics: ['Unable to fetch AI analysis'], priority_recommendation: 'Complete more assessments to unlock AI insights.' })
    } finally {
      setAiLoading(false)
    }
  }

  const totalPassed = reports.reduce((a, r) => a + (r.correct_answers ?? r.passed ?? 0), 0)
  const totalFailed = reports.reduce((a, r) => a + (r.incorrect_answers ?? r.failed ?? 0), 0)
  const totalSkipped = reports.reduce((a, r) => a + (r.unattempted ?? r.skipped ?? 0), 0)
  const totalQuestions = totalPassed + totalFailed + totalSkipped

  return (
    <Page eyebrow="CareerTwin · Performance Intelligence" title="Performance Analytics" subtitle="Analyse your skill growth, track test reports, and get AI-powered improvement insights.">

      {/* Dimension scores */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h2 style={{ marginBottom: 16 }}>Current Scores</h2>
          {Object.entries(scores).map(([key, val]) => <ScoreBar key={key} label={key} score={val} />)}
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>AI Performance Analysis</h2>
            <button
              className="button"
              onClick={handleAIAnalysis}
              disabled={aiLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
            >
              {aiLoading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={13} />}
              {aiLoading ? 'Analysing…' : 'Run AI Analysis'}
            </button>
          </div>
          {aiAnalysis ? (
            <div>
              {aiAnalysis.priority_recommendation && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--accent)11', borderLeft: '3px solid var(--accent)', fontSize: 13, marginBottom: 14 }}>
                  🎯 {aiAnalysis.priority_recommendation}
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>WEAK TOPICS</div>
                  {(aiAnalysis.weak_topics || []).map((t, i) => (
                    <div key={i} style={{ fontSize: 13, padding: '3px 0', color: 'var(--text)' }}>• {typeof t === 'string' ? t : t.topic || String(t)}</div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>STRONG TOPICS</div>
                  {(aiAnalysis.strong_topics || []).map((t, i) => (
                    <div key={i} style={{ fontSize: 13, padding: '3px 0', color: 'var(--text)' }}>• {typeof t === 'string' ? t : t.topic || String(t)}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: 'var(--muted)' }}>Trend:</span>
                <span style={{
                  padding: '2px 10px', borderRadius: 20,
                  background: aiAnalysis.trend === 'improving' ? '#22c55e22' : aiAnalysis.trend === 'declining' ? '#ef444422' : '#6b728022',
                  color: aiAnalysis.trend === 'improving' ? '#22c55e' : aiAnalysis.trend === 'declining' ? '#ef4444' : '#6b7280',
                  fontWeight: 700,
                }}>
                  {aiAnalysis.trend || 'stable'}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty">Click "Run AI Analysis" to get personalised insights about your performance trends and weak areas.</div>
          )}
        </div>
      </div>

      {/* Cumulative stats */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Cumulative Test Statistics</h2>
          <span className="tag">All Reports Combined</span>
        </div>
        <div className="grid grid-4">
          {[
            { label: 'Questions Attempted', value: totalQuestions, bg: '#f8fafc', color: 'var(--text)' },
            { label: 'Passed', value: totalPassed, bg: '#f0fdf4', color: '#22c55e', icon: <CheckCircle2 size={14} /> },
            { label: 'Failed', value: totalFailed, bg: '#fef2f2', color: '#ef4444', icon: <XCircle size={14} /> },
            { label: 'Skipped', value: totalSkipped, bg: '#fffbeb', color: '#f59e0b', icon: <AlertCircle size={14} /> },
          ].map((item, i) => (
            <div key={i} className="card" style={{ padding: 14, background: item.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 4 }}>
                {item.icon}{item.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress trend */}
      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>Readiness Progress Trend</h2>
          <TrendChart />
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>Weak Topics from Reports</h2>
            <span className="tag orange">Action Required</span>
          </div>
          {loading ? (
            <div className="empty">Loading reports…</div>
          ) : reports.length > 0 ? (
            <ul className="list">
              {reports.flatMap(r => (r.weak_topics || [])).slice(0, 5).map((topic, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{topic}</strong>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Identified in assessment report</div>
                  </div>
                  <button className="button secondary" style={{ padding: '6px 10px', fontSize: 11 }} onClick={() => navigate('/assessment')}>
                    Practice Now
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">Complete assessments to see weak topic identification here.</div>
          )}
        </div>
      </div>

      {/* Test reports table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Recent Test Reports</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted)' }}>Review your question breakdown and complete unfinished work.</p>
          </div>
          <button className="button" onClick={() => navigate('/assessment')}>
            Take New Assessment <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </button>
        </div>
        {loading ? <div className="empty">Loading reports…</div> : reports.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assessment</th><th>Category</th><th>Completed</th>
                  <th>Score</th><th>Breakdown (P/F/S)</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => {
                  const passed = report.correct_answers ?? report.passed ?? 0
                  const failed = report.incorrect_answers ?? report.failed ?? 0
                  const skipped = report.unattempted ?? report.skipped ?? 0
                  const hasIncomplete = failed > 0 || skipped > 0
                  return (
                    <tr key={report.assessment_id}>
                      <td><strong>{report.title || report.assessment_id}</strong></td>
                      <td><span className="tag">{report.category}</span></td>
                      <td>{report.completed_at ? new Date(report.completed_at).toLocaleDateString() : report.date || '—'}</td>
                      <td><strong style={{ color: report.score >= 70 ? 'var(--teal)' : 'var(--navy)' }}>{Math.round(report.score)}%</strong></td>
                      <td>
                        <span style={{ color: '#22c55e', fontWeight: 700 }}>{passed}P</span>
                        {' · '}
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{failed}F</span>
                        {' · '}
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>{skipped}S</span>
                      </td>
                      <td>
                        <span className="tag" style={{ background: !hasIncomplete ? '#dcfce7' : '#fef3c7', color: !hasIncomplete ? '#22c55e' : '#f59e0b' }}>
                          {!hasIncomplete ? 'Mastered' : 'Incomplete'}
                        </span>
                      </td>
                      <td>
                        {hasIncomplete ? (
                          <button className="button" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => navigate('/assessment')}>
                            <RotateCcw size={12} style={{ marginRight: 4 }} /> Complete
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>✓ Done</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">No test reports yet. Take an assessment to see your detailed performance here.</div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Page>
  )
}
