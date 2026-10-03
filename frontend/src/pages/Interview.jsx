import { useState, useRef } from 'react';
import { Mic, MicOff, CheckCircle, XCircle, ChevronRight, RefreshCw, MessageSquare, Award, ArrowLeft, Play, Settings2 } from 'lucide-react';
import { startInterview, submitAnswer, getInterviewHistory } from '../features/interview/interviewService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';

const ROUND_TYPES = [
  { value: 'technical', label: 'Technical', desc: 'Algorithms, system design, coding concepts' },
  { value: 'project', label: 'Project Deep-Dive', desc: 'Your past projects, architecture decisions, challenges' },
  { value: 'hr', label: 'HR / Behavioural', desc: 'STAR-format, cultural fit, communication' },
];

function RatingBar({ score, max = 10 }) {
  const pct = Math.round((score / max) * 100);
  const colorClass = pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-error';
  const textColorClass = pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-error';
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Progress value={pct} colorClass={colorClass} showValue={false} />
      </div>
      <span className={`text-sm font-bold min-w-[40px] text-right ${textColorClass}`}>
        {score}/{max}
      </span>
    </div>
  );
}

function EvaluationCard({ evaluation, questionText }) {
  const { score, max_score, feedback, strengths, improvements, suggested_answer } = evaluation || {};
  return (
    <Card className="mb-4 border-l-4 border-l-ai overflow-hidden">
      <CardContent className="p-5">
        <p className="text-sm text-text-secondary italic mb-4 font-serif">
          "{questionText}"
        </p>
        
        {score !== undefined && (
          <div className="mb-5 bg-background border border-border p-3 rounded-lg">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">AI Score</div>
            <RatingBar score={score} max={max_score || 10} />
          </div>
        )}
        
        {feedback && (
          <p className="text-sm text-text-primary leading-relaxed mb-5">
            {feedback}
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
          {strengths?.length > 0 && (
            <div>
              <div className="text-xs font-bold text-success uppercase tracking-wider mb-3">Strengths</div>
              <ul className="flex flex-col gap-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle size={16} className="text-success shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {improvements?.length > 0 && (
            <div>
              <div className="text-xs font-bold text-error uppercase tracking-wider mb-3">Areas to Improve</div>
              <ul className="flex flex-col gap-2">
                {improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <XCircle size={16} className="text-error shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {suggested_answer && (
          <details className="mt-5 group border border-border rounded-lg bg-background">
            <summary className="text-sm font-bold text-ai cursor-pointer p-3 outline-none select-none list-none flex items-center justify-between">
              View ideal answer strategy
              <ChevronRight size={16} className="transition-transform group-open:rotate-90" />
            </summary>
            <div className="p-4 pt-0 text-sm text-text-secondary leading-relaxed border-t border-border mt-1">
              {suggested_answer}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
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
    } catch (err) {
      alert('Failed to start interview. Please check the backend is running.');
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
      alert('Evaluation failed. Please try again.');
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

  // ——— SETUP SCREEN ———
  if (phase === 'setup') {
    return (
      <div className="animate-in fade-in duration-500 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
            Mock Interview Room
            <Mic size={24} className="text-primary" />
          </h1>
          <p className="text-text-secondary text-base">
            The AI generates role-specific questions and gives you detailed coaching feedback on every answer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 size={18} className="text-text-muted" /> Configure Your Interview
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">
                    Target Role
                  </label>
                  <input
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-3 uppercase tracking-wide">
                    Interview Type
                  </label>
                  <div className="flex flex-col gap-3">
                    {ROUND_TYPES.map(r => (
                      <label
                        key={r.value}
                        className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                          roundType === r.value 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-border bg-background hover:border-text-muted'
                        }`}
                      >
                        <input
                          type="radio" 
                          value={r.value} 
                          checked={roundType === r.value}
                          onChange={() => setRoundType(r.value)}
                          className="mt-1 w-4 h-4 text-primary border-border focus:ring-primary"
                        />
                        <div>
                          <div className={`font-bold text-sm ${roundType === r.value ? 'text-primary' : 'text-text-primary'}`}>
                            {r.label}
                          </div>
                          <div className="text-xs text-text-muted mt-1 leading-relaxed">
                            {r.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">Questions</label>
                    <select 
                      value={numQuestions} 
                      onChange={e => setNumQuestions(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    >
                      {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">Difficulty</label>
                    <select 
                      value={difficulty} 
                      onChange={e => setDifficulty(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    >
                      {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                
                <button
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleStart}
                  disabled={loading || !targetRole.trim()}
                >
                  {loading ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
                  {loading ? 'AI is preparing questions...' : 'Start Interview Session'}
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6">
                  {[
                    { icon: <MessageSquare size={18} />, title: 'AI generates questions', desc: 'Fresh role-specific questions every session — no static bank.' },
                    { icon: <Mic size={18} />, title: 'You answer each one', desc: 'Type your answer as you would speak it in a real interview.' },
                    { icon: <Award size={18} />, title: 'AI coaches you', desc: 'After each answer, AI scores you and shows strengths and areas to improve.' },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {step.icon}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-text-primary mb-1">{step.title}</div>
                        <div className="text-sm text-text-secondary leading-relaxed">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ——— DONE SCREEN ———
  if (phase === 'done') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 pb-12 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
            <Award size={32} />
          </div>
          <h1 className="text-3xl font-heading font-black text-text-primary mb-2">Interview Complete</h1>
          <p className="text-text-secondary text-base">Here is your detailed performance breakdown and AI coaching.</p>
        </div>
        
        <Card className="mb-10 border-primary/20 bg-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="text-center md:text-left shrink-0">
              <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Overall AI Score</div>
              <div className="text-6xl font-heading font-black text-primary drop-shadow-sm">{avgScore}%</div>
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <div className="mb-3">
                <Progress value={avgScore} colorClass={avgScore >= 75 ? 'bg-success' : avgScore >= 50 ? 'bg-warning' : 'bg-primary'} showValue={false} height="h-3" />
              </div>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">
                {avgScore >= 75 
                  ? 'Outstanding performance! You demonstrate strong competency and are well-prepared for real interviews in this role.' 
                  : avgScore >= 50 
                  ? 'Good foundation. Review the specific feedback below and practice the suggested improvement areas to boost your confidence.' 
                  : 'Keep practicing! Each session makes you sharper. Focus closely on the improvement areas highlighted in the feedback below.'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-8">
          <h2 className="text-xl font-heading font-bold text-text-primary mb-6 flex items-center gap-2">
            <MessageSquare size={20} className="text-text-muted" /> Detailed Answer Feedback
          </h2>
          
          <div className="flex flex-col gap-6">
            {evaluations.map((e, i) => (
              e.skipped
                ? <Card key={i} className="border-l-4 border-l-border bg-background">
                    <CardContent className="p-4">
                      <p className="text-sm text-text-muted font-medium m-0">
                        Skipped: "{e.question}"
                      </p>
                    </CardContent>
                  </Card>
                : <EvaluationCard key={i} evaluation={e.evaluation} questionText={e.question} />
            ))}
          </div>
        </div>
        
        <div className="flex justify-center">
          <button
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center gap-2"
            onClick={() => { setPhase('setup'); setSession(null); setEvaluations([]); }}
          >
            <ArrowLeft size={18} /> Start New Interview Session
          </button>
        </div>
      </div>
    );
  }

  // ——— INTERVIEW IN PROGRESS ———
  const total = session?.questions?.length || numQuestions;
  const pct = Math.round(((currentIndex) / total) * 100);

  return (
    <div className="animate-in fade-in duration-300 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
        <div>
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
            {session?.round_type || roundType} Interview
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Question {currentIndex + 1} of {total}
          </h1>
        </div>
        <div className="w-full md:w-64">
          <Progress value={pct} colorClass="bg-primary" showValue={false} />
          <div className="text-right text-xs text-text-muted mt-1 font-medium">{pct}% Complete</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Question + Answer */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="border-primary/20 shadow-sm">
            <CardContent className="p-6 md:p-8">
              {currentQuestion ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  {currentQuestion.topic && (
                    <div className="inline-block px-2.5 py-1 bg-ai/10 text-ai text-[10px] font-bold uppercase tracking-wider rounded-md mb-4">
                      {currentQuestion.topic}
                    </div>
                  )}
                  
                  <div className="flex gap-4 items-start mb-6">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-1">
                      <MessageSquare size={16} />
                    </div>
                    <p className="text-lg md:text-xl font-heading font-semibold leading-relaxed text-text-primary">
                      {currentQuestion.question}
                    </p>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      placeholder="Type your answer here as you would say it in a real interview..."
                      rows={8}
                      className="w-full p-4 rounded-xl border border-border bg-background text-sm text-text-primary leading-relaxed resize-y focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all custom-scrollbar"
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-text-muted">
                      {answer.length} chars
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      onClick={handleSubmitAnswer}
                      disabled={evalLoading || !answer.trim()}
                    >
                      {evalLoading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                      {evalLoading ? 'AI is evaluating...' : currentIndex < total - 1 ? 'Submit Answer & Continue' : 'Submit & Finish Interview'}
                    </button>
                    <button
                      onClick={handleSkip}
                      disabled={evalLoading}
                      className="py-3 px-6 bg-background border border-border hover:bg-border/50 text-text-secondary font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <RefreshCw size={32} className="animate-spin text-text-muted mb-4" />
                  <p className="text-text-secondary">Loading question...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live feedback panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-background">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-ai" /> Interview Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="flex flex-col gap-3">
                {[
                  'Use the STAR method for behavioural questions (Situation, Task, Action, Result).',
                  'Be specific — mention technologies, metrics, and outcomes.',
                  'For technical questions, explain your reasoning, not just the answer.',
                  'It\'s fine to take a moment to think before answering.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <ChevronRight size={14} className="text-ai shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          {evaluations.length > 0 && (
            <Card className="bg-background animate-in slide-in-from-right-4 duration-300 border-primary/20 shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-primary/5">
                <CardTitle className="text-sm flex items-center gap-2 text-primary">
                  <Award size={16} /> Latest Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {(() => {
                  const last = evaluations[evaluations.length - 1];
                  if (last.skipped) return <p className="text-sm text-text-muted italic">Question skipped.</p>;
                  const ev = last.evaluation;
                  return (
                    <div className="flex flex-col gap-4">
                      {ev?.score !== undefined && (
                        <div>
                          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Score</div>
                          <RatingBar score={ev.score} max={ev.max_score || 10} />
                        </div>
                      )}
                      {ev?.feedback && (
                        <div>
                          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Notes</div>
                          <p className="text-sm text-text-primary leading-relaxed">{ev.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
