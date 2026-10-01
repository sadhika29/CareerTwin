import { useState, useRef } from 'react'
import { Mic, MicOff, CheckCircle, XCircle, ChevronRight, RefreshCw, MessageSquare, Award, ArrowLeft } from 'lucide-react'
import { startInterview, submitAnswer, getInterviewHistory } from '../features/interview/interviewService'

const ROUND_TYPES = [
  { value: 'technical', label: 'Technical', desc: 'Algorithms, system design, coding concepts' },
  { value: 'project', label: 'Project Deep-Dive', desc: 'Your past projects, architecture decisions, challenges' },
  { value: 'hr', label: 'HR / Behavioural', desc: 'STAR-format, cultural fit, communication' },
]

function RatingBar({ score, max = 10 }) {
  const pct = Math.round((score / max) * 100)
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f97316' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32 }}>{score}/{max}</span>
    </div>
  )
}

function EvaluationCard({ evaluation, questionText }) {
  const { score, max_score, feedback, strengths, improvements, suggested_answer } = evaluation || {}
  return (
    <div className="card" style={{ borderLeft: '3px solid var(--accent)', marginBottom: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, fontStyle: 'italic' }}>"{questionText}"</p>
      {score !== undefined && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>AI Score</div>
          <RatingBar score={score} max={max_score || 10} />
        </div>
      )}
      {feedback && (
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, marginBottom: 12 }}>{feedback}</p>
      )}
      {strengths?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>Strengths</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {strengths.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>
                <CheckCircle size={13} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />{s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {improvements?.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Improve</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {improvements.map((imp, i) => (
              <li key={i} style={{ display: 'flex', gap: 6, fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>
                <XCircle size={13} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />{imp}
              </li>
            ))}
          </ul>
        </div>
      )}
      {suggested_answer && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}>
            View ideal answer
          </summary>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            {suggested_answer}
          </p>
        </details>
      )}
    </div>
  )
}

export default function Interview() {
  const [targetRole, setTargetRole] = useState('Software Engineer')
  const [roundType, setRoundType] = useState('technical')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')

  const [session, setSession] = useState(null) // { session_id, questions, ... }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluations, setEvaluations] = useState([]) // { question, evaluation }
  const [phase, setPhase] = useState('setup') // setup | interview | done
  const [loading, setLoading] = useState(false)
  const [evalLoading, setEvalLoading] = useState(false)
  const textareaRef = useRef(null)

  const handleStart = async () => {
    setLoading(true)
    try {
      const data = await startInterview({
        type: roundType,
        target_role: targetRole,
        count: numQuestions,
        difficulty,
      })
      setSession(data)
      setCurrentIndex(0)
      setEvaluations([])
      setAnswer('')
      setPhase('interview')
    } catch (err) {
      alert('Failed to start interview. Please check the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = session?.questions?.[currentIndex]

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return
    setEvalLoading(true)
    try {
      const result = await submitAnswer(session.session_id, {
        question: currentQuestion?.question || '',
        question_type: currentQuestion?.type || roundType,
        answer,
        target_role: targetRole,
        expected_key_points: currentQuestion?.key_points || [],
      })
      setEvaluations(prev => [
        ...prev,
        { question: currentQuestion?.question || '', evaluation: result.evaluation },
      ])
      setAnswer('')
      if (currentIndex < session.questions.length - 1) {
        setCurrentIndex(i => i + 1)
      } else {
        setPhase('done')
      }
    } catch {
      alert('Evaluation failed. Please try again.')
    } finally {
      setEvalLoading(false)
    }
  }

  const handleSkip = () => {
    setEvaluations(prev => [
      ...prev,
      { question: currentQuestion?.question || '', evaluation: null, skipped: true },
    ])
    setAnswer('')
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setPhase('done')
    }
  }

  const overallScore = evaluations
    .filter(e => e.evaluation?.score !== undefined)
    .map(e => (e.evaluation.score / (e.evaluation.max_score || 10)) * 100)

  const avgScore = overallScore.length
    ? Math.round(overallScore.reduce((a, b) => a + b, 0) / overallScore.length)
    : 0

  // ——— SETUP SCREEN ———
  if (phase === 'setup') {
    return (
      <div className="content">
        <div className="eyebrow">CareerTwin · AI Interview</div>
        <h2 className="page-title">Mock Interview Room</h2>
        <p className="page-subtitle">
          The AI generates role-specific questions and gives you detailed coaching feedback on every answer.
        </p>

        <div className="grid grid-2">
          <div className="card">
            <h2>Configure Your Interview</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Target Role
                </label>
                <input
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--card)',
                    color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Interview Type
                </label>
                {ROUND_TYPES.map(r => (
                  <label
                    key={r.value}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                      borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                      border: `1px solid ${roundType === r.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: roundType === r.value ? 'var(--accent)11' : 'transparent',
                    }}
                  >
                    <input
                      type="radio" value={r.value} checked={roundType === r.value}
                      onChange={() => setRoundType(r.value)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Questions</label>
                  <select value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14 }}>
                    {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Difficulty</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 14 }}>
                    {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <button
                className="button"
                onClick={handleStart}
                disabled={loading || !targetRole.trim()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 8 }}
              >
                {loading ? <RefreshCw size={15} className="spin" /> : <Mic size={15} />}
                {loading ? 'AI is preparing your questions…' : 'Start Interview'}
              </button>
            </div>
          </div>

          <div className="card">
            <h2>How It Works</h2>
            {[
              { icon: <MessageSquare size={16} color="var(--accent)" />, title: 'AI generates questions', desc: 'Fresh role-specific questions every session — no static bank.' },
              { icon: <Mic size={16} color="var(--accent)" />, title: 'You answer each one', desc: 'Type your answer as you would speak it in a real interview.' },
              { icon: <Award size={16} color="var(--accent)" />, title: 'AI coaches you', desc: 'After each answer, AI scores you and shows strengths and areas to improve.' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
                <div style={{ minWidth: 32, height: 32, borderRadius: 8, background: 'var(--accent)22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ——— DONE SCREEN ———
  if (phase === 'done') {
    return (
      <div className="content">
        <div className="eyebrow">CareerTwin · AI Interview</div>
        <h2 className="page-title">Interview Complete</h2>
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>Overall AI Score</div>
            <div className="metric-value" style={{ fontSize: 56 }}>{avgScore}%</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="progress" style={{ marginBottom: 8 }}>
              <span style={{ width: `${avgScore}%` }} />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              {avgScore >= 75 ? 'Great performance! You\'re ready for real interviews.' : avgScore >= 50 ? 'Good start. Review the feedback below and practice the improvements.' : 'Keep going! Each session makes you sharper. Focus on the improvement areas.'}
            </p>
          </div>
        </div>
        <h2 style={{ marginBottom: 16 }}>Detailed AI Feedback</h2>
        {evaluations.map((e, i) => (
          e.skipped
            ? <div key={i} className="card" style={{ marginBottom: 12, borderLeft: '3px solid var(--border)' }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Skipped: "{e.question}"
                </p>
              </div>
            : <EvaluationCard key={i} evaluation={e.evaluation} questionText={e.question} />
        ))}
        <button
          className="button"
          onClick={() => { setPhase('setup'); setSession(null); setEvaluations([]) }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}
        >
          <ArrowLeft size={15} /> Start New Interview
        </button>
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ——— INTERVIEW IN PROGRESS ———
  const total = session?.questions?.length || numQuestions
  const pct = Math.round(((currentIndex) / total) * 100)

  return (
    <div className="content">
      <div className="eyebrow">CareerTwin · AI Interview — {session?.round_type || roundType}</div>
      <h2 className="page-title">Question {currentIndex + 1} of {total}</h2>

      {/* Progress */}
      <div className="progress" style={{ marginBottom: 24 }}>
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-2">
        {/* Question + Answer */}
        <div className="card">
          {currentQuestion ? (
            <>
              {currentQuestion.topic && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  {currentQuestion.topic}
                </div>
              )}
              <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, marginBottom: 20, color: 'var(--text)' }}>
                {currentQuestion.question}
              </p>
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here as you would say it in a real interview…"
                rows={6}
                style={{
                  width: '100%', padding: '12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--text)', fontSize: 14, lineHeight: 1.6,
                  resize: 'vertical', boxSizing: 'border-box', marginBottom: 14,
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="button"
                  onClick={handleSubmitAnswer}
                  disabled={evalLoading || !answer.trim()}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {evalLoading ? <RefreshCw size={14} className="spin" /> : <ChevronRight size={14} />}
                  {evalLoading ? 'AI is evaluating…' : currentIndex < total - 1 ? 'Submit & Next' : 'Submit & Finish'}
                </button>
                <button
                  onClick={handleSkip}
                  disabled={evalLoading}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            <div className="empty">Loading question…</div>
          )}
        </div>

        {/* Live feedback panel */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h2>Interview Tips</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Use the STAR method for behavioural questions (Situation, Task, Action, Result).',
                'Be specific — mention technologies, metrics, and outcomes.',
                'For technical questions, explain your reasoning, not just the answer.',
                'It\'s fine to take a moment to think before answering.',
              ].map((tip, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, padding: '5px 0', fontSize: 13, color: 'var(--text)' }}>
                  <ChevronRight size={13} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          {evaluations.length > 0 && (
            <div className="card">
              <h2>Latest Feedback</h2>
              {(() => {
                const last = evaluations[evaluations.length - 1]
                if (last.skipped) return <p style={{ color: 'var(--muted)', fontSize: 13 }}>Question skipped.</p>
                const ev = last.evaluation
                return (
                  <>
                    {ev?.score !== undefined && <RatingBar score={ev.score} max={ev.max_score || 10} />}
                    {ev?.feedback && <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 8, lineHeight: 1.5 }}>{ev.feedback}</p>}
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
