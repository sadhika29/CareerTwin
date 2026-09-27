import { motion } from 'framer-motion'
import { Heart, Lightbulb, Shield } from 'lucide-react'
import robot from '../../assets/careertwin-robot.png'

const cards = [
  {
    title: 'Our Mission',
    desc: 'Make career guidance simple and personalized.',
    icon: Heart,
    color: 'text-pink-400'
  },
  {
    title: 'Our Vision',
    desc: 'Help every learner discover their potential.',
    icon: Lightbulb,
    color: 'text-purple-400'
  },
  {
    title: 'Our Purpose',
    desc: 'Support you throughout your career journey.',
    icon: Shield,
    color: 'text-blue-400'
  }
]

export default function About() {
  return (
    <section className="py-24 relative overflow-hidden" id="about">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-300 mb-6"
            >
              <span className="text-pink-500">✦</span> ABOUT US
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-bold mb-6 leading-tight"
            >
              Built to Make Your Career Journey <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Personal</span>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 text-lg mb-12 max-w-xl mx-auto lg:mx-0"
            >
              CareerTwin is your AI-powered career companion, helping you understand your skills, find the right direction, and grow with confidence.
            </motion.p>

            {/* Cards */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              {cards.map((card, idx) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + (idx * 0.1) }}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-colors"
                >
                  <card.icon size={28} className={`mb-4 ${card.color}`} />
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Content - Robot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 relative w-full max-w-md mx-auto hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-[80px] -z-10"></div>
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              {/* Fallback styling for robot if image is missing */}
              <img 
                src={robot} 
                alt="CareerTwin AI Robot" 
                className="w-full h-auto object-contain drop-shadow-[0_0_20px_rgba(236,72,153,0.2)]"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="hidden flex-col items-center justify-center w-64 h-80 bg-white/5 border border-white/10 rounded-3xl mx-auto">
                <span className="text-4xl mb-4">🤖</span>
                <span className="text-gray-400 text-sm">Robot Asset</span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
