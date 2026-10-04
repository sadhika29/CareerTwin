import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Cpu, Search, Map as MapIcon, TrendingUp } from 'lucide-react'
import CareerTwinBackground from './CareerTwinBackground'

const steps = [
  { num: '01', title: 'Create Your Profile', desc: 'Tell us about your skills & goals.', icon: User, offsetDesktop: 0, offsetMobile: 0, color: 'text-purple-400', border: 'border-purple-500/30' },
  { num: '02', title: 'AI Analysis', desc: 'AI understands your profile.', icon: Cpu, offsetDesktop: -30, offsetMobile: 20, color: 'text-pink-400', border: 'border-pink-500/30' },
  { num: '03', title: 'Find Skill Gaps', desc: 'Discover skills you need to improve.', icon: Search, offsetDesktop: 30, offsetMobile: -20, color: 'text-blue-400', border: 'border-blue-500/30' },
  { num: '04', title: 'Get Your Roadmap', desc: 'Get a personalized career plan.', icon: MapIcon, offsetDesktop: -30, offsetMobile: 20, color: 'text-cyan-400', border: 'border-cyan-500/30' },
  { num: '05', title: 'Practice & Grow', desc: 'Practice and track your progress.', icon: TrendingUp, offsetDesktop: 0, offsetMobile: 0, color: 'text-purple-400', border: 'border-purple-500/30' }
]

export default function HowItWorks() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-[#030308]" id="how-it-works">
      
      {/* Shared Unified Background */}
      <CareerTwinBackground />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20 lg:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-[rgba(255,255,255,0.12)] text-[11px] font-semibold tracking-wider text-purple-300 mb-6 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.10)]"
          >
            <span className="text-pink-500">✦</span> HOW IT WORKS
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold mb-6 font-['Playfair_Display',_serif] text-white"
          >
            Build Your Career in 5 Simple Steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#A1A1AA] text-sm lg:text-[15px] font-['Inter',_sans-serif]"
          >
            Tell us about yourself. CareerTwin's intelligence does the rest.
          </motion.p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          
          {/* Desktop Flowing Path (SVG) */}
          <div className="hidden lg:block absolute top-12 left-[4%] right-[4%] h-[120px]">
            <svg className="w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 100">
              <defs>
                <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="33%" stopColor="#EC4899" />
                  <stop offset="66%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              
              {/* Path Glow */}
              <path 
                d="M 0 50 C 125 50, 125 20, 250 20 C 375 20, 375 80, 500 80 C 625 80, 625 20, 750 20 C 875 20, 875 50, 1000 50"
                stroke="url(#path-gradient)" strokeWidth="6" fill="none" opacity="0.15" style={{ filter: "blur(4px)" }}
              />
              
              {/* Solid Path Segment (Animated reveal) */}
              <motion.path 
                d="M 0 50 C 125 50, 125 20, 250 20 C 375 20, 375 80, 500 80 C 625 80, 625 20, 750 20 C 875 20, 875 50, 1000 50"
                stroke="url(#path-gradient)" strokeWidth="1.5" fill="none" opacity="0.4"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
              />

              {/* Traveling Energy Point */}
              <motion.path 
                d="M 0 50 C 125 50, 125 20, 250 20 C 375 20, 375 80, 500 80 C 625 80, 625 20, 750 20 C 875 20, 875 50, 1000 50"
                stroke="url(#path-gradient)" strokeWidth="3" fill="none"
                strokeDasharray="1 1000" strokeLinecap="round"
                initial={{ strokeDashoffset: 1000, opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2.5 }}
                style={{ filter: "drop-shadow(0 0 6px #FFFFFF)" }}
              />
            </svg>
          </div>

          <div className="flex flex-col lg:flex-row justify-between relative gap-16 lg:gap-4 px-4 lg:px-8">

            {/* Mobile Flowing Path (SVG) */}
            <div className="lg:hidden absolute left-12 top-10 bottom-10 w-[60px]">
              <svg className="w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 1000">
                <defs>
                  <linearGradient id="path-gradient-mob" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="33%" stopColor="#EC4899" />
                    <stop offset="66%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <path 
                  d="M 50 0 C 50 125, 70 125, 70 250 C 70 375, 30 375, 30 500 C 30 625, 70 625, 70 750 C 70 875, 50 875, 50 1000"
                  stroke="url(#path-gradient-mob)" strokeWidth="6" fill="none" opacity="0.15" style={{ filter: "blur(4px)" }}
                />
                <motion.path 
                  d="M 50 0 C 50 125, 70 125, 70 250 C 70 375, 30 375, 30 500 C 30 625, 70 625, 70 750 C 70 875, 50 875, 50 1000"
                  stroke="url(#path-gradient-mob)" strokeWidth="1.5" fill="none" opacity="0.4"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
                />
                <motion.path 
                  d="M 50 0 C 50 125, 70 125, 70 250 C 70 375, 30 375, 30 500 C 30 625, 70 625, 70 750 C 70 875, 50 875, 50 1000"
                  stroke="url(#path-gradient-mob)" strokeWidth="3" fill="none"
                  strokeDasharray="1 1000" strokeLinecap="round"
                  initial={{ strokeDashoffset: 1000, opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2.5 }}
                  style={{ filter: "drop-shadow(0 0 6px #FFFFFF)" }}
                />
              </svg>
            </div>

            {steps.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: 0.3 + (index * 0.15) }}
                className="relative flex lg:flex-col items-center lg:text-center gap-6 lg:gap-5 flex-1 z-20"
                style={{ 
                  transform: isMobile ? `translateX(${step.offsetMobile}px)` : `translateY(${step.offsetDesktop}px)` 
                }}
              >
                {/* Step Circle with Icon */}
                <div className={`relative w-16 h-16 shrink-0 rounded-full bg-[rgba(10,8,20,0.65)] backdrop-blur-[14px] border ${step.border} flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] group`}>
                  <div className="absolute -top-4 text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] lg:-top-6 group-hover:text-white transition-colors duration-300">
                    Step {step.num}
                  </div>
                  <step.icon size={22} className={`${step.color} group-hover:scale-110 transition-transform duration-300`} />
                  {/* Subtle Node Glow */}
                  <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-purple-500 to-pink-500 blur-md`} />
                </div>

                {/* Step Content */}
                <div className="flex-1 lg:flex-none">
                  <h3 className="text-[15px] font-bold mb-1.5 text-white font-['Plus_Jakarta_Sans',_sans-serif]">{step.title}</h3>
                  <p className="text-xs text-[#A1A1AA] max-w-[200px] mx-auto leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
