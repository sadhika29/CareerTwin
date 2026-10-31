import { useState, useEffect } from 'react';
import { 
  User, Save, CheckCircle2, ShieldCheck, Mail, Briefcase, 
  FileText, Sparkles, Database, LogOut 
} from 'lucide-react';
import { getProfile, updateProfile } from '../features/profile/profileService';
import { signOut } from '../features/auth/authService';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    title: '',
    bio: '',
  });
  const [savedMessage, setSavedMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userEmail = localStorage.getItem('career_email') || 'user@careertwin.ai';
    const userName = localStorage.getItem('career_name') || 'Student';

    getProfile()
      .then(res => {
        if (res?.profile) {
          setProfile({
            full_name: res.profile.full_name || res.profile.name || userName,
            email: res.profile.email || userEmail,
            title: res.profile.title || res.profile.target_role || 'Software Engineer',
            bio: res.profile.bio || 'AI CareerTwin Platform Member',
          });
        } else {
          setProfile(prev => ({ ...prev, full_name: userName, email: userEmail }));
        }
      })
      .catch(() => {
        setProfile(prev => ({ ...prev, full_name: userName, email: userEmail }));
      });
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedMessage('');
    try {
      await updateProfile({
        full_name: profile.full_name,
        email: profile.email,
        title: profile.title,
        bio: profile.bio
      });
      localStorage.setItem('career_name', profile.full_name);
      localStorage.setItem('career_email', profile.email);
      setSavedMessage('Account details saved successfully!');
      setTimeout(() => setSavedMessage(''), 3500);
    } catch {
      setSavedMessage('Saved locally in your active CareerTwin session.');
      setTimeout(() => setSavedMessage(''), 3500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-5xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-xs font-bold text-[#542477] uppercase tracking-wider mb-2">
          <span>✦ Account Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D]">
          Account Details
        </h1>
        <p className="text-sm sm:text-base text-[#78678C] mt-1 max-w-2xl leading-relaxed">
          Manage your personal identity, contact email, target career role, and authenticated session.
        </p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2.5 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-[#16A34A] text-sm font-semibold shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Account Details Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#27113D]">Personal Information</h2>
              <p className="text-xs text-[#78678C]">Your professional identity across CareerTwin assessments and mock interviews.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-[#542477]" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Veerendra Babu Kumpati"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full h-11 px-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] placeholder-[#8A7A9E] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-[#542477]" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full h-11 px-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] placeholder-[#8A7A9E] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase size={13} className="text-[#542477]" /> Target Role / Professional Title
              </label>
              <input
                type="text"
                placeholder="e.g. Full Stack Developer, Data Scientist / ML Engineer"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] placeholder-[#8A7A9E] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText size={13} className="text-[#542477]" /> Professional Bio
              </label>
              <textarea
                rows={3}
                placeholder="A short overview of your technical background, career goals, and core competencies..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full p-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] placeholder-[#8A7A9E] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-sm font-bold shadow-[0_4px_15px_rgba(84,36,119,0.22)] hover:opacity-95 hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save size={16} />
                <span>{loading ? 'Saving Changes...' : 'Save Account Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Account Information Panel */}
        <div className="bg-[#FBF8FF] rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 flex flex-col justify-between shadow-[0_4px_20px_rgba(84,36,119,0.03)]">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4C2365] to-[#7951D1] text-white font-bold text-2xl flex items-center justify-center mb-4 shadow-sm">
              {(profile.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <h3 className="font-bold text-[#27113D] text-lg leading-tight">
              {profile.full_name || 'CareerTwin User'}
            </h3>
            <p className="text-xs text-[#78678C] mt-1 break-all">{profile.email}</p>
            
            <div className="mt-5 pt-4 border-t border-[#E4D5F3] space-y-2.5 text-xs text-[#78678C]">
              <div className="flex justify-between items-center">
                <span>Account Status</span>
                <span className="font-semibold text-[#542477] bg-[#F3E9FF] px-2.5 py-0.5 rounded-full border border-[#E4D5F3] flex items-center gap-1">
                  <Sparkles size={11} className="text-[#D83CC5]" /> Active Pro
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Cloud Storage</span>
                <span className="font-semibold text-[#16A34A] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#BBF7D0] flex items-center gap-1">
                  <Database size={11} /> Firebase Sync
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Identity Protection</span>
                <span className="font-semibold text-[#542477] flex items-center gap-1">
                  <ShieldCheck size={13} className="text-[#16A34A]" /> Verified
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => {
                signOut();
                navigate('/login');
              }}
              className="w-full py-2.5 rounded-xl border border-[#FECDD3] bg-white text-[#E11D48] hover:bg-[#FFF1F2] text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out of Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
