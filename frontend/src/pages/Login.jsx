import { useState, useMemo } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, LoaderCircle, ArrowRight } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signIn, signInWithGoogle, signInWithGithub } from '../features/auth/authService'
import LandingNavbar from '../components/landing/LandingNavbar'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Subtle background particles pre-generated
  const sparkles = useMemo(() => Array.from({ length: 12 }, () => ({
    width: Math.random() * 3 + 2,
    top: Math.random() * 100,
    left: Math.random() * 100,
    opacity: Math.random() * 0.4 + 0.2,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 3,
  })), [])

  if (localStorage.getItem('career_user')) return <Navigate to="/dashboard" replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.identifier.trim() || !form.password) {
      return setError('Enter your email and password.')
    }
    setLoading(true)
    try {
      await signIn({ identifier: form.identifier.trim(), password: form.password })
      if (rememberMe) {
        localStorage.setItem('career_remember', form.identifier.trim())
      } else {
        localStorage.removeItem('career_remember')
      }
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      setError(authError.message || 'Unable to sign in. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      setError(authError.message || 'Google sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGithubLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGithub()
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      setError(authError.message || 'GitHub sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen font-sans overflow-x-hidden flex flex-col relative"
      style={{ background: 'linear-gradient(135deg, #F9F5FC 0%, #C4A4DA 55%, #F9F5FC 100%)' }}
    >
      {/* 2. Existing Navbar at Top */}
      <LandingNavbar />

      {/* 3. Background Aesthetic and Decorative Concentric Circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Ambient Glows */}
        <div className="absolute top-[12%] -left-[8%] w-[550px] h-[550px] bg-[#ED96D7]/18 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] -right-[8%] w-[600px] h-[600px] bg-[#ED96D7]/24 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[30%] w-[450px] h-[450px] bg-[#7F5D99]/12 rounded-full blur-[130px]" />

        {/* Large, thin concentric circular outlines along both side edges */}
        <div className="hidden lg:block absolute -left-36 top-1/4 w-[500px] h-[500px] rounded-full border border-[#C4A4DA]/25 pointer-events-none" />
        <div className="hidden lg:block absolute -left-48 top-1/5 w-[650px] h-[650px] rounded-full border border-[#ED96D7]/20 pointer-events-none" />
        <div className="hidden lg:block absolute -right-36 top-1/3 w-[520px] h-[520px] rounded-full border border-[#C4A4DA]/25 pointer-events-none" />
        <div className="hidden lg:block absolute -right-48 top-1/4 w-[670px] h-[670px] rounded-full border border-[#ED96D7]/20 pointer-events-none" />

        {/* Small glowing pink dots / light particles */}
        {sparkles.map((s, i) => (
          <motion.div
            key={`sparkle-${i}`}
            animate={{ y: [0, -25, 0], opacity: [s.opacity * 0.4, s.opacity, s.opacity * 0.4] }}
            transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
            className="absolute rounded-full bg-[#ED96D7] shadow-[0_0_8px_#ED96D7]"
            style={{ width: `${s.width}px`, height: `${s.width}px`, top: `${s.top}%`, left: `${s.left}%` }}
          />
        ))}
      </div>

      {/* 4. Full-width Hero with Centered Login Card */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-[96px] pb-12 sm:pt-[106px] sm:pb-16 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[660px] bg-white/90 backdrop-blur-xl border border-[#C4A4DA]/45 shadow-[0_15px_50px_rgba(76,35,101,0.12),_0_0_25px_rgba(237,150,215,0.08)] rounded-[32px] p-8 sm:p-11 md:p-12"
        >
          {/* 5. Heading and Supporting Text */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold font-['Playfair_Display',_serif] tracking-tight mb-3 leading-tight">
              <span className="text-[#4C2365]">Welcome </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7F5D99] to-[#ED96D7]">
                Back
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#7F5D99] font-['Inter',_sans-serif] leading-relaxed max-w-md mx-auto">
              Login to your CareerTwin account and continue your career journey.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            {/* 6. Email Address Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="sr-only">
                Email Address
              </label>
              <div className="relative flex items-center group">
                <Mail size={20} className="absolute left-4 text-[#7F5D99] group-focus-within:text-[#4C2365] transition-colors" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email Address"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  className="w-full h-[58px] sm:h-[62px] bg-white/80 border border-[#C4A4DA]/50 rounded-[14px] pl-12 pr-4 text-base text-[#4C2365] placeholder-[#7F5D99]/60 focus:outline-none focus:border-[#4C2365] focus:ring-2 focus:ring-[#7F5D99]/15 transition-all focus:bg-white"
                />
              </div>
            </div>

            {/* 7. Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="sr-only">
                Password
              </label>
              <div className="relative flex items-center group">
                <LockKeyhole size={20} className="absolute left-4 text-[#7F5D99] group-focus-within:text-[#4C2365] transition-colors" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-[58px] sm:h-[62px] bg-white/80 border border-[#C4A4DA]/50 rounded-[14px] pl-12 pr-12 text-base text-[#4C2365] placeholder-[#7F5D99]/60 focus:outline-none focus:border-[#4C2365] focus:ring-2 focus:ring-[#7F5D99]/15 transition-all focus:bg-white"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#7F5D99] hover:text-[#4C2365] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 8. Remember Me and Forgot Password */}
            <div className="flex items-center justify-between my-1 px-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#C4A4DA] text-[#4C2365] focus:ring-[#7F5D99] accent-[#4C2365] cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-[#5F3A7A] font-medium">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm font-semibold text-[#4C2365] hover:text-[#ED96D7] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm font-medium" role="alert">
                {error}
              </div>
            )}

            {/* 9. Primary Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[58px] sm:h-[62px] bg-gradient-to-r from-[#4C2365] via-[#7B3A88] to-[#D64F9E] hover:from-[#3B1B50] hover:to-[#B83E88] text-white text-base sm:text-lg font-bold rounded-full transition-all duration-300 flex justify-center items-center gap-2 mt-2 shadow-[0_8px_25px_rgba(76,35,101,0.25)] hover:shadow-[0_12px_32px_rgba(76,35,101,0.38)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin" size={19} /> Logging in...
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* 10. Divider */}
          <div className="flex items-center gap-3 my-6 text-[#7F5D99] text-xs font-bold uppercase tracking-wider">
            <div className="flex-1 h-px bg-[#C4A4DA]/40" />
            <span>OR</span>
            <div className="flex-1 h-px bg-[#C4A4DA]/40" />
          </div>

          {/* 11. Google and GitHub Authentication */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-[50px] bg-white/80 border border-[#C4A4DA]/50 hover:bg-white hover:border-[#4C2365]/40 text-[#4C2365] text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 flex justify-center items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={loading}
              className="w-full h-[50px] bg-white/80 border border-[#C4A4DA]/50 hover:bg-white hover:border-[#4C2365]/40 text-[#4C2365] text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 flex justify-center items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0 fill-[#4C2365]" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* 12. Bottom Sign-Up Prompt */}
          <div className="flex items-center justify-center gap-1.5 mt-8 text-xs sm:text-sm text-[#7F5D99]">
            <span>Don't have an account?</span>
            <Link to="/signup" className="text-[#4C2365] font-bold hover:text-[#ED96D7] transition-colors">
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
