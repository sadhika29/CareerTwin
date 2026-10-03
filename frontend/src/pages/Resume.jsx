import { useState, useEffect, useRef } from 'react';
import { uploadResume, analyzeResume, listResumes } from '../features/resume/resumeService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, RefreshCw, 
  ShieldCheck, Sparkles, Check, ChevronRight 
} from 'lucide-react';

export default function Resume() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [pastResumes, setPastResumes] = useState([]);
  const [targetRole, setTargetRole] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchPast() {
      try {
        const data = await listResumes();
        if (data && data.resumes) {
          setPastResumes(data.resumes);
        }
      } catch {
        // Silently fallback
      }
    }
    fetchPast();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const ext = selected.name.split('.').pop().toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        setIsError(true);
        setMessage('Only PDF (.pdf) and Word (.docx) resumes are supported.');
        setFile(null);
        return;
      }
      setFile(selected);
      setMessage('');
      setIsError(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setIsError(true);
      return setMessage('Please select a PDF or DOCX resume file first.');
    }

    setUploading(true);
    setMessage('');
    setIsError(false);

    try {
      const result = await uploadResume(file);
      setIsError(false);
      setMessage(`Resume "${result.filename}" uploaded and parsed successfully!`);
      setPastResumes((prev) => [result, ...prev.filter((r) => r.resume_id !== result.resume_id)]);
      await runAnalysis(result.resume_id);
    } catch (err) {
      console.error('Upload error:', err);
      setIsError(true);
      const detail = err.response?.data?.detail || err.message || 'Failed to upload resume.';
      setMessage(typeof detail === 'string' ? detail : 'Resume upload failed. Please ensure the backend server is running.');
    } finally {
      setUploading(false);
    }
  };

  const runAnalysis = async (resumeId, customRole) => {
    setAnalyzing(true);
    try {
      const roleToSend = customRole !== undefined ? customRole : targetRole;
      const result = await analyzeResume(resumeId, {
        target_role: roleToSend && roleToSend !== 'auto' ? roleToSend : undefined,
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setIsError(true);
      setMessage('Failed to complete real-time resume analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2 flex items-center gap-3">
          Resume Intelligence
          <Sparkles size={24} className="text-ai" />
        </h1>
        <p className="text-text-secondary text-base">
          Upload any candidate resume to extract skills, compute ATS compatibility scores, and discover missing keywords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side - Upload Workspace */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-muted mb-6">
                Upload a PDF or Word document. Our parser extracts clean text, identifies sections, and triggers the AI Agent.
              </p>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6 ${
                  file ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-border/30 hover:border-text-muted'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex justify-center mb-4 text-primary">
                  <UploadCloud size={40} strokeWidth={1.5} />
                </div>
                {file ? (
                  <div>
                    <strong className="text-text-primary text-sm font-semibold">{file.name}</strong>
                    <div className="text-xs text-text-muted mt-1">
                      {(file.size / 1024).toFixed(1)} KB · Ready to upload
                    </div>
                  </div>
                ) : (
                  <div>
                    <strong className="text-text-primary text-sm font-semibold block">Click to choose a file or drag & drop</strong>
                    <div className="text-xs text-text-muted mt-1">Supported formats: PDF, DOCX (Max 10MB)</div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-text-primary mb-2 uppercase tracking-wide">
                  Target Industry / Role (Optional)
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">🎯 Auto-Detect from Resume Content</option>
                  <option value="Software Engineer">💻 Software Engineer</option>
                  <option value="Frontend Developer">🎨 Frontend Developer</option>
                  <option value="Backend Developer">⚙️ Backend Developer</option>
                  <option value="Data Scientist">📊 Data Scientist / AI Engineer</option>
                  <option value="Product Manager">🚀 Product Manager</option>
                  <option value="UI/UX Designer">🖌️ UI/UX & Product Design</option>
                </select>
              </div>

              <button
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Parsing & Uploading...
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    Upload & Process Resume
                  </>
                )}
              </button>

              {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 text-sm ${isError ? 'bg-error/10 text-error border border-error/20' : 'bg-success/10 text-success border border-success/20'}`}>
                  {isError ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                  <span className="font-medium leading-relaxed">{message}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {pastResumes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xs uppercase tracking-widest text-text-muted">Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="flex flex-col gap-3">
                  {pastResumes.slice(0, 3).map((r) => (
                    <li key={r.resume_id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-primary/10 rounded-md shrink-0">
                          <FileText size={16} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-text-primary truncate">{r.filename}</div>
                          <div className="text-xs text-text-muted mt-0.5">
                            {r.file_type.toUpperCase()} · {r.status}
                          </div>
                        </div>
                      </div>
                      <button
                        className="shrink-0 ml-4 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-md transition-colors"
                        onClick={() => runAnalysis(r.resume_id)}
                      >
                        Analyze
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - Analysis Results */}
        <div className="lg:col-span-7">
          <Card className="h-full border-primary/20 bg-gradient-to-br from-background to-ai/5">
            <CardContent className="p-6 md:p-8 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-heading font-bold text-text-primary">ATS & Skill Intelligence</h2>
                  {analysisResult?.inferred_domain && (
                    <span className="inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ai/10 text-ai border border-ai/20">
                      Domain: {analysisResult.inferred_domain}
                    </span>
                  )}
                </div>
                {analyzing && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary animate-pulse">
                    <RefreshCw size={14} className="animate-spin" /> Analyzing...
                  </span>
                )}
              </div>

              {analysisResult ? (
                <div className="flex flex-col gap-6">
                  {analysisResult.is_valid_resume === false && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-start gap-3">
                      <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                      <div>
                        <strong className="block mb-1 font-bold">Non-Resume Document Detected</strong>
                        <div className="text-error/80 leading-relaxed">
                          {analysisResult.diagnostics?.validation_reason ||
                            'The uploaded file does not look like a standard career resume or CV. Please upload a document with experience, education, and skill sections.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Core Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-border p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                      <div className="text-4xl font-heading font-black text-text-primary mb-1">
                        {Math.round(analysisResult.ats_score || 0)}%
                      </div>
                      <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        ATS Compatibility
                      </div>
                    </div>
                    <div className="bg-white border border-border p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
                      <div className="text-4xl font-heading font-black text-ai mb-1">
                        {Math.round(analysisResult.resume_score || 0)}%
                      </div>
                      <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Overall Quality
                      </div>
                    </div>
                  </div>

                  {/* Skills & Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary mb-3">Extracted Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {(analysisResult.resume_skills || []).map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 bg-background border border-border text-text-secondary text-xs rounded-md font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {analysisResult.keyword_gaps?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-warning mb-3">Missing Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.keyword_gaps.map((gap, i) => (
                            <span key={i} className="px-2.5 py-1 bg-warning/10 border border-warning/20 text-warning text-xs rounded-md font-medium">
                              + {gap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Diagnostics */}
                  {analysisResult.diagnostics && (
                    <div className="bg-white border border-border p-5 rounded-xl mt-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
                        ATS Health Diagnostics
                      </h4>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="text-text-muted">Action Verbs</span>
                          <span className="font-semibold text-text-primary">{analysisResult.diagnostics.action_verbs_found?.length || 0} detected</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-text-muted">Impact Metrics</span>
                          <span className="font-semibold text-text-primary">{analysisResult.diagnostics.quantifiable_metrics?.length || 0} detected</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-text-muted">Contact Info</span>
                          <span className="font-semibold text-text-primary">{analysisResult.diagnostics.contact_completeness || 0}% complete</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-text-muted">Structure</span>
                          <span className="font-semibold text-text-primary">{Math.round(analysisResult.section_completeness || 0)}% complete</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Strengths & Recommendations */}
                  <div className="grid grid-cols-1 gap-6 mt-2">
                    {analysisResult.resume_strengths?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-success mb-3 flex items-center gap-2">
                          <CheckCircle2 size={16} /> Identified Strengths
                        </h3>
                        <ul className="flex flex-col gap-2">
                          {analysisResult.resume_strengths.map((str, i) => (
                            <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                              <Check size={14} className="text-success mt-1 shrink-0" />
                              <span className="leading-relaxed">{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.recommendations?.length > 0 && (
                      <div className="pt-4 border-t border-border/50">
                        <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                          <Sparkles size={16} /> Actionable Recommendations
                        </h3>
                        <ul className="flex flex-col gap-2">
                          {(analysisResult.recommendations || []).map((rec, i) => (
                            <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                              <ChevronRight size={14} className="text-primary mt-1 shrink-0" />
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-muted">
                  <div className="w-20 h-20 bg-background border border-border rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck size={40} className="text-border" />
                  </div>
                  <h3 className="text-lg font-heading font-bold text-text-primary mb-2">Awaiting Resume</h3>
                  <p className="text-sm max-w-sm mx-auto leading-relaxed">
                    Upload a resume on the left to see instant ATS matching, domain skill extraction, and keyword gap analysis across any profession.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
