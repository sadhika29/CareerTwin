import { useState, useEffect } from 'react';
import {
  BriefcaseBusiness, GraduationCap, LogOut, Pencil, ShieldCheck, UserRound,
  Sparkles, CheckCircle2, ArrowRight, RefreshCw, BookmarkCheck, Target, Lightbulb,
  Building, MapPin, Mail, BrainCircuit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../features/auth/authService';
import { getProfile, updateProfile, runAIProfileAdvisor, applyAIPersona } from '../features/profile/profileService';
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
      console.warn('Could not load profile from backend, using authenticated session:', err);
      const fallback = {
        full_name: localStorage.getItem('career_name') || '',
        username: localStorage.getItem('career_user') || '',
        email: localStorage.getItem('career_email') || '',
        target_role: 'Software Engineer',
        education: '',
        graduation_year: '',
        skills: [],
        interests: '',
        dream_companies: [],
        bio: '',
        ai_persona: null
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
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const [advisorError, setAdvisorError] = useState('');

  const handleRunAdvisor = async () => {
    if (!advisorInput.trim()) return;
    setAnalyzingAdvisor(true);
    setAdvisorError('');
    try {
      const res = await runAIProfileAdvisor(advisorInput, profile);
      setAdvisorResult(res);
    } catch (err) {
      setAdvisorError(err.response?.data?.detail || 'AI Advisor service could not process your query. Please check your backend AI connection.');
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
      <p className="mt-4 text-xs font-semibold text-[#78678C]">Loading candidate profile...</p>
    </div>
  );

  const persona = profile?.ai_persona;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-xs font-bold text-[#542477] mb-3">
            <UserRound size={13} className="text-[#D83CC5]" />
            Career Identity
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#27113D] tracking-tight">
            Candidate Profile & Twin Persona
          </h1>
          <p className="text-sm text-[#78678C] mt-1 max-w-2xl leading-relaxed">
            Manage your credentials, academic trajectory, target roles, and synthesized AI Career Twin executive persona.
          </p>
        </div>

        {!editing && (
          <button 
            onClick={() => setEditing(true)}
            className="px-4 py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#542477] rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto hover:bg-[#F3E9FF]/40"
          >
            <Pencil size={14} /> Edit Profile
          </button>
        )}
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] rounded-xl shadow-sm text-xs font-bold animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Profile Header Hero Card */}
      {!editing && (
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-[0_4px_24px_rgba(84,36,119,0.05)] relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#542477] to-[#D83CC5] flex items-center justify-center text-4xl font-serif font-bold text-white shadow-[0_8px_24px_rgba(84,36,119,0.25)] shrink-0 border-2 border-white">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'C'}
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 size={12} /> Verified Candidate
              </span>
              <span className="text-xs text-[#78678C] font-semibold">
                @{profile?.username || 'user'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#27113D]">
              {profile?.full_name || 'Candidate'}
            </h2>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-[#78678C]">
              <span className="flex items-center gap-1">
                <Mail size={13} className="text-[#542477]" /> {profile?.email || 'user@example.com'}
              </span>
              <span className="text-[#D6C2EB]">•</span>
              <span className="flex items-center gap-1">
                <GraduationCap size={13} className="text-[#542477]" /> {profile?.education || 'Computer Science'} ({profile?.graduation_year || '2027'})
              </span>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#F3E9FF] border border-[#E4D5F3] text-xs font-bold text-[#542477]">
                Target: {profile?.target_role || 'Software Engineer'}
              </span>
              {profile?.skills?.slice(0, 4).map((s, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-[#FAF7FD] border border-[#E4D5F3] text-[11px] font-semibold text-[#27113D]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editing Mode Form */}
      {editing ? (
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-6">
          <div className="pb-4 border-b border-[#E4D5F3]">
            <h3 className="text-base font-bold text-[#27113D]">Edit Candidate Details</h3>
            <p className="text-xs text-[#78678C]">Changes immediately synchronize with AI interview and readiness engines.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Full Name</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.full_name} 
                  onChange={e => setForm({ ...form, full_name: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Username</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.username} 
                  onChange={e => setForm({ ...form, username: e.target.value })} 
                  required 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <hr className="border-[#E4D5F3]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Target Career Role</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.target_role} 
                  onChange={e => setForm({ ...form, target_role: e.target.value })} 
                  placeholder="e.g. Senior Full Stack Engineer, Cloud Architect" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Degree / Discipline</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.education} 
                  onChange={e => setForm({ ...form, education: e.target.value })} 
                  placeholder="e.g. B.Tech Computer Science" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Graduation Year</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.graduation_year} 
                  onChange={e => setForm({ ...form, graduation_year: e.target.value })} 
                  placeholder="e.g. 2027" 
                />
              </div>
            </div>

            <hr className="border-[#E4D5F3]" />

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Technical Skills (Comma-separated)</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.skills_text} 
                  onChange={e => setForm({ ...form, skills_text: e.target.value })} 
                  placeholder="Python, React, FastAPI, Docker, SQL, Git..." 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Dream Companies (Comma-separated)</label>
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.dream_companies_text} 
                  onChange={e => setForm({ ...form, dream_companies_text: e.target.value })} 
                  placeholder="Google, Stripe, Microsoft, Meta..." 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Professional Bio</label>
                <textarea 
                  rows={3} 
                  className="w-full p-3.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-medium text-[#27113D] leading-relaxed resize-y focus:outline-none focus:border-[#542477] focus:bg-white transition-all"
                  value={form.bio} 
                  onChange={e => setForm({ ...form, bio: e.target.value })} 
                  placeholder="Short statement summarizing your engineering focus and career direction..." 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#E4D5F3]">
              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <BookmarkCheck size={14} />}
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
              <button 
                type="button" 
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#78678C] rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Target Career & Skills */}
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E4D5F3]">
                <BriefcaseBusiness size={16} className="text-[#542477]" />
                <h3 className="text-sm font-bold text-[#27113D]">Target Career & Skills</h3>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78678C] block mb-1">Target Discipline</span>
                <span className="text-xs font-bold text-[#542477] bg-[#F3E9FF] px-2.5 py-1 rounded-lg border border-[#E4D5F3] inline-block">
                  {profile?.target_role}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78678C] block mb-1.5">Active Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile?.skills?.map((skill, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#FAF7FD] border border-[#E4D5F3] rounded-lg text-xs font-semibold text-[#27113D]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78678C] block mb-1.5">Dream Companies</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile?.dream_companies?.map((c, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#F3E9FF] border border-[#E4D5F3] rounded-lg text-xs font-bold text-[#542477] flex items-center gap-1">
                      <Building size={11} /> {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* About & Education */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E4D5F3]">
                  <UserRound size={16} className="text-[#542477]" />
                  <h3 className="text-sm font-bold text-[#27113D]">Professional Bio</h3>
                </div>
                <p className="text-xs text-[#78678C] leading-relaxed italic">
                  "{profile?.bio || 'No bio provided yet.'}"
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E4D5F3]">
                  <GraduationCap size={16} className="text-[#542477]" />
                  <h3 className="text-sm font-bold text-[#27113D]">Education & Background</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#78678C]">Degree</span>
                    <span className="font-bold text-[#27113D]">{profile?.education || 'Computer Science'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#78678C]">Graduation Class</span>
                    <span className="font-bold text-[#27113D]">{profile?.graduation_year || '2027'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Career Advisor Multi-Agent Studio */}
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)] space-y-6">
            <div className="flex items-start gap-3.5 pb-4 border-b border-[#E4D5F3]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#542477] to-[#D83CC5] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#27113D]">AI Career Advisor & Persona Synthesis</h3>
                <p className="text-xs text-[#78678C] leading-relaxed mt-0.5">
                  State your raw career aspirations. Multi-agent evaluation diagnoses intent, builds targeted milestones, and writes your executive pitch.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 px-4 py-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] focus:bg-white transition-all placeholder-[#8A7A9E]"
                placeholder="e.g. 'I know basic Python & React, and I want to crack a senior backend role at Stripe...'"
                value={advisorInput}
                onChange={e => setAdvisorInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRunAdvisor()}
              />
              <button
                onClick={handleRunAdvisor}
                disabled={analyzingAdvisor || !advisorInput.trim()}
                className="px-5 py-3 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
              >
                {analyzingAdvisor ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {analyzingAdvisor ? 'Analyzing Intent...' : 'Analyze Intent'}
              </button>
            </div>

            {advisorError && (
              <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-semibold flex items-center justify-between">
                <span>{advisorError}</span>
                <button onClick={() => setAdvisorError('')} className="underline text-[11px] ml-2">Dismiss</button>
              </div>
            )}

            {/* AI Advisor Result */}
            {advisorResult && (
              <div className="space-y-6 pt-2 animate-in slide-in-from-bottom-4 duration-500">
                {/* Stage 1 */}
                <div className="p-5 rounded-2xl bg-[#FAF7FD] border border-[#E4D5F3] space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#542477] bg-[#F3E9FF] px-2.5 py-0.5 rounded-full border border-[#E4D5F3]">
                      Stage 1: Intent Diagnostic
                    </span>
                    <span className="text-xs font-bold text-[#27113D]">
                      Predicted: {advisorResult.intent_analysis?.predicted_target_role}
                    </span>
                  </div>
                  <p className="text-xs text-[#78678C] italic">
                    "{advisorResult.intent_analysis?.underlying_intention}"
                  </p>
                </div>

                {/* Stage 2 */}
                {advisorResult.roadmap?.milestones && (
                  <div className="p-5 rounded-2xl bg-white border border-[#E4D5F3] space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
                      Stage 2: Synthesized Milestones
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {advisorResult.roadmap.milestones.map((m, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] space-y-1.5">
                          <span className="text-xs font-bold text-[#542477] block">{m.phase}</span>
                          <p className="text-xs text-[#27113D] font-medium leading-snug">{m.focus}</p>
                          <span className="text-[10px] text-[#78678C] block pt-1">Goal: {m.key_deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage 3 */}
                {advisorResult.executive_persona && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FAF7FD] to-[#F3E9FF]/40 border border-[#E4D5F3] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
                          Stage 3: Executive Persona
                        </span>
                        <h4 className="text-base font-serif font-bold text-[#27113D] mt-1.5">
                          {advisorResult.executive_persona.career_persona_title}
                        </h4>
                      </div>
                      <button
                        onClick={handleApplyPersona}
                        disabled={applyingPersona}
                        className="px-4 py-2 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_14px_rgba(84,36,119,0.2)] hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                      >
                        {applyingPersona ? <RefreshCw size={13} className="animate-spin" /> : <Target size={13} />}
                        {applyingPersona ? 'Adopting...' : 'Adopt AI Persona'}
                      </button>
                    </div>

                    <p className="text-xs text-[#27113D] leading-relaxed">
                      {advisorResult.executive_persona.executive_summary}
                    </p>

                    <div className="p-4 rounded-xl bg-white border border-[#E4D5F3] space-y-1">
                      <span className="text-[10px] font-bold text-[#542477] uppercase tracking-wider block">Elevator Pitch</span>
                      <p className="text-xs italic font-serif text-[#27113D] leading-relaxed">
                        "{advisorResult.executive_persona.elevator_pitch}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Existing Persona Snapshot */}
            {!advisorResult && persona && (
              <div className="p-5 rounded-2xl bg-[#FAF7FD] border border-[#E4D5F3] space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#542477] bg-[#F3E9FF] px-2.5 py-0.5 rounded-full border border-[#E4D5F3]">
                  Active Persona
                </span>
                <h4 className="text-sm font-serif font-bold text-[#27113D]">
                  {persona.career_persona_title}
                </h4>
                <p className="text-xs text-[#78678C] leading-relaxed">
                  {persona.executive_summary}
                </p>
              </div>
            )}
          </div>

          {/* Account Security Card */}
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] text-[#542477] flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#27113D]">Account Security & Session</h4>
                <p className="text-xs text-[#78678C]">Signed in as {profile?.email}</p>
              </div>
            </div>

            <button 
              onClick={() => setConfirming(true)}
              className="px-4 py-2 bg-[#FFF1F2] border border-[#FECDD3] hover:bg-[#FFE4E6] text-xs font-bold text-[#E11D48] rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-[#E4D5F3] p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center mx-auto">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#27113D]">Sign out of CareerTwin?</h3>
              <p className="text-xs text-[#78678C] mt-1 leading-relaxed">
                You will need to authenticate again to access your live intelligence workspaces.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={() => setConfirming(false)}
                className="flex-1 py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#78678C] rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={logout}
                className="flex-1 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
