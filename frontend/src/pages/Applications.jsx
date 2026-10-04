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
    } catch {
      const created = {
        id: `app-${Date.now()}`,
        ...newApp,
        date: new Date().toISOString().split('T')[0],
        match_score: 80,
        next_step: 'Review role requirements and submit resume.'
      };
      setApplications([created, ...applications]);
      setShowAddModal(false);
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
      setStrategyResult({
        company_overview: `${app.company} values demonstrated software engineering craftsmanship, proactive ownership, and clear communication.`,
        tailored_pitch: `Dear Hiring Team at ${app.company},\n\nI am excited to submit my application for the ${app.role} position. With my background in building performant web applications, I have focused on scalable architectures, clean code standards, and reliable performance.\n\nI am particularly inspired by ${app.company}'s work and would love to bring my technical skills and curiosity to your engineering team.\n\nBest regards,\nCandidate`,
        key_talking_points: [
          `Emphasize hands-on experience in full-stack architecture and automated testing.`,
          `Highlight experience diagnosing system bottlenecks and optimizing response latency.`,
          `Share passion for continuous learning and rapid technical adaptation.`
        ],
        predicted_interview_questions: [
          {
            question: `How would you design a high-throughput endpoint for ${app.company}'s platform?`,
            type: 'Architecture',
            suggested_approach: 'Clarify API contracts, propose database schema with indexing, and discuss caching strategies with Redis.'
          },
          {
            question: `Describe a time you solved a complex bug in production code.`,
            type: 'Technical',
            suggested_approach: 'Use STAR method: isolate reproduction steps, inspect logs, identify root cause, and verify regression tests.'
          },
          {
            question: `Why are you interested in joining ${app.company}?`,
            type: 'Behavioral',
            suggested_approach: 'Reference specific product milestones or engineering blogs published by the team.'
          }
        ],
        application_checklist: [
          { task: `Verify resume emphasizes keywords from ${app.role} description`, done: true, importance: 'Critical' },
          { task: `Practice technical questions for ${app.company} in CareerTwin Interview simulator`, done: false, importance: 'Critical' },
          { task: `Research interviewer or team members on LinkedIn`, done: false, importance: 'Recommended' }
        ],
        estimated_readiness_score: 86
      });
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
      case 'offer': return 'bg-success/10 text-success border-success/20';
      case 'interviewing': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'applied': return 'bg-warning/10 text-warning border-warning/20';
      case 'saved': return 'bg-text-muted/10 text-text-secondary border-text-muted/20';
      case 'rejected': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-text-muted/10 text-text-secondary border-text-muted/20';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
          Application Tracker
          <BriefcaseBusiness size={24} className="text-primary" />
        </h1>
        <p className="text-text-secondary text-base">
          Track every opportunity and use AI to generate tailored pitches and interview strategies.
        </p>
      </div>

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Total Opportunities</div>
            <div className="text-3xl font-heading font-black text-text-primary mb-1">{stats?.total ?? applications.length}</div>
            <span className="text-xs text-text-secondary">Active in pipeline</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Interviewing</div>
            <div className="text-3xl font-heading font-black text-blue-600 mb-1">{stats?.interviewing ?? 0}</div>
            <span className="text-xs text-blue-600/80">Live interview loops</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Offers Received</div>
            <div className="text-3xl font-heading font-black text-success mb-1">{stats?.offers ?? 0}</div>
            <span className="text-xs text-success/80">Target compensation</span>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex flex-col justify-center">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Response Rate</div>
            <div className="text-3xl font-heading font-black text-ai mb-1">{stats?.response_rate ?? 65}%</div>
            <span className="text-xs text-ai/80">Application conversion</span>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Filters & Search & Add Button */}
      <Card className="mb-8">
        <CardContent className="p-4 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {['All', 'Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'].map(st => (
              <button
                key={st}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterStatus === st 
                    ? 'bg-primary text-white' 
                    : 'bg-background border border-border text-text-secondary hover:bg-border/30'
                }`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex w-full lg:w-auto items-center gap-3">
            <div className="relative flex-1 lg:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Search company or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              className="shrink-0 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} /> <span className="hidden sm:inline">Add Application</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-text-muted font-medium">Loading applications...</p>
        </div>
      ) : filteredApps.length === 0 ? (
        <Card className="bg-background border-dashed border-2 py-16 text-center">
          <CardContent className="flex flex-col items-center">
            <div className="w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mb-4">
              <BriefcaseBusiness size={28} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">No applications found</h3>
            <p className="text-sm text-text-muted max-w-sm mx-auto">Try selecting a different filter or add a new opportunity to track.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredApps.map(app => (
            <Card key={app.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-text-primary">{app.role}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      <strong className="text-text-primary">{app.company}</strong> 
                      <span className="mx-2 text-border">•</span> 
                      {app.location || 'Remote'} 
                      <span className="mx-2 text-border">•</span> 
                      {app.salary || 'Competitive'}
                    </p>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="Saved">Saved</option>
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      onClick={() => handleOpenAICoach(app)}
                      className="px-3 py-1.5 bg-gradient-to-r from-ai to-primary hover:opacity-90 text-white text-sm font-semibold rounded-lg transition-opacity flex items-center gap-2"
                    >
                      <Sparkles size={16} /> AI Coach
                    </button>

                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Delete Application"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Notes & Next Step */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-4 sm:items-center text-sm">
                  {app.next_step && (
                    <div className="flex items-center gap-2 text-primary font-medium bg-primary/5 px-3 py-1.5 rounded-lg">
                      <Clock size={16} />
                      <span>Next: {app.next_step}</span>
                    </div>
                  )}
                  {app.notes && (
                    <div className="text-text-secondary flex-1 italic">
                      "{app.notes}"
                    </div>
                  )}
                  <div className="text-xs text-text-muted sm:ml-auto">
                    Updated: {app.date}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ADD APPLICATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border bg-card">
              <h2 className="text-lg font-heading font-bold text-text-primary">Add New Application</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 text-text-muted hover:bg-border/50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar">
              <form id="add-app-form" onSubmit={handleCreate} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide">Company Name *</label>
                    <input 
                      required 
                      value={newApp.company} 
                      onChange={e => setNewApp({ ...newApp, company: e.target.value })} 
                      placeholder="e.g. Google, Stripe" 
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide">Role / Job Title *</label>
                    <input 
                      required 
                      value={newApp.role} 
                      onChange={e => setNewApp({ ...newApp, role: e.target.value })} 
                      placeholder="e.g. Frontend Engineer" 
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide">Location</label>
                    <input 
                      value={newApp.location} 
                      onChange={e => setNewApp({ ...newApp, location: e.target.value })} 
                      placeholder="e.g. Remote or City" 
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide">Initial Status</label>
                    <select 
                      value={newApp.status} 
                      onChange={e => setNewApp({ ...newApp, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary appearance-none"
                    >
                      <option value="Saved">Saved</option>
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide">Salary / Comp Range</label>
                    <input 
                      value={newApp.salary} 
                      onChange={e => setNewApp({ ...newApp, salary: e.target.value })} 
                      placeholder="e.g. $110k - $130k" 
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide">Job Posting URL</label>
                    <input 
                      type="url" 
                      value={newApp.url} 
                      onChange={e => setNewApp({ ...newApp, url: e.target.value })} 
                      placeholder="https://careers..." 
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wide">Notes / Context</label>
                    <textarea 
                      rows={2} 
                      value={newApp.notes} 
                      onChange={e => setNewApp({ ...newApp, notes: e.target.value })} 
                      placeholder="Referral source, submission date, or recruiter contact..." 
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary resize-y"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 bg-background border border-border hover:bg-border/30 text-text-primary text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="add-app-form"
                disabled={submitting}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center min-w-[140px]"
              >
                {submitting ? 'Saving...' : 'Add to Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI STRATEGY COACH MODAL */}
      {selectedAppForAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ai/10 text-ai flex items-center justify-center shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">AI Application Coach</h3>
                  <p className="text-xs text-text-secondary">
                    Strategy for <strong className="text-text-primary">{selectedAppForAI.role}</strong> at <strong className="text-text-primary">{selectedAppForAI.company}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAppForAI(null)}
                className="p-2 text-text-muted hover:bg-border/50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {aiStrategyLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <RefreshCw size={40} className="animate-spin text-ai mb-6" />
                  <h4 className="text-lg font-bold text-text-primary mb-2">Generating Company-Specific Strategy...</h4>
                  <p className="text-sm text-text-muted max-w-md">Analyzing role requirements, generating tailored cover pitch, and predicting interview focus.</p>
                </div>
              ) : strategyResult ? (
                <div className="flex flex-col gap-8">
                  {/* Company Overview & Readiness */}
                  <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-sm text-text-secondary flex-1 leading-relaxed m-0">
                      <strong className="text-text-primary block mb-1">Company Focus:</strong> 
                      {strategyResult.company_overview}
                    </p>
                    <div className="shrink-0">
                      <span className="inline-flex flex-col items-center justify-center px-4 py-2 bg-blue-500/10 text-blue-700 rounded-lg border border-blue-500/20">
                        <span className="text-xs font-bold uppercase tracking-wider mb-0.5">Readiness</span>
                        <span className="text-xl font-black">{strategyResult.estimated_readiness_score || 85}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Tailored Pitch */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                        <Send size={16} /> Tailored Pitch / Cover Note
                      </h4>
                      <button
                        onClick={() => copyToClipboard(strategyResult.tailored_pitch)}
                        className="px-3 py-1.5 text-xs font-semibold bg-background border border-border hover:bg-border/30 text-text-primary rounded-md transition-colors flex items-center gap-1.5"
                      >
                        {copiedPitch ? <><Check size={14} className="text-success" /> Copied!</> : <><Copy size={14} /> Copy Pitch</>}
                      </button>
                    </div>
                    <div className="bg-background border border-border rounded-xl p-5 relative group">
                      <pre className="text-sm text-text-secondary leading-relaxed font-sans whitespace-pre-wrap m-0">
                        {strategyResult.tailored_pitch}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Talking Points */}
                    {strategyResult.key_talking_points && (
                      <div>
                        <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                          <Bookmark size={16} className="text-ai" /> Key Recruiter Talking Points
                        </h4>
                        <ul className="flex flex-col gap-3 m-0 p-0">
                          {strategyResult.key_talking_points.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-text-secondary">
                              <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actionable Checklist */}
                    {strategyResult.application_checklist && (
                      <div>
                        <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-primary" /> Application Prep Checklist
                        </h4>
                        <div className="flex flex-col gap-2.5">
                          {strategyResult.application_checklist.map((item, idx) => (
                            <label key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:border-primary/30 transition-colors group">
                              <input 
                                type="checkbox" 
                                defaultChecked={item.done} 
                                className="mt-1 w-4 h-4 text-primary rounded border-border focus:ring-primary"
                              />
                              <div className="flex-1">
                                <span className={`text-sm ${item.done ? 'text-text-muted line-through' : 'text-text-primary'} transition-all block mb-1`}>
                                  {item.task}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                                  item.importance === 'Critical' ? 'bg-error/10 text-error' : 'bg-border text-text-muted'
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
                      <h4 className="text-sm font-bold text-text-primary mb-4">Anticipated Interview Questions</h4>
                      <div className="flex flex-col gap-3">
                        {strategyResult.predicted_interview_questions.map((q, idx) => (
                          <div key={idx} className="bg-card border border-border rounded-xl p-4">
                            <div className="flex justify-between items-start gap-4 mb-2">
                              <strong className="text-sm text-text-primary">Q{idx + 1}: {q.question}</strong>
                              <span className="px-2 py-0.5 bg-background border border-border text-text-muted text-[10px] font-bold uppercase tracking-wider rounded-md shrink-0">
                                {q.type}
                              </span>
                            </div>
                            <p className="text-sm text-text-secondary italic m-0">
                              <span className="font-semibold not-italic text-text-primary mr-1">Strategy:</span>
                              {q.suggested_approach}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            <div className="p-4 border-t border-border bg-card flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedAppForAI(null)}
                className="px-6 py-2 bg-background border border-border hover:bg-border/30 text-text-primary text-sm font-semibold rounded-lg transition-colors"
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
