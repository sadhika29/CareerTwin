import { useState, useEffect } from 'react'
import { Page, ListCard } from './_shared'
import { getSkillTaxonomy, analyzeSkills } from '../features/skills/skillService'
import { getResumes } from '../features/resume/resumeService'
import Loading from '../components/Loading'

export default function SkillGaps() {
  const [targetRole, setTargetRole] = useState('Software Engineer')
  const [currentSkills, setCurrentSkills] = useState(['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'Git'])
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [taxonomy, setTaxonomy] = useState([])

  const userId = 'demo-student'

  const roleTemplates = {
    'Software Engineer': ['Python', 'FastAPI', 'SQL', 'Docker', 'System Design', 'Git', 'Data Structures & Algorithms'],
    'Frontend Developer': ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'REST APIs', 'Git', 'Tailwind CSS'],
    'Backend Engineer': ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'System Design'],
    'Full Stack Engineer': ['React', 'Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'AWS'],
    'Data Scientist': ['Python', 'Machine Learning', 'PyTorch', 'SQL', 'Pandas', 'Statistics', 'Docker', 'AWS SageMaker'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Terraform', 'Git', 'Prometheus']
  }

  // Load candidate skills from resume
  useEffect(() => {
    getResumes(userId).then(res => {
      const list = res.resumes || res || []
      if (list.length > 0 && list[0].analysis?.resume_skills) {
        setCurrentSkills(list[0].analysis.resume_skills)
      }
    }).catch(() => {})

    getSkillTaxonomy().then(res => {
      if (res && res.skills) setTaxonomy(res.skills)
    }).catch(() => {})

    runSkillGapAnalysis(targetRole, currentSkills)
  }, [])

  const runSkillGapAnalysis = async (role, skills) => {
    try {
      setLoading(true)
      const reqSkills = roleTemplates[role] || roleTemplates['Software Engineer']
      const res = await analyzeSkills({
        user_id: userId,
        current_skills: skills,
        job_required_skills: reqSkills,
        target_role: role
      })
      setAnalysis(res)
    } catch (err) {
      console.warn('Skill analysis backend fallback:', err)
      // High fidelity client fallback
      const reqSkills = roleTemplates[role] || roleTemplates['Software Engineer']
      const lowerCand = skills.map(s => s.toLowerCase())
      const matched = reqSkills.filter(s => lowerCand.includes(s.toLowerCase()))
      const gaps = reqSkills.filter(s => !lowerCand.includes(s.toLowerCase()))
      
      setAnalysis({
        current_skills: skills,
        required_skills: reqSkills,
        matched_skills: matched,
        skill_gaps: gaps,
        skill_gap_score: reqSkills.length ? Math.round((gaps.length / reqSkills.length) * 100) : 30,
        priority_skills: gaps.map((g, idx) => ({
          skill_name: g,
          priority: idx === 0 ? 'HIGH' : idx === 1 ? 'HIGH' : 'MEDIUM',
          reason: `High demand proficiency required for ${role} career readiness.`
        })),
        learning_recommendations: [
          `Prioritize mastering ${gaps[0] || 'System Design'} through hands-on architecture exercises.`,
          `Build a portfolio project demonstrating integration with ${gaps[1] || 'Cloud Services'}.`
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (e) => {
    const newRole = e.target.value
    setTargetRole(newRole)
    runSkillGapAnalysis(newRole, currentSkills)
  }

  const handleAddSkill = (e) => {
    e.preventDefault()
    if (!customSkillInput.trim()) return
    const updated = Array.from(new Set([...currentSkills, customSkillInput.trim()]))
    setCurrentSkills(updated)
    setCustomSkillInput('')
    runSkillGapAnalysis(targetRole, updated)
  }

  const handleRemoveSkill = (skillToRemove) => {
    const updated = currentSkills.filter(s => s !== skillToRemove)
    setCurrentSkills(updated)
    runSkillGapAnalysis(targetRole, updated)
  }

  const highPriority = analysis?.priority_skills?.filter(p => (p.priority?.value || p.priority) === 'HIGH') || []
  const mediumPriority = analysis?.priority_skills?.filter(p => (p.priority?.value || p.priority) === 'MEDIUM' || (p.priority?.value || p.priority) === 'LOW') || []
  const matchedSkills = analysis?.matched_skills || []

  return (
    <Page title="Skill gaps" subtitle="Prioritize the smallest set of skills that unlocks your next role.">
      {/* Controls Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <div className="field">
            <label>Target Role</label>
            <select value={targetRole} onChange={handleRoleChange}>
              {Object.keys(roleTemplates).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ gridColumn: '2 / -1' }}>
            <label>Add Skill to Candidate Profile</label>
            <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: 8 }}>
              <input 
                value={customSkillInput} 
                onChange={e => setCustomSkillInput(e.target.value)} 
                placeholder="e.g. Kubernetes, Redis, GraphQL" 
              />
              <button type="submit" className="button" style={{ whiteSpace: 'nowrap' }}>+ Add</button>
            </form>
          </div>
        </div>

        {/* Current Active Skills */}
        <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
            Your Verified Skills ({currentSkills.length}):
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {currentSkills.map((s, idx) => (
              <span key={idx} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {s}
                <span 
                  onClick={() => handleRemoveSkill(s)} 
                  style={{ cursor: 'pointer', fontWeight: 'bold', color: 'var(--muted)' }}
                  title="Remove skill"
                >
                  ×
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Output */}
      {loading ? (
        <Loading />
      ) : analysis ? (
        <>
          <div className="grid grid-3" style={{ marginBottom: 20 }}>
            {/* High Priority Gaps */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ fontSize: 17, color: '#b91c1c' }}>High priority</h3>
                <span className="tag red">{highPriority.length} gaps</span>
              </div>
              {highPriority.length ? (
                <ul className="list">
                  {highPriority.map((item, idx) => (
                    <li key={idx} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '10px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <strong>{item.skill_name}</strong>
                        <span className="tag red">high</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{item.reason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty" style={{ color: '#16a34a' }}>No critical high priority gaps!</div>
              )}
            </div>

            {/* Medium Priority Gaps */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ fontSize: 17, color: '#c2410c' }}>Medium priority</h3>
                <span className="tag orange">{mediumPriority.length} gaps</span>
              </div>
              {mediumPriority.length ? (
                <ul className="list">
                  {mediumPriority.map((item, idx) => (
                    <li key={idx} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: '10px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <strong>{item.skill_name}</strong>
                        <span className="tag orange">medium</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{item.reason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty">No medium gaps identified.</div>
              )}
            </div>

            {/* Matched Skills */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ fontSize: 17, color: '#15803d' }}>Matched skills</h3>
                <span className="tag" style={{ background: '#dcfce7', color: '#166534' }}>{matchedSkills.length} matched</span>
              </div>
              {matchedSkills.length ? (
                <ul className="list">
                  {matchedSkills.map((s, idx) => (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span>{s}</span>
                      <span className="tag" style={{ background: '#dcfce7', color: '#166534' }}>✓ verified</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty">No skills matched yet.</div>
              )}
            </div>
          </div>

          {/* AI Recommendations */}
          {analysis.learning_recommendations && analysis.learning_recommendations.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: 10, fontSize: 16 }}>🎯 Actionable Skill Remediation Strategy</h3>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {analysis.learning_recommendations.map((rec, i) => (
                  <li key={i} style={{ marginBottom: 8, fontSize: 14, color: 'var(--text-secondary, #334155)', lineHeight: 1.5 }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : null}
    </Page>
  )
}
