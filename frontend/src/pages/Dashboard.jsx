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
  const [state, setState] = useState('loading');

  const load = async () => {
    setState('loading');
    try {
      const [careerData, twinData] = await Promise.all([
        getCareerState().catch(() => null),
        getDigitalTwin().catch(() => null),
      ]);
      setCareer(careerData?.readiness_score != null ? careerData : demoCareer);
      setTwin(twinData);
      setState(careerData?.readiness_score != null ? 'ready' : 'demo');

      axiosClient.get('/dashboard/insight').then(res => {
        if (res.data?.ai_insight) setInsight(res.data.ai_insight);
      }).catch(() => {});
    } catch {
      setCareer(demoCareer);
      setState('demo');
    }
  };

  useEffect(() => { load(); }, []);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-heading font-bold text-text-primary">Loading CareerTwin...</h2>
      </div>
    );
  }

  const scores = twin ? {
    resume: twin.resume_score || twin.resume || demoScores.resume,
    dsa: twin.dsa_score || twin.dsa || demoScores.dsa,
    technical: twin.technical_score || twin.technical || demoScores.technical,
    interview: twin.interview_score || twin.interview || demoScores.interview,
    applications: 42 // placeholder for demo
  } : demoScores;
  
  const readiness = career?.readiness_score || twin?.overall_score || 78;

  const quickActions = [
    { label: 'Analyze Resume', icon: FileText, to: '/resume' },
    { label: 'Find Jobs', icon: BriefcaseBusiness, to: '/jobs' },
    { label: 'Practice Interview', icon: MessageSquareText, to: '/interview' },
    { label: 'Improve Skills', icon: Target, to: '/skills' },
    { label: 'Start Preparation', icon: BookOpen, to: '/preparation' },
    { label: 'Career Planner', icon: Map, to: '/what-if' },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">Good morning, Yamini 👋</h1>
        <p className="text-text-secondary text-base mb-4">Here's your career progress and what you can focus on today.</p>
        
        <div className="inline-flex items-center gap-2 bg-ai/10 border border-ai/20 text-ai px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-ai animate-pulse"></div>
          CareerTwin AI is ready
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Profile Completion', value: 92, icon: UserCheck, color: 'text-success', bg: 'bg-success/10', trend: '+5% this week' },
          { label: 'Resume Score', value: scores.resume, icon: FileText, color: 'text-primary', bg: 'bg-primary/10', trend: '+8% this month' },
          { label: 'Skills Progress', value: scores.technical, icon: Target, color: 'text-warning', bg: 'bg-warning/10', trend: '+12% this month' },
          { label: 'Interview Readiness', value: scores.interview, icon: MessageSquareText, color: 'text-error', bg: 'bg-error/10', trend: 'Needs focus' }
        ].map((kpi, idx) => (
          <Card key={idx} className="hover:-translate-y-1 transition-transform duration-200">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <kpi.icon size={20} className={kpi.color} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-semibold text-text-muted bg-background px-2 py-1 rounded-md border border-border">
                  {kpi.trend}
                </span>
              </div>
              <h3 className="text-3xl font-heading font-bold text-text-primary mb-1">{kpi.value}<span className="text-lg text-text-muted ml-0.5">%</span></h3>
              <p className="text-sm font-medium text-text-secondary">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* AI Insight Card */}
        <div className="lg:col-span-2">
          <Card className="h-full border-primary/20 bg-gradient-to-br from-background to-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <CardContent className="p-8 flex flex-col justify-center h-full relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-primary" />
                <h3 className="font-heading font-bold text-lg text-text-primary">CareerTwin AI</h3>
              </div>
              <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Your personalized career insight</h4>
              <p className="text-text-primary text-lg md:text-xl font-medium leading-relaxed mb-6 max-w-2xl">
                "Your profile is strong in full-stack development. Your biggest opportunity right now is improving DSA and SQL interview readiness."
              </p>
              <div>
                <Link to="/skills" className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-hover px-5 py-2.5 rounded-lg text-sm font-semibold transition-all">
                  View Skill Plan
                  <ArrowRight size={16} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Career Progress Section */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Career Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Progress label="Resume" value={scores.resume} colorClass="bg-primary" />
              <Progress label="Skills" value={scores.technical} colorClass="bg-success" />
              <Progress label="DSA" value={scores.dsa} colorClass="bg-warning" />
              <Progress label="Interview" value={scores.interview} colorClass="bg-error" />
              <Progress label="Applications" value={scores.applications} colorClass="bg-ai" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-heading font-bold text-text-primary mb-4">Continue your journey</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, idx) => (
            <Link key={idx} to={action.to} className="group">
              <Card className="h-full hover:-translate-y-1 hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-xl bg-background group-hover:bg-primary/10 transition-colors">
                    <action.icon size={24} className="text-text-secondary group-hover:text-primary transition-colors" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                  <ArrowUpRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
