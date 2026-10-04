import { useState, useEffect } from 'react';
import { TrendingUp, Zap, ChevronRight, RefreshCw, Target, ArrowRight, Activity, BrainCircuit } from 'lucide-react';
import { getWhatIf, getCareerState } from '../features/career/careerService';
import { listResumes } from '../features/resume/resumeService';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const AREAS = [
  { key: 'resume', label: 'Resume', color: '#6C63FF' }, // primary
  { key: 'dsa', label: 'DSA', color: '#F59E0B' }, // warning
  { key: 'aptitude', label: 'Aptitude', color: '#22C55E' }, // success
  { key: 'technical', label: 'Technical', color: '#3B82F6' }, // blue
  { key: 'communication', label: 'Communication', color: '#EC4899' }, // pink
  { key: 'interview', label: 'Interview', color: '#8B5CF6' }, // purple
  { key: 'job_match', label: 'Job Match', color: '#06B6D4' }, // ai accent
];

const DEFAULT_SCORES = {
  resume: 82, dsa: 61, aptitude: 74, technical: 70, communication: 72, interview: 65, job_match: 76,
};

function ScoreSlider({ area, value, onChange }) {
  const color = AREAS.find(a => a.key === area)?.color || '#6C63FF';
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-bold text-text-primary capitalize tracking-wide">
          {area.replace('_', ' ')}
        </label>
        <span className="text-sm font-black" style={{ color }}>{value}</span>
      </div>
      <div className="relative w-full h-2 rounded-full bg-border/50">
        <div 
          className="absolute top-0 left-0 h-full rounded-full pointer-events-none transition-all duration-200" 
          style={{ width: `${value}%`, backgroundColor: color }}
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
          resume: latestResumeScore ?? data.resume_score ?? prev.resume,
          dsa: data.dsa_score ?? prev.dsa,
          aptitude: data.aptitude_score ?? prev.aptitude,
          technical: data.technical_score ?? prev.technical,
          communication: data.communication_score ?? prev.communication,
          interview: data.interview_score ?? prev.interview,
          job_match: data.job_match_score ?? prev.job_match,
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
    try {
      const result = await getWhatIf(scores);
      setScenario(result);
    } catch {
      setScenario({
        recommended_area: 'DSA',
        estimated_impact: '+8%',
        current_score: Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length),
        recommendation: 'Based on your current scores, improving DSA would yield the highest readiness boost.',
        reason: 'AI analysis could not be reached. Showing local estimate.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNaturalLanguage = async () => {
    if (!customInput.trim()) return;
    setLoading(true);
    setScenario(null);
    // Parse user intent and map to area changes
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
        recommendation: `Based on: "${customInput}" — improving your weakest areas first gives the highest readiness gain.`,
        estimated_impact: '+5–12%',
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
    <div className="animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
          AI Career Planner
          <BrainCircuit size={24} className="text-primary" />
        </h1>
        <p className="text-text-secondary text-base">
          Adjust your skill scores or ask the AI to simulate what will give you the highest career readiness boost.
        </p>
      </div>

      {careerLoading && (
        <div className="flex items-center gap-2 mb-6 text-sm font-medium text-text-muted bg-background p-3 rounded-xl border border-border">
          <RefreshCw size={16} className="animate-spin text-primary" /> Loading your current career scores...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Tab switcher */}
          <div className="flex bg-background border border-border rounded-xl p-1 shadow-sm">
            {[
              { id: 'sliders', label: 'Score Sliders' },
              { id: 'chat', label: 'Natural Language' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-border/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'sliders' ? (
            <Card className="border-primary/10 shadow-md">
              <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <Activity size={18} className="text-primary" /> Simulate Skill Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-text-secondary mb-6">
                  Drag any slider to simulate improvement, then calculate the predicted impact on your overall readiness.
                </p>
                
                <div className="flex flex-col gap-2">
                  {AREAS.map(a => (
                    <ScoreSlider key={a.key} area={a.key} value={scores[a.key] || 0} onChange={handleScoreChange} />
                  ))}
                </div>
                
                <button
                  className="w-full mt-4 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleCalculate}
                  disabled={loading}
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                  {loading ? 'AI is calculating...' : 'Calculate Impact'}
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-ai/20 shadow-md bg-gradient-to-br from-background to-ai/5">
              <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-ai">
                  <BrainCircuit size={18} /> Ask the AI
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-text-secondary mb-6">
                  Ask in plain English and the AI will analyse your intent and simulate the outcome on your profile.
                </p>
                
                <div className="flex flex-col gap-3 mb-6">
                  {[
                    'What should I improve first?',
                    'What if I learn Docker?',
                    'Which skill will improve my job match most?',
                    'What happens if I master System Design?',
                  ].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setCustomInput(q)}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 border ${
                        customInput === q 
                          ? 'border-ai bg-ai/10 text-ai' 
                          : 'border-border bg-background text-text-secondary hover:border-ai/50 hover:text-text-primary'
                      }`}
                    >
                      <ChevronRight size={16} className={customInput === q ? 'text-ai' : 'text-border'} />
                      {q}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <textarea
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    placeholder="Or type your own question..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-text-primary leading-relaxed resize-y focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai transition-all"
                  />
                </div>
                
                <button
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-ai to-primary hover:opacity-90 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleNaturalLanguage}
                  disabled={loading || !customInput.trim()}
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                  {loading ? 'AI is thinking...' : 'Analyse Scenario'}
                </button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: radar + result */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Radar chart */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                <h2 className="text-xl font-heading font-bold text-text-primary m-0">Career Radar</h2>
                <div className="text-right">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Overall</span>
                  <span className="text-3xl font-black text-primary leading-none">{overallScore}%</span>
                </div>
              </div>
              
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="area" tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 600 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                    />
                    <Radar name="Simulated Score" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* AI result card */}
          {scenario ? (
            <Card className="border-l-4 border-l-ai bg-gradient-to-r from-background to-ai/5 shadow-md animate-in slide-in-from-bottom-4 duration-300">
              <CardContent className="p-6 md:p-8">
                {scenario.user_query && (
                  <div className="text-sm text-text-secondary italic mb-5 font-serif border-l-2 border-border pl-3">
                    Query: "{scenario.user_query}"
                  </div>
                )}
                
                <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <BrainCircuit size={14} className="text-ai" /> AI Recommendation
                </div>
                
                {scenario.recommended_area && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-ai/10 text-ai flex items-center justify-center shrink-0">
                      <Target size={20} />
                    </div>
                    <span className="text-xl font-heading font-black text-text-primary">
                      Focus on: <span className="text-ai">{String(scenario.recommended_area).replace('_', ' ').toUpperCase()}</span>
                    </span>
                  </div>
                )}
                
                {scenario.current_score !== undefined && scenario.estimated_impact && (
                  <div className="flex items-center gap-6 mb-8 bg-background border border-border rounded-xl p-5 w-fit">
                    <div className="text-center">
                      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Current</div>
                      <div className="text-3xl font-black text-text-primary leading-none">{scenario.current_score}%</div>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-ai/50">
                      <ArrowRight size={24} className="text-ai" />
                    </div>
                    <div className="text-center relative">
                      <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Predicted</div>
                      <div className="text-3xl font-black text-success leading-none">
                        {scenario.estimated_score ?? `${scenario.estimated_impact}`}
                      </div>
                    </div>
                    
                    {scenario.estimated_impact && (
                      <div className="ml-4 pl-4 border-l border-border h-12 flex items-center">
                        <div className="px-3 py-1.5 rounded-lg bg-success/10 text-success font-bold text-sm">
                          {typeof scenario.estimated_impact === 'string' && !scenario.estimated_impact.startsWith('+')
                            ? `+${scenario.estimated_impact}` : scenario.estimated_impact}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-base text-text-primary leading-relaxed font-medium mb-3">
                    {scenario.recommendation}
                  </p>
                  {scenario.reason && (
                    <p className="text-sm text-text-secondary leading-relaxed mb-6">
                      {scenario.reason}
                    </p>
                  )}
                </div>
                
                {scenario.next_steps?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" /> Actionable Next Steps
                    </div>
                    <ul className="flex flex-col gap-3 m-0 p-0">
                      {scenario.next_steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-text-secondary bg-background p-3 rounded-lg border border-border">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">
                            {i + 1}
                          </div>
                          <span className="leading-relaxed font-medium">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-background border-dashed border-2 flex items-center justify-center py-24 shadow-none">
              <CardContent className="flex flex-col items-center text-center p-0">
                <div className="w-20 h-20 bg-border/30 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp size={36} className="text-text-muted" />
                </div>
                <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Simulate Your Future</h3>
                <p className="text-sm text-text-secondary max-w-md">
                  Adjust the skill sliders or ask a question to see the AI's predicted impact on your overall career readiness and get a personalized action plan.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
