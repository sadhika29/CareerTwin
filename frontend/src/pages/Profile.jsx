import { useState, useEffect } from 'react';
import {
  BriefcaseBusiness, GraduationCap, LogOut, Pencil, ShieldCheck, UserRound,
  Sparkles, CheckCircle2, ArrowRight, RefreshCw, BookmarkCheck, Target, Lightbulb,
  Building, MapPin, Mail, Sparkles as SparkleIcon, BrainCircuit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../features/auth/authService';
import { getProfile, updateProfile, runAIProfileAdvisor, applyAIPersona } from '../features/profile/profileService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Loading from '../components/Loading';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    target_role: '',
    education: '',
    graduation_year: '',
    skills_text: '',
    interests: '',
    dream_companies_text: '',
    bio: ''
  });

  // AI Career Advisor interactive state
  const [advisorInput, setAdvisorInput] = useState('');
  const [analyzingAdvisor, setAnalyzingAdvisor] = useState(false);
  const [advisorResult, setAdvisorResult] = useState(null);
  const [applyingPersona, setApplyingPersona] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      if (data && data.profile) {
        setProfile(data.profile);
        populateForm(data.profile);
      }
    } catch (err) {
      console.warn('Could not load profile from backend, using baseline:', err);
      const fallback = {
        full_name: 'Navya Sharma',
        username: 'navya',
        email: 'navya@example.com',
        target_role: 'Full Stack Engineer',
        education: 'B.Tech Computer Science & Engineering',
        graduation_year: '2027',
        skills: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'Git'],
        interests: 'Scalable cloud distributed systems, modern AI-native applications, web performance',
        dream_companies: ['Google', 'Stripe', 'Microsoft', 'Atlassian'],
        bio: 'Passionate engineering student building high-performance web applications and mastering distributed systems.',
        ai_persona: {
          career_persona_title: 'Aspiring Full Stack & Cloud Systems Engineer',
          executive_summary: 'High-potential software engineering student combining strong Python/React full-stack acumen with deep passion for distributed cloud architecture.',
          elevator_pitch: 'I build robust, full-stack web applications with Python, FastAPI, and React, focusing on resilient system architecture and seamless user experiences.',
          top_priority_skills: ['System Design', 'Docker', 'PostgreSQL', 'FastAPI', 'React'],
          immediate_actions: [
            { action: 'Simulate technical architecture mock interview', impact: 'Critical', timeframe: 'This week' },
            { action: 'Complete Docker containerization project', impact: 'High', timeframe: 'Next 7 days' }
          ]
        }
      };
      setProfile(fallback);
      populateForm(fallback);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (p) => {
    setForm({
      full_name: p.full_name || '',
      username: p.username || '',
      email: p.email || '',
      target_role: p.target_role || '',
      education: p.education || '',
      graduation_year: p.graduation_year || '',
      skills_text: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ''),
      interests: p.interests || '',
      dream_companies_text: Array.isArray(p.dream_companies) ? p.dream_companies.join(', ') : '',
      bio: p.bio || ''
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage('');

    const updated = {
      full_name: form.full_name,
      username: form.username,
      email: form.email,
      target_role: form.target_role,
      education: form.education,
      graduation_year: form.graduation_year,
      skills: form.skills_text.split(',').map(s => s.trim()).filter(Boolean),
      interests: form.interests,
      dream_companies: form.dream_companies_text.split(',').map(s => s.trim()).filter(Boolean),
      bio: form.bio,
    };

    try {
      const res = await updateProfile(updated);
      setProfile(res.profile || updated);
      setEditing(false);
      setSavedMessage('Profile updated and synchronized with your Career Twin.');
    } catch {
      setProfile(updated);
      setEditing(false);
      setSavedMessage('Profile updated locally.');
    } finally {
      setSaving(false);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const handleRunAdvisor = async () => {
    if (!advisorInput.trim()) return;
    setAnalyzingAdvisor(true);
    try {
      const res = await runAIProfileAdvisor(advisorInput, profile);
      setAdvisorResult(res);
    } catch (err) {
      console.warn('AI Advisor error:', err);
      // Client fallback simulation
      setAdvisorResult({
        intent_analysis: {
          predicted_target_role: profile?.target_role || 'Full Stack Engineer',
          underlying_intention: `Transition towards high-impact systems engineering based on your aspirations: "${advisorInput}"`,
          ambition_level: 'Specialized Lead',
          implicit_strengths: ['Algorithmic Thinking', 'Technical Curiosity', 'Rapid Learning'],
          career_archetype: 'Systems Architect'
        },
        roadmap: {
          milestones: [
            { phase: 'Phase 1: Foundations', focus: 'Data structures, algorithms & cloud basics', key_deliverable: 'Complete 30 core algorithmic patterns' },
            { phase: 'Phase 2: Production Systems', focus: 'Microservices, Docker & caching layers', key_deliverable: 'Deploy distributed full-stack application' },
            { phase: 'Phase 3: Interview Mastery', focus: 'System design & behavioral rounds', key_deliverable: 'Pass 5 mock technical interview loops' }
          ]
        },
        executive_persona: {
          career_persona_title: `High-Performance ${profile?.target_role || 'Full Stack Engineer'}`,
          executive_summary: `Engineered for modern software complexity. Combines strong full-stack proficiency with deep curiosity for scalable systems architecture.`,
          elevator_pitch: `I specialize in building resilient full stack services with Python, React, and cloud-native architecture, delivering reliable solutions from database to user interface.`,
          top_priority_skills: ['System Design', 'Docker', 'PostgreSQL', 'FastAPI', 'Distributed Caching'],
          immediate_actions: [
            { action: 'Practice 2 technical mock interviews in CareerTwin', impact: 'Critical', timeframe: 'Next 3 days' },
            { action: 'Review weak topics in DSA assessment', impact: 'High', timeframe: 'This weekend' }
          ]
        }
      });
    } finally {
      setAnalyzingAdvisor(false);
    }
  };

  const handleApplyPersona = async () => {
    setApplyingPersona(true);
    try {
      const res = await applyAIPersona();
      if (res && res.profile) {
        setProfile(res.profile);
        populateForm(res.profile);
      }
      setSavedMessage('AI Persona recommendations successfully adopted into your active profile.');
    } catch {
      if (advisorResult?.executive_persona) {
        const p = { ...profile };
        if (advisorResult.executive_persona.target_role) {
          p.target_role = advisorResult.executive_persona.target_role;
        }
        if (advisorResult.executive_persona.top_priority_skills) {
          p.skills = Array.from(new Set([...(p.skills || []), ...advisorResult.executive_persona.top_priority_skills]));
        }
        setProfile(p);
        populateForm(p);
      }
      setSavedMessage('AI recommendations adopted locally.');
    } finally {
      setApplyingPersona(false);
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const logout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loading />
      <p className="mt-4 text-text-muted font-medium">Loading career profile...</p>
    </div>
  );

  const persona = profile?.ai_persona;

  return (
    <div className="animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      
      {/* Header section */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
            Your Career Profile
          </h1>
          <p className="text-text-secondary text-base">
            Manage your profile, target roles, and AI Career Twin persona.
          </p>
        </div>
        {!editing && (
          <button 
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white font-semibold rounded-xl transition-all shadow-sm"
            onClick={() => setEditing(true)}
          >
            <Pencil size={16} /> Edit Profile
          </button>
        )}
      </div>

      {savedMessage && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-success/10 border border-success/20 text-success-hover rounded-xl shadow-sm animate-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="text-success" />
          <span className="font-medium text-sm">{savedMessage}</span>
        </div>
      )}

      {/* Profile Header Hero */}
      {!editing && (
        <Card className="mb-8 overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-primary/5 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
          
          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            {/* Avatar */}
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-primary to-ai flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-xl shrink-0 border-4 border-background">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            {/* Identity Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold uppercase tracking-wider mb-3">
                <CheckCircle2 size={14} /> Verified Student Profile
              </div>
              
              <h2 className="text-3xl md:text-4xl font-heading font-black text-text-primary mb-2">
                {profile?.full_name || 'Student'}
              </h2>
              
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-text-secondary font-medium mb-5">
                <span className="flex items-center gap-1.5"><UserRound size={16} /> @{profile?.username || 'user'}</span>
                <span className="hidden md:inline text-border">•</span>
                <span className="flex items-center gap-1.5"><Mail size={16} /> {profile?.email || 'user@example.com'}</span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-sm border border-primary/20 shadow-sm">
                  {profile?.target_role || 'Software Engineer'}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-background border border-border text-text-secondary font-medium text-sm shadow-sm flex items-center gap-1.5">
                  <GraduationCap size={16} className="text-muted" /> {profile?.education || 'Computer Science'}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-background border border-border text-text-secondary font-medium text-sm shadow-sm">
                  Class of {profile?.graduation_year || '2027'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editing Mode Form */}
      {editing ? (
        <Card className="mb-8 shadow-md border-primary/20">
          <CardHeader className="border-b border-border/50 bg-background/50 pb-4">
            <CardTitle>Edit Career Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Full Name</label>
                  <input 
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={form.full_name} 
                    onChange={e => setForm({ ...form, full_name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Username</label>
                  <input 
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={form.username} 
                    onChange={e => setForm({ ...form, username: e.target.value })} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-bold text-text-secondary">Email Address</label>
                  <input 
                    type="email" 
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Career & Academics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-bold text-text-secondary">Target Career Role</label>
                  <input 
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                    value={form.target_role} 
                    onChange={e => setForm({ ...form, target_role: e.target.value })} 
                    placeholder="e.g. Full Stack Engineer, Cloud Architect" 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Degree / Education</label>
                  <input 
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={form.education} 
                    onChange={e => setForm({ ...form, education: e.target.value })} 
                    placeholder="e.g. B.Tech Computer Science" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Graduation Year</label>
                  <input 
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={form.graduation_year} 
                    onChange={e => setForm({ ...form, graduation_year: e.target.value })} 
                    placeholder="e.g. 2027" 
                  />
                </div>
              </div>

              <hr className="border-border/50" />

              {/* Skills & Bio */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary flex justify-between">
                    <span>Current Technical Skills</span>
                    <span className="text-xs font-normal text-text-muted">Comma-separated</span>
                  </label>
                  <input 
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={form.skills_text} 
                    onChange={e => setForm({ ...form, skills_text: e.target.value })} 
                    placeholder="Python, React, FastAPI, Docker, SQL, Git..." 
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary flex justify-between">
                    <span>Dream Companies / Target Sectors</span>
                    <span className="text-xs font-normal text-text-muted">Comma-separated</span>
                  </label>
                  <input 
                    className="px-4 py-2.5 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={form.dream_companies_text} 
                    onChange={e => setForm({ ...form, dream_companies_text: e.target.value })} 
                    placeholder="Google, Microsoft, Stripe, Atlassian..." 
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Career Interests & Passion Areas</label>
                  <textarea 
                    rows={3} 
                    className="px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
                    value={form.interests} 
                    onChange={e => setForm({ ...form, interests: e.target.value })} 
                    placeholder="e.g. Scalable distributed systems, AI-native products, frontend performance..." 
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-text-secondary">Professional Bio</label>
                  <textarea 
                    rows={4} 
                    className="px-4 py-3 rounded-xl border border-border bg-background text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
                    value={form.bio} 
                    onChange={e => setForm({ ...form, bio: e.target.value })} 
                    placeholder="Short statement summarizing your engineering focus and career direction..." 
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-6 border-t border-border/50">
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" 
                  disabled={saving}
                >
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : <BookmarkCheck size={18} />}
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
                <button 
                  type="button" 
                  className="px-6 py-2.5 bg-background border border-border text-text-secondary hover:text-text-primary hover:bg-border/30 font-bold rounded-xl transition-all" 
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* View Mode */
        <div className="flex flex-col gap-8">
          
          {/* Information Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Target Career & Skills */}
            <Card className="shadow-sm border-t-4 border-t-primary h-full">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <BriefcaseBusiness size={20} className="text-primary" /> Target Career & Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col gap-5">
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Target Role</span>
                  <div className="text-base font-bold text-primary">{profile?.target_role}</div>
                </div>
                
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Active Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {profile?.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-semibold text-text-secondary shadow-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm italic text-text-muted">No skills listed</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">Dream Companies</span>
                  <div className="flex flex-wrap gap-2">
                    {profile?.dream_companies?.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-md text-xs font-bold text-primary shadow-sm flex items-center gap-1.5">
                        <Building size={12} /> {c}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1">Interests</span>
                  <p className="text-sm text-text-secondary leading-relaxed m-0">
                    {profile?.interests || <span className="italic">No specific interests defined</span>}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6 h-full">
              {/* About / Bio */}
              <Card className="shadow-sm border-t-4 border-t-ai">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <UserRound size={20} className="text-ai" /> About Me
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <p className="text-sm text-text-secondary leading-relaxed m-0">
                    {profile?.bio || <span className="italic">No bio provided</span>}
                  </p>
                </CardContent>
              </Card>

              {/* Education */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap size={20} className="text-text-primary" /> Education & Academic
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start border-b border-border/50 pb-3">
                    <span className="text-sm font-medium text-text-muted">Degree</span>
                    <strong className="text-sm text-text-primary text-right max-w-[60%]">{profile?.education || 'Computer Science'}</strong>
                  </div>
                  <div className="flex justify-between items-start border-b border-border/50 pb-3">
                    <span className="text-sm font-medium text-text-muted">Expected Graduation</span>
                    <strong className="text-sm text-text-primary text-right">{profile?.graduation_year || '2027'}</strong>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-text-muted">Status</span>
                    <span className="px-2 py-1 bg-success/10 text-success text-xs font-bold rounded-md">
                      Undergraduate In Good Standing
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* MULTI-AGENT AI CAREER ADVISOR */}
          <Card className="border border-ai/20 shadow-md bg-gradient-to-br from-background via-background to-ai/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-ai pointer-events-none">
              <BrainCircuit size={120} />
            </div>
            
            <CardContent className="p-6 md:p-8 relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ai to-primary flex items-center justify-center text-white shadow-lg shrink-0">
                  <SparkleIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-black text-text-primary mb-1">AI Career Advisor</h3>
                  <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
                    Type your unvarnished career aspirations — our multi-stage AI analyzes your intent, synthesizes a roadmap, and refines your professional persona.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <input
                  className="flex-1 px-5 py-3.5 rounded-xl border border-border bg-background shadow-inner text-text-primary focus:outline-none focus:border-ai focus:ring-1 focus:ring-ai transition-all text-sm font-medium"
                  placeholder="e.g. 'I know basic Python & React, and I want to work at top tech companies...'"
                  value={advisorInput}
                  onChange={e => setAdvisorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRunAdvisor()}
                />
                <button
                  className="px-6 py-3.5 bg-gradient-to-r from-ai to-primary hover:opacity-90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
                  onClick={handleRunAdvisor}
                  disabled={analyzingAdvisor || !advisorInput.trim()}
                >
                  {analyzingAdvisor ? (
                    <><RefreshCw size={18} className="animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles size={18} /> Analyze Intent</>
                  )}
                </button>
              </div>

              {/* AI Advisor 3-Stage Result Display */}
              {advisorResult && (
                <div className="mt-8 flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Stage 1: Intent Diagnosis */}
                  <div className="p-5 md:p-6 bg-background rounded-2xl border border-border shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-200">
                        Stage 1: Intent
                      </span>
                      <strong className="text-base font-bold text-text-primary">
                        Predicted Target: {advisorResult.intent_analysis?.predicted_target_role}
                      </strong>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-border/50 text-text-secondary">
                        {advisorResult.intent_analysis?.career_archetype}
                      </span>
                    </div>
                    
                    <p className="text-sm text-text-secondary leading-relaxed mb-4 p-4 bg-background border border-border/50 rounded-xl italic border-l-2 border-l-indigo-400">
                      "{advisorResult.intent_analysis?.underlying_intention}"
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-2">Implicit Strengths:</span>
                      {advisorResult.intent_analysis?.implicit_strengths?.map((s, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-md text-xs font-bold bg-success/10 text-success border border-success/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stage 2: Synthesized Roadmap */}
                  {advisorResult.roadmap?.milestones && (
                    <div className="p-5 md:p-6 bg-background rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center gap-3 mb-5">
                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">
                          Stage 2: Roadmap
                        </span>
                        <strong className="text-base font-bold text-text-primary">Target Competencies & Milestones</strong>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {advisorResult.roadmap.milestones.map((m, idx) => (
                          <div key={idx} className="p-4 bg-background border border-border/80 rounded-xl shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                            <strong className="text-sm font-bold text-amber-600 block mb-2">{m.phase}</strong>
                            <p className="text-sm text-text-primary font-medium mb-3">{m.focus}</p>
                            <div className="text-xs text-text-secondary p-2 bg-background border border-border/50 rounded-lg">
                              <span className="font-bold text-text-muted mr-1">Goal:</span>
                              {m.key_deliverable}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stage 3: Refined Executive Persona */}
                  {advisorResult.executive_persona && (
                    <div className="p-6 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/50 shadow-md">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-blue-200/50 dark:border-blue-800/50">
                        <div>
                          <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800 mb-3 inline-block">
                            Stage 3: Executive Persona
                          </span>
                          <h4 className="text-xl font-heading font-black text-text-primary">
                            {advisorResult.executive_persona.career_persona_title}
                          </h4>
                        </div>
                        <button
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
                          onClick={handleApplyPersona}
                          disabled={applyingPersona}
                        >
                          {applyingPersona ? <RefreshCw size={16} className="animate-spin" /> : <Target size={16} />}
                          {applyingPersona ? 'Applying...' : 'Adopt AI Persona'}
                        </button>
                      </div>

                      <p className="text-base font-medium text-text-secondary leading-relaxed mb-6">
                        {advisorResult.executive_persona.executive_summary}
                      </p>

                      <div className="p-4 bg-white dark:bg-background rounded-xl border border-blue-100 dark:border-border shadow-sm border-l-4 border-l-blue-500 mb-6 relative">
                        <div className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm">
                          <Lightbulb size={12} />
                        </div>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Elevator Pitch</span>
                        <p className="text-sm md:text-base font-serif italic m-0 text-text-primary leading-relaxed">
                          "{advisorResult.executive_persona.elevator_pitch}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/60 dark:bg-background/60 p-4 rounded-xl border border-blue-100/50 dark:border-border/50">
                          <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-3">Priority Skills</span>
                          <div className="flex flex-wrap gap-2">
                            {advisorResult.executive_persona.top_priority_skills?.map((s, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-white/60 dark:bg-background/60 p-4 rounded-xl border border-blue-100/50 dark:border-border/50">
                          <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-3">Action Items</span>
                          <div className="flex flex-col gap-3">
                            {advisorResult.executive_persona.immediate_actions?.map((act, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <ArrowRight size={12} />
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-text-primary block leading-snug mb-1">{act.action}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-border text-text-secondary uppercase">
                                    {act.timeframe}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Existing Active Persona Snapshot if not running advisor */}
              {!advisorResult && persona && (
                <div className="mt-8 p-5 md:p-6 bg-gradient-to-br from-background to-ai/5 rounded-2xl border border-ai/20 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-ai"></div>
                  
                  <span className="px-2.5 py-1 rounded-md bg-ai/10 text-ai text-[10px] font-black uppercase tracking-widest border border-ai/20 mb-3 inline-block">
                    Active AI Persona
                  </span>
                  
                  <h4 className="text-lg font-heading font-black text-text-primary mb-2">
                    {persona.career_persona_title}
                  </h4>
                  
                  <p className="text-sm text-text-secondary leading-relaxed mb-4">
                    {persona.executive_summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {persona.top_priority_skills?.slice(0, 5).map((s, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-md text-xs font-semibold bg-background border border-border text-text-secondary">
                        {s}
                      </span>
                    ))}
                    {(persona.top_priority_skills?.length > 5) && (
                      <span className="px-2 py-1 rounded-md text-xs font-semibold bg-background/50 border border-border/50 text-text-muted italic">
                        +{persona.top_priority_skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account/Security section */}
          <Card className="shadow-sm border border-border/50 bg-background/50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-border/50 flex items-center justify-center text-text-secondary shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-bold text-text-primary mb-1">Account Security</h3>
                    <p className="text-sm text-text-secondary m-0">
                      Signed in as <strong className="text-text-primary">{profile?.email}</strong>
                    </p>
                  </div>
                </div>
                
                <button 
                  className="px-5 py-2.5 bg-background border border-error/20 hover:bg-error/10 text-error font-bold rounded-xl transition-all flex items-center gap-2"
                  onClick={() => setConfirming(true)}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-5 mx-auto">
                <LogOut size={24} />
              </div>
              
              <h2 className="text-xl font-heading font-black text-text-primary text-center mb-2">
                Sign out of CareerTwin?
              </h2>
              
              <p className="text-sm text-text-secondary text-center leading-relaxed mb-8">
                Are you sure you want to end your current session? You'll need to log in again to access your career profile.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  className="flex-1 px-4 py-3 bg-background border border-border hover:bg-border/30 text-text-primary font-bold rounded-xl transition-all"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 px-4 py-3 bg-error hover:bg-error-hover text-white font-bold rounded-xl shadow-md transition-all"
                  onClick={logout}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
