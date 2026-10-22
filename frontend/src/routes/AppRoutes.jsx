import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
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
import Settings from '../pages/Settings'
import Login from '../pages/Login'
import Applications from '../pages/Applications'
import Signup from '../pages/Signup'
import ForgotPassword from '../pages/ForgotPassword'

function ProtectedRoutes() { return <DashboardLayout><Routes><Route path="/dashboard" element={<Dashboard />} /><Route path="/profile" element={<Profile />} /><Route path="/settings" element={<Settings />} /><Route path="/resume" element={<Resume />} /><Route path="/jobs" element={<Jobs />} /><Route path="/jobs/:id" element={<JobDetails />} /><Route path="/applications" element={<Applications />} /><Route path="/career" element={<DigitalTwin />} /><Route path="/skills" element={<SkillGaps />} /><Route path="/digital-twin" element={<DigitalTwin />} /><Route path="/preparation" element={<Preparation />} /><Route path="/assessment" element={<Assessment />} /><Route path="/performance" element={<Performance />} /><Route path="/interview" element={<Interview />} /><Route path="/what-if" element={<WhatIfPlanner />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></DashboardLayout> }

function AuthenticatedApp() { return localStorage.getItem('career_user') ? <ProtectedRoutes /> : <Navigate to="/login" replace /> }

import Home from '../pages/Home'

export default function AppRoutes() { return <Routes><Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/*" element={<AuthenticatedApp />} /></Routes> }
