import { Link } from 'react-router-dom'

export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) { return <main className="auth-shell"><section className="auth-card"><Link to="/login" className="auth-brand"><span className="brand-mark">C</span><span>CareerTwin</span></Link><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>{children}{footer && <div className="auth-footer">{footer}</div>}</section></main> }
