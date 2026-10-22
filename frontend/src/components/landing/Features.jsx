import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  BarChart2, 
  Map, 
  Briefcase, 
  Code, 
  MessageSquare, 
  Play, 
  ArrowRight, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  ChevronRight,
  ChevronLeft,
  ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Features() {
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [demoFeature, setDemoFeature] = useState(null)
  const [demoStep, setDemoStep] = useState(0)

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedFeature(null)
        setDemoFeature(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const features = [
    {
      id: 'resume-analysis',
      title: 'Resume Analysis',
      icon: FileText,
      description: 'Analyze your resume, identify strengths, and receive actionable suggestions to improve it.',
      badge: 'Smart ATS Scanner',
      previewData: {
        score: 88,
        role: 'Full Stack Software Engineer',
        strengths: ['React & Next.js ecosystem', 'Node.js REST APIs & GraphQL', 'SQL schema optimization', 'Clean component hierarchy'],
        missingSkills: ['Docker containerization', 'CI/CD Pipelines (GitHub Actions)', 'AWS ECS/Cloud Architecture'],
        suggestions: [
          'Quantify achievements with measurable metrics (e.g., "improved load time by 34%").',
          'Add targeted keywords for cloud orchestration to improve ATS match rate.',
          'Consolidate work experience into high-impact bullet points following STAR format.'
        ]
      },
      demoSteps: [
        {
          title: '1. Upload Resume PDF',
          description: 'Upload any standard resume in PDF or DOCX format. Our parser extracts text, skills, education, and role history.',
          preview: '📄 Resume_Alex_Rivera_2026.pdf (Uploaded & Parsed in 1.2s)'
        },
        {
          title: '2. Deep AI Audit & Scoring',
          description: 'CareerTwin checks 45+ ATS factors including keyword density, formatting hygiene, and role relevancy.',
          preview: '⚙️ Analyzing ATS Compatibility... Score computed: 88/100'
        },
        {
          title: '3. Instant Actionable Roadmap',
          description: 'Receive line-by-line recommendations and missing keyword suggestions tailored to your target roles.',
          preview: '✨ 3 Critical improvements identified + 12 suggested resume keywords'
        }
      ]
    },
    {
      id: 'skill-gap-analysis',
      title: 'Skill Gap Analysis',
      icon: BarChart2,
      description: 'Discover missing skills by comparing your current abilities with your target career requirements.',
      badge: 'Competency Mapping',
      previewData: {
        targetRole: 'AI / Machine Learning Engineer',
        readiness: 76,
        currentSkills: ['Python 3.12', 'Pandas & NumPy', 'Scikit-Learn', 'SQL & Vector Queries', 'Git & Linux'],
        missingSkills: ['PyTorch / TensorFlow Deep Learning', 'LangChain & Vector Databases (Pinecone/Milvus)', 'Model Deployment & ONNX Runtime', 'PEFT & LoRA Fine-Tuning'],
        insight: 'You are 76% aligned with Mid-Level AI roles. Mastering Vector Embeddings and PyTorch model fine-tuning will bring you to 95%+ readiness within 6 weeks.'
      },
      demoSteps: [
        {
          title: '1. Select Target Dream Role',
          description: 'Pick from 200+ curated tech positions or paste a specific job description URL.',
          preview: '🎯 Target Selected: Senior AI / ML Engineer'
        },
        {
          title: '2. Differential Gap Engine',
          description: 'CareerTwin cross-analyzes your proven skills against live industry requirements in 2026.',
          preview: '📊 Analyzing 4,500+ active job postings for AI Engineer roles'
        },
        {
          title: '3. Prioritized Skill Matrix',
          description: 'See which missing skills have the highest hiring ROI so you focus only on what matters.',
          preview: '🚀 High ROI Gaps: PyTorch (#1 priority), Vector DBs (#2 priority)'
        }
      ]
    },
    {
      id: 'personalized-roadmap',
      title: 'Personalized Roadmap',
      icon: Map,
      description: 'Get a structured learning plan with recommended skills, milestones, and practical next steps.',
      badge: 'Dynamic Curriculum',
      previewData: {
        timeline: '12-Week Fast-Track to Cloud Architect',
        milestones: [
          { phase: 'Weeks 1-3', title: 'Modern Microservices & API Design', focus: 'Event-driven architecture with Kafka & RabbitMQ' },
          { phase: 'Weeks 4-6', title: 'Docker, Kubernetes & Containerization', focus: 'Pods, ingress controllers, Helm charts & cluster scaling' },
          { phase: 'Weeks 7-9', title: 'Production Cloud Deployment (AWS/GCP)', focus: 'Terraform IaC, serverless lambdas & secure VPCs' },
          { phase: 'Weeks 10-12', title: 'System Design Mastery & Capstone', focus: 'Scalable distributed systems simulation with interview prep' }
        ]
      },
      demoSteps: [
        {
          title: '1. Define Career Goal & Weekly Hours',
          description: 'Set your commitment (e.g., 8 hours/week) and current proficiency level.',
          preview: '⏱️ Target: Cloud Architect | Commitment: 10 hrs/week'
        },
        {
          title: '2. AI Generates Step-by-Step Milestones',
          description: 'Curates hands-on project milestones with recommended documentation, videos, and exercises.',
          preview: '🗺️ Generated 4-phase structured pathway with week-by-week checkpoints'
        },
        {
          title: '3. Real-Time Adaptive Re-balancing',
          description: 'As you complete modules or take assessments, your roadmap automatically updates its pacing.',
          preview: '📈 Progress saved: Week 1 milestone completed with 94% quiz score'
        }
      ]
    },
    {
      id: 'job-matching',
      title: 'Job Matching',
      icon: Briefcase,
      description: 'Discover suitable job opportunities based on your skills, interests, and career goals.',
      badge: 'Precision Fit',
      previewData: {
        matches: [
          {
            company: 'Stripe',
            role: 'Staff Platform Engineer',
            matchScore: '94%',
            location: 'Remote (US/Global)',
            salary: '$180,000 - $220,000',
            highlights: ['React', 'TypeScript', 'Distributed Systems']
          },
          {
            company: 'Canva',
            role: 'Senior Frontend Developer',
            matchScore: '89%',
            location: 'Remote / Hybrid',
            salary: '$155,000 - $185,000',
            highlights: ['WebGL / Canvas', 'Modern CSS', 'Performance Optimization']
          },
          {
            company: 'Figma',
            role: 'Full Stack Product Engineer',
            matchScore: '84%',
            location: 'San Francisco, CA (Hybrid)',
            salary: '$165,000 - $195,000',
            highlights: ['Node.js', 'PostgreSQL', 'GraphQL APIs']
          }
        ]
      },
      demoSteps: [
        {
          title: '1. Autonomous Profile Indexing',
          description: 'Your CareerTwin profile compiles your verified skills, projects, and target compensation.',
          preview: '👤 Profile indexed: Full Stack + Distributed Systems'
        },
        {
          title: '2. Semantic Job Opportunity Matching',
          description: 'Instead of raw keyword matching, CareerTwin uses semantic embedding to match actual skill depth.',
          preview: '🔍 Scanning 15,000+ verified tech roles across top employers'
        },
        {
          title: '3. 1-Click Tailored Application Package',
          description: 'Generate customized resume versions and cover letters tailored specifically to each position.',
          preview: '✨ Tailored match ready: 94% compatibility with Stripe Staff Engineer'
        }
      ]
    },
    {
      id: 'dsa-practice',
      title: 'DSA Practice',
      icon: Code,
      description: 'Practice coding problems, improve problem-solving skills, and track your progress.',
      badge: 'Algorithmic Mastery',
      previewData: {
        problem: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        topic: 'Sliding Window / Hash Map',
        acceptanceRate: '34.8%',
        snippet: `def lengthOfLongestSubstring(s: str) -> int:
    char_map = {}
    left = max_len = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
        complexity: 'Time: O(N) | Space: O(min(N, M))',
        stats: '142 / 250 Curated Problems Solved (57% completion)'
      },
      demoSteps: [
        {
          title: '1. Skill-Level Problem Recommendation',
          description: 'CareerTwin assesses your weak spots (e.g., Dynamic Programming or Graphs) and suggests optimal problems.',
          preview: '💡 Recommended today: Sliding Window pattern (Medium difficulty)'
        },
        {
          title: '2. Integrated Code Playground & Testing',
          description: 'Write solutions in Python, JavaScript, Java, or C++ with automated test cases and edge-case validation.',
          preview: '⚡ Running 48 test cases... All test cases passed in 42ms'
        },
        {
          title: '3. Step-by-Step AI Complexity Breakdown',
          description: 'Get deep intuition breakdowns and optimal time/space complexity comparisons.',
          preview: '🧠 AI Insight: Optimal O(N) sliding window solution achieved!'
        }
      ]
    },
    {
      id: 'ai-mock-interviews',
      title: 'AI Mock Interviews',
      icon: MessageSquare,
      description: 'Practice realistic interviews, answer questions, and receive feedback to improve your performance.',
      badge: 'Interactive Simulator',
      previewData: {
        interviewType: 'System Design & Architectural Trade-offs',
        sampleQuestion: '“How would you design a distributed, low-latency rate limiter capable of handling 500,000 requests per second across multi-region clusters?”',
        scorecard: {
          overall: 9.1,
          technicalDepth: 9.3,
          communication: 8.9,
          problemSolving: 9.2
        },
        feedback: 'Excellent breakdown of the Token Bucket algorithm and Redis in-memory counters. To reach top-percentile FAANG standards, explain how you handle clock drift with NTP and split-brain scenarios during network partitions.'
      },
      demoSteps: [
        {
          title: '1. Choose Role & Interview Round',
          description: 'Select Behavioral, Technical Coding, or System Design rounds customized for your target company tier.',
          preview: '🎙️ Selected Round: Senior System Design (FAANG Level)'
        },
        {
          title: '2. Real-Time Conversational AI Voice/Text',
          description: 'The AI interviewer asks realistic follow-up questions when you omit architectural edge cases.',
          preview: '🤖 Interviewer: "What happens if the Redis primary replica crashes?"'
        },
        {
          title: '3. Comprehensive Performance Scorecard',
          description: 'Receive immediate metrics on technical accuracy, structure, delivery pacing, and sample model answers.',
          preview: '📊 Comprehensive Scorecard: 9.1/10 (Ready for Tech Screen)'
        }
      ]
    }
  ]

  const handleOpenExplore = (feature) => {
    setSelectedFeature(feature)
  }

  const handleOpenDemo = (feature) => {
    setDemoFeature(feature)
    setDemoStep(0)
  }

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden" id="features">
      {/* Background soft ambient glowing orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[5%] w-[420px] h-[420px] bg-[#ED96D7]/12 rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[480px] h-[480px] bg-[#C4A4DA]/16 rounded-full blur-[140px]" />
        <div className="absolute top-[60%] left-[40%] w-[350px] h-[350px] bg-[#7F5D99]/8 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1. Features Badge at Top-Left directly above the grid */}
        <div className="flex justify-start mb-8 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/75 border border-[#4C2365]/35 text-xs font-semibold tracking-wider text-[#7F5D99] backdrop-blur-md shadow-[0_2px_10px_rgba(76,35,101,0.06)]"
          >
            <span className="text-[#ED96D7]">✦</span> FEATURES
          </motion.div>
        </div>

        {/* 2. Full-width 3-column by 2-row Grid of Feature Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white/85 backdrop-blur-md border border-[#4C2365]/40 hover:border-[#4C2365] transition-all duration-300 shadow-[0_4px_20px_rgba(76,35,101,0.06)] hover:shadow-[0_8px_30px_rgba(76,35,101,0.14)] hover:-translate-y-1 group h-full"
              >
                {/* Card Top: Icon & Heading */}
                <div>
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#C4A4DA]/35 to-[#ED96D7]/20 border border-[#C4A4DA]/40 flex items-center justify-center text-[#4C2365] group-hover:scale-105 transition-transform duration-200 shrink-0">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#4C2365] font-['Plus_Jakarta_Sans',_sans-serif] leading-tight">
                      {feature.title}
                    </h3>
                  </div>

                  {/* Dark-purple thin divider line */}
                  <div className="h-px w-full bg-[#4C2365]/25 my-3.5" />

                  {/* Dark, readable body text */}
                  <p className="text-[#3B1B50] text-sm leading-relaxed mb-6 font-['Inter',_sans-serif]">
                    {feature.description}
                  </p>
                </div>

                {/* Card Bottom: Two Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#4C2365]/10 mt-auto">
                  {/* Explore Button */}
                  <button
                    onClick={() => handleOpenExplore(feature)}
                    className="h-10 px-3.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white shadow-[0_2px_8px_rgba(76,35,101,0.2)] hover:shadow-[0_4px_14px_rgba(76,35,101,0.35)] hover:-translate-y-0.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Explore</span>
                    <ArrowRight size={14} />
                  </button>

                  {/* Watch Demo Button */}
                  <button
                    onClick={() => handleOpenDemo(feature)}
                    className="h-10 px-3.5 rounded-full text-xs sm:text-sm font-semibold border border-[#4C2365] text-[#4C2365] bg-white/70 hover:bg-[#4C2365]/10 hover:-translate-y-0.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play size={12} fill="currentColor" className="ml-0.5" />
                    <span>Watch Demo</span>
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. EXPLORE MODAL — Functional Interactive Feature Preview */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeature(null)}
              className="fixed inset-0 bg-[#251035]/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl bg-[#FCFAFD] border-2 border-[#4C2365]/35 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(76,35,101,0.25)] z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#4C2365]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4C2365] to-[#7F5D99] text-white flex items-center justify-center shadow-md shrink-0">
                    <selectedFeature.icon size={22} />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ED96D7]/20 text-[#4C2365] text-[11px] font-bold mb-1">
                      <span>✦</span> {selectedFeature.badge} • Public Preview
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#4C2365] font-['Plus_Jakarta_Sans',_sans-serif]">
                      {selectedFeature.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFeature(null)}
                  className="w-9 h-9 rounded-full bg-white border border-[#4C2365]/30 flex items-center justify-center text-[#4C2365] hover:bg-[#4C2365] hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Purpose & Description */}
              <p className="text-[#3B1B50] text-sm sm:text-[15px] leading-relaxed my-4 font-['Inter',_sans-serif]">
                {selectedFeature.description}
              </p>

              {/* Feature-Specific Interactive Sample Demonstration */}
              <div className="my-5 rounded-2xl bg-white border border-[#4C2365]/25 p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#4C2365]/15">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7F5D99] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#ED96D7]" /> Interactive Live Preview Data
                  </span>
                  <span className="text-[11px] font-semibold text-[#4C2365] bg-[#C4A4DA]/25 px-2.5 py-1 rounded-full">
                    No Sign-in Required
                  </span>
                </div>

                {/* 1. Resume Analysis Preview */}
                {selectedFeature.id === 'resume-analysis' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#F9F5FC] p-3.5 rounded-xl border border-[#C4A4DA]/40">
                      <div>
                        <div className="text-xs text-[#7F5D99] font-medium">Evaluated Role</div>
                        <div className="text-sm font-bold text-[#4C2365]">{selectedFeature.previewData.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#7F5D99] font-medium">ATS Match Score</div>
                        <div className="text-xl font-extrabold text-[#4C2365]">{selectedFeature.previewData.score}/100</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#4C2365] mb-2 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-600" /> Detected Strengths:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedFeature.previewData.strengths.map((str, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                            {str}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#4C2365] mb-2 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-amber-600" /> Missing / Recommended Skills:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedFeature.previewData.missingSkills.map((sk, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                            + {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#4C2365]/10">
                      <div className="text-xs font-bold text-[#4C2365] mb-1.5">Actionable Suggestions:</div>
                      <ul className="text-xs text-[#3B1B50] space-y-1 list-disc pl-4">
                        {selectedFeature.previewData.suggestions.map((sug, i) => (
                          <li key={i}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* 2. Skill Gap Analysis Preview */}
                {selectedFeature.id === 'skill-gap-analysis' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-[#F9F5FC] p-3.5 rounded-xl border border-[#C4A4DA]/40">
                      <div>
                        <div className="text-xs text-[#7F5D99] font-medium">Target Role</div>
                        <div className="text-sm font-bold text-[#4C2365]">{selectedFeature.previewData.targetRole}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#7F5D99] font-medium">Role Readiness</div>
                        <div className="text-xl font-extrabold text-[#4C2365]">{selectedFeature.previewData.readiness}%</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-600" /> Verified Current Skills ({selectedFeature.previewData.currentSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFeature.previewData.currentSkills.map((c, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#4C2365] mb-2 flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-rose-600" /> High-Impact Skill Gaps to Close:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFeature.previewData.missingSkills.map((m, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#4C2365] bg-[#C4A4DA]/20 p-3 rounded-xl leading-relaxed">
                      💡 <strong>CareerTwin Strategy:</strong> {selectedFeature.previewData.insight}
                    </p>
                  </div>
                )}

                {/* 3. Personalized Roadmap Preview */}
                {selectedFeature.id === 'personalized-roadmap' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#4C2365] bg-[#F9F5FC] p-3 rounded-xl border border-[#C4A4DA]/30 flex items-center justify-between">
                      <span>Curriculum: {selectedFeature.previewData.timeline}</span>
                      <span className="text-[#7F5D99]">4 Milestones</span>
                    </div>

                    <div className="space-y-2.5">
                      {selectedFeature.previewData.milestones.map((m, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white border border-[#4C2365]/20 flex items-start gap-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white shrink-0 mt-0.5">
                            {m.phase}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#4C2365]">{m.title}</div>
                            <div className="text-[11px] text-[#3B1B50] mt-0.5">{m.focus}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Job Matching Preview */}
                {selectedFeature.id === 'job-matching' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#4C2365] mb-1">
                      Live Matched Roles (Sample Demonstrative Data):
                    </div>
                    <div className="space-y-2.5">
                      {selectedFeature.previewData.matches.map((job, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#F9F5FC] border border-[#C4A4DA]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#4C2365]">{job.role}</span>
                              <span className="text-xs text-[#7F5D99]">@ {job.company}</span>
                            </div>
                            <div className="text-xs text-[#3B1B50]/80 mt-1 flex items-center gap-3">
                              <span>{job.location}</span>
                              <span>•</span>
                              <span className="font-semibold text-emerald-700">{job.salary}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {job.highlights.map((h, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white border border-[#C4A4DA]/50 text-[#4C2365]">
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="sm:text-right shrink-0">
                            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {job.matchScore} Fit
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. DSA Practice Preview */}
                {selectedFeature.id === 'dsa-practice' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-[#F9F5FC] p-3 rounded-xl border border-[#C4A4DA]/30">
                      <div>
                        <div className="text-sm font-bold text-[#4C2365]">{selectedFeature.previewData.problem}</div>
                        <div className="text-xs text-[#7F5D99] mt-0.5">Topic: {selectedFeature.previewData.topic}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {selectedFeature.previewData.difficulty}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#1e1e2e] p-3.5 text-xs font-mono text-purple-100 overflow-x-auto">
                      <pre>{selectedFeature.previewData.snippet}</pre>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#4C2365] font-medium pt-1">
                      <span>Complexity: {selectedFeature.previewData.complexity}</span>
                      <span className="text-emerald-700 font-semibold">{selectedFeature.previewData.stats}</span>
                    </div>
                  </div>
                )}

                {/* 6. AI Mock Interviews Preview */}
                {selectedFeature.id === 'ai-mock-interviews' && (
                  <div className="space-y-3">
                    <div className="bg-[#F9F5FC] p-3.5 rounded-xl border border-[#C4A4DA]/40">
                      <div className="text-xs font-bold text-[#7F5D99] mb-1">SAMPLE INTERVIEW QUESTION:</div>
                      <div className="text-xs sm:text-sm font-semibold text-[#4C2365] italic">
                        {selectedFeature.previewData.sampleQuestion}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-white border border-[#4C2365]/20">
                        <div className="text-[11px] text-[#7F5D99]">Overall</div>
                        <div className="text-base font-bold text-[#4C2365]">{selectedFeature.previewData.scorecard.overall}/10</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#4C2365]/20">
                        <div className="text-[11px] text-[#7F5D99]">Tech Depth</div>
                        <div className="text-base font-bold text-[#4C2365]">{selectedFeature.previewData.scorecard.technicalDepth}/10</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#4C2365]/20">
                        <div className="text-[11px] text-[#7F5D99]">Clarity</div>
                        <div className="text-base font-bold text-[#4C2365]">{selectedFeature.previewData.scorecard.communication}/10</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#4C2365]/20">
                        <div className="text-[11px] text-[#7F5D99]">Problem Solving</div>
                        <div className="text-base font-bold text-[#4C2365]">{selectedFeature.previewData.scorecard.problemSolving}/10</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                      <strong>AI Evaluator Note:</strong> {selectedFeature.previewData.feedback}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#4C2365]/20">
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold border border-[#4C2365] text-[#4C2365] hover:bg-[#4C2365]/10 transition-colors cursor-pointer"
                >
                  Close Preview
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const feat = selectedFeature
                      setSelectedFeature(null)
                      handleOpenDemo(feat)
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold border-2 border-[#4C2365] text-[#4C2365] bg-white hover:bg-[#4C2365]/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play size={12} fill="currentColor" /> Watch Walkthrough Demo
                  </button>
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-1.5 transition-all"
                  >
                    Get Started Free <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 7. WATCH DEMO MODAL — Interactive Step Walkthrough Demo  */}
      {/* ======================================================== */}
      <AnimatePresence>
        {demoFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDemoFeature(null)}
              className="fixed inset-0 bg-[#251035]/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-xl bg-[#FCFAFD] border-2 border-[#4C2365]/35 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(76,35,101,0.25)] z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#4C2365]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4C2365] text-white flex items-center justify-center shadow shrink-0">
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7F5D99]">
                      Interactive Walkthrough
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-[#4C2365] font-['Plus_Jakarta_Sans',_sans-serif]">
                      {demoFeature.title} Demo
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setDemoFeature(null)}
                  className="w-9 h-9 rounded-full bg-white border border-[#4C2365]/30 flex items-center justify-center text-[#4C2365] hover:bg-[#4C2365] hover:text-white transition-colors cursor-pointer"
                  aria-label="Close demo"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress Steps Indicators */}
              <div className="grid grid-cols-3 gap-2 my-5">
                {demoFeature.demoSteps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setDemoStep(idx)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      demoStep === idx
                        ? 'bg-[#4C2365] text-white border-[#4C2365] shadow-sm'
                        : 'bg-white text-[#4C2365] border-[#4C2365]/20 hover:bg-[#C4A4DA]/15'
                    }`}
                  >
                    <div className="font-bold">Step {idx + 1}</div>
                    <div className="truncate text-[10px] opacity-90">{step.title.split('. ')[1] || step.title}</div>
                  </button>
                ))}
              </div>

              {/* Step Content Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#4C2365]/25 shadow-sm my-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7F5D99] mb-1">
                  <span>✦</span> {demoFeature.demoSteps[demoStep].title}
                </div>
                <p className="text-sm text-[#3B1B50] leading-relaxed mb-4">
                  {demoFeature.demoSteps[demoStep].description}
                </p>

                {/* Simulated Screen / Result Console */}
                <div className="rounded-xl bg-[#F9F5FC] border border-[#C4A4DA]/50 p-4 font-mono text-xs text-[#4C2365] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span>{demoFeature.demoSteps[demoStep].preview}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[#4C2365]/20 mt-4">
                <button
                  disabled={demoStep === 0}
                  onClick={() => setDemoStep((s) => Math.max(0, s - 1))}
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-[#4C2365] text-[#4C2365] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#4C2365]/10 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <div className="text-xs font-semibold text-[#7F5D99]">
                  Step {demoStep + 1} of {demoFeature.demoSteps.length}
                </div>

                {demoStep < demoFeature.demoSteps.length - 1 ? (
                  <button
                    onClick={() => setDemoStep((s) => Math.min(demoFeature.demoSteps.length - 1, s + 1))}
                    className="px-5 py-2 rounded-full text-xs font-semibold bg-[#4C2365] text-white hover:bg-[#3B1B50] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    Next Step <ChevronRight size={14} />
                  </button>
                ) : (
                  <Link
                    to="/signup"
                    className="px-5 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white shadow-md hover:shadow-lg flex items-center gap-1 transition-all"
                  >
                    Try Feature Free <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
