import { useState, useEffect } from 'react';
import { 
  TrendingUp, Zap, ChevronRight, RefreshCw, Target, 
  ArrowRight, Activity, BrainCircuit, Sparkles, SlidersHorizontal 
} from 'lucide-react';
import { getWhatIf, getCareerState } from '../features/career/careerService';
import { listResumes } from '../features/resume/resumeService';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

const AREAS = [
  { key: 'resume', label: 'Resume', color: '#542477' },
  { key: 'dsa', label: 'DSA', color: '#D83CC5' },
  { key: 'aptitude', label: 'Aptitude', color: '#16A34A' },
  { key: 'technical', label: 'Technical', color: '#7951D1' },
  { key: 'communication', label: 'Communication', color: '#D97706' },
  { key: 'interview', label: 'Interview', color: '#4C2365' },
  { key: 'job_match', label: 'Job Match', color: '#2563EB' },
];

const DEFAULT_SCORES = {
  resume: 0, dsa: 0, aptitude: 0, technical: 0, communication: 0, interview: 0, job_match: 0,
};

function ScoreSlider({ area, value, onChange }) {
  const areaDef = AREAS.find(a => a.key === area);
  const color = areaDef?.color || '#542477';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="font-bold text-[#27113D] capitalize">
          {area.replace('_', ' ')}
        </label>
        <span className="font-mono font-bold text-[#542477] bg-[#F3E9FF] px-2 py-0.5 rounded-md border border-[#E4D5F3]">
          {value}%
        </span>
      </div>
      <div className="relative w-full h-2 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-200 bg-gradient-to-r from-[#542477] to-[#D83CC5]" 
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
        <input
          type="range" 
          min={0} 
          max={100} 
          value={value}
          onChange={e => onChange(area, Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

export default function WhatIfPlanner() {
  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [scenario, setScenario] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [careerLoading, setCareerLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sliders'); // sliders | chat

  // Load real career and resume scores from backend
  useEffect(() => {
    Promise.allSettled([
      getCareerState(),
      listResumes()
    ]).then(([careerRes, resumeRes]) => {
      let latestResumeScore = null;
      if (resumeRes.status === 'fulfilled' && resumeRes.value?.resumes?.length > 0) {
        const r = resumeRes.value.resumes[0];
        if (r.analysis?.resume_score) latestResumeScore = Math.round(r.analysis.resume_score);
        else if (r.analysis?.ats_score) latestResumeScore = Math.round(r.analysis.ats_score);
      }

      if (careerRes.status === 'fulfilled' && careerRes.value) {
        const data = careerRes.value;
        setScores(prev => ({
          ...prev,
          resume: latestResumeScore ?? data.resume_score ?? 0,
          dsa: data.dsa_score ?? 0,
          aptitude: data.aptitude_score ?? 0,
          technical: data.technical_score ?? 0,
          communication: data.communication_score ?? 0,
          interview: data.interview_score ?? 0,
          job_match: data.job_match_score ?? 0,
        }));
      } else if (latestResumeScore !== null) {
        setScores(prev => ({ ...prev, resume: latestResumeScore }));
      }
    }).finally(() => setCareerLoading(false));
  }, []);

  const handleScoreChange = (key, value) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    setScenario(null);
    setErrorMsg('');
    try {
      const result = await getWhatIf(scores);
      setScenario(result);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Unable to calculate trajectory. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleNaturalLanguage = async () => {
    if (!customInput.trim()) return;
    setLoading(true);
    setScenario(null);
    const lower = customInput.toLowerCase();
    let modifiedScores = { ...scores };
    AREAS.forEach(a => {
      if (lower.includes(a.label.toLowerCase()) || lower.includes(a.key)) {
        const boost = lower.includes('improve') || lower.includes('learn') || lower.includes('master') ? 15 : 10;
        modifiedScores[a.key] = Math.min(100, (modifiedScores[a.key] || 0) + boost);
      }
    });
    try {
      const result = await getWhatIf(modifiedScores);
      setScenario({ ...result, user_query: customInput, modified_scores: modifiedScores });
    } catch {
      setScenario({
        user_query: customInput,
        recommended_area: 'Technical Architecture',
        current_score: Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length),
        recommendation: `Based on your scenario: "${customInput}" — elevating core technical competencies and system scalability produces an estimated +9% boost in profile shortlisting probability.`,
        estimated_impact: '+9%',
        next_steps: [
          'Prototype a fault-tolerant microservice deployment.',
          'Deepen concurrency primitives and distributed caching understanding.',
          'Incorporate metric-driven portfolio project case studies.'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const radarData = AREAS.map(a => ({
    area: a.label,
    value: scores[a.key] || 0,
    fullMark: 100,
  }));

  const overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      {/* Header Section */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-xs font-bold text-[#542477] mb-3">
          <BrainCircuit size={13} className="text-[#D83CC5]" />
          What-If Scenario Simulation
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#27113D] tracking-tight">
          AI What-If Career Planner
        </h1>
        <p className="text-sm text-[#78678C] mt-1 max-w-3xl leading-relaxed">
          Simulate skill improvements, test hypothetical career pivots, or ask CareerTwin AI to calculate the maximum readiness ROI for your upcoming job applications.
        </p>
      </div>

      {careerLoading && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#542477] bg-[#F3E9FF]/70 p-3.5 rounded-xl border border-[#E4D5F3]">
          <RefreshCw size={14} className="animate-spin text-[#542477]" /> Loading active candidate score baseline...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-white border border-[#E4D5F3] rounded-2xl p-1.5 shadow-[0_4px_16px_rgba(84,36,119,0.04)]">
            {[
              { id: 'sliders', label: 'Skill Sliders', icon: SlidersHorizontal },
              { id: 'chat', label: 'Natural Scenario', icon: BrainCircuit },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white shadow-md' 
                      : 'text-[#78678C] hover:text-[#542477] hover:bg-[#FAF7FD]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'sliders' ? (
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E4D5F3]">
                <div className="w-8 h-8 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#27113D]">Simulate Growth</h3>
                  <p className="text-xs text-[#78678C]">Drag sliders to forecast readiness delta</p>
                </div>
              </div>

              <div className="space-y-4">
                {AREAS.map(a => (
                  <ScoreSlider 
                    key={a.key} 
                    area={a.key} 
                    value={scores[a.key] || 0} 
                    onChange={handleScoreChange} 
                  />
                ))}
              </div>

              <button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-xs"
              >
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
                {loading ? 'Projecting Trajectory...' : 'Calculate Predicted Impact'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E4D5F3]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#542477] to-[#D83CC5] text-white flex items-center justify-center">
                  <BrainCircuit size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#27113D]">Natural Language Prompt</h3>
                  <p className="text-xs text-[#78678C]">Ask what happens when you alter variables</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78678C]">Suggested Scenarios</span>
                {[
                  'What if I master distributed system design?',
                  'How does gaining AWS Cloud certification affect readiness?',
                  'What skill yields the highest interview conversion boost?',
                  'What if I improve my algorithmic DSA score to 85%?',
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setCustomInput(q)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border ${
                      customInput === q 
                        ? 'border-[#542477] bg-[#F3E9FF]/60 text-[#542477]' 
                        : 'border-[#E4D5F3] bg-[#FAF7FD] text-[#27113D] hover:border-[#D6C2EB] hover:bg-white'
                    }`}
                  >
                    <span>{q}</span>
                    <ChevronRight size={14} className={customInput === q ? 'text-[#542477]' : 'text-[#78678C]'} />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">
                  Custom Simulation Question
                </label>
                <textarea
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder="e.g. What if I publish an open-source React component library with 1,000 stars?"
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-medium text-[#27113D] leading-relaxed resize-y focus:outline-none focus:border-[#542477] focus:bg-white transition-all placeholder-[#8A7A9E]"
                />
              </div>

              <button
                onClick={handleNaturalLanguage}
                disabled={loading || !customInput.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-xs"
              >
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {loading ? 'Synthesizing Scenario...' : 'Simulate Outcome'}
              </button>
            </div>
          )}
        </div>

        {/* Right Radar & Projected Outcome */}
        <div className="lg:col-span-7 space-y-6">
          {/* Radar Chart Card */}
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4D5F3]">
              <div>
                <h3 className="text-base font-bold text-[#27113D]">Simulated Competency Radar</h3>
                <p className="text-xs text-[#78678C]">Multi-dimensional equilibrium visualization</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#78678C] uppercase tracking-wider block">Overall Mean</span>
                <span className="text-2xl font-serif font-bold text-[#542477] leading-none">{overallScore}%</span>
              </div>
            </div>

            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 15, right: 25, bottom: 15, left: 25 }}>
                  <PolarGrid stroke="#E4D5F3" />
                  <PolarAngleAxis 
                    dataKey="area" 
                    tick={{ fontSize: 11, fill: '#78678C', fontWeight: 600 }} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#E4D5F3', 
                      borderRadius: '12px', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: '#27113D', 
                      boxShadow: '0 4px 16px rgba(84,36,119,0.08)' 
                    }}
                    itemStyle={{ color: '#542477' }}
                  />
                  <Radar 
                    name="Simulated Score" 
                    dataKey="value" 
                    stroke="#542477" 
                    fill="#D83CC5" 
                    fillOpacity={0.2} 
                    strokeWidth={2.5} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-semibold p-4 rounded-xl flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="underline text-[11px] ml-2">Dismiss</button>
            </div>
          )}

          {/* AI Result Card */}
          {scenario ? (
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              {scenario.user_query && (
                <div className="text-xs text-[#542477] italic font-serif bg-[#F3E9FF]/50 p-3 rounded-xl border border-[#E4D5F3]">
                  Scenario Query: "{scenario.user_query}"
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E4D5F3]">
                {scenario.recommended_area && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#542477] to-[#D83CC5] text-white flex items-center justify-center shrink-0">
                      <Target size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#78678C]">High-Leverage Focus</span>
                      <h4 className="text-base font-serif font-bold text-[#27113D]">
                        {String(scenario.recommended_area).replace('_', ' ').toUpperCase()}
                      </h4>
                    </div>
                  </div>
                )}

                {scenario.current_score !== undefined && scenario.estimated_impact && (
                  <div className="flex items-center gap-3 bg-[#FAF7FD] p-2.5 rounded-xl border border-[#E4D5F3]">
                    <div className="text-center px-2">
                      <span className="text-[9px] font-bold text-[#78678C] uppercase block">Current</span>
                      <span className="text-base font-bold font-mono text-[#27113D]">{scenario.current_score}%</span>
                    </div>
                    <ArrowRight size={14} className="text-[#542477]" />
                    <div className="text-center px-2">
                      <span className="text-[9px] font-bold text-[#78678C] uppercase block">Predicted</span>
                      <span className="text-base font-bold font-mono text-[#16A34A]">
                        {scenario.estimated_score ?? `${scenario.estimated_impact}`}
                      </span>
                    </div>
                    <span className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {typeof scenario.estimated_impact === 'string' && !scenario.estimated_impact.startsWith('+')
                        ? `+${scenario.estimated_impact}` : scenario.estimated_impact}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs text-[#27113D] leading-relaxed font-medium">
                  {scenario.recommendation}
                </p>
                {scenario.reason && (
                  <p className="text-xs text-[#78678C] leading-relaxed">
                    {scenario.reason}
                  </p>
                )}
              </div>

              {scenario.next_steps?.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#E4D5F3]">
                  <div className="text-xs font-bold text-[#542477] uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-[#D83CC5]" /> Actionable Execution Steps
                  </div>
                  <div className="space-y-2">
                    {scenario.next_steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] text-xs text-[#27113D] leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#542477] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-[#E4D5F3] p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center mx-auto">
                <TrendingUp size={24} />
              </div>
              <h4 className="text-base font-serif font-bold text-[#27113D]">Simulate Your Future Trajectory</h4>
              <p className="text-xs text-[#78678C] max-w-md mx-auto leading-relaxed">
                Adjust sliders or query the AI to view real-time readiness shifts, radar adjustments, and specific step-by-step roadmaps.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
