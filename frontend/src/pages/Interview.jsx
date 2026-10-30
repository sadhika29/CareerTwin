import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Award, Bot, CheckCircle2, LoaderCircle,
  Mic, MicOff, Play, RotateCcw, Send, Volume2, VolumeX,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInterviewHistory, getInterviewResult, getInterviewSession, startInterview, submitAnswer, fetchSpeechifyAudio } from '../features/interview/interviewService';
import { getResumes } from '../features/resume/resumeService';

const FORMATS = [
  ['technical', 'Technical Interview'],
  ['behavioral', 'HR and Behavioral Interview'],
  ['project', 'Project & Experience Review'],
  ['scenario', 'Scenario-Based Interview'],
  ['resume_based', 'Resume-Based Interview'],
  ['company_specific', 'Company-Specific Interview'],
  ['multiple_choice', 'Multiple-Choice Interview'],
  ['coding', 'Coding Interview'],
  ['mixed', 'Mixed Interview'],
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const EXPERIENCE_LEVELS = [
  ['fresher', 'Fresher'], ['intermediate', 'Intermediate'], ['experienced', 'Experienced'],
];
const CONTROL_CLASS = 'w-full rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] px-3.5 py-3 text-sm font-medium text-[#27113D] outline-none transition focus:border-[#542477] focus:bg-white';

function Field({ label, children, required = false, className = '' }) {
  return <label className={`block min-w-0 text-xs font-bold text-[#27113D] ${className}`}>
    <span className="mb-1.5 block">{label}{required && <span className="ml-1 text-rose-500">*</span>}</span>
    {children}
  </label>;
}

function RatingBar({ score = 0 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  return <div className="flex items-center gap-3">
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F3E9FF]">
      <div className="h-full rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5]" style={{ width: `${safeScore}%` }} />
    </div>
    <span className="min-w-12 text-right text-xs font-bold text-[#542477]">{Math.round(safeScore)}/100</span>
  </div>;
}

function formatLabel(value) {
  return FORMATS.find(([key]) => key === value)?.[1] || value || 'Interview';
}

export default function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const recognitionRef = useRef(null);
  const [config, setConfig] = useState({
    target_role: 'Software Engineer', type: 'technical', count: 5,
    difficulty: 'medium', experience_level: 'fresher', target_company: '',
    resume_id: '', job_description: '',
  });
  const [resumeOptions, setResumeOptions] = useState([]);
  const [savedSessions, setSavedSessions] = useState([]);
  const [resumeState, setResumeState] = useState('loading');
  const [setupError, setSetupError] = useState('');
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [voiceError, setVoiceError] = useState('');
  const [listening, setListening] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');
  const [questionClock, setQuestionClock] = useState({ questionId: null, seconds: 0 });
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    getResumes().then((payload) => {
      if (!active) return;
      const resumes = Array.isArray(payload?.resumes) ? payload.resumes : [];
      setResumeOptions(resumes);
      setResumeState('ready');
    }).catch(() => { if (active) setResumeState('unavailable'); });
    getInterviewHistory().then((payload) => {
      if (active) setSavedSessions((payload?.sessions || []).filter((item) => item.status === 'in_progress'));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    getInterviewSession(sessionId).then((saved) => {
      if (!active) return;
      setSessionError('');
      setSession(saved);
      setConfig((current) => ({
        ...current,
        target_role: saved.target_role || current.target_role,
        type: saved.round_type || current.type,
        count: saved.question_count || current.count,
        difficulty: saved.difficulty || current.difficulty,
        experience_level: saved.experience_level || current.experience_level,
        target_company: saved.target_company || '',
      }));
      if (saved.status === 'completed') getInterviewResult(sessionId).then(setResult).catch(() => {});
    }).catch((error) => {
      if (active) setSessionError(error.response?.data?.detail || 'This interview session could not be restored.');
    });
    return () => { active = false; };
  }, [sessionId]);

  const currentQuestion = useMemo(() => {
    if (!session?.questions?.length) return null;
    return session.questions[session.question_index] || null;
  }, [session]);
  const questionId = currentQuestion?.question_id;
  const questionText = currentQuestion?.question;

  useEffect(() => {
    if (!sessionId || !questionId || session?.status !== 'in_progress') return undefined;
    const started = Date.now();
    const timer = window.setInterval(() => setQuestionClock({ questionId, seconds: Math.floor((Date.now() - started) / 1000) }), 1000);
    return () => window.clearInterval(timer);
  }, [sessionId, questionId, session?.status]);

  useEffect(() => {
    if (!sessionId || !questionText || session?.status !== 'in_progress' || !voiceEnabled) return undefined;
    let cancelled = false;
    let deviceVoiceStarted = false;
    const speakWithDeviceVoice = () => {
      if (cancelled || deviceVoiceStarted) return;
      deviceVoiceStarted = true;
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        setVoiceStatus('error');
        setVoiceError('Speechify and browser speech are unavailable. The written question is still available.');
        return;
      }
      const utterance = new window.SpeechSynthesisUtterance(questionText);
      utterance.onstart = () => setVoiceStatus('device-speaking');
      utterance.onend = () => setVoiceStatus('idle');
      utterance.onerror = () => {
        setVoiceStatus('error');
        setVoiceError('Browser speech could not play the question. The written question is still available.');
      };
      setVoiceError('Speechify is unavailable; using your browser device voice.');
      window.speechSynthesis.speak(utterance);
    };
    Promise.resolve().then(() => {
      if (cancelled) return null;
      setVoiceError('');
      setVoiceStatus('loading');
      return fetchSpeechifyAudio(questionText);
    }).then((url) => {
      if (!url) return;
      if (cancelled) { URL.revokeObjectURL(url); return; }
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setVoiceStatus('speaking');
      audio.onended = () => setVoiceStatus('idle');
      audio.onerror = () => {
        speakWithDeviceVoice();
      };
      audio.play().catch(() => {
        speakWithDeviceVoice();
      });
    }).catch(() => {
      speakWithDeviceVoice();
    });
    return () => {
      cancelled = true;
      audioRef.current?.pause();
      audioRef.current = null;
      window.speechSynthesis?.cancel();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    };
  }, [sessionId, questionText, voiceEnabled, session?.status]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const updateConfig = (key, value) => setConfig((current) => ({ ...current, [key]: value }));

  const validateSetup = () => {
    if (!config.target_role.trim()) return 'Enter a target role before starting.';
    if (![5, 10, 15].includes(Number(config.count))) return 'Choose 5, 10, or 15 questions.';
    if (config.type === 'company_specific' && !config.target_company.trim()) return 'Enter the target company for a company-specific interview.';
    if (config.type === 'resume_based' && !config.resume_id) return 'Choose one of your saved resumes for a resume-based interview.';
    if (config.job_description.length > 20000) return 'The job description must be 20,000 characters or fewer.';
    return '';
  };

  const handleStart = async (event) => {
    event.preventDefault();
    const validationError = validateSetup();
    if (validationError) { setSetupError(validationError); return; }
    setBusy(true);
    setSetupError('');
    try {
      const payload = {
        ...config,
        target_role: config.target_role.trim(),
        target_company: config.target_company.trim() || null,
        resume_id: config.resume_id || null,
        job_description: config.job_description.trim() || null,
        count: Number(config.count),
      };
      const started = await startInterview(payload);
      if (!started?.session_id || !started?.questions?.[0]) throw new Error('The interview service did not return a starting question.');
      navigate(`/interview/room/${started.session_id}`);
    } catch (error) {
      setSetupError(error.response?.data?.detail || error.message || 'The interview could not be started.');
    } finally { setBusy(false); }
  };

  const stopListening = () => {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setListening(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscriptionError('Live speech recognition is not supported by this browser. You can type your answer instead.');
      return;
    }
    setTranscriptionError('');
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const finalized = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) finalized.push(event.results[index][0].transcript.trim());
      }
      if (finalized.length) setAnswer((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${finalized.join(' ')}`);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setTranscriptionError(event.error === 'not-allowed' ? 'Microphone access was denied. Enable it in your browser settings.' : `Speech recognition stopped (${event.error}).`);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); }
    catch { setListening(false); setTranscriptionError('The microphone could not be started. Check browser permission and try again.'); }
  };

  const advanceQuestion = async (skip = false) => {
    if (!session || !currentQuestion) return;
    if (!skip && !answer.trim() && !code.trim() && !selectedOption) return;
    setBusy(true);
    setSessionError('');
    stopListening();
    try {
      const response = await submitAnswer(session.session_id, {
        question_id: currentQuestion.question_id,
        answer: answer.trim(),
        code: code.trim(),
        selected_option: selectedOption || null,
        skip,
      });
      const addedEvaluation = { question_id: currentQuestion.question_id, evaluation: response.evaluation };
      setSession((previous) => ({
        ...previous,
        questions: response.next_question ? [...previous.questions, response.next_question] : previous.questions,
        answers: [...(previous.answers || []), { question_id: currentQuestion.question_id, answer: answer.trim(), code: code.trim(), selected_option: selectedOption || null, skipped: skip }],
        evaluations: [...(previous.evaluations || []), addedEvaluation],
        question_index: response.question_index,
        status: response.status,
      }));
      setAnswer(''); setCode(''); setSelectedOption(''); setTranscriptionError('');
      if (response.status === 'completed') {
        const finalResult = await getInterviewResult(session.session_id);
        setResult(finalResult);
      }
    } catch (error) {
      setSessionError(error.response?.data?.detail || 'Your answer could not be saved. Try again.');
    } finally { setBusy(false); }
  };

  const returnToSetup = () => {
    stopListening();
    setSession(null); setResult(null); setAnswer(''); setCode(''); setSelectedOption('');
    navigate('/interview', { replace: true });
  };

  const toggleInterviewerVoice = () => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setVoiceStatus('idle');
    setVoiceEnabled((value) => !value);
  };

  if (!sessionId) return (
    <main className="mx-auto w-full max-w-5xl animate-in fade-in duration-300 pb-10">
      <header className="mb-6">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E4D5F3] bg-[#F3E9FF] px-3 py-1 text-xs font-bold text-[#542477]">
          <Bot size={14} /> AI Mock Interview Studio
        </span>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-[#27113D]">AI Mock Interview Studio</h1>
      </header>
      <form onSubmit={handleStart} className="mx-auto max-w-4xl rounded-2xl border border-[#E4D5F3] bg-white p-5 shadow-[0_4px_24px_rgba(84,36,119,0.06)] sm:p-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Target Role / Discipline" required>
            <input className={CONTROL_CLASS} value={config.target_role} onChange={(e) => updateConfig('target_role', e.target.value)} maxLength={120} placeholder="e.g. Backend Developer" required />
          </Field>
          <Field label="Interview Format" required>
            <select className={CONTROL_CLASS} value={config.type} onChange={(e) => updateConfig('type', e.target.value)}>
              {FORMATS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Question Count" required>
            <select className={CONTROL_CLASS} value={config.count} onChange={(e) => updateConfig('count', Number(e.target.value))}>
              {[5, 10, 15].map((count) => <option key={count} value={count}>{count} questions</option>)}
            </select>
          </Field>
          <Field label="Difficulty Level" required>
            <select className={CONTROL_CLASS} value={config.difficulty} onChange={(e) => updateConfig('difficulty', e.target.value)}>
              {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty[0].toUpperCase() + difficulty.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Experience Level" required>
            <select className={CONTROL_CLASS} value={config.experience_level} onChange={(e) => updateConfig('experience_level', e.target.value)}>
              {EXPERIENCE_LEVELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Target Company (Optional)" required={config.type === 'company_specific'}>
            <input className={CONTROL_CLASS} value={config.target_company} onChange={(e) => updateConfig('target_company', e.target.value)} maxLength={120} placeholder="e.g. Acme Technologies" />
          </Field>
          <Field label="Saved Resume (Optional)" required={config.type === 'resume_based'}>
            <select className={CONTROL_CLASS} value={config.resume_id} onChange={(e) => updateConfig('resume_id', e.target.value)}>
              <option value="">No saved resume selected</option>
              {resumeOptions.map((resume) => {
                const id = resume.resume_id || resume.id;
                return id ? <option key={id} value={id}>{resume.filename || resume.name || `Resume ${id}`}</option> : null;
              })}
            </select>
            {resumeState === 'loading' && <span className="mt-1 block text-[11px] font-normal text-[#78678C]">Loading your saved resumes…</span>}
            {resumeState === 'unavailable' && <span className="mt-1 block text-[11px] font-normal text-amber-700">Saved resumes could not be loaded. You can still start without one.</span>}
            {config.type === 'resume_based' && resumeState === 'ready' && resumeOptions.length === 0 && <span className="mt-1 block text-[11px] font-normal text-rose-700">Upload a resume on Resume Analysis before starting this format.</span>}
          </Field>
          <Field label="Job Description (Optional)" className="sm:col-span-2">
            <textarea className={`${CONTROL_CLASS} min-h-24 resize-y`} value={config.job_description} onChange={(e) => updateConfig('job_description', e.target.value)} maxLength={20000} placeholder="Paste a job description to tailor role and scenario questions." />
          </Field>
        </div>
        {setupError && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{setupError}</p>}
        <button type="submit" disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#542477] to-[#D83CC5] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(84,36,119,0.2)] transition hover:opacity-95 disabled:cursor-wait disabled:opacity-60">
          {busy ? <LoaderCircle size={17} className="animate-spin" /> : <Play size={17} />}{busy ? 'Preparing your first question…' : 'Start Interview Session'}
        </button>
      </form>
      {savedSessions.length > 0 && <section className="mx-auto mt-5 max-w-4xl rounded-2xl border border-[#E4D5F3] bg-white p-5">
        <h2 className="mb-3 text-sm font-bold text-[#27113D]">Continue an interview</h2>
        <div className="space-y-2">{savedSessions.map((saved) => <div key={saved.session_id} className="flex flex-col gap-2 rounded-xl bg-[#FAF7FD] p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold text-[#27113D]">{saved.target_role} · {formatLabel(saved.round_type)}</div><div className="mt-0.5 text-xs text-[#78678C]">{saved.answers_count || 0} answered · {saved.difficulty} difficulty</div></div><button type="button" onClick={() => navigate(`/interview/room/${saved.session_id}`)} className="rounded-lg border border-[#E4D5F3] px-3 py-2 text-xs font-bold text-[#542477] hover:bg-white">Resume session</button></div>)}</div>
      </section>}
    </main>
  );

  if (sessionError && !session) return <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-white p-7 text-sm text-rose-700">{sessionError}<button onClick={returnToSetup} className="mt-4 block font-bold text-[#542477]">Back to setup</button></div>;
  if (!session) return <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center text-sm text-[#78678C]"><LoaderCircle className="mx-auto mb-3 animate-spin text-[#542477]" />Restoring your interview room…</div>;

  const total = session.question_count || config.count;
  const answered = session.question_index || 0;
  const completed = session.status === 'completed';
  const progress = Math.min(100, Math.round((answered / total) * 100));
  const elapsedSeconds = questionClock.questionId === questionId ? questionClock.seconds : 0;
  const elapsed = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;
  const researchSources = currentQuestion?.source_references || [];

  if (completed) {
    const evaluations = (session.evaluations || []).filter((item) => item.evaluation);
    const fallbackEvaluations = evaluations.filter((item) => item.evaluation.evaluation_origin === 'deterministic_fallback').length;
    const score = result?.overall_score ?? 0;
    return <main className="mx-auto max-w-4xl space-y-5 pb-10">
      <header className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#542477] to-[#D83CC5] text-white"><Award size={26} /></div>
        <h1 className="text-3xl font-serif font-bold text-[#27113D]">Interview Debrief</h1>
        <p className="mt-1 text-sm text-[#78678C]">Your saved session includes {answered} of {total} questions.</p>
      </header>
      <section className="rounded-2xl border border-[#E4D5F3] bg-white p-6 shadow-sm sm:flex sm:items-center sm:gap-8">
        <div className="mb-4 shrink-0 text-center sm:mb-0"><div className="text-xs font-bold uppercase tracking-wide text-[#78678C]">Overall Score</div><div className="mt-1 text-4xl font-black text-[#542477]">{score}<span className="text-xl">/100</span></div></div>
        <div className="flex-1"><RatingBar score={score} /><p className="mt-3 text-sm leading-relaxed text-[#69567E]">{result?.feedback_summary || 'Review your answer feedback below and use it to plan your next practice session.'}</p></div>
      </section>
      {fallbackEvaluations > 0 && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{fallbackEvaluations} response(s) used the basic local evaluation fallback because the AI evaluation service was unavailable.</p>}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-[#27113D]">Question feedback</h2>
        {evaluations.map(({ question_id: id, evaluation }) => {
          const q = session.questions.find((item) => item.question_id === id);
          return <article key={id} className="rounded-2xl border border-[#E4D5F3] bg-white p-5">
            <h3 className="font-semibold text-[#27113D]">{q?.question}</h3>
            <div className="mt-4"><RatingBar score={evaluation.score ?? evaluation.overall_score} /></div>
            {evaluation.evaluation_origin === 'deterministic_fallback' && <p className="mt-2 text-xs text-amber-700">AI evaluation was unavailable for this response. This score uses a basic local fallback and should be treated as a rough practice signal.</p>}
            {evaluation.evaluation_origin === 'rule_based_multiple_choice' && <p className="mt-2 text-xs text-[#78678C]">This result was checked against the answer key.</p>}
            <p className="mt-3 text-sm leading-relaxed text-[#69567E]">{evaluation.feedback || evaluation.feedback_summary}</p>
            {(evaluation.strengths?.length > 0 || evaluation.improvements?.length > 0) && <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="text-sm text-emerald-800">{evaluation.strengths?.map((item, i) => <p key={i}>✓ {item}</p>)}</div>
              <div className="text-sm text-rose-700">{evaluation.improvements?.map((item, i) => <p key={i}>• {item}</p>)}</div>
            </div>}
          </article>;
        })}
        {!evaluations.length && <p className="rounded-xl bg-white p-5 text-sm text-[#78678C]">All questions were skipped; no score was generated.</p>}
      </section>
      <button onClick={returnToSetup} className="mx-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#542477] to-[#D83CC5] px-5 py-3 text-sm font-bold text-white"><RotateCcw size={16} />Start Another Interview</button>
    </main>;
  }

  return <main className="mx-auto max-w-6xl space-y-5 pb-10">
    <header className="flex flex-col gap-4 rounded-2xl border border-[#E4D5F3] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <button onClick={returnToSetup} aria-label="Return to interview setup" className="rounded-lg p-2 text-[#69567E] hover:bg-[#F3E9FF]"><ArrowLeft size={18} /></button>
        <div><div className="text-[11px] font-bold uppercase tracking-wider text-[#542477]">{formatLabel(session.round_type)}</div><h1 className="text-lg font-bold text-[#27113D]">{session.target_role}{session.target_company ? ` · ${session.target_company}` : ''}</h1></div>
      </div>
      <div className="min-w-48 sm:w-60"><div className="mb-1 flex justify-between text-xs font-bold text-[#69567E]"><span>Question {Math.min(answered + 1, total)} of {total}</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#F3E9FF]"><div className="h-full rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] transition-all" style={{ width: `${progress}%` }} /></div></div>
    </header>

    {session.persistence === 'memory_fallback' && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Firebase session storage is unavailable right now. This session is temporary and will not survive a server restart.</p>}

    {sessionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{sessionError}</p>}
    <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-12">
      <section className="min-w-0 space-y-4 lg:col-span-5">
        <article className="overflow-hidden rounded-2xl border border-[#E4D5F3] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F0E8F8] p-4">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#542477] to-[#D83CC5] text-white"><Bot size={22} /></div><div><h2 className="font-bold text-[#27113D]">CareerTwin Interviewer</h2><p className="text-xs text-[#78678C]">{voiceStatus === 'speaking' ? 'Speaking with AI voice' : voiceStatus === 'device-speaking' ? 'Speaking with device voice' : listening ? 'Listening to your answer' : 'Ready for your response'}</p></div></div>
            <div className="flex items-center gap-2"><button onClick={toggleInterviewerVoice} title={voiceEnabled ? 'Mute interviewer voice' : 'Enable interviewer voice'} className="rounded-lg border border-[#E4D5F3] p-2 text-[#542477] hover:bg-[#F3E9FF]">{voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}</button><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{session.status === 'in_progress' ? 'LIVE SESSION' : session.status}</span></div>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            {(voiceStatus === 'speaking' || voiceStatus === 'device-speaking') && <div className="flex h-9 items-center justify-center gap-1" aria-label="Interviewer is speaking">{[12, 20, 28, 17, 25, 14, 30, 18, 24, 12, 21].map((height, i) => <span key={i} className="w-1 rounded-full bg-[#D83CC5] animate-pulse" style={{ height, animationDelay: `${i * 70}ms` }} />)}</div>}
            <div><div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-[#78678C]"><span>Question transcript</span><span className="normal-case">Time {elapsed}</span></div><h2 className="text-lg font-semibold leading-relaxed text-[#27113D] sm:text-xl">{currentQuestion?.question || 'Loading next question…'}</h2></div>
            {currentQuestion?.code_snippet && <pre className="max-h-64 overflow-auto rounded-xl bg-[#241333] p-4 text-xs leading-relaxed text-purple-50"><code>{currentQuestion.code_snippet}</code></pre>}
            {currentQuestion?.origin && <div className="rounded-xl bg-[#FAF7FD] p-3 text-[11px] leading-relaxed text-[#69567E]">
              {currentQuestion.origin}
              {researchSources.length > 0 && <details className="mt-2 rounded-lg border border-[#E4D5F3] bg-white p-2.5">
                <summary className="cursor-pointer font-bold text-[#542477]">Research context and sources</summary>
                <p className="mt-2">These public references informed the practice pattern. They do not establish that this generated question was asked by an employer.</p>
                <ul className="mt-2 space-y-2">{researchSources.map((source, index) => <li key={`${source.source_url}-${index}`} className="border-t border-[#F0E8F8] pt-2">
                  <a className="font-bold underline decoration-[#B79AD0] underline-offset-2" href={source.source_url} target="_blank" rel="noreferrer">{source.source_platform}</a>
                  <div>Type: {source.source_kind} · Confidence: {source.confidence}</div>
                  <div>Role: {source.target_role} · Format: {source.interview_format} · Company: {source.company || 'Not identified'}</div>
                  <div>Reported date: {source.published_at || 'Not provided'} · Catalog researched: {source.catalog_researched_at || 'Not available'} · Matched locally: {source.catalog_matched_at || 'Not available'}</div>
                  <p className="mt-1">Pattern: {source.topic}</p>
                </li>)}</ul>
              </details>}
            </div>}
            {voiceError && <p role="status" className="text-xs text-amber-700">{voiceError}</p>}
          </div>
        </article>
        <div className="rounded-xl border border-[#E4D5F3] bg-white p-4 text-xs text-[#69567E]"><div className="flex items-center gap-2 font-bold text-[#542477]"><CheckCircle2 size={15} />Turn status</div><p className="mt-1">{busy ? 'Saving your response and preparing the next question…' : listening ? 'Listening. Your final speech segments will appear in the response field.' : 'Answer by typing, dictating, or entering code, then submit when ready.'}</p></div>
      </section>

      <section className="min-w-0 space-y-4 lg:col-span-7">
        <article className="min-w-0 rounded-2xl border border-[#E4D5F3] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-[#27113D]">Your response</h2><p className="mt-0.5 text-xs text-[#78678C]">{EXPERIENCE_LEVELS.find(([value]) => value === session.experience_level)?.[1] || 'Candidate'} · {session.difficulty} difficulty</p></div><button onClick={listening ? stopListening : startListening} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${listening ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-[#E4D5F3] text-[#542477] hover:bg-[#F3E9FF]'}`}>{listening ? <MicOff size={15} /> : <Mic size={15} />}{listening ? 'Stop dictation' : 'Answer by voice'}</button></div>
          {transcriptionError && <p role="status" className="mb-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">{transcriptionError}</p>}
          {currentQuestion?.options?.length > 0 ? <fieldset className="space-y-2" disabled={busy}><legend className="mb-2 text-xs font-semibold text-[#69567E]">Choose one answer</legend>{currentQuestion.options.map((option, index) => <label key={`${option}-${index}`} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed transition ${selectedOption === option ? 'border-[#542477] bg-[#F3E9FF]/60 text-[#27113D]' : 'border-[#E4D5F3] hover:bg-[#FAF7FD]'}`}><input className="mt-1 accent-[#542477]" type="radio" name="mcq-answer" value={option} checked={selectedOption === option} onChange={() => setSelectedOption(option)} /><span>{option}</span></label>)}</fieldset> : null}
          {(session.round_type === 'coding' || currentQuestion?.code_snippet) && <label className="mb-4 mt-3 block text-xs font-bold text-[#27113D]">Code editor <span className="font-normal text-[#78678C]">(submitted to the AI evaluator; code is not executed)</span><textarea spellCheck="false" value={code} onChange={(event) => setCode(event.target.value)} rows={11} placeholder="Write your solution here…" className="mt-2 w-full resize-y rounded-xl border border-[#3D2854] bg-[#241333] p-4 font-mono text-xs leading-relaxed text-purple-50 outline-none focus:border-[#D83CC5]" /></label>}
          {(session.round_type !== 'multiple_choice' || !currentQuestion?.options?.length) && <label className="block text-xs font-bold text-[#27113D]">{session.round_type === 'behavioral' ? 'Your answer' : 'Explain your approach'}<textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={session.round_type === 'coding' ? 4 : 8} maxLength={20000} placeholder="Explain your reasoning, decisions, and relevant examples…" className={`${CONTROL_CLASS} mt-2 resize-y leading-relaxed`} /></label>}
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => advanceQuestion(true)} disabled={busy} className="rounded-xl border border-[#E4D5F3] px-4 py-3 text-sm font-bold text-[#69567E] hover:bg-[#FAF7FD] disabled:opacity-50">Skip question</button><button onClick={() => advanceQuestion(false)} disabled={busy || (!answer.trim() && !code.trim() && !selectedOption)} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#542477] to-[#D83CC5] px-5 py-3 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={15} />}{answered + 1 >= total ? 'Submit & finish' : 'Submit answer'}</button></div>
        </article>
        {session.evaluations?.length > 0 && <article className="rounded-2xl border border-[#E4D5F3] bg-white p-5"><h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#27113D]"><Award size={16} className="text-[#542477]" />Previous response feedback</h3>{[...session.evaluations].reverse().find((item) => item.evaluation)?.evaluation ? <><RatingBar score={[...session.evaluations].reverse().find((item) => item.evaluation).evaluation.score} /><p className="mt-3 text-sm leading-relaxed text-[#69567E]">{[...session.evaluations].reverse().find((item) => item.evaluation).evaluation.feedback}</p></> : <p className="text-xs text-[#78678C]">The previous question was skipped.</p>}</article>}
      </section>
    </div>
  </main>;
}
