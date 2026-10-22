import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)

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
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b border-[#7F5D99]/30 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_15px_rgba(76,35,101,0.06)]'
            : 'bg-white/90 backdrop-blur-md shadow-[0_1px_8px_rgba(76,35,101,0.03)]'
        }`}
      >
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 h-[74px] flex items-center justify-between relative">
          {/* Left Branding - Text wordmark only, no separate butterfly logo */}
          <div
            className="flex items-center cursor-pointer select-none transition-opacity hover:opacity-90"
            onClick={() => scrollToSection('home')}
          >
            <span className="font-bold text-[28px] sm:text-[30px] tracking-tight leading-none font-sans">
              <span className="text-[#4C2365]">Career</span>
              <span className="text-[#7F5D99]">Twin</span>
            </span>
          </div>

          {/* Desktop Navigation Links - Centered, bold & dark purple */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id
              return (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.id)}
                  className={`relative px-4 py-2 text-[15px] font-semibold transition-all rounded-lg ${
                    isActive
                      ? 'text-[#4C2365]'
                      : 'text-[#4C2365]/80 hover:text-[#4C2365] hover:bg-[#C4A4DA]/15'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-underline"
                      className="absolute bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-[#4C2365]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Right CTA - Login and Get Started */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="h-10 px-5 flex items-center justify-center rounded-full text-sm font-semibold border-2 border-[#4C2365] text-[#4C2365] bg-transparent hover:bg-[#4C2365] hover:text-white transition-all duration-200"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="h-10 px-5 flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white shadow-[0_4px_14px_rgba(76,35,101,0.25)] hover:shadow-[0_6px_20px_rgba(76,35,101,0.35)] hover:-translate-y-[1px] transition-all duration-200"
            >
              Get Started <ArrowRight size={15} />
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="md:hidden p-2 rounded-lg text-[#4C2365] hover:bg-[#C4A4DA]/15 transition-colors focus:outline-none focus:ring-2 focus:ring-[#7F5D99]/40"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 sm:top-[72px] left-0 w-full z-40 bg-white/95 backdrop-blur-xl border-b border-[#7F5D99]/30 shadow-lg px-6 py-6 md:hidden flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id
                return (
                  <button
                    key={link.name}
                    onClick={() => scrollToSection(link.id)}
                    className={`text-left text-base font-semibold px-4 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'text-[#4C2365] bg-[#C4A4DA]/20'
                        : 'text-[#4C2365]/80 hover:text-[#4C2365] hover:bg-[#C4A4DA]/10'
                    }`}
                  >
                    {link.name}
                  </button>
                )
              })}
            </div>

            <div className="h-px w-full bg-[#7F5D99]/20 my-2" />

            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-11 flex items-center justify-center rounded-full text-sm font-semibold border-2 border-[#4C2365] text-[#4C2365] bg-transparent hover:bg-[#4C2365] hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-11 flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#4C2365] to-[#7F5D99] text-white shadow-[0_4px_14px_rgba(76,35,101,0.25)] transition-colors"
              >
                Get Started <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
