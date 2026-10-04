import { useState } from 'react'
import { Mail, CheckCircle2, LoaderCircle, ArrowRight, ArrowLeft, Target, Brain, Sparkles, CornerRightDown, Briefcase, GraduationCap, MessagesSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { requestPasswordReset } from '../features/auth/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async event => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    setLoading(true)
    try {
      await requestPasswordReset(email.trim())
      setSuccess(true)
    } catch (authError) {
      setError(authError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen font-sans overflow-x-hidden flex flex-col lg:flex-row w-full">
      
      {/* ========================================= */}
      {/* LEFT SECTION (50%) - DARK BRANDING */}
      {/* ========================================= */}
      <div className="relative w-full lg:w-[50%] min-h-screen bg-[#05040D] flex flex-col px-8 py-10 lg:pl-16 xl:pl-24 lg:pr-16 overflow-hidden">
        
        {/* Dark Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#070612] via-[#05040D] to-[#05040D] opacity-90" />
          <motion.div animate={{ opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[140px]" />
          <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#06B6D4]/15 rounded-full blur-[120px]" />
          
          {/* Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className={`absolute rounded-full pointer-events-none ${i % 3 === 0 ? 'bg-[#A855F7]' : i % 3 === 1 ? 'bg-[#06B6D4]' : 'bg-[#EC4899]'}`}
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2
              }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* Logo - Top Left */}
        <div className="relative z-20 pt-2 lg:pt-8 mb-12">
          <Link to="/" className="inline-flex items-center gap-2.5 cursor-pointer group transition-opacity hover:opacity-90">
            <img src="/logo.png" alt="CareerTwin Logo" className="h-[45px] w-[45px] object-contain transition-transform group-hover:scale-105" />
            <span className="font-bold text-[28px] tracking-tight">
              <span className="text-white">Career</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#EC4899]">Twin</span>
            </span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col justify-center max-w-[520px] mb-12">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#A855F7]/30 bg-[#A855F7]/10 w-fit mb-6 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Sparkles size={14} className="text-[#EC4899]" />
            <span className="text-[11px] font-bold tracking-wider text-white uppercase">AI-Powered Career Assistant</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold mb-5 leading-[1.15] font-['Plus_Jakarta_Sans',_sans-serif] text-white">
            <span className="block mt-1 text-[32px] sm:text-[40px]">Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#EC4899]">career</span> you're ready for.</span>
          </h1>

          <p className="text-[#A1A1B5] text-[15px] lg:text-[16px] leading-[1.7] mb-10">
            CareerTwin analyzes your profile, identifies skill gaps, and helps you prepare for the opportunities that matter most.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#A855F7]/15 flex items-center justify-center border border-[#A855F7]/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex-shrink-0">
                <Target size={18} className="text-[#A855F7]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-white">Personalized Career Guidance</span>
                <span className="text-[13px] text-[#A1A1B5]">Get insights tailored to your career goals.</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#06B6D4]/15 flex items-center justify-center border border-[#06B6D4]/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] flex-shrink-0">
                <Brain size={18} className="text-[#06B6D4]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-white">AI-Powered Insights</span>
                <span className="text-[13px] text-[#A1A1B5]">Understand your strengths, skills and gaps.</span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#EC4899]/15 flex items-center justify-center border border-[#EC4899]/30 shadow-[0_0_15px_rgba(236,72,153,0.2)] flex-shrink-0">
                <Sparkles size={18} className="text-[#EC4899]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-white">Smarter Career Preparation</span>
                <span className="text-[13px] text-[#A1A1B5]">Practice, plan and grow with confidence.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard/Laptop Visual - Bottom Left */}
        <div className="relative z-20 mt-auto hidden lg:block w-full max-w-[500px]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            {/* Handwritten Note */}
            <div className="absolute -top-14 right-4 z-30 transform rotate-12">
              <p className="text-[#A855F7] font-['Caveat',_cursive] text-[22px] leading-tight drop-shadow-md">
                Let's build<br/>your brighter<br/>future together!
              </p>
              <CornerRightDown size={24} className="text-[#A855F7] absolute -bottom-4 -left-4 transform -rotate-12" />
            </div>

            {/* Dashboard UI Panel */}
            <div className="relative bg-[#0B0A13]/90 backdrop-blur-xl border border-white/10 rounded-t-2xl h-[220px] shadow-[0_-10px_40px_rgba(124,58,237,0.15)] overflow-hidden flex">
              
              {/* Sidebar */}
              <div className="w-[140px] h-full border-r border-white/5 p-4 flex flex-col gap-3">
                <div className="text-[10px] font-bold text-white mb-2 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#A855F7] to-[#EC4899]" />
                  CareerTwin AI
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-[#A1A1B5]"><Target size={12}/> Your Skills</div>
                  <div className="flex items-center gap-2 text-[10px] text-[#A1A1B5]"><Briefcase size={12}/> Career Paths</div>
                  <div className="flex items-center gap-2 text-[10px] text-[#A1A1B5]"><GraduationCap size={12}/> Learning Plan</div>
                  <div className="flex items-center gap-2 text-[10px] text-white bg-white/10 px-2 py-1.5 rounded-md"><MessagesSquare size={12} className="text-[#A855F7]"/> Interview Prep</div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-5 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#A855F7]/10 rounded-full blur-[30px]" />
                <div className="w-full h-8 bg-white/5 rounded-lg mb-4" />
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 h-24 bg-white/5 rounded-lg border border-white/5 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#A855F7]/20 to-transparent" />
                  </div>
                  <div className="flex-1 h-24 bg-white/5 rounded-lg border border-white/5" />
                </div>
              </div>
            </div>
            
            {/* Laptop Base */}
            <div className="h-3 w-full bg-[#1A1829] rounded-b-xl border-t border-white/10 relative shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-[#27233A] rounded-b-md" />
            </div>
          </motion.div>
        </div>
      </div>


      {/* ========================================= */}
      {/* RIGHT SECTION (50%) - WHITE FORGOT PASSWORD AREA */}
      {/* ========================================= */}
      <div className="relative w-full lg:w-[50%] min-h-screen bg-[#FAFAFC] flex items-center justify-center p-6 lg:p-12 xl:p-16 overflow-hidden">
        
        {/* Subtle light background decorations */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-[#A855F7]/[0.03] rounded-full blur-[80px]" />
          <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-[20%] -left-[10%] w-[400px] h-[400px] bg-[#7C3AED]/[0.02] rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] border border-[#7C3AED]/[0.03] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] border border-[#7C3AED]/[0.02] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-[480px] relative z-10 flex flex-col items-center"
        >
          {/* Typography Headers */}
          <div className="w-full text-center mb-8">
            <div className="text-[11px] font-bold tracking-[0.2em] text-[#7C3AED] mb-3 uppercase">Account Recovery</div>
            <h2 className="text-[32px] sm:text-[36px] font-extrabold text-[#05050D] mb-2 font-['Plus_Jakarta_Sans',_sans-serif] leading-tight">Forgot Your Password?</h2>
            <p className="text-[15px] text-[#77758A]">Enter your email address and we'll help you reset your password.</p>
          </div>

          {/* Reset Card */}
          <div className="w-full bg-white rounded-[24px] border border-[#7C3AED]/10 shadow-[0_15px_40px_rgba(124,58,237,0.06),_0_0_15px_rgba(168,85,247,0.03)] p-8 sm:p-10 relative overflow-hidden">
            
            {success ? (
              <div className="flex flex-col items-center justify-center text-center relative z-10">
                <div className="w-16 h-16 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-[#10B981]/20">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#05050D] mb-3">Check your email</h3>
                <p className="text-[15px] text-[#77758A] mb-8 leading-relaxed">
                  We've sent password reset instructions to <br/><span className="font-semibold text-[#4A475C]">{email}</span>
                </p>
                <Link 
                  to="/login"
                  className="w-full h-[54px] bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white text-[15px] font-bold rounded-[14px] transition-all duration-300 flex justify-center items-center gap-2 shadow-[0_8px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_25px_rgba(168,85,247,0.35)] hover:-translate-y-[2px] group"
                >
                  <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Back to Sign In
                </Link>
              </div>
            ) : (
              <form className="flex flex-col gap-5 relative z-10" onSubmit={submit} noValidate>
                
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="recovery-email" className="text-[13px] font-semibold text-[#4A475C] ml-1">Email Address</label>
                  <div className="relative flex items-center group">
                    <Mail size={18} className="absolute left-4 text-[#A1A1B5] group-focus-within:text-[#7C3AED] transition-colors" />
                    <input 
                      id="recovery-email" type="email" autoComplete="email" placeholder="you@example.com" 
                      className="w-full h-[52px] bg-[#FAF8FF] border border-[#EBE8F4] rounded-[12px] pl-11 pr-4 text-[15px] text-[#05050D] placeholder-[#A1A1B5] focus:outline-none focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/10 focus:shadow-[0_0_10px_rgba(168,85,247,0.05)] transition-all focus:bg-white"
                      value={email} onChange={event=>setEmail(event.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-[#EC4899]/10 border border-[#EC4899]/20 rounded-xl text-[#EC4899] text-[13px] mt-1" role="alert">
                    {error}
                  </div>
                )}

                <button 
                  className="w-full h-[54px] bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white text-[15px] font-bold rounded-[14px] transition-all duration-300 flex justify-center items-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[2px] shadow-[0_8px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_25px_rgba(168,85,247,0.35)] group" 
                  disabled={loading}
                >
                  {loading ? <><LoaderCircle className="animate-spin" size={18} /> Sending...</> : <>Send Reset Link <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>}
                </button>
              </form>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-8 text-[14px]">
            <Link to="/login" className="text-[#A855F7] font-bold hover:text-[#EC4899] transition-colors flex items-center gap-2 group">
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
