import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCareerState, demoCareer } from '../features/career/careerService'
import { Page, ScoreGrid, demoScores, ListCard } from './_shared'
import Loading from '../components/Loading'

export default function Dashboard() {
  const [career, setCareer] = useState(null)
  const [state, setState] = useState('loading')
  const load = () => {
    setState('loading')
    getCareerState().then((data) => { setCareer(data); setState('ready') }).catch(() => { setCareer(demoCareer); setState('demo') })
  }
  useEffect(() => {
    getCareerState().then((data) => { setCareer(data); setState('ready') }).catch(() => { setCareer(demoCareer); setState('demo') })
  }, [])
  if (state === 'loading') return <Page title="Your career pulse" subtitle="A clear view of what to work on next."><Loading /></Page>
  return <Page eyebrow="Good morning, Navya" title="Your career pulse" subtitle="Turn scattered preparation into a plan you can act on.">
    {state === 'demo' && <div className="notice" style={{ marginBottom:18 }}>Backend career state is not available yet, so demo data is shown.</div>}
    <div className="grid grid-2"><div className="card" style={{ display:'flex', alignItems:'center', gap:24 }}><div className="score-ring" style={{ '--score':`${career.readiness_score || 0}%` }}><strong>{career.readiness_score || 0}%</strong></div><div><div className="eyebrow">Overall readiness</div><h2 style={{ margin:'8px 0' }}>Keep the momentum</h2><p style={{ color:'var(--muted)', fontSize:13 }}>{career.next_action || 'Complete your first career analysis.'}</p><Link className="button" to="/what-if">Plan next step</Link></div></div><ListCard title="Next best action" items={[career.next_action || 'Complete your profile', ...(career.skill_gaps || []).slice(0,2)]} /></div>
    <div className="section-head"><h2>Readiness dimensions</h2><Link className="button secondary" to="/digital-twin">Open digital twin</Link></div><ScoreGrid scores={demoScores} keys={['resume','ats','job_match','dsa','aptitude','technical']} />
    <div className="section-head"><h2>Continue your journey</h2></div><div className="grid grid-3"><Link className="card" to="/resume"><h3>Resume health</h3><p style={{ color:'var(--muted)', fontSize:13 }}>Upload and review your ATS signals.</p></Link><Link className="card" to="/preparation"><h3>Today's preparation</h3><p style={{ color:'var(--muted)', fontSize:13 }}>Practice the highest-impact topic next.</p></Link><Link className="card" to="/interview"><h3>Interview room</h3><p style={{ color:'var(--muted)', fontSize:13 }}>Start a focused mock interview.</p></Link></div>
    <button onClick={load} style={{ display:'none' }} aria-label="retry">Retry</button>
  </Page>
}
