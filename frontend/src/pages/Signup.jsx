import { useState, useMemo } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, LoaderCircle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithGoogle, signInWithGithub, signUp } from '../features/auth/authService'
import LandingNavbar from '../components/landing/LandingNavbar'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-generate background particles once
  const sparkles = useMemo(() => Array.from({ length: 12 }, () => ({
    width: Math.random() * 3 + 2,
    top: Math.random() * 100,
    left: Math.random() * 100,
    opacity: Math.random() * 0.4 + 0.2,
    duration: Math.random() * 4 + 4,
    delay: Math.random() * 3,
  })), [])

  if (localStorage.getItem('career_user')) return <Navigate to="/dashboard" replace />

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      return setError('Please fill out all fields.')
    }
    if (!agreeTerms) {
      return setError('You must agree to the Terms of Service and Privacy Policy to continue.')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters long.')
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.')
    }

    setLoading(true)
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`
      // Generate clean username from name/email
      const usernameBase = (form.firstName.trim() + form.lastName.trim()).toLowerCase().replace(/[^a-z0-9]/g, '')
      const username = usernameBase ? `${usernameBase}${Math.floor(100 + Math.random() * 900)}` : `user_${Date.now()}`

      await signUp({
        full_name: fullName,
        username,
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirmPassword
      })
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      setError(authError.message || 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      setError(authError.message || 'Google sign-up failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGithubSignUp = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGithub()
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      setError(authError.message || 'GitHub sign-up failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen font-sans overflow-x-hidden flex flex-col relative"
      style={{ background: 'linear-gradient(135deg, #F9F5FC 0%, #C4A4DA 55%, #F9F5FC 100%)' }}
    >
      {/* Existing Full-Width Navbar */}
      <LandingNavbar />

      {/* Decorative Atmospheric Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] left-[8%] w-[450px] h-[450px] bg-[#ED96D7]/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] right-[8%] w-[500px] h-[500px] bg-[#C4A4DA]/20 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[15%] w-[350px] h-[350px] bg-[#7F5D99]/10 rounded-full blur-[120px]" />

        {/* Subtle decorative circles */}
        <div className="hidden lg:block absolute -left-28 top-1/3 w-80 h-80 rounded-full border border-[#C4A4DA]/25 border-dashed" />
        <div className="hidden lg:block absolute -right-28 bottom-1/4 w-96 h-96 rounded-full border border-[#ED96D7]/20 border-dashed" />

        {/* Floating sparkles */}
        {sparkles.map((s, i) => (
          <motion.div
            key={`sparkle-${i}`}
            animate={{ y: [0, -25, 0], opacity: [s.opacity * 0.4, s.opacity, s.opacity * 0.4] }}
            transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
            className="absolute rounded-full bg-[#ED96D7]"
            style={{ width: s.width, height: s.width, top: `${s.top}%`, left: `${s.left}%` }}
          />
        ))}
      </div>

      {/* Main Content Area — Centered Sign-Up Card */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-[96px] pb-12 sm:pt-[106px] sm:pb-16 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[620px] bg-white/90 backdrop-blur-xl border border-[#C4A4DA]/40 shadow-[0_15px_45px_rgba(76,35,101,0.12),_0_0_25px_rgba(237,150,215,0.08)] rounded-[28px] p-6 sm:p-9 md:p-10"
        >
          {/* 4. Sign-Up Card Heading */}
          <div className="text-center mb-7">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold font-['Playfair_Display',_serif] text-[#4C2365] mb-2 leading-tight">
              Create Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7F5D99] to-[#ED96D7]">
                Account
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#7F5D99] font-['Inter',_sans-serif]">
              Join CareerTwin and take the first step towards a smarter career journey.
            </p>
          </div>

          {/* 5. Form Fields */}
          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            {/* First Row: First Name & Last Name (Side by side on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="first_name" className="text-[13px] font-semibold text-[#4C2365] ml-1">
                  First Name
                </label>
                <div className="relative flex items-center group">
                  <UserRound size={17} className="absolute left-3.5 text-[#7F5D99] group-focus-within:text-[#4C2365] transition-colors" />
                  <input
                    id="first_name"
                    type="text"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={update('firstName')}
                    className="w-full h-[48px] bg-white/80 border border-[#C4A4DA]/50 rounded-xl pl-10 pr-3 text-sm text-[#4C2365] placeholder-[#7F5D99]/50 focus:outline-none focus:border-[#4C2365] focus:ring-2 focus:ring-[#7F5D99]/15 transition-all focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="last_name" className="text-[13px] font-semibold text-[#4C2365] ml-1">
                  Last Name
                </label>
                <div className="relative flex items-center group">
                  <UserRound size={17} className="absolute left-3.5 text-[#7F5D99] group-focus-within:text-[#4C2365] transition-colors" />
                  <input
                    id="last_name"
                    type="text"
                    autoComplete="family-name"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={update('lastName')}
                    className="w-full h-[48px] bg-white/80 border border-[#C4A4DA]/50 rounded-xl pl-10 pr-3 text-sm text-[#4C2365] placeholder-[#7F5D99]/50 focus:outline-none focus:border-[#4C2365] focus:ring-2 focus:ring-[#7F5D99]/15 transition-all focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email" className="text-[13px] font-semibold text-[#4C2365] ml-1">
                Email Address
              </label>
              <div className="relative flex items-center group">
                <Mail size={17} className="absolute left-3.5 text-[#7F5D99] group-focus-within:text-[#4C2365] transition-colors" />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  className="w-full h-[48px] bg-white/80 border border-[#C4A4DA]/50 rounded-xl pl-10 pr-3 text-sm text-[#4C2365] placeholder-[#7F5D99]/50 focus:outline-none focus:border-[#4C2365] focus:ring-2 focus:ring-[#7F5D99]/15 transition-all focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-password" className="text-[13px] font-semibold text-[#4C2365] ml-1">
                Password
              </label>
              <div className="relative flex items-center group">
                <LockKeyhole size={17} className="absolute left-3.5 text-[#7F5D99] group-focus-within:text-[#4C2365] transition-colors" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={update('password')}
                  className="w-full h-[48px] bg-white/80 border border-[#C4A4DA]/50 rounded-xl pl-10 pr-11 text-sm text-[#4C2365] placeholder-[#7F5D99]/50 focus:outline-none focus:border-[#4C2365] focus:ring-2 focus:ring-[#7F5D99]/15 transition-all focus:bg-white"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#7F5D99] hover:text-[#4C2365] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-[13px] font-semibold text-[#4C2365] ml-1">
                Confirm Password
              </label>
              <div className="relative flex items-center group">
                <LockKeyhole size={17} className="absolute left-3.5 text-[#7F5D99] group-focus-within:text-[#4C2365] transition-colors" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  className="w-full h-[48px] bg-white/80 border border-[#C4A4DA]/50 rounded-xl pl-10 pr-11 text-sm text-[#4C2365] placeholder-[#7F5D99]/50 focus:outline-none focus:border-[#4C2365] focus:ring-2 focus:ring-[#7F5D99]/15 transition-all focus:bg-white"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-[#7F5D99] hover:text-[#4C2365] transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Password Requirement / Strength */}
            {form.password && (
              <div className="flex justify-between items-center text-[11px] px-1">
                <span className="text-[#7F5D99]">Password strength</span>
                <span
                  className={
                    form.password.length >= 8 && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password)
                      ? 'text-emerald-600 font-semibold flex items-center gap-1'
                      : 'text-[#ED96D7] font-semibold flex items-center gap-1'
                  }
                >
                  {form.password.length >= 8 && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? (
                    <>
                      <CheckCircle2 size={12} /> Strong
                    </>
                  ) : (
                    '8+ chars with number & symbol'
                  )}
                </span>
              </div>
            )}

            {/* 6. Terms and Conditions Checkbox */}
            <div className="flex items-start gap-2.5 mt-1 px-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#C4A4DA] text-[#4C2365] focus:ring-[#7F5D99] accent-[#4C2365] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-[#5F3A7A] leading-normal select-none cursor-pointer">
                I agree to the{' '}
                <a href="#" className="font-semibold text-[#4C2365] hover:text-[#ED96D7] underline transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-semibold text-[#4C2365] hover:text-[#ED96D7] underline transition-colors">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium" role="alert">
                {error}
              </div>
            )}

            {/* 7. Primary Sign-Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[50px] bg-gradient-to-r from-[#4C2365] to-[#7F5D99] hover:from-[#3B1B50] hover:to-[#6B4687] text-white text-sm font-bold rounded-full transition-all duration-300 flex justify-center items-center gap-2 mt-2 shadow-[0_6px_22px_rgba(76,35,101,0.25)] hover:shadow-[0_8px_30px_rgba(76,35,101,0.38)] hover:-translate-y-[1px] disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <LoaderCircle className="animate-spin" size={17} /> Creating account...
                </>
              ) : (
                <>
                  Sign Up <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* 8. Social Sign-Up Divider */}
          <div className="flex items-center gap-3 my-6 text-[#7F5D99] text-[11px] font-bold uppercase tracking-wider">
            <div className="flex-1 h-px bg-[#C4A4DA]/35" />
            <span>OR</span>
            <div className="flex-1 h-px bg-[#C4A4DA]/35" />
          </div>

          {/* 8. Social Sign-Up Buttons: Google & GitHub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full h-[46px] bg-white/80 border border-[#C4A4DA]/50 hover:bg-white hover:border-[#4C2365]/40 text-[#4C2365] text-xs sm:text-[13px] font-semibold rounded-full transition-all duration-200 flex justify-center items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
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
              onClick={handleGithubSignUp}
              disabled={loading}
              className="w-full h-[46px] bg-white/80 border border-[#C4A4DA]/50 hover:bg-white hover:border-[#4C2365]/40 text-[#4C2365] text-xs sm:text-[13px] font-semibold rounded-full transition-all duration-200 flex justify-center items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0 fill-[#4C2365]" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* 9. Login Link */}
          <div className="flex items-center justify-center gap-1.5 mt-7 text-xs sm:text-sm text-[#7F5D99]">
            <span>Already have an account?</span>
            <Link to="/login" className="text-[#4C2365] font-bold hover:text-[#ED96D7] transition-colors">
              Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
