import { GenericModule } from './_shared'

const applications = [
  { company: 'Northstar Labs', role: 'Frontend Engineer', status: 'Interview', date: 'Jun 21' },
  { company: 'Orbit Systems', role: 'Product Engineer', status: 'Applied', date: 'Jun 18' },
  { company: 'Fieldwork', role: 'UI Platform Engineer', status: 'Saved', date: 'Jun 12' },
]

export default function Applications() { return <GenericModule title="Application tracker" subtitle="Keep every opportunity, next step, and conversation in one place."><div className="card"><div className="table-wrap"><table className="data-table"><thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Updated</th><th /></tr></thead><tbody>{applications.map(application => <tr key={application.company}><td><strong>{application.company}</strong></td><td>{application.role}</td><td><span className={`status status-${application.status.toLowerCase()}`}>{application.status}</span></td><td>{application.date}</td><td><button className="text-button">View</button></td></tr>)}</tbody></table></div></div></GenericModule> }
