import { useState, useEffect, useMemo, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, ArrowRight, ArrowLeft, Clock, Award } from 'lucide-react'
import { createAssessment } from '../features/preparation/preparationService'

// ── Fallback static bank (used only when backend is unreachable) ──────────────
const FALLBACK_QUESTION_BANK = {
  DSA: [
    {
      question_id: 'dsa-1',
      category: 'DSA',
      topic: 'Arrays & Kadane',
      difficulty: 'Medium',
      question: 'Given an integer array, which algorithm is optimal for finding the maximum contiguous subarray sum in O(n) time?',
      options: ["Kadane's algorithm", 'Binary search on index range', "Dijkstra's shortest path", 'Depth-first search with memoization'],
      correct_answer: "Kadane's algorithm",
      explanation: "Kadane's algorithm maintains a running maximum ending at the current index and tracks the overall global maximum in a single pass.",
    },
    {
      question_id: 'dsa-2',
      category: 'DSA',
      topic: 'Hashing',
      difficulty: 'Easy',
      question: 'How can you detect duplicates in an unsorted list in linear O(n) average time?',
      options: ['Use a Hash Set', 'Nested loop iteration O(n²)', 'Bubble sort and compare adjacent', 'Binary search tree traversal'],
      correct_answer: 'Use a Hash Set',
      explanation: 'A Hash Set provides O(1) average time lookup and insertion, enabling duplicate detection in O(n) time.',
    },
    {
      question_id: 'dsa-3',
      category: 'DSA',
      topic: 'Sliding Window',
      difficulty: 'Medium',
      question: 'Which technique is most efficient for finding the minimum window substring containing all target characters?',
      options: ['Variable-size sliding window with frequency map', 'Recursive backtracking', 'Prefix sum matrix', 'Breadth-first search'],
      correct_answer: 'Variable-size sliding window with frequency map',
      explanation: 'Expanding the right pointer to satisfy constraints and contracting the left pointer to minimize length achieves O(n) time.',
    },
    {
      question_id: 'dsa-4',
      category: 'DSA',
      topic: 'Dynamic Programming',
      difficulty: 'Hard',
      question: 'What is the optimal auxiliary space complexity of 0/1 Knapsack when using 1D state compression?',
      options: ['O(W) where W is maximum capacity', 'O(N × W)', 'O(2^N)', 'O(1) constant space'],
      correct_answer: 'O(W) where W is maximum capacity',
      explanation: 'By iterating the capacity backwards from W down to item weight, previous state transitions remain uncorrupted in a single 1D array.',
    },
  ],
  Technical: [
    {
      question_id: 'tech-1',
      category: 'Technical',
      topic: 'SQL',
      difficulty: 'Medium',
      question: 'Which query retrieves the top 3 highest distinct employee salaries in standard SQL?',
      options: [
        'SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 3;',
        'SELECT TOP 3 salary FROM employees;',
        'SELECT MAX(salary, 3) FROM employees;',
        'SELECT salary FROM employees WHERE rank <= 3;',
      ],
      correct_answer: 'SELECT DISTINCT salary FROM employees ORDER BY salary DESC LIMIT 3;',
      explanation: 'Sorting descending by salary and taking the limit of 3 distinct values gives the top 3 compensation levels.',
    },
    {
      question_id: 'tech-2',
      category: 'Technical',
      topic: 'System Design',
      difficulty: 'Hard',
      question: 'Which caching strategy guarantees strong consistency by writing to both cache and database simultaneously?',
      options: ['Write-through cache', 'Write-back / write-behind cache', 'Write-around cache', 'Read-through cache'],
      correct_answer: 'Write-through cache',
      explanation: 'Write-through caches write to cache and persistent store synchronously, ensuring fresh data at the cost of write latency.',
    },
    {
      question_id: 'tech-3',
      category: 'Technical',
      topic: 'REST APIs',
      difficulty: 'Medium',
      question: 'Which HTTP method is idempotent and intended to completely replace the state of a resource?',
      options: ['PUT', 'POST', 'PATCH', 'CONNECT'],
      correct_answer: 'PUT',
      explanation: 'HTTP PUT is idempotent and represents a full replacement of the entity at the given URI.',
    },
  ],
  Aptitude: [
    {
      question_id: 'apt-1',
      category: 'Aptitude',
      topic: 'Percentages',
      difficulty: 'Easy',
      question: "An item's price is increased by 20% and later discounted by 20%. What is the net percentage change from original?",
      options: ['4% decrease', '0% change (same price)', '2% decrease', '4% increase'],
      correct_answer: '4% decrease',
      explanation: 'Net multiplier = (1 + 0.20) * (1 - 0.20) = 1.2 * 0.8 = 0.96, which is a 4% reduction.',
    },
    {
      question_id: 'apt-2',
      category: 'Aptitude',
      topic: 'Time and Work',
      difficulty: 'Medium',
      question: 'Pipe A fills a tank in 4 hours, and Pipe B empties it in 6 hours. When both operate together, the tank is filled in:',
      options: ['12 hours', '10 hours', '8 hours', '5 hours'],
      correct_answer: '12 hours',
      explanation: 'Net rate = 1/4 - 1/6 = (3 - 2)/12 = 1/12 per hour, so it requires 12 hours.',
    },
  ],
  Communication: [
    {
      question_id: 'comm-1',
      category: 'Communication',
      topic: 'Professional Tone',
      difficulty: 'Easy',
      question: "Which phrasing conveys the most effective professional tone for: 'I need this project file ASAP'?",
      options: [
        'I would appreciate receiving the project file at your earliest convenience.',
        'Send me the project file immediately please.',
        'Why has no one sent the file yet?',
        'Give me the project file now.',
      ],
      correct_answer: 'I would appreciate receiving the project file at your earliest convenience.',
      explanation: 'Polite, clear, and respectful communication fosters constructive collaboration while setting clear expectations.',
    },
    {
      question_id: 'comm-2',
      category: 'Communication',
      topic: 'HR Interview Structuring',
      difficulty: 'Medium',
      question: "When responding to 'Walk me through your background', what framework is most effective?",
      options: [
        'Present -> Past -> Future (Current focus, relevant achievements, alignment with target role)',
        'Chronological life history starting from school years',
        'Focus exclusively on personal interests and hobbies',
        'Summarize resume line by line without context',
      ],
      correct_answer: 'Present -> Past -> Future (Current focus, relevant achievements, alignment with target role)',
      explanation: 'The Present-Past-Future model provides concise, relevant context demonstrating how your track record prepares you for the position.',
    },
  ],
}

export default function Assessment() {
  const [selectedCategory, setSelectedCategory] = useState('DSA')
  const [targetRole, setTargetRole] = useState('Software Engineer')
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [inProgress, setInProgress] = useState(false)
  const [isRemediation, setIsRemediation] = useState(false)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(600)
  const [testReport, setTestReport] = useState(null)
  const [reportFilter, setReportFilter] = useState('all')

  const handleSubmitAssessment = useCallback(() => {
    setInProgress(false)
    const total = questions.length
    let correctCount = 0
    let incorrectCount = 0
    let unattemptedCount = 0

    const questionResults = []
    const passedList = []
    const failedList = []
    const skippedList = []
    const weakTopicsSet = new Set()
    const perTopic = {}

    questions.forEach(q => {
      const qid = q.question_id
      const topic = q.topic || 'General'
      const userAns = answers[qid]
      const isSkipped = userAns === undefined || userAns === '' || userAns === null
      const isCorrect = !isSkipped && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()

      perTopic[topic] = perTopic[topic] || { correct: 0, total: 0 }
      perTopic[topic].total += 1

      let status
      if (isCorrect) {
        status = 'passed'
        correctCount += 1
        perTopic[topic].correct += 1
      } else if (isSkipped) {
        status = 'skipped'
        unattemptedCount += 1
        weakTopicsSet.add(topic)
      } else {
        status = 'failed'
        incorrectCount += 1
        weakTopicsSet.add(topic)
      }

      const itemResult = {
        question_id: qid,
        category: q.category || selectedCategory,
        topic,
        difficulty: q.difficulty || 'Medium',
        question: q.question,
        options: q.options || [],
        user_answer: userAns || '(Skipped)',
        correct_answer: q.correct_answer,
        status,
        explanation: q.explanation || 'Review the core concept for this topic.',
      }

      questionResults.push(itemResult)
      if (status === 'passed') passedList.push(itemResult)
      else if (status === 'failed') failedList.push(itemResult)
      else skippedList.push(itemResult)
    })

    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
    const attempted = total - unattemptedCount
    const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0

    const topicWise = {}
    Object.keys(perTopic).forEach(top => {
      topicWise[top] = Math.round((perTopic[top].correct / perTopic[top].total) * 100)
    })

    const report = {
      assessment_id: `asmt_${Date.now()}`,
      category: isRemediation ? `${selectedCategory} (Remediation)` : selectedCategory,
      score,
      accuracy,
      total_questions: total,
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      unattempted: unattemptedCount,
      weak_topics: Array.from(weakTopicsSet),
      topic_wise_performance: topicWise,
      question_results: questionResults,
      passed_questions: passedList,
      failed_questions: failedList,
      skipped_questions: skippedList,
      completed_at: new Date().toLocaleTimeString(),
    }

    setTestReport(report)

    // Persist to backend
    const uid = localStorage.getItem('career_user') || 'user_default';
    axiosClient.post('/preparation/assessment/submit', {
      user_id: uid,
      assessment_id: report.assessment_id,
      category: selectedCategory,
      answers: {
        ...answers,
        __questions__: questions
      }
    }).catch(err => {
      console.warn('Backend sync for assessment report:', err);
    });
  }, [answers, isRemediation, questions, selectedCategory])

  // Timer countdown during assessment
  useEffect(() => {
    let timer = null
    if (inProgress && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleSubmitAssessment()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [inProgress, timeRemaining, handleSubmitAssessment])

  const formatTime = seconds => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const startAssessment = useCallback(async (category, questionsToUse = null, remediation = false) => {
    if (questionsToUse) {
      // Remediation with provided questions (local)
      setQuestions(questionsToUse)
      setCurrentIndex(0)
      setAnswers({})
      setTimeRemaining(questionsToUse.length * 90)
      setTestReport(null)
      setIsRemediation(remediation)
      setInProgress(true)
      return
    }
    // ── Call the backend AI to generate fresh questions ──────────────────────
    setGeneratingQuestions(true)
    try {
      const response = await createAssessment({
        user_id: 'current_user',
        category,
        topic: null,
        difficulty,
        number_of_questions: numQuestions,
        duration: numQuestions * 3,
        target_role: targetRole,
      })
      const aiQuestions = response?.questions || []
      if (aiQuestions.length > 0) {
        setQuestions(aiQuestions)
        setCurrentIndex(0)
        setAnswers({})
        setTimeRemaining(aiQuestions.length * 90)
        setTestReport(null)
        setIsRemediation(remediation)
        setInProgress(true)
        return
      }
    } catch (err) {
      console.warn('AI assessment generation failed, using fallback bank:', err)
    } finally {
      setGeneratingQuestions(false)
    }
    // ── Fallback to static bank when backend is unavailable ──────────────────
    const list = FALLBACK_QUESTION_BANK[category] || FALLBACK_QUESTION_BANK['DSA']
    setQuestions(list)
    setCurrentIndex(0)
    setAnswers({})
    setTimeRemaining(list.length * 90)
    setTestReport(null)
    setIsRemediation(remediation)
    setInProgress(true)
  }, [difficulty, numQuestions, targetRole])

  const handleSelectOption = (qid, option) => {
    setAnswers(prev => ({ ...prev, [qid]: option }))
  }

  const handleSkipQuestion = () => {
    const currentQ = questions[currentIndex]
    if (currentQ) {
      setAnswers(prev => {
        const next = { ...prev }
        delete next[currentQ.question_id]
        return next
      })
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Filter questions in the test report
  const filteredReportQuestions = useMemo(() => {
    if (!testReport) return []
    if (reportFilter === 'failed') return testReport.failed_questions
    if (reportFilter === 'skipped') return testReport.skipped_questions
    if (reportFilter === 'passed') return testReport.passed_questions
    return testReport.question_results
  }, [testReport, reportFilter])

  // Re-attempt only the incomplete (skipped + failed) questions
  const handleReattemptIncomplete = () => {
    if (!testReport) return
    const incomplete = [...testReport.skipped_questions, ...testReport.failed_questions]
    if (incomplete.length === 0) return

    const reattemptQuestions = incomplete.map(item => ({
      question_id: item.question_id,
      category: item.category,
      topic: item.topic,
      difficulty: item.difficulty,
      question: item.question,
      options: item.options,
      correct_answer: item.correct_answer,
      explanation: item.explanation,
    }))

    startAssessment(selectedCategory, reattemptQuestions, true)
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-ai/10 text-ai text-xs font-bold uppercase tracking-wider mb-3 inline-block">
            CareerTwin · Assessment Intelligence
          </span>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
            Skill Assessments & Test Reports
          </h1>
          <p className="text-text-secondary text-base">
            AI generates fresh, role-specific questions every session. No static bank — every test is unique.
          </p>
        </div>
      </div>

      {generatingQuestions && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-ai/10 border border-ai/20 text-ai-hover rounded-xl shadow-sm animate-in slide-in-from-top-2">
          <RefreshCw size={18} className="animate-spin text-ai" />
          <span className="font-medium text-sm">AI is generating your personalised questions…</span>
        </div>
      )}

      {/* VIEW 1: Assessment Hub / Category Selection */}
      {!inProgress && !testReport && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-heading font-bold text-text-primary m-0">Available Skill Assessments</h2>
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-md">
                Timed & Auto-Evaluated
              </span>
            </div>

            {/* AI Configuration */}
            <div className="bg-background rounded-2xl border border-border shadow-sm p-6 mb-8 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Target Role (AI tailors questions)</label>
                <input 
                  value={targetRole} 
                  onChange={e => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai transition-all" 
                />
              </div>
              <div className="min-w-[150px]">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Questions</label>
                <select 
                  value={numQuestions} 
                  onChange={e => setNumQuestions(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai transition-all cursor-pointer"
                >
                  {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
                </select>
              </div>
              <div className="min-w-[150px]">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Difficulty</label>
                <select 
                  value={difficulty} 
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai transition-all cursor-pointer capitalize"
                >
                  {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { key: 'DSA', title: 'DSA & Algorithms', badge: 'High Impact', desc: 'Arrays, Trees, DP, Graphs — AI selects based on your role', color: 'indigo' },
                { key: 'Technical', title: 'Technical & System Design', badge: 'Core', desc: 'SQL, APIs, architecture — AI matches your target role stack', color: 'blue' },
                { key: 'Aptitude', title: 'Aptitude & Reasoning', badge: 'Placement', desc: 'Quantitative, logical — AI adapts difficulty to your level', color: 'emerald' },
                { key: 'Communication', title: 'HR & Communication', badge: 'Essential', desc: 'Professional tone, STAR answers — AI tests real scenarios', color: 'violet' },
              ].map(item => (
                <div key={item.key} className="bg-background rounded-2xl border border-border shadow-sm p-6 flex flex-col justify-between hover:border-border-hover transition-colors group">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`px-2.5 py-1 bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400 border border-${item.color}-200 dark:border-${item.color}-800 text-[10px] font-black uppercase tracking-widest rounded-md`}>
                        {item.badge}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-ai flex items-center gap-1">
                        <RefreshCw size={10} /> AI-Generated
                      </span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed mb-6">{item.desc}</p>
                  </div>
                  <div>
                    <button
                      className="w-full py-2.5 bg-background border-2 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={generatingQuestions}
                      onClick={() => {
                        setSelectedCategory(item.key)
                        startAssessment(item.key)
                      }}
                    >
                      {generatingQuestions ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                      {generatingQuestions ? 'Generating…' : 'Start Assessment'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Info on Skipped & Failed Questions */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-6">
              <div className="flex gap-4 items-start">
                <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-3 rounded-xl shrink-0">
                  <RefreshCw size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Mastery Through Remediation</h3>
                  <p className="text-sm text-text-secondary leading-relaxed m-0">
                    CareerTwin isolates questions you <strong className="text-text-primary font-bold">left skipped</strong> or <strong className="text-text-primary font-bold">failed</strong> in test reports and creates targeted remediation sessions, helping you achieve 100% mastery without repeating questions you already solved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Active Test Taking Interface */}
      {inProgress && currentQuestion && (
        <div className="max-w-4xl mx-auto bg-background rounded-3xl border border-border shadow-lg overflow-hidden animate-in slide-in-from-bottom-4">
          
          {/* Header */}
          <div className="bg-background/50 border-b border-border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">
                {isRemediation ? 'Remediation Assessment · Complete Incomplete Work' : `${selectedCategory} Assessment`}
              </span>
              <h2 className="text-xl font-heading font-black text-text-primary m-0">
                Question {currentIndex + 1} <span className="text-text-muted font-medium">of {questions.length}</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-warning/10 text-warning-hover px-4 py-2 rounded-xl font-bold text-sm border border-warning/20">
              <Clock size={16} />
              <span className="font-mono">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {/* Question Palette */}
            <div className="flex flex-wrap gap-2 mb-8">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.question_id] !== undefined && answers[q.question_id] !== ''
                const isCurrent = idx === currentIndex
                
                let btnClass = "w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer "
                if (isCurrent) {
                  btnClass += "bg-primary text-white shadow-md shadow-primary/20 border-2 border-primary"
                } else if (isAnswered) {
                  btnClass += "bg-success/10 text-success border border-success/30 hover:bg-success/20"
                } else {
                  btnClass += "bg-background border border-border text-text-secondary hover:bg-border/30"
                }
                
                return (
                  <button
                    key={q.question_id}
                    onClick={() => setCurrentIndex(idx)}
                    className={btnClass}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            {/* Question Prompt */}
            <div className="mb-8">
              <div className="flex gap-2 mb-4">
                <span className="px-2.5 py-1 bg-background border border-border rounded-md text-[10px] font-black uppercase tracking-widest text-text-secondary">
                  {currentQuestion.topic}
                </span>
                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-md text-[10px] font-black uppercase tracking-widest">
                  {currentQuestion.difficulty}
                </span>
              </div>
              <h3 className="text-xl leading-relaxed text-text-primary font-medium">{currentQuestion.question}</h3>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3 mb-10">
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                currentQuestion.options.map((opt, i) => {
                  const isSelected = answers[currentQuestion.question_id] === opt
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(currentQuestion.question_id, opt)}
                      className={`flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                        isSelected 
                          ? 'bg-primary/10 border-2 border-primary shadow-sm' 
                          : 'bg-background border border-border hover:border-border-hover hover:bg-border/10'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-background border border-border text-text-muted'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={`text-base ${isSelected ? 'text-primary font-semibold' : 'text-text-primary'}`}>
                        {opt}
                      </span>
                    </button>
                  )
                })
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Your reasoning / solution answer</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[120px] resize-y"
                    value={answers[currentQuestion.question_id] || ''}
                    onChange={e => handleSelectOption(currentQuestion.question_id, e.target.value)}
                    placeholder="Type your explanation or answer here..."
                  />
                </div>
              )}
            </div>

            {/* Navigation & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border/50">
              <button
                className="w-full sm:w-auto px-6 py-2.5 bg-background border border-border text-text-secondary hover:text-text-primary hover:bg-border/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
              >
                <ArrowLeft size={16} /> Previous
              </button>

              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                <button
                  className="w-full sm:w-auto px-6 py-2.5 bg-background border border-warning/30 text-warning hover:bg-warning/10 font-bold rounded-xl transition-all flex items-center justify-center"
                  onClick={handleSkipQuestion}
                >
                  Skip Question
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                  >
                    Next <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    className="w-full sm:w-auto px-6 py-2.5 bg-success hover:bg-success-hover text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    onClick={handleSubmitAssessment}
                  >
                    <CheckCircle2 size={18} /> Submit Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Comprehensive Test Report Card */}
      {testReport && (
        <div className="flex flex-col gap-8 animate-in zoom-in-95 duration-500">
          
          {/* Main Score Header Card */}
          <div className={`bg-background rounded-3xl border shadow-md p-6 md:p-8 border-l-8 ${
            testReport.score >= 70 ? 'border-l-success' : testReport.score >= 50 ? 'border-l-warning' : 'border-l-error'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-background border border-border text-text-secondary text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                  {testReport.category}
                </span>
                <h2 className="text-2xl md:text-3xl font-heading font-black text-text-primary mb-2">
                  Test Report & Evaluation
                </h2>
                <p className="text-sm text-text-muted m-0 flex items-center gap-2">
                  <Clock size={14} /> Completed at {testReport.completed_at}
                </p>
              </div>

              <div className="flex gap-8 bg-background border border-border/50 rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="text-center">
                  <div className={`text-4xl md:text-5xl font-black font-heading tracking-tight mb-1 ${
                    testReport.score >= 70 ? 'text-success' : testReport.score >= 50 ? 'text-warning' : 'text-error'
                  }`}>
                    {testReport.score}%
                  </div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Overall Score</div>
                </div>
                <div className="w-px bg-border/50"></div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black font-heading tracking-tight mb-1 text-primary">
                    {testReport.accuracy}%
                  </div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Attempt Accuracy</div>
                </div>
              </div>
            </div>

            {/* Metric Counters: Passed, Failed, Skipped */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">TOTAL QUESTIONS</div>
                <div className="text-3xl font-black font-heading text-text-primary">{testReport.total_questions}</div>
              </div>

              <div className="bg-success/5 border border-success/20 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-success uppercase tracking-widest mb-2">
                  <CheckCircle2 size={14} /> PASSED
                </div>
                <div className="text-3xl font-black font-heading text-success-hover">{testReport.correct_answers}</div>
              </div>

              <div className="bg-error/5 border border-error/20 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-error uppercase tracking-widest mb-2">
                  <XCircle size={14} /> FAILED
                </div>
                <div className="text-3xl font-black font-heading text-error-hover">{testReport.incorrect_answers}</div>
              </div>

              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-warning uppercase tracking-widest mb-2">
                  <AlertCircle size={14} /> SKIPPED
                </div>
                <div className="text-3xl font-black font-heading text-warning-hover">{testReport.unattempted}</div>
              </div>
            </div>

            {/* REMEDIATION ACTION CALLOUT IF SKIPPED OR FAILED QUESTIONS EXIST */}
            {(testReport.unattempted > 0 || testReport.incorrect_answers > 0) ? (
              <div className="mt-8 p-5 md:p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-lg mb-1">
                    <RefreshCw size={20} />
                    <span>Complete Work Left Skipped & Failed</span>
                  </div>
                  <p className="text-sm text-blue-900/70 dark:text-blue-200/70 m-0">
                    Turn your {testReport.unattempted} skipped and {testReport.incorrect_answers} failed items into 100% mastery with a targeted remediation session.
                  </p>
                </div>
                <button
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
                  onClick={handleReattemptIncomplete}
                >
                  <RefreshCw size={16} /> Complete {testReport.unattempted + testReport.incorrect_answers} Questions
                </button>
              </div>
            ) : (
              <div className="mt-8 p-5 md:p-6 rounded-2xl bg-success/10 border border-success/20 flex items-start gap-4 text-success-hover">
                <Award size={28} className="shrink-0 mt-1" />
                <div>
                  <h4 className="text-lg font-bold mb-1">Outstanding! 100% Completed & Passed</h4>
                  <p className="text-sm m-0 opacity-90">
                    All questions in this test report have been mastered with zero skipped or failed items. Excellent work!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Filterable Question Review Card */}
          <div className="bg-background rounded-3xl border border-border shadow-md overflow-hidden">
            <div className="p-6 md:p-8 border-b border-border bg-background/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-xl font-heading font-bold text-text-primary mb-1">Question Review & Explanations</h3>
                <p className="text-sm text-text-muted m-0">Examine correct solutions and learn from skipped or failed questions.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 bg-background p-1.5 rounded-xl border border-border shadow-sm">
                {[
                  { key: 'all', label: `All (${testReport.total_questions})` },
                  { key: 'failed', label: `Failed (${testReport.incorrect_answers})` },
                  { key: 'skipped', label: `Skipped (${testReport.unattempted})` },
                  { key: 'passed', label: `Passed (${testReport.correct_answers})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setReportFilter(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      reportFilter === tab.key 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-text-secondary hover:bg-border/30 hover:text-text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Questions */}
            <div className="p-6 md:p-8 flex flex-col gap-6 bg-background/30">
              {filteredReportQuestions.length > 0 ? (
                filteredReportQuestions.map((item) => (
                  <div
                    key={item.question_id}
                    className={`p-6 rounded-2xl border shadow-sm ${
                      item.status === 'passed' ? 'border-success/30 bg-success/5' 
                      : item.status === 'failed' ? 'border-error/30 bg-error/5' 
                      : 'border-warning/30 bg-warning/5'
                    }`}
                  >
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-background border border-border text-text-secondary text-[10px] font-black uppercase tracking-widest rounded-md">
                          {item.topic}
                        </span>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-[10px] font-black uppercase tracking-widest rounded-md">
                          {item.difficulty}
                        </span>
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${
                        item.status === 'passed' ? 'bg-success/20 text-success-hover' 
                        : item.status === 'failed' ? 'bg-error/20 text-error-hover' 
                        : 'bg-warning/20 text-warning-hover'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h4 className="text-base font-medium text-text-primary mb-5">{item.question}</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                      <div className="bg-background rounded-xl p-4 border border-border shadow-sm">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Your Answer</span>
                        <strong className={`text-sm ${
                          item.status === 'passed' ? 'text-success' 
                          : item.status === 'failed' ? 'text-error' 
                          : 'text-warning'
                        }`}>
                          {item.user_answer || '(Left Skipped)'}
                        </strong>
                      </div>
                      <div className="bg-background rounded-xl p-4 border border-border shadow-sm">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Correct Answer</span>
                        <strong className="text-sm text-primary">{item.correct_answer}</strong>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm text-text-secondary leading-relaxed">
                      <strong className="text-primary mr-2">Explanation:</strong>
                      {item.explanation}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-2xl">
                  <div className="w-16 h-16 rounded-full bg-border/50 flex items-center justify-center text-text-muted mx-auto mb-4">
                    <RefreshCw size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-text-primary mb-2">No Questions Found</h4>
                  <p className="text-sm text-text-secondary">No questions match the selected filter view.</p>
                </div>
              )}
            </div>

            {/* Back to Assessments Hub */}
            <div className="p-6 border-t border-border bg-background flex flex-col sm:flex-row justify-between gap-4">
              <button
                className="w-full sm:w-auto px-6 py-2.5 bg-background border border-border text-text-secondary hover:text-text-primary hover:bg-border/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                onClick={() => {
                  setTestReport(null)
                  setInProgress(false)
                }}
              >
                <ArrowLeft size={16} /> Back to Library
              </button>

              {(testReport.unattempted > 0 || testReport.incorrect_answers > 0) && (
                <button
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  onClick={handleReattemptIncomplete}
                >
                  <RefreshCw size={16} /> Complete {testReport.unattempted + testReport.incorrect_answers} Incomplete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
