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
    <div className="animate-in fade-in duration-500 pb-12 space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles size={14} className="text-[#D83CC5]" />
          <span>Resume & ATS Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D] tracking-tight">
          Resume Intelligence & Parser
        </h1>
        <p className="text-[#78678C] text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
          Upload any candidate resume to extract skills, compute ATS compatibility scores, and discover missing keywords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side - Upload Workspace */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
            <h2 className="text-lg font-bold text-[#27113D] mb-1">Upload Resume</h2>
            <p className="text-xs text-[#78678C] mb-6 leading-relaxed">
              Upload a PDF or Word document. Our parser extracts clean text, identifies sections, and triggers the AI Agent.
            </p>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-6 ${
                file ? 'border-[#542477] bg-[#F3E9FF]/40' : 'border-[#C4A4DA] bg-[#FAF7FD] hover:bg-[#F3E9FF]/30 hover:border-[#7951D1]'
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
              <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-[#F3E9FF] border border-[#E4D5F3] flex items-center justify-center text-[#542477]">
                <UploadCloud size={28} strokeWidth={1.75} />
              </div>
              {file ? (
                <div>
                  <strong className="text-[#27113D] text-sm font-bold block">{file.name}</strong>
                  <div className="text-xs text-[#78678C] mt-1 font-medium">
                    {(file.size / 1024).toFixed(1)} KB · Ready to process
                  </div>
                </div>
              ) : (
                <div>
                  <strong className="text-[#27113D] text-sm font-semibold block">Click to browse or drag & drop</strong>
                  <div className="text-xs text-[#8A7A9E] mt-1">Supports PDF & DOCX up to 10MB</div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wide">
                Target Industry / Role (Optional)
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-sm text-[#27113D] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all cursor-pointer"
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
              className="w-full bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold py-3 px-6 rounded-full shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:shadow-[0_6px_22px_rgba(84,36,119,0.35)] hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
              <div className={`mt-4 p-3.5 rounded-xl flex items-start gap-3 text-xs sm:text-sm ${isError ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]' : 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'}`}>
                {isError ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                <span className="font-semibold leading-relaxed">{message}</span>
              </div>
            )}
          </div>

          {pastResumes.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A7A9E] mb-3">Recent Uploads</h3>
              <ul className="flex flex-col gap-2.5">
                {pastResumes.slice(0, 3).map((r) => (
                  <li key={r.resume_id} className="flex justify-between items-center p-3 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] hover:bg-[#F3E9FF]/40 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-[#F3E9FF] rounded-lg shrink-0 text-[#542477]">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-[#27113D] truncate">{r.filename}</div>
                        <div className="text-[11px] text-[#78678C] mt-0.5">
                          {r.file_type.toUpperCase()} · {r.status}
                        </div>
                      </div>
                    </div>
                    <button
                      className="shrink-0 ml-4 px-3 py-1 text-xs font-bold text-[#542477] bg-[#F3E9FF] hover:bg-[#542477] hover:text-white rounded-full transition-colors cursor-pointer"
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

        {/* Right Side - Analysis Results */}
        <div className="lg:col-span-7">
          <div className="h-full rounded-2xl border border-[#E4D5F3] bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D]">
                  ATS & Skill Intelligence
                </h2>
                {analysisResult?.inferred_domain && (
                  <span className="inline-flex mt-2 items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3]">
                    Domain: {analysisResult.inferred_domain}
                  </span>
                )}
              </div>
              {analyzing && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3] animate-pulse">
                  <RefreshCw size={14} className="animate-spin" /> Analyzing...
                </span>
              )}
            </div>

            {analysisResult ? (
              <div className="flex flex-col gap-6">
                {analysisResult.is_valid_resume === false && (
                  <div className="p-4 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl text-[#E11D48] text-xs sm:text-sm flex items-start gap-3">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-1 font-bold">Non-Resume Document Detected</strong>
                      <div className="opacity-90 leading-relaxed">
                        {analysisResult.diagnostics?.validation_reason ||
                          'The uploaded file does not look like a standard career resume or CV. Please upload a document with experience, education, and skill sections.'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Core Scores */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#FAF7FD] border border-[#E4D5F3] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="text-4xl font-extrabold text-[#542477] mb-1">
                      {Math.round(analysisResult.ats_score || 0)}%
                    </div>
                    <div className="text-xs font-bold text-[#78678C] uppercase tracking-wider">
                      ATS Compatibility
                    </div>
                  </div>
                  <div className="bg-[#FAF7FD] border border-[#E4D5F3] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="text-4xl font-extrabold text-[#D83CC5] mb-1">
                      {Math.round(analysisResult.resume_score || 0)}%
                    </div>
                    <div className="text-xs font-bold text-[#78678C] uppercase tracking-wider">
                      Overall Quality
                    </div>
                  </div>
                </div>

                {/* Skills & Gaps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#27113D] mb-3">Extracted Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {(analysisResult.resume_skills || []).map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs rounded-lg font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {analysisResult.keyword_gaps?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#D97706] mb-3">Missing Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.keyword_gaps.map((gap, i) => (
                          <span key={i} className="px-3 py-1 bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] text-xs rounded-lg font-medium">
                            + {gap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Diagnostics */}
                {analysisResult.diagnostics && (
                  <div className="bg-[#FAF7FD] border border-[#E4D5F3] p-5 rounded-2xl">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#78678C] mb-4">
                      ATS Health Diagnostics
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="text-[#8A7A9E]">Action Verbs</span>
                        <span className="font-bold text-[#27113D] text-sm">{analysisResult.diagnostics.action_verbs_found?.length || 0} found</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[#8A7A9E]">Impact Metrics</span>
                        <span className="font-bold text-[#27113D] text-sm">{analysisResult.diagnostics.quantifiable_metrics?.length || 0} found</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[#8A7A9E]">Contact Info</span>
                        <span className="font-bold text-[#16A34A] text-sm">{analysisResult.diagnostics.contact_completeness || 0}% complete</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[#8A7A9E]">Structure</span>
                        <span className="font-bold text-[#542477] text-sm">{Math.round(analysisResult.section_completeness || 0)}% complete</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations?.length > 0 && (
                  <div className="pt-4 border-t border-[#E4D5F3]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#542477] mb-3 flex items-center gap-1.5">
                      <Sparkles size={15} /> Actionable AI Recommendations
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {(analysisResult.recommendations || []).map((rec, i) => (
                        <li key={i} className="text-xs sm:text-sm text-[#5F4E75] flex items-start gap-2">
                          <ChevronRight size={15} className="text-[#542477] mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8A7A9E]">
                <div className="w-16 h-16 bg-[#F3E9FF] border border-[#E4D5F3] rounded-2xl flex items-center justify-center mb-4 text-[#542477]">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-base font-bold text-[#27113D] mb-1">Awaiting Resume</h3>
                <p className="text-xs sm:text-sm max-w-sm mx-auto leading-relaxed text-[#78678C]">
                  Upload a resume on the left to see instant ATS matching, domain skill extraction, and keyword gap analysis across any profession.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
