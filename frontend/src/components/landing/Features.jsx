import { motion } from 'framer-motion'
import { FileText, Target, Map, Briefcase, Code, MessageSquare, ArrowRight } from 'lucide-react'

const features = [
  {
    id: 1,
    icon: FileText,
    title: 'Resume Analysis',
    description: 'Improve your resume',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    icon: Target,
    title: 'Skill Gap Analysis',
    description: 'Know what to learn',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 3,
    icon: Map,
    title: 'Personalized Roadmap',
    description: 'Your learning path',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 4,
    icon: Briefcase,
    title: 'Job Matching',
    description: 'Find relevant jobs',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 5,
    icon: Code,
    title: 'DSA Practice',
    description: 'Practice coding',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    id: 6,
    icon: MessageSquare,
    title: 'AI Mock Interviews',
    description: 'Practice interviews',
    color: 'from-pink-500 to-rose-500'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

export default function Features() {
  return (
    <section className="py-24 relative" id="features">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Everything You Need for a <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Brighter Career</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1 }}
            className="text-gray-400"
          >
            AI-powered tools to help you understand, prepare, and grow.
          </motion.p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={cardVariants}>
              <div className="group relative h-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-white/[0.04] overflow-hidden cursor-pointer">
                
                {/* Hover Gradient Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.01] to-white/0 pointer-events-none" />
                <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500`} />
                <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.15] transition-opacity duration-500`} style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', padding: '1px' }} />

                <div className="relative z-10 flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.color} bg-opacity-10 text-white shadow-lg`}>
                    <feature.icon size={24} className="opacity-90" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-300 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-6 flex-grow">
                    {feature.description}
                  </p>
                  
                  <div className="mt-auto flex items-center text-sm font-medium text-purple-400 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Explore <ArrowRight size={16} className="ml-1" />
                  </div>
                </div>
                
              </div>
            </motion.div>
          ))}
        </motion.div>
        
      </div>
    </section>
  )
}
