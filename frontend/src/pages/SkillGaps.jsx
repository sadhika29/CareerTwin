import { useState, useEffect } from 'react';
import { getSkillTaxonomy, analyzeSkills } from '../features/skills/skillService';
import { getResumes } from '../features/resume/resumeService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { Target, X, Check, ArrowRight, BookOpen, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SkillGaps() {
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [currentSkills, setCurrentSkills] = useState(['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'Git']);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const userId = localStorage.getItem('career_user') || '';

  const roleTemplates = {
    'Software Engineer': ['Python', 'FastAPI', 'SQL', 'Docker', 'System Design', 'Git', 'Data Structures & Algorithms'],
    'Frontend Developer': ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'REST APIs', 'Git', 'Tailwind CSS'],
    'Backend Engineer': ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'System Design'],
    'Full Stack Engineer': ['React', 'Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'AWS'],
    'Data Scientist': ['Python', 'Machine Learning', 'PyTorch', 'SQL', 'Pandas', 'Statistics', 'Docker', 'AWS SageMaker'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Terraform', 'Git', 'Prometheus']
  };

  useEffect(() => {
    getResumes(userId).then(res => {
      const list = res.resumes || res || [];
      if (list.length > 0 && list[0].analysis?.resume_skills) {
        setCurrentSkills(list[0].analysis.resume_skills);
      }
    }).catch(() => {});

    runSkillGapAnalysis(targetRole, currentSkills);
  }, []);

  const runSkillGapAnalysis = async (role, skills) => {
    try {
      setLoading(true);
      const reqSkills = roleTemplates[role] || roleTemplates['Software Engineer'];
      const res = await analyzeSkills({
        user_id: userId,
        current_skills: skills,
        job_required_skills: reqSkills,
        target_role: role
      });
      setAnalysis(res);
    } catch (err) {
      console.warn('Skill analysis backend fallback:', err);
      const reqSkills = roleTemplates[role] || roleTemplates['Software Engineer'];
      const lowerCand = skills.map(s => s.toLowerCase());
      const matched = reqSkills.filter(s => lowerCand.includes(s.toLowerCase()));
      const gaps = reqSkills.filter(s => !lowerCand.includes(s.toLowerCase()));
      
      setAnalysis({
        current_skills: skills,
        required_skills: reqSkills,
        matched_skills: matched,
        skill_gaps: gaps,
        skill_gap_score: reqSkills.length ? Math.round((matched.length / reqSkills.length) * 100) : 30,
        priority_skills: gaps.map((g, idx) => ({
          skill_name: g,
          priority: idx === 0 ? 'HIGH' : idx === 1 ? 'HIGH' : 'MEDIUM',
          reason: `High demand proficiency required for ${role} career readiness.`
        })),
        learning_recommendations: [
          `Prioritize mastering ${gaps[0] || 'System Design'} through hands-on architecture exercises.`,
          `Build a portfolio project demonstrating integration with ${gaps[1] || 'Cloud Services'}.`
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setTargetRole(newRole);
    runSkillGapAnalysis(newRole, currentSkills);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!customSkillInput.trim()) return;
    const updated = Array.from(new Set([...currentSkills, customSkillInput.trim()]));
    setCurrentSkills(updated);
    setCustomSkillInput('');
    runSkillGapAnalysis(targetRole, updated);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = currentSkills.filter(s => s !== skillToRemove);
    setCurrentSkills(updated);
    runSkillGapAnalysis(targetRole, updated);
  };

  const highPriority = analysis?.priority_skills?.filter(p => (p.priority?.value || p.priority) === 'HIGH') || [];
  const mediumPriority = analysis?.priority_skills?.filter(p => (p.priority?.value || p.priority) === 'MEDIUM' || (p.priority?.value || p.priority) === 'LOW') || [];
  const matchedSkills = analysis?.matched_skills || [];

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
          Skill Intelligence
          <Target size={24} className="text-primary" />
        </h1>
        <p className="text-text-secondary text-base">Prioritize the smallest set of skills that unlocks your next role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Controls Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">
                  Target Role
                </label>
                <select
                  value={targetRole}
                  onChange={handleRoleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  {Object.keys(roleTemplates).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {analysis && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">Role Readiness</h4>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-3xl font-heading font-black text-primary">{analysis.skill_gap_score || 0}%</span>
                    <div className="flex-1">
                      <Progress value={analysis.skill_gap_score || 0} colorClass="bg-primary" showValue={false} />
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">Based on overlap with top industry requirements.</p>
                </div>
              )}

              <div className="pt-6 border-t border-border">
                <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">
                  Add Verified Skill
                </label>
                <form onSubmit={handleAddSkill} className="flex gap-2 mb-4">
                  <input 
                    value={customSkillInput} 
                    onChange={e => setCustomSkillInput(e.target.value)} 
                    placeholder="e.g. Kubernetes, Redis..." 
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg transition-colors">
                    Add
                  </button>
                </form>

                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
                  Your Profile ({currentSkills.length})
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {currentSkills.map((s, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-background border border-border text-text-secondary">
                      {s}
                      <button 
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-text-muted hover:text-error transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Output */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] border border-border rounded-xl bg-card">
              <div className="w-10 h-10 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
              <h2 className="text-lg font-heading font-semibold text-text-primary">Analyzing skills...</h2>
            </div>
          ) : analysis ? (
            <>
              {/* Gap Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* High Priority Gaps */}
                <Card className="border-error/20 bg-error/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
                  <CardHeader className="border-error/10 pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-error flex items-center gap-2">
                        <AlertCircle size={18} /> High Priority
                      </CardTitle>
                      <span className="px-2 py-0.5 rounded-md bg-error/20 text-error text-xs font-bold uppercase tracking-wider">
                        {highPriority.length} Gaps
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {highPriority.length ? (
                      <ul className="flex flex-col gap-4">
                        {highPriority.map((item, idx) => (
                          <li key={idx} className="flex flex-col gap-1">
                            <strong className="text-sm text-text-primary">{item.skill_name}</strong>
                            <p className="text-xs text-text-secondary leading-relaxed">{item.reason}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm font-medium text-success flex items-center gap-2">
                        <CheckCircle2 size={16} /> No critical high priority gaps!
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Medium Priority Gaps */}
                <Card className="border-warning/30 bg-warning/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-warning"></div>
                  <CardHeader className="border-warning/10 pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-warning flex items-center gap-2">
                        <AlertTriangle size={18} /> Medium Priority
                      </CardTitle>
                      <span className="px-2 py-0.5 rounded-md bg-warning/20 text-warning text-xs font-bold uppercase tracking-wider">
                        {mediumPriority.length} Gaps
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {mediumPriority.length ? (
                      <ul className="flex flex-col gap-4">
                        {mediumPriority.map((item, idx) => (
                          <li key={idx} className="flex flex-col gap-1">
                            <strong className="text-sm text-text-primary">{item.skill_name}</strong>
                            <p className="text-xs text-text-secondary leading-relaxed">{item.reason}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-text-muted">No medium priority gaps.</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Skills */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-success flex items-center gap-2">
                        <CheckCircle2 size={18} /> Verified Matches
                      </CardTitle>
                      <span className="px-2 py-0.5 rounded-md bg-success/20 text-success text-xs font-bold uppercase tracking-wider">
                        {matchedSkills.length} Matched
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {matchedSkills.length ? (
                      <ul className="flex flex-col gap-3">
                        {matchedSkills.map((s, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-text-primary">{s}</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-success">
                              <Check size={14} /> Verified
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-text-muted">No matching skills found.</div>
                    )}
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                {analysis.learning_recommendations && analysis.learning_recommendations.length > 0 && (
                  <Card className="bg-primary text-white border-none shadow-lg">
                    <CardHeader className="border-white/10 pb-4">
                      <CardTitle className="text-white flex items-center gap-2">
                        <BookOpen size={18} /> Remediation Strategy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="flex flex-col gap-4">
                        {analysis.learning_recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <ArrowRight size={16} className="text-white/70 mt-0.5 shrink-0" />
                            <span className="leading-relaxed text-white/90">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
