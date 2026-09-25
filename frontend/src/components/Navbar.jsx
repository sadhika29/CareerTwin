import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Navbar({ children }) { const [open,setOpen] = useState(false); const location = useLocation(); const title = location.pathname.split('/')[1] || 'dashboard'; return <div className="app-shell"><Sidebar open={open} onNavigate={() => setOpen(false)} /><main className="main"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Open navigation"><Menu size={21} /></button><h1>{title.replace('-', ' ')}</h1><div className="user-chip"><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><span className="workspace-label">Navya's workspace</span><Link to="/profile" className="avatar" aria-label="Open profile">N</Link></div></header>{children}</main></div> }
