import { useState } from 'react'
import { Page, ScoreGrid, TrendChart, demoScores } from './_shared'
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'



export default function Performance() {
  const navigate = useNavigate()
  const [reports] = useState([
    {
      id: 'asmt_dsa_01',
      title: 'DSA Foundations & Algorithms',
      category: 'DSA',
      date: 'Today, 2:45 PM',
      score: 67,
      accuracy: 80,
      total: 4,
      passed: 2,
      failed: 1,
      skipped: 1,
      weak_topics: ['Dynamic Programming', 'Sliding Window'],
    },
    {
      id: 'asmt_tech_02',
      title: 'Technical Systems & SQL Architecture',
      category: 'Technical',
      date: 'Yesterday, 6:15 PM',
      score: 75,
      accuracy: 100,
      total: 4,
      passed: 3,
      failed: 0,
      skipped: 1,
      weak_topics: ['System Design'],
    },
    {
      id: 'asmt_apt_03',
      title: 'Aptitude & Problem Solving',
      category: 'Aptitude',
      date: '24 Sep 2026',
      score: 100,
      accuracy: 100,
      total: 2,
      passed: 2,
      failed: 0,
      skipped: 0,
      weak_topics: [],
    },
  ])

  const totalPassed = reports.reduce((acc, r) => acc + r.passed, 0)
  const totalFailed = reports.reduce((acc, r) => acc + r.failed, 0)
  const totalSkipped = reports.reduce((acc, r) => acc + r.skipped, 0)
  const totalQuestions = totalPassed + totalFailed + totalSkipped

  return (
    <Page
      eyebrow="CareerTwin · Performance Intelligence"
      title="Performance Analytics & Test Reports"
      subtitle="Analyze your skill growth, track test reports, and resolve work left skipped or failed."
    >

      {/* Overview Metric Scores */}
      <ScoreGrid scores={demoScores} keys={['dsa', 'aptitude', 'technical', 'communication', 'interview', 'job_match']} />

      {/* Aggregate Question Performance (Passed vs Failed vs Skipped) */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>Cumulative Test Question Statistics</h2>
          <span className="tag">All Test Reports Combined</span>
        </div>

        <div className="grid grid-4">
          <div className="card" style={{ padding: 14, background: '#f8fafc' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>QUESTIONS ATTEMPTED</div>
            <div style={{ font: "800 24px 'Manrope'", color: 'var(--navy)', margin: '4px 0 0' }}>{totalQuestions}</div>
          </div>
          <div className="card" style={{ padding: 14, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 11, fontWeight: 700 }}>
              <CheckCircle2 size={14} /> PASSED QUESTIONS
            </div>
            <div style={{ font: "800 24px 'Manrope'", color: 'var(--success)', margin: '4px 0 0' }}>{totalPassed}</div>
          </div>
          <div className="card" style={{ padding: 14, background: '#fef2f2', borderColor: '#fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--error)', fontSize: 11, fontWeight: 700 }}>
              <XCircle size={14} /> FAILED QUESTIONS
            </div>
            <div style={{ font: "800 24px 'Manrope'", color: 'var(--error)', margin: '4px 0 0' }}>{totalFailed}</div>
          </div>
          <div className="card" style={{ padding: 14, background: '#fffbeb', borderColor: '#fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)', fontSize: 11, fontWeight: 700 }}>
              <AlertCircle size={14} /> SKIPPED QUESTIONS
            </div>
            <div style={{ font: "800 24px 'Manrope'", color: 'var(--warning)', margin: '4px 0 0' }}>{totalSkipped}</div>
          </div>
        </div>
      </div>

      {/* Progress Trend & Topic Movement */}
      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>Readiness Progress Trend</h2>
          <TrendChart />
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>Weak Topics from Test Reports</h2>
            <span className="tag orange">Action Required</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
            These topics were identified as weak because questions were either failed or left skipped in recent test reports.
          </p>
          <ul className="list">
            {[
              { topic: 'Dynamic Programming', reason: 'Failed in DSA Test Report', impact: '+12% Readiness on Mastery' },
              { topic: 'Sliding Window', reason: 'Skipped in DSA Test Report', impact: '+8% Readiness on Mastery' },
              { topic: 'System Design Caching', reason: 'Skipped in Technical Test Report', impact: '+10% Readiness on Mastery' },
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{item.topic}</strong>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.reason}</div>
                </div>
                <button
                  className="button secondary"
                  style={{ padding: '6px 10px', fontSize: 11 }}
                  onClick={() => navigate('/assessments')}
                >
                  Practice Now
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Test Reports Table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17 }}>Recent Test Reports & History</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted)' }}>Review question breakdown and complete unfinished work.</p>
          </div>
          <button className="button" onClick={() => navigate('/assessments')}>
            Take New Assessment <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Test Title</th>
                <th>Category</th>
                <th>Completed</th>
                <th>Score</th>
                <th>Breakdown (P / F / S)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td><strong>{report.title}</strong></td>
                  <td><span className="tag">{report.category}</span></td>
                  <td>{report.date}</td>
                  <td>
                    <strong style={{ color: report.score >= 70 ? 'var(--teal)' : 'var(--navy)' }}>
                      {report.score}%
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>{report.passed} Passed</span>
                    {' · '}
                    <span style={{ color: 'var(--error)', fontWeight: 700 }}>{report.failed} Failed</span>
                    {' · '}
                    <span style={{ color: 'var(--warning)', fontWeight: 700 }}>{report.skipped} Skipped</span>
                  </td>
                  <td>
                    <span
                      className="tag"
                      style={{
                        background: (report.failed === 0 && report.skipped === 0) ? '#dcfce7' : '#fef3c7',
                        color: (report.failed === 0 && report.skipped === 0) ? 'var(--success)' : 'var(--warning)',
                      }}
                    >
                      {(report.failed === 0 && report.skipped === 0) ? 'Mastered' : 'Incomplete Work'}
                    </span>
                  </td>
                  <td>
                    {(report.failed > 0 || report.skipped > 0) ? (
                      <button
                        className="button"
                        style={{ padding: '6px 12px', fontSize: 11 }}
                        onClick={() => navigate('/assessments')}
                      >
                        <RotateCcw size={12} style={{ marginRight: 4 }} /> Complete Left Work
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  )
}

