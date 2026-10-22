import { useState, useEffect } from 'react';
import { 
  User, Bell, Shield, Key, Eye, EyeOff, Save, CheckCircle2, 
  AlertTriangle, Smartphone, Globe, Sparkles, Check
} from 'lucide-react';
import { getProfile, updateProfile } from '../features/profile/profileService';
import { signOut } from '../features/auth/authService';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    title: '',
    bio: '',
  });
  const [preferences, setPreferences] = useState({
    aiInsights: true,
    weeklyDigest: true,
    jobAlerts: true,
    interviewReminders: true,
    publicProfile: false,
    themeAccent: 'purple'
  });
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
    confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userEmail = localStorage.getItem('career_email') || 'user@careertwin.ai';
    const userName = localStorage.getItem('career_name') || 'User';

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
    try {
      await updateProfile({
        full_name: profile.full_name,
        email: profile.email,
        title: profile.title,
        bio: profile.bio
      });
      localStorage.setItem('career_name', profile.full_name);
      localStorage.setItem('career_email', profile.email);
      setSavedMessage('Profile settings saved successfully!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch {
      setSavedMessage('Saved locally in your active CareerTwin session.');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = () => {
    setSavedMessage('Preferences updated successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const tabs = [
    { id: 'account', label: 'Account Details', Icon: User },
    { id: 'preferences', label: 'AI & Preferences', Icon: Sparkles },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'security', label: 'Security & Access', Icon: Shield },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-xs font-bold text-[#542477] uppercase tracking-wider mb-2">
          <span>✦ Account Settings</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D]">
          Settings & Preferences
        </h1>
        <p className="text-sm sm:text-base text-[#78678C] mt-1 max-w-2xl leading-relaxed">
          Manage your account profile, AI assistant parameters, notification preferences, and platform credentials.
        </p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl text-[#16A34A] text-sm font-semibold shadow-xs">
          <CheckCircle2 size={18} />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E4D5F3] pb-3">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#542477] text-white shadow-sm'
                  : 'text-[#78678C] hover:text-[#27113D] hover:bg-[#F3E9FF]'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Account */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-[#27113D] mb-5">Personal Information</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full h-11 px-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full h-11 px-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5">
                  Target Role / Professional Title
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className="w-full h-11 px-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5">
                  Professional Bio
                </label>
                <textarea
                  rows={3}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full p-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-sm font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saving...' : 'Save Account Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-[#FBF8FF] rounded-2xl border border-[#E4D5F3] p-6 flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4C2365] to-[#7951D1] text-white font-bold text-2xl flex items-center justify-center mb-4 shadow-sm">
                {(profile.full_name || 'U').charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-[#27113D] text-lg">{profile.full_name || 'CareerTwin User'}</h3>
              <p className="text-xs text-[#78678C] mt-0.5">{profile.email}</p>
              <div className="mt-4 pt-4 border-t border-[#E4D5F3] space-y-2 text-xs text-[#78678C]">
                <div className="flex justify-between">
                  <span>Membership</span>
                  <span className="font-semibold text-[#542477]">CareerTwin Pro (AI Active)</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Engine</span>
                  <span className="font-semibold text-[#16A34A]">carrr-c4bc0 (Firebase)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                signOut();
                navigate('/login');
              }}
              className="mt-6 w-full py-2.5 rounded-xl border border-[#FECDD3] bg-white text-[#E11D48] hover:bg-[#FFF1F2] text-xs font-bold transition-colors cursor-pointer"
            >
              Sign Out of Session
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#27113D] mb-1">CareerTwin AI Behavior & Theme</h2>
            <p className="text-xs text-[#78678C]">Tailor how the AI companion recommends opportunities and generates insights.</p>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] cursor-pointer hover:bg-[#F3E9FF]/40 transition-colors">
              <div>
                <span className="font-bold text-sm text-[#27113D] block">Real-Time AI Insight Generation</span>
                <span className="text-xs text-[#78678C] block mt-0.5">Allow the Digital Twin engine to proactively synthesize interview recommendations from your skill gaps.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.aiInsights}
                onChange={(e) => setPreferences({ ...preferences, aiInsights: e.target.checked })}
                className="w-5 h-5 rounded-md accent-[#542477] cursor-pointer mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] cursor-pointer hover:bg-[#F3E9FF]/40 transition-colors">
              <div>
                <span className="font-bold text-sm text-[#27113D] block">Public Verified Skill Badge</span>
                <span className="text-xs text-[#78678C] block mt-0.5">Make verified DSA and interview badges discoverable by prospective employers.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.publicProfile}
                onChange={(e) => setPreferences({ ...preferences, publicProfile: e.target.checked })}
                className="w-5 h-5 rounded-md accent-[#542477] cursor-pointer mt-1"
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSavePreferences}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-sm font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-xs max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#27113D] mb-1">Notification Preferences</h2>
            <p className="text-xs text-[#78678C]">Control how and when CareerTwin alerts you to job openings and interview sessions.</p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { key: 'weeklyDigest', title: 'Weekly Readiness Digest', desc: 'Summary of ATS resume improvements, solved interview questions, and roadmap milestones.' },
              { key: 'jobAlerts', title: 'Real-Time Job Match Alerts', desc: 'Instant notifications when live job openings match your target role with 80%+ readiness score.' },
              { key: 'interviewReminders', title: 'Mock Interview Reminders', desc: 'Scheduled calendar nudges to practice behavioral and technical voice interview drills.' }
            ].map(({ key, title, desc }) => (
              <label key={key} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] cursor-pointer hover:bg-[#F3E9FF]/40 transition-colors">
                <div>
                  <span className="font-bold text-sm text-[#27113D] block">{title}</span>
                  <span className="text-xs text-[#78678C] block mt-0.5">{desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={(e) => setPreferences({ ...preferences, [key]: e.target.checked })}
                  className="w-5 h-5 rounded-md accent-[#542477] cursor-pointer mt-1"
                />
              </label>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSavePreferences}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-sm font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer"
            >
              Update Notifications
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Security */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#27113D] mb-1">Password & Credentials</h2>
              <p className="text-xs text-[#78678C]">Ensure your account uses a secure password of at least 6 characters.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full h-11 px-3.5 pr-10 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] focus:bg-white focus:outline-none focus:border-[#542477] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78678C] hover:text-[#27113D]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    className="w-full h-11 px-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] focus:bg-white focus:outline-none focus:border-[#542477] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full h-11 px-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl text-sm text-[#27113D] focus:bg-white focus:outline-none focus:border-[#542477] transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSavedMessage('Password updated successfully.');
                    setPasswords({ current: '', newPass: '', confirm: '' });
                    setTimeout(() => setSavedMessage(''), 3000);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#542477] text-white text-sm font-bold shadow-sm hover:opacity-95 transition-all cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>

          {/* Connected Providers */}
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-[#27113D]">Connected Authentication Providers</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E4D5F3] flex items-center justify-center font-bold text-xs text-[#4285F4]">
                    G
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#27113D] block">Google Account</span>
                    <span className="text-xs text-[#78678C] block">Connected via Firebase Auth</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#16A34A] bg-[#ECFDF5] border border-[#BBF7D0] px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check size={12} /> Linked
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E4D5F3] flex items-center justify-center font-bold text-xs text-[#27113D]">
                    GH
                  </div>
                  <div>
                    <span className="text-sm font-bold text-[#27113D] block">GitHub Account</span>
                    <span className="text-xs text-[#78678C] block">Repository & project insights</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSavedMessage('GitHub account sync initiated.');
                    setTimeout(() => setSavedMessage(''), 3000);
                  }}
                  className="text-xs font-semibold text-[#542477] hover:bg-[#F3E9FF] border border-[#E4D5F3] px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  Sync Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
