import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import Dashboard from '../pages/Dashboard'
import Profile from '../pages/Profile'
import Resume from '../pages/Resume'
import Jobs from '../pages/Jobs'
import JobDetails from '../pages/JobDetails'
import SkillGaps from '../pages/SkillGaps'
import Skills from '../pages/Skills'
import DigitalTwin from '../pages/DigitalTwin'
import Assessment from '../pages/Assessment'
import Interview from '../pages/Interview'
import Settings from '../pages/Settings'
import Login from '../pages/Login'
import Applications from '../pages/Applications'
import Signup from '../pages/Signup'
import ForgotPassword from '../pages/ForgotPassword'
import Home from '../pages/Home'
import ErrorBoundary from '../components/ErrorBoundary'
import { saveRedirectPath, isValidRedirectPath } from '../features/auth/authRedirect'

function ProtectedRoutes() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Resume Analysis / Builder */}
        <Route path="/resume" element={<Resume />} />
        <Route path="/resume-analysis" element={<Resume />} />
        <Route path="/resume-builder" element={<Resume />} />

        {/* Job Tracking & Matching */}
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/job-matching" element={<Jobs />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/job-tracking" element={<Navigate to="/jobs" replace />} />

        {/* Career Planning & Digital Twin */}
        <Route path="/career" element={<DigitalTwin />} />
        <Route path="/career-planning" element={<DigitalTwin />} />
        <Route path="/digital-twin" element={<DigitalTwin />} />
        <Route path="/roadmap" element={<DigitalTwin />} />
        <Route path="/what-if" element={<Navigate to="/dashboard" replace />} />

        {/* Skills Management & Practice */}
        <Route path="/skills" element={<Skills />} />
        <Route path="/skill-gaps" element={<SkillGaps />} />
        <Route path="/skill-gap-analysis" element={<SkillGaps />} />

        {/* Assessment, DSA & Skills Practice */}
        <Route path="/preparation" element={<Navigate to="/skills" replace />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/skills-assessment" element={<Assessment />} />
        <Route path="/dsa-practice" element={<Assessment />} />
        <Route path="/performance" element={<Navigate to="/dashboard" replace />} />

        {/* Interview Preparation */}
        <Route path="/interview" element={<ErrorBoundary><Interview /></ErrorBoundary>} />
        <Route path="/interview-prep" element={<ErrorBoundary><Interview /></ErrorBoundary>} />
        <Route path="/interview-preparation" element={<ErrorBoundary><Interview /></ErrorBoundary>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

function AuthenticatedApp() {
  const location = useLocation()
  const isAuthenticated = Boolean(
    localStorage.getItem('career_user') ||
    localStorage.getItem('user_id') ||
    localStorage.getItem('career_auth_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('career_user')
  )

  if (!isAuthenticated) {
    const intendedPath = location.pathname + location.search
    if (isValidRedirectPath(intendedPath)) {
      saveRedirectPath(intendedPath)
      return (
        <Navigate
          to={`/login?returnTo=${encodeURIComponent(intendedPath)}`}
          state={{ from: intendedPath }}
          replace
        />
      )
    }
    return <Navigate to="/login" replace />
  }

  return <ProtectedRoutes />
}

export default function AppRoutes({ user, authLoading = false }) {
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7FD]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#E4D5F3] border-t-[#542477] rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#8A7A9E]">Authenticating CareerTwin...</p>
        </div>
      </div>
    )
  }

  // If user prop is explicitly passed (e.g., from auth context/prop), use it directly
  if (user) {
    return <ProtectedRoutes />
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/*" element={<AuthenticatedApp />} />
    </Routes>
  )
}
