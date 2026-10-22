import { useState, useEffect } from 'react';
import {
  BriefcaseBusiness, Plus, Search, Sparkles, CheckCircle2, Clock,
  ExternalLink, Trash2, ChevronRight, X, Copy, Check, RefreshCw, Send, Bookmark
} from 'lucide-react';
import { getApplications, createApplication, updateApplication, deleteApplication, getAIApplicationStrategy } from '../features/applications/applicationService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Application Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApp, setNewApp] = useState({
    company: '',
    role: '',
    location: 'Remote',
    status: 'Applied',
    salary: '',
    notes: '',
    url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // AI Strategy Coach Drawer/Modal
  const [selectedAppForAI, setSelectedAppForAI] = useState(null);
  const [aiStrategyLoading, setAiStrategyLoading] = useState(false);
  const [strategyResult, setStrategyResult] = useState(null);
  const [copiedPitch, setCopiedPitch] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      if (data && data.applications) {
        setApplications(data.applications);
        setStats(data.stats);
      }
    } catch (err) {
      console.warn('Failed to load applications from backend:', err);
      setApplications([]);
      setStats({
        total: 0,
        interviewing: 0,
        applied: 0,
        saved: 0,
        pending: 0,
        offers: 0,
        response_rate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newApp.company || !newApp.role) return;
    setSubmitting(true);
    try {
      const res = await createApplication(newApp);
      if (res && res.application) {
        setApplications([res.application, ...applications]);
      }
      setShowAddModal(false);
      setNewApp({
        company: '',
        role: '',
        location: 'Remote',
        status: 'Applied',
        salary: '',
        notes: '',
        url: ''
      });
      loadApplications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save application to backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplication(appId, { status: newStatus });
      setApplications(applications.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      loadApplications();
    } catch {
      setApplications(applications.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm('Remove this application from tracking?')) return;
    try {
      await deleteApplication(appId);
      setApplications(applications.filter(a => a.id !== appId));
      loadApplications();
    } catch {
      setApplications(applications.filter(a => a.id !== appId));
    }
  };

  const handleOpenAICoach = async (app) => {
    setSelectedAppForAI(app);
    setStrategyResult(app.ai_strategy || null);
    setAiStrategyLoading(true);

    try {
      const res = await getAIApplicationStrategy(app.id, {
        company: app.company,
        role: app.role,
        description: app.description
      });
      if (res && res.strategy) {
        setStrategyResult(res.strategy);
        setApplications(applications.map(a => a.id === app.id ? { ...a, ai_strategy: res.strategy } : a));
      }
    } catch (err) {
      console.warn('AI Coach generation error:', err);
      setStrategyResult(null);
    } finally {
      setAiStrategyLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  const filteredApps = applications.filter(app => {
    const matchesFilter = filterStatus === 'All' || app.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = !searchQuery ||
      app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'offer': return 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]';
      case 'interviewing': return 'bg-[#F3E9FF] text-[#542477] border-[#E4D5F3]';
      case 'applied': return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      case 'saved': return 'bg-[#FAF7FD] text-[#5F4E75] border-[#E4D5F3]';
      case 'rejected': return 'bg-[#FFF1F2] text-[#E11D48] border-[#FECDD3]';
      default: return 'bg-[#FAF7FD] text-[#5F4E75] border-[#E4D5F3]';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles size={13} className="text-[#D83CC5]" />
          CareerTwin Pipeline
        </div>
        <h1 className="text-3xl font-heading font-black text-[#27113D] tracking-tight flex items-center gap-3">
          Application Tracker
          <BriefcaseBusiness size={26} className="text-[#542477]" />
        </h1>
        <p className="text-[#5F4E75] text-base mt-1">
          Track every opportunity and use AI to generate tailored pitches and interview strategies.
        </p>
      </div>

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col justify-center">
          <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-2">Total Opportunities</div>
          <div className="text-3xl font-heading font-black text-[#27113D] mb-1">{stats?.total ?? applications.length}</div>
          <span className="text-xs text-[#5F4E75]">Active in pipeline</span>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col justify-center">
          <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-2">Interviewing</div>
          <div className="text-3xl font-heading font-black text-[#542477] mb-1">{stats?.interviewing ?? 0}</div>
          <span className="text-xs text-[#542477]">Live interview loops</span>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col justify-center">
          <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-2">Offers Received</div>
          <div className="text-3xl font-heading font-black text-[#16A34A] mb-1">{stats?.offers ?? 0}</div>
          <span className="text-xs text-[#16A34A]">Target compensation</span>
        </div>
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col justify-center">
          <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-2">Response Rate</div>
          <div className="text-3xl font-heading font-black text-[#D83CC5] mb-1">{stats?.response_rate ?? 65}%</div>
          <span className="text-xs text-[#5F4E75]">Application conversion</span>
        </div>
      </div>

      {/* Control Bar: Filters & Search & Add Button */}
      <div className="bg-white rounded-2xl border border-[#E4D5F3] p-4 mb-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {['All', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map(st => (
            <button
              key={st}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                filterStatus === st 
                  ? 'bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white shadow-[0_2px_10px_rgba(84,36,119,0.25)]' 
                  : 'bg-[#FAF7FD] border border-[#E4D5F3] text-[#5F4E75] hover:border-[#542477] hover:text-[#27113D]'
              }`}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex w-full lg:w-auto items-center gap-3">
          <div className="relative flex-1 lg:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A9E]" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-medium text-[#27113D] placeholder-[#8A7A9E] focus:outline-none focus:border-[#542477] focus:ring-1 focus:ring-[#542477] transition-all"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> <span className="hidden sm:inline">Add Application</span>
          </button>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-text-muted font-medium">Loading applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#E4D5F3] py-16 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-[#F3E9FF] rounded-full flex items-center justify-center mb-4 text-[#542477]">
            <BriefcaseBusiness size={28} />
          </div>
          <h3 className="text-lg font-bold text-[#27113D] mb-2">No applications found</h3>
          <p className="text-sm text-[#8A7A9E] max-w-sm mx-auto">Try selecting a different filter or add a new opportunity to track.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredApps.map(app => (
            <div key={app.id} className="bg-white rounded-2xl border border-[#E4D5F3] p-5 sm:p-6 shadow-[0_4px_20px_rgba(84,36,119,0.03)] hover:border-[#D6C2EB] hover:shadow-[0_8px_24px_rgba(84,36,119,0.08)] transition-all">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black text-[#27113D]">{app.role}</h3>
                    <span className={`px-3 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#5F4E75]">
                    <strong className="text-[#27113D] font-bold">{app.company}</strong> 
                    <span className="mx-2 text-[#E4D5F3]">•</span> 
                    {app.location || 'Remote'} 
                    <span className="mx-2 text-[#E4D5F3]">•</span> 
                    {app.salary || 'Competitive'}
                  </p>
                </div>

                {/* Actions & Status Dropdown */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-[#27113D] focus:outline-none focus:border-[#542477] cursor-pointer"
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <button
                    onClick={() => handleOpenAICoach(app)}
                    className="px-4 py-2 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_2px_10px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles size={14} /> AI Coach
                  </button>

                  <button
                    onClick={() => handleDelete(app.id)}
                    className="p-2 text-[#8A7A9E] hover:text-[#E11D48] hover:bg-[#FFF1F2] rounded-xl transition-colors"
                    title="Delete Application"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Notes & Next Step */}
              <div className="pt-4 border-t border-[#E4D5F3] flex flex-col sm:flex-row gap-4 sm:items-center text-sm">
                {app.next_step && (
                  <div className="flex items-center gap-2 text-[#542477] font-semibold bg-[#F3E9FF] border border-[#E4D5F3] px-3 py-1.5 rounded-xl text-xs">
                    <Clock size={14} />
                    <span>Next: {app.next_step}</span>
                  </div>
                )}
                {app.notes && (
                  <div className="text-[#5F4E75] text-xs flex-1 italic">
                    "{app.notes}"
                  </div>
                )}
                <div className="text-xs text-[#8A7A9E] sm:ml-auto">
                  Updated: {app.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD APPLICATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border bg-card">
              <h2 className="text-lg font-heading font-black text-[#27113D]">Add New Application</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#8A7A9E] hover:bg-[#F3E9FF] hover:text-[#27113D] rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="add-app-form" onSubmit={handleCreate} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Company Name *</label>
                    <input 
                      required 
                      value={newApp.company} 
                      onChange={e => setNewApp({ ...newApp, company: e.target.value })} 
                      placeholder="e.g. Google, Stripe" 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Role / Job Title *</label>
                    <input 
                      required 
                      value={newApp.role} 
                      onChange={e => setNewApp({ ...newApp, role: e.target.value })} 
                      placeholder="e.g. Frontend Engineer" 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Location</label>
                    <input 
                      value={newApp.location} 
                      onChange={e => setNewApp({ ...newApp, location: e.target.value })} 
                      placeholder="e.g. Remote or City" 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Initial Status</label>
                    <select 
                      value={newApp.status} 
                      onChange={e => setNewApp({ ...newApp, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-bold text-[#27113D] focus:outline-none focus:border-[#542477] appearance-none"
                    >
                      <option value="Saved">Saved</option>
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Salary / Comp Range</label>
                    <input 
                      value={newApp.salary} 
                      onChange={e => setNewApp({ ...newApp, salary: e.target.value })} 
                      placeholder="e.g. $110k - $130k" 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Job Posting URL</label>
                    <input 
                      type="url" 
                      value={newApp.url} 
                      onChange={e => setNewApp({ ...newApp, url: e.target.value })} 
                      placeholder="https://careers..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#27113D] mb-1.5 uppercase tracking-wider">Notes / Context</label>
                    <textarea 
                      rows={2} 
                      value={newApp.notes} 
                      onChange={e => setNewApp({ ...newApp, notes: e.target.value })} 
                      placeholder="Referral source, submission date, or recruiter contact..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs text-[#27113D] focus:outline-none focus:border-[#542477] resize-y"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-[#E4D5F3] bg-[#FAF7FD] flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 bg-white border border-[#E4D5F3] hover:bg-[#F3E9FF] text-[#5F4E75] text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="add-app-form"
                disabled={submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 transition-all flex items-center justify-center min-w-[140px]"
              >
                {submitting ? 'Saving...' : 'Add to Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI STRATEGY COACH MODAL */}
      {selectedAppForAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#27113D]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#E4D5F3] bg-[#FAF7FD] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-[#D83CC5]" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-[#27113D]">AI Application Coach</h3>
                  <p className="text-xs text-[#5F4E75]">
                    Strategy for <strong className="text-[#542477]">{selectedAppForAI.role}</strong> at <strong className="text-[#27113D]">{selectedAppForAI.company}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAppForAI(null)}
                className="p-1.5 text-[#8A7A9E] hover:bg-[#F3E9FF] hover:text-[#27113D] rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {aiStrategyLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <RefreshCw size={40} className="animate-spin text-[#542477] mb-6" />
                  <h4 className="text-lg font-heading font-black text-[#27113D] mb-2">Generating Company-Specific Strategy...</h4>
                  <p className="text-sm text-[#8A7A9E] max-w-md">Analyzing role requirements, generating tailored cover pitch, and predicting interview focus.</p>
                </div>
              ) : strategyResult ? (
                <div className="flex flex-col gap-8">
                  {/* Company Overview & Readiness */}
                  <div className="bg-[#FAF7FD] border border-[#E4D5F3] rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-sm text-[#5F4E75] flex-1 leading-relaxed m-0">
                      <strong className="text-[#27113D] block mb-1">Company Focus:</strong> 
                      {strategyResult.company_overview}
                    </p>
                    <div className="shrink-0">
                      <span className="inline-flex flex-col items-center justify-center px-4 py-2 bg-[#F3E9FF] text-[#542477] rounded-xl border border-[#E4D5F3]">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5">Readiness</span>
                        <span className="text-xl font-black">{strategyResult.estimated_readiness_score || 85}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Tailored Pitch */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-bold text-[#542477] uppercase tracking-wider flex items-center gap-2">
                        <Send size={15} className="text-[#D83CC5]" /> Tailored Pitch / Cover Note
                      </h4>
                      <button
                        onClick={() => copyToClipboard(strategyResult.tailored_pitch)}
                        className="px-3.5 py-1.5 text-xs font-bold bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#27113D] rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      >
                        {copiedPitch ? <><Check size={14} className="text-[#16A34A]" /> Copied!</> : <><Copy size={14} /> Copy Pitch</>}
                      </button>
                    </div>
                    <div className="bg-[#FAF7FD] border border-[#E4D5F3] rounded-2xl p-5 relative group">
                      <pre className="text-sm text-[#5F4E75] leading-relaxed font-sans whitespace-pre-wrap m-0">
                        {strategyResult.tailored_pitch}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Talking Points */}
                    {strategyResult.key_talking_points && (
                      <div>
                        <h4 className="text-xs font-bold text-[#27113D] uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Bookmark size={15} className="text-[#542477]" /> Key Recruiter Talking Points
                        </h4>
                        <ul className="flex flex-col gap-3 m-0 p-0">
                          {strategyResult.key_talking_points.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-[#5F4E75]">
                              <CheckCircle2 size={16} className="text-[#16A34A] shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actionable Checklist */}
                    {strategyResult.application_checklist && (
                      <div>
                        <h4 className="text-xs font-bold text-[#27113D] uppercase tracking-wider mb-4 flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-[#542477]" /> Application Prep Checklist
                        </h4>
                        <div className="flex flex-col gap-2.5">
                          {strategyResult.application_checklist.map((item, idx) => (
                            <label key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] cursor-pointer hover:border-[#542477] transition-all group">
                              <input 
                                type="checkbox" 
                                defaultChecked={item.done} 
                                className="mt-1 w-4 h-4 text-[#542477] rounded border-[#E4D5F3] focus:ring-[#542477]"
                              />
                              <div className="flex-1">
                                <span className={`text-xs font-medium ${item.done ? 'text-[#8A7A9E] line-through' : 'text-[#27113D]'} transition-all block mb-1`}>
                                  {item.task}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                                  item.importance === 'Critical' ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]' : 'bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3]'
                                }`}>
                                  {item.importance}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Predicted Questions */}
                  {strategyResult.predicted_interview_questions && (
                    <div>
                      <h4 className="text-xs font-bold text-[#27113D] uppercase tracking-wider mb-4">Anticipated Interview Questions</h4>
                      <div className="flex flex-col gap-3">
                        {strategyResult.predicted_interview_questions.map((q, idx) => (
                          <div key={idx} className="bg-[#FAF7FD] border border-[#E4D5F3] rounded-2xl p-4">
                            <div className="flex justify-between items-start gap-4 mb-2">
                              <strong className="text-xs font-bold text-[#27113D]">Q{idx + 1}: {q.question}</strong>
                              <span className="px-2 py-0.5 bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-[10px] font-bold uppercase tracking-wider rounded-md shrink-0">
                                {q.type}
                              </span>
                            </div>
                            <p className="text-xs text-[#5F4E75] italic m-0">
                              <span className="font-bold not-italic text-[#27113D] mr-1">Strategy:</span>
                              {q.suggested_approach}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center mb-4">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="text-base font-bold text-[#27113D] mb-2">Strategy Unavailable</h4>
                  <p className="text-xs text-[#8A7A9E] max-w-md">The AI coaching service could not generate a strategy for this application right now. Please ensure the backend is connected and retry.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#E4D5F3] bg-[#FAF7FD] flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedAppForAI(null)}
                className="px-6 py-2.5 bg-white border border-[#E4D5F3] hover:bg-[#F3E9FF] text-[#27113D] text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Close Coach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
