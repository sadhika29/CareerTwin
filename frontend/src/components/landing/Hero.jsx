import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Play, GraduationCap, BarChart2, Briefcase } from 'lucide-react'
import AIMascot from '../AIMascot'

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" id="home">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-300 mb-8"
            >
              <span className="text-pink-500">✦</span> AI-POWERED CAREER ASSISTANT
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.1] font-['Fredoka',_sans-serif]"
            >
              Your Personal <br className="hidden lg:block" />
              <span className="relative inline-block text-[#c471ed]">
                Career Twin
                <svg className="absolute -bottom-4 left-0 w-full" viewBox="0 0 200 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 15C50 4 150 4 198 15" stroke="#f472b6" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Understand your skills, discover opportunities, and build a personalized career path with your AI career companion.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12"
            >
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold bg-gradient-to-r from-[#b53cff] to-[#ff4dc4] hover:opacity-90 text-white transition-all shadow-[0_0_20px_rgba(181,60,255,0.4)] hover:shadow-[0_0_30px_rgba(181,60,255,0.6)] flex items-center justify-center gap-2"
              >
                Build My Career Twin <span>→</span>
              </Link>

              <button className="w-full sm:w-auto px-8 py-4 rounded-full font-medium border border-white/10 hover:bg-white/5 transition-all text-white flex items-center justify-center gap-2 group">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                  <Play size={14} className="ml-0.5 text-white" fill="currentColor" />
                </span>
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-6 lg:gap-10"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#d494ff] shadow-[0_0_15px_rgba(212,148,255,0.15)]">
                  <GraduationCap size={24} />
                </div>
                <div className="text-sm font-medium text-gray-300 text-left leading-tight">
                  Personalized<br />Guidance
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#d494ff] shadow-[0_0_15px_rgba(212,148,255,0.15)]">
                  <BarChart2 size={24} />
                </div>
                <div className="text-sm font-medium text-gray-300 text-left leading-tight">
                  Skill Gap<br />Analysis
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-[#ff719a] shadow-[0_0_15px_rgba(255,113,154,0.15)]">
                  <Briefcase size={24} />
                </div>
                <div className="text-sm font-medium text-gray-300 text-left leading-tight">
                  Curated<br />Opportunities
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Mascot */}
          <div className="flex-1 relative w-full flex justify-center lg:justify-end">
            <AIMascot />
          </div>

        </div>
      </div>
    </section>
  )
}
