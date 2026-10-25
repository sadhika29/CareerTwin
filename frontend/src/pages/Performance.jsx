import { useState, useEffect } from 'react';
import { TrendChart } from './_shared';
import { 
  CheckCircle2, XCircle, AlertCircle, ArrowRight, RotateCcw, 
  RefreshCw, BarChart3, TrendingUp, Target, Focus, Sparkles, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { analyzePerformance } from '../features/preparation/preparationService';
import { listResumes } from '../features/resume/resumeService';

const initialScores = { dsa: 0, aptitude: 0, technical: 0, communication: 0, interview: 0, job_match: 0, resume: 0 };

function ScoreBar({ label, score }) {
  const isHigh = score >= 75;
  const isMed = score >= 55;
  const colorClass = isHigh 
    ? 'bg-gradient-to-r from-[#16A34A] to-[#22C55E]' 
    : isMed 
    ? 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]' 
    : 'bg-gradient-to-r from-[#E11D48] to-[#F43F5E]';
    
  const textClass = isHigh ? 'text-[#16A34A]' : isMed ? 'text-[#D97706]' : 'text-[#E11D48]';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-[#27113D] capitalize">
          {label.replace('_', ' ')}
        </span>
        <span className={`font-mono font-bold ${textClass}`}>
          {score}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`} 
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }} 
        />
      </div>
    </div>
  );
}

export default function Performance() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [scores, setScores] = useState(initialScores);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    // Load backend reports and real scores
    Promise.allSettled([
      axiosClient.get('/preparation/reports'),
      axiosClient.get('/career/readiness'),
      listResumes()
    ]).then(([repRes, readyRes, resumeRes]) => {
      if (repRes.status === 'fulfilled' && repRes.value?.data?.reports?.length > 0) {
        setReports(repRes.value.data.reports);
      }

      if (readyRes.status === 'fulfilled' && readyRes.value?.data) {
        const d = readyRes.value.data;
        setScores(prev => ({
          ...prev,
          dsa: d.dsa_score ?? 0,
          aptitude: d.aptitude_score ?? 0,
          technical: d.technical_score ?? 0,
          communication: d.communication_score ?? 0,
          interview: d.interview_score ?? 0,
          job_match: d.job_match_score ?? 0,
        }));
      }

      if (resumeRes.status === 'fulfilled' && resumeRes.value?.resumes?.length > 0) {
        const latestR = resumeRes.value.resumes[0];
        const rScore = latestR.analysis?.resume_score || latestR.analysis?.ats_score;
        if (rScore) {
          setScores(prev => ({ ...prev, resume: Math.round(rScore) }));
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleAIAnalysis = async () => {
    if (reports.length === 0) {
      setAnalysisError('Complete at least one assessment test before requesting AI performance analysis.');
      return;
    }
    setAiLoading(true);
    setAnalysisError('');
    try {
      const result = await analyzePerformance({
        assessment_history: reports,
        target_role: 'Software Engineer',
      });
      setAiAnalysis(result);
    } catch (err) {
      setAnalysisError(err.response?.data?.detail || 'AI performance analysis service unavailable. Please retry shortly.');
    } finally {
      setAiLoading(false);
    }
  };

  const totalPassed = reports.reduce((a, r) => a + (r.correct_answers ?? r.passed ?? 0), 0);
  const totalFailed = reports.reduce((a, r) => a + (r.incorrect_answers ?? r.failed ?? 0), 0);
  const totalSkipped = reports.reduce((a, r) => a + (r.unattempted ?? r.skipped ?? 0), 0);
  const totalQuestions = totalPassed + totalFailed + totalSkipped;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      {/* Header section */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-xs font-bold text-[#542477] mb-3">
          <BarChart3 size={13} className="text-[#D83CC5]" />
          Performance Intelligence
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#27113D] tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-sm text-[#78678C] mt-1 max-w-3xl leading-relaxed">
          Monitor your cross-competency mastery, review diagnostic assessment reports, and evaluate trajectory projections powered by CareerTwin AI.
        </p>
      </div>

      {/* Dimension scores & AI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Current Skill Scores Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#E4D5F3]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center">
                <BarChart3 size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#27113D]">Current Skill Scores</h3>
                <p className="text-xs text-[#78678C]">Weighted proficiency index across primary dimensions</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {Object.entries(scores).map(([key, val]) => (
              <ScoreBar key={key} label={key} score={val} />
            ))}
          </div>
        </div>

        {/* AI Analysis Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E4D5F3] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#542477] to-[#D83CC5] text-white flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#27113D]">AI Diagnostic Analysis</h3>
                  <p className="text-xs text-[#78678C]">Personalized performance trajectory review</p>
                </div>
              </div>

              <button
                onClick={handleAIAnalysis}
                disabled={aiLoading}
                className="px-3.5 py-2 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_14px_rgba(84,36,119,0.2)] hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60"
              >
                {aiLoading ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {aiLoading ? 'Analysing...' : 'Run AI Analysis'}
              </button>
            </div>

            <div className="pt-5">
              {analysisError && (
                <div className="bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-semibold p-3.5 rounded-xl mb-4 flex items-center justify-between">
                  <span>{analysisError}</span>
                  <button onClick={() => setAnalysisError('')} className="underline text-[11px] ml-2">Dismiss</button>
                </div>
              )}

              {aiAnalysis ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {aiAnalysis.priority_recommendation && (
                    <div className="p-4 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] space-y-1">
                      <div className="text-[10px] font-bold text-[#542477] uppercase tracking-wider flex items-center gap-1.5">
                        <Target size={13} className="text-[#D83CC5]" />
                        Priority Recommendation
                      </div>
                      <p className="text-xs text-[#27113D] leading-relaxed">
                        {aiAnalysis.priority_recommendation}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#FFF1F2] border border-[#FECDD3] p-3.5 rounded-xl space-y-2">
                      <div className="text-[10px] font-bold text-[#E11D48] uppercase tracking-wider flex items-center gap-1">
                        <Target size={12} /> Weak Focus Areas
                      </div>
                      <ul className="space-y-1.5">
                        {(aiAnalysis.weak_topics || []).map((t, i) => (
                          <li key={i} className="text-xs text-[#9F1239] flex items-start gap-1.5">
                            <span className="font-bold">•</span>
                            <span>{typeof t === 'string' ? t : t.topic || String(t)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 rounded-xl space-y-2">
                      <div className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={12} /> Strong Capabilities
                      </div>
                      <ul className="space-y-1.5">
                        {(aiAnalysis.strong_topics || []).map((t, i) => (
                          <li key={i} className="text-xs text-[#166534] flex items-start gap-1.5">
                            <span className="font-bold">•</span>
                            <span>{typeof t === 'string' ? t : t.topic || String(t)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-[#E4D5F3] bg-[#FAF7FD]/50 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center mx-auto">
                    <Sparkles size={18} />
                  </div>
                  <p className="text-xs font-semibold text-[#27113D]">AI Diagnostic Ready</p>
                  <p className="text-xs text-[#78678C] max-w-sm mx-auto leading-relaxed">
                    Click "Run AI Analysis" to synthesize strengths, weak topic patterns, and velocity vectors.
                  </p>
                </div>
              )}
            </div>
          </div>

          {aiAnalysis && (
            <div className="mt-5 pt-3.5 border-t border-[#E4D5F3] flex items-center justify-between text-xs">
              <span className="font-bold text-[#78678C]">Overall Trajectory:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                aiAnalysis.trend === 'improving' 
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]' 
                  : aiAnalysis.trend === 'declining' 
                  ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#E11D48]' 
                  : 'bg-[#F3E9FF] border-[#E4D5F3] text-[#542477]'
              }`}>
                {aiAnalysis.trend || 'Stable'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cumulative Statistics Section */}
      <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E4D5F3] gap-2">
          <div>
            <h3 className="text-base font-bold text-[#27113D]">Cumulative Test Statistics</h3>
            <p className="text-xs text-[#78678C]">Aggregate evaluation metrics recorded across all mock assessments</p>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-bold text-[#542477] bg-[#F3E9FF] px-2.5 py-1 rounded-full border border-[#E4D5F3]">
            All History Combined
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Questions Attempted', 
              value: totalQuestions, 
              bg: 'bg-[#FAF7FD]', 
              border: 'border-[#E4D5F3]', 
              color: 'text-[#542477]',
              icon: BarChart3
            },
            { 
              label: 'Questions Passed', 
              value: totalPassed, 
              bg: 'bg-[#F0FDF4]', 
              border: 'border-[#BBF7D0]', 
              color: 'text-[#16A34A]',
              icon: CheckCircle2
            },
            { 
              label: 'Questions Failed', 
              value: totalFailed, 
              bg: 'bg-[#FFF1F2]', 
              border: 'border-[#FECDD3]', 
              color: 'text-[#E11D48]',
              icon: XCircle
            },
            { 
              label: 'Questions Skipped', 
              value: totalSkipped, 
              bg: 'bg-[#FFFBEB]', 
              border: 'border-[#FDE68A]', 
              color: 'text-[#D97706]',
              icon: AlertCircle
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className={`p-4 sm:p-5 rounded-2xl border ${item.bg} ${item.border} space-y-2`}>
                <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${item.color}`}>
                  <Icon size={13} />
                  <span>{item.label}</span>
                </div>
                <div className={`text-2xl sm:text-3xl font-black font-serif ${item.color}`}>
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Readiness Progress Trend & Weak Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E4D5F3]">
            <div className="w-8 h-8 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#27113D]">Readiness Progress Trend</h3>
              <p className="text-xs text-[#78678C]">Weekly progression towards target interview benchmark</p>
            </div>
          </div>
          <div className="pt-2">
            <TrendChart />
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4D5F3]">
              <div className="flex items-center gap-2">
                <Focus size={16} className="text-[#D97706]" />
                <h3 className="text-base font-bold text-[#27113D]">Weak Topics</h3>
              </div>
              <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                Action Priority
              </span>
            </div>

            <div className="pt-3">
              {loading ? (
                <div className="py-8 text-center text-xs text-[#78678C] flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Loading diagnostics...
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-2.5">
                  {reports.flatMap(r => (r.weak_topics || [])).slice(0, 4).map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] hover:border-[#D6C2EB] transition-colors">
                      <div>
                        <span className="text-xs font-bold text-[#27113D] block">{topic}</span>
                        <span className="text-[10px] text-[#78678C]">Flagged in recent assessment</span>
                      </div>
                      <button 
                        onClick={() => navigate('/preparation')}
                        className="px-3 py-1.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#542477] rounded-lg transition-all"
                      >
                        Study
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[#E4D5F3] bg-[#FAF7FD]/50 space-y-1">
                  <Target size={20} className="mx-auto text-[#78678C]" />
                  <p className="text-xs text-[#78678C]">Complete assessments to identify weak topics.</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/interview')}
            className="w-full py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#542477] rounded-xl transition-all flex items-center justify-center gap-2 mt-3"
          >
            Launch Mock Interview <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Test Reports Table */}
      <div className="bg-white rounded-2xl border border-[#E4D5F3] overflow-hidden shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
        <div className="p-6 border-b border-[#E4D5F3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#27113D]">Recent Test Reports</h3>
            <p className="text-xs text-[#78678C]">Breakdown of attempts, mastery scores, and completion status</p>
          </div>
          <button 
            onClick={() => navigate('/interview')}
            className="px-4 py-2 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_14px_rgba(84,36,119,0.2)] hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            Take New Assessment <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-[#78678C] flex items-center justify-center gap-2">
            <RefreshCw size={15} className="animate-spin text-[#542477]" /> Loading reports...
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E4D5F3] bg-[#FAF7FD]">
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78678C] text-[10px]">Assessment</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78678C] text-[10px]">Category</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78678C] text-[10px]">Date</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78678C] text-[10px]">Score</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78678C] text-[10px]">Breakdown</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78678C] text-[10px]">Status</th>
                  <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[#78678C] text-[10px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4D5F3]">
                {reports.map((report) => {
                  const passed = report.correct_answers ?? report.passed ?? 0;
                  const failed = report.incorrect_answers ?? report.failed ?? 0;
                  const skipped = report.unattempted ?? report.skipped ?? 0;
                  const hasIncomplete = failed > 0 || skipped > 0;
                  return (
                    <tr key={report.assessment_id} className="hover:bg-[#FAF7FD]/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#27113D]">
                        {report.title || report.assessment_id}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-[10px] font-bold text-[#542477]">
                          {report.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#78678C]">
                        {report.completed_at ? new Date(report.completed_at).toLocaleDateString() : report.date || '—'}
                      </td>
                      <td className="px-6 py-4 font-bold font-mono text-sm text-[#542477]">
                        {Math.round(report.score)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[#16A34A] font-bold bg-[#F0FDF4] border border-[#BBF7D0] px-1.5 py-0.5 rounded text-[10px]">{passed}P</span>
                        <span className="text-[#D6C2EB] mx-1">·</span>
                        <span className="text-[#E11D48] font-bold bg-[#FFF1F2] border border-[#FECDD3] px-1.5 py-0.5 rounded text-[10px]">{failed}F</span>
                        <span className="text-[#D6C2EB] mx-1">·</span>
                        <span className="text-[#D97706] font-bold bg-[#FFFBEB] border border-[#FDE68A] px-1.5 py-0.5 rounded text-[10px]">{skipped}S</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                          !hasIncomplete ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]' : 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                        }`}>
                          {!hasIncomplete ? 'Mastered' : 'Needs Review'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {hasIncomplete ? (
                          <button 
                            onClick={() => navigate('/interview')}
                            className="px-3 py-1.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#542477] font-bold rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
                          >
                            <RotateCcw size={11} /> Review
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
                            <CheckCircle2 size={13} /> Complete
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-[#78678C] space-y-2">
            <BarChart3 size={28} className="mx-auto text-[#D6C2EB]" />
            <p className="text-xs font-semibold">No diagnostic reports yet</p>
            <p className="text-xs text-[#78678C] max-w-sm mx-auto">Complete assessments to see your question-by-question performance records here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
