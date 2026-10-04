import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function CareerTwinBackground({ showWaves = true }) {
  const [isMobile, setIsMobile] = useState(false)
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    
    // Initialize particles once
    const initialParticles = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      color: ['bg-[#A855F7]', 'bg-[#EC4899]', 'bg-[#22D3EE]'][Math.floor(Math.random() * 3)],
      size: Math.random() * 2 + 1.5,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      duration: Math.random() * 8 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.1
    }))
    setParticles(initialParticles)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#030308]">
      {/* 1. Base Atmospheric Gradients */}
      <motion.div
        animate={{ x: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[900px] h-[900px] bg-[radial-gradient(circle_at_center,rgba(107,33,168,0.12),transparent_60%)]"
      />
      <motion.div
        animate={{ x: [0, 40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[-10%] w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_60%)]"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[0%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.05),transparent_50%)]"
      />
      <motion.div
        animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.07),transparent_50%)]"
      />

      {/* 2. Curved Light Waves */}
      {showWaves && (
        <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 1440 800">
          <motion.path 
            d="M-100,600 C300,200 600,700 1600,100" 
            stroke="url(#wave-grad-1)" 
            strokeWidth="1.5" 
            fill="none" 
            style={{ filter: "drop-shadow(0 0 12px rgba(168,85,247,0.4))" }}
            animate={{ d: ["M-100,600 C300,200 600,700 1600,100", "M-100,550 C350,250 550,650 1600,150", "M-100,600 C300,200 600,700 1600,100"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path 
            d="M-200,300 C400,600 900,100 1500,500" 
            stroke="url(#wave-grad-2)" 
            strokeWidth="1" 
            fill="none" 
            style={{ filter: "drop-shadow(0 0 15px rgba(236,72,153,0.3))" }}
            animate={{ d: ["M-200,300 C400,600 900,100 1500,500", "M-200,350 C450,550 850,150 1500,450", "M-200,300 C400,600 900,100 1500,500"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path 
            d="M0,800 C500,300 1000,800 1440,200" 
            stroke="url(#wave-grad-3)" 
            strokeWidth="2" 
            fill="none" 
            style={{ filter: "drop-shadow(0 0 10px rgba(6,182,212,0.4))" }}
            opacity="0.6"
            animate={{ d: ["M0,800 C500,300 1000,800 1440,200", "M0,750 C450,350 1050,750 1440,250", "M0,800 C500,300 1000,800 1440,200"] }}
            transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 3. Glowing Particles */}
      {!isMobile && particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{ y: [0, -40, 0], opacity: [p.opacity, p.opacity * 0.4, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          className={`absolute rounded-full ${p.color}`}
          style={{ top: p.top, left: p.left, width: p.size, height: p.size, filter: `drop-shadow(0 0 4px ${p.color})` }}
        />
      ))}
    </div>
  )
}
