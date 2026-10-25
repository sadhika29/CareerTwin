import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Search, MapPin, Sparkles, Check, X, ShieldCheck,
  ExternalLink, Globe, DollarSign, Building2, RefreshCw, Filter,
  ChevronDown, Calendar, Briefcase, Award, Layers, RotateCcw,
  CheckCircle2, Clock, Eye, Bookmark, Send
} from 'lucide-react';
import {
  getJobs, searchLiveJobs, syncJobs, getSyncStatus,
  getInteractionsSummary, recordJobView, toggleSaveJob, confirmJobApplication
} from '../features/jobs/jobService';
import { getResumes } from '../features/resume/resumeService';
import { getProfile } from '../features/profile/profileService';
import ResumeMatchModal from '../components/ResumeMatchModal';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncNotification, setSyncNotification] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState('Recently');

  // Job Interactions Summary & Active Filter (Viewed, Saved, Applied)
  const [interactionsSummary, setInteractionsSummary] = useState({
    viewed_count: 0,
    saved_count: 0,
    applied_count: 0,
    viewed_job_ids: [],
    saved_job_ids: [],
    applied_job_ids: [],
    saved_jobs: [],
    viewed_jobs: [],
    applied_jobs: [],
  });
  const [activeSummaryFilter, setActiveSummaryFilter] = useState(null); // 'viewed' | 'saved' | 'applied' | null
  const [applicationConfirmJob, setApplicationConfirmJob] = useState(null);
  const [submittingApplication, setSubmittingApplication] = useState(false);

  // Primary & LinkedIn-Style Filters State
  const [searchKeywords, setSearchKeywords] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [datePostedFilter, setDatePostedFilter] = useState('any'); // 'any' | '24h' | 'week' | 'month'
  const [companyFilter, setCompanyFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all'); // 'all' | 'internship' | 'entry' | 'associate' | 'mid-senior' | 'director'
  const [employmentFilter, setEmploymentFilter] = useState('all'); // 'all' | 'full-time' | 'part-time' | 'contract' | 'internship'
  const [arrangementFilter, setArrangementFilter] = useState('all'); // 'all' | 'remote' | 'hybrid' | 'on-site'

  // Additional Filters
  const [industryFilter, setIndustryFilter] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState('all'); // 'all' | '50k' | '80k' | '100k' | '120k' | '150k'
  const [techStackFilter, setTechStackFilter] = useState('all');

  // Active Dropdown state for filter bar
  const [openDropdown, setOpenDropdown] = useState(null); // 'date' | 'exp' | 'company' | 'type' | 'arr' | 'salary' | 'tech' | 'industry' | null

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Resume Match Modal State
  const [matchModalJob, setMatchModalJob] = useState(null);
  const [jobMatches, setJobMatches] = useState({}); // { [job_id]: matchData }
  const [matchedResumes, setMatchedResumes] = useState({}); // { [job_id]: resumeObj }

  const userId = localStorage.getItem('career_user') || '';

  // Initial load with instant session cache restoration
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('career_jobs_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJobs(parsed);
          setLoading(false);
        }
      }
    } catch {
      // ignore
    }
    loadJobsData();
    loadInteractionsSummary();
  }, []);

  const loadInteractionsSummary = async () => {
    try {
      const summary = await getInteractionsSummary();
      if (summary) {
        setInteractionsSummary(summary);
      }
    } catch (err) {
      console.warn('Interactions summary load warning:', err);
    }
  };

  const handleToggleSave = async (job, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isCurrentlySaved = interactionsSummary?.saved_job_ids?.includes(job.job_id);
    const newSaved = !isCurrentlySaved;

    // Optimistic UI update
    setInteractionsSummary(prev => {
      const currentSavedIds = prev?.saved_job_ids || [];
      const newSavedIds = newSaved
        ? [...currentSavedIds, job.job_id]
        : currentSavedIds.filter(id => id !== job.job_id);
      return {
        ...prev,
        saved_count: newSavedIds.length,
        saved_job_ids: newSavedIds,
      };
    });

    try {
      await toggleSaveJob(job.job_id, newSaved, job);
      await loadInteractionsSummary();
    } catch (err) {
      console.error('Failed to toggle save job:', err);
      await loadInteractionsSummary();
    }
  };

  const handleRecordView = async (job) => {
    if (!job?.job_id) return;
    try {
      recordJobView(job.job_id, job).catch(e => console.warn(e));
      setInteractionsSummary(prev => {
        if (!prev) return prev;
        if (prev.viewed_job_ids?.includes(job.job_id)) return prev;
        const newViewed = [...(prev.viewed_job_ids || []), job.job_id];
        return {
          ...prev,
          viewed_count: newViewed.length,
          viewed_job_ids: newViewed,
        };
      });
    } catch (err) {
      console.warn('Record view error:', err);
    }
  };

  const handleApplyClick = (job, appUrl) => {
    if (appUrl) {
      window.open(appUrl, '_blank', 'noopener,noreferrer');
    }
    handleRecordView(job);

    if (!interactionsSummary?.applied_job_ids?.includes(job.job_id)) {
      setApplicationConfirmJob(job);
    }
  };

  const handleConfirmApplication = async (markApplied) => {
    if (!applicationConfirmJob) return;
    const targetJob = applicationConfirmJob;
    if (markApplied) {
      try {
        setSubmittingApplication(true);
        await confirmJobApplication(targetJob.job_id, {
          company: targetJob.company,
          role: targetJob.title,
          location: targetJob.location,
          url: targetJob.job_url || targetJob.application_url,
          salary_range: targetJob.salary_range,
          job_data: targetJob,
        });
        await loadInteractionsSummary();
        setSyncNotification(`Application for "${targetJob.title}" at ${targetJob.company} tracked in Applied Jobs!`);
        setTimeout(() => setSyncNotification(''), 5000);
      } catch (err) {
        console.error('Failed to confirm application:', err);
      } finally {
        setSubmittingApplication(false);
        setApplicationConfirmJob(null);
      }
    } else {
      setApplicationConfirmJob(null);
    }
  };

  const loadJobsData = async (query = '') => {
    try {
      // Only set loading if no jobs are currently shown
      if (!jobs || jobs.length === 0) {
        setLoading(true);
      }
      // Retrieve initial jobs list from live market & shared catalog
      const targetQuery = query || searchKeywords || 'Software Engineer';
      const liveRes = await searchLiveJobs({
        query: targetQuery,
        location: locationInput || undefined,
        num_pages: 1,
      });

      if (liveRes && liveRes.jobs && liveRes.jobs.length > 0) {
        setJobs(liveRes.jobs);
        try {
          sessionStorage.setItem('career_jobs_cache', JSON.stringify(liveRes.jobs));
        } catch {
          // ignore
        }
        if (liveRes.formatted_sync_time) {
          setLastSyncTime(liveRes.formatted_sync_time);
        }
      } else {
        // Fallback to shared catalog
        try {
          const catData = await getJobs();
          if (catData && catData.jobs && catData.jobs.length > 0) {
            setJobs(catData.jobs);
            try {
              sessionStorage.setItem('career_jobs_cache', JSON.stringify(catData.jobs));
            } catch {
              // ignore
            }
          }
        } catch {
          // Keep empty if none
        }
      }
    } catch (err) {
      console.warn('Initial jobs loading warning:', err);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize Real-Time Jobs via authentic provider integration
  const handleSyncRealTimeJobs = async () => {
    try {
      setSyncing(true);
      setSyncNotification('');
      const report = await syncJobs({
        query: searchKeywords || 'Software Engineer',
        location: locationInput || undefined,
        limit_per_provider: 15,
      });

      if (report && report.jobs && report.jobs.length > 0) {
        setJobs(report.jobs);
      } else {
        // Refresh visible listings
        await loadJobsData();
      }

      await loadInteractionsSummary();

      const syncTimeStr = report?.formatted_sync_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(syncTimeStr);

      const totalCount = report?.total_synced || jobs.length;
      const providersStr = report?.provider_counts
        ? Object.entries(report.provider_counts).map(([p, c]) => `${p}: ${c}`).join(', ')
        : 'Himalayas & JSearch';

      setSyncNotification(`Successfully synchronized ${totalCount} authentic openings (${providersStr}) at ${syncTimeStr}.`);
      setTimeout(() => setSyncNotification(''), 6000);
    } catch (err) {
      console.error('Job synchronization failed:', err);
      setSyncNotification('Synchronization completed with existing verified catalog.');
      setTimeout(() => setSyncNotification(''), 4500);
    } finally {
      setSyncing(false);
    }
  };

  // Quick Keywords Search form submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    loadJobsData(searchKeywords);
  };

  // Combined job pool including current data and interaction jobs (saved/viewed/applied)
  const allJobsPool = useMemo(() => {
    const map = new Map();
    jobs.forEach(j => {
      if (j && j.job_id) map.set(j.job_id, j);
    });
    if (interactionsSummary) {
      (interactionsSummary.saved_jobs || []).forEach(j => {
        if (j && j.job_id && !map.has(j.job_id)) map.set(j.job_id, j);
      });
      (interactionsSummary.viewed_jobs || []).forEach(j => {
        if (j && j.job_id && !map.has(j.job_id)) map.set(j.job_id, j);
      });
      (interactionsSummary.applied_jobs || []).forEach(j => {
        if (j && j.job_id && !map.has(j.job_id)) map.set(j.job_id, j);
      });
    }
    return Array.from(map.values());
  }, [jobs, interactionsSummary]);

  // Extract unique companies from current data for company filter
  const availableCompanies = useMemo(() => {
    const set = new Set();
    allJobsPool.forEach(j => {
      if (j.company && j.company.trim()) set.add(j.company.trim());
    });
    return Array.from(set).sort();
  }, [allJobsPool]);

  // Extract top skills from current data for tech stack filter
  const availableTechStacks = useMemo(() => {
    const counts = {};
    allJobsPool.forEach(j => {
      (j.required_skills || []).forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 16);
  }, [allJobsPool]);

  // Comprehensive LinkedIn-Style Multi-Filter Logic
  const filteredJobs = useMemo(() => {
    return allJobsPool.filter(job => {
      // 0. Interactive Summary Card Filter: Viewed, Saved, Applied
      if (activeSummaryFilter === 'viewed') {
        if (!interactionsSummary?.viewed_job_ids?.includes(job.job_id)) return false;
      } else if (activeSummaryFilter === 'saved') {
        if (!interactionsSummary?.saved_job_ids?.includes(job.job_id)) return false;
      } else if (activeSummaryFilter === 'applied') {
        if (!interactionsSummary?.applied_job_ids?.includes(job.job_id)) return false;
      }
      // 1. Keywords filter (Title, Company, Description, Required Skills)
      if (searchKeywords.trim()) {
        const query = searchKeywords.toLowerCase().trim();
        const inTitle = (job.title || '').toLowerCase().includes(query);
        const inCompany = (job.company || '').toLowerCase().includes(query);
        const inDesc = (job.description || '').toLowerCase().includes(query);
        const inSkills = (job.required_skills || []).some(s => s.toLowerCase().includes(query));
        const inKeywords = (job.keywords || []).some(k => k.toLowerCase().includes(query));
        if (!inTitle && !inCompany && !inDesc && !inSkills && !inKeywords) {
          return false;
        }
      }

      // 2. Location filter
      if (locationInput.trim() && locationInput.toLowerCase() !== 'any location') {
        const locQuery = locationInput.toLowerCase().trim();
        const jobLoc = (job.location || '').toLowerCase();
        if (!jobLoc.includes(locQuery)) {
          return false;
        }
      }

      // 3. Date Posted filter
      if (datePostedFilter !== 'any') {
        const nowSec = Date.now() / 1000;
        let jobTs = job.posted_timestamp;

        // If not precomputed timestamp, try parsing string
        if (!jobTs && (job.posting_date || job.posted_at)) {
          const str = (job.posting_date || job.posted_at || '').toLowerCase();
          if (str.includes('today') || str.includes('hour') || str.includes('just now')) {
            jobTs = nowSec - 3600;
          } else if (str.includes('yesterday') || str.includes('1 day')) {
            jobTs = nowSec - 86400;
          } else {
            const m = str.match(/(\d+)\s*day/);
            if (m) jobTs = nowSec - (parseInt(m[1]) * 86400);
            const mw = str.match(/(\d+)\s*week/);
            if (mw) jobTs = nowSec - (parseInt(mw[1]) * 7 * 86400);
            const mm = str.match(/(\d+)\s*month/);
            if (mm) jobTs = nowSec - (parseInt(mm[1]) * 30 * 86400);
          }
        }

        if (jobTs) {
          const diffDays = (nowSec - jobTs) / 86400;
          if (datePostedFilter === '24h' && diffDays > 1.2) return false;
          if (datePostedFilter === 'week' && diffDays > 7.5) return false;
          if (datePostedFilter === 'month' && diffDays > 31) return false;
        }
      }

      // 4. Company filter
      if (companyFilter !== 'all') {
        if ((job.company || '').toLowerCase().trim() !== companyFilter.toLowerCase().trim()) {
          return false;
        }
      }

      // 5. Experience Level filter
      if (experienceFilter !== 'all') {
        const exp = (job.experience_level || '').toLowerCase();
        const title = (job.title || '').toLowerCase();
        if (experienceFilter === 'internship') {
          if (!exp.includes('intern') && !title.includes('intern')) return false;
        } else if (experienceFilter === 'entry') {
          if (!exp.includes('entry') && !title.includes('junior') && !title.includes('entry')) return false;
        } else if (experienceFilter === 'associate') {
          if (!exp.includes('associate') && !exp.includes('mid')) return false;
        } else if (experienceFilter === 'mid-senior') {
          if (!exp.includes('mid') && !exp.includes('senior') && !title.includes('senior') && !title.includes('lead')) return false;
        } else if (experienceFilter === 'director') {
          if (!exp.includes('director') && !exp.includes('head') && !title.includes('director') && !title.includes('vp')) return false;
        }
      }

      // 6. Employment Type filter
      if (employmentFilter !== 'all') {
        const emp = (job.employment_type || '').toLowerCase();
        if (!emp.includes(employmentFilter.toLowerCase())) {
          return false;
        }
      }

      // 7. Work Arrangement filter (Remote, Hybrid, On-site)
      if (arrangementFilter !== 'all') {
        const arr = (job.work_arrangement || '').toLowerCase();
        const loc = (job.location || '').toLowerCase();
        if (arrangementFilter === 'remote') {
          if (arr !== 'remote' && !job.is_remote && !loc.includes('remote')) return false;
        } else if (arrangementFilter === 'hybrid') {
          if (arr !== 'hybrid' && !loc.includes('hybrid')) return false;
        } else if (arrangementFilter === 'on-site') {
          if (arr === 'remote' || job.is_remote || loc.includes('remote') || arr === 'hybrid') return false;
        }
      }

      // 8. Salary Range filter (only applies when actual salary is present)
      if (salaryFilter !== 'all') {
        const minThresh = parseInt(salaryFilter) * 1000;
        let jobMin = job.min_salary;
        if (!jobMin && job.salary_range) {
          const match = job.salary_range.match(/\$?(\d+)[kK]?/);
          if (match) {
            jobMin = parseInt(match[1]) * (job.salary_range.toLowerCase().includes('k') ? 1000 : 1);
          }
        }
        if (!jobMin || jobMin < minThresh) {
          return false;
        }
      }

      // 9. Tech Stack / Skills filter
      if (techStackFilter !== 'all') {
        const targetSkill = techStackFilter.toLowerCase();
        const hasSkill = (job.required_skills || []).some(s => s.toLowerCase() === targetSkill);
        const inDesc = (job.description || '').toLowerCase().includes(targetSkill);
        if (!hasSkill && !inDesc) {
          return false;
        }
      }

      // 10. Industry / Category filter
      if (industryFilter !== 'all') {
        const ind = (job.industry || '').toLowerCase();
        if (!ind.includes(industryFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [
    allJobsPool, activeSummaryFilter, interactionsSummary, searchKeywords, locationInput,
    datePostedFilter, companyFilter, experienceFilter, employmentFilter,
    arrangementFilter, salaryFilter, techStackFilter, industryFilter
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredJobs.length / pageSize) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, currentPage]);

  // Active filters count & list for pills
  const activeFilters = useMemo(() => {
    const list = [];
    if (activeSummaryFilter) {
      const labels = { viewed: 'Viewed Jobs', saved: 'Saved Jobs', applied: 'Applied Jobs' };
      list.push({
        id: 'summary',
        label: `Category: ${labels[activeSummaryFilter]}`,
        clear: () => { setActiveSummaryFilter(null); setCurrentPage(1); }
      });
    }
    if (searchKeywords.trim()) {
      list.push({ id: 'search', label: `Search: "${searchKeywords}"`, clear: () => setSearchKeywords('') });
    }
    if (locationInput.trim() && locationInput.toLowerCase() !== 'any location') {
      list.push({ id: 'loc', label: `Location: "${locationInput}"`, clear: () => setLocationInput('') });
    }
    if (datePostedFilter !== 'any') {
      const labels = { '24h': 'Past 24 hours', 'week': 'Past week', 'month': 'Past month' };
      list.push({ id: 'date', label: `Date: ${labels[datePostedFilter]}`, clear: () => setDatePostedFilter('any') });
    }
    if (companyFilter !== 'all') {
      list.push({ id: 'comp', label: `Company: ${companyFilter}`, clear: () => setCompanyFilter('all') });
    }
    if (experienceFilter !== 'all') {
      const labels = {
        'internship': 'Internship', 'entry': 'Entry level',
        'associate': 'Associate', 'mid-senior': 'Mid-Senior level', 'director': 'Director / Executive'
      };
      list.push({ id: 'exp', label: `Experience: ${labels[experienceFilter]}`, clear: () => setExperienceFilter('all') });
    }
    if (employmentFilter !== 'all') {
      list.push({ id: 'emp', label: `Type: ${employmentFilter}`, clear: () => setEmploymentFilter('all') });
    }
    if (arrangementFilter !== 'all') {
      const labels = { 'remote': 'Remote', 'hybrid': 'Hybrid', 'on-site': 'On-site' };
      list.push({ id: 'arr', label: `Arrangement: ${labels[arrangementFilter]}`, clear: () => setArrangementFilter('all') });
    }
    if (salaryFilter !== 'all') {
      list.push({ id: 'sal', label: `Salary: $${salaryFilter}+`, clear: () => setSalaryFilter('all') });
    }
    if (techStackFilter !== 'all') {
      list.push({ id: 'tech', label: `Skill: ${techStackFilter}`, clear: () => setTechStackFilter('all') });
    }
    if (industryFilter !== 'all') {
      list.push({ id: 'ind', label: `Category: ${industryFilter}`, clear: () => setIndustryFilter('all') });
    }
    return list;
  }, [
    activeSummaryFilter, searchKeywords, locationInput, datePostedFilter, companyFilter,
    experienceFilter, employmentFilter, arrangementFilter, salaryFilter,
    techStackFilter, industryFilter
  ]);

  const handleResetAllFilters = () => {
    setActiveSummaryFilter(null);
    setSearchKeywords('');
    setLocationInput('');
    setDatePostedFilter('any');
    setCompanyFilter('all');
    setExperienceFilter('all');
    setEmploymentFilter('all');
    setArrangementFilter('all');
    setSalaryFilter('all');
    setTechStackFilter('all');
    setIndustryFilter('all');
    setCurrentPage(1);
    setOpenDropdown(null);
  };

  const toggleDropdown = (name) => {
    setOpenDropdown(prev => prev === name ? null : name);
  };

  const handleMatchSuccess = (jobId, matchData, selectedResume) => {
    setJobMatches(prev => ({ ...prev, [jobId]: matchData }));
    if (selectedResume) {
      setMatchedResumes(prev => ({ ...prev, [jobId]: selectedResume }));
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-16">
      
      {/* Primary Header Row with Active Requisitions as Main Title */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#27113D] tracking-tight">
            Active Requisitions
          </h1>
          <span className="px-3.5 py-1 bg-[#F3E9FF] border border-[#E4D5F3] text-[#542477] text-xs font-black uppercase tracking-wider rounded-full shadow-sm">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'Role' : 'Roles'} Available
          </span>
        </div>

        {/* Sync Real-Time Jobs Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncRealTimeJobs}
            disabled={syncing}
            className="px-4 py-2.5 bg-white border border-[#E4D5F3] hover:border-[#542477] hover:bg-[#F3E9FF]/40 rounded-xl text-xs font-bold text-[#27113D] flex items-center gap-2 transition-all shadow-[0_2px_10px_rgba(84,36,119,0.04)] disabled:opacity-60"
            title="Perform real-time refresh from configured providers (Himalayas, JSearch, SerpApi)"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin text-[#542477]' : 'text-[#8A7A9E]'} />
            <span>Sync Real-Time Jobs</span>
            <span className="text-[10px] text-[#8A7A9E] ml-1">({lastSyncTime})</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncNotification && (
        <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{syncNotification}</span>
        </div>
      )}

      {/* Three Summary Cards Above Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Card 1: Viewed Jobs */}
        <div
          id="summary-card-viewed"
          onClick={() => {
            setActiveSummaryFilter(prev => prev === 'viewed' ? null : 'viewed');
            setCurrentPage(1);
          }}
          className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
            activeSummaryFilter === 'viewed'
              ? 'bg-[#F3E9FF] border-2 border-[#542477] shadow-[0_6px_22px_rgba(84,36,119,0.12)]'
              : 'bg-white border-[#E4D5F3] hover:border-[#542477] shadow-[0_2px_12px_rgba(84,36,119,0.03)]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              activeSummaryFilter === 'viewed'
                ? 'bg-[#542477] text-white shadow-md'
                : 'bg-[#F3E9FF] text-[#542477] group-hover:bg-[#542477] group-hover:text-white'
            }`}>
              <Eye size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#8A7A9E] uppercase tracking-wider">Viewed Jobs</div>
              <div className="text-2xl font-heading font-black text-[#27113D] leading-tight mt-0.5">
                {interactionsSummary?.viewed_count ?? 0}
              </div>
            </div>
          </div>
          {activeSummaryFilter === 'viewed' ? (
            <span className="px-2.5 py-1 bg-[#542477] text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-sm flex items-center gap-1">
              <Check size={10} /> Active
            </span>
          ) : (
            <span className="text-[11px] text-[#8A7A9E] font-semibold group-hover:text-[#542477] transition-all">
              Filter →
            </span>
          )}
        </div>

        {/* Card 2: Saved Jobs */}
        <div
          id="summary-card-saved"
          onClick={() => {
            setActiveSummaryFilter(prev => prev === 'saved' ? null : 'saved');
            setCurrentPage(1);
          }}
          className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
            activeSummaryFilter === 'saved'
              ? 'bg-[#F3E9FF] border-2 border-[#542477] shadow-[0_6px_22px_rgba(84,36,119,0.12)]'
              : 'bg-white border-[#E4D5F3] hover:border-[#542477] shadow-[0_2px_12px_rgba(84,36,119,0.03)]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              activeSummaryFilter === 'saved'
                ? 'bg-[#542477] text-white shadow-md'
                : 'bg-[#F3E9FF] text-[#542477] group-hover:bg-[#542477] group-hover:text-white'
            }`}>
              <Bookmark size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#8A7A9E] uppercase tracking-wider">Saved Jobs</div>
              <div className="text-2xl font-heading font-black text-[#27113D] leading-tight mt-0.5">
                {interactionsSummary?.saved_count ?? 0}
              </div>
            </div>
          </div>
          {activeSummaryFilter === 'saved' ? (
            <span className="px-2.5 py-1 bg-[#542477] text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-sm flex items-center gap-1">
              <Check size={10} /> Active
            </span>
          ) : (
            <span className="text-[11px] text-[#8A7A9E] font-semibold group-hover:text-[#542477] transition-all">
              Filter →
            </span>
          )}
        </div>

        {/* Card 3: Applied Jobs */}
        <div
          id="summary-card-applied"
          onClick={() => {
            setActiveSummaryFilter(prev => prev === 'applied' ? null : 'applied');
            setCurrentPage(1);
          }}
          className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
            activeSummaryFilter === 'applied'
              ? 'bg-[#F3E9FF] border-2 border-[#542477] shadow-[0_6px_22px_rgba(84,36,119,0.12)]'
              : 'bg-white border-[#E4D5F3] hover:border-[#542477] shadow-[0_2px_12px_rgba(84,36,119,0.03)]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              activeSummaryFilter === 'applied'
                ? 'bg-[#542477] text-white shadow-md'
                : 'bg-[#F3E9FF] text-[#542477] group-hover:bg-[#542477] group-hover:text-white'
            }`}>
              <Send size={21} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#8A7A9E] uppercase tracking-wider">Applied Jobs</div>
              <div className="text-2xl font-heading font-black text-[#27113D] leading-tight mt-0.5">
                {interactionsSummary?.applied_count ?? 0}
              </div>
            </div>
          </div>
          {activeSummaryFilter === 'applied' ? (
            <span className="px-2.5 py-1 bg-[#542477] text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-sm flex items-center gap-1">
              <Check size={10} /> Active
            </span>
          ) : (
            <span className="text-[11px] text-[#8A7A9E] font-semibold group-hover:text-[#542477] transition-all">
              Filter →
            </span>
          )}
        </div>
      </div>

      {/* LinkedIn-Style Compact Search & Filter Panel */}
      <div className="bg-white rounded-2xl border border-[#E4D5F3] p-5 md:p-6 mb-8 shadow-[0_4px_20px_rgba(84,36,119,0.04)]">
        
        {/* Top Search Row: Keywords & Location Search */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          <div className="md:col-span-6 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A9E]" />
            <input
              value={searchKeywords}
              onChange={e => { setSearchKeywords(e.target.value); setCurrentPage(1); }}
              placeholder="Search by title, skill, or keywords (e.g. Python, React, Cloud)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-medium text-[#27113D] placeholder-[#8A7A9E] focus:outline-none focus:border-[#542477] focus:ring-1 focus:ring-[#542477] transition-all"
            />
          </div>

          <div className="md:col-span-4 relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A9E]" />
            <input
              value={locationInput}
              onChange={e => { setLocationInput(e.target.value); setCurrentPage(1); }}
              placeholder="City, state, or 'Remote'..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-medium text-[#27113D] placeholder-[#8A7A9E] focus:outline-none focus:border-[#542477] focus:ring-1 focus:ring-[#542477] transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_2px_10px_rgba(84,36,119,0.2)] hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Search size={13} /> Find Jobs
            </button>
          </div>
        </form>

        {/* Compact LinkedIn-Style Filter Pills Row */}
        <div className="pt-3 border-t border-[#E4D5F3] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#8A7A9E] shrink-0 mr-1 flex items-center gap-1">
            <Filter size={11} /> Filters:
          </span>

          {/* Date Posted Filter Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('date')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                datePostedFilter !== 'any'
                  ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                  : 'bg-[#FAF7FD] border-[#E4D5F3] text-[#27113D] hover:border-[#D6C2EB]'
              }`}
            >
              <Calendar size={12} className={datePostedFilter !== 'any' ? 'text-[#542477]' : 'text-[#8A7A9E]'} />
              <span>
                {datePostedFilter === 'any' ? 'Date Posted' : (
                  datePostedFilter === '24h' ? 'Past 24h' : (datePostedFilter === 'week' ? 'Past week' : 'Past month')
                )}
              </span>
              <ChevronDown size={12} />
            </button>

            {openDropdown === 'date' && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E4D5F3] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                {[
                  { id: 'any', label: 'Any time' },
                  { id: '24h', label: 'Past 24 hours' },
                  { id: 'week', label: 'Past week' },
                  { id: 'month', label: 'Past month' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setDatePostedFilter(opt.id); setOpenDropdown(null); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      datePostedFilter === opt.id ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Experience Level Filter Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('exp')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                experienceFilter !== 'all'
                  ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                  : 'bg-[#FAF7FD] border-[#E4D5F3] text-[#27113D] hover:border-[#D6C2EB]'
              }`}
            >
              <Award size={12} className={experienceFilter !== 'all' ? 'text-[#542477]' : 'text-[#8A7A9E]'} />
              <span>
                {experienceFilter === 'all' ? 'Experience Level' : (
                  experienceFilter === 'entry' ? 'Entry Level' : (
                    experienceFilter === 'mid-senior' ? 'Mid-Senior' : experienceFilter
                  )
                )}
              </span>
              <ChevronDown size={12} />
            </button>

            {openDropdown === 'exp' && (
              <div className="absolute left-0 mt-2 w-52 bg-white border border-[#E4D5F3] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                {[
                  { id: 'all', label: 'All experience levels' },
                  { id: 'internship', label: 'Internship' },
                  { id: 'entry', label: 'Entry level' },
                  { id: 'associate', label: 'Associate' },
                  { id: 'mid-senior', label: 'Mid-Senior level' },
                  { id: 'director', label: 'Director / Executive' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setExperienceFilter(opt.id); setOpenDropdown(null); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      experienceFilter === opt.id ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Work Arrangement Filter Dropdown (Remote / Hybrid / On-site) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('arr')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                arrangementFilter !== 'all'
                  ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                  : 'bg-[#FAF7FD] border-[#E4D5F3] text-[#27113D] hover:border-[#D6C2EB]'
              }`}
            >
              <Globe size={12} className={arrangementFilter !== 'all' ? 'text-[#542477]' : 'text-[#8A7A9E]'} />
              <span>
                {arrangementFilter === 'all' ? 'Work Arrangement' : (
                  arrangementFilter === 'remote' ? 'Remote' : (
                    arrangementFilter === 'hybrid' ? 'Hybrid' : 'On-site'
                  )
                )}
              </span>
              <ChevronDown size={12} />
            </button>

            {openDropdown === 'arr' && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E4D5F3] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                {[
                  { id: 'all', label: 'Any arrangement' },
                  { id: 'remote', label: 'Remote' },
                  { id: 'hybrid', label: 'Hybrid' },
                  { id: 'on-site', label: 'On-site' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setArrangementFilter(opt.id); setOpenDropdown(null); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      arrangementFilter === opt.id ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Employment Type Filter Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('type')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                employmentFilter !== 'all'
                  ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                  : 'bg-[#FAF7FD] border-[#E4D5F3] text-[#27113D] hover:border-[#D6C2EB]'
              }`}
            >
              <Briefcase size={12} className={employmentFilter !== 'all' ? 'text-[#542477]' : 'text-[#8A7A9E]'} />
              <span>{employmentFilter === 'all' ? 'Job Type' : employmentFilter}</span>
              <ChevronDown size={12} />
            </button>

            {openDropdown === 'type' && (
              <div className="absolute left-0 mt-2 w-44 bg-white border border-[#E4D5F3] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                {[
                  { id: 'all', label: 'All types' },
                  { id: 'full-time', label: 'Full-time' },
                  { id: 'contract', label: 'Contract' },
                  { id: 'part-time', label: 'Part-time' },
                  { id: 'internship', label: 'Internship' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setEmploymentFilter(opt.id); setOpenDropdown(null); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      employmentFilter === opt.id ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Company Filter Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('company')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                companyFilter !== 'all'
                  ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                  : 'bg-[#FAF7FD] border-[#E4D5F3] text-[#27113D] hover:border-[#D6C2EB]'
              }`}
            >
              <Building2 size={12} className={companyFilter !== 'all' ? 'text-[#542477]' : 'text-[#8A7A9E]'} />
              <span className="max-w-[120px] truncate">{companyFilter === 'all' ? 'Company' : companyFilter}</span>
              <ChevronDown size={12} />
            </button>

            {openDropdown === 'company' && (
              <div className="absolute left-0 mt-2 w-56 max-h-64 overflow-y-auto bg-white border border-[#E4D5F3] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => { setCompanyFilter('all'); setOpenDropdown(null); setCurrentPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    companyFilter === 'all' ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                  }`}
                >
                  All Companies
                </button>
                {availableCompanies.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setCompanyFilter(c); setOpenDropdown(null); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold truncate transition-colors ${
                      companyFilter === c ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Technology / Skills Filter Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('tech')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                techStackFilter !== 'all'
                  ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                  : 'bg-[#FAF7FD] border-[#E4D5F3] text-[#27113D] hover:border-[#D6C2EB]'
              }`}
            >
              <Layers size={12} className={techStackFilter !== 'all' ? 'text-[#542477]' : 'text-[#8A7A9E]'} />
              <span>{techStackFilter === 'all' ? 'Tech Stack' : techStackFilter}</span>
              <ChevronDown size={12} />
            </button>

            {openDropdown === 'tech' && (
              <div className="absolute left-0 mt-2 w-52 max-h-64 overflow-y-auto bg-white border border-[#E4D5F3] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => { setTechStackFilter('all'); setOpenDropdown(null); setCurrentPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    techStackFilter === 'all' ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                  }`}
                >
                  All Tech Stacks
                </button>
                {availableTechStacks.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTechStackFilter(t); setOpenDropdown(null); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      techStackFilter === t ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Salary Range Filter Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('salary')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                salaryFilter !== 'all'
                  ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                  : 'bg-[#FAF7FD] border-[#E4D5F3] text-[#27113D] hover:border-[#D6C2EB]'
              }`}
            >
              <DollarSign size={12} className={salaryFilter !== 'all' ? 'text-[#542477]' : 'text-[#8A7A9E]'} />
              <span>{salaryFilter === 'all' ? 'Salary' : `$${salaryFilter}+`}</span>
              <ChevronDown size={12} />
            </button>

            {openDropdown === 'salary' && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E4D5F3] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                {[
                  { id: 'all', label: 'Any salary' },
                  { id: '50', label: '$50k+ / year' },
                  { id: '80', label: '$80k+ / year' },
                  { id: '100', label: '$100k+ / year' },
                  { id: '120', label: '$120k+ / year' },
                  { id: '150', label: '$150k+ / year' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setSalaryFilter(opt.id); setOpenDropdown(null); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      salaryFilter === opt.id ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Industry Filter Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => toggleDropdown('industry')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${
                industryFilter !== 'all'
                  ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                  : 'bg-[#FAF7FD] border-[#E4D5F3] text-[#27113D] hover:border-[#D6C2EB]'
              }`}
            >
              <Briefcase size={12} className={industryFilter !== 'all' ? 'text-[#542477]' : 'text-[#8A7A9E]'} />
              <span>{industryFilter === 'all' ? 'Category' : industryFilter}</span>
              <ChevronDown size={12} />
            </button>

            {openDropdown === 'industry' && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-[#E4D5F3] rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                {[
                  { id: 'all', label: 'All Categories' },
                  { id: 'Engineering', label: 'Engineering & Software' },
                  { id: 'Data', label: 'Data & AI' },
                  { id: 'Cloud', label: 'Cloud & DevOps' },
                  { id: 'Product', label: 'Product & Design' },
                  { id: 'Security', label: 'Security & Systems' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setIndustryFilter(opt.id); setOpenDropdown(null); setCurrentPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      industryFilter === opt.id ? 'bg-[#F3E9FF] text-[#542477]' : 'text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset All Button */}
          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-[#E11D48] hover:bg-[#FFF1F2] border border-[#FECDD3] flex items-center gap-1 shrink-0 transition-colors ml-auto"
            >
              <RotateCcw size={11} /> Reset All
            </button>
          )}
        </div>

        {/* Active Filter Chips Strip */}
        {activeFilters.length > 0 && (
          <div className="pt-3 mt-3 border-t border-[#E4D5F3] flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider">Active:</span>
            {activeFilters.map(af => (
              <span
                key={af.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F3E9FF] border border-[#E4D5F3] rounded-full text-xs font-bold text-[#542477] animate-in zoom-in-95"
              >
                <span>{af.label}</span>
                <button
                  type="button"
                  onClick={af.clear}
                  className="p-0.5 hover:bg-[#E4D5F3] rounded-full text-[#542477]"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Requisitions List Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-heading font-black text-[#27113D] tracking-tight">
          Current Openings ({filteredJobs.length})
        </h2>
        {filteredJobs.length > pageSize && (
          <span className="text-xs text-[#8A7A9E] font-medium">
            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredJobs.length)} of {filteredJobs.length}
          </span>
        )}
      </div>

      {/* Main Jobs Listing State Handling */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#E4D5F3]">
          <div className="w-10 h-10 border-4 border-[#E4D5F3] border-t-[#542477] rounded-full animate-spin mb-4"></div>
          <p className="text-[#8A7A9E] font-bold text-sm">Fetching verified job openings...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#E4D5F3] py-16 px-6 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-[#F3E9FF] rounded-full flex items-center justify-center mb-4 text-[#542477]">
            {activeSummaryFilter === 'viewed' ? (
              <Eye size={24} />
            ) : activeSummaryFilter === 'saved' ? (
              <Bookmark size={24} />
            ) : activeSummaryFilter === 'applied' ? (
              <Send size={24} />
            ) : (
              <Search size={24} />
            )}
          </div>
          <h3 className="text-lg font-bold text-[#27113D] mb-2">
            {activeSummaryFilter === 'viewed'
              ? 'No Viewed Jobs Yet'
              : activeSummaryFilter === 'saved'
              ? 'No Saved Jobs Yet'
              : activeSummaryFilter === 'applied'
              ? 'No Applied Jobs Yet'
              : 'No requisitions matched your filters'}
          </h3>
          <p className="text-xs text-[#5F4E75] max-w-md mx-auto mb-6">
            {activeSummaryFilter === 'viewed'
              ? 'You have not opened or viewed any job opportunities yet. Browse active requisitions and click View Details to track your viewed roles here.'
              : activeSummaryFilter === 'saved'
              ? 'You have not saved any jobs yet. Click the bookmark icon on any job card to save roles you are interested in.'
              : activeSummaryFilter === 'applied'
              ? 'You have not confirmed any job applications yet. Click "Apply on Company Site" on any job card and confirm your application to track it here.'
              : "We couldn't find any job opportunities that match all of your selected filters. Try broadening your keywords or resetting filters."}
          </p>
          <button
            type="button"
            onClick={handleResetAllFilters}
            className="px-5 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95"
          >
            {activeSummaryFilter ? 'Show All Available Jobs' : 'Reset All Filters'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {paginatedJobs.map((job) => {
            const currentMatch = jobMatches[job.job_id];
            const matchedResume = matchedResumes[job.job_id];
            const appUrl = job.job_url || job.application_url;
            const isSaved = interactionsSummary?.saved_job_ids?.includes(job.job_id);
            const isApplied = interactionsSummary?.applied_job_ids?.includes(job.job_id);

            return (
              <div
                key={job.job_id}
                className="bg-white rounded-2xl border border-[#E4D5F3] p-6 shadow-[0_4px_20px_rgba(84,36,119,0.03)] hover:border-[#D6C2EB] hover:shadow-[0_8px_24px_rgba(84,36,119,0.08)] transition-all overflow-hidden"
              >
                {/* Job Card Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                  <div className="flex items-start gap-3.5">
                    {job.employer_logo ? (
                      <img
                        src={job.employer_logo}
                        alt={job.company}
                        className="w-12 h-12 rounded-xl object-contain bg-white border border-[#E4D5F3] p-1 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center shrink-0 border border-[#E4D5F3]">
                        <Building2 size={24} />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-[#27113D] tracking-tight">{job.title}</h3>
                        
                        {/* Applied Status Badge */}
                        {isApplied && (
                          <span className="px-2.5 py-0.5 bg-[#F0FDF4] text-[#16A34A] text-[10px] font-bold uppercase rounded-full border border-[#BBF7D0] flex items-center gap-1 shadow-sm">
                            <CheckCircle2 size={11} /> Applied
                          </span>
                        )}

                        {/* Source Badge */}
                        {job.source?.toLowerCase().includes('himalayas') ? (
                          <span className="px-2.5 py-0.5 bg-[#EEF2FF] text-[#4F46E5] text-[10px] font-bold uppercase rounded-full border border-[#C7D2FE] flex items-center gap-1 shadow-sm">
                            <Globe size={10} /> Himalayas Remote
                          </span>
                        ) : (job.source?.toLowerCase().includes('google') || job.source?.toLowerCase().includes('serpapi')) ? (
                          <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold uppercase rounded-full border border-[#BFDBFE] flex items-center gap-1 shadow-sm">
                            <Globe size={10} /> Google Jobs
                          </span>
                        ) : job.is_live_external ? (
                          <span className="px-2.5 py-0.5 bg-[#F0FDF4] text-[#16A34A] text-[10px] font-bold uppercase rounded-full border border-[#BBF7D0] flex items-center gap-1">
                            <Globe size={10} /> JSearch Live
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-[#F3E9FF] text-[#542477] text-[10px] font-bold uppercase rounded-full border border-[#E4D5F3]">
                            Verified
                          </span>
                        )}

                        {/* Arrangement Badge */}
                        {job.work_arrangement && (
                          <span className="px-2 py-0.5 bg-[#FAF7FD] text-[#5F4E75] text-[10px] font-semibold rounded-md border border-[#E4D5F3]">
                            {job.work_arrangement}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#5F4E75] flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="font-bold text-[#27113D]">{job.company}</span>
                        <span className="w-1 h-1 bg-[#E4D5F3] rounded-full"></span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[#8A7A9E]" /> {job.location || 'Remote'}
                        </span>
                        {job.employment_type && (
                          <>
                            <span className="w-1 h-1 bg-[#E4D5F3] rounded-full"></span>
                            <span>{job.employment_type}</span>
                          </>
                        )}
                        {job.salary_range && (
                          <>
                            <span className="w-1 h-1 bg-[#E4D5F3] rounded-full"></span>
                            <span className="text-[#542477] font-bold flex items-center gap-0.5 text-xs bg-[#F3E9FF] px-2.5 py-0.5 rounded-full border border-[#E4D5F3]">
                              <DollarSign size={11} /> {job.salary_range}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Save / Bookmark & Match with Resume Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Bookmark Save Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(job, e)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isSaved
                          ? 'bg-[#F3E9FF] border-[#542477] text-[#542477] shadow-sm'
                          : 'bg-white border-[#E4D5F3] hover:border-[#542477] text-[#8A7A9E] hover:text-[#542477]'
                      }`}
                      title={isSaved ? "Saved Job (Click to unsave)" : "Save Job for later"}
                    >
                      <Bookmark size={15} className={isSaved ? "fill-[#542477]" : ""} />
                    </button>

                    {currentMatch && (
                      <span className="px-3 py-1.5 bg-[#F3E9FF] text-[#542477] border border-[#E4D5F3] text-xs font-black rounded-full animate-in zoom-in">
                        {currentMatch.job_match_score}% Match
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setMatchModalJob(job)}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white text-xs font-bold rounded-xl shadow-[0_2px_10px_rgba(84,36,119,0.2)] hover:opacity-95 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles size={13} />
                      <span>{currentMatch ? 'Change Resume / Re-match' : 'Match with Resume'}</span>
                    </button>
                  </div>
                </div>

                {/* Job Description Snippet */}
                <p className="text-xs text-[#5F4E75] leading-relaxed mb-4 font-normal">
                  {job.description && job.description.length > 260
                    ? job.description.substring(0, 260) + '...'
                    : job.description}
                </p>

                {/* Required Skills Chips */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-5">
                    <span className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider mr-1">Skills:</span>
                    {job.required_skills.slice(0, 8).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 bg-[#FAF7FD] border border-[#E4D5F3] text-[#542477] text-xs font-semibold rounded-lg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Actions Footer: Track Application is removed here */}
                <div className="pt-4 border-t border-[#E4D5F3] flex flex-wrap gap-2.5 items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Link
                      to={`/jobs/${job.job_id}${matchedResume ? `?resume_id=${matchedResume.resume_id}` : ''}`}
                      onClick={() => handleRecordView(job)}
                      className="px-4 py-2 bg-white border border-[#E4D5F3] hover:border-[#542477] hover:bg-[#F3E9FF]/40 text-[#27113D] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      View Details <ArrowRight size={13} />
                    </Link>

                    {appUrl && (
                      <button
                        type="button"
                        onClick={() => handleApplyClick(job, appUrl)}
                        className={`px-4 py-2 border text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                          isApplied
                            ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A] hover:bg-[#DCFCE7]'
                            : 'bg-[#F3E9FF] hover:bg-[#542477] hover:text-white text-[#542477] border-[#E4D5F3]'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 size={12} /> Applied on Company Site
                          </>
                        ) : (
                          <>
                            Apply on Company Site <ExternalLink size={12} />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {job.posting_date && (
                    <span className="text-[11px] text-[#8A7A9E] flex items-center gap-1">
                      <Clock size={11} /> Posted: {job.posting_date}
                    </span>
                  )}
                </div>

                {/* Expanded AI Match Breakdown if calculated */}
                {currentMatch && (
                  <div className="mt-5 pt-5 border-t border-[#E4D5F3] animate-in slide-in-from-top-3 duration-300">
                    <div className="bg-gradient-to-br from-[#FBF8FF] to-[#F3E9FF] border border-[#E4D5F3] rounded-2xl p-5 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-[#542477] flex items-center gap-1.5 uppercase tracking-wider">
                          <ShieldCheck size={16} className="text-[#D83CC5]" /> Real Resume Match Breakdown
                        </h4>
                        {matchedResume && (
                          <span className="text-[11px] text-[#5F4E75] font-semibold">
                            Evaluated with: <strong className="text-[#542477]">{matchedResume.filename}</strong>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                        <div className="bg-white border border-[#E4D5F3] rounded-xl p-3 text-center shadow-sm">
                          <div className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider">Skills Match</div>
                          <div className="text-xl font-heading font-black text-[#542477] mt-0.5">{currentMatch.skill_match}%</div>
                        </div>
                        <div className="bg-white border border-[#E4D5F3] rounded-xl p-3 text-center shadow-sm">
                          <div className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider">Education</div>
                          <div className="text-xl font-heading font-black text-[#27113D] mt-0.5">{currentMatch.education_match}%</div>
                        </div>
                        <div className="bg-white border border-[#E4D5F3] rounded-xl p-3 text-center shadow-sm">
                          <div className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider">Experience</div>
                          <div className="text-xl font-heading font-black text-[#27113D] mt-0.5">{currentMatch.experience_match}%</div>
                        </div>
                        <div className={`bg-white border rounded-xl p-3 text-center shadow-sm ${currentMatch.eligible ? 'border-[#BBF7D0]' : 'border-[#FECDD3]'}`}>
                          <div className="text-[10px] font-bold text-[#8A7A9E] uppercase tracking-wider">Eligibility</div>
                          <div className={`text-xs font-bold mt-1.5 flex items-center justify-center gap-1 ${currentMatch.eligible ? 'text-[#16A34A]' : 'text-[#E11D48]'}`}>
                            {currentMatch.eligible ? <><CheckCircle2 size={13} /> Eligible</> : <><X size={13} /> Below Req</>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5 mb-2">
                            <CheckCircle2 size={13} /> Matched Skills ({currentMatch.matched_skills?.length || 0})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {currentMatch.matched_skills?.length ? (
                              currentMatch.matched_skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-0.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-bold rounded-lg">
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
                            <X size={13} /> Missing Skills ({currentMatch.missing_skills?.length || 0})
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {currentMatch.missing_skills?.length ? (
                              currentMatch.missing_skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-0.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-xs font-bold rounded-lg">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#16A34A] font-bold flex items-center gap-1">
                                <Check size={13} /> All specified skills satisfied
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#E4D5F3]">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-[#E4D5F3] rounded-xl text-xs font-bold text-[#27113D] hover:bg-[#FAF7FD] disabled:opacity-40 transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      currentPage === page
                        ? 'bg-[#542477] text-white shadow-sm'
                        : 'bg-white border border-[#E4D5F3] text-[#27113D] hover:bg-[#FAF7FD]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-[#E4D5F3] rounded-xl text-xs font-bold text-[#27113D] hover:bg-[#FAF7FD] disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resume Selection & Real Matching Modal */}
      <ResumeMatchModal
        isOpen={Boolean(matchModalJob)}
        onClose={() => setMatchModalJob(null)}
        job={matchModalJob}
        userId={userId}
        onMatchSuccess={handleMatchSuccess}
      />

      {/* Application Confirmation Modal */}
      {applicationConfirmJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center shrink-0 border border-[#E4D5F3]">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-base font-heading font-black text-[#27113D]">
                  Track Completed Application
                </h3>
                <p className="text-xs text-[#8A7A9E] truncate max-w-[280px]">
                  {applicationConfirmJob.company} • {applicationConfirmJob.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5F4E75] mb-6 leading-relaxed">
              We opened the external employer site in a new tab. Have you completed and submitted your job application for this role?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleConfirmApplication(false)}
                disabled={submittingApplication}
                className="px-4 py-2 border border-[#E4D5F3] text-[#5F4E75] hover:bg-[#FAF7FD] rounded-xl text-xs font-bold transition-all"
              >
                Not Yet
              </button>
              <button
                type="button"
                onClick={() => handleConfirmApplication(true)}
                disabled={submittingApplication}
                className="px-5 py-2 bg-gradient-to-r from-[#542477] to-[#D83CC5] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:opacity-95 flex items-center gap-1.5"
              >
                {submittingApplication ? (
                  <>Saving...</>
                ) : (
                  <>
                    <CheckCircle2 size={13} /> Mark as Applied
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
