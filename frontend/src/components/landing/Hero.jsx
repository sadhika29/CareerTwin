import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Play, FileText, Target, Map, Briefcase, MessageSquare, Users, TrendingUp, Sparkles } from 'lucide-react'
import CareerTwinBackground from './CareerTwinBackground'

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const capabilities = [
    { icon: FileText, text: 'Resume Analysis' },
    { icon: Target, text: 'Skill Gap Detection' },
    { icon: Map, text: 'Personalized Roadmap' },
    { icon: Briefcase, text: 'Job Matching' },
    { icon: MessageSquare, text: 'AI Mock Interviews' }
  ]

  const aiNodes = [
    { title: 'Resume Score', value: '86%', x: '35%', y: '15%', cx: 350, cy: 75, path: 'M 350 75 C 400 75, 450 150, 500 250', color: 'text-[#A855F7]', hex: '#A855F7', border: 'border-[#A855F7]/30', delay: 0.8, particleDuration: 3.5 },
    { title: 'Job Match', value: '92%', x: '85%', y: '35%', cx: 850, cy: 175, path: 'M 850 175 C 750 175, 600 200, 500 250', color: 'text-[#22D3EE]', hex: '#22D3EE', border: 'border-[#22D3EE]/30', delay: 1.0, particleDuration: 4 },
    { title: 'Interview Readiness', value: '78%', x: '75%', y: '75%', cx: 750, cy: 375, path: 'M 750 375 C 650 375, 600 300, 500 250', color: 'text-[#EC4899]', hex: '#EC4899', border: 'border-[#EC4899]/30', delay: 1.2, particleDuration: 3.8 },
    { title: 'Career Readiness', value: '81%', x: '25%', y: '80%', cx: 250, cy: 400, path: 'M 250 400 C 350 400, 400 300, 500 250', color: 'text-[#3B82F6]', hex: '#3B82F6', border: 'border-[#3B82F6]/30', delay: 1.4, particleDuration: 4.5 },
    { title: 'Skill Readiness', value: '72%', x: '10%', y: '45%', cx: 100, cy: 225, path: 'M 100 225 C 200 225, 300 250, 500 250', color: 'text-[#A855F7]', hex: '#A855F7', border: 'border-[#A855F7]/30', delay: 1.6, particleDuration: 5 }
  ]

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 overflow-hidden bg-[#050509]" id="home">

      {/* ================================================== */}
      {/* SHARED ADVANCED BACKGROUND SYSTEM */}
      {/* ================================================== */}
      <CareerTwinBackground showWaves={false} />
      {/* ================================================== */}

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

          {/* Left Content */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-300 mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            >
              <Sparkles size={14} className="text-pink-500" /> AI-POWERED CAREER ASSISTANT
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl tracking-tight mb-6 leading-[1.1]"
            >
              <span className="block text-white font-['Playfair_Display',_serif] font-medium mb-1 lg:mb-2">
                Your Personal
              </span>
              <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#EC4899] font-['Plus_Jakarta_Sans',_sans-serif]">
                Career Twin
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg text-[#A1A1AA] mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-['Inter',_sans-serif]"
            >
              Understand your skills, discover opportunities, and build a personalized career path with your AI career companion.
            </motion.p>

            {/* Capability Items */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
              {capabilities.map((cap, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 bg-[#0D0B18]/60 border border-white/[0.05] rounded-full px-4 py-2 backdrop-blur-sm transition-all hover:border-[#22D3EE]/30 hover:-translate-y-[2px] hover:shadow-[0_0_15px_rgba(34,211,238,0.15)] group"
                >
                  <cap.icon size={14} className="text-[#38BDF8] transition-colors group-hover:text-[#22D3EE]" />
                  {cap.text}
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:from-[#9333EA] hover:to-[#DB2777] text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2 hover:-translate-y-[2px]"
              >
                Build My Career Twin <span>→</span>
              </Link>

              <button className="w-full sm:w-auto px-8 py-4 rounded-full font-medium border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-[#A855F7]/50 hover:text-white transition-all text-gray-300 flex items-center justify-center gap-2 group hover:-translate-y-[2px]">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#A855F7]/20 group-hover:text-[#A855F7] transition-colors">
                  <Play size={14} className="ml-0.5 text-white" fill="currentColor" />
                </span>
                Watch Demo
              </button>
            </motion.div>
          </div>

          {/* Right Content - Minimal AI Visualization */}
          <div className="relative w-full h-[500px] mt-10 lg:mt-0 hidden sm:block">

            {/* Ambient Background Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <motion.div animate={{ opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[30%] left-[20%] w-64 h-64 bg-[#A855F7]/10 rounded-full blur-[100px]" />
              <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-[20%] right-[20%] w-64 h-64 bg-[#22D3EE]/10 rounded-full blur-[100px]" />
            </div>

            {/* SVG Connections Layer */}
            <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible">
              <defs>
                {aiNodes.map((node, i) => (
                  <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor={node.hex} />
                  </linearGradient>
                ))}
                <filter id="glow-ambient-sm" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {aiNodes.map((node, i) => (
                <g key={`connection-${i}`}>
                  {/* Subtle connection line */}
                  <motion.path
                    d={node.path}
                    stroke={`url(#grad-${i})`}
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    fill="none"
                    filter="url(#glow-ambient-sm)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 0.5 + i * 0.1 }}
                  />
                  {/* Traveling Particle */}
                  <motion.circle
                    r="2.5"
                    fill="#FFFFFF"
                    filter="url(#glow-ambient-sm)"
                  >
                    <animateMotion
                      dur={`${node.particleDuration}s`}
                      repeatCount="indefinite"
                      path={node.path}
                    />
                  </motion.circle>
                </g>
              ))}
            </svg>

            {/* Central AI Core */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative flex items-center justify-center w-40 h-40"
              >
                {/* Concentric Rings */}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-[#A855F7]/20 border-dashed" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 rounded-full border border-[#22D3EE]/10" />
                
                {/* Core Panel */}
                <motion.div
                  animate={{ boxShadow: ["0 0 20px rgba(168,85,247,0.1)", "0 0 50px rgba(168,85,247,0.25)", "0 0 20px rgba(168,85,247,0.1)"] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-[#050509] border border-white/10 z-10"
                >
                  <span className="text-white mb-0.5">
                    <Sparkles size={16} className="text-[#A855F7]" />
                  </span>
                  <span className="text-[12px] font-bold text-white leading-tight text-center tracking-wide font-['Plus_Jakarta_Sans',_sans-serif]">
                    CareerTwin
                  </span>
                  <span className="text-[9px] text-[#A1A1AA] tracking-widest mt-0.5">AI</span>
                </motion.div>
              </motion.div>
            </div>

            {/* Floating Nodes */}
            {aiNodes.map((node, idx) => (
              <div
                key={idx}
                className="absolute z-20"
                style={{ top: node.y, left: node.x, transform: 'translate(-50%, -50%)' }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: node.delay, type: "spring" }}
                >
                  <motion.div
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ duration: 4 + (idx * 0.5), repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }}
                    className="flex flex-col items-center justify-center px-4 py-2.5 rounded-xl bg-[#0B0B12]/80 backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[110px] transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-2xl group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="text-2xl font-bold text-white mb-0.5 font-['Plus_Jakarta_Sans',_sans-serif] relative z-10">{node.value}</span>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider text-center relative z-10 ${node.color}`}>{node.title}</span>
                  </motion.div>
                </motion.div>
              </div>
            ))}

          </div>
        </div>

        {/* Bottom Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-24 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#A855F7]/10 text-[#A855F7] mb-2">
              <Users size={20} />
            </div>
            <h4 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans',_sans-serif]">10K+</h4>
            <p className="text-sm text-[#A1A1AA]">Students Empowered</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 sm:border-l sm:border-white/10">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#34D399]/10 text-[#34D399] mb-2">
              <TrendingUp size={20} />
            </div>
            <h4 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans',_sans-serif]">95%</h4>
            <p className="text-sm text-[#A1A1AA]">Career Readiness Improvement</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-1 sm:border-l sm:border-white/10">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] mb-2">
              <Briefcase size={20} />
            </div>
            <h4 className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans',_sans-serif]">500+</h4>
            <p className="text-sm text-[#A1A1AA]">Curated Job Opportunities</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
