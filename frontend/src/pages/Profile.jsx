import { useState, useEffect } from 'react';
import {
  BriefcaseBusiness, GraduationCap, LogOut, Pencil, ShieldCheck, UserRound,
  CheckCircle2, RefreshCw, BookmarkCheck, Building, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../features/auth/authService';
import { getProfile, updateProfile } from '../features/profile/profileService';
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
        bio: ''
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-xs font-bold text-[#542477] mb-3">
            <UserRound size={13} className="text-[#D83CC5]" />
            Career Identity
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#27113D] tracking-tight">
            Candidate Profile
          </h1>
          <p className="text-sm text-[#78678C] mt-1 max-w-2xl leading-relaxed">
            Manage your credentials, academic trajectory, target roles, and professional background.
          </p>
        </div>

        {!editing && (
          <button 
            onClick={() => setEditing(true)}
            className="px-4 py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#542477] rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto hover:bg-[#F3E9FF]/40 cursor-pointer"
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
                className="px-6 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <BookmarkCheck size={14} />}
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
              <button 
                type="button" 
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#78678C] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-6">
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
                  {profile?.skills && profile.skills.length > 0 ? (
                    profile.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#FAF7FD] border border-[#E4D5F3] rounded-lg text-xs font-semibold text-[#27113D]">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#78678C] italic">No skills listed yet.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78678C] block mb-1.5">Dream Companies</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile?.dream_companies && profile.dream_companies.length > 0 ? (
                    profile.dream_companies.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#F3E9FF] border border-[#E4D5F3] rounded-lg text-xs font-bold text-[#542477] flex items-center gap-1">
                        <Building size={11} /> {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#78678C] italic">No dream companies listed.</span>
                  )}
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

          {/* Account Security & Session Card */}
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
              className="px-4 py-2 bg-[#FFF1F2] border border-[#FECDD3] hover:bg-[#FFE4E6] text-xs font-bold text-[#E11D48] rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
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
                className="flex-1 py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] text-xs font-bold text-[#78678C] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={logout}
                className="flex-1 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
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
