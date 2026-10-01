import { useState, useEffect } from 'react'
import { Page } from './_shared'
import { uploadResume, analyzeResume, listResumes } from '../features/resume/resumeService'
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react'


export default function Resume() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [pastResumes, setPastResumes] = useState([])

  // Load past resumes if available
  useEffect(() => {
    async function fetchPast() {
      try {
        const data = await listResumes()
        if (data && data.resumes) {
          setPastResumes(data.resumes)
        }
      } catch {
        // Silently fallback if local storage empty
      }
    }
    fetchPast()
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      const ext = selected.name.split('.').pop().toLowerCase()
      if (ext !== 'pdf' && ext !== 'docx') {
        setIsError(true)
        setMessage('Only PDF (.pdf) and Word (.docx) resumes are supported.')
        setFile(null)
        return
      }
      setFile(selected)
      setMessage('')
      setIsError(false)
    }
  }

  const [targetRole, setTargetRole] = useState('')

  const handleUpload = async () => {
    if (!file) {
      setIsError(true)
      return setMessage('Please select a PDF or DOCX resume file first.')
    }

    setUploading(true)
    setMessage('')
    setIsError(false)

    try {
      const result = await uploadResume(file)
      setIsError(false)
      setMessage(`Resume "${result.filename}" uploaded and parsed successfully!`)
      setPastResumes((prev) => [result, ...prev.filter((r) => r.resume_id !== result.resume_id)])

      // Automatically run ATS & Skill Analysis
      await runAnalysis(result.resume_id)
    } catch (err) {
      console.error('Upload error:', err)
      setIsError(true)
      const detail = err.response?.data?.detail || err.message || 'Failed to upload resume.'
      setMessage(typeof detail === 'string' ? detail : 'Resume upload failed. Please ensure the backend server is running.')
    } finally {
      setUploading(false)
    }
  }

  const runAnalysis = async (resumeId, customRole) => {
    setAnalyzing(true)
    try {
      const roleToSend = customRole !== undefined ? customRole : targetRole
      const result = await analyzeResume(resumeId, {
        target_role: roleToSend && roleToSend !== 'auto' ? roleToSend : undefined,
      })
      setAnalysisResult(result)
    } catch (err) {
      console.error('Analysis error:', err)
      setIsError(true)
      setMessage('Failed to complete real-time resume analysis.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Page
      eyebrow="CareerTwin · Resume Intelligence"
      title="Resume Health & ATS Intelligence"
      subtitle="Upload any candidate resume to extract skills, compute ATS compatibility scores, and discover missing keywords."
    >
      <div className="grid grid-2">

        {/* Upload Card */}
        <div className="card">
          <h2>Upload Resume</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Upload a PDF or Word document. Our parser extracts clean text, identifies sections, and triggers the Resume Intelligence Agent.
          </p>

          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: 10,
              padding: '28px 20px',
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer',
              marginBottom: 16,
            }}
            onClick={() => document.getElementById('resume-file-input').click()}
          >
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,.docx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div style={{ display: 'grid', placeItems: 'center', marginBottom: 10, color: 'var(--blue)' }}>
              <UploadCloud size={36} />
            </div>
            {file ? (
              <div>
                <strong style={{ color: 'var(--navy)', fontSize: 14 }}>{file.name}</strong>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB · Ready to upload
                </div>
              </div>
            ) : (
              <div>
                <strong style={{ color: 'var(--ink)', fontSize: 14 }}>Click to choose a file or drag & drop</strong>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Supported formats: PDF, DOCX (Max 10MB)</div>
              </div>
            )}
          </div>

          {/* Target Role Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
              Target Industry / Role (Optional)
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                background: '#fff',
                color: 'var(--ink)',
              }}
            >
              <option value="">🎯 Auto-Detect from Resume Content</option>
              <option value="Software Engineer">💻 Software Engineer</option>
              <option value="Frontend Developer">🎨 Frontend Developer</option>
              <option value="Backend Developer">⚙️ Backend Developer</option>
              <option value="Data Scientist">📊 Data Scientist / AI Engineer</option>
              <option value="Product Manager">🚀 Product Manager</option>
              <option value="Human Resources">👥 Human Resources (HR / Recruiter)</option>
              <option value="Digital Marketing">📈 Digital Marketing / Growth</option>
              <option value="Sales">💼 Sales & Business Development</option>
              <option value="Finance">💰 Finance & Accounting</option>
              <option value="UI/UX Designer">🖌️ UI/UX & Product Design</option>
              <option value="Operations Manager">📦 Operations & Supply Chain</option>
            </select>
          </div>

          <button
            className="button"
            style={{ width: '100%', padding: '12px 18px', fontSize: 13 }}
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? (
              <>
                <RefreshCw size={15} className="spin" style={{ marginRight: 8 }} />
                Parsing & Uploading Resume...
              </>
            ) : (
              <>
                <FileText size={15} style={{ marginRight: 8 }} />
                Upload & Process Resume
              </>
            )}
          </button>

          {message && (
            <div
              className={`notice ${isError ? 'error' : ''}`}
              style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>{message}</span>
            </div>
          )}

          {/* Past Uploads History */}
          {pastResumes.length > 0 && (
            <div style={{ marginTop: 24, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: 0.5 }}>
                Recent Resume Uploads
              </h3>
              <ul className="list" style={{ marginTop: 10 }}>
                {pastResumes.slice(0, 3).map((r) => (
                  <li key={r.resume_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={15} color="var(--blue)" />
                      <div>
                        <strong>{r.filename}</strong>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {r.file_type.toUpperCase()} · Status: {r.status}
                        </div>
                      </div>
                    </div>
                    <button
                      className="button secondary"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => runAnalysis(r.resume_id)}
                    >
                      Analyze
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Live Analysis Snapshot Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>ATS & Skill Intelligence</h2>
              {analysisResult?.inferred_domain && (
                <span className="tag blue" style={{ marginTop: 4, display: 'inline-block' }}>
                  Industry Domain: {analysisResult.inferred_domain}
                </span>
              )}
            </div>
            {analyzing && (
              <span className="tag" style={{ background: '#e0f2fe', color: 'var(--blue)' }}>
                <RefreshCw size={12} className="spin" style={{ display: 'inline', marginRight: 4 }} /> Analyzing...
              </span>
            )}
          </div>

          {analysisResult ? (
            <div style={{ display: 'grid', gap: 18 }}>
              {/* Document Validity Warning */}
              {analysisResult.is_valid_resume === false && (
                <div
                  style={{
                    padding: 14,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#991b1b',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Non-Resume Document Detected</strong>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {analysisResult.diagnostics?.validation_reason ||
                        'The uploaded file does not look like a standard career resume or CV. Please upload a document with experience, education, and skill sections.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Score Rings / Metrics */}
              <div className="grid grid-2">
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ font: "800 32px 'Manrope'", color: 'var(--navy)' }}>
                    {Math.round(analysisResult.ats_score || 0)}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    ATS Compatibility
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ font: "800 32px 'Manrope'", color: 'var(--teal)' }}>
                    {Math.round(analysisResult.resume_score || 0)}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Overall Resume Quality
                  </div>
                </div>
              </div>

              {/* ATS Formatting & Impact Diagnostics */}
              {analysisResult.diagnostics && (
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
                    ATS Health Diagnostics
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                    <div>
                      <strong>Action Verbs:</strong> {analysisResult.diagnostics.action_verbs_found?.length || 0} detected
                    </div>
                    <div>
                      <strong>Impact Metrics:</strong> {analysisResult.diagnostics.quantifiable_metrics?.length || 0} detected
                    </div>
                    <div>
                      <strong>Contact Completeness:</strong> {analysisResult.diagnostics.contact_completeness || 0}%
                    </div>
                    <div>
                      <strong>Section Structure:</strong> {Math.round(analysisResult.section_completeness || 0)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Skills */}
              <div>
                <h3 style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--ink)' }}>
                  Extracted Domain Skills ({analysisResult.resume_skills?.length || 0})
                </h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(analysisResult.resume_skills || []).map((skill, i) => (
                    <span key={i} className="tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Keyword Gaps */}
              {analysisResult.keyword_gaps?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--warning)' }}>Missing Industry Keywords</h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {analysisResult.keyword_gaps.map((gap, i) => (
                      <span key={i} className="tag orange">
                        + {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {analysisResult.resume_strengths?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--teal)' }}>Identified Strengths</h3>
                  <ul className="list">
                    {analysisResult.resume_strengths.map((str, i) => (
                      <li key={i} style={{ padding: '6px 0', fontSize: 12 }}>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h3 style={{ fontSize: 13, margin: '0 0 8px', color: 'var(--navy)' }}>Actionable Recommendations</h3>
                <ul className="list">
                  {(analysisResult.recommendations || []).map((rec, i) => (
                    <li key={i} style={{ padding: '6px 0', fontSize: 12 }}>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
              <ShieldCheck size={36} style={{ color: '#cbd5e1', marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 13 }}>
                Upload a resume on the left to see instant ATS matching, domain skill extraction, and keyword gap analysis across any profession.
              </p>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}
