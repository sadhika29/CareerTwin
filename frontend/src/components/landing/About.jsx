import React from 'react'
import { motion } from 'framer-motion'
import { Target, Lightbulb, Shield, GraduationCap, Brain, TrendingUp, Heart, Sparkles, ArrowRight } from 'lucide-react'
import CareerTwinBackground from './CareerTwinBackground'

const missionCards = [
  {
    title: 'OUR MISSION',
    desc: 'Make career guidance simple, personalized, and accessible for every learner.',
    icon: Target,
    color: 'text-[#A855F7]',
    accentClass: 'via-[#A855F7]',
    shadow: 'rgba(168, 85, 247, 0.2)'
  },
  {
    title: 'OUR VISION',
    desc: 'Help every student discover their strengths, build confidence, and find the right career direction.',
    icon: Lightbulb,
    color: 'text-[#22D3EE]',
    accentClass: 'via-[#22D3EE]',
    shadow: 'rgba(34, 211, 238, 0.2)'
  },
  {
    title: 'OUR PURPOSE',
    desc: 'Support learners at every stage of their career journey with intelligent, practical guidance.',
    icon: Heart,
    color: 'text-[#EC4899]',
    accentClass: 'via-[#EC4899]',
    shadow: 'rgba(236, 72, 153, 0.2)'
  }
]

const values = [
  { icon: GraduationCap, title: 'Student-Centric', desc: 'Built with students in mind', color: 'text-[#A855F7]' },
  { icon: Brain, title: 'AI-Powered', desc: 'Guidance made smarter', color: 'text-[#22D3EE]' },
  { icon: TrendingUp, title: 'Growth-Focused', desc: 'Helping you move forward', color: 'text-[#EC4899]' },
  { icon: Heart, title: 'Always With You', desc: 'Your learning partner', color: 'text-[#F59E0B]' }
]

const aboutNodes = [
  { title: 'Personalized', x: '15%', y: '20%', path: 'M 250 250 C 200 150, 100 150, 75 100', color: 'text-[#A855F7]', hex: '#A855F7', delay: 0.2, particleDuration: 3.5 },
  { title: 'AI-Powered', x: '85%', y: '25%', path: 'M 250 250 C 320 200, 380 150, 425 125', color: 'text-[#22D3EE]', hex: '#22D3EE', delay: 0.4, particleDuration: 4 },
  { title: 'Student-Centric', x: '15%', y: '75%', path: 'M 250 250 C 180 300, 120 350, 75 375', color: 'text-[#EC4899]', hex: '#EC4899', delay: 0.6, particleDuration: 3.8 },
  { title: 'Growth-Focused', x: '85%', y: '80%', path: 'M 250 250 C 300 300, 350 350, 425 400', color: 'text-[#3B82F6]', hex: '#3B82F6', delay: 0.8, particleDuration: 4.5 }
]

export default function About() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-[#050509]" id="about">
      
      {/* Background */}
      <CareerTwinBackground showWaves={false} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* ========================================= */}
        {/* HERO SECTION */}
        {/* ========================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center mb-32">
          
          {/* Left Content */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B0B12]/80 backdrop-blur-xl border border-pink-500/30 text-[11px] font-semibold tracking-wider text-purple-300 mb-8 shadow-[0_0_15px_rgba(236,72,153,0.15)]"
            >
              <span className="text-pink-500">✦</span> ABOUT CAREERTWIN
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-bold mb-6 leading-[1.15] tracking-tight font-['Plus_Jakarta_Sans',_sans-serif]"
            >
              <span className="text-white block">Built to Make Your</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#EC4899] block mt-1">Career Journey Personal</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[#A1A1AA] text-[17px] leading-[1.7] mb-10 max-w-xl"
            >
              CareerTwin is your AI-powered career companion, helping you understand your skills, discover the right opportunities, and grow with confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white text-[13px] font-bold tracking-wide hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center">
                Build My Career Twin <ArrowRight size={16} className="ml-2" />
              </button>
              <button className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/5 border border-white/10 text-white text-[13px] font-bold tracking-wide hover:bg-white/10 transition-all duration-300">
                Explore Features
              </button>
            </motion.div>
          </div>

          {/* Right Content - Abstract AI Visualization */}
          <div className="relative w-full h-[500px] mt-10 lg:mt-0 flex justify-center items-center">

            {/* Ambient Background Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center">
              <motion.div animate={{ opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute w-64 h-64 bg-[#A855F7]/15 rounded-full blur-[100px]" />
              <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute w-64 h-64 bg-[#22D3EE]/15 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-[500px] h-[500px]">
              {/* SVG Connections Layer */}
              <svg viewBox="0 0 500 500" className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible">
                <defs>
                  {aboutNodes.map((node, i) => (
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

                {aboutNodes.map((node, i) => (
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
                    <motion.circle r="2.5" fill="#FFFFFF" filter="url(#glow-ambient-sm)">
                      <animateMotion dur={`${node.particleDuration}s`} repeatCount="indefinite" path={node.path} />
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
                  className="relative flex items-center justify-center w-36 h-36"
                >
                  {/* Concentric Rings */}
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-[#A855F7]/25 border-dashed" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 rounded-full border border-[#22D3EE]/15" />
                  
                  {/* Core Panel */}
                  <motion.div
                    animate={{ boxShadow: ["0 0 20px rgba(168,85,247,0.1)", "0 0 45px rgba(168,85,247,0.25)", "0 0 20px rgba(168,85,247,0.1)"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-[#050509] border border-white/10 z-10"
                  >
                    <span className="text-white mb-0.5">
                      <Sparkles size={14} className="text-[#A855F7]" />
                    </span>
                    <span className="text-[11px] font-bold text-white leading-tight text-center tracking-wide font-['Plus_Jakarta_Sans',_sans-serif]">
                      CareerTwin
                    </span>
                    <span className="text-[9px] text-[#A1A1AA] tracking-widest mt-0.5">AI</span>
                  </motion.div>
                </motion.div>
              </div>

              {/* Floating Nodes */}
              {aboutNodes.map((node, idx) => (
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
                      className="flex flex-col items-center justify-center px-4 py-2.5 rounded-xl bg-[#0B0B12]/80 backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] min-w-[100px]"
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${node.color}`}>{node.title}</span>
                    </motion.div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ========================================= */}
        {/* WHY CAREERTWIN EXISTS */}
        {/* ========================================= */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold text-white mb-4 font-['Plus_Jakarta_Sans',_sans-serif]"
            >
              Why CareerTwin Exists
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[#A1A1AA] text-[16px] max-w-2xl mx-auto"
            >
              Built around one simple idea — career guidance should feel personal.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            {missionCards.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + (idx * 0.1) }}
                whileHover={{ y: -6, boxShadow: `0 12px 40px ${card.shadow}` }}
                className="relative group flex flex-col items-start text-left bg-[#0B0B12]/70 backdrop-blur-xl border border-white/5 rounded-[20px] p-8 transition-all duration-300 hover:border-white/10 hover:bg-[#0B0B12]/90 overflow-hidden h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <card.icon size={26} className={`mb-6 ${card.color} transition-transform duration-300 group-hover:scale-110 relative z-10`} />
                <h3 className="text-[18px] font-bold text-white mb-3 relative z-10 font-['Plus_Jakarta_Sans',_sans-serif]">{card.title}</h3>
                <p className="text-[14px] text-[#A1A1AA] leading-relaxed relative z-10">{card.desc}</p>
                
                {/* Bottom Accent Line */}
                <div className={`absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent ${card.accentClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </motion.div>
            ))}
          </div>
        </div>


        {/* ========================================= */}
        {/* WHAT WE BELIEVE */}
        {/* ========================================= */}
        <div className="mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white font-['Plus_Jakarta_Sans',_sans-serif]">What We Believe</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full rounded-[24px] bg-[#0B0B12]/60 backdrop-blur-xl border border-white/5 p-[1px] relative"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/5 bg-[#0B0B12]/40 rounded-[24px]">
              {values.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center text-center p-8 lg:p-10 transition-colors hover:bg-white/[0.02]">
                  <item.icon size={28} className={`mb-4 opacity-90 ${item.color}`} />
                  <h4 className="text-[15px] font-bold text-white mb-2 font-['Plus_Jakarta_Sans',_sans-serif]">{item.title}</h4>
                  <p className="text-[13px] text-[#A1A1AA]">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>


      </div>
    </section>
  )
}
