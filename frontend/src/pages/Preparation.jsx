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
    <li className="flex items-start gap-4 py-3.5 border-b border-[#FAF7FD] last:border-0 hover:bg-[#FAF7FD] transition-colors px-2 rounded-xl">
      <span className="w-8 h-8 rounded-full bg-[#F3E9FF] text-[#542477] flex items-center justify-center text-xs font-black shrink-0 border border-[#E4D5F3] shadow-sm mt-0.5">
        {index + 1}
      </span>
      <div className="flex-1">
        <span className="text-xs font-bold text-[#27113D] block mb-1.5">{name}</span>
        <div className="flex items-center gap-2">
          {priority && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${
              String(priority).toLowerCase() === 'high' ? 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]' :
              String(priority).toLowerCase() === 'medium' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' :
              'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'
            }`}>
              {priority}
            </span>
          )}
          {duration && (
            <span className="text-[11px] text-[#8A7A9E] flex items-center gap-1 font-semibold bg-[#FAF7FD] border border-[#E4D5F3] px-2 py-0.5 rounded-md">
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
    <div className="animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs font-bold uppercase tracking-wider mb-2">
            <Zap size={13} className="text-[#D83CC5]" />
            CareerTwin AI Preparation
          </div>
          <h1 className="text-3xl font-heading font-black text-[#27113D] tracking-tight flex items-center gap-3">
            Your Preparation Plan
          </h1>
          <p className="text-[#5F4E75] text-base mt-1">
            The AI analyses your target role and skill gaps to build today's focused study session.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.04)] p-6 mb-8 flex flex-wrap gap-4 items-end animate-in slide-in-from-bottom-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-[#27113D] uppercase tracking-wider block mb-2">Target Role</label>
          <input
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-sm text-[#27113D] focus:outline-none focus:border-[#542477] focus:ring-1 focus:ring-[#542477] transition-all font-semibold"
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="text-xs font-bold text-[#27113D] uppercase tracking-wider block mb-2">Available Time</label>
          <div className="relative">
            <select
              value={availableTime}
              onChange={e => setAvailableTime(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-sm text-[#27113D] focus:outline-none focus:border-[#542477] focus:ring-1 focus:ring-[#542477] transition-all cursor-pointer font-semibold appearance-none"
            >
              {[30, 60, 90, 120].map(t => (
                <option key={t} value={t}>{t} minutes</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-3.5 text-[#8A7A9E] pointer-events-none" />
          </div>
        </div>
        <button
          className="px-6 py-3 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap text-xs"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Generating…' : 'Regenerate Plan'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-bold flex items-center gap-2 shadow-sm">
          <Target size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-8 duration-500 delay-100">
        {/* Today's tasks */}
        <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col p-6">
          <div className="pb-4 border-b border-[#E4D5F3] flex items-center gap-2 text-[#542477] font-heading font-black text-lg">
            <BookOpen size={20} className="text-[#D83CC5]" /> Today's Tasks
          </div>
          <div className="pt-6 flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-[#8A7A9E] text-xs font-semibold">
                <RefreshCw size={24} className="animate-spin mb-3 text-[#542477]" />
                AI is building your personalised tasks…
              </div>
            ) : tasks.length > 0 ? (
              <>
                {todayData?.message && (
                  <p className="text-xs font-semibold text-[#542477] bg-[#F3E9FF] border border-[#E4D5F3] p-3 rounded-xl mb-4">
                    {todayData.message}
                  </p>
                )}
                <ul className="m-0 p-0 flex-1 flex flex-col gap-1">
                  {tasks.map((task, i) => (
                    <TaskItem key={i} task={task} index={i} />
                  ))}
                </ul>
                {todayData?.total_time && (
                  <div className="mt-6 pt-4 border-t border-[#E4D5F3] text-xs font-bold text-[#5F4E75] flex items-center gap-2">
                    <Clock size={16} className="text-[#542477]" /> Total Est. Time: <span className="text-[#27113D]">{todayData.total_time} mins</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-[#8A7A9E] text-center border-2 border-dashed border-[#E4D5F3] rounded-2xl mt-2">
                <BookOpen size={24} className="mb-3 opacity-30 text-[#542477]" />
                <span className="text-xs">No tasks yet. Click Regenerate to have the AI build your plan.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Progress */}
          <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.04)] p-6">
            <div className="pb-4 border-b border-[#E4D5F3] flex items-center gap-2 text-[#542477] font-heading font-black text-lg">
              <BarChart2 size={20} className="text-[#D83CC5]" /> Weekly Progress
            </div>
            <div className="pt-6">
              <div className="text-5xl font-heading font-black text-[#542477] mb-4">{completion}%</div>
              <div className="h-3 rounded-full bg-[#E4D5F3] overflow-hidden mb-4">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] transition-all duration-1000 ease-out" 
                  style={{ width: `${completion}%` }} 
                />
              </div>
              {progress ? (
                <p className="text-xs font-bold text-[#5F4E75] m-0">
                  <span className="text-[#27113D]">{progress.weekly_sessions_completed}</span> of <span className="text-[#27113D]">{progress.weekly_sessions_total}</span> sessions complete
                </p>
              ) : (
                <p className="text-xs text-[#8A7A9E] font-medium m-0 flex items-center gap-1.5">
                  <Target size={14} className="text-[#542477]" /> Complete assessments to track your sessions
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Weak topics */}
            <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.04)] p-5">
              <div className="pb-3 border-b border-[#E4D5F3] flex items-center gap-2 text-[#E11D48] font-heading font-bold text-sm">
                <Target size={18} /> Focus Areas
              </div>
              <div className="pt-4">
                {loading ? (
                  <div className="py-4 text-center text-[#8A7A9E] text-xs font-medium flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-[#E11D48]" /> Analysing weak spots…
                  </div>
                ) : weakTopics.length > 0 ? (
                  <ul className="m-0 p-0 flex flex-col gap-2.5">
                    {weakTopics.slice(0, 4).map((t, i) => {
                      const name = typeof t === 'string' ? t : t.topic || t.name || String(t)
                      const priority = typeof t === 'object' ? t.priority : 'medium'
                      return (
                        <li key={i} className="flex justify-between items-center text-xs p-2.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl shadow-sm">
                          <span className="font-bold text-[#27113D] truncate mr-2">{name}</span>
                          {priority && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] shrink-0">
                              {priority}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="py-6 text-center text-[#8A7A9E] text-xs bg-[#FAF7FD] border border-dashed border-[#E4D5F3] rounded-xl">
                    No weak topics identified yet.<br/>Take an assessment first.
                  </div>
                )}
              </div>
            </div>

            {/* Strong topics */}
            <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.04)] p-5">
              <div className="pb-3 border-b border-[#E4D5F3] flex items-center gap-2 text-[#16A34A] font-heading font-bold text-sm">
                <CheckCircle size={18} /> Strengths
              </div>
              <div className="pt-4">
                {loading ? (
                  <div className="py-4 text-center text-[#8A7A9E] text-xs font-medium flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-[#16A34A]" /> Analysing…
                  </div>
                ) : strongTopics.length > 0 ? (
                  <ul className="m-0 p-0 flex flex-col gap-2.5">
                    {strongTopics.slice(0, 4).map((t, i) => {
                      const name = typeof t === 'string' ? t : t.topic || t.name || String(t)
                      return (
                        <li key={i} className="flex items-center gap-2 text-xs p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl shadow-sm">
                          <CheckCircle size={14} className="text-[#16A34A] shrink-0" />
                          <span className="font-bold text-[#27113D] truncate">{name}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="py-6 text-center text-[#8A7A9E] text-xs bg-[#FAF7FD] border border-dashed border-[#E4D5F3] rounded-xl">
                    Complete assessments to reveal your strong topics.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="mt-8 bg-white rounded-2xl border border-[#E4D5F3] shadow-[0_4px_20px_rgba(84,36,119,0.04)] p-6 md:p-8 animate-in slide-in-from-bottom-8 duration-500 delay-200">
        <div className="pb-4 border-b border-[#E4D5F3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-heading font-black text-lg text-[#542477]">
            <Zap size={20} className="text-[#D83CC5]" /> AI Deep Recommendation
          </div>
          <button
            className="px-6 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
            onClick={handleGetRecommendation}
            disabled={recLoading}
          >
            {recLoading ? <RefreshCw size={15} className="animate-spin" /> : <ChevronRight size={15} />}
            {recLoading ? 'Thinking…' : 'Get Full Plan'}
          </button>
        </div>
        
        <div className="pt-6 min-h-[140px] flex flex-col justify-center">
          {recommendation ? (
            <div className="animate-in fade-in">
              {recommendation.reason && (
                <p className="text-sm font-medium text-[#27113D] mb-6 leading-relaxed p-4 bg-[#FAF7FD] rounded-xl border border-[#E4D5F3] shadow-sm">
                  {recommendation.reason}
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendation.priority_topics?.length > 0 && (
                  <div className="bg-[#FAF7FD] p-5 rounded-2xl border border-[#E4D5F3]">
                    <div className="text-[10px] font-black text-[#542477] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <Target size={14} className="text-[#D83CC5]" /> Priority Topics
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.priority_topics.map((t, i) => (
                        <span key={i} className="text-xs px-3 py-1.5 rounded-xl bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3] font-bold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {recommendation.expected_outcomes?.length > 0 && (
                  <div className="bg-[#FAF7FD] p-5 rounded-2xl border border-[#E4D5F3]">
                    <div className="text-[10px] font-black text-[#16A34A] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <CheckCircle size={14} /> Expected Outcomes
                    </div>
                    <ul className="m-0 p-0 flex flex-col gap-2">
                      {recommendation.expected_outcomes.map((o, i) => (
                        <li key={i} className="flex gap-2.5 items-start text-xs font-semibold text-[#5F4E75]">
                          <CheckCircle2 size={16} className="text-[#16A34A] mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-[#8A7A9E] border-2 border-dashed border-[#E4D5F3] rounded-2xl p-8 bg-[#FAF7FD]">
              <Zap size={32} className="mx-auto mb-3 text-[#542477] opacity-40" />
              <p className="text-xs font-medium max-w-md mx-auto">
                Click "Get Full Plan" to get a complete AI-generated preparation recommendation tailored to your target role and available time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
