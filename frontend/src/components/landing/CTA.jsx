import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="relative pb-24 lg:pb-32 overflow-hidden bg-[#050509]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative w-full rounded-[32px] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-[#0B0B12]/80 backdrop-blur-xl py-20 px-6 text-center group"
        >
          {/* Subtle Background Glow inside CTA */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/5 via-transparent to-[#EC4899]/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[300px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)] blur-[40px] pointer-events-none" />

          {/* Sparkles */}
          <motion.div animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} className="absolute top-10 left-[20%] w-1.5 h-1.5 rounded-full bg-pink-400" />
          <motion.div animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }} className="absolute bottom-12 right-[25%] w-2 h-2 rounded-full bg-cyan-400" />
          <motion.div animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }} transition={{ duration: 3.5, repeat: Infinity, delay: 2 }} className="absolute top-1/2 right-[15%] w-1 h-1 rounded-full bg-purple-400" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 font-['Plus_Jakarta_Sans',_sans-serif]">
              Ready to Build Your Career Twin?
            </h2>
            <p className="text-[#A1A1AA] text-[16px] mb-10 max-w-lg mx-auto leading-relaxed">
              Take the first step toward your career goals and let your AI companion guide you forward.
            </p>
            <button className="px-10 py-4 rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white text-[14px] font-bold tracking-wide hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300 hover:-translate-y-1 inline-flex items-center">
              Get Started <ArrowRight size={18} className="ml-2" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
