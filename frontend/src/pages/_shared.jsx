/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ScoreCard from '../components/ScoreCard'

export const demoScores = { resume:82, ats:78, job_match:76, dsa:61, aptitude:74, technical:70, communication:72, interview:65 }
export function Page({ eyebrow='CareerTwin', title, subtitle, children }) { return <div className="content"><div className="eyebrow">{eyebrow}</div><h2 className="page-title">{title}</h2><p className="page-subtitle">{subtitle}</p>{children}</div> }
export function DemoNotice() { return <div className="notice" style={{ marginBottom:18 }}>Showing demo data until the corresponding backend endpoint is available.</div> }
export function ScoreGrid({ scores=demoScores, keys=['resume','job_match','dsa','aptitude','technical','interview'] }) { return <div className="grid grid-3">{keys.map(key => <ScoreCard key={key} label={key.replace('_',' ')} value={scores[key] ?? 0} />)}</div> }
export function ListCard({ title, items, empty='Nothing here yet.' }) { return <div className="card"><h2>{title}</h2>{items?.length ? <ul className="list">{items.map((item,index) => <li key={index}>{typeof item === 'string' ? item : <><span>{item.name}</span><span className={`tag ${item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : ''}`}>{item.priority || item.value || 'View'}</span></>}</li>)}</ul> : <div className="empty">{empty}</div>}</div> }
export function TrendChart() { 
  const data=[{name:'Jun 1',value:58},{name:'Jun 8',value:63},{name:'Jun 15',value:66},{name:'Jun 22',value:72}]; 
  return (
    <div style={{ width:'100%', height:220 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{fontSize:11, fill: '#78678C'}} axisLine={{ stroke: '#E4D5F3' }} tickLine={false} />
          <YAxis domain={[0,100]} tick={{fontSize:11, fill: '#78678C'}} axisLine={{ stroke: '#E4D5F3' }} tickLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E4D5F3', borderRadius: '12px', boxShadow: '0 4px 16px rgba(84,36,119,0.08)', fontSize: '12px', fontWeight: 600, color: '#27113D' }} 
          />
          <Line type="monotone" dataKey="value" stroke="#542477" strokeWidth={3} dot={{r: 4, fill: '#D83CC5', stroke: '#542477', strokeWidth: 1.5}} activeDot={{r: 6, fill: '#D83CC5'}} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  ) 
}
export function GenericModule({ title, subtitle, children }) { return <Page title={title} subtitle={subtitle}>{children}</Page> }

