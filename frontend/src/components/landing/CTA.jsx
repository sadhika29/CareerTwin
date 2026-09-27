import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-white/[0.02] border border-white/10 p-10 md:p-16 text-center"
        >
          {/* Animated Background Glows */}
          <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-purple-500/20 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-pink-500/20 rounded-full blur-[80px] translate-y-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 bg-blue-500/20 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Floating Stars */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-purple-300/40 pointer-events-none"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -15, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            >
              <Sparkles size={Math.random() * 10 + 10} />
            </motion.div>
          ))}

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Career Twin?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Take the first step toward your career goals. Join today and let your AI companion guide you to success.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]"
            >
              Get Started <span>→</span>
            </Link>
          </div>
          
        </motion.div>
      </div>
    </section>
  )
}
