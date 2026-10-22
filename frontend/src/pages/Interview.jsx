import { useState, useRef } from 'react';
import { 
  Mic, MicOff, CheckCircle2, XCircle, ChevronRight, RefreshCw, 
  MessageSquare, Award, ArrowLeft, Play, Settings2, Sparkles,
  Briefcase, Code2, Users, HelpCircle, Lightbulb, Target
} from 'lucide-react';
import { startInterview, submitAnswer } from '../features/interview/interviewService';

const ROUND_TYPES = [
  { 
    value: 'technical', 
    label: 'Technical Deep-Dive', 
    desc: 'Algorithms, system architecture, data structures, and foundational engineering principles.',
    icon: Code2
  },
  { 
    value: 'project', 
    label: 'Project & Experience Review', 
    desc: 'Deep inspection of your portfolio, architectural trade-offs, scalability, and production blockers.',
    icon: Briefcase
  },
  { 
    value: 'hr', 
    label: 'HR & Behavioural (STAR)', 
    desc: 'Situational leadership, stakeholder management, conflict resolution, and team cultural alignment.',
    icon: Users
  },
];

function RatingBar({ score, max = 10 }) {
  const pct = Math.round((score / max) * 100);
  const colorClass = pct >= 70 ? 'bg-gradient-to-r from-[#16A34A] to-[#22C55E]' : pct >= 40 ? 'bg-gradient-to-r from-[#D97706] to-[#F59E0B]' : 'bg-gradient-to-r from-[#E11D48] to-[#F43F5E]';
  const textColorClass = pct >= 70 ? 'text-[#16A34A]' : pct >= 40 ? 'text-[#D97706]' : 'text-[#E11D48]';
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-[#F3E9FF] rounded-full h-2 overflow-hidden border border-[#E4D5F3]">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className={`text-xs font-bold min-w-[42px] text-right font-mono ${textColorClass}`}>
        {score}/{max}
      </span>
    </div>
  );
}

function EvaluationCard({ evaluation, questionText }) {
  const { score, max_score, feedback, strengths, improvements, suggested_answer } = evaluation || {};
  return (
    <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.04)] mb-4 hover:border-[#D6C2EB] transition-all">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare size={16} />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#78678C]">Interview Question</span>
          <p className="text-sm font-semibold text-[#27113D] italic mt-0.5 font-serif">
            "{questionText}"
          </p>
        </div>
      </div>
      
      {score !== undefined && (
        <div className="mb-5 bg-[#FAF7FD] border border-[#E4D5F3] p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-[#542477] uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#D83CC5]" /> AI Score Assessment
            </span>
          </div>
          <RatingBar score={score} max={max_score || 10} />
        </div>
      )}
      
      {feedback && (
        <p className="text-xs text-[#27113D] leading-relaxed mb-5 bg-[#FAF7FD]/60 p-3.5 rounded-xl border border-[#F3E9FF]">
          {feedback}
        </p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        {strengths?.length > 0 && (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-4 rounded-xl">
            <div className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Key Strengths
            </div>
            <ul className="flex flex-col gap-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#166534] leading-relaxed">
                  <span className="text-[#16A34A] font-bold shrink-0 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {improvements?.length > 0 && (
          <div className="bg-[#FFF1F2] border border-[#FECDD3] p-4 rounded-xl">
            <div className="text-[11px] font-bold text-[#E11D48] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <XCircle size={14} /> Areas to Elevate
            </div>
            <ul className="flex flex-col gap-2">
              {improvements.map((imp, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#9F1239] leading-relaxed">
                  <span className="text-[#E11D48] font-bold shrink-0 mt-0.5">•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {suggested_answer && (
        <details className="mt-4 group border border-[#E4D5F3] rounded-xl bg-[#FAF7FD] overflow-hidden">
          <summary className="text-xs font-bold text-[#542477] cursor-pointer p-3.5 outline-none select-none list-none flex items-center justify-between hover:bg-[#F3E9FF]/40 transition-colors">
            <span className="flex items-center gap-2">
              <Lightbulb size={14} className="text-[#D83CC5]" />
              View Recommended Ideal Answer Strategy
            </span>
            <ChevronRight size={15} className="transition-transform group-open:rotate-90 text-[#78678C]" />
          </summary>
          <div className="p-4 pt-1 text-xs text-[#27113D] leading-relaxed border-t border-[#E4D5F3] bg-white">
            {suggested_answer}
          </div>
        </details>
      )}
    </div>
  );
}

export default function Interview() {
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [roundType, setRoundType] = useState('technical');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');

  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [phase, setPhase] = useState('setup'); // setup | interview | done
  const [loading, setLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const textareaRef = useRef(null);

  const handleStart = async () => {
    setLoading(true);
    try {
      const data = await startInterview({
        type: roundType,
        target_role: targetRole,
        count: numQuestions,
        difficulty,
      });
      setSession(data);
      setCurrentIndex(0);
      setEvaluations([]);
      setAnswer('');
      setPhase('interview');
    } catch {
      alert('Failed to start interview. Please ensure backend services are connected.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = session?.questions?.[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setEvalLoading(true);
    try {
      const result = await submitAnswer(session.session_id, {
        question: currentQuestion?.question || '',
        question_type: currentQuestion?.type || roundType,
        answer,
        target_role: targetRole,
        expected_key_points: currentQuestion?.key_points || [],
      });
      setEvaluations(prev => [
        ...prev,
        { question: currentQuestion?.question || '', evaluation: result.evaluation },
      ]);
      setAnswer('');
      if (currentIndex < session.questions.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setPhase('done');
      }
    } catch {
      alert('Answer evaluation encountered a network hiccup. Please re-try submitting.');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleSkip = () => {
    setEvaluations(prev => [
      ...prev,
      { question: currentQuestion?.question || '', evaluation: null, skipped: true },
    ]);
    setAnswer('');
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setPhase('done');
    }
  };

  const overallScore = evaluations
    .filter(e => e.evaluation?.score !== undefined)
    .map(e => (e.evaluation.score / (e.evaluation.max_score || 10)) * 100);

  const avgScore = overallScore.length
    ? Math.round(overallScore.reduce((a, b) => a + b, 0) / overallScore.length)
    : 0;

  // ——— 1. SETUP SCREEN ———
  if (phase === 'setup') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
        {/* Header Section */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-xs font-bold text-[#542477] mb-3">
            <Mic size={13} className="text-[#D83CC5]" />
            AI Mock Interview Room
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#27113D] tracking-tight">
            AI Mock Interview Studio
          </h1>
          <p className="text-sm text-[#78678C] mt-1 max-w-3xl leading-relaxed">
            Simulate realistic, role-tailored technical and behavioral interview sessions. CareerTwin analyzes your responses against industry rubrics in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Configurator */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#E4D5F3]">
                <div className="w-8 h-8 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center">
                  <Settings2 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#27113D]">Session Parameters</h3>
                  <p className="text-xs text-[#78678C]">Tune your focus discipline, question pool, and rigor.</p>
                </div>
              </div>

              {/* Target Role Input */}
              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">
                  Target Role / Discipline
                </label>
                <div className="relative">
                  <input
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer, Product Manager"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] placeholder-[#8A7A9E] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  />
                  <Target size={15} className="absolute right-3.5 top-3 text-[#78678C]" />
                </div>
              </div>

              {/* Interview Types (Selectable Cards) */}
              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">
                  Interview Format
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {ROUND_TYPES.map(r => {
                    const Icon = r.icon;
                    const isSelected = roundType === r.value;
                    return (
                      <div
                        key={r.value}
                        onClick={() => setRoundType(r.value)}
                        className={`flex items-start gap-3.5 p-4 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'border-[#542477] bg-[#F3E9FF]/45 shadow-[0_4px_16px_rgba(84,36,119,0.08)]'
                            : 'border-[#E4D5F3] bg-[#FAF7FD]/50 hover:border-[#D6C2EB] hover:bg-white'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected ? 'bg-[#542477] text-white shadow-sm' : 'bg-white border border-[#E4D5F3] text-[#542477]'
                        }`}>
                          <Icon size={17} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? 'text-[#542477]' : 'text-[#27113D]'}`}>
                              {r.label}
                            </span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected ? 'border-[#542477] bg-[#542477]' : 'border-[#D6C2EB] bg-white'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-[#78678C] mt-1 leading-relaxed">
                            {r.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Questions & Difficulty Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">
                    Question Count
                  </label>
                  <select
                    value={numQuestions}
                    onChange={e => setNumQuestions(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all cursor-pointer"
                  >
                    {[3, 5, 7, 10].map(n => (
                      <option key={n} value={n}>{n} Questions</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all cursor-pointer"
                  >
                    {['easy', 'medium', 'hard'].map(d => (
                      <option key={d} value={d}>
                        {d.charAt(0).toUpperCase() + d.slice(1)} Rigor
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStart}
                disabled={loading || !targetRole.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {loading ? <RefreshCw size={17} className="animate-spin" /> : <Play size={17} />}
                {loading ? 'Synthesizing Live Questions...' : 'Start Interview Session'}
              </button>
            </div>
          </div>

          {/* Right Guidance Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
              <div className="flex items-center gap-2 pb-4 border-b border-[#E4D5F3]">
                <Sparkles size={16} className="text-[#D83CC5]" />
                <h3 className="text-base font-bold text-[#27113D]">How It Works</h3>
              </div>

              <div className="mt-5 space-y-5">
                {[
                  {
                    icon: MessageSquare,
                    title: '1. Dynamic Scenario Synthesis',
                    desc: 'Every session crafts unique problem statements matching live FAANG & enterprise interview banks.',
                    badge: 'No Static Lists'
                  },
                  {
                    icon: Mic,
                    title: '2. Expressive Response Capture',
                    desc: 'Structure your solution with clarity, edge-case rationale, and systematic architectural choices.',
                    badge: 'STAR Rubric'
                  },
                  {
                    icon: Award,
                    title: '3. Instant Diagnostic Scoring',
                    desc: 'AI parses key phrase coverage, communication coherence, strengths, and areas requiring polish.',
                    badge: 'Real Feedback'
                  },
                ].map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center shrink-0 border border-[#E4D5F3]/80">
                        <StepIcon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#27113D]">{step.title}</h4>
                          <span className="text-[10px] font-bold text-[#542477] bg-[#F3E9FF] px-2 py-0.5 rounded-full border border-[#E4D5F3]">
                            {step.badge}
                          </span>
                        </div>
                        <p className="text-xs text-[#78678C] mt-1 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preparation Tip Box */}
            <div className="rounded-2xl border border-[#E4D5F3] bg-gradient-to-br from-[#FAF7FD] to-[#F3E9FF]/40 p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#542477]">
                <HelpCircle size={15} className="text-[#D83CC5]" />
                Pro-Candidate Strategy
              </div>
              <p className="text-xs text-[#78678C] leading-relaxed">
                Take a brief breath before typing. Outline your top 3 points upfront to give your response immediate executive structure.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ——— 2. DONE / EVALUATION REPORT SCREEN ———
  if (phase === 'done') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#542477] to-[#D83CC5] text-white flex items-center justify-center mx-auto shadow-[0_8px_24px_rgba(84,36,119,0.2)]">
            <Award size={30} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#27113D] pt-2">
            Interview Debrief & Coaching
          </h1>
          <p className="text-xs text-[#78678C] max-w-md mx-auto">
            Comprehensive evaluation metrics, strengths index, and actionable rubric feedback.
          </p>
        </div>

        {/* Overall Score Hero Card */}
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-7 md:p-8 shadow-[0_4px_24px_rgba(84,36,119,0.06)] flex flex-col md:flex-row items-center gap-8">
          <div className="text-center md:text-left shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#78678C]">Overall AI Score</span>
            <div className="text-5xl font-black font-serif text-[#542477] mt-1">
              {avgScore}<span className="text-2xl font-sans font-bold text-[#D83CC5]">%</span>
            </div>
          </div>
          
          <div className="flex-1 w-full space-y-3">
            <div className="w-full bg-[#F3E9FF] rounded-full h-3 overflow-hidden border border-[#E4D5F3]">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] transition-all duration-700"
                style={{ width: `${avgScore}%` }}
              />
            </div>
            <p className="text-xs text-[#27113D] leading-relaxed">
              {avgScore >= 75 
                ? 'High Competency demonstrated. You articulated key technical considerations and structured responses cleanly.' 
                : avgScore >= 50 
                ? 'Solid Foundation. You grasp fundamental concepts, but would benefit from greater specificity on architecture trade-offs.' 
                : 'Growth Opportunity. Continue practicing structured thinking using the STAR framework and concrete metrics.'}
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-bold text-[#27113D] flex items-center gap-2">
              <MessageSquare size={17} className="text-[#542477]" />
              Detailed Question Analysis
            </h3>
            <span className="text-xs font-semibold text-[#78678C]">
              {evaluations.length} Questions Evaluated
            </span>
          </div>

          <div className="space-y-4">
            {evaluations.map((e, i) => (
              e.skipped ? (
                <div key={i} className="bg-white rounded-2xl border border-[#E4D5F3] p-4 text-xs text-[#78678C] italic">
                  Skipped Question {i + 1}: "{e.question}"
                </div>
              ) : (
                <EvaluationCard key={i} evaluation={e.evaluation} questionText={e.question} />
              )
            ))}
          </div>
        </div>

        {/* Reset Action */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => { setPhase('setup'); setSession(null); setEvaluations([]); }}
            className="px-6 py-3 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.2)] hover:opacity-95 transition-all flex items-center gap-2 text-xs"
          >
            <ArrowLeft size={16} /> Start Another Mock Session
          </button>
        </div>
      </div>
    );
  }

  // ——— 3. ACTIVE INTERVIEW SESSION SCREEN ———
  const total = session?.questions?.length || numQuestions;
  const pct = Math.round(((currentIndex) / total) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-12">
      {/* Session Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#542477] bg-[#F3E9FF] px-2.5 py-0.5 rounded-full border border-[#E4D5F3]">
              {session?.round_type || roundType} Simulation
            </span>
            <span className="text-xs text-[#78678C] font-semibold">
              Target: {targetRole}
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-[#27113D]">
            Question {currentIndex + 1} of {total}
          </h2>
        </div>

        <div className="w-full sm:w-60">
          <div className="flex items-center justify-between text-xs font-bold text-[#542477] mb-1.5">
            <span>Progress</span>
            <span className="font-mono">{pct}%</span>
          </div>
          <div className="w-full bg-[#F3E9FF] rounded-full h-2 overflow-hidden border border-[#E4D5F3]">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Response Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
            {currentQuestion ? (
              <div className="space-y-5">
                {currentQuestion.topic && (
                  <span className="inline-block px-2.5 py-1 bg-[#F3E9FF] text-[#542477] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#E4D5F3]">
                    Focus: {currentQuestion.topic}
                  </span>
                )}

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#542477] to-[#D83CC5] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <MessageSquare size={17} />
                  </div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-[#27113D] leading-snug">
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Response Textarea */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Structure your answer clearly. Explain your thinking, engineering decisions, and measurable outcomes..."
                    rows={8}
                    className="w-full p-4 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-medium text-[#27113D] leading-relaxed resize-y focus:outline-none focus:border-[#542477] focus:bg-white transition-all placeholder-[#8A7A9E]"
                  />
                  <div className="absolute bottom-3.5 right-3.5 text-[10px] font-mono text-[#78678C] bg-white/80 px-2 py-0.5 rounded border border-[#E4D5F3]">
                    {answer.length} characters
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={evalLoading || !answer.trim()}
                    className="flex-1 py-3.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {evalLoading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    {evalLoading ? 'AI Evaluating Answer...' : currentIndex < total - 1 ? 'Submit & Next Question' : 'Submit & Complete Session'}
                  </button>

                  <button
                    onClick={handleSkip}
                    disabled={evalLoading}
                    className="py-3.5 px-6 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#78678C] hover:text-[#542477] rounded-xl transition-all disabled:opacity-50"
                  >
                    Skip Question
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <RefreshCw size={28} className="animate-spin text-[#542477] mx-auto" />
                <p className="text-xs text-[#78678C] font-semibold">Preparing live interview questions...</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Tips & Previous Feedback Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E4D5F3]">
              <Sparkles size={14} className="text-[#D83CC5]" />
              <h4 className="text-xs font-bold text-[#27113D]">Session Strategy</h4>
            </div>
            <ul className="space-y-2.5">
              {[
                'State your assumptions explicitly upfront.',
                'Cite concrete metrics and tech stacks.',
                'Highlight trade-offs you considered.',
                'Summarize the eventual outcome or lesson.'
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#78678C] leading-relaxed">
                  <ChevronRight size={13} className="text-[#542477] shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {evaluations.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E4D5F3]">
                <Award size={14} className="text-[#542477]" />
                <h4 className="text-xs font-bold text-[#27113D]">Previous Question Insight</h4>
              </div>
              {(() => {
                const last = evaluations[evaluations.length - 1];
                if (last.skipped) return <p className="text-xs text-[#78678C] italic">Skipped.</p>;
                const ev = last.evaluation;
                return (
                  <div className="space-y-3">
                    {ev?.score !== undefined && (
                      <RatingBar score={ev.score} max={ev.max_score || 10} />
                    )}
                    {ev?.feedback && (
                      <p className="text-xs text-[#27113D] leading-relaxed bg-[#FAF7FD] p-3 rounded-xl border border-[#E4D5F3]">
                        {ev.feedback}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
