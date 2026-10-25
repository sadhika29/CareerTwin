import { useState, useEffect, useRef } from 'react';
import { 
  uploadResume, 
  analyzeResume, 
  listResumes, 
  getResume,
  saveAnalysis, 
  listSavedAnalyses, 
  deleteSavedAnalysis 
} from '../features/resume/resumeService';
import { auth } from '../firebase';
import { 
  UploadCloud, FileText, CheckCircle2, AlertTriangle, RefreshCw, 
  ShieldCheck, Sparkles, Check, ChevronRight, Bookmark, BookmarkCheck,
  Trash2, History, Target, AlertCircle, FileSearch, ArrowRight, Lightbulb,
  Info
} from 'lucide-react';

export default function Resume() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [activeFilename, setActiveFilename] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [pastResumes, setPastResumes] = useState([]);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPersistentResumeData() {
      setLoadingInitial(true);
      try {
        const uid = auth?.currentUser?.uid || localStorage.getItem('career_user') || '';

        const [resumesRes, savedRes] = await Promise.allSettled([
          listResumes(uid),
          listSavedAnalyses(uid),
        ]);

        const fetchedResumes = resumesRes.status === 'fulfilled' && resumesRes.value?.resumes ? resumesRes.value.resumes : [];
        const fetchedAnalyses = savedRes.status === 'fulfilled' && savedRes.value?.analyses ? savedRes.value.analyses : [];

        if (!isMounted) return;

        setPastResumes(fetchedResumes);
        setSavedAnalyses(fetchedAnalyses);

        // Check if an analysis was previously active in this browser session
        const lastSavedAnalysisId = sessionStorage.getItem('career_active_analysis_id');
        const lastActiveResumeId = sessionStorage.getItem('career_active_resume_id');

        let targetSaved = null;
        if (lastSavedAnalysisId) {
          targetSaved = fetchedAnalyses.find((a) => a.analysis_id === lastSavedAnalysisId);
        }
        if (!targetSaved && lastActiveResumeId) {
          targetSaved = fetchedAnalyses.find((a) => a.resume_id === lastActiveResumeId);
        }
        // Fall back to the most recent saved analysis
        if (!targetSaved && fetchedAnalyses.length > 0) {
          targetSaved = fetchedAnalyses[0];
        }

        if (targetSaved) {
          handleLoadSaved(targetSaved);
        } else if (fetchedResumes.length > 0) {
          // If no saved analysis is found, restore the active resume record from Firestore
          const targetResume = (lastActiveResumeId && fetchedResumes.find((r) => r.resume_id === lastActiveResumeId)) || fetchedResumes[0];
          setActiveResumeId(targetResume.resume_id);
          setActiveFilename(targetResume.filename);
          sessionStorage.setItem('career_active_resume_id', targetResume.resume_id);

          try {
            const detail = await getResume(targetResume.resume_id, uid);
            if (isMounted && detail) {
              const an = detail.analysis;
              if (an && (an.resume_score || an.ats_score || (an.resume_skills && an.resume_skills.length) || (detail.skills && detail.skills.length))) {
                setAnalysisResult({
                  resume_score: an.resume_score || detail.resume_score || 0,
                  ats_score: an.ats_score || detail.ats_score || null,
                  has_target_job: Boolean(an.has_target_job || an.job_description),
                  inferred_domain: an.inferred_domain || 'General Professional',
                  resume_skills: an.resume_skills || detail.skills || [],
                  missing_keywords: an.missing_keywords || [],
                  missing_keyword_details: an.missing_keyword_details || [],
                  grammar_issues: an.grammar_issues || [],
                  structured_recommendations: an.structured_recommendations || [],
                  recommendations: an.recommendations || [],
                  sentence_improvements: an.sentence_improvements || [],
                  is_valid_resume: true,
                });
                if (detail.job_description) setJobDescription(detail.job_description);
                setSaveSuccess(false);
              }
            }
          } catch {
            // Document has no prior analysis
          }
        }
      } catch (err) {
        console.error('Error restoring persistent resume data:', err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadPersistentResumeData();

    return () => {
      isMounted = false;
    };
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
      setSaveSuccess(false);
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
    setSaveSuccess(false);
    setSaveError('');

    try {
      const result = await uploadResume(file);
      setIsError(false);
      setMessage(`Resume "${result.filename}" uploaded and parsed successfully!`);
      setActiveResumeId(result.resume_id);
      setActiveFilename(result.filename);
      sessionStorage.setItem('career_active_resume_id', result.resume_id);
      setPastResumes((prev) => [result, ...prev.filter((r) => r.resume_id !== result.resume_id)]);
      await runAnalysis(result.resume_id, targetRole, jobDescription, result.filename);
    } catch (err) {
      console.error('Upload error:', err);
      setIsError(true);
      const detail = err.response?.data?.detail || err.message || 'Failed to upload resume.';
      setMessage(typeof detail === 'string' ? detail : 'Resume upload failed. Please ensure the backend server is running.');
    } finally {
      setUploading(false);
    }
  };

  const runAnalysis = async (resumeId, customRole, customJD, customFilename) => {
    setAnalyzing(true);
    setSaveSuccess(false);
    setSaveError('');
    setActiveTab('current');
    try {
      const roleToSend = customRole !== undefined ? customRole : targetRole;
      const jdToSend = customJD !== undefined ? customJD : jobDescription;
      const result = await analyzeResume(resumeId, {
        target_role: roleToSend && roleToSend !== 'auto' ? roleToSend : undefined,
        job_description: jdToSend && jdToSend.trim() ? jdToSend.trim() : undefined,
      });
      setAnalysisResult(result);
      setActiveResumeId(resumeId);
      sessionStorage.setItem('career_active_resume_id', resumeId);
      if (customFilename) {
        setActiveFilename(customFilename);
      } else {
        const found = pastResumes.find((r) => r.resume_id === resumeId);
        if (found) setActiveFilename(found.filename);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setIsError(true);
      setMessage('Failed to complete real-time resume analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult || !activeResumeId || saving) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        resume_id: activeResumeId,
        filename: activeFilename || 'Resume.pdf',
        job_description: jobDescription || '',
        target_role: targetRole || '',
        ats_score: analysisResult.ats_score,
        resume_score: analysisResult.resume_score,
        has_target_job: Boolean(analysisResult.has_target_job || (jobDescription && jobDescription.trim())),
        resume_skills: analysisResult.resume_skills || [],
        missing_keywords: analysisResult.missing_keywords || [],
        missing_keyword_details: analysisResult.missing_keyword_details || [],
        grammar_issues: analysisResult.grammar_issues || [],
        structured_recommendations: analysisResult.structured_recommendations || [],
        recommendations: analysisResult.recommendations || [],
        sentence_improvements: analysisResult.sentence_improvements || [],
        inferred_domain: analysisResult.inferred_domain || 'General Professional',
      };
      const saved = await saveAnalysis(payload);
      setSaveSuccess(true);
      setSavedAnalyses((prev) => [saved, ...prev.filter((a) => a.analysis_id !== saved.analysis_id)]);
      if (saved.analysis_id) sessionStorage.setItem('career_active_analysis_id', saved.analysis_id);
    } catch (err) {
      console.error('Save analysis error:', err);
      setSaveError(err.response?.data?.detail || err.message || 'Failed to save analysis.');
      // Do not clear the user's analysis results when saving fails
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSaved = (saved) => {
    setActiveResumeId(saved.resume_id);
    setActiveFilename(saved.filename);
    setTargetRole(saved.target_role || '');
    setJobDescription(saved.job_description || '');
    setAnalysisResult({
      resume_score: saved.resume_score,
      ats_score: saved.ats_score,
      has_target_job: saved.has_target_job,
      inferred_domain: saved.inferred_domain,
      resume_skills: saved.resume_skills || [],
      missing_keywords: saved.missing_keywords || [],
      missing_keyword_details: saved.missing_keyword_details || [],
      grammar_issues: saved.grammar_issues || [],
      structured_recommendations: saved.structured_recommendations || [],
      recommendations: saved.recommendations || [],
      sentence_improvements: saved.sentence_improvements || [],
      is_valid_resume: true,
    });
    setSaveSuccess(true);
    setSaveError('');
    setActiveTab('current');
    if (saved.analysis_id) sessionStorage.setItem('career_active_analysis_id', saved.analysis_id);
    if (saved.resume_id) sessionStorage.setItem('career_active_resume_id', saved.resume_id);
  };

  const handleSelectRecentResume = async (selectedResume) => {
    setActiveResumeId(selectedResume.resume_id);
    setActiveFilename(selectedResume.filename);
    sessionStorage.setItem('career_active_resume_id', selectedResume.resume_id);
    setMessage('');
    setIsError(false);

    // If an existing saved analysis matches this resume, restore it immediately
    const matchingSaved = savedAnalyses.find((a) => a.resume_id === selectedResume.resume_id);
    if (matchingSaved) {
      handleLoadSaved(matchingSaved);
      return;
    }

    // Otherwise check if the resume document in Firestore has analysis stored
    try {
      setAnalyzing(true);
      const uid = auth?.currentUser?.uid || localStorage.getItem('career_user') || '';
      const detail = await getResume(selectedResume.resume_id, uid);
      if (detail && detail.analysis && (detail.analysis.resume_score || detail.analysis.ats_score || detail.skills?.length)) {
        const an = detail.analysis;
        setAnalysisResult({
          resume_score: an.resume_score || detail.resume_score || 0,
          ats_score: an.ats_score || detail.ats_score || null,
          has_target_job: Boolean(an.has_target_job || an.job_description),
          inferred_domain: an.inferred_domain || 'General Professional',
          resume_skills: an.resume_skills || detail.skills || [],
          missing_keywords: an.missing_keywords || [],
          missing_keyword_details: an.missing_keyword_details || [],
          grammar_issues: an.grammar_issues || [],
          structured_recommendations: an.structured_recommendations || [],
          recommendations: an.recommendations || [],
          sentence_improvements: an.sentence_improvements || [],
          is_valid_resume: true,
        });
        if (detail.job_description) setJobDescription(detail.job_description);
        setSaveSuccess(false);
        setActiveTab('current');
      } else {
        await runAnalysis(selectedResume.resume_id, targetRole, jobDescription, selectedResume.filename);
      }
    } catch {
      await runAnalysis(selectedResume.resume_id, targetRole, jobDescription, selectedResume.filename);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteSaved = async (analysisId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved analysis?')) return;
    try {
      await deleteSavedAnalysis(analysisId);
      setSavedAnalyses((prev) => prev.filter((a) => a.analysis_id !== analysisId));
      if (sessionStorage.getItem('career_active_analysis_id') === analysisId) {
        sessionStorage.removeItem('career_active_analysis_id');
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete saved analysis.');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 space-y-8">
      {/* Header — Introductory line removed as requested */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-[#D83CC5]" />
            <span>Resume & ATS Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D] tracking-tight">
            Resume Intelligence & Parser
          </h1>
        </div>

        {/* Tab Toggle: Live Analysis vs Saved History */}
        <div className="flex items-center bg-[#FAF7FD] border border-[#E4D5F3] p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'current'
                ? 'bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white shadow-xs'
                : 'text-[#78678C] hover:text-[#27113D]'
            }`}
          >
            Live Analysis
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white shadow-xs'
                : 'text-[#78678C] hover:text-[#27113D]'
            }`}
          >
            <History size={15} />
            <span>Saved History</span>
            {savedAnalyses.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === 'history' ? 'bg-white/25 text-white' : 'bg-[#F3E9FF] text-[#542477]'
              }`}>
                {savedAnalyses.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* Saved Analysis History View */
        <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D]">
                Saved Resume Analyses
              </h2>
              <p className="text-xs sm:text-sm text-[#78678C] mt-1">
                Retrieve and review past ATS evaluations without re-running the AI model.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('current')}
              className="text-xs font-bold text-[#542477] bg-[#F3E9FF] hover:bg-[#542477] hover:text-white px-4 py-2 rounded-full transition-colors cursor-pointer"
            >
              Back to Current Analysis
            </button>
          </div>

          {savedAnalyses.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-[#F3E9FF] border border-[#E4D5F3] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#542477]">
                <Bookmark size={30} />
              </div>
              <h3 className="text-base font-bold text-[#27113D] mb-1">No Saved Analyses Yet</h3>
              <p className="text-xs sm:text-sm text-[#78678C] max-w-md mx-auto mb-6">
                Run a resume analysis and click the "Save Analysis" button to store your scores, missing keywords, and recommendations for future reference.
              </p>
              <button
                onClick={() => setActiveTab('current')}
                className="bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white font-bold py-2.5 px-6 rounded-full text-xs shadow-md cursor-pointer"
              >
                Start New Analysis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedAnalyses.map((item) => (
                <div
                  key={item.analysis_id}
                  onClick={() => handleLoadSaved(item)}
                  className="p-5 rounded-2xl border border-[#E4D5F3] bg-[#FAF7FD] hover:bg-[#F3E9FF]/40 hover:border-[#542477]/40 transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.has_target_job
                          ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]'
                          : 'bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3]'
                      }`}>
                        {item.has_target_job ? '🎯 Job-Specific' : '📄 General Resume'}
                      </span>
                      <button
                        onClick={(e) => handleDeleteSaved(item.analysis_id, e)}
                        className="text-[#8A7A9E] hover:text-[#E11D48] p-1 rounded-lg transition-colors"
                        title="Delete saved analysis"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-[#27113D] truncate group-hover:text-[#542477] transition-colors">
                      {item.filename || 'Resume'}
                    </h3>
                    <div className="text-xs text-[#78678C] mt-0.5">
                      {item.target_role || item.inferred_domain || 'General Role'}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#E4D5F3]/60">
                      <div className="bg-white p-2.5 rounded-xl border border-[#E4D5F3]/60 text-center">
                        <div className="text-lg font-extrabold text-[#D83CC5]">
                          {Math.round(item.resume_score || 0)}%
                        </div>
                        <div className="text-[10px] font-bold text-[#78678C] uppercase tracking-wider">
                          Quality
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-[#E4D5F3]/60 text-center">
                        <div className="text-lg font-extrabold text-[#542477]">
                          {item.ats_score != null ? `${Math.round(item.ats_score)}%` : 'N/A'}
                        </div>
                        <div className="text-[10px] font-bold text-[#78678C] uppercase tracking-wider">
                          ATS Match
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E4D5F3]/60 text-[11px] text-[#8A7A9E]">
                    <span>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Saved'}
                    </span>
                    <span className="font-bold text-[#542477] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Review <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Live Workspace Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upload Resume & Job Description */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-[#E4D5F3] p-6 sm:p-7 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
              <h2 className="text-lg font-bold text-[#27113D] mb-1">Upload Resume</h2>
              <p className="text-xs text-[#78678C] mb-6 leading-relaxed">
                Upload a PDF or Word document. Our parser extracts clean text, identifies sections, and triggers real-time ATS intelligence.
              </p>

              {/* Dropzone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-5 ${
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
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#F3E9FF] border border-[#E4D5F3] flex items-center justify-center text-[#542477]">
                  <UploadCloud size={24} strokeWidth={1.75} />
                </div>
                {file ? (
                  <div>
                    <strong className="text-[#27113D] text-sm font-bold block truncate max-w-xs mx-auto">
                      {file.name}
                    </strong>
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

              {/* Job Description Input Area (Requirement 2) */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#27113D] uppercase tracking-wide flex items-center gap-1.5">
                    <Target size={14} className="text-[#542477]" />
                    <span>Target Job Description (Optional)</span>
                  </label>
                  <span className="text-[11px] text-[#8A7A9E]">
                    {jobDescription.length} / 10,000
                  </span>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value.slice(0, 10000));
                    setSaveSuccess(false);
                  }}
                  placeholder="Paste the target job description here to evaluate job-specific ATS match, missing keywords, and role-tailored recommendations..."
                  rows={4}
                  maxLength={10000}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs sm:text-sm text-[#27113D] placeholder-[#9E8EAF] focus:bg-white focus:outline-none focus:border-[#542477] focus:ring-2 focus:ring-[#7951D1]/15 transition-all resize-y leading-relaxed"
                />
                <p className="text-[11px] text-[#78678C] mt-1.5 flex items-center gap-1 leading-normal">
                  <Info size={12} className="shrink-0 text-[#542477]" />
                  <span>Paste a job posting to unlock job-specific missing keywords & target ATS compatibility.</span>
                </p>
              </div>

              {/* Target Role Selector */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-[#27113D] mb-2 uppercase tracking-wide">
                  Target Industry / Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => {
                    setTargetRole(e.target.value);
                    setSaveSuccess(false);
                  }}
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

              {/* Action Button */}
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
                    Upload & Analyze Resume
                  </>
                )}
              </button>

              {message && (
                <div className={`mt-4 p-3.5 rounded-xl flex items-start gap-3 text-xs sm:text-sm ${
                  isError ? 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]' : 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                }`}>
                  {isError ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
                  <span className="font-semibold leading-relaxed">{message}</span>
                </div>
              )}
            </div>

            {/* Recent Uploads */}
            {pastResumes.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A7A9E] mb-3">
                  Recent Uploads
                </h3>
                <ul className="flex flex-col gap-2.5">
                  {pastResumes.slice(0, 5).map((r) => (
                    <li
                      key={r.resume_id}
                      onClick={() => handleSelectRecentResume(r)}
                      className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                        activeResumeId === r.resume_id ? 'border-[#542477] bg-[#F3E9FF]/40 shadow-xs ring-1 ring-[#542477]/20' : 'border-[#E4D5F3] bg-[#FAF7FD] hover:bg-[#F3E9FF]/20 hover:border-[#542477]/40'
                      }`}
                    >
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
                      <div className="flex items-center gap-1.5 shrink-0 ml-4">
                        <button
                          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                            activeResumeId === r.resume_id
                              ? 'bg-[#542477] text-white shadow-xs'
                              : 'text-[#542477] bg-[#F3E9FF] hover:bg-[#542477] hover:text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRecentResume(r);
                          }}
                        >
                          {activeResumeId === r.resume_id ? 'Active' : 'Select'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Analysis Results Panel */}
          <div className="lg:col-span-7">
            <div className="h-full rounded-2xl border border-[#E4D5F3] bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)] flex flex-col">
              {/* Header with Save Analysis action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans',_sans-serif] text-[#27113D]">
                    ATS & Skill Intelligence
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {analysisResult?.inferred_domain && (
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3]">
                        Domain: {analysisResult.inferred_domain}
                      </span>
                    )}
                    {analysisResult && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        analysisResult.has_target_job
                          ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                          : 'bg-[#FAF7FD] text-[#78678C] border-[#E4D5F3]'
                      }`}>
                        {analysisResult.has_target_job ? '🎯 Job-Specific Evaluation' : '📄 General Resume Evaluation'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {analyzing && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3] animate-pulse">
                      <RefreshCw size={14} className="animate-spin" /> Analyzing...
                    </span>
                  )}

                  {/* Save Analysis Button (Requirement 7) */}
                  {analysisResult && !analyzing && (
                    <button
                      onClick={handleSaveAnalysis}
                      disabled={saving || saveSuccess}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        saveSuccess
                          ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
                          : 'bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white shadow-xs hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {saving ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Saving...
                        </>
                      ) : saveSuccess ? (
                        <>
                          <BookmarkCheck size={14} /> Saved
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} /> Save Analysis
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {saveError && (
                <div className="mb-4 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{saveError}</span>
                </div>
              )}

              {analysisResult ? (
                <div className="flex flex-col gap-6">
                  {/* Non-Resume Document Detected Alert */}
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

                  {/* Core Scores Grid (Requirement 6: ATS only when JD provided, Quality heuristic) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* ATS Compatibility Score */}
                    <div className="bg-[#FAF7FD] border border-[#E4D5F3] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                      {analysisResult.has_target_job && analysisResult.ats_score != null ? (
                        <>
                          <div className="text-4xl font-extrabold text-[#542477] mb-1">
                            {Math.round(analysisResult.ats_score)}%
                          </div>
                          <div className="text-xs font-bold text-[#78678C] uppercase tracking-wider">
                            ATS Compatibility
                          </div>
                          <span className="text-[11px] text-[#0369A1] bg-[#E0F2FE] px-2 py-0.5 rounded-full font-semibold mt-2">
                            Job Description Match
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="text-3xl font-extrabold text-[#8A7A9E] mb-1">
                            N/A
                          </div>
                          <div className="text-xs font-bold text-[#78678C] uppercase tracking-wider">
                            ATS Compatibility
                          </div>
                          <p className="text-[11px] text-[#8A7A9E] mt-2 max-w-xs leading-tight">
                            Provide a Job Description on the left to calculate target ATS compatibility.
                          </p>
                        </>
                      )}
                    </div>

                    {/* Overall Resume Quality Score */}
                    <div className="bg-[#FAF7FD] border border-[#E4D5F3] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                      <div className="text-4xl font-extrabold text-[#D83CC5] mb-1">
                        {Math.round(analysisResult.resume_score || 0)}%
                      </div>
                      <div className="text-xs font-bold text-[#78678C] uppercase tracking-wider">
                        Overall Quality
                      </div>
                      <span className="text-[11px] text-[#542477] bg-[#F3E9FF] px-2 py-0.5 rounded-full font-semibold mt-2">
                        Content, Verbs & Structure
                      </span>
                    </div>
                  </div>

                  {/* Extracted Skills Block */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#27113D] mb-3">
                      Extracted Resume Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(analysisResult.resume_skills || []).map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs rounded-lg font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing Keywords for This Job Section */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#27113D] flex items-center gap-1.5">
                        <Target size={15} className="text-[#542477]" />
                        <span>Missing Keywords for This Job</span>
                      </h3>
                    </div>

                    {analysisResult.has_target_job ? (
                      (() => {
                        const uniqueKeywords = Array.from(
                          new Set(
                            (analysisResult.missing_keywords && analysisResult.missing_keywords.length > 0)
                              ? analysisResult.missing_keywords
                              : (analysisResult.missing_keyword_details || []).map((item) =>
                                  typeof item === 'string' ? item : item?.keyword
                                )
                          )
                        ).filter(Boolean);

                        return uniqueKeywords.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {uniqueKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-[#FAF7FD] border border-[#E4D5F3] text-[#542477] text-xs font-semibold rounded-lg hover:border-[#542477]/40 transition-colors"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs flex items-center gap-2">
                            <CheckCircle2 size={16} className="shrink-0" />
                            <span>All core technical requirements in the target job description were matched in your resume!</span>
                          </div>
                        );
                      })()
                    ) : (
                      /* Small message when user has not supplied a job description */
                      <div className="p-3.5 rounded-xl bg-[#FAF7FD] border border-[#E4D5F3] text-xs text-[#78678C] flex items-center gap-2">
                        <Info size={15} className="shrink-0 text-[#542477]" />
                        <span>Please provide a job description to identify missing keywords.</span>
                      </div>
                    )}
                  </div>

                  {/* Grammar & Resume Corrections Section (Requirement 5: Replaces old ATS Health Diagnostics) */}
                  <div className="pt-4 border-t border-[#E4D5F3]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#27113D] mb-3 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-[#542477]" />
                      <span>Grammar & Resume Corrections</span>
                    </h3>

                    {analysisResult.grammar_issues?.length > 0 ? (
                      <div className="space-y-3">
                        {analysisResult.grammar_issues.map((iss, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#27113D]">
                                {iss.problem}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3]">
                                {iss.issue_type}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="p-2 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-[#B91C1C]">
                                <span className="font-bold block text-[10px] uppercase tracking-wider text-[#991B1B]">Original:</span>
                                <span className="italic">"{iss.original}"</span>
                              </div>
                              <div className="p-2 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D]">
                                <span className="font-bold block text-[10px] uppercase tracking-wider text-[#166534]">Suggested:</span>
                                <span className="font-semibold">{iss.suggested_correction}</span>
                              </div>
                            </div>

                            {iss.explanation && (
                              <p className="text-[11px] text-[#78678C] leading-relaxed">
                                {iss.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>No critical grammar, spelling, or structural phrasing flaws detected in your resume text.</span>
                      </div>
                    )}
                  </div>

                  {/* Polished Sentence Recommendations (Google XYZ format) */}
                  {analysisResult.sentence_improvements?.length > 0 && (
                    <div className="pt-4 border-t border-[#E4D5F3]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#542477] mb-3 flex items-center gap-1.5">
                        <Sparkles size={15} />
                        <span>High-Impact Bullet Point Rewrites (Google XYZ Formula)</span>
                      </h3>
                      <div className="space-y-3">
                        {analysisResult.sentence_improvements.slice(0, 3).map((item, i) => (
                          <div key={i} className="p-3.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs space-y-2">
                            <div className="text-[#8A7A9E]">
                              <span className="font-bold text-[#27113D]">Original:</span> "{item.original}"
                            </div>
                            <div className="text-[#15803D] font-semibold flex items-start gap-1.5 bg-[#F0FDF4] p-2.5 rounded-lg border border-[#BBF7D0]">
                              <Check size={14} className="mt-0.5 shrink-0" />
                              <span>{item.improved}</span>
                            </div>
                            {item.reason && (
                              <div className="text-[11px] text-[#78678C] italic">
                                Why: {item.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resume Improvement Recommendations (Requirement 4) */}
                  <div className="pt-4 border-t border-[#E4D5F3]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#542477] mb-3 flex items-center gap-1.5">
                      <Sparkles size={15} />
                      <span>Resume Improvement Recommendations</span>
                    </h3>

                    {analysisResult.structured_recommendations?.length > 0 ? (
                      <div className="space-y-3.5">
                        {analysisResult.structured_recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] flex flex-col gap-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-[#542477] uppercase tracking-wider">
                                {rec.area}
                              </span>
                            </div>

                            <div className="text-xs sm:text-sm font-semibold text-[#27113D]">
                              {rec.issue}
                            </div>

                            <p className="text-xs text-[#5F4E75] leading-relaxed">
                              <strong>Why it matters:</strong> {rec.why}
                            </p>

                            <p className="text-xs text-[#5F4E75] leading-relaxed">
                              <strong>Recommended action:</strong> {rec.action}
                            </p>

                            {rec.example && (
                              <div className="p-2.5 rounded-lg bg-white border border-[#E4D5F3] text-xs text-[#27113D] font-mono leading-relaxed">
                                <span className="font-bold text-[#542477] block text-[10px] uppercase font-sans mb-1">
                                  Example Wording:
                                </span>
                                {rec.example}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {(analysisResult.recommendations || []).map((rec, i) => (
                          <li key={i} className="text-xs sm:text-sm text-[#5F4E75] flex items-start gap-2">
                            <ChevronRight size={15} className="text-[#542477] mt-0.5 shrink-0" />
                            <span className="leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : loadingInitial ? (
                /* Restoring state */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8A7A9E]">
                  <RefreshCw size={28} className="animate-spin text-[#542477] mb-3" />
                  <h3 className="text-sm font-bold text-[#27113D] mb-1">Restoring Saved Data...</h3>
                  <p className="text-xs max-w-xs mx-auto leading-relaxed text-[#78678C]">
                    Retrieving your active resume records and saved analyses from Firestore.
                  </p>
                </div>
              ) : (
                /* Empty state awaiting analysis */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8A7A9E]">
                  <div className="w-16 h-16 bg-[#F3E9FF] border border-[#E4D5F3] rounded-2xl flex items-center justify-center mb-4 text-[#542477]">
                    <ShieldCheck size={32} />
                  </div>
                  <h3 className="text-base font-bold text-[#27113D] mb-1">Awaiting Resume</h3>
                  <p className="text-xs sm:text-sm max-w-sm mx-auto leading-relaxed text-[#78678C]">
                    Upload a resume on the left and optionally paste a target job description to see instant ATS matching, domain skill extraction, and keyword gap analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
