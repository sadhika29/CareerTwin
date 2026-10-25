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
    <footer id="contact" className="relative pt-20 pb-10 border-t border-[#C4A4DA]/20 overflow-hidden" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(76,35,101,0.05) 100%)' }}>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => scrollToSection('home')}>
              <img src={logo} alt="CareerTwin" className="h-8 w-auto" onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }} />
              <span className="hidden font-bold text-xl tracking-tight text-[#4C2365]">CareerTwin</span>
            </div>
            <p className="text-[#7F5D99] font-medium mb-2">Your AI Career Companion</p>
            <p className="text-[#7F5D99]/70 max-w-sm">
              Your Career. Your Journey. Your Twin.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[#4C2365] font-semibold mb-6">PRODUCT</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => scrollToSection('features')} className="text-[#7F5D99] hover:text-[#4C2365] transition-colors">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="text-[#7F5D99] hover:text-[#4C2365] transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <Link to="/login" className="text-[#7F5D99] hover:text-[#4C2365] transition-colors">Login</Link>
              </li>
              <li>
                <Link to="/signup" className="text-[#7F5D99] hover:text-[#4C2365] transition-colors">Sign Up</Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#4C2365] font-semibold mb-6">COMPANY</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => scrollToSection('about')} className="text-[#7F5D99] hover:text-[#4C2365] transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <a href="#" className="text-[#7F5D99] hover:text-[#4C2365] transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#" className="text-[#7F5D99] hover:text-[#4C2365] transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-[#7F5D99] hover:text-[#4C2365] transition-colors">Terms of Service</a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-[#4C2365] font-semibold mb-6">CONNECT</h4>
            <div className="flex gap-4 mb-6">
              <a href="#" className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#7F5D99] hover:bg-[#C4A4DA]/20 hover:text-[#4C2365] transition-all border border-[#C4A4DA]/20">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#7F5D99] hover:bg-[#C4A4DA]/20 hover:text-[#4C2365] transition-all border border-[#C4A4DA]/20">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#7F5D99] hover:bg-[#C4A4DA]/20 hover:text-[#4C2365] transition-all border border-[#C4A4DA]/20">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-[#7F5D99] hover:bg-[#C4A4DA]/20 hover:text-[#4C2365] transition-all border border-[#C4A4DA]/20">
                <Mail size={18} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#C4A4DA]/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#7F5D99]/60 text-sm">
            © 2026 CareerTwin. All rights reserved.
          </p>
          <p className="text-[#7F5D99]/60 text-sm flex items-center gap-1">
            Made with <span className="text-[#ED96D7]">♥</span> for a brighter future
          </p>
        </div>
      </div>
    </footer>
  )
}
