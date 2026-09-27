import { motion } from 'framer-motion'
import { User, Cpu, Search, Map as MapIcon, TrendingUp } from 'lucide-react'

const steps = [
  {
    num: '01',
    title: 'Create Your Profile',
    desc: 'Tell us about your skills & goals.',
    icon: User
  },
  {
    num: '02',
    title: 'AI Analysis',
    desc: 'AI understands your profile and strengths.',
    icon: Cpu
  },
  {
    num: '03',
    title: 'Find Skill Gaps',
    desc: 'Discover the skills you need to improve.',
    icon: Search
  },
  {
    num: '04',
    title: 'Get Your Roadmap',
    desc: 'Get a personalized career plan.',
    icon: MapIcon
  },
  {
    num: '05',
    title: 'Practice & Grow',
    desc: 'Practice and track your progress.',
    icon: TrendingUp
  }
]

export default function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden" id="how-it-works">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-purple-300 mb-6"
          >
            <span className="text-pink-500">✦</span> HOW IT WORKS
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Build Your Career in 5 Simple Steps
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400"
          >
            Tell us about yourself. CareerTwin does the rest.
          </motion.p>
        </div>

        {/* Steps Container */}
        <div className="relative">
          {/* Background Connecting Line - Desktop Only */}
          <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-white/10 -translate-y-1/2">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>

          <div className="flex flex-col lg:flex-row justify-between relative gap-12 lg:gap-4">
            
            {/* Background Connecting Line - Mobile Only */}
            <div className="lg:hidden absolute left-8 top-10 bottom-10 w-[2px] bg-white/10">
               <motion.div 
                className="w-full bg-gradient-to-b from-purple-500 via-pink-500 to-blue-500"
                initial={{ height: "0%" }}
                whileInView={{ height: "100%" }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>

            {steps.map((step, index) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative flex lg:flex-col items-center lg:text-center gap-6 lg:gap-4 flex-1"
              >
                {/* Step Circle with Icon */}
                <div className="relative z-10 w-16 h-16 shrink-0 rounded-full bg-[#050507] border-2 border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)] group hover:border-purple-500 transition-colors duration-300">
                  <div className="absolute -top-3 -right-3 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-400">
                    {step.num}
                  </div>
                  <step.icon size={24} className="text-gray-300 group-hover:text-white transition-colors" />
                </div>
                
                {/* Step Content */}
                <div className="flex-1 lg:flex-none">
                  <h3 className="text-lg font-semibold mb-1 text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400 max-w-[200px] mx-auto">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
