import { useState, useEffect, useMemo, useCallback } from 'react'
import { Page } from './_shared'
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
    <Page eyebrow="CareerTwin · Assessment Intelligence" title="Skill Assessments & Test Reports" subtitle="AI generates fresh, role-specific questions every session. No static bank — every test is unique.">
      {generatingQuestions && (
        <div className="notice" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> AI is generating your personalised questions…
        </div>
      )}

      {/* VIEW 1: Assessment Hub / Category Selection */}
      {!inProgress && !testReport && (
        <>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h2>Available Skill Assessments</h2>
            <span className="tag">Timed & Auto-Evaluated</span>
          </div>

          {/* AI Configuration */}
          <div className="card" style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Target Role (AI tailors questions)</label>
              <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div style={{ minWidth: 130 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Questions</label>
              <select value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }}>
                {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <div style={{ minWidth: 130 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13 }}>
                {['easy', 'medium', 'hard'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-4">
            {[
              { key: 'DSA', title: 'DSA & Algorithms', badge: 'High Impact', desc: 'Arrays, Trees, DP, Graphs — AI selects based on your role' },
              { key: 'Technical', title: 'Technical & System Design', badge: 'Core', desc: 'SQL, APIs, architecture — AI matches your target role stack' },
              { key: 'Aptitude', title: 'Aptitude & Reasoning', badge: 'Placement', desc: 'Quantitative, logical — AI adapts difficulty to your level' },
              { key: 'Communication', title: 'HR & Communication', badge: 'Essential', desc: 'Professional tone, STAR answers — AI tests real scenarios' },
            ].map(item => (
              <div key={item.key} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span className="tag">{item.badge}</span>
                    <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>AI-Generated</span>
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{item.title}</h3>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
                <div>
                  <button
                    className="button"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    disabled={generatingQuestions}
                    onClick={() => {
                      setSelectedCategory(item.key)
                      startAssessment(item.key)
                    }}
                  >
                    {generatingQuestions ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={13} />}
                    {generatingQuestions ? 'Generating…' : 'Start AI Assessment'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Info on Skipped & Failed Questions */}
          <div className="card" style={{ marginTop: 24, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ background: '#e0f2fe', color: '#0284c7', padding: 10, borderRadius: 8, marginTop: 2 }}>
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Mastery Through Remediation</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                  CareerTwin isolates questions you <strong>left skipped</strong> or <strong>failed</strong> in test reports and creates targeted remediation sessions, helping you achieve 100% mastery without repeating questions you already solved.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: Active Test Taking Interface */}
      {inProgress && currentQuestion && (
        <div className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <span className="eyebrow">{isRemediation ? 'Remediation Assessment · Complete Incomplete Work' : `${selectedCategory} Assessment`}</span>
              <h2 style={{ margin: '4px 0 0', fontSize: 18 }}>
                Question {currentIndex + 1} of {questions.length}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff3e2', color: 'var(--warning)', padding: '6px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
              <Clock size={15} />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Question Palette */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {questions.map((q, idx) => {
              const isAnswered = answers[q.question_id] !== undefined && answers[q.question_id] !== ''
              const isCurrent = idx === currentIndex
              return (
                <button
                  key={q.question_id}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: isCurrent ? '2px solid var(--blue)' : '1px solid #cbd5e1',
                    background: isCurrent ? '#dbeafe' : isAnswered ? '#e6f5f2' : '#f8fafc',
                    color: isCurrent ? 'var(--blue)' : isAnswered ? 'var(--teal)' : 'var(--muted)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          {/* Question Prompt */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span className="tag">{currentQuestion.topic}</span>
              <span className="tag orange">{currentQuestion.difficulty}</span>
            </div>
            <h3 style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--ink)' }}>{currentQuestion.question}</h3>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gap: 10, marginBottom: 30 }}>
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              currentQuestion.options.map((opt, i) => {
                const isSelected = answers[currentQuestion.question_id] === opt
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(currentQuestion.question_id, opt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: isSelected ? '2px solid var(--blue)' : '1px solid #cbd5e1',
                      background: isSelected ? '#eff6ff' : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: isSelected ? 'var(--navy)' : 'var(--ink)',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all .15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        border: isSelected ? '2px solid var(--blue)' : '1px solid #94a3b8',
                        background: isSelected ? 'var(--blue)' : 'transparent',
                        color: isSelected ? '#fff' : '#64748b',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                )
              })
            ) : (
              <div className="field">
                <label>Your reasoning / solution answer</label>
                <textarea
                  value={answers[currentQuestion.question_id] || ''}
                  onChange={e => handleSelectOption(currentQuestion.question_id, e.target.value)}
                  placeholder="Type your explanation or answer here..."
                />
              </div>
            )}
          </div>

          {/* Navigation & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 18 }}>
            <button
              className="button secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Previous
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="button secondary"
                style={{ color: 'var(--warning)', borderColor: '#fed7aa' }}
                onClick={handleSkipQuestion}
              >
                Skip Question
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  className="button"
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                >
                  Next <ArrowRight size={14} style={{ marginLeft: 6 }} />
                </button>
              ) : (
                <button
                  className="button"
                  style={{ background: 'var(--success)' }}
                  onClick={handleSubmitAssessment}
                >
                  Submit Assessment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Comprehensive Test Report Card */}
      {testReport && (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Main Score Header Card */}
          <div className="card" style={{ borderLeft: `6px solid ${testReport.score >= 70 ? 'var(--teal)' : testReport.score >= 50 ? 'var(--warning)' : 'var(--error)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span className="tag">{testReport.category}</span>
                <h2 style={{ margin: '8px 0 4px', fontSize: 24 }}>Test Report & Evaluation</h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Completed at {testReport.completed_at}</p>
              </div>

              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ font: "800 36px 'Manrope'", color: testReport.score >= 70 ? 'var(--teal)' : 'var(--navy)' }}>
                    {testReport.score}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Overall Score</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ font: "800 36px 'Manrope'", color: 'var(--blue)' }}>
                    {testReport.accuracy}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Attempt Accuracy</div>
                </div>
              </div>
            </div>

            {/* Metric Counters: Passed, Failed, Skipped */}
            <div className="grid grid-4" style={{ marginTop: 22 }}>
              <div className="card" style={{ padding: 14, background: '#f8fafc' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>TOTAL QUESTIONS</div>
                <div style={{ font: "800 24px 'Manrope'", color: 'var(--ink)', margin: '4px 0 0' }}>{testReport.total_questions}</div>
              </div>

              <div className="card" style={{ padding: 14, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 11, fontWeight: 700 }}>
                  <CheckCircle2 size={14} /> PASSED / CORRECT
                </div>
                <div style={{ font: "800 24px 'Manrope'", color: 'var(--success)', margin: '4px 0 0' }}>{testReport.correct_answers}</div>
              </div>

              <div className="card" style={{ padding: 14, background: '#fef2f2', borderColor: '#fecaca' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--error)', fontSize: 11, fontWeight: 700 }}>
                  <XCircle size={14} /> FAILED / INCORRECT
                </div>
                <div style={{ font: "800 24px 'Manrope'", color: 'var(--error)', margin: '4px 0 0' }}>{testReport.incorrect_answers}</div>
              </div>

              <div className="card" style={{ padding: 14, background: '#fffbeb', borderColor: '#fde68a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--warning)', fontSize: 11, fontWeight: 700 }}>
                  <AlertCircle size={14} /> SKIPPED / UNATTEMPTED
                </div>
                <div style={{ font: "800 24px 'Manrope'", color: 'var(--warning)', margin: '4px 0 0' }}>{testReport.unattempted}</div>
              </div>
            </div>

            {/* REMEDIATION ACTION CALLOUT IF SKIPPED OR FAILED QUESTIONS EXIST */}
            {(testReport.unattempted > 0 || testReport.incorrect_answers > 0) ? (
              <div
                style={{
                  marginTop: 24,
                  padding: 18,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--blue)', fontWeight: 800, fontSize: 15 }}>
                    <RefreshCw size={18} />
                    <span>Complete Work Left Skipped & Failed ({testReport.unattempted + testReport.incorrect_answers} questions remaining)</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155' }}>
                    Turn your {testReport.unattempted} skipped and {testReport.incorrect_answers} failed items into 100% mastery with a targeted remediation session.
                  </p>
                </div>
                <button
                  className="button"
                  style={{ background: 'var(--blue)', padding: '12px 20px', fontSize: 13 }}
                  onClick={handleReattemptIncomplete}
                >
                  <RefreshCw size={14} style={{ marginRight: 8 }} /> Complete Left Skipped & Failed
                </button>
              </div>
            ) : (
              <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Award size={20} />
                <div>
                  <strong>Outstanding! 100% Completed & Passed</strong>
                  <div style={{ fontSize: 12 }}>All questions in this test report have been mastered with zero skipped or failed items.</div>
                </div>
              </div>
            )}
          </div>

          {/* Filterable Question Review Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--line)', paddingBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17 }}>Question Review & Explanations</h2>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted)' }}>Examine correct solutions and learn from skipped or failed questions.</p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'all', label: `All (${testReport.total_questions})` },
                  { key: 'failed', label: `Failed (${testReport.incorrect_answers})`, color: 'red' },
                  { key: 'skipped', label: `Skipped (${testReport.unattempted})`, color: 'orange' },
                  { key: 'passed', label: `Passed (${testReport.correct_answers})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setReportFilter(tab.key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: reportFilter === tab.key ? '1px solid var(--blue)' : '1px solid #e2e8f0',
                      background: reportFilter === tab.key ? '#eff6ff' : '#fff',
                      color: reportFilter === tab.key ? 'var(--blue)' : 'var(--muted)',
                      fontWeight: reportFilter === tab.key ? 700 : 500,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Questions */}
            <div style={{ display: 'grid', gap: 16 }}>
              {filteredReportQuestions.length > 0 ? (
                filteredReportQuestions.map((item) => (
                  <div
                    key={item.question_id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: `1px solid ${item.status === 'passed' ? '#bbf7d0' : item.status === 'failed' ? '#fecaca' : '#fde68a'}`,
                      background: item.status === 'passed' ? '#f0fdf422' : item.status === 'failed' ? '#fef2f222' : '#fffbeb22',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="tag">{item.topic}</span>
                        <span className="tag orange">{item.difficulty}</span>
                      </div>
                      <span
                        className="tag"
                        style={{
                          background: item.status === 'passed' ? '#dcfce7' : item.status === 'failed' ? '#fee2e2' : '#fef3c7',
                          color: item.status === 'passed' ? 'var(--success)' : item.status === 'failed' ? 'var(--error)' : 'var(--warning)',
                          fontWeight: 700,
                        }}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 14, margin: '0 0 10px', color: 'var(--ink)' }}>{item.question}</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 10, fontSize: 12 }}>
                      <div>
                        <span style={{ color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Your Submitted Answer:</span>
                        <strong style={{ color: item.status === 'passed' ? 'var(--success)' : item.status === 'failed' ? 'var(--error)' : 'var(--warning)' }}>
                          {item.user_answer || '(Left Skipped)'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--muted)', display: 'block', marginBottom: 2 }}>Correct Answer:</span>
                        <strong style={{ color: 'var(--navy)' }}>{item.correct_answer}</strong>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#475569', background: '#f8fafc', padding: 10, borderRadius: 6 }}>
                      <strong style={{ color: 'var(--navy)', marginRight: 6 }}>Explanation & Concept:</strong>
                      {item.explanation}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', fontSize: 13 }}>
                  No questions in this filter view.
                </div>
              )}
            </div>

            {/* Back to Assessments Hub */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="button secondary"
                onClick={() => {
                  setTestReport(null)
                  setInProgress(false)
                }}
              >
                ← Back to Assessment Library
              </button>

              {(testReport.unattempted > 0 || testReport.incorrect_answers > 0) && (
                <button
                  className="button"
                  onClick={handleReattemptIncomplete}
                >
                  <RefreshCw size={14} style={{ marginRight: 6 }} /> Complete {testReport.unattempted + testReport.incorrect_answers} Incomplete Questions
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Page>
  )
}
