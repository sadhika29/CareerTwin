import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenCheck, BriefcaseBusiness, MessageSquareText, Target } from 'lucide-react'
import { getCareerState, demoCareer } from '../features/career/careerService'
import { Page, ScoreGrid, demoScores } from './_shared'
import Loading from '../components/Loading'
import ScoreCard from '../components/ScoreCard'

export default function Dashboard() {
  const [career, setCareer] = useState(null)
  const [state, setState] = useState('loading')
  const applyCareer = data => { if (data.readiness_score == null) { setCareer(demoCareer); setState('demo') } else { setCareer(data); setState('ready') } }
  const load = () => { setState('loading'); getCareerState().then(applyCareer).catch(() => { setCareer(demoCareer); setState('demo') }) }
  useEffect(() => { getCareerState().then(applyCareer).catch(() => { setCareer(demoCareer); setState('demo') }) }, [])
  if (state === 'loading') return <Page title="Your career pulse" subtitle="A clear view of what to work on next."><Loading /></Page>
  return <Page eyebrow="Good morning, Navya 👋" title="Let's continue building your career." subtitle="Your personalized workspace for progress, preparation, and your next opportunity.">
    {state === 'demo' && <div className="notice" style={{ marginBottom:18 }}>Backend career state is not available yet, so demo data is shown.</div>}
    <div className="grid grid-2"><div className="card" style={{ display:'flex', alignItems:'center', gap:24 }}><div className="score-ring" style={{ '--score':`${career.readiness_score || 0}%` }}><strong>{career.readiness_score || 0}%</strong></div><div><div className="eyebrow">Overall career readiness</div><h2 style={{ margin:'8px 0' }}>Strong foundation</h2><p style={{ color:'var(--muted)', fontSize:13, lineHeight:1.5 }}>{career.next_action || 'Complete your first career analysis.'}</p><Link className="button" to="/preparation">Continue preparation <ArrowRight size={15} style={{ marginLeft:7 }} /></Link></div></div><div className="card"><div className="section-head" style={{ margin:'0 0 8px' }}><h2>Next best action</h2><Target size={20} color="var(--teal)" /></div><p style={{ color:'var(--muted)', fontSize:13, lineHeight:1.6 }}>Focus your next session on the area with the highest impact.</p><strong style={{ color:'var(--navy)' }}>{career.next_action || 'Complete your profile'}</strong><div style={{ marginTop:16 }}><Link className="text-button" to="/what-if">Explore what to improve <ArrowRight size={14} /></Link></div></div></div>
    <div className="section-head"><h2>Quick statistics</h2></div><div className="grid grid-4"><ScoreCard label="Career readiness" value={career.readiness_score || 72} /><ScoreCard label="Skills completed" value={68} /><ScoreCard label="Applications" value={12} /><ScoreCard label="Interview score" value={65} /></div>
    <div className="section-head"><h2>Readiness dimensions</h2><Link className="button secondary" to="/digital-twin">Open digital twin</Link></div><ScoreGrid scores={demoScores} keys={['resume','ats','job_match','dsa','aptitude','technical']} />
    <div className="section-head"><h2>Continue your journey</h2></div><div className="grid grid-3"><Link className="card" to="/resume"><FileAction icon={<BookOpenCheck size={20} />} title="Resume health" copy="Review your ATS signals and improvement suggestions." /></Link><Link className="card" to="/applications"><FileAction icon={<BriefcaseBusiness size={20} />} title="Application tracker" copy="Keep your roles, statuses, and next steps organized." /></Link><Link className="card" to="/interview"><FileAction icon={<MessageSquareText size={20} />} title="Interview room" copy="Start a focused mock interview and get feedback." /></Link></div>
    <button onClick={load} style={{ display:'none' }} aria-label="retry">Retry</button>
  </Page>
}
function FileAction({ icon, title, copy }) { return <><div style={{ color:'var(--teal)', marginBottom:14 }}>{icon}</div><h3>{title}</h3><p style={{ color:'var(--muted)', fontSize:13, lineHeight:1.5, margin:0 }}>{copy}</p></> }
