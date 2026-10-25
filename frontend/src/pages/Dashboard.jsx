import { useEffect, useState } from 'react';
import { getCareerState, getDigitalTwin, demoCareer } from '../features/career/careerService';
import axiosClient from '../api/axiosClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, UserCheck, FileText, Target, MessageSquareText,
  Search, BriefcaseBusiness, BookOpen, Map, ArrowUpRight
} from 'lucide-react';

const demoScores = { resume: 82, ats: 78, job_match: 76, dsa: 61, aptitude: 74, technical: 70, communication: 72, interview: 65, overall: 78 };

export default function Dashboard() {
  const [career, setCareer] = useState(null);
  const [twin, setTwin] = useState(null);
  const [insight, setInsight] = useState(null);
  const [stats, setStats] = useState(null);
  const [userName, setUserName] = useState('');
  const [state, setState] = useState('loading');

  const load = async () => {
    setState('loading');
    try {
      const storedName = localStorage.getItem('career_name') || localStorage.getItem('career_user') || 'Student';
      setUserName(storedName);

      const [careerData, twinData, statsRes] = await Promise.all([
        getCareerState().catch(() => null),
        getDigitalTwin().catch(() => null),
        axiosClient.get('/dashboard/stats').catch(() => null),
      ]);
      setCareer(careerData);
      setTwin(twinData);
      if (statsRes?.data) setStats(statsRes.data);
      setState('ready');

      axiosClient.get('/dashboard/insight').then(res => {
        if (res.data?.ai_insight) setInsight(res.data.ai_insight);
      }).catch(() => {});
    } catch {
      setState('ready');
    }
  };

  useEffect(() => { load(); }, []);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#E4D5F3] border-t-[#542477] rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-heading font-bold text-[#27113D]">Loading CareerTwin...</h2>
      </div>
    );
  }

  const scores = {
    resume: stats?.resume_ats_score ?? twin?.resume_score ?? twin?.resume ?? 0,
    dsa: twin?.dsa_score ?? twin?.dsa ?? 0,
    technical: stats?.skills_progress ?? twin?.technical_score ?? twin?.technical ?? 0,
    interview: stats?.interview_readiness ?? twin?.interview_score ?? twin?.interview ?? 0,
    applications: stats?.total_applications ?? 0
  };
  
  const readiness = stats?.overall_readiness ?? career?.readiness_score ?? twin?.overall_score ?? 0;

  const quickActions = [
    { label: 'Analyze Resume', icon: FileText, to: '/resume' },
    { label: 'Find Jobs', icon: BriefcaseBusiness, to: '/jobs' },
    { label: 'Practice Interview', icon: MessageSquareText, to: '/interview' },
    { label: 'Improve Skills', icon: Target, to: '/skills' },
    { label: 'Start Preparation', icon: BookOpen, to: '/preparation' },
    { label: 'Career Planner', icon: Map, to: '/what-if' },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-8">
      {/* Dashboard Header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
          <div className="w-2 h-2 rounded-full bg-[#D83CC5] animate-pulse"></div>
          CareerTwin AI Active Companion
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D] tracking-tight">
          Welcome back, <span className="font-['Playfair_Display',_serif] text-[#542477]">{userName || 'Student'}</span> 👋
        </h1>
        <p className="text-[#78678C] text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
          Here is your real-time career intelligence overview and prioritized recommendations for today.
        </p>
      </div>

      {/* KPI Row - 4 Coordinated Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            label: 'Profile Completion', 
            value: stats?.profile_completion ?? 0, 
            icon: UserCheck, 
            color: 'text-[#16A34A]', 
            bg: 'bg-[#ECFDF5]', 
            border: 'border-[#BBF7D0]', 
            trend: (stats?.profile_completion ?? 0) >= 80 ? 'Profile complete' : 'Setup pending' 
          },
          { 
            label: 'Resume ATS Score', 
            value: scores.resume, 
            icon: FileText, 
            color: 'text-[#542477]', 
            bg: 'bg-[#F3E9FF]', 
            border: 'border-[#E4D5F3]', 
            trend: scores.resume > 0 ? 'Verified' : 'Upload resume' 
          },
          { 
            label: 'Skills Progress', 
            value: scores.technical, 
            icon: Target, 
            color: 'text-[#D97706]', 
            bg: 'bg-[#FFFBEB]', 
            border: 'border-[#FDE68A]', 
            trend: `${stats?.skills_count ?? 0} listed` 
          },
          { 
            label: 'Interview Readiness', 
            value: scores.interview, 
            icon: MessageSquareText, 
            color: 'text-[#E11D48]', 
            bg: 'bg-[#FFF1F2]', 
            border: 'border-[#FECDD3]', 
            trend: scores.interview > 0 ? 'Evaluated' : 'Needs mock test' 
          }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className="bg-white/95 backdrop-blur-sm rounded-2xl border border-[#E4D5F3] p-5.5 shadow-[0_4px_20px_rgba(84,36,119,0.04)] hover:-translate-y-1 hover:border-[#D6C2EB] hover:shadow-[0_8px_25px_rgba(84,36,119,0.08)] transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-3.5">
              <div className={`p-2.5 rounded-xl ${kpi.bg} border ${kpi.border}`}>
                <kpi.icon size={20} className={kpi.color} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-semibold text-[#78678C] bg-[#FAF7FD] px-2 py-0.5 rounded-md border border-[#E4D5F3]">
                {kpi.trend}
              </span>
            </div>
            <h3 className="text-3xl font-extrabold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D] mb-1">
              {kpi.value}<span className="text-lg text-[#8A7A9E] ml-0.5">%</span>
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[#78678C]">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Insight and Career Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insight Card */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-[#E4D5F3] bg-gradient-to-br from-[#FBF8FF] via-white to-[#F3E9FF]/50 p-6 sm:p-8 shadow-[0_4px_20px_rgba(84,36,119,0.05)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#ED96D7]/12 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#542477] text-white flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-[#27113D]">CareerTwin Copilot Insight</h3>
              </div>
              <span className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider block mb-2">
                Personalized Career Diagnosis
              </span>
              <p className="text-[#27113D] text-base sm:text-lg font-medium leading-relaxed mb-6 max-w-2xl">
                {typeof insight === 'object' && insight?.summary ? insight.summary : (typeof insight === 'string' ? insight : "Upload your resume and complete assessments to view your live AI career readiness diagnosis.")}
              </p>
            </div>

            <div className="relative z-10 pt-2">
              <Link 
                to="/skills" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white hover:opacity-95 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-[0_4px_15px_rgba(84,36,119,0.25)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <span>View Skill Plan</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Career Progress Section */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-2xl border border-[#E4D5F3] bg-white p-6 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base sm:text-lg font-bold text-[#27113D]">Career Progress</h2>
                <span className="text-xs font-bold text-[#542477] bg-[#F3E9FF] px-2.5 py-0.5 rounded-full">
                  Overall {readiness}%
                </span>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Resume ATS', value: scores.resume, color: 'from-[#542477] to-[#7951D1]' },
                  { label: 'Technical Skills', value: scores.technical, color: 'from-[#16A34A] to-[#22C55E]' },
                  { label: 'DSA Algorithms', value: scores.dsa, color: 'from-[#D97706] to-[#F59E0B]' },
                  { label: 'Mock Interview', value: scores.interview, color: 'from-[#E11D48] to-[#F43F5E]' },
                  { label: 'Application Pace', value: scores.applications || 42, color: 'from-[#542477] to-[#D83CC5]' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#27113D]">{item.label}</span>
                      <span className="text-[#78678C]">{item.value}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#F3E9FF] rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D] mb-4">
          Continue your journey
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, idx) => (
            <Link key={idx} to={action.to} className="group relative">
              <div className="h-full bg-white rounded-2xl border border-[#E4D5F3] p-5 flex flex-col items-center text-center gap-3 shadow-xs hover:-translate-y-1 hover:border-[#D6C2EB] hover:shadow-[0_8px_25px_rgba(84,36,119,0.08)] transition-all duration-200">
                <div className="p-3 rounded-2xl bg-[#FBF8FF] border border-[#E4D5F3]/50 group-hover:bg-[#F3E9FF] group-hover:border-[#E4D5F3] transition-colors">
                  <action.icon size={22} className="text-[#78678C] group-hover:text-[#542477] transition-colors" strokeWidth={1.75} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-[#27113D] group-hover:text-[#542477] transition-colors">
                  {action.label}
                </span>
                <ArrowUpRight size={15} className="text-[#8A7A9E] opacity-0 group-hover:opacity-100 transition-opacity absolute top-3.5 right-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
