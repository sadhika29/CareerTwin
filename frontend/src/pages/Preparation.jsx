import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Zap, Clock, Target, RefreshCw, ChevronRight, BarChart2, CheckCircle } from 'lucide-react'
import {
  getTodayTasks,
  getWeakTopics,
  getPreparationProgress,
  getRecommendation,
} from '../features/preparation/preparationService'

const PRIORITIES = { high: '#ef4444', medium: '#f97316', low: '#22c55e' }

function priorityColor(p) {
  return PRIORITIES[String(p).toLowerCase()] || '#6b7280'
}

function TaskItem({ task, index }) {
  const name = typeof task === 'string' ? task : task.task || task.name || JSON.stringify(task)
  const priority = typeof task === 'object' ? task.priority : null
  const duration = typeof task === 'object' ? task.duration || task.estimated_time : null

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span
        style={{
          minWidth: 26,
          height: 26,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </span>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{name}</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {priority && (
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 4,
                background: priorityColor(priority) + '22',
                color: priorityColor(priority),
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {priority}
            </span>
          )}
          {duration && (
            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={11} /> {duration} min
            </span>
          )}
        </div>
      </div>
    </li>
  )
}

export default function Preparation() {
  const [targetRole, setTargetRole] = useState('Software Engineer')
  const [availableTime, setAvailableTime] = useState(60)
  const [todayData, setTodayData] = useState(null)
  const [weakData, setWeakData] = useState(null)
  const [progress, setProgress] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [recLoading, setRecLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [today, weak, prog] = await Promise.all([
        getTodayTasks({ target_role: targetRole, available_time: availableTime }).catch(() => null),
        getWeakTopics({ target_role: targetRole }).catch(() => null),
        getPreparationProgress().catch(() => null),
      ])
      setTodayData(today)
      setWeakData(weak)
      setProgress(prog)
    } catch (err) {
      setError('Unable to load preparation data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [targetRole, availableTime])

  useEffect(() => {
    load()
  }, [load])

  const handleGetRecommendation = async () => {
    setRecLoading(true)
    try {
      const rec = await getRecommendation({
        target_role: targetRole,
        skill_gaps: weakData?.weak_topics || [],
        available_time: availableTime,
      })
      setRecommendation(rec)
    } catch {
      setRecommendation({ reason: 'Unable to generate recommendation right now. Please try again.' })
    } finally {
      setRecLoading(false)
    }
  }

  const tasks = todayData?.tasks || []
  const weakTopics = weakData?.weak_topics || []
  const strongTopics = weakData?.strong_topics || []
  const completion = progress?.completion ?? 0

  return (
    <div className="content">
      <div className="eyebrow">CareerTwin · AI Preparation</div>
      <h2 className="page-title">Your Preparation Plan</h2>
      <p className="page-subtitle">
        The AI analyses your target role and skill gaps to build today's focused study session.
      </p>

      {/* Controls */}
      <div
        className="card"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 24 }}
      >
        <div className="field" style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
            Target Role
          </label>
          <input
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
              fontSize: 14,
            }}
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
            Available Time (min)
          </label>
          <select
            value={availableTime}
            onChange={e => setAvailableTime(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text)',
              fontSize: 14,
            }}
          >
            {[30, 60, 90, 120].map(t => (
              <option key={t} value={t}>{t} minutes</option>
            ))}
          </select>
        </div>
        <button
          className="button"
          onClick={load}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40 }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          {loading ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ background: '#ef444422', borderColor: '#ef4444', color: '#ef4444', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="grid grid-2">
        {/* Today's tasks */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BookOpen size={18} color="var(--accent)" />
            <h2 style={{ margin: 0 }}>Today's Tasks</h2>
          </div>
          {loading ? (
            <div className="empty">AI is building your personalised tasks…</div>
          ) : tasks.length > 0 ? (
            <>
              {todayData?.message && (
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{todayData.message}</p>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tasks.map((task, i) => (
                  <TaskItem key={i} task={task} index={i} />
                ))}
              </ul>
              {todayData?.total_time && (
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 6 }}>
                  <Clock size={13} /> Total: {todayData.total_time} min
                </div>
              )}
            </>
          ) : (
            <div className="empty">No tasks yet. Click Regenerate to have the AI build your plan.</div>
          )}
        </div>

        {/* Progress */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 size={18} color="var(--accent)" />
            <h2 style={{ margin: 0 }}>Weekly Progress</h2>
          </div>
          <div className="metric-value" style={{ fontSize: 48, marginBottom: 8 }}>{completion}%</div>
          <div className="progress" style={{ marginBottom: 12 }}>
            <span style={{ width: `${completion}%` }} />
          </div>
          {progress ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              {progress.weekly_sessions_completed} of {progress.weekly_sessions_total} sessions complete
            </p>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Complete assessments to track your sessions</p>
          )}
        </div>

        {/* Weak topics */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Target size={18} color="#ef4444" />
            <h2 style={{ margin: 0 }}>Focus Areas</h2>
          </div>
          {loading ? (
            <div className="empty">AI is analysing your weak spots…</div>
          ) : weakTopics.length > 0 ? (
            <>
              {weakData?.priority_recommendation && (
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                  {weakData.priority_recommendation}
                </p>
              )}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {weakTopics.map((t, i) => {
                  const name = typeof t === 'string' ? t : t.topic || t.name || String(t)
                  const priority = typeof t === 'object' ? t.priority : 'medium'
                  return (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <span>{name}</span>
                      {priority && (
                        <span style={{ color: priorityColor(priority), fontWeight: 700, fontSize: 11 }}>
                          {String(priority).toUpperCase()}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <div className="empty">No weak topics identified yet. Take an assessment first.</div>
          )}
        </div>

        {/* Strong topics */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CheckCircle size={18} color="#22c55e" />
            <h2 style={{ margin: 0 }}>Your Strengths</h2>
          </div>
          {loading ? (
            <div className="empty">Analysing…</div>
          ) : strongTopics.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {strongTopics.map((t, i) => {
                const name = typeof t === 'string' ? t : t.topic || t.name || String(t)
                return (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <CheckCircle size={13} color="#22c55e" />
                    <span>{name}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="empty">Complete assessments to reveal your strong topics.</div>
          )}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#f59e0b" />
            <h2 style={{ margin: 0 }}>AI Deep Recommendation</h2>
          </div>
          <button
            className="button"
            onClick={handleGetRecommendation}
            disabled={recLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}
          >
            {recLoading ? <RefreshCw size={13} className="spin" /> : <ChevronRight size={13} />}
            {recLoading ? 'Thinking…' : 'Get Full Plan'}
          </button>
        </div>
        {recommendation ? (
          <div>
            {recommendation.reason && (
              <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 16, lineHeight: 1.6 }}>{recommendation.reason}</p>
            )}
            {recommendation.priority_topics?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Priority Topics
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {recommendation.priority_topics.map((t, i) => (
                    <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 600 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {recommendation.expected_outcomes?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Expected Outcomes
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {recommendation.expected_outcomes.map((o, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 13, color: 'var(--text)' }}>
                      <ChevronRight size={13} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="empty">
            Click "Get Full Plan" to get a complete AI-generated preparation recommendation tailored to your target role.
          </div>
        )}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
