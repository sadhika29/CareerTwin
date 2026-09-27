import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import robot from '../../assets/careertwin-robot.png'

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
              className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
            >
              Your Personal <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500">
                Career Twin
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
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2"
              >
                Build My Career Twin <span>→</span>
              </Link>
              
              <button className="w-full sm:w-auto px-8 py-4 rounded-full font-medium border border-white/10 hover:bg-white/5 transition-all text-white flex items-center justify-center gap-2 group">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                  <Play size={12} className="ml-0.5 text-purple-300" fill="currentColor" />
                </span>
                Watch Demo
              </button>
            </motion.div>
          </div>

          {/* Right Content - Robot */}
          <motion.div
            initial={{
              opacity: 0,
              y: 300,
              scale: 0.85
            }}
            animate={{
              opacity: 1,
              y: [300, 0],
              scale: [0.85, 1]
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut"
            }}
            className="flex-1 relative w-full max-w-lg lg:max-w-none mx-auto"
          >
            {/* Soft background glow for robot */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
            
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 3, 
                ease: "easeInOut",
                delay: 1.5
              }}
              className="relative"
            >
              {/* Fallback styling for robot if image is missing */}
              <img 
                src={robot} 
                alt="CareerTwin AI Robot" 
                className="w-full h-auto object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.3)]"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden flex-col items-center justify-center w-64 h-80 bg-white/5 border border-white/10 rounded-3xl mx-auto shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                <span className="text-4xl mb-4">🤖</span>
                <span className="text-gray-400 text-sm">Robot Asset Needed</span>
              </div>
            </motion.div>

            {/* Subtle floating particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-purple-400/50"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
          
        </div>
      </div>
    </section>
  )
}
