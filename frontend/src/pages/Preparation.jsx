import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Zap, Clock, Target, RefreshCw, ChevronRight, BarChart2, CheckCircle, ChevronDown } from 'lucide-react'
import {
  getTodayTasks,
  getWeakTopics,
  getPreparationProgress,
  getRecommendation,
} from '../features/preparation/preparationService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

const PRIORITIES = { high: 'error', medium: 'warning', low: 'success' }

function priorityColor(p) {
  return PRIORITIES[String(p).toLowerCase()] || 'primary'
}

function TaskItem({ task, index }) {
  const name = typeof task === 'string' ? task : task.task || task.name || JSON.stringify(task)
  const priority = typeof task === 'object' ? task.priority : null
  const duration = typeof task === 'object' ? task.duration || task.estimated_time : null

  const pColor = priority ? priorityColor(priority) : 'primary'

  return (
    <li className="flex items-start gap-4 py-4 border-b border-border/50 last:border-0 hover:bg-background/50 transition-colors px-2 rounded-xl">
      <span className="w-8 h-8 rounded-full bg-ai/10 text-ai flex items-center justify-center text-xs font-bold shrink-0 border border-ai/20 shadow-sm mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1">
        <span className="text-sm font-bold text-text-primary block mb-1.5">{name}</span>
        <div className="flex items-center gap-2">
          {priority && (
            <span className={`text-[10px] px-2 py-0.5 rounded border font-black uppercase tracking-widest bg-${pColor}/10 text-${pColor}-hover border-${pColor}/20`}>
              {priority}
            </span>
          )}
          {duration && (
            <span className="text-xs text-text-muted flex items-center gap-1 font-medium bg-background border border-border px-2 py-0.5 rounded">
              <Clock size={12} /> {duration} min
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
    <div className="animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-ai/10 text-ai text-xs font-bold uppercase tracking-wider mb-3 inline-block">
            CareerTwin · AI Preparation
          </span>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
            Your Preparation Plan
          </h1>
          <p className="text-text-secondary text-base">
            The AI analyses your target role and skill gaps to build today's focused study session.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-background rounded-2xl border border-border shadow-sm p-6 mb-8 flex flex-wrap gap-4 items-end animate-in slide-in-from-bottom-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Target Role</label>
          <input
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai transition-all font-medium"
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Available Time</label>
          <div className="relative">
            <select
              value={availableTime}
              onChange={e => setAvailableTime(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai transition-all cursor-pointer font-medium appearance-none"
            >
              {[30, 60, 90, 120].map(t => (
                <option key={t} value={t}>{t} minutes</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-3 text-text-muted pointer-events-none" />
          </div>
        </div>
        <button
          className="px-6 py-2.5 bg-background border-2 border-ai/20 text-ai hover:bg-ai hover:text-white hover:border-ai font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error-hover text-sm font-bold flex items-center gap-2">
          <Target size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-500 delay-100">
        {/* Today's tasks */}
        <Card className="shadow-sm flex flex-col">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-2 m-0 text-ai">
              <BookOpen size={20} /> Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-text-muted text-sm font-medium">
                <RefreshCw size={24} className="animate-spin mb-3 text-ai" />
                AI is building your personalised tasks…
              </div>
            ) : tasks.length > 0 ? (
              <>
                {todayData?.message && (
                  <p className="text-sm font-medium text-text-secondary bg-ai/5 border border-ai/10 p-3 rounded-lg mb-4">
                    {todayData.message}
                  </p>
                )}
                <ul className="m-0 p-0 flex-1 flex flex-col">
                  {tasks.map((task, i) => (
                    <TaskItem key={i} task={task} index={i} />
                  ))}
                </ul>
                {todayData?.total_time && (
                  <div className="mt-6 pt-4 border-t border-border/50 text-sm font-bold text-text-secondary flex items-center gap-2">
                    <Clock size={16} className="text-ai" /> Total Est. Time: <span className="text-text-primary">{todayData.total_time} mins</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-text-muted text-center border-2 border-dashed border-border rounded-xl mt-2">
                <BookOpen size={24} className="mb-3 opacity-30" />
                <span className="text-sm">No tasks yet. Click Regenerate to have the AI build your plan.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {/* Progress */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 m-0 text-primary">
                <BarChart2 size={20} /> Weekly Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-5xl font-heading font-black text-primary mb-4">{completion}%</div>
              <div className="h-2.5 rounded-full bg-border overflow-hidden mb-4 shadow-inner">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-ai transition-all duration-1000 ease-out" 
                  style={{ width: `${completion}%` }} 
                />
              </div>
              {progress ? (
                <p className="text-sm font-bold text-text-secondary m-0">
                  <span className="text-text-primary">{progress.weekly_sessions_completed}</span> of <span className="text-text-primary">{progress.weekly_sessions_total}</span> sessions complete
                </p>
              ) : (
                <p className="text-sm text-text-muted font-medium m-0 flex items-center gap-1.5">
                  <Target size={14} /> Complete assessments to track your sessions
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Weak topics */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 m-0 text-error-hover text-base">
                  <Target size={18} /> Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <div className="py-4 text-center text-text-muted text-xs font-medium flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-error" /> Analysing weak spots…
                  </div>
                ) : weakTopics.length > 0 ? (
                  <ul className="m-0 p-0 flex flex-col gap-3">
                    {weakTopics.slice(0, 4).map((t, i) => {
                      const name = typeof t === 'string' ? t : t.topic || t.name || String(t)
                      const priority = typeof t === 'object' ? t.priority : 'medium'
                      const pColor = priorityColor(priority)
                      return (
                        <li key={i} className="flex justify-between items-center text-sm p-2 bg-background border border-border rounded-lg shadow-sm">
                          <span className="font-medium text-text-primary truncate mr-2">{name}</span>
                          {priority && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest bg-${pColor}/10 text-${pColor}-hover shrink-0`}>
                              {priority}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="py-6 text-center text-text-muted text-xs bg-background/50 border border-dashed border-border rounded-lg">
                    No weak topics identified yet.<br/>Take an assessment first.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Strong topics */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 m-0 text-success-hover text-base">
                  <CheckCircle size={18} /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {loading ? (
                  <div className="py-4 text-center text-text-muted text-xs font-medium flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-success" /> Analysing…
                  </div>
                ) : strongTopics.length > 0 ? (
                  <ul className="m-0 p-0 flex flex-col gap-3">
                    {strongTopics.slice(0, 4).map((t, i) => {
                      const name = typeof t === 'string' ? t : t.topic || t.name || String(t)
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm p-2 bg-success/5 border border-success/20 rounded-lg shadow-sm">
                          <CheckCircle size={14} className="text-success-hover shrink-0" />
                          <span className="font-medium text-text-primary truncate">{name}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="py-6 text-center text-text-muted text-xs bg-background/50 border border-dashed border-border rounded-lg">
                    Complete assessments to reveal your strong topics.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <Card className="mt-6 shadow-sm border-t-4 border-t-warning bg-gradient-to-br from-background to-warning/5 animate-in slide-in-from-bottom-8 duration-500 delay-200">
        <CardHeader className="pb-4 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 m-0 text-warning-hover">
            <Zap size={20} className="fill-warning text-warning" /> AI Deep Recommendation
          </CardTitle>
          <button
            className="px-5 py-2.5 bg-warning text-white hover:bg-warning-hover font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
            onClick={handleGetRecommendation}
            disabled={recLoading}
          >
            {recLoading ? <RefreshCw size={16} className="animate-spin" /> : <ChevronRight size={16} />}
            {recLoading ? 'Thinking…' : 'Get Full Plan'}
          </button>
        </CardHeader>
        
        <CardContent className="pt-6 min-h-[160px] flex flex-col justify-center">
          {recommendation ? (
            <div className="animate-in fade-in">
              {recommendation.reason && (
                <p className="text-base font-medium text-text-primary mb-6 leading-relaxed p-5 bg-background rounded-xl border border-border shadow-sm">
                  {recommendation.reason}
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendation.priority_topics?.length > 0 && (
                  <div className="bg-background/80 p-5 rounded-xl border border-warning/20">
                    <div className="text-[10px] font-black text-warning-hover uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <Target size={14} /> Priority Topics
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.priority_topics.map((t, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-warning/10 text-warning-hover border border-warning/20 font-bold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {recommendation.expected_outcomes?.length > 0 && (
                  <div className="bg-background/80 p-5 rounded-xl border border-success/20">
                    <div className="text-[10px] font-black text-success-hover uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <CheckCircle size={14} /> Expected Outcomes
                    </div>
                    <ul className="m-0 p-0 flex flex-col gap-2">
                      {recommendation.expected_outcomes.map((o, i) => (
                        <li key={i} className="flex gap-2.5 items-start text-sm font-medium text-text-secondary">
                          <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-text-muted border-2 border-dashed border-warning/30 rounded-xl p-8 bg-background/50">
              <Zap size={32} className="mx-auto mb-4 text-warning opacity-50" />
              <p className="text-sm font-medium max-w-md mx-auto">
                Click "Get Full Plan" to get a complete AI-generated preparation recommendation tailored to your target role and available time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
