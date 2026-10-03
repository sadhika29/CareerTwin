import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, LoaderCircle } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { signInWithGoogle, signUp } from '../features/auth/authService'

export default function Signup() { 
  const navigate=useNavigate(); 
  const [form,setForm]=useState({full_name:'',username:'',email:'',password:'',confirm_password:''}); 
  const [show,setShow]=useState(false); 
  const [error,setError]=useState(''); 
  const [loading,setLoading]=useState(false); 

  if(localStorage.getItem('career_user')) return <Navigate to="/dashboard" replace />; 

  const update=key=>event=>setForm({...form,[key]:event.target.value}); 
  
  const submit=async event=>{
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

  const google=async()=>{
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
    <AuthLayout 
      eyebrow="New to CareerTwin" 
      title="Create Your Account" 
      subtitle="Start building your personalized career journey." 
      footer={<>Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link></>}
    >
      <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="full_name" className="text-sm font-semibold text-text-secondary">Full Name</label>
          <div className="relative flex items-center">
            <UserRound size={18} className="absolute left-3 text-text-muted" />
            <input 
              id="full_name" 
              autoComplete="name" 
              placeholder="Your full name" 
              className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={form.full_name} 
              onChange={update('full_name')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-semibold text-text-secondary">Username</label>
          <div className="relative flex items-center">
            <UserRound size={18} className="absolute left-3 text-text-muted" />
            <input 
              id="username" 
              autoComplete="username" 
              placeholder="Choose a username" 
              className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={form.username} 
              onChange={update('username')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="signup-email" className="text-sm font-semibold text-text-secondary">Email</label>
          <div className="relative flex items-center">
            <Mail size={18} className="absolute left-3 text-text-muted" />
            <input 
              id="signup-email" 
              type="email" 
              autoComplete="email" 
              placeholder="you@example.com" 
              className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={form.email} 
              onChange={update('email')}
            />
          </div>
        </div>

        <PasswordField id="signup-password" label="Password" value={form.password} show={show} setShow={setShow} onChange={update('password')} />
        <PasswordField id="confirm-password" label="Retype Password" value={form.confirm_password} show={show} setShow={setShow} onChange={update('confirm_password')} />
        
        <p className="text-xs text-text-muted leading-relaxed -mt-2">Password must contain at least 8 characters, including a number and special character.</p>
        
        {form.password && (
          <div className="flex justify-between items-center text-xs -mt-1">
            <span className="text-text-muted">Password strength</span>
            <span className={form.password.length>=8 && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? 'text-success font-semibold' : 'text-warning font-semibold'}>
              {form.password.length>=8 && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? 'Strong' : 'Needs improvement'}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm" role="alert">
            {error}
          </div>
        )}

        <button 
          className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed" 
          disabled={loading}
        >
          {loading ? <><LoaderCircle className="animate-spin" size={18} /> Creating account...</> : 'Create Account'}
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

function PasswordField({id,label,value,show,setShow,onChange}){
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-text-secondary">{label}</label>
      <div className="relative flex items-center">
        <LockKeyhole size={18} className="absolute left-3 text-text-muted" />
        <input 
          id={id} 
          type={show?'text':'password'} 
          autoComplete="new-password" 
          placeholder="Create a password" 
          className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          value={value} 
          onChange={onChange}
        />
        <button 
          type="button" 
          className="absolute right-3 text-text-muted hover:text-text-primary transition-colors p-1" 
          aria-label={show?'Hide password':'Show password'} 
          onClick={()=>setShow(!show)}
        >
          {show?<EyeOff size={16}/>:<Eye size={16}/>}
        </button>
      </div>
    </div>
  )
}
