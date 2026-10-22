import { useEffect, useState } from 'react';
import { getDigitalTwin, getReadinessHistory } from '../features/career/careerService';
import axiosClient from '../api/axiosClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { Sparkles, BrainCircuit, Target, Code, Briefcase, FileText, MessageSquareText } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

export default function DigitalTwin() {
  const [twin, setTwin] = useState(null);
  const [history, setHistory] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDigitalTwin().catch(() => null),
      getReadinessHistory().catch(() => []),
      axiosClient.get('/dashboard/insight').catch(() => null),
    ]).then(([twinData, historyData, insightRes]) => {
      setTwin(twinData);
      setHistory(Array.isArray(historyData) ? historyData : []);
      if (insightRes?.data?.ai_insight) setInsight(insightRes.data.ai_insight);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#E4D5F3] border-t-[#542477] rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-heading font-bold text-[#27113D]">Syncing your Digital Twin...</h2>
      </div>
    );
  }

  const scores = {
    resume: twin?.resume_score ?? twin?.resume ?? 0,
    experience: twin?.job_match_score ?? twin?.job_match ?? 0,
    dsa: twin?.dsa_score ?? twin?.dsa ?? 0,
    projects: twin?.aptitude_score ?? twin?.aptitude ?? 0,
    skills: twin?.technical_score ?? twin?.technical ?? 0,
    interview: twin?.interview_score ?? twin?.interview ?? 0,
  };

  const overallScore = Math.round(
    twin?.overall_score ?? 0
  );

  const radarData = [
    { area: 'Skills', value: scores.skills, fullMark: 100 },
    { area: 'Experience', value: scores.experience, fullMark: 100 },
    { area: 'Projects', value: scores.projects, fullMark: 100 },
    { area: 'Resume', value: scores.resume, fullMark: 100 },
    { area: 'Interview', value: scores.interview, fullMark: 100 },
    { area: 'DSA', value: scores.dsa, fullMark: 100 },
  ];

  const trendData = history.length > 0 
    ? history.map((h, i) => ({ name: `Snapshot ${i + 1}`, value: Math.round(h.overall_score || 0) }))
    : [
        { name: 'Initial', value: overallScore },
        { name: 'Current', value: overallScore }
      ];

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
          Your Career Twin
          <Sparkles size={24} className="text-ai" />
        </h1>
        <p className="text-text-secondary text-base">An AI-powered representation of your career readiness.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Central Profile Visualization */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          <Card className="relative overflow-hidden bg-gradient-to-br from-background to-primary/5 h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
            <CardContent className="p-8 lg:p-12 relative z-10 flex flex-col items-center justify-center min-h-[400px]">
              
              {/* Radial Center */}
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center mb-8">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-white shadow-sm" strokeWidth="8" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-border" strokeWidth="2" />
                  <circle 
                    cx="50" cy="50" r="46" fill="none" 
                    stroke="currentColor" strokeWidth="6" 
                    strokeDasharray="289" 
                    strokeDashoffset={289 - (289 * overallScore) / 100} 
                    strokeLinecap="round"
                    className="text-primary transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(108,99,255,0.4)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-4 shadow-subtle border border-primary/10">
                  <span className="text-4xl sm:text-5xl font-heading font-black text-text-primary bg-clip-text text-transparent bg-gradient-to-br from-primary to-ai">
                    {overallScore}%
                  </span>
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest mt-1">Ready</span>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">Target Role</h3>
                <h2 className="text-2xl font-heading font-bold text-text-primary">Full Stack Developer</h2>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Surrounding Metrics Breakdown */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {[
            { label: 'Skills', score: scores.skills, icon: BrainCircuit, color: 'text-success', bg: 'bg-success' },
            { label: 'Experience', score: scores.experience, icon: Briefcase, color: 'text-primary', bg: 'bg-primary' },
            { label: 'Projects', score: scores.projects, icon: Code, color: 'text-warning', bg: 'bg-warning' },
            { label: 'Resume', score: scores.resume, icon: FileText, color: 'text-ai', bg: 'bg-ai' },
            { label: 'Interview', score: scores.interview, icon: MessageSquareText, color: 'text-error', bg: 'bg-error' },
            { label: 'DSA', score: scores.dsa, icon: Target, color: 'text-orange-500', bg: 'bg-orange-500' },
          ].map((metric, idx) => (
            <Card key={idx} className="border border-border/50 hover:border-border transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${metric.bg}/10`}>
                  <metric.icon size={20} className={metric.color} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-text-primary">{metric.label}</span>
                    <span className="text-sm font-bold text-text-primary">{metric.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${metric.bg}`}
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Skill Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.2)" />
                  <PolarAngleAxis dataKey="area" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}
                    itemStyle={{ color: '#6c63ff', fontWeight: 600 }}
                  />
                  <Radar name="Readiness" dataKey="value" stroke="#6c63ff" fill="#6c63ff" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Trajectory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis domain={[40, 100]} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)' }}
                    itemStyle={{ color: '#06b6d4', fontWeight: 600 }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
