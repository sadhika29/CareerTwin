import { Link } from 'react-router-dom'
import { Github, Linkedin, Instagram, Mail } from 'lucide-react'
import logo from '../../assets/careertwin-logo.png'

export default function Footer() {
  const scrollToSection = (id) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="relative bg-[#020203] pt-20 pb-10 border-t border-white/5 overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => scrollToSection('home')}>
              <img src={logo} alt="CareerTwin" className="h-8 w-auto" onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }} />
              <span className="hidden font-bold text-xl tracking-tight text-white">CareerTwin</span>
            </div>
            <p className="text-purple-300 font-medium mb-2">Your AI Career Companion</p>
            <p className="text-gray-400 max-w-sm">
              Your Career. Your Journey. Your Twin.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-6">PRODUCT</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => scrollToSection('features')} className="text-gray-400 hover:text-purple-400 transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="text-gray-400 hover:text-purple-400 transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-purple-400 transition-colors">Login</Link>
              </li>
              <li>
                <Link to="/signup" className="text-gray-400 hover:text-purple-400 transition-colors">Sign Up</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-6">COMPANY</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-purple-400 transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Terms of Service</a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-white font-semibold mb-6">CONNECT</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-purple-400 transition-all border border-white/5">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-purple-400 transition-all border border-white/5">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-purple-400 transition-all border border-white/5">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-purple-400 transition-all border border-white/5">
                <Mail size={18} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 CareerTwin. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Made with <span className="text-pink-500">♥</span> for a brighter future
          </p>
        </div>
      </div>
    </footer>
  )
}
