import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Sparkles, FileText, CheckCircle2, AlertCircle,
  ArrowRight, RefreshCw, Check, ShieldCheck, ChevronRight
} from 'lucide-react';
import { listResumes } from '../features/resume/resumeService';
import { matchJob } from '../features/jobs/jobService';
import { normalizeJobDescription } from '../utils/jobUtils';

export default function ResumeMatchModal({
  isOpen,
  onClose,
  job,
  userId,
  onMatchSuccess
}) {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && job) {
      setMatchResult(null);
      setError('');
      fetchUserResumes();
    }
  }, [isOpen, job]);

  const fetchUserResumes = async () => {
    if (!userId) {
      setLoadingResumes(false);
      return;
    }
    setLoadingResumes(true);
    try {
      const res = await listResumes(userId);
      const list = res.resumes || res || [];
      setResumes(list);
      if (list.length > 0) {
        setSelectedResumeId(list[0].resume_id);
      }
    } catch (err) {
      console.warn('Could not load resumes:', err);
      setError('Unable to load your saved resumes. Please try again.');
    } finally {
      setLoadingResumes(false);
    }
  };

  if (!isOpen || !job) return null;

  const selectedResume = resumes.find(r => r.resume_id === selectedResumeId);

  const handleExecuteMatch = async () => {
    if (!selectedResumeId) {
      setError('Please select a saved resume first.');
      return;
    }
    setMatching(true);
    setError('');

    try {
      const payload = {
        user_id: userId,
        resume_id: selectedResumeId,
        title: job.title,
        company: job.company,
        location: job.location,
        description: normalizeJobDescription(job.description),
        required_skills: job.required_skills || [],
        job_url: job.job_url || job.application_url,
      };

      const result = await matchJob(job.job_id, payload);
      setMatchResult(result);
      if (onMatchSuccess) {
        onMatchSuccess(job.job_id, result, selectedResume);
      }
    } catch (err) {
      console.error('Job match calculation error:', err);
      const detail = err.response?.data?.detail || err.message || 'Match calculation failed.';
      setError(typeof detail === 'string' ? detail : 'Could not compute match. Please verify the resume content.');
    } finally {
      setMatching(false);
    }
  };

  const handleNavigateToJobDetails = () => {
    onClose();
    navigate(`/jobs/${job.job_id}${selectedResumeId ? `?resume_id=${selectedResumeId}` : ''}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#27113D]/45 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-[#E4D5F3] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-4 border-b border-[#E4D5F3] shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles size={12} className="text-[#D83CC5]" /> Resume Intelligence
            </div>
            <h2 className="text-xl font-heading font-black text-[#27113D] tracking-tight">
              Match this job with your resume
            </h2>
            <p className="text-xs text-[#5F4E75] mt-1">
              Evaluating compatibility for <strong className="text-[#542477]">{job.title}</strong> at <strong className="text-[#27113D]">{job.company}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A7A9E] hover:bg-[#F3E9FF] hover:text-[#27113D] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-6 overflow-y-auto flex-1 pr-1">
          {error && (
            <div className="mb-4 p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!userId ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-[#F3E9FF] text-[#542477] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={28} />
              </div>
              <h3 className="text-base font-bold text-[#27113D] mb-2">Authentication Required</h3>
              <p className="text-xs text-[#5F4E75] max-w-sm mx-auto mb-6">
                Please sign in to access your saved resumes and evaluate job compatibility.
              </p>
              <button
                onClick={() => { onClose(); navigate('/login'); }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95"
              >
                Sign In to Continue
              </button>
            </div>
          ) : loadingResumes ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-8 h-8 border-3 border-[#E4D5F3] border-t-[#542477] rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold text-[#8A7A9E]">Retrieving your saved resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-8 bg-[#FAF7FD] rounded-2xl border border-dashed border-[#E4D5F3] p-6">
              <div className="w-14 h-14 bg-[#F3E9FF] text-[#542477] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText size={28} />
              </div>
              <h3 className="text-base font-bold text-[#27113D] mb-1.5">No Saved Resumes Found</h3>
              <p className="text-xs text-[#5F4E75] max-w-sm mx-auto mb-6 leading-relaxed">
                You haven't saved any resumes yet. Upload and analyze your resume in the Resume Analysis section first to enable live matching.
              </p>
              <button
                onClick={() => { onClose(); navigate('/resume'); }}
                className="px-6 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 flex items-center gap-2 mx-auto"
              >
                <FileText size={14} /> Go to Resume Analysis
              </button>
            </div>
          ) : matchResult ? (
            /* Match Results View */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-br from-[#FBF8FF] to-[#F3E9FF] border border-[#E4D5F3] rounded-2xl p-5 shadow-sm text-center">
                <div className="text-xs font-bold text-[#8A7A9E] uppercase tracking-wider mb-1">
                  Overall Compatibility Score
                </div>
                <div className="text-4xl font-heading font-black text-[#542477] mb-1">
                  {matchResult.job_match_score}%
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white border border-[#E4D5F3]">
                  {matchResult.eligible ? (
                    <span className="text-[#16A34A] flex items-center gap-1">
                      <CheckCircle2 size={13} /> Highly Eligible Candidate
                    </span>
                  ) : (
                    <span className="text-[#D83CC5] flex items-center gap-1">
                      <Sparkles size={13} /> Competitive Match (Gaps to Bridge)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5F4E75] mt-2">
                  Evaluated using <strong className="text-[#27113D]">{matchResult.resume_filename || selectedResume?.filename}</strong>
                </p>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-[#E4D5F3] rounded-xl p-3 text-center shadow-sm">
                  <div className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider">Skills</div>
                  <div className="text-xl font-heading font-black text-[#542477] mt-0.5">{matchResult.skill_match}%</div>
                </div>
                <div className="bg-white border border-[#E4D5F3] rounded-xl p-3 text-center shadow-sm">
                  <div className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider">Education</div>
                  <div className="text-xl font-heading font-black text-[#27113D] mt-0.5">{matchResult.education_match}%</div>
                </div>
                <div className="bg-white border border-[#E4D5F3] rounded-xl p-3 text-center shadow-sm">
                  <div className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider">Experience</div>
                  <div className="text-xl font-heading font-black text-[#27113D] mt-0.5">{matchResult.experience_match}%</div>
                </div>
              </div>

              {/* Matched & Missing Skills */}
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5 mb-2">
                    <CheckCircle2 size={14} /> Matched Requirements ({matchResult.matched_skills?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matched_skills?.length > 0 ? (
                      matchResult.matched_skills.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-bold rounded-lg">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#8A7A9E] italic">None identified</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-[#E11D48] flex items-center gap-1.5 mb-2">
                    <X size={14} /> Missing Required Skills ({matchResult.missing_skills?.length || 0})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missing_skills?.length > 0 ? (
                      matchResult.missing_skills.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-bold rounded-lg">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#16A34A] font-bold flex items-center gap-1">
                        <Check size={14} /> All specified skills matched!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Resume Selection List */
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#27113D] uppercase tracking-wider mb-2">
                Select from your saved resumes ({resumes.length}):
              </label>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {resumes.map((resume) => {
                  const isSelected = selectedResumeId === resume.resume_id;
                  const uploadDate = resume.created_at
                    ? new Date(resume.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Saved resume';

                  return (
                    <div
                      key={resume.resume_id}
                      onClick={() => setSelectedResumeId(resume.resume_id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#F3E9FF]/40 border-[#542477] shadow-[0_2px_12px_rgba(84,36,119,0.08)] ring-1 ring-[#542477]'
                          : 'bg-white border-[#E4D5F3] hover:border-[#D6C2EB] hover:bg-[#FAF7FD]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-[#542477] text-white border-[#542477]' : 'bg-[#FAF7FD] text-[#542477] border-[#E4D5F3]'
                        }`}>
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#27113D] truncate">
                            {resume.filename || 'resume.pdf'}
                          </div>
                          <div className="text-[11px] text-[#8A7A9E] flex items-center gap-2 mt-0.5">
                            <span>Uploaded: {uploadDate}</span>
                            {resume.file_type && (
                              <>
                                <span className="w-1 h-1 bg-[#E4D5F3] rounded-full"></span>
                                <span className="uppercase text-[10px] font-bold text-[#542477]">{resume.file_type.replace('.', '')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-[#542477] bg-[#542477] text-white' : 'border-[#D6C2EB] bg-white'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#E4D5F3] flex justify-between items-center gap-3 shrink-0">
          {matchResult ? (
            <>
              <button
                type="button"
                onClick={() => setMatchResult(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-bold text-[#5F4E75] hover:bg-[#FAF7FD] transition-colors"
              >
                Select Another Resume
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-bold text-[#27113D] hover:bg-[#F3E9FF]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleNavigateToJobDetails}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 flex items-center gap-1.5"
                >
                  View Details & AI Fit <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-bold text-[#5F4E75] hover:bg-[#FAF7FD] transition-colors"
              >
                Cancel
              </button>
              {resumes.length > 0 && (
                <button
                  type="button"
                  disabled={matching || !selectedResumeId}
                  onClick={handleExecuteMatch}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_4px_16px_rgba(84,36,119,0.25)] hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {matching ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Matching with Resume...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Match Resume</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
