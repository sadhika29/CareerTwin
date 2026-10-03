import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, LoaderCircle } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { signIn, signInWithGoogle } from '../features/auth/authService'

export default function Login() {
  const navigate = useNavigate(); 
  const [form, setForm] = useState({identifier:'',password:''}); 
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem('career_user')) return <Navigate to="/dashboard" replace />;

  const submit = async event => { 
    event.preventDefault(); 
    setError(''); 
    if (!form.identifier.trim() || !form.password) return setError('Enter your username or email and password.'); 
    setLoading(true); 
    try { 
      await signIn({ identifier: form.identifier.trim(), password: form.password }); 
      navigate('/dashboard', { replace:true }) 
    } catch (authError) { 
      setError(authError.message) 
    } finally { 
      setLoading(false) 
    } 
  };

  const google = async () => { 
    setError(''); 
    setLoading(true); 
    try { 
      await signInWithGoogle(); 
      navigate('/dashboard', { replace:true }) 
    } catch (authError) { 
      setError(authError.message) 
    } finally { 
      setLoading(false) 
    } 
  };

  return (
    <AuthLayout 
      eyebrow="Welcome back" 
      title="Welcome Back" 
      subtitle="Sign in to continue your career journey." 
      footer={<>Don't have an account? <Link to="/signup" className="text-primary font-semibold hover:underline">Create an account</Link></>}
    >
      <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="identifier" className="text-sm font-semibold text-text-secondary">Username or Email</label>
          <div className="relative flex items-center">
            <Mail size={18} className="absolute left-3 text-text-muted" />
            <input 
              id="identifier" 
              autoComplete="username" 
              placeholder="you@example.com" 
              className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={form.identifier} 
              onChange={event=>setForm({...form,identifier:event.target.value})} 
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-text-secondary">Password</label>
          <div className="relative flex items-center">
            <LockKeyhole size={18} className="absolute left-3 text-text-muted" />
            <input 
              id="password" 
              type={showPassword ? 'text' : 'password'} 
              autoComplete="current-password" 
              placeholder="Enter your password" 
              className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={form.password} 
              onChange={event=>setForm({...form,password:event.target.value})} 
            />
            <button 
              type="button" 
              className="absolute right-3 text-text-muted hover:text-text-primary transition-colors p-1" 
              aria-label={showPassword ? 'Hide password' : 'Show password'} 
              onClick={()=>setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end mt-1">
            <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Forgot Password?</Link>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm" role="alert">
            {error}
          </div>
        )}
        
        <button 
          className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed" 
          disabled={loading}
        >
          {loading ? <><LoaderCircle className="animate-spin" size={18} /> Signing in...</> : 'Sign In'}
        </button>
      </form>
      
      <div className="flex items-center gap-3 my-6 text-text-muted text-xs font-bold uppercase">
        <div className="flex-1 h-px bg-border"></div>
        <span>OR</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>
      
      <button 
        type="button" 
        onClick={google} 
        disabled={loading}
        className="w-full bg-white border border-border hover:bg-background text-text-primary font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </AuthLayout>
  )
}
