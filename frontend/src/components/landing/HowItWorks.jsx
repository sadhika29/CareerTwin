import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Create Your Profile',
    desc: 'Tell us about your skills and goals.',
    icon: '/assets/steps/step-01.svg'
  },
  {
    num: '02',
    title: 'AI Analysis',
    desc: 'Our AI analyzes your profile to understand your strengths.',
    icon: '/assets/steps/step-02.svg'
  },
  {
    num: '03',
    title: 'Find Skill Gaps',
    desc: 'Discover the skills you need to improve for your target career.',
    icon: '/assets/steps/step-03.svg'
  },
  {
    num: '04',
    title: 'Get Your Roadmap',
    desc: 'Get a personalized career plan with clear learning steps.',
    icon: '/assets/steps/step-04.svg'
  },
  {
    num: '05',
    title: 'Practice & Grow',
    desc: 'Practice, learn, and grow with AI-powered guidance.',
    icon: '/assets/steps/step-05.svg'
  }
]

export default function HowItWorks() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden" id="how-it-works">
      {/* Background soft ambient glowing orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] right-[10%] w-[420px] h-[420px] bg-[#C4A4DA]/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-[15%] left-[8%] w-[380px] h-[380px] bg-[#ED96D7]/12 rounded-full blur-[110px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Heading — Prominently centered, no badge or subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold font-['Playfair_Display',_serif] text-[#4C2365] tracking-tight text-center mb-14 lg:mb-18"
        >
          Build Your Career in 5 Simple Steps
        </motion.h2>

        {/* Five Step Cards Container */}
        <div className="relative">
          {/* Desktop Connecting Line — Positioned behind the cards between steps */}
          <div className="hidden lg:block absolute top-[110px] left-[8%] right-[8%] h-[2px] z-0 pointer-events-none">
            <div className="w-full h-full border-t-2 border-dashed border-[#C4A4DA]/60" />
            <motion.div
              className="absolute top-[-1px] left-0 h-[2px] bg-gradient-to-r from-[#7F5D99] via-[#ED96D7] to-[#4C2365]"
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, delay: 0.3, ease: 'easeInOut' }}
            />
          </div>

          {/* Cards Grid: 5 columns on desktop, 2-3 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-5 items-stretch relative z-10">
            {steps.map((step, index) => {
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-md border border-[#4C2365]/35 hover:border-[#4C2365] transition-all duration-300 shadow-[0_4px_20px_rgba(76,35,101,0.06)] hover:shadow-[0_8px_30px_rgba(76,35,101,0.14)] hover:-translate-y-1.5 group h-full justify-between"
                >
                  {/* 1. Step Number Badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-widest text-[#7F5D99] bg-[#C4A4DA]/20 border border-[#C4A4DA]/35 mb-2">
                    STEP {step.num}
                  </div>

                  {/* 2. Large Relevant Icon in Pastel Container */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C4A4DA]/35 to-[#ED96D7]/20 border border-[#C4A4DA]/40 flex items-center justify-center text-[#4C2365] my-4 shadow-sm group-hover:scale-105 transition-transform duration-200">
                    <img src={step.icon} alt={step.title} className="w-12 h-12 object-contain" />
                  </div>

                  {/* 3. Bold Step Heading */}
                  <h3 className="text-base sm:text-lg font-bold text-[#4C2365] font-['Plus_Jakarta_Sans',_sans-serif] leading-tight mb-2">
                    {step.title}
                  </h3>

                  {/* 4. Short Description */}
                  <p className="text-xs sm:text-[13px] text-[#3B1B50] leading-relaxed font-['Inter',_sans-serif] mt-auto">
                    {step.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
