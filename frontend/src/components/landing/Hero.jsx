import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Play, FileText, Target, Map, Briefcase, MessageSquare, Users, TrendingUp, CheckCircle } from 'lucide-react'

export default function Hero() {
  const capabilities = [
    { icon: FileText, text: 'Resume Analysis' },
    { icon: Target, text: 'Skill Gap Detection' },
    { icon: Map, text: 'Personalized Roadmap' },
    { icon: Briefcase, text: 'Job Matching' },
    { icon: MessageSquare, text: 'AI Mock Interviews' }
  ]

  /* Pre-compute sparkle positions once so Math.random is not called during render */
  const sparkles = useMemo(() => Array.from({ length: 14 }, () => ({
    width: Math.random() * 4 + 2,
    top: Math.random() * 100,
    left: Math.random() * 100,
    opacity: Math.random() * 0.4 + 0.2,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 3,
  })), [])

  return (
    <section className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20 overflow-hidden" id="home">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft gradient orbs */}
        <div className="absolute top-[8%] left-[10%] w-[420px] h-[420px] bg-[#ED96D7]/15 rounded-full blur-[130px]" />
        <div className="absolute top-[20%] right-[10%] w-[480px] h-[480px] bg-[#C4A4DA]/20 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[25%] w-[380px] h-[380px] bg-[#7F5D99]/10 rounded-full blur-[110px]" />

        {/* Subtle decorative curves near edges */}
        <div className="hidden lg:block absolute -left-32 top-1/4 w-80 h-80 rounded-full border border-[#C4A4DA]/25 border-dashed" />
        <div className="hidden lg:block absolute -right-32 top-1/3 w-96 h-96 rounded-full border border-[#ED96D7]/20 border-dashed" />

        {/* Sparkle particles */}
        {sparkles.map((s, i) => (
          <motion.div
            key={`sparkle-${i}`}
            animate={{ y: [0, -22, 0], opacity: [s.opacity * 0.4, s.opacity, s.opacity * 0.4] }}
            transition={{ duration: s.duration, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
            className="absolute rounded-full bg-[#ED96D7]"
            style={{ width: s.width, height: s.width, top: `${s.top}%`, left: `${s.left}%` }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* 1. AI Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-white/70 border border-[#C4A4DA]/40 text-xs sm:text-sm font-semibold text-[#7F5D99] backdrop-blur-sm shadow-[0_2px_12px_rgba(76,35,101,0.06)] mb-6 sm:mb-8"
        >
          <span className="text-[#ED96D7] text-sm">✦</span>
          <span>AI-POWERED CAREER ASSISTANT</span>
        </motion.div>

        {/* 2. Main Heading: Two-line prominent serif */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-['Playfair_Display',_serif] font-bold tracking-tight mb-6 leading-[1.08]"
        >
          <span className="block text-[#4C2365]">
            Your Personal
          </span>
          <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-[#7F5D99] via-[#A864B8] to-[#ED96D7] mt-1 sm:mt-2">
            Career Twin
          </span>
        </motion.h1>

        {/* 3. Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-[#5F3A7A]/85 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 font-['Inter',_sans-serif]"
        >
          Understand your skills, discover opportunities, and build a personalized career path with your AI career companion.
        </motion.p>

        {/* 4. Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-10 sm:mb-12"
        >
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full font-semibold bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white transition-all duration-200 shadow-[0_6px_22px_rgba(76,35,101,0.28)] hover:shadow-[0_8px_30px_rgba(76,35,101,0.4)] flex items-center justify-center gap-2 hover:-translate-y-0.5 text-base"
          >
            Get Started Free <span>→</span>
          </Link>

          <button
            onClick={() => {
              const el = document.getElementById('features')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full font-semibold border-2 border-[#4C2365] bg-white/60 hover:bg-[#4C2365]/10 backdrop-blur-sm transition-all duration-200 text-[#4C2365] flex items-center justify-center gap-2.5 hover:-translate-y-0.5 text-base"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#4C2365]/10 text-[#4C2365]">
              <Play size={12} fill="currentColor" className="ml-0.5" />
            </span>
            Watch Demo
          </button>
        </motion.div>

        {/* 5. Feature Pills: Single row on desktop, natural wrapping on smaller screens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 max-w-4xl mx-auto mb-10 sm:mb-12"
        >
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4C2365] bg-white/75 border border-[#C4A4DA]/40 rounded-full px-4 py-2 sm:px-4.5 sm:py-2.5 backdrop-blur-sm shadow-[0_2px_8px_rgba(76,35,101,0.05)] transition-all duration-200 hover:shadow-[0_4px_14px_rgba(76,35,101,0.12)] hover:border-[#7F5D99]/60 hover:-translate-y-0.5"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#C4A4DA]/25 text-[#7F5D99]">
                <cap.icon size={13} />
              </span>
              <span>{cap.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
