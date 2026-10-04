import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, LoaderCircle, Sparkles, Target, Brain, TrendingUp, ArrowRight, CheckCircle2, ChevronRight, LayoutDashboard, Briefcase, GraduationCap, MessagesSquare, CornerRightDown } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithGoogle, signUp } from '../features/auth/authService'

export default function Signup() { 
  const navigate = useNavigate(); 
  const [form, setForm] = useState({full_name:'', username:'', email:'', password:'', confirm_password:''}); 
  const [show, setShow] = useState(false); 
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false); 

  if(localStorage.getItem('career_user')) return <Navigate to="/dashboard" replace />; 

  const update = key => event => setForm({...form, [key]: event.target.value}); 
  
  const submit = async event => {
    event.preventDefault();
    setError('');
    if(Object.values(form).some(value=>!value.trim())) return setError('Complete all fields to create your account.');
    if(form.password.length<8||!/[0-9]/.test(form.password)||!/[^A-Za-z0-9]/.test(form.password)) return setError('Password must contain at least 8 characters, including a number and special character.');
    if(form.password!==form.confirm_password) return setError('Passwords do not match.');
    setLoading(true);
    try{
      await signUp(form);
      navigate('/dashboard',{replace:true});
    }catch(authError){
      setError(authError.message);
    }finally{
      setLoading(false);
    }
  }; 

  const google = async () => {
    setLoading(true);
    try{
      await signInWithGoogle();
      navigate('/dashboard',{replace:true});
    }catch(authError){
      setError(authError.message);
    }finally{
      setLoading(false);
    }
  }; 

  return (
    <div className="min-h-screen font-sans overflow-x-hidden flex flex-col lg:flex-row w-full">
      
      {/* ========================================= */}
      {/* LEFT SECTION (50%) - DARK BRANDING */}
      {/* ========================================= */}
      <div className="relative w-full lg:w-[50%] min-h-screen bg-[#05050D] flex flex-col px-8 py-10 lg:pl-16 xl:pl-24 lg:pr-16 overflow-hidden">
        
        {/* Dark Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0B0820] via-[#080617] to-[#05050D] opacity-90" />
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-[#7C3AED]/30 text-[10px] font-bold tracking-wider text-[#A855F7] mb-6 w-max shadow-[0_0_20px_rgba(124,58,237,0.15)]">
            <span className="text-[#A855F7]">✦</span> AI-POWERED CAREER ASSISTANT
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold mb-5 leading-[1.15] font-['Plus_Jakarta_Sans',_sans-serif] text-white">
            <span className="block">Build the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] to-[#EC4899]">career</span></span>
            <span className="block mt-1">you're ready for.</span>
          </h1>

          <p className="text-[#A1A1B5] text-[15px] lg:text-[16px] leading-[1.7] mb-10">
            CareerTwin analyzes your profile, identifies skill gaps, and helps you prepare for the opportunities that matter most.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#A855F7]/15 flex items-center justify-center border border-[#A855F7]/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] flex-shrink-0">
                <UserRound size={18} className="text-[#A855F7]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-white">Personalized Career Guidance</span>
                <span className="text-[13px] text-[#A1A1B5]">Get insights tailored to your goals.</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#06B6D4]/15 flex items-center justify-center border border-[#06B6D4]/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] flex-shrink-0">
                <Target size={18} className="text-[#06B6D4]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-white">AI-Powered Insights</span>
                <span className="text-[13px] text-[#A1A1B5]">Understand your strengths and gaps.</span>
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
              <p className="text-[#06B6D4] font-['Caveat',_cursive] text-[22px] leading-tight drop-shadow-md">
                Let's build<br/>your brighter<br/>future together!
              </p>
              <CornerRightDown size={24} className="text-[#06B6D4] absolute -bottom-4 -left-4 transform -rotate-12" />
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
                  <div className="flex items-center gap-2 text-[10px] text-white bg-white/10 px-2 py-1.5 rounded-md"><Target size={12} className="text-[#A855F7]"/> Your Skills</div>
                  <div className="flex items-center gap-2 text-[10px] text-[#A1A1B5]"><Briefcase size={12}/> Career Paths</div>
                  <div className="flex items-center gap-2 text-[10px] text-[#A1A1B5]"><GraduationCap size={12}/> Learning Plan</div>
                  <div className="flex items-center gap-2 text-[10px] text-[#A1A1B5]"><MessagesSquare size={12}/> Interview Prep</div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-5 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#06B6D4]/10 rounded-full blur-[30px]" />
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

            {/* Floating Element */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 -left-6 bg-[#0B0A13]/90 border border-[#7C3AED]/40 backdrop-blur-md rounded-xl p-3 shadow-xl flex items-center gap-3 z-30"
            >
              <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center">
                <GraduationCap size={16} className="text-[#A855F7]" />
              </div>
              <div className="text-[10px] text-white">92% Match</div>
            </motion.div>
          </motion.div>
        </div>
      </div>


      {/* ========================================= */}
      {/* RIGHT SECTION (50%) - WHITE SIGNUP AREA */}
      {/* ========================================= */}
      <div className="relative w-full lg:w-[50%] min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6 lg:p-12 xl:p-16 overflow-hidden">
        
        {/* Very subtle light background decorations */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[#FAF8FF] opacity-50" />
          <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-[#A855F7]/[0.03] rounded-full blur-[80px]" />
          <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-[20%] -left-[10%] w-[400px] h-[400px] bg-[#06B6D4]/[0.03] rounded-full blur-[80px]" />
          
          {/* Subtle Arcs */}
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 0,100 C 30,80 70,80 100,100" fill="none" stroke="#7C3AED" strokeWidth="0.05" />
            <path d="M 0,95 C 40,75 60,75 100,95" fill="none" stroke="#7C3AED" strokeWidth="0.02" />
          </svg>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-[500px] relative z-10 flex flex-col items-center"
        >
          {/* Typography Headers */}
          <div className="w-full text-center mb-8">
            <div className="text-[11px] font-bold tracking-[0.2em] text-[#7C3AED] mb-3 uppercase">New to CareerTwin</div>
            <h2 className="text-[32px] sm:text-[36px] font-extrabold text-[#05050D] mb-2 font-['Plus_Jakarta_Sans',_sans-serif] leading-tight">Create Your Account</h2>
            <p className="text-[15px] text-[#77758A]">Start building your personalized career journey.</p>
          </div>

          {/* Form Card */}
          <div className="w-full bg-white rounded-[24px] border border-[#7C3AED]/10 shadow-[0_15px_40px_rgba(124,58,237,0.06),_0_0_15px_rgba(168,85,247,0.03)] p-8 sm:p-10 relative overflow-hidden">
            
            <form className="flex flex-col gap-4 relative z-10" onSubmit={submit} noValidate>
              
              <div className="flex flex-col gap-1.5">
                <label htmlFor="full_name" className="text-[13px] font-semibold text-[#4A475C] ml-1">Full Name</label>
                <div className="relative flex items-center group">
                  <UserRound size={18} className="absolute left-4 text-[#A1A1B5] group-focus-within:text-[#7C3AED] transition-colors" />
                  <input 
                    id="full_name" autoComplete="name" placeholder="Your full name" 
                    className="w-full h-[52px] bg-[#FAF8FF] border border-[#EBE8F4] rounded-[12px] pl-11 pr-4 text-[15px] text-[#05050D] placeholder-[#A1A1B5] focus:outline-none focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/10 focus:shadow-[0_0_10px_rgba(168,85,247,0.05)] transition-all focus:bg-white"
                    value={form.full_name} onChange={update('full_name')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-[13px] font-semibold text-[#4A475C] ml-1">Username</label>
                <div className="relative flex items-center group">
                  <UserRound size={18} className="absolute left-4 text-[#A1A1B5] group-focus-within:text-[#7C3AED] transition-colors" />
                  <input 
                    id="username" autoComplete="username" placeholder="Choose a username" 
                    className="w-full h-[52px] bg-[#FAF8FF] border border-[#EBE8F4] rounded-[12px] pl-11 pr-4 text-[15px] text-[#05050D] placeholder-[#A1A1B5] focus:outline-none focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/10 focus:shadow-[0_0_10px_rgba(168,85,247,0.05)] transition-all focus:bg-white"
                    value={form.username} onChange={update('username')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-email" className="text-[13px] font-semibold text-[#4A475C] ml-1">Email</label>
                <div className="relative flex items-center group">
                  <Mail size={18} className="absolute left-4 text-[#A1A1B5] group-focus-within:text-[#7C3AED] transition-colors" />
                  <input 
                    id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" 
                    className="w-full h-[52px] bg-[#FAF8FF] border border-[#EBE8F4] rounded-[12px] pl-11 pr-4 text-[15px] text-[#05050D] placeholder-[#A1A1B5] focus:outline-none focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/10 focus:shadow-[0_0_10px_rgba(168,85,247,0.05)] transition-all focus:bg-white"
                    value={form.email} onChange={update('email')}
                  />
                </div>
              </div>

              <PasswordField id="signup-password" label="Password" placeholder="Create a password" value={form.password} show={show} setShow={setShow} onChange={update('password')} />
              <PasswordField id="confirm-password" label="Retype Password" placeholder="Create a password" value={form.confirm_password} show={show} setShow={setShow} onChange={update('confirm_password')} />
              
              <p className="text-[11px] text-[#77758A] leading-relaxed mt-1">Password must contain at least 8 characters, including a number and special character.</p>
              
              {form.password && (
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#77758A]">Password strength</span>
                  <span className={form.password.length>=8 && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? 'text-[#06B6D4] font-semibold flex items-center gap-1' : 'text-[#EC4899] font-semibold flex items-center gap-1'}>
                    {form.password.length>=8 && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? <><CheckCircle2 size={12}/> Strong</> : 'Needs improvement'}
                  </span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-[#EC4899]/10 border border-[#EC4899]/20 rounded-xl text-[#EC4899] text-[13px]" role="alert">
                  {error}
                </div>
              )}

              <button 
                className="w-full h-[54px] bg-gradient-to-r from-[#A855F7] to-[#EC4899] text-white text-[15px] font-bold rounded-[14px] transition-all duration-300 flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[2px] shadow-[0_8px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_12px_25px_rgba(168,85,247,0.35)] group" 
                disabled={loading}
              >
                {loading ? <><LoaderCircle className="animate-spin" size={18} /> Creating account...</> : <>Create Account <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>}
              </button>
            </form>
            
            <div className="flex items-center gap-3 my-7 text-[#A1A1B5] text-[11px] font-bold uppercase tracking-wider relative z-10">
              <div className="flex-1 h-px bg-[#EBE8F4]"></div>
              <span>OR</span>
              <div className="flex-1 h-px bg-[#EBE8F4]"></div>
            </div>
            
            <button 
              type="button" onClick={google} disabled={loading}
              className="relative z-10 w-full h-[52px] bg-white border border-[#EBE8F4] hover:bg-[#FAF8FF] hover:border-[#7C3AED]/30 text-[#4A475C] text-[14px] font-semibold rounded-[12px] transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-8 text-[14px] text-[#77758A]">
            Already have an account? <Link to="/login" className="text-[#A855F7] font-bold hover:text-[#EC4899] transition-colors">Log in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function PasswordField({id,label,placeholder,value,show,setShow,onChange}){
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-[#4A475C] ml-1">{label}</label>
      <div className="relative flex items-center group">
        <LockKeyhole size={18} className="absolute left-4 text-[#A1A1B5] group-focus-within:text-[#7C3AED] transition-colors" />
        <input 
          id={id} type={show?'text':'password'} autoComplete="new-password" placeholder={placeholder} 
          className="w-full h-[52px] bg-[#FAF8FF] border border-[#EBE8F4] rounded-[12px] pl-11 pr-12 text-[15px] text-[#05050D] placeholder-[#A1A1B5] focus:outline-none focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/10 focus:shadow-[0_0_10px_rgba(168,85,247,0.05)] transition-all focus:bg-white"
          value={value} onChange={onChange}
        />
        <button 
          type="button" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}
          className="absolute right-4 text-[#A1A1B5] hover:text-[#7C3AED] transition-colors p-1" 
        >
          {show?<EyeOff size={18}/>:<Eye size={18}/>}
        </button>
      </div>
    </div>
  )
}
