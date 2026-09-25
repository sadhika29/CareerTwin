import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Dashboard from '../pages/Dashboard'
import Profile from '../pages/Profile'
import Resume from '../pages/Resume'
import Jobs from '../pages/Jobs'
import JobDetails from '../pages/JobDetails'
import SkillGaps from '../pages/SkillGaps'
import DigitalTwin from '../pages/DigitalTwin'
import Preparation from '../pages/Preparation'
import Assessment from '../pages/Assessment'
import Performance from '../pages/Performance'
import Interview from '../pages/Interview'
import WhatIfPlanner from '../pages/WhatIfPlanner'
import Login from '../pages/Login'

function ProtectedRoutes() { return <Navbar><Routes><Route path="/dashboard" element={<Dashboard />} /><Route path="/profile" element={<Profile />} /><Route path="/resume" element={<Resume />} /><Route path="/jobs" element={<Jobs />} /><Route path="/jobs/:id" element={<JobDetails />} /><Route path="/skills" element={<SkillGaps />} /><Route path="/digital-twin" element={<DigitalTwin />} /><Route path="/preparation" element={<Preparation />} /><Route path="/assessment" element={<Assessment />} /><Route path="/performance" element={<Performance />} /><Route path="/interview" element={<Interview />} /><Route path="/what-if" element={<WhatIfPlanner />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></Navbar> }

export default function AppRoutes() { return localStorage.getItem('career_user') ? <ProtectedRoutes /> : <Routes><Route path="/login" element={<Login />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes> }
