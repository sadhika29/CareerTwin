import { useState } from 'react'
import { Mail, CheckCircle2, LoaderCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
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
    <AuthLayout 
      eyebrow="Account recovery" 
      title="Forgot Your Password?" 
      subtitle="Enter your email address and we'll help you reset your password." 
      footer={<Link to="/login" className="text-text-secondary hover:text-primary font-semibold flex items-center justify-center gap-2"><ArrowLeft size={16} /> Back to Sign In</Link>}
    >
      {success ? (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-success/5 border border-success/20 rounded-xl">
          <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Check your email</h2>
          <p className="text-sm text-text-secondary mb-6">We've sent password reset instructions to your registered email address.</p>
          <Link 
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20" 
            to="/login"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recovery-email" className="text-sm font-semibold text-text-secondary">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-3 text-text-muted" />
              <input 
                id="recovery-email" 
                type="email" 
                autoComplete="email" 
                placeholder="you@example.com" 
                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={email} 
                onChange={event => setEmail(event.target.value)}
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm" role="alert">
              {error}
            </div>
          )}
          
          <button 
            className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2" 
            disabled={loading}
          >
            {loading ? <><LoaderCircle className="animate-spin" size={18} /> Sending...</> : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
