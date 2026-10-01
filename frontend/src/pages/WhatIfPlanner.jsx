import { useState, useEffect } from 'react'
import { TrendingUp, Zap, ChevronRight, RefreshCw, Target, ArrowRight } from 'lucide-react'
import { getWhatIf, getCareerState } from '../features/career/careerService'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

const AREAS = [
  { key: 'resume', label: 'Resume', color: '#6366f1' },
  { key: 'dsa', label: 'DSA', color: '#f59e0b' },
  { key: 'aptitude', label: 'Aptitude', color: '#10b981' },
  { key: 'technical', label: 'Technical', color: '#3b82f6' },
  { key: 'communication', label: 'Communication', color: '#ec4899' },
  { key: 'interview', label: 'Interview', color: '#8b5cf6' },
  { key: 'job_match', label: 'Job Match', color: '#f97316' },
]

const DEFAULT_SCORES = {
  resume: 82, dsa: 61, aptitude: 74, technical: 70, communication: 72, interview: 65, job_match: 76,
}

function ScoreSlider({ area, value, onChange }) {
  const color = AREAS.find(a => a.key === area)?.color || 'var(--accent)'
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <label style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
          {area.replace('_', ' ')}
        </label>
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(area, Number(e.target.value))}
        style={{ width: '100%', accentColor: color }}
      />
    </div>
  )
}

export default function WhatIfPlanner() {
  const [scores, setScores] = useState(DEFAULT_SCORES)
  const [scenario, setScenario] = useState(null)
  const [customInput, setCustomInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [careerLoading, setCareerLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sliders') // sliders | chat

  // Load real career scores from backend
  useEffect(() => {
    getCareerState()
      .then(data => {
        if (data) {
          setScores(prev => ({
            ...prev,
            resume: data.resume_score ?? prev.resume,
            dsa: data.dsa_score ?? prev.dsa,
            aptitude: data.aptitude_score ?? prev.aptitude,
            technical: data.technical_score ?? prev.technical,
            communication: data.communication_score ?? prev.communication,
            interview: data.interview_score ?? prev.interview,
            job_match: data.job_match_score ?? prev.job_match,
          }))
        }
      })
      .catch(() => {}) // silently use demo scores
      .finally(() => setCareerLoading(false))
  }, [])

  const handleScoreChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }))
  }

  const handleCalculate = async () => {
    setLoading(true)
    setScenario(null)
    try {
      const result = await getWhatIf(scores)
      setScenario(result)
    } catch {
      setScenario({
        recommended_area: 'DSA',
        estimated_impact: '+8%',
        current_score: Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length),
        recommendation: 'Based on your current scores, improving DSA would yield the highest readiness boost.',
        reason: 'AI analysis could not be reached. Showing local estimate.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNaturalLanguage = async () => {
    if (!customInput.trim()) return
    setLoading(true)
    setScenario(null)
    // Parse user intent and map to area changes
    const lower = customInput.toLowerCase()
    let modifiedScores = { ...scores }
    AREAS.forEach(a => {
      if (lower.includes(a.label.toLowerCase()) || lower.includes(a.key)) {
        const boost = lower.includes('improve') || lower.includes('learn') || lower.includes('master') ? 15 : 10
        modifiedScores[a.key] = Math.min(100, (modifiedScores[a.key] || 0) + boost)
      }
    })
    try {
      const result = await getWhatIf(modifiedScores)
      setScenario({ ...result, user_query: customInput, modified_scores: modifiedScores })
    } catch {
      setScenario({
        user_query: customInput,
        recommendation: `Based on: "${customInput}" — improving your weakest areas first gives the highest readiness gain.`,
        estimated_impact: '+5–12%',
      })
    } finally {
      setLoading(false)
    }
  }

  const radarData = AREAS.map(a => ({
    area: a.label,
    value: scores[a.key] || 0,
    fullMark: 100,
  }))

  const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length)

  return (
    <div className="content">
      <div className="eyebrow">CareerTwin · AI Planner</div>
      <h2 className="page-title">What-If Career Planner</h2>
      <p className="page-subtitle">
        Adjust your skill scores and ask the AI what will give you the highest career readiness boost.
      </p>

      {careerLoading && (
        <div className="notice" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={13} className="spin" /> Loading your current career scores…
        </div>
      )}

      <div className="grid grid-2">
        {/* Left: controls */}
        <div>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {[
              { id: 'sliders', label: 'Score Sliders' },
              { id: 'chat', label: 'Ask in Natural Language' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--muted)',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'sliders' ? (
            <div className="card">
              <h2>Simulate Skill Changes</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                Drag any slider to simulate improvement, then calculate the predicted impact.
              </p>
              {AREAS.map(a => (
                <ScoreSlider key={a.key} area={a.key} value={scores[a.key] || 0} onChange={handleScoreChange} />
              ))}
              <button
                className="button"
                onClick={handleCalculate}
                disabled={loading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
              >
                {loading ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
                {loading ? 'AI is calculating…' : 'Calculate Impact'}
              </button>
            </div>
          ) : (
            <div className="card">
              <h2>Ask the AI</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Ask in plain English and the AI will analyse your intent and simulate the outcome.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'What should I improve first?',
                  'What if I learn Docker?',
                  'Which skill will improve my job match most?',
                  'What happens if I improve my DSA score?',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setCustomInput(q)}
                    style={{
                      textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 13,
                      border: '1px solid var(--border)', background: customInput === q ? 'var(--accent)11' : 'transparent',
                      cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <ChevronRight size={13} color="var(--accent)" />{q}
                  </button>
                ))}
              </div>
              <textarea
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                placeholder="Or type your own question…"
                rows={3}
                style={{
                  width: '100%', marginTop: 12, padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--text)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
                }}
              />
              <button
                className="button"
                onClick={handleNaturalLanguage}
                disabled={loading || !customInput.trim()}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}
              >
                {loading ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
                {loading ? 'AI is thinking…' : 'Analyse'}
              </button>
            </div>
          )}
        </div>

        {/* Right: radar + result */}
        <div>
          {/* Radar chart */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <h2 style={{ margin: 0 }}>Career Radar</h2>
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Overall </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{overallScore}%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Radar name="Score" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* AI result card */}
          {scenario ? (
            <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
              {scenario.user_query && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontStyle: 'italic' }}>
                  Query: "{scenario.user_query}"
                </div>
              )}
              <div className="eyebrow" style={{ marginBottom: 4 }}>AI Recommendation</div>
              {scenario.recommended_area && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Target size={18} color="var(--accent)" />
                  <span style={{ fontSize: 18, fontWeight: 800 }}>
                    Focus on: {String(scenario.recommended_area).replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )}
              {scenario.current_score !== undefined && scenario.estimated_impact && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Current</div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{scenario.current_score}%</div>
                  </div>
                  <ArrowRight size={20} color="var(--accent)" />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Predicted</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#22c55e' }}>
                      {scenario.estimated_score ?? `${scenario.estimated_impact}`}
                    </div>
                  </div>
                  {scenario.estimated_impact && (
                    <div style={{ padding: '4px 10px', borderRadius: 20, background: '#22c55e22', color: '#22c55e', fontWeight: 700, fontSize: 14 }}>
                      {typeof scenario.estimated_impact === 'string' && !scenario.estimated_impact.startsWith('+')
                        ? `+${scenario.estimated_impact}` : scenario.estimated_impact}
                    </div>
                  )}
                </div>
              )}
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
                {scenario.recommendation}
              </p>
              {scenario.reason && (
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>{scenario.reason}</p>
              )}
              {scenario.next_steps?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Next Steps</div>
                  {scenario.next_steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, padding: '4px 0', color: 'var(--text)' }}>
                      <ChevronRight size={13} color="var(--accent)" style={{ marginTop: 2 }} />{step}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card empty" style={{ textAlign: 'center', padding: 32 }}>
              <TrendingUp size={32} color="var(--muted)" style={{ marginBottom: 12 }} />
              <div>Adjust sliders or ask a question to see the AI's predicted impact on your career readiness.</div>
            </div>
          )}
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
