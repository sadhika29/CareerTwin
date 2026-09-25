import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Navbar({ children }) { const [open,setOpen] = useState(false); const location = useLocation(); const title = location.pathname.split('/')[1] || 'dashboard'; return <div className="app-shell"><Sidebar open={open} onNavigate={() => setOpen(false)} /><main className="main"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Open navigation">☰</button><h1>{title.replace('-', ' ')}</h1><div className="user-chip"><span>Navya's workspace</span><span className="avatar">N</span></div></header>{children}</main></div> }
