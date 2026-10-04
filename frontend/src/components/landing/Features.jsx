import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { FileText, Map, Briefcase, Code, MessageSquare, ArrowRight, BarChart2, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import CareerTwinBackground from './CareerTwinBackground'
import NetworkConnections from './NetworkConnections'

export default function Features() {
  const [isMobile, setIsMobile] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)

    const handleMouseMove = (e) => {
      if (window.innerWidth < 1024) return
      const { innerWidth, innerHeight } = window
      mouseX.set((e.clientX / innerWidth) * 2 - 1)
      mouseY.set((e.clientY / innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [mouseX, mouseY])

  const hubX = useTransform(springX, [-1, 1], [-4, 4])
  const hubY = useTransform(springY, [-1, 1], [-4, 4])

  const features = [
    {
      id: 1,
      icon: FileText,
      title: 'Resume Analysis',
      description: 'Get instant feedback and improve your resume.',
      color: 'text-[#A855F7]',
      hex: '#A855F7',
      shadowRgba: 'rgba(168,85,247,0.2)',
      shadowAmbient: 'rgba(168,85,247,0.06)',
      x: '50%', y: '12%',
      cx: 300, cy: 72,
      path: "M 300 72 Q 220 180 300 300", // Flows IN to center
      delay: 0.1, floatDuration: 5, particleDuration: 3.8
    },
    {
      id: 2,
      icon: BarChart2,
      title: 'Skill Gap Analysis',
      description: 'Identify the skills you need for your target role.',
      color: 'text-[#22D3EE]',
      hex: '#22D3EE',
      shadowRgba: 'rgba(34,211,238,0.2)',
      shadowAmbient: 'rgba(34,211,238,0.06)',
      x: '12%', y: '32%',
      cx: 72, cy: 192,
      path: "M 72 192 Q 150 280 300 300", // Flows IN
      delay: 0.2, floatDuration: 6, particleDuration: 4.2
    },
    {
      id: 3,
      icon: Briefcase,
      title: 'Job Matching',
      description: 'Discover opportunities that match your profile.',
      color: 'text-[#38BDF8]',
      hex: '#38BDF8',
      shadowRgba: 'rgba(56,189,248,0.2)',
      shadowAmbient: 'rgba(56,189,248,0.06)',
      x: '88%', y: '32%',
      cx: 528, cy: 192,
      path: "M 300 300 Q 450 280 528 192", // Flows OUT
      delay: 0.3, floatDuration: 5.5, particleDuration: 3.5
    },
    {
      id: 4,
      icon: Map,
      title: 'Personalized Roadmap',
      description: 'Get a step-by-step plan for your career goals.',
      color: 'text-[#EC4899]',
      hex: '#EC4899',
      shadowRgba: 'rgba(236,72,153,0.2)',
      shadowAmbient: 'rgba(236,72,153,0.06)',
      x: '12%', y: '68%',
      cx: 72, cy: 408,
      path: "M 72 408 Q 150 320 300 300", // Flows IN
      delay: 0.4, floatDuration: 6.5, particleDuration: 4.5
    },
    {
      id: 5,
      icon: Code,
      title: 'DSA Practice',
      description: 'Practice coding problems based on your preparation level.',
      color: 'text-[#22D3EE]',
      hex: '#22D3EE',
      shadowRgba: 'rgba(34,211,238,0.2)',
      shadowAmbient: 'rgba(34,211,238,0.06)',
      x: '88%', y: '68%',
      cx: 528, cy: 408,
      path: "M 300 300 Q 450 320 528 408", // Flows OUT
      delay: 0.5, floatDuration: 6, particleDuration: 4.0
    },
    {
      id: 6,
      icon: MessageSquare,
      title: 'AI Mock Interviews',
      description: 'Practice interviews and receive instant feedback.',
      color: 'text-[#EC4899]',
      hex: '#EC4899',
      shadowRgba: 'rgba(236,72,153,0.2)',
      shadowAmbient: 'rgba(236,72,153,0.06)',
      x: '50%', y: '88%',
      cx: 300, cy: 528,
      path: "M 300 300 Q 380 420 300 528", // Flows OUT
      delay: 0.6, floatDuration: 7, particleDuration: 4.8
    }
  ]

  const FeatureCard = ({ feature }) => (
    <motion.div
      animate={{ y: [-2, 2, -2] }}
      transition={{ duration: feature.floatDuration, repeat: Infinity, ease: "easeInOut" }}
      className={`w-[220px] p-4 rounded-[18px] bg-[rgba(15,13,25,0.72)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.12)] transition-all duration-300 ease-out hover:-translate-y-[5px] hover:border-[rgba(255,255,255,0.22)] cursor-pointer group relative z-20`}
      style={{ boxShadow: `0 8px 30px rgba(0,0,0,0.3), 0 0 25px ${feature.shadowAmbient}` }}
      whileHover={{ boxShadow: `0 12px 40px rgba(0,0,0,0.4), 0 0 35px ${feature.shadowRgba}` }}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${feature.color} group-hover:scale-105 transition-transform duration-300`}>
          <feature.icon size={15} />
        </div>
        <h3 className="text-[13px] font-bold text-white font-['Plus_Jakarta_Sans',_sans-serif] leading-tight">{feature.title}</h3>
      </div>
      <p className="text-[#A1A1AA] text-[11px] leading-[1.5] mb-3">{feature.description}</p>
      <div className={`flex items-center text-[10px] uppercase font-bold tracking-widest ${feature.color}`}>
        Explore <ArrowRight size={12} className="ml-1 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </motion.div>
  )

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-[#030308]" id="features">

      {/* Shared Unified Background */}
      <CareerTwinBackground showWaves={true} />

      {/* Depth Layer 3: Foreground Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">

          {/* Left Content (Header & Buttons) */}
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start max-w-xl mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-[rgba(255,255,255,0.12)] text-[11px] font-semibold tracking-wider text-purple-300 mb-6 backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.10)]"
            >
              <span className="text-pink-500">✦</span> FEATURES
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[54px] tracking-tight font-bold mb-6 leading-[1.1]"
            >
              <span className="block text-white font-['Playfair_Display',_serif] font-medium mb-1 lg:mb-2">
                Everything You Need
              </span>
              <span className="block font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#EC4899] font-['Plus_Jakarta_Sans',_sans-serif]">
                for a Brighter Career
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[#A1A1AA] text-sm lg:text-[15px] mb-8 font-['Inter',_sans-serif] whitespace-normal lg:whitespace-nowrap"
            >
              CareerTwin brings all the essential tools together to help you understand,<br /> learn, practice and grow — all powered by AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12 lg:mb-16"
            >
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:from-[#9333EA] hover:to-[#DB2777] text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 hover:-translate-y-[2px]"
              >
                Explore All Features <ArrowRight size={16} />
              </Link>

              <button className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-medium border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-[#A855F7]/50 hover:text-white transition-all text-gray-300 flex items-center justify-center gap-2 group hover:-translate-y-[2px]">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 group-hover:bg-[#A855F7]/20 group-hover:text-[#A855F7] transition-colors">
                  <Play size={10} className="ml-0.5 text-white" fill="currentColor" />
                </span>
                Watch Demo
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-[11px] font-bold tracking-widest text-[#A1A1AA]"
            >
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></div> PERSONALIZED</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div> AI-POWERED</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#EC4899]"></div> BUILT AROUND YOU</span>
            </motion.div>
          </div>

          {/* Right Content - Orbit Hub */}
          <div className="hidden lg:block relative w-full h-[600px] max-w-[600px] mx-auto">

            <NetworkConnections nodes={features} viewBox="0 0 600 600" hub={{ x: 300, y: 300 }} />

            {/* Central CareerTwin AI Hub */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
            >
              <motion.div style={{ x: hubX, y: hubY }}>
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      "0 0 30px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.15), 0 0 100px rgba(34,211,238,0.05)",
                      "0 0 45px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.25), 0 0 120px rgba(34,211,238,0.1)",
                      "0 0 30px rgba(168,85,247,0.3), 0 0 60px rgba(168,85,247,0.15), 0 0 100px rgba(34,211,238,0.05)"
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex flex-col items-center justify-center w-36 h-36 rounded-full bg-[#050509]/95 backdrop-blur-xl border border-[#A855F7]/40 cursor-pointer group"
                >


                  <span className="text-[#EC4899] mb-1 text-lg group-hover:scale-110 transition-transform">✦</span>
                  <span className="text-[13px] font-bold text-white leading-tight text-center font-['Plus_Jakarta_Sans',_sans-serif]">
                    CareerTwin<br />AI
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Orbiting Feature Cards */}
            {features.map((feature, idx) => (
              <div key={idx} className="absolute z-40" style={{ top: feature.y, left: feature.x, transform: 'translate(-50%, -50%)' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: feature.delay + 0.2, ease: "easeOut" }}
                >
                  <FeatureCard feature={feature} />
                </motion.div>
              </div>
            ))}
          </div>

        </div>

        {/* Mobile Vertical Layout */}
        <div className="flex flex-col items-center gap-6 lg:hidden mt-12 relative z-20">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-[#050509]/80 border border-[#A855F7]/30 mb-2"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 border border-[#A855F7]/20 rounded-full" />
            <span className="text-[#EC4899] mb-1">✦</span>
            <span className="text-xs font-bold text-white text-center font-['Plus_Jakarta_Sans',_sans-serif]">CareerTwin<br />AI</span>
          </motion.div>

          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="w-full max-w-sm flex justify-center relative z-40"
            >
              <FeatureCard feature={feature} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
