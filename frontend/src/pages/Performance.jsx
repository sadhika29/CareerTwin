import { useState, useEffect } from 'react'
import { TrendChart } from './_shared'
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RotateCcw, RefreshCw, BarChart3, TrendingUp, Target, Focus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'
import { analyzePerformance } from '../features/preparation/preparationService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

const demoScores = { dsa: 61, aptitude: 74, technical: 70, communication: 72, interview: 65, job_match: 76 }

function ScoreBar({ label, score }) {
  const isHigh = score >= 75
  const isMed = score >= 55
  const colorClass = isHigh ? 'bg-success' : isMed ? 'bg-warning' : 'bg-error'
  const textClass = isHigh ? 'text-success-hover' : isMed ? 'text-warning-hover' : 'text-error-hover'
  const bgClass = isHigh ? 'bg-success/20' : isMed ? 'bg-warning/20' : 'bg-error/20'

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-text-secondary capitalize">{label.replace('_', ' ')}</span>
        <span className={`text-sm font-black ${textClass}`}>{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`} style={{ width: `${score}%` }} />
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
    <div className="animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-ai/10 text-ai text-xs font-bold uppercase tracking-wider mb-3 inline-block">
            CareerTwin · Performance Intelligence
          </span>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
            Performance Analytics
          </h1>
          <p className="text-text-secondary text-base">
            Analyse your skill growth, track test reports, and get AI-powered improvement insights.
          </p>
        </div>
      </div>

      {/* Dimension scores & AI Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in slide-in-from-bottom-4 duration-500">
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" /> Current Skill Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {Object.entries(scores).map(([key, val]) => <ScoreBar key={key} label={key} score={val} />)}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-ai flex flex-col h-full bg-gradient-to-br from-background to-ai/5">
          <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 m-0 text-ai">
              <RefreshCw size={20} /> AI Analysis
            </CardTitle>
            <button
              className="px-4 py-2 bg-ai text-white hover:bg-ai-hover font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleAIAnalysis}
              disabled={aiLoading}
            >
              {aiLoading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {aiLoading ? 'Analysing…' : 'Run AI Analysis'}
            </button>
          </CardHeader>
          
          <CardContent className="pt-6 flex-1 flex flex-col">
            {aiAnalysis ? (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300 h-full">
                {aiAnalysis.priority_recommendation && (
                  <div className="p-4 rounded-xl bg-ai/10 border-l-4 border-l-ai shadow-sm text-sm font-medium text-text-primary">
                    <span className="font-bold text-ai block mb-1">🎯 Priority Recommendation</span>
                    {aiAnalysis.priority_recommendation}
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div className="flex-1 bg-error/5 border border-error/20 p-4 rounded-xl shadow-sm">
                    <div className="text-[10px] font-black text-error-hover uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Target size={14} /> WEAK TOPICS
                    </div>
                    <ul className="flex flex-col gap-2">
                      {(aiAnalysis.weak_topics || []).map((t, i) => (
                        <li key={i} className="text-sm font-medium text-text-secondary flex items-start gap-2">
                          <span className="text-error mt-0.5">•</span>
                          {typeof t === 'string' ? t : t.topic || String(t)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex-1 bg-success/5 border border-success/20 p-4 rounded-xl shadow-sm">
                    <div className="text-[10px] font-black text-success-hover uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> STRONG TOPICS
                    </div>
                    <ul className="flex flex-col gap-2">
                      {(aiAnalysis.strong_topics || []).map((t, i) => (
                        <li key={i} className="text-sm font-medium text-text-secondary flex items-start gap-2">
                          <span className="text-success mt-0.5">•</span>
                          {typeof t === 'string' ? t : t.topic || String(t)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-auto flex items-center gap-3 pt-4 border-t border-border/50">
                  <span className="text-sm font-bold text-text-secondary">Overall Trend:</span>
                  <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-md ${
                    aiAnalysis.trend === 'improving' ? 'bg-success/20 text-success-hover' 
                    : aiAnalysis.trend === 'declining' ? 'bg-error/20 text-error-hover' 
                    : 'bg-border text-text-secondary'
                  }`}>
                    {aiAnalysis.trend || 'stable'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-xl bg-background/50 text-text-muted">
                <RefreshCw size={32} className="mb-4 opacity-50" />
                <p className="text-sm font-medium">Click "Run AI Analysis" to get personalised insights about your performance trends and weak areas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cumulative stats */}
      <Card className="mb-8 shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="m-0">Cumulative Test Statistics</CardTitle>
          <span className="px-2.5 py-1 bg-background border border-border text-text-secondary text-[10px] font-black uppercase tracking-widest rounded-md">
            All Reports Combined
          </span>
        </CardHeader>
        <CardContent className="p-6 md:p-8 bg-background/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Questions Attempted', value: totalQuestions, bg: 'bg-background', border: 'border-border', color: 'text-text-primary', icon: <BarChart3 size={16} /> },
              { label: 'Passed', value: totalPassed, bg: 'bg-success/5', border: 'border-success/20', color: 'text-success-hover', icon: <CheckCircle2 size={16} /> },
              { label: 'Failed', value: totalFailed, bg: 'bg-error/5', border: 'border-error/20', color: 'text-error-hover', icon: <XCircle size={16} /> },
              { label: 'Skipped', value: totalSkipped, bg: 'bg-warning/5', border: 'border-warning/20', color: 'text-warning-hover', icon: <AlertCircle size={16} /> },
            ].map((item, i) => (
              <div key={i} className={`p-4 md:p-6 rounded-2xl border shadow-sm ${item.bg} ${item.border}`}>
                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-3 ${item.color}`}>
                  {item.icon}{item.label}
                </div>
                <div className={`text-3xl md:text-4xl font-black font-heading ${item.color}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> Readiness Progress Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <TrendChart />
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 m-0"><Focus size={20} className="text-warning" /> Weak Topics from Reports</CardTitle>
            <span className="px-2.5 py-1 bg-warning/10 text-warning-hover text-[10px] font-black uppercase tracking-widest rounded-md">
              Action Required
            </span>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-text-muted text-sm font-medium flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" /> Loading reports…
              </div>
            ) : reports.length > 0 ? (
              <div className="flex flex-col gap-3">
                {reports.flatMap(r => (r.weak_topics || [])).slice(0, 5).map((topic, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-background border border-border hover:border-warning/50 rounded-xl transition-colors group shadow-sm">
                    <div>
                      <strong className="text-sm font-bold text-text-primary block mb-1 group-hover:text-warning transition-colors">{topic}</strong>
                      <div className="text-xs text-text-muted">Identified in assessment report</div>
                    </div>
                    <button 
                      className="px-4 py-2 bg-background border border-warning/30 hover:bg-warning/10 text-warning-hover font-bold rounded-lg text-xs transition-all whitespace-nowrap"
                      onClick={() => navigate('/assessment')}
                    >
                      Practice Now
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-background/50">
                <Target size={24} className="mx-auto text-text-muted mb-3" />
                <p className="text-sm text-text-secondary">Complete assessments to see weak topic identification here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test reports table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-background/50 border-b border-border p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="m-0 mb-1">Recent Test Reports</CardTitle>
            <p className="text-sm text-text-muted m-0">Review your question breakdown and complete unfinished work.</p>
          </div>
          <button 
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm whitespace-nowrap"
            onClick={() => navigate('/assessment')}
          >
            Take New Assessment <ArrowRight size={16} />
          </button>
        </CardHeader>
        
        {loading ? (
          <div className="text-center py-12 text-text-muted text-sm font-medium flex items-center justify-center gap-2 bg-background/30">
            <RefreshCw size={16} className="animate-spin" /> Loading reports…
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Assessment</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Completed</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Score</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Breakdown</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, idx) => {
                  const passed = report.correct_answers ?? report.passed ?? 0
                  const failed = report.incorrect_answers ?? report.failed ?? 0
                  const skipped = report.unattempted ?? report.skipped ?? 0
                  const hasIncomplete = failed > 0 || skipped > 0
                  return (
                    <tr key={report.assessment_id} className={`border-b border-border/50 hover:bg-background/50 transition-colors ${idx % 2 === 0 ? 'bg-background/20' : 'bg-transparent'}`}>
                      <td className="px-6 py-4 text-sm font-bold text-text-primary">
                        {report.title || report.assessment_id}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-background border border-border rounded-md text-[10px] font-black uppercase tracking-widest text-text-secondary">
                          {report.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary font-medium">
                        {report.completed_at ? new Date(report.completed_at).toLocaleDateString() : report.date || '—'}
                      </td>
                      <td className="px-6 py-4 text-base font-black font-heading" style={{ color: report.score >= 70 ? 'var(--success-hover)' : 'var(--text-primary)' }}>
                        {Math.round(report.score)}%
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        <span className="text-success-hover font-bold bg-success/10 px-1.5 py-0.5 rounded">{passed}P</span>
                        <span className="text-border mx-1">·</span>
                        <span className="text-error-hover font-bold bg-error/10 px-1.5 py-0.5 rounded">{failed}F</span>
                        <span className="text-border mx-1">·</span>
                        <span className="text-warning-hover font-bold bg-warning/10 px-1.5 py-0.5 rounded">{skipped}S</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${
                          !hasIncomplete ? 'bg-success/20 text-success-hover' : 'bg-warning/20 text-warning-hover'
                        }`}>
                          {!hasIncomplete ? 'Mastered' : 'Incomplete'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {hasIncomplete ? (
                          <button 
                            className="px-4 py-2 bg-background border border-primary/30 hover:bg-primary/10 text-primary font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm" 
                            onClick={() => navigate('/assessment')}
                          >
                            <RotateCcw size={12} /> Complete
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-text-muted flex items-center gap-1">
                            <CheckCircle2 size={12} /> Done
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-background/30 text-text-muted flex flex-col items-center">
            <BarChart3 size={32} className="mb-4 opacity-30" />
            <p className="text-sm font-medium max-w-md">No test reports yet. Take an assessment to see your detailed performance here.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
