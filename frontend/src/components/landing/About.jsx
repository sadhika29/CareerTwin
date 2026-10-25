import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function About() {
  const handleContactClick = () => {
    const contactSection = document.getElementById('contact')
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.location.href = 'mailto:contact@careertwin.ai'
    }
  }

  /* Pre-compute subtle floating light sparkles */
  const sparkles = useMemo(() => [
    { top: 18, left: 14, size: 4, delay: 0.5 },
    { top: 28, left: 88, size: 3, delay: 1.2 },
    { top: 48, left: 8, size: 5, delay: 0.8 },
    { top: 62, left: 92, size: 4, delay: 1.8 },
    { top: 78, left: 18, size: 3, delay: 2.2 },
    { top: 82, left: 82, size: 4, delay: 1.5 },
    { top: 38, left: 24, size: 2.5, delay: 2.6 },
    { top: 68, left: 78, size: 3.5, delay: 0.2 },
  ], [])

  return (
    <section
      className="relative w-full overflow-hidden flex flex-col items-center justify-center pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-[118px] lg:pb-24 min-h-[calc(100vh-74px)]"
      id="about"
    >
      {/* 3. Soft Pastel Background with Ambient Glows and Decorative Outlines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Ambient Radial Glows */}
        <div className="absolute top-[10%] -left-[12%] w-[600px] h-[600px] bg-[#ED96D7]/22 rounded-full blur-[140px]" />
        <div className="absolute top-[25%] -right-[10%] w-[650px] h-[650px] bg-[#ED96D7]/28 rounded-full blur-[150px]" />
        <div className="absolute top-[20%] left-[25%] w-[550px] h-[550px] bg-[#7F5D99]/12 rounded-full blur-[130px]" />

        {/* Large, thin concentric circular outlines partially visible along left edge */}
        <div className="hidden lg:block absolute -left-[320px] top-[10%] w-[650px] h-[650px] rounded-full border border-[#C4A4DA]/25" />
        <div className="hidden lg:block absolute -left-[400px] top-[5%] w-[820px] h-[820px] rounded-full border border-[#ED96D7]/20" />

        {/* Large, thin concentric circular outlines on right edge */}
        <div className="hidden lg:block absolute -right-[320px] top-[15%] w-[650px] h-[650px] rounded-full border border-[#C4A4DA]/25" />
        <div className="hidden lg:block absolute -right-[420px] top-[8%] w-[840px] h-[840px] rounded-full border border-[#ED96D7]/20" />

        {/* Small glowing pink dots scattered around the perimeter */}
        {sparkles.map((dot, idx) => (
          <motion.div
            key={idx}
            animate={{
              opacity: [0.3, 0.85, 0.3],
              scale: [0.9, 1.2, 0.9],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: dot.delay,
            }}
            className="absolute rounded-full bg-[#ED96D7] shadow-[0_0_12px_#ED96D7]"
            style={{
              top: `${dot.top}%`,
              left: `${dot.left}%`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
            }}
          />
        ))}
      </div>

      {/* 4. Centered About Content */}
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        {/* About Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-[230px] h-[46px] rounded-full bg-white/95 border border-[#ED96D7]/35 shadow-[0_4px_20px_rgba(237,150,215,0.22),_0_2px_10px_rgba(76,35,101,0.06)] flex items-center justify-center gap-2 mb-8 sm:mb-9 lg:mb-10 backdrop-blur-md"
        >
          <span className="text-[#ED96D7] text-sm">✦</span>
          <span className="text-[#7F5D99] font-bold text-xs tracking-[0.16em] uppercase">
            ABOUT CAREERTWIN
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-bold tracking-tight mb-7 sm:mb-8 lg:mb-9 leading-[1.08] text-center"
        >
          <span className="block font-['Playfair_Display',_serif] text-[#4C2365]">
            Built to Make Your
          </span>
          <span className="block font-['Playfair_Display',_serif] italic text-transparent bg-clip-text bg-gradient-to-r from-[#7F5D99] via-[#A855A5] to-[#ED96D7] mt-1 sm:mt-2">
            Career Journey Personal
          </span>
        </motion.h1>

        {/* About Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl lg:text-[21px] text-[#614972] max-w-[1000px] mx-auto leading-[1.8] mb-10 sm:mb-11 lg:mb-12 font-['Inter',_sans-serif] font-normal"
        >
          CareerTwin is an AI-powered career companion designed to help individuals discover their potential and achieve their professional goals. From resume analysis and skill gap detection to personalized learning roadmaps, job matching, DSA practice, and AI-powered mock interviews, CareerTwin brings essential career development tools together in one place. By combining intelligent insights with personalized guidance, we help users identify opportunities, strengthen their skills, prepare for interviews, and navigate their career journey with greater confidence. Our mission is to make career growth more accessible, personalized, and effective for everyone.
        </motion.p>

        {/* Contact Us Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center w-full"
        >
          <button
            onClick={handleContactClick}
            className="w-full sm:w-[316px] h-[64px] sm:h-[70px] rounded-full bg-gradient-to-r from-[#4C2365] via-[#7B3A88] to-[#D64F9E] text-white font-bold text-lg sm:text-[20px] shadow-[0_10px_35px_rgba(76,35,101,0.28),_0_4px_15px_rgba(237,150,215,0.25)] hover:shadow-[0_14px_45px_rgba(76,35,101,0.38),_0_6px_20px_rgba(237,150,215,0.35)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Contact Us</span>
            <ArrowRight size={22} className="ml-1" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}
