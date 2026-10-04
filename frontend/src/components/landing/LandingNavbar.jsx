import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)

      const sections = ['home', 'features', 'how-it-works', 'about']
      let current = 'home'
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= window.innerHeight / 3) {
            current = section
          }
        }
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    setMobileMenuOpen(false)
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Features', id: 'features' },
    { name: 'How It Works', id: 'how-it-works' },
    { name: 'About', id: 'about' }
  ]

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 flex items-center h-[76px] border-b border-white/[0.12] ${scrolled ? 'bg-[#050509]/65 backdrop-blur-[16px]' : 'bg-transparent'
          }`}
      >
        <div className="max-w-9xl mx-auto px-9 flex items-center justify-between w-full relative">
          <div className="flex items-center gap-2.5 cursor-pointer group transition-opacity hover:opacity-90" onClick={() => scrollToSection('home')}>
            <img src="/logo.png" alt="CareerTwin Logo" className="h-[63px] w-[63px] object-contain transition-transform group-hover:scale-105" />
            <span className="font-bold text-[32.5px] tracking-tight">
              <span className="text-white">Career</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#EC4899]">Twin</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link, i) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.id)}
                  className={`relative text-sm font-medium transition-colors py-1 ${isActive ? 'text-[#EC4899]' : 'text-[#A1A1AA] hover:text-white'
                    }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator-desktop"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[110%] h-[3px] rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2 rounded-full text-sm font-medium bg-white/[0.02] border border-[#A855F7]/30 hover:border-[#A855F7]/60 hover:bg-[#A855F7]/10 transition-all text-white hover:-translate-y-[2px]"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:from-[#9333EA] hover:to-[#DB2777] text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:-translate-y-[2px]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-[#A1A1AA] hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#050507]/95 backdrop-blur-xl flex flex-col pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <button
                    key={link.name}
                    onClick={() => scrollToSection(link.id)}
                    className={`text-left text-2xl font-semibold transition-colors ${isActive ? 'text-[#c855ff]' : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    {link.name}
                  </button>
                );
              })}

              <div className="h-px w-full bg-white/10 my-4" />

              <Link
                to="/login"
                className="w-full py-4 text-center rounded-xl font-medium border border-purple-500/30 text-white"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="w-full py-4 text-center rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
