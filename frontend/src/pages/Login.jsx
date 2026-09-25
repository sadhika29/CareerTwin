import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('navya@example.com')
  const [error, setError] = useState('')
  if (localStorage.getItem('career_user')) return <Navigate to="/dashboard" replace />
  const submit = (event) => { event.preventDefault(); if (!email.includes('@')) return setError('Enter a valid email address.'); localStorage.setItem('career_user', 'demo-student'); navigate('/dashboard') }
  return <main style={{ minHeight:'100vh', display:'grid', placeItems:'center', padding:20, background:'#173b31' }}><form className="card" onSubmit={submit} style={{ width:'min(100%,420px)' }}><div className="brand" style={{ color:'var(--ink)', marginBottom:30 }}><span className="brand-mark">C</span> CareerTwin</div><div className="eyebrow">Welcome back</div><h1 className="page-title" style={{ fontSize:30 }}>Your next chapter starts here.</h1><p className="page-subtitle">Sign in to see your readiness and plan your next move.</p><div className="field"><label htmlFor="email">Email</label><input id="email" value={email} onChange={event=>setEmail(event.target.value)} type="email" /></div><button className="button" style={{ width:'100%', marginTop:18 }}>Continue</button>{error && <div className="notice error" style={{ marginTop:14 }}>{error}</div>}<p style={{ color:'var(--muted)', fontSize:12, marginTop:18 }}>Demo authentication is enabled until Firebase credentials are configured.</p></form></main>
}
