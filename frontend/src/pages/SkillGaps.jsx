import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { getSkillTaxonomy, analyzeSkills } from '../features/skills/skillService';
import { getResumes } from '../features/resume/resumeService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { Target, X, Check, ArrowRight, BookOpen, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SkillGaps() {
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [currentSkills, setCurrentSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    // Fetch profile and resume to get real user skills
    Promise.allSettled([
      axiosClient.get('/profile'),
      getResumes(userId)
    ]).then(([profRes, resumeRes]) => {
      let combined = [];
      let detectedRole = 'Software Engineer';

      if (profRes.status === 'fulfilled' && profRes.value?.data?.profile) {
        const p = profRes.value.data.profile;
        if (p.skills && Array.isArray(p.skills)) combined = [...p.skills];
        if (p.target_role) detectedRole = p.target_role;
      }

      if (resumeRes.status === 'fulfilled') {
        const list = resumeRes.value?.resumes || resumeRes.value || [];
        if (list.length > 0 && list[0].analysis?.resume_skills) {
          combined = Array.from(new Set([...combined, ...list[0].analysis.resume_skills]));
        }
      }

      setTargetRole(detectedRole);
      setCurrentSkills(combined);
      runSkillGapAnalysis(detectedRole, combined);
    });
  }, []);

  const runSkillGapAnalysis = async (role, skills) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const reqSkills = roleTemplates[role] || roleTemplates['Software Engineer'];
      const res = await analyzeSkills({
        user_id: userId,
        current_skills: skills,
        job_required_skills: reqSkills,
        target_role: role
      });
      setAnalysis(res);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Skill gap analysis failed to complete.');
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs font-bold uppercase tracking-wider mb-2">
          <Target size={13} className="text-[#D83CC5]" />
          CareerTwin Skill Intelligence
        </div>
        <h1 className="text-3xl font-heading font-black text-[#27113D] tracking-tight flex items-center gap-3">
          Skill Intelligence
          <Target size={26} className="text-[#542477]" />
        </h1>
        <p className="text-[#5F4E75] text-base mt-1">Prioritize the smallest set of skills that unlocks your next role.</p>
      </div>

      {errorMsg && (
        <div className="bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-semibold p-4 rounded-xl mb-6 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="underline text-[11px] ml-2">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Controls Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
            <h3 className="text-lg font-heading font-black text-[#27113D] mb-4">Role Target</h3>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={handleRoleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] transition-all"
              >
                {Object.keys(roleTemplates).map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {analysis && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">Role Readiness</h4>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl font-heading font-black text-[#542477]">{analysis.skill_gap_score || 0}%</span>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-[#E4D5F3] overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#542477] to-[#D83CC5] transition-all duration-1000"
                        style={{ width: `${analysis.skill_gap_score || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#8A7A9E]">Based on overlap with top industry requirements.</p>
              </div>
            )}

            <div className="pt-6 border-t border-[#E4D5F3]">
              <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wider">
                Add Verified Skill
              </label>
              <form onSubmit={handleAddSkill} className="flex gap-2 mb-4">
                <input 
                  value={customSkillInput} 
                  onChange={e => setCustomSkillInput(e.target.value)} 
                  placeholder="e.g. Kubernetes, Redis..." 
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs text-[#27113D] placeholder-[#8A7A9E] focus:outline-none focus:border-[#542477]"
                />
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition-all">
                  Add
                </button>
              </form>

              <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-3">
                Your Profile ({currentSkills.length})
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {currentSkills.map((s, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477]">
                    {s}
                    <button 
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="text-[#8A7A9E] hover:text-[#E11D48] transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Output */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] border border-[#E4D5F3] rounded-2xl bg-white shadow-sm">
              <div className="w-10 h-10 border-4 border-[#E4D5F3] border-t-[#542477] rounded-full animate-spin mb-4"></div>
              <h2 className="text-sm font-heading font-bold text-[#27113D]">Analyzing skills...</h2>
            </div>
          ) : analysis ? (
            <>
              {/* Gap Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* High Priority Gaps */}
                <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-black text-[#E11D48] flex items-center gap-2 uppercase tracking-wide">
                      <AlertCircle size={18} /> High Priority
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E11D48]/10 text-[#E11D48] border border-[#FECDD3] text-[10px] font-black uppercase tracking-wider">
                      {highPriority.length} Gaps
                    </span>
                  </div>
                  <div>
                    {highPriority.length ? (
                      <ul className="flex flex-col gap-3.5">
                        {highPriority.map((item, idx) => (
                          <li key={idx} className="flex flex-col gap-0.5">
                            <strong className="text-sm font-bold text-[#27113D]">{item.skill_name}</strong>
                            <p className="text-xs text-[#5F4E75] leading-relaxed">{item.reason}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs font-semibold text-[#16A34A] flex items-center gap-2">
                        <CheckCircle2 size={16} /> No critical high priority gaps!
                      </div>
                    )}
                  </div>
                </div>

                {/* Medium Priority Gaps */}
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-black text-[#D97706] flex items-center gap-2 uppercase tracking-wide">
                      <AlertTriangle size={18} /> Medium Priority
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#D97706]/10 text-[#D97706] border border-[#FDE68A] text-[10px] font-black uppercase tracking-wider">
                      {mediumPriority.length} Gaps
                    </span>
                  </div>
                  <div>
                    {mediumPriority.length ? (
                      <ul className="flex flex-col gap-3.5">
                        {mediumPriority.map((item, idx) => (
                          <li key={idx} className="flex flex-col gap-0.5">
                            <strong className="text-sm font-bold text-[#27113D]">{item.skill_name}</strong>
                            <p className="text-xs text-[#5F4E75] leading-relaxed">{item.reason}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-[#8A7A9E]">No medium priority gaps.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Skills */}
                <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.03)]">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-black text-[#16A34A] flex items-center gap-2 uppercase tracking-wide">
                      <CheckCircle2 size={18} /> Verified Matches
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-black uppercase tracking-wider">
                      {matchedSkills.length} Matched
                    </span>
                  </div>
                  <div>
                    {matchedSkills.length ? (
                      <ul className="flex flex-col gap-2.5">
                        {matchedSkills.map((s, idx) => (
                          <li key={idx} className="flex justify-between items-center text-xs py-1 border-b border-[#FAF7FD] last:border-0">
                            <span className="font-bold text-[#27113D]">{s}</span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-md border border-[#BBF7D0]">
                              <Check size={12} /> Verified
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-[#8A7A9E]">No matching skills found.</div>
                    )}
                  </div>
                </div>

                {/* AI Recommendations */}
                {analysis.learning_recommendations && analysis.learning_recommendations.length > 0 && (
                  <div className="bg-gradient-to-br from-[#542477] to-[#7951D1] text-white rounded-2xl p-6 shadow-lg">
                    <div className="mb-4">
                      <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                        <BookOpen size={18} className="text-[#ED96D7]" /> Remediation Strategy
                      </h4>
                    </div>
                    <div>
                      <ul className="flex flex-col gap-3.5">
                        {analysis.learning_recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs">
                            <ArrowRight size={15} className="text-[#ED96D7] mt-0.5 shrink-0" />
                            <span className="leading-relaxed text-white/90">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
