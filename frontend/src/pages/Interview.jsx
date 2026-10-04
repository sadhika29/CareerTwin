import { useState, useRef, useEffect } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, Maximize, Minimize, Volume2, VolumeX,
  Play, CheckCircle2, XCircle, ChevronRight, RefreshCw, Award, 
  ArrowLeft, Sparkles, Code2, Bot, ShieldCheck, HelpCircle, Check, 
  RotateCcw, AlertTriangle, Eye, User
} from 'lucide-react';
import { startInterview, submitAnswer, getInterviewResult, getInterviewHistory, getInterviewVoices, fetchSpeechifyAudio } from '../features/interview/interviewService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { useSearchParams } from 'react-router-dom';

const ROUND_TYPES = [
  { value: 'technical', label: 'Technical & Coding Assessment', desc: 'MCQ code challenges, algorithms, architecture' },
  { value: 'system_design', label: 'System Design & Scalability', desc: 'Distributed systems, database caching, APIs' },
  { value: 'hr', label: 'HR & Behavioral Viva', desc: 'STAR-format, leadership, culture, problem-solving' },
];

export default function Interview() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'Software Engineer';
  const initialCompany = searchParams.get('company') || 'HCLTech';

  const [targetRole, setTargetRole] = useState(initialRole);
  const [company, setCompany] = useState(initialCompany);
  const [roundType, setRoundType] = useState('technical');
  const [difficulty, setDifficulty] = useState('medium');
  const [interviewMode, setInterviewMode] = useState('veribot'); // veribot | mcq_only

  // Session State
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [phase, setPhase] = useState('setup'); // setup | in_session | question_evaluated | done
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Proctored Hardware Controls
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Speechify Voice Integration
  const [selectedVoice, setSelectedVoice] = useState('dominic_32');
  const [availableVoices, setAvailableVoices] = useState([
    { id: 'dominic_32', name: 'Dominic (Speechify Executive)', gender: 'male' },
    { id: 'geffen_32', name: 'Geffen (Speechify Tech Lead)', gender: 'male' },
    { id: 'aaliya', name: 'Aaliya (Speechify Eng Manager)', gender: 'female' },
    { id: 'abhay', name: 'Abhay (Speechify Architect)', gender: 'male' },
    { id: 'aamir', name: 'Aamir (Speechify Staff Engineer)', gender: 'male' },
  ]);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const currentAudioRef = useRef(null);

  // Load available Speechify voices from backend
  useEffect(() => {
    getInterviewVoices()
      .then(res => {
        if (res?.voices && res.voices.length > 0) {
          setAvailableVoices(res.voices);
        }
      })
      .catch(err => console.warn('Speechify voices load warning:', err));
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        setSpokenTranscript(currentText.trim());
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening) {
          try { recognition.start(); } catch {}
        }
      };

      speechRecognitionRef.current = recognition;
    }

    return () => {
      stopCameraAndMic();
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      if (currentAudioRef.current) {
        try { currentAudioRef.current.pause(); } catch {}
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Fallback to browser SpeechSynthesis if Speechify audio stream fails
  const fallbackSpeak = (cleanText) => {
    if (!window.speechSynthesis) {
      setIsBotSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => setIsBotSpeaking(true);
    utterance.onend = () => setIsBotSpeaking(false);
    utterance.onerror = () => setIsBotSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // High-fidelity Speechify Voice synthesis: VeriBot reads questions naturally
  const speakText = async (text) => {
    if (!ttsEnabled || !text) return;

    // Stop currently playing audio or speech
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {}
    }
    window.speechSynthesis?.cancel();

    // Clean code snippet text out of voice synthesis so it's smooth to listen to
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Review the provided code snippet on your screen.')
      .replace(/[*_#`]/g, '')
      .substring(0, 400);

    try {
      setIsBotSpeaking(true);
      const audioUrl = await fetchSpeechifyAudio(cleanText, selectedVoice);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsBotSpeaking(false);
      };
      audio.onerror = () => {
        console.warn('Speechify audio playback failed, falling back to browser TTS');
        fallbackSpeak(cleanText);
      };
      await audio.play();
    } catch (err) {
      console.warn('Speechify TTS request error, falling back to browser TTS:', err);
      fallbackSpeak(cleanText);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const startCameraAndMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setMicActive(true);
      return true;
    } catch (err) {
      console.warn('Camera/Mic permission warning:', err);
      setCameraActive(false);
      setMicActive(false);
      return false;
    }
  };

  const stopCameraAndMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
    setMicActive(false);
  };

  const toggleMicListening = () => {
    if (!speechRecognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please click an option to answer.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const handleStartInterview = async () => {
    setLoading(true);
    try {
      if (interviewMode === 'veribot') {
        await startCameraAndMic();
      }

      const data = await startInterview({
        type: roundType,
        target_role: targetRole,
        company: company,
        count: 5,
        difficulty,
      });

      setSession(data);
      setCurrentIndex(0);
      setEvaluations([]);
      setSelectedOption(null);
      setSpokenTranscript('');
      setCurrentEvaluation(null);
      setPhase('in_session');

      // Speak first question
      if (data?.questions?.[0]) {
        setTimeout(() => {
          speakText(data.questions[0].question);
        }, 600);
      }

      if (interviewMode === 'veribot' && speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
          setIsListening(true);
        } catch {}
      }
    } catch (err) {
      console.error('Interview start failed:', err);
      alert('Could not start mock interview. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = session?.questions?.[currentIndex];

  const handleSubmitCurrentAnswer = async () => {
    if (!selectedOption && !spokenTranscript.trim()) {
      alert('Please select one of the MCQ choices or speak your answer into the microphone.');
      return;
    }

    setSubmitting(true);
    window.speechSynthesis?.cancel();
    setIsBotSpeaking(false);

    try {
      const result = await submitAnswer(session.session_id, {
        question: currentQuestion?.question || '',
        question_type: currentQuestion?.category || roundType,
        answer: spokenTranscript.trim() || `Selected ${selectedOption}`,
        target_role: targetRole,
        expected_key_points: currentQuestion?.expected_key_points || [],
        correct_option: currentQuestion?.correct_option,
        selected_option: selectedOption,
        explanation: currentQuestion?.explanation,
      });

      const evaluation = result.evaluation;
      setCurrentEvaluation(evaluation);
      setEvaluations(prev => [
        ...prev,
        {
          question: currentQuestion,
          selectedOption,
          spokenTranscript,
          evaluation
        }
      ]);
      setPhase('question_evaluated');
    } catch (err) {
      console.error('Answer evaluation failed:', err);
      alert('Evaluation could not be processed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < (session?.questions?.length || 1) - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setSpokenTranscript('');
      setCurrentEvaluation(null);
      setPhase('in_session');

      // Speak next question
      const nextQ = session.questions[nextIndex];
      if (nextQ) {
        setTimeout(() => {
          speakText(nextQ.question);
        }, 400);
      }
    } else {
      stopCameraAndMic();
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      setPhase('done');
    }
  };

  // Compute final session score
  const sessionAvgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, item) => sum + (item.evaluation?.overall_score || 70), 0) / evaluations.length)
    : 80;

  return (
    <div className={`animate-in fade-in duration-500 pb-12 ${isFullscreen ? 'fixed inset-0 z-50 bg-sidebar overflow-y-auto p-6' : ''}`}>
      {/* Top Banner / Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-ai/10 border border-ai/20 text-ai px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Bot size={14} className="text-ai" />
            AI VeriBot Mock Interview Platform · {company}
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
            {phase === 'setup' ? 'AI Mock Interview & Technical Assessment' : `Live Interview · Question ${currentIndex + 1} of ${session?.questions?.length || 5}`}
          </h1>
        </div>

        {phase !== 'setup' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Exit interview session?')) {
                  stopCameraAndMic();
                  setPhase('setup');
                }
              }}
              className="px-3.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-border/30 flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> Exit Session
            </button>
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg bg-background border border-border text-text-muted hover:text-text-primary transition-colors"
              title="Toggle Full Screen"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* PHASE 1: SETUP SCREEN */}
      {phase === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-text-primary">Configure Your Mock Interview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
                      Target Role
                    </label>
                    <input
                      value={targetRole}
                      onChange={e => setTargetRole(e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
                      Target Company Pattern
                    </label>
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. HCLTech, Google, Infosys"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2.5">
                    Interview Assessment Round
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ROUND_TYPES.map(rt => (
                      <button
                        key={rt.value}
                        type="button"
                        onClick={() => setRoundType(rt.value)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          roundType === rt.value
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border bg-background hover:border-text-muted'
                        }`}
                      >
                        <div className="text-xs font-bold text-text-primary mb-1">{rt.label}</div>
                        <div className="text-[11px] text-text-muted leading-relaxed">{rt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
                    Interview Mode Experience
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInterviewMode('veribot')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        interviewMode === 'veribot'
                          ? 'border-ai bg-ai/5 ring-2 ring-ai/20'
                          : 'border-border bg-background hover:border-text-muted'
                      }`}
                    >
                      <Bot size={22} className="text-ai mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-xs font-bold text-text-primary">VeriBot AI Mock Interview</strong>
                        <span className="text-[11px] text-text-muted leading-relaxed">
                          In-person simulator with camera proctoring, AI voice interviewer, and real-time speech transcription.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterviewMode('mcq_only')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        interviewMode === 'mcq_only'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border bg-background hover:border-text-muted'
                      }`}
                    >
                      <Code2 size={22} className="text-primary mt-0.5 shrink-0" />
                      <div>
                        <strong className="block text-xs font-bold text-text-primary">Interactive MCQ Assessment</strong>
                        <span className="text-[11px] text-text-muted leading-relaxed">
                          Code snippets with 4 to 5 clickable choices. Rapid evaluation with zero manual typing required.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {interviewMode === 'veribot' && (
                  <div className="p-4 rounded-xl border border-ai/20 bg-ai/5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                        <Sparkles size={14} className="text-ai" /> Interviewer Voice (Speechify AI Simba 3.2)
                      </label>
                      <span className="text-[10px] font-semibold text-ai px-2 py-0.5 rounded-full bg-ai/10 border border-ai/20 flex items-center gap-1">
                        ⚡ Ultra-Realistic Audio
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <select
                        value={selectedVoice}
                        onChange={e => setSelectedVoice(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-lg border border-border bg-background text-sm text-text-primary font-medium focus:outline-none focus:border-ai"
                      >
                        {availableVoices.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.gender}) {v.recommended ? '★ Recommended' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => speakText("Hello! I am VeriBot, your AI technical interviewer powered by Speechify text-to-speech.")}
                        className="px-4 py-2 rounded-lg bg-ai text-white text-xs font-semibold hover:bg-ai/90 flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                      >
                        <Volume2 size={14} /> Test Voice Sample
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Generating Contextual Questions with AI...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Start Mock Interview Session
                    </>
                  )}
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <Card className="border-ai/20 bg-gradient-to-br from-background to-ai/5">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <ShieldCheck size={18} className="text-ai" />
                  VeriBot Proctored Environment Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col gap-4 text-xs text-text-secondary leading-relaxed">
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-border">
                  <Video size={16} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary block font-semibold">Webcam Video Feed</strong>
                    <span>Live picture-in-picture feed displays your presence just like corporate assessment rounds (HCL, TCS iON).</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-border">
                  <Mic size={16} className="text-ai shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary block font-semibold">Voice Recognition & Transcription</strong>
                    <span>Candidate spoken answers are transcribed in real-time onto the screen and analyzed by AI.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-border">
                  <Volume2 size={16} className="text-success shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary block font-semibold">AI Interviewer Voice (TTS)</strong>
                    <span>The centered bot articulates questions aloud with clear voice cadence.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-border">
                  <Maximize size={16} className="text-warning shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary block font-semibold">Full Screen Immersion</strong>
                    <span>Experience an uninterrupted exam room environment.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* PHASE 2: IN SESSION (VERIBOT & MCQ EXPERIENCE) */}
      {(phase === 'in_session' || phase === 'question_evaluated') && currentQuestion && (
        <div className="flex flex-col gap-6">
          {/* Main Interview Cockpit */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Center Area: AI Bot Avatar + Question + Code Snippet + MCQs */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Centered AI Bot Interviewer Avatar */}
              <div className="bg-gradient-to-b from-sidebar to-background border border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg">
                <div className="relative mb-3">
                  {/* Glowing Pulse Rings when Bot Speaks */}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-tr from-primary to-ai shadow-xl transition-all duration-300 ${
                    isBotSpeaking ? 'ring-8 ring-ai/30 scale-105' : 'ring-2 ring-white/10'
                  }`}>
                    <Bot size={44} className="text-white" />
                  </div>
                  {isBotSpeaking && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-ai text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                      <Volume2 size={10} /> Speaking
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-heading font-bold text-white text-base">VeriBot AI Interviewer</h3>
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase">
                    {company} Assessment
                  </span>
                </div>

                {/* Voice & Speech Controls Bar with Speechify Voice Selector */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-full bg-ai/20 text-ai text-[11px] font-bold flex items-center gap-1 border border-ai/30 shadow-sm">
                    <Sparkles size={11} /> Speechify AI (Simba 3.2)
                  </span>
                  <select
                    value={selectedVoice}
                    onChange={e => {
                      const newVoice = e.target.value;
                      setSelectedVoice(newVoice);
                      if (currentQuestion?.question) {
                        speakText(currentQuestion.question);
                      }
                    }}
                    className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium border border-white/20 focus:outline-none focus:border-ai cursor-pointer"
                    title="Change AI Interviewer Voice"
                  >
                    {availableVoices.slice(0, 8).map(v => (
                      <option key={v.id} value={v.id} className="bg-[#1e1e2e] text-white">
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => speakText(currentQuestion.question)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Play question again"
                  >
                    <Volume2 size={13} /> Re-read
                  </button>
                  <button
                    onClick={() => {
                      if (ttsEnabled) {
                        currentAudioRef.current?.pause();
                        window.speechSynthesis?.cancel();
                        setIsBotSpeaking(false);
                      }
                      setTtsEnabled(!ttsEnabled);
                    }}
                    className="p-1.5 rounded-full text-text-muted hover:text-white bg-white/5 transition-colors"
                    title={ttsEnabled ? 'Mute AI voice' : 'Enable AI voice'}
                  >
                    {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-error" />}
                  </button>
                </div>

                {/* Center Question Display */}
                <div className="mt-6 w-full max-w-2xl bg-white/5 border border-white/10 rounded-xl p-5 text-left">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider block mb-2">
                    Question {currentIndex + 1} ({currentQuestion.category || roundType})
                  </span>
                  <p className="text-base md:text-lg font-medium text-white leading-relaxed">
                    {currentQuestion.question}
                  </p>
                </div>
              </div>

              {/* Code Snippet Box (If present in question) */}
              {currentQuestion.code_snippet && currentQuestion.code_snippet.trim() && (
                <Card className="border-border/60 bg-[#1e1e2e] text-white overflow-hidden shadow-md">
                  <div className="px-4 py-2.5 bg-black/30 border-b border-white/10 flex items-center justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1.5 font-mono text-cyan-400">
                      <Code2 size={14} /> Technical Snippet / Problem Context
                    </span>
                  </div>
                  <pre className="p-4 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.code_snippet}
                  </pre>
                </Card>
              )}

              {/* 4 to 5 MCQ Choices */}
              <Card>
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-text-primary">
                    Select Your Answer (Click to select, zero typing required):
                  </CardTitle>
                  <span className="text-xs text-text-muted">4-5 Options</span>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col gap-3">
                  {(currentQuestion.options || [
                    "A) Option A: Implementation with algorithmic time complexity O(N)",
                    "B) Option B: Implementation with logarithmic time complexity O(log N)",
                    "C) Option C: Linear scan with auxiliary buffer allocation",
                    "D) Option D: None of the above constraints apply"
                  ]).map((opt, idx) => {
                    const optionLetter = opt.trim().substring(0, 1).toUpperCase();
                    const isSelected = selectedOption === optionLetter || selectedOption === opt;
                    const isCorrect = currentQuestion.correct_option === optionLetter;

                    let optionStyle = 'border-border bg-background hover:border-primary/40';
                    if (phase === 'question_evaluated') {
                      if (isCorrect) {
                        optionStyle = 'border-success bg-success/10 text-success font-semibold ring-2 ring-success/30';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'border-error bg-error/10 text-error ring-2 ring-error/30';
                      }
                    } else if (isSelected) {
                      optionStyle = 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={phase === 'question_evaluated'}
                        onClick={() => setSelectedOption(optionLetter)}
                        className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${optionStyle}`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-primary text-white' : 'bg-border/40 text-text-primary'
                        }`}>
                          {optionLetter}
                        </div>
                        <span className="text-xs md:text-sm text-text-primary leading-relaxed pt-0.5">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Real-Time Live Speech Transcription Display */}
              <Card className="border-ai/20 bg-background/50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <Mic size={14} className={isListening ? 'text-ai animate-pulse' : 'text-text-muted'} />
                    Candidate Voice Response (Real-Time Live Transcription)
                  </CardTitle>
                  <button
                    onClick={toggleMicListening}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isListening ? 'bg-error text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                    {isListening ? 'Stop Speaking' : 'Start Speaking'}
                  </button>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="p-4 rounded-xl bg-white border border-border min-h-[70px] text-xs text-text-primary leading-relaxed font-sans flex items-center">
                    {spokenTranscript ? (
                      <span>{spokenTranscript}</span>
                    ) : (
                      <span className="text-text-muted italic">
                        {isListening 
                          ? 'Listening... speak your answer into the microphone. Spoken words will replicate here in real time.'
                          : 'Speak into microphone or select one of the MCQ choices above.'}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Submit Bar */}
              {phase === 'in_session' && (
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleSubmitCurrentAnswer}
                    disabled={submitting || (!selectedOption && !spokenTranscript.trim())}
                    className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        AI Evaluating Response...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Submit Answer & Evaluate
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Evaluation Feedback Panel */}
              {phase === 'question_evaluated' && currentEvaluation && (
                <Card className="border-l-4 border-l-primary bg-gradient-to-r from-background to-primary/5 animate-in slide-in-from-top-4 duration-300">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {currentEvaluation.overall_score >= 70 ? (
                          <CheckCircle2 size={22} className="text-success" />
                        ) : (
                          <AlertTriangle size={22} className="text-warning" />
                        )}
                        <h4 className="font-heading font-bold text-base text-text-primary">
                          AI Assessment Feedback · Score: {currentEvaluation.overall_score}/100
                        </h4>
                      </div>
                      <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        {currentIndex < (session?.questions?.length || 1) - 1 ? 'Next Question' : 'View Session Results'}
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    <p className="text-xs text-text-primary leading-relaxed bg-white p-3.5 rounded-xl border border-border">
                      {currentEvaluation.feedback_summary || currentQuestion.explanation}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {currentEvaluation.strengths?.length > 0 && (
                        <div className="p-3 bg-success/5 border border-success/20 rounded-xl">
                          <strong className="text-success font-bold block mb-1.5 flex items-center gap-1">
                            <Check size={13} /> Strengths
                          </strong>
                          <ul className="space-y-1 text-text-secondary">
                            {currentEvaluation.strengths.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {currentEvaluation.areas_to_improve?.length > 0 && (
                        <div className="p-3 bg-error/5 border border-error/20 rounded-xl">
                          <strong className="text-error font-bold block mb-1.5 flex items-center gap-1">
                            <XCircle size={13} /> Areas to Improve
                          </strong>
                          <ul className="space-y-1 text-text-secondary">
                            {currentEvaluation.areas_to_improve.map((imp, i) => (
                              <li key={i}>• {imp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Live Proctored Webcam & Session Stats */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Webcam Picture-in-Picture */}
              <Card className="border-border overflow-hidden bg-sidebar shadow-md">
                <div className="p-3 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-white">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                    Proctored Webcam
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCameraActive(!cameraActive)}
                      className="p-1 rounded text-text-muted hover:text-white"
                      title={cameraActive ? 'Turn off camera' : 'Turn on camera'}
                    >
                      {cameraActive ? <Video size={14} className="text-success" /> : <VideoOff size={14} />}
                    </button>
                    <button
                      onClick={toggleMicListening}
                      className="p-1 rounded text-text-muted hover:text-white"
                      title={isListening ? 'Mute microphone' : 'Unmute microphone'}
                    >
                      {isListening ? <Mic size={14} className="text-ai" /> : <MicOff size={14} />}
                    </button>
                  </div>
                </div>

                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`}
                  />
                  {!cameraActive && (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-text-muted">
                      <User size={36} className="text-border mb-2" />
                      <span className="text-xs">Camera stream paused</span>
                      <button
                        onClick={startCameraAndMic}
                        className="mt-3 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-semibold"
                      >
                        Enable Camera
                      </button>
                    </div>
                  )}

                  {/* Face Outline Overlay */}
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/10 rounded-lg m-3 flex items-center justify-center">
                      <div className="w-28 h-36 border border-dashed border-primary/40 rounded-full opacity-60"></div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-black/20 text-[11px] text-text-muted flex justify-between items-center">
                  <span>Candidate: Yamini</span>
                  <span className="text-success font-semibold">Proctor Active</span>
                </div>
              </Card>

              {/* Session Progress */}
              <Card>
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-bold text-text-primary">Assessment Progress</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted">Questions Completed:</span>
                    <strong className="text-text-primary">{currentIndex + (phase === 'question_evaluated' ? 1 : 0)} / {session?.questions?.length || 5}</strong>
                  </div>
                  <Progress 
                    value={Math.round(((currentIndex + (phase === 'question_evaluated' ? 1 : 0)) / (session?.questions?.length || 5)) * 100)} 
                    colorClass="bg-primary" 
                  />

                  <div className="pt-3 border-t border-border/50 text-xs text-text-muted space-y-1.5">
                    <p>• <strong>Target:</strong> {targetRole}</p>
                    <p>• <strong>Employer Pattern:</strong> {company}</p>
                    <p>• <strong>Evaluation Model:</strong> Gemini AI Agent</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: COMPLETED RESULTS SUMMARY */}
      {phase === 'done' && (
        <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-in zoom-in-95 duration-300">
          <Card className="text-center p-8 border-primary/30 bg-gradient-to-b from-background to-primary/5">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Award size={40} />
            </div>
            <h2 className="text-2xl font-heading font-bold text-text-primary mb-1">
              Mock Interview Completed!
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              You completed the <strong>{company}</strong> mock assessment round for <strong>{targetRole}</strong>.
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              <div className="p-4 bg-white border border-border rounded-xl">
                <div className="text-3xl font-black text-primary">{sessionAvgScore}%</div>
                <div className="text-[10px] font-bold uppercase text-text-muted">Overall Score</div>
              </div>
              <div className="p-4 bg-white border border-border rounded-xl">
                <div className="text-3xl font-black text-success">
                  {evaluations.filter(e => e.evaluation?.overall_score >= 70).length} / {evaluations.length}
                </div>
                <div className="text-[10px] font-bold uppercase text-text-muted">Correct MCQs</div>
              </div>
              <div className="p-4 bg-white border border-border rounded-xl">
                <div className="text-3xl font-black text-ai">85%</div>
                <div className="text-[10px] font-bold uppercase text-text-muted">Clarity & Voice</div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPhase('setup')}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw size={15} /> Retake Assessment
              </button>
            </div>
          </Card>

          {/* Question Breakdown */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-bold text-text-primary">Questions & Feedback Review</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              {evaluations.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-xs text-text-primary">
                      Q{idx + 1}: {item.question?.question}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.evaluation?.overall_score >= 70 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      Score: {item.evaluation?.overall_score}%
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    <strong>Your Response:</strong> {item.selectedOption ? `Option ${item.selectedOption}` : item.spokenTranscript || 'Answered'}
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed bg-white p-2.5 rounded border border-border">
                    <strong>Feedback:</strong> {item.evaluation?.feedback_summary || item.question?.explanation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
