import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../../assets/careertwin-logo.png'

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
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
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#050507]/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
            <img src={logo} alt="CareerTwin Logo" className="h-8 w-auto" />
            <span className="font-bold text-xl tracking-tight">
              <span className="text-white">Career</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Twin</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.id)}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                {link.name}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2 rounded-full text-sm font-medium border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10 transition-all text-white"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

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
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left text-2xl font-semibold text-gray-300 hover:text-white transition-colors"
                >
                  {link.name}
                </button>
              ))}

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
