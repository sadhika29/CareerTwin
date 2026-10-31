import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, ExternalLink, CheckCircle2,
  AlertCircle, Check,
  Code2, Brain, FileCode, Sparkles, RefreshCw,
  TrendingUp, Award, Layers, X, ShieldAlert, StickyNote
} from 'lucide-react';
import {
  getUserSkills, createUserSkill, updateUserSkill, deleteUserSkill,
  updateTargetRole, getLearningProgress, updateLearningProgress
} from '../features/skills/skillService';
import {
  STRIVER_SHEET_URL, LEETCODE_BASE_URL, INDIABIX_BASE_URL,
  GFG_BASE_URL, W3SCHOOLS_BASE_URL,
  DSA_PROBLEMS, APTITUDE_TOPICS, PROGRAMMING_LANGUAGES
} from '../features/skills/learningResourcesData';

const SKILL_CATEGORIES = [
  'Programming Languages',
  'Web Development',
  'Databases',
  'Cloud & DevOps',
  'Data Structures & Algorithms',
  'Aptitude',
  'Soft Skills',
  'Other'
];

export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const SKILL_LEVEL_RANK = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

export function toSkillLevel(val, fallback = 'Intermediate') {
  if (!val && val !== 0) return fallback;
  if (typeof val === 'string') {
    const cleaned = val.trim().charAt(0).toUpperCase() + val.trim().slice(1).toLowerCase();
    if (SKILL_LEVEL_RANK[cleaned]) return cleaned;
    const num = parseFloat(val);
    if (!isNaN(num)) val = num;
    else return fallback;
  }
  const n = Number(val);
  if (n < 40) return 'Beginner';
  if (n < 70) return 'Intermediate';
  if (n < 90) return 'Advanced';
  return 'Expert';
}

export function getLevelBadge(level) {
  switch (level) {
    case 'Beginner':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Intermediate':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Advanced':
      return 'bg-[#F3E9FF] text-[#542477] border-[#E4D5F3]';
    case 'Expert':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-[#FAF7FD] text-[#69567E] border-[#E4D5F3]';
  }
}

export default function Skills() {
  // Skills state
  const [skills, setSkills] = useState([]);
  const [summary, setSummary] = useState({
    total_skills: 0,
    proficient_skills: 0,
    skills_to_improve: 0,
    target_role: 'Software Engineer',
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Table filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'prof_desc' | 'prof_asc' | 'name'

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [deletingSkill, setDeletingSkill] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState('');

  // Skill Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Programming Languages');
  const [formCurrentLevel, setFormCurrentLevel] = useState('Intermediate');
  const [formTargetLevel, setFormTargetLevel] = useState('Advanced');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Learning & Practice Section state
  const [activePracticeTab, setActivePracticeTab] = useState('dsa'); // 'dsa' | 'aptitude' | 'programming'
  const [learningProgressMap, setLearningProgressMap] = useState({});
  const [dsaTopicFilter, setDsaTopicFilter] = useState('All');
  const [aptitudeCategoryFilter, setAptitudeCategoryFilter] = useState('All');
  const [selectedProgLanguage, setSelectedProgLanguage] = useState('Python');
  const [activeNotesItem, setActiveNotesItem] = useState(null); // { id, title, notes, category, topic }
  const [notesInput, setNotesInput] = useState('');
  const [savingProgressId, setSavingProgressId] = useState(null);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [skillsRes, progressRes] = await Promise.allSettled([
        getUserSkills(),
        getLearningProgress(),
      ]);

      if (skillsRes.status === 'fulfilled' && skillsRes.value) {
        setSkills(skillsRes.value.skills || []);
        if (skillsRes.value.summary) {
          setSummary(skillsRes.value.summary);
          setTargetRoleInput(skillsRes.value.summary.target_role || 'Software Engineer');
        }
      } else if (skillsRes.status === 'rejected') {
        console.warn('Skills load error:', skillsRes.reason);
        setErrorMsg(skillsRes.reason?.response?.data?.detail || 'Unable to load skills. Please check your connection.');
      }

      if (progressRes.status === 'fulfilled' && progressRes.value) {
        setLearningProgressMap(progressRes.value.progress_map || {});
      }
    } catch (err) {
      console.error('Data load exception:', err);
      setErrorMsg('Failed to initialize skills data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // --------------------------------------------------------------------------
  // Skill CRUD Actions
  // --------------------------------------------------------------------------
  const openAddModal = () => {
    setFormName('');
    setFormCategory('Programming Languages');
    setFormCurrentLevel('Intermediate');
    setFormTargetLevel('Advanced');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (skill) => {
    setEditingSkill(skill);
    setFormName(skill.name || '');
    setFormCategory(skill.category || 'Programming Languages');
    setFormCurrentLevel(skill.current_level || skill.currentLevel || toSkillLevel(skill.proficiency, 'Intermediate'));
    setFormTargetLevel(skill.target_level || skill.targetLevel || toSkillLevel(skill.target_proficiency, 'Advanced'));
    setFormError('');
  };

  const handleSaveSkill = async (e) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Please enter a skill name.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name: cleanName,
        category: formCategory,
        current_level: formCurrentLevel,
        target_level: formTargetLevel,
        currentLevel: formCurrentLevel,
        targetLevel: formTargetLevel,
      };

      if (editingSkill) {
        // UPDATE
        const updated = await updateUserSkill(editingSkill.id, payload);

        setSkills((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
        );
        setEditingSkill(null);
        showNotification(`Skill "${cleanName}" updated successfully.`);
      } else {
        // CREATE
        const created = await createUserSkill(payload);

        setSkills((prev) => [created, ...prev]);
        setIsAddModalOpen(false);
        showNotification(`Skill "${cleanName}" added successfully.`);
      }

      // Refresh live summary metrics from backend
      const refreshed = await getUserSkills();
      if (refreshed?.summary) {
        setSummary(refreshed.summary);
      }
    } catch (err) {
      console.error('Skill save failed:', err);
      setFormError(err.response?.data?.detail || 'Failed to save skill. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deletingSkill) return;
    try {
      setFormSubmitting(true);
      await deleteUserSkill(deletingSkill.id);
      setSkills((prev) => prev.filter((s) => s.id !== deletingSkill.id));
      showNotification(`Skill "${deletingSkill.name}" deleted.`);
      setDeletingSkill(null);

      // Refresh summary
      const refreshed = await getUserSkills();
      if (refreshed?.summary) {
        setSummary(refreshed.summary);
      }
    } catch (err) {
      console.error('Skill deletion failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to delete skill.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateTargetRole = async (e) => {
    e.preventDefault();
    const cleanRole = targetRoleInput.trim();
    if (!cleanRole) return;

    try {
      setFormSubmitting(true);
      const updatedSummary = await updateTargetRole(cleanRole);
      setSummary(updatedSummary);
      setIsRoleModalOpen(false);
      showNotification(`Target role updated to "${cleanRole}".`);
    } catch (err) {
      console.error('Target role update failed:', err);
      setErrorMsg('Failed to update target role.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // Learning & Practice Progress Actions
  // --------------------------------------------------------------------------
  const handleProgressStatusChange = async (item, newStatus, category) => {
    setSavingProgressId(item.id);
    try {
      const existing = learningProgressMap[item.id] || {};
      const payload = {
        resource_id: item.id,
        category: category,
        topic: item.topic || item.category || selectedProgLanguage,
        title: item.title,
        status: newStatus,
        notes: existing.notes || '',
      };

      const updated = await updateLearningProgress(payload);
      setLearningProgressMap((prev) => ({
        ...prev,
        [item.id]: updated,
      }));
    } catch (err) {
      console.error('Failed to update progress status:', err);
      setErrorMsg('Failed to update practice status. Please try again.');
    } finally {
      setSavingProgressId(null);
    }
  };

  const handleToggleSolved = async (item, category) => {
    const currentStatus = learningProgressMap[item.id]?.status || 'Not Started';
    const nextStatus = currentStatus === 'Solved' || currentStatus === 'Completed' ? 'Not Started' : 'Solved';
    await handleProgressStatusChange(item, nextStatus, category);
  };

  const openNotesModal = (item, category) => {
    const existing = learningProgressMap[item.id];
    setActiveNotesItem({
      ...item,
      category,
      topic: item.topic || item.category || selectedProgLanguage,
    });
    setNotesInput(existing?.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!activeNotesItem) return;
    try {
      const currentStatus = learningProgressMap[activeNotesItem.id]?.status || 'Not Started';
      const payload = {
        resource_id: activeNotesItem.id,
        category: activeNotesItem.category,
        topic: activeNotesItem.topic,
        title: activeNotesItem.title,
        status: currentStatus,
        notes: notesInput.trim(),
      };

      const updated = await updateLearningProgress(payload);
      setLearningProgressMap((prev) => ({
        ...prev,
        [activeNotesItem.id]: updated,
      }));
      setActiveNotesItem(null);
      showNotification('Personal notes saved.');
    } catch (err) {
      console.error('Failed to save notes:', err);
      setErrorMsg('Failed to save notes.');
    }
  };

  // --------------------------------------------------------------------------
  // Filtered & Sorted Skills
  // --------------------------------------------------------------------------
  const filteredSkills = useMemo(() => {
    return skills
      .filter((s) => {
        // Category filter
        if (selectedCategory !== 'All' && s.category !== selectedCategory) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = s.name.toLowerCase().includes(q);
          const matchesCategory = s.category.toLowerCase().includes(q);
          const matchesNotes = (s.notes || '').toLowerCase().includes(q);
          if (!matchesName && !matchesCategory && !matchesNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'level_desc' || sortBy === 'prof_desc') {
          const rankA = SKILL_LEVEL_RANK[toSkillLevel(a.current_level || a.currentLevel || a.proficiency)] || 0;
          const rankB = SKILL_LEVEL_RANK[toSkillLevel(b.current_level || b.currentLevel || b.proficiency)] || 0;
          if (rankB !== rankA) return rankB - rankA;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'level_asc' || sortBy === 'prof_asc') {
          const rankA = SKILL_LEVEL_RANK[toSkillLevel(a.current_level || a.currentLevel || a.proficiency)] || 0;
          const rankB = SKILL_LEVEL_RANK[toSkillLevel(b.current_level || b.currentLevel || b.proficiency)] || 0;
          if (rankA !== rankB) return rankA - rankB;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        // Default: updated
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      });
  }, [skills, selectedCategory, searchQuery, sortBy]);

  // DSA Filtered Problems
  const filteredDsaProblems = useMemo(() => {
    if (dsaTopicFilter === 'All') return DSA_PROBLEMS;
    return DSA_PROBLEMS.filter((p) => p.topic === dsaTopicFilter);
  }, [dsaTopicFilter]);

  // Aptitude Filtered Topics
  const filteredAptitudeTopics = useMemo(() => {
    if (aptitudeCategoryFilter === 'All') return APTITUDE_TOPICS;
    return APTITUDE_TOPICS.filter((t) => t.category === aptitudeCategoryFilter);
  }, [aptitudeCategoryFilter]);

  // Programming Language Active Object
  const activeProgLanguageObj = useMemo(() => {
    return (
      PROGRAMMING_LANGUAGES.find((p) => p.language === selectedProgLanguage) ||
      PROGRAMMING_LANGUAGES[0]
    );
  }, [selectedProgLanguage]);

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] p-4 md:p-8 space-y-6">
      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION A: PAGE HEADER                                               */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-[#27113D] tracking-tight">
            Your Skills
          </h1>
          <p className="text-xs md:text-sm text-[#8A7A9E] mt-1 font-medium">
            Add your skills, track your proficiency levels, and improve them for your target roles.
          </p>
        </div>
        <button
          id="btn-add-skill-header"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#542477] hover:bg-[#431B60] text-white rounded-xl text-xs font-bold tracking-wide shadow-[0_4px_16px_rgba(84,36,119,0.22)] transition-all active:scale-[0.98]"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span>Add Skill</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SECTION B: FOUR SUMMARY CARDS                                        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Skills */}
        <div className="bg-white border border-[#E4D5F3] rounded-2xl p-5 shadow-[0_2px_12px_rgba(84,36,119,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center">
              <Layers size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#8A7A9E] uppercase tracking-wider">
                Total Skills
              </div>
              <div className="text-2xl font-heading font-black text-[#27113D] leading-tight mt-0.5">
                {summary.total_skills}
              </div>
            </div>
          </div>
          <span className="text-[11px] text-[#8A7A9E] font-medium bg-[#FAF7FD] px-2 py-0.5 rounded-md border border-[#E4D5F3]">
            Tracked
          </span>
        </div>

        {/* Card 2: Proficient Skills (>= 70%) */}
        <div className="bg-white border border-[#E4D5F3] rounded-2xl p-5 shadow-[0_2px_12px_rgba(84,36,119,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#8A7A9E] uppercase tracking-wider">
                Proficient Skills
              </div>
              <div className="text-2xl font-heading font-black text-[#27113D] leading-tight mt-0.5">
                {summary.proficient_skills}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Advanced / Expert
          </span>
        </div>

        {/* Card 3: Skills to Improve (< target_proficiency) */}
        <div className="bg-white border border-[#E4D5F3] rounded-2xl p-5 shadow-[0_2px_12px_rgba(84,36,119,0.03)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#8A7A9E] uppercase tracking-wider">
                Skills to Improve
              </div>
              <div className="text-2xl font-heading font-black text-[#27113D] leading-tight mt-0.5">
                {summary.skills_to_improve}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Below Target
          </span>
        </div>

        {/* Card 4: Target Role */}
        <div className="bg-white border border-[#E4D5F3] rounded-2xl p-5 shadow-[0_2px_12px_rgba(84,36,119,0.03)] flex items-center justify-between group">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center shrink-0">
              <Sparkles size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#8A7A9E] uppercase tracking-wider">
                Target Role
              </div>
              <div className="text-sm font-heading font-black text-[#27113D] truncate mt-0.5" title={summary.target_role}>
                {summary.target_role || 'Software Engineer'}
              </div>
            </div>
          </div>
          <button
            id="btn-edit-target-role"
            onClick={() => {
              setTargetRoleInput(summary.target_role || 'Software Engineer');
              setIsRoleModalOpen(true);
            }}
            className="p-1.5 text-[#8A7A9E] hover:text-[#542477] hover:bg-[#F3E9FF] rounded-lg transition-colors shrink-0"
            title="Edit Target Role"
          >
            <Edit2 size={15} />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION C: SIMPLE SKILL MANAGEMENT TABLE                            */}
      {/* ==================================================================== */}
      <div className="bg-white border border-[#E4D5F3] rounded-2xl p-5 md:p-6 shadow-[0_2px_14px_rgba(84,36,119,0.03)] space-y-4">
        {/* Controls Above Table */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7A9E]" />
            <input
              id="input-skill-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills by name or category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-medium text-[#27113D] placeholder-[#8A7A9E] focus:outline-none focus:border-[#542477] focus:ring-1 focus:ring-[#542477] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7A9E] hover:text-[#27113D]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sorting Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#8A7A9E] uppercase tracking-wider whitespace-nowrap">
              Sort By:
            </span>
            <select
              id="select-skill-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E4D5F3] bg-[#FAF7FD] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="level_desc">Skill Level (High to Low)</option>
              <option value="level_asc">Skill Level (Low to High)</option>
              <option value="name">Skill Name (A–Z)</option>
            </select>

            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-3 py-2 text-xs font-semibold text-[#542477] hover:bg-[#F3E9FF] rounded-xl transition-colors whitespace-nowrap"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#542477] text-white shadow-sm'
                : 'bg-[#FAF7FD] text-[#69567E] hover:bg-[#F3E9FF] hover:text-[#542477] border border-[#E4D5F3]'
            }`}
          >
            All Categories
          </button>
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#542477] text-white shadow-sm'
                  : 'bg-[#FAF7FD] text-[#69567E] hover:bg-[#F3E9FF] hover:text-[#542477] border border-[#E4D5F3]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw size={24} className="animate-spin text-[#542477] mx-auto mb-2" />
            <p className="text-xs text-[#8A7A9E] font-medium">Loading your skills...</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="py-14 text-center border-2 border-dashed border-[#E4D5F3] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-xl bg-[#F3E9FF] text-[#542477] flex items-center justify-center mx-auto mb-3">
              <Award size={24} />
            </div>
            <h3 className="text-sm font-heading font-bold text-[#27113D]">
              {skills.length === 0 ? 'No skills added yet' : 'No matching skills found'}
            </h3>
            <p className="text-xs text-[#8A7A9E] max-w-sm mx-auto mt-1">
              {skills.length === 0
                ? 'Add your programming languages, frameworks, and technical abilities to start tracking proficiency.'
                : 'Try adjusting your search keywords or category filters.'}
            </p>
            {skills.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#542477] hover:bg-[#431B60] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus size={14} />
                <span>Add Your First Skill</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E4D5F3]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7FD] border-b border-[#E4D5F3] text-[#8A7A9E] uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Skill Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Skill Level</th>
                  <th className="py-3 px-4">Target Skill Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3E9FF]">
                {filteredSkills.map((s) => {
                  const currentLvl = s.current_level || s.currentLevel || toSkillLevel(s.proficiency, 'Intermediate');
                  const targetLvl = s.target_level || s.targetLevel || toSkillLevel(s.target_proficiency, 'Advanced');
                  const currentRank = SKILL_LEVEL_RANK[currentLvl] || 2;
                  const targetRank = SKILL_LEVEL_RANK[targetLvl] || 3;
                  const isTargetMet = currentRank >= targetRank;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-[#FAF7FD] transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#27113D] text-xs">
                          {s.name}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-[#F3E9FF] text-[#542477] font-semibold text-[11px] rounded-full inline-block">
                          {s.category}
                        </span>
                      </td>

                      {/* Current Skill Level */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border inline-flex items-center gap-1.5 ${getLevelBadge(currentLvl)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{currentLvl}</span>
                        </span>
                      </td>

                      {/* Target Skill Level */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border inline-flex items-center gap-1.5 ${getLevelBadge(targetLvl)}`}>
                          <span>{targetLvl}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isTargetMet ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200 inline-flex items-center gap-1">
                            <Check size={11} strokeWidth={2.5} />
                            <span>Target Met</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200 inline-flex items-center gap-1">
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3.5 px-4 text-[#8A7A9E] font-medium">
                        {formatDate(s.updated_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            id={`btn-edit-${s.id}`}
                            onClick={() => openEditModal(s)}
                            className="p-1.5 text-[#8A7A9E] hover:text-[#542477] hover:bg-[#F3E9FF] rounded-lg transition-colors"
                            title="Edit Skill"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            id={`btn-delete-${s.id}`}
                            onClick={() => setDeletingSkill(s)}
                            className="p-1.5 text-[#8A7A9E] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Skill"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* SECTION D: SIMPLE LEARNING AND PRACTICE SECTION                     */}
      {/* ==================================================================== */}
      <div className="bg-white border border-[#E4D5F3] rounded-2xl p-5 md:p-6 shadow-[0_2px_14px_rgba(84,36,119,0.03)] space-y-5">
        {/* Practice Header & Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4D5F3] pb-4">
          <div>
            <h2 className="text-lg font-heading font-black text-[#27113D] tracking-tight">
              Learning & Practice
            </h2>
            <p className="text-xs text-[#8A7A9E] mt-0.5">
              Practice verified coding problems, aptitude tests, and language tutorials.
            </p>
          </div>

          {/* 3 Selectable Categories */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl self-start sm:self-auto">
            <button
              id="tab-dsa"
              onClick={() => setActivePracticeTab('dsa')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePracticeTab === 'dsa'
                  ? 'bg-[#542477] text-white shadow-sm'
                  : 'text-[#69567E] hover:text-[#542477]'
              }`}
            >
              <Code2 size={14} />
              <span>DSA Practice</span>
            </button>
            <button
              id="tab-aptitude"
              onClick={() => setActivePracticeTab('aptitude')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePracticeTab === 'aptitude'
                  ? 'bg-[#542477] text-white shadow-sm'
                  : 'text-[#69567E] hover:text-[#542477]'
              }`}
            >
              <Brain size={14} />
              <span>Aptitude Practice</span>
            </button>
            <button
              id="tab-programming"
              onClick={() => setActivePracticeTab('programming')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePracticeTab === 'programming'
                  ? 'bg-[#542477] text-white shadow-sm'
                  : 'text-[#69567E] hover:text-[#542477]'
              }`}
            >
              <FileCode size={14} />
              <span>Programming Languages</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: DSA Practice (Striver's A2Z Sheet + LeetCode)                */}
        {/* ------------------------------------------------------------------ */}
        {activePracticeTab === 'dsa' && (
          <div className="space-y-4">
            {/* External Resource Links Banner */}
            <div className="p-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#542477]">Official Resources:</span>
                <span className="text-[#8A7A9E]">Striver's A2Z DSA Sheet and LeetCode problemset</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={STRIVER_SHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#542477] rounded-lg font-bold transition-colors"
                >
                  <span>Striver A2Z Sheet</span>
                  <ExternalLink size={12} />
                </a>
                <a
                  href={LEETCODE_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#542477] rounded-lg font-bold transition-colors"
                >
                  <span>LeetCode Problemset</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Topic Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {[
                'All', 'Arrays', 'Binary Search', 'Strings', 'Linked Lists',
                'Stacks and Queues', 'Trees', 'Binary Search Trees', 'Dynamic Programming', 'Graphs'
              ].map((topic) => (
                <button
                  key={topic}
                  onClick={() => setDsaTopicFilter(topic)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    dsaTopicFilter === topic
                      ? 'bg-[#542477] text-white shadow-sm'
                      : 'bg-[#FAF7FD] text-[#69567E] hover:bg-[#F3E9FF] hover:text-[#542477] border border-[#E4D5F3]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {/* Problem List */}
            <div className="overflow-x-auto rounded-xl border border-[#E4D5F3]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7FD] border-b border-[#E4D5F3] text-[#8A7A9E] uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">Status</th>
                    <th className="py-2.5 px-4">Problem Title</th>
                    <th className="py-2.5 px-4">Topic</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-4">Verified Resources</th>
                    <th className="py-2.5 px-4">Progress State</th>
                    <th className="py-2.5 px-4 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E9FF]">
                  {filteredDsaProblems.map((prob) => {
                    const prog = learningProgressMap[prob.id] || {};
                    const isSolved = prog.status === 'Solved' || prog.status === 'Completed';

                    const diffBadge =
                      prob.difficulty === 'Easy'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : prob.difficulty === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';

                    return (
                      <tr key={prob.id} className="hover:bg-[#FAF7FD] transition-colors">
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`checkbox-dsa-${prob.id}`}
                            onClick={() => handleToggleSolved(prob, 'dsa')}
                            disabled={savingProgressId === prob.id}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isSolved
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-[#C4B3D8] hover:border-[#542477] bg-white'
                            }`}
                            title={isSolved ? 'Mark as Not Solved' : 'Mark as Solved'}
                          >
                            {isSolved && <Check size={12} strokeWidth={3} />}
                          </button>
                        </td>

                        {/* Title */}
                        <td className="py-3 px-4">
                          <div className={`font-bold text-xs ${isSolved ? 'line-through text-[#8A7A9E]' : 'text-[#27113D]'}`}>
                            {prob.title}
                          </div>
                          {prog.last_practiced_at && (
                            <div className="text-[10px] text-[#8A7A9E] mt-0.5">
                              Practiced: {formatDate(prog.last_practiced_at)}
                            </div>
                          )}
                        </td>

                        {/* Topic */}
                        <td className="py-3 px-4 text-[#69567E] font-medium">
                          {prob.topic}
                        </td>

                        {/* Difficulty */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${diffBadge}`}>
                            {prob.difficulty}
                          </span>
                        </td>

                        {/* External Links */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {prob.striverUrl && (
                              <a
                                href={prob.striverUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#542477] hover:underline"
                              >
                                <span>Striver/TUF</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                            <span className="text-[#D8CCE6]">|</span>
                            {prob.leetcodeUrl ? (
                              <a
                                href={prob.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                              >
                                <span>LeetCode</span>
                                <ExternalLink size={11} />
                              </a>
                            ) : (
                              <a
                                href={LEETCODE_BASE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8A7A9E] hover:underline"
                              >
                                <span>Search LeetCode</span>
                                <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* State Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={prog.status || 'Not Started'}
                            onChange={(e) => handleProgressStatusChange(prob, e.target.value, 'dsa')}
                            disabled={savingProgressId === prob.id}
                            className="px-2.5 py-1 rounded-lg border border-[#E4D5F3] bg-white text-[11px] font-bold text-[#27113D] focus:outline-none focus:border-[#542477] cursor-pointer"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Solved">Solved</option>
                            <option value="Revision">Revision</option>
                          </select>
                        </td>

                        {/* Notes */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openNotesModal(prob, 'dsa')}
                            className={`p-1.5 rounded-lg border transition-all ${
                              prog.notes
                                ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                                : 'border-[#E4D5F3] text-[#8A7A9E] hover:text-[#542477] hover:bg-[#FAF7FD]'
                            }`}
                            title={prog.notes ? `Note: ${prog.notes}` : 'Add note'}
                          >
                            <StickyNote size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: Aptitude Practice (IndiaBIX)                                */}
        {/* ------------------------------------------------------------------ */}
        {activePracticeTab === 'aptitude' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="p-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#542477]">Official Resource:</span>
                <span className="text-[#8A7A9E]">IndiaBIX Aptitude & Reasoning Directory</span>
              </div>
              <a
                href={INDIABIX_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#542477] rounded-lg font-bold transition-colors self-start sm:self-auto"
              >
                <span>IndiaBIX Portal</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {['All', 'Quantitative Aptitude', 'Data Interpretation', 'Reasoning', 'Verbal Ability'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setAptitudeCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    aptitudeCategoryFilter === cat
                      ? 'bg-[#542477] text-white shadow-sm'
                      : 'bg-[#FAF7FD] text-[#69567E] hover:bg-[#F3E9FF] hover:text-[#542477] border border-[#E4D5F3]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Aptitude Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAptitudeTopics.map((topic) => {
                const prog = learningProgressMap[topic.id] || {};
                const isCompleted = prog.status === 'Completed' || prog.status === 'Solved';

                return (
                  <div
                    key={topic.id}
                    className="p-4 rounded-xl border border-[#E4D5F3] bg-white hover:border-[#542477] transition-all shadow-[0_2px_8px_rgba(84,36,119,0.02)] flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#542477] uppercase tracking-wider bg-[#F3E9FF] px-2 py-0.5 rounded-full">
                          {topic.category}
                        </span>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check size={10} /> Completed
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading font-bold text-sm text-[#27113D] mt-2">
                        {topic.title}
                      </h4>
                      <p className="text-[11px] text-[#8A7A9E] mt-1 line-clamp-2">
                        {topic.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#F3E9FF]">
                      <div className="flex items-center justify-between gap-2">
                        <a
                          href={topic.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#542477] hover:underline"
                        >
                          <span>Practice on IndiaBIX</span>
                          <ExternalLink size={11} />
                        </a>
                        <button
                          onClick={() => openNotesModal(topic, 'aptitude')}
                          className={`p-1.5 rounded-lg border transition-all ${
                            prog.notes
                              ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                              : 'border-[#E4D5F3] text-[#8A7A9E] hover:text-[#542477]'
                          }`}
                          title={prog.notes ? `Note: ${prog.notes}` : 'Add note'}
                        >
                          <StickyNote size={13} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={prog.status || 'Not Started'}
                          onChange={(e) => handleProgressStatusChange(topic, e.target.value, 'aptitude')}
                          disabled={savingProgressId === topic.id}
                          className="w-full px-2.5 py-1 rounded-lg border border-[#E4D5F3] bg-[#FAF7FD] text-[11px] font-bold text-[#27113D] focus:outline-none focus:border-[#542477] cursor-pointer"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Revision">Revision</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: Programming Languages (GeeksforGeeks & W3Schools)           */}
        {/* ------------------------------------------------------------------ */}
        {activePracticeTab === 'programming' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="p-3.5 bg-[#FAF7FD] border border-[#E4D5F3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#542477]">Official Directories:</span>
                <span className="text-[#8A7A9E]">GeeksforGeeks and W3Schools Tutorials</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={GFG_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#542477] rounded-lg font-bold transition-colors"
                >
                  <span>GeeksforGeeks</span>
                  <ExternalLink size={12} />
                </a>
                <a
                  href={W3SCHOOLS_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#E4D5F3] hover:border-[#542477] text-[#542477] rounded-lg font-bold transition-colors"
                >
                  <span>W3Schools</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Language Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {PROGRAMMING_LANGUAGES.map((langObj) => (
                <button
                  key={langObj.id}
                  onClick={() => setSelectedProgLanguage(langObj.language)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedProgLanguage === langObj.language
                      ? 'bg-[#542477] text-white shadow-sm'
                      : 'bg-[#FAF7FD] text-[#69567E] hover:bg-[#F3E9FF] hover:text-[#542477] border border-[#E4D5F3]'
                  }`}
                >
                  {langObj.language}
                </button>
              ))}
            </div>

            {/* Topic Rows */}
            <div className="overflow-x-auto rounded-xl border border-[#E4D5F3]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7FD] border-b border-[#E4D5F3] text-[#8A7A9E] uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-2.5 px-4">Topic Name</th>
                    <th className="py-2.5 px-4">Official Tutorials</th>
                    <th className="py-2.5 px-4">Progress Status</th>
                    <th className="py-2.5 px-4 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E9FF]">
                  {activeProgLanguageObj.topics.map((topic) => {
                    const prog = learningProgressMap[topic.id] || {};
                    const isCompleted = prog.status === 'Completed' || prog.status === 'Solved';

                    return (
                      <tr key={topic.id} className="hover:bg-[#FAF7FD] transition-colors">
                        {/* Topic Title */}
                        <td className="py-3 px-4">
                          <div className={`font-bold text-xs ${isCompleted ? 'text-[#8A7A9E] line-through' : 'text-[#27113D]'}`}>
                            {topic.title}
                          </div>
                          {prog.last_practiced_at && (
                            <div className="text-[10px] text-[#8A7A9E] mt-0.5">
                              Practiced: {formatDate(prog.last_practiced_at)}
                            </div>
                          )}
                        </td>

                        {/* Verified Tutorials */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={topic.gfgUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#542477] hover:underline"
                            >
                              <span>GeeksforGeeks</span>
                              <ExternalLink size={11} />
                            </a>
                            <span className="text-[#D8CCE6]">|</span>
                            <a
                              href={topic.w3Url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                            >
                              <span>W3Schools</span>
                              <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={prog.status || 'Not Started'}
                            onChange={(e) => handleProgressStatusChange(topic, e.target.value, 'programming')}
                            disabled={savingProgressId === topic.id}
                            className="px-2.5 py-1 rounded-lg border border-[#E4D5F3] bg-white text-[11px] font-bold text-[#27113D] focus:outline-none focus:border-[#542477] cursor-pointer"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Revision">Revision</option>
                          </select>
                        </td>

                        {/* Notes */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openNotesModal(topic, 'programming')}
                            className={`p-1.5 rounded-lg border transition-all ${
                              prog.notes
                                ? 'bg-[#F3E9FF] border-[#542477] text-[#542477]'
                                : 'border-[#E4D5F3] text-[#8A7A9E] hover:text-[#542477]'
                            }`}
                            title={prog.notes ? `Note: ${prog.notes}` : 'Add note'}
                          >
                            <StickyNote size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: ADD OR EDIT SKILL                                           */}
      {/* ==================================================================== */}
      {(isAddModalOpen || editingSkill) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] w-full max-w-lg shadow-[0_8px_32px_rgba(84,36,119,0.18)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E4D5F3] flex items-center justify-between bg-[#FAF7FD]">
              <h3 className="font-heading font-bold text-base text-[#27113D]">
                {editingSkill ? 'Edit Skill' : 'Add New Skill'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSkill(null);
                }}
                className="text-[#8A7A9E] hover:text-[#27113D] p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSkill} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Skill Name */}
              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1">
                  Skill Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-form-skill-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Python, React, PostgreSQL, Docker"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-medium text-[#27113D] focus:outline-none focus:border-[#542477] focus:ring-1 focus:ring-[#542477]"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1">
                  Category
                </label>
                <select
                  id="select-form-skill-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-medium text-[#27113D] focus:outline-none focus:border-[#542477] cursor-pointer"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skill Levels: Current & Target Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#27113D] mb-1.5">
                    Current Skill Level
                  </label>
                  <select
                    id="select-form-current-level"
                    value={formCurrentLevel}
                    onChange={(e) => setFormCurrentLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] bg-white cursor-pointer shadow-xs"
                  >
                    {SKILL_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#27113D] mb-1.5">
                    Target Skill Level
                  </label>
                  <select
                    id="select-form-target-level"
                    value={formTargetLevel}
                    onChange={(e) => setFormTargetLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-semibold text-[#27113D] focus:outline-none focus:border-[#542477] bg-white cursor-pointer shadow-xs"
                  >
                    {SKILL_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#F3E9FF]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingSkill(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E4D5F3] text-xs font-bold text-[#69567E] hover:bg-[#FAF7FD]"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-skill-form"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#542477] hover:bg-[#431B60] text-white rounded-xl text-xs font-bold tracking-wide shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingSkill ? 'Update Skill' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: DELETE CONFIRMATION                                         */}
      {/* ==================================================================== */}
      {deletingSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-heading font-bold text-base text-[#27113D]">
                Delete "{deletingSkill.name}"?
              </h3>
              <p className="text-xs text-[#8A7A9E] mt-1">
                Are you sure you want to remove this skill record? This action will update your skill metrics immediately.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSkill(null)}
                className="px-4 py-2 rounded-xl border border-[#E4D5F3] text-xs font-bold text-[#69567E] hover:bg-[#FAF7FD]"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-skill"
                type="button"
                onClick={handleDeleteSkill}
                disabled={formSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {formSubmitting ? 'Deleting...' : 'Delete Skill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: TARGET ROLE UPDATE                                          */}
      {/* ==================================================================== */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E4D5F3] flex items-center justify-between bg-[#FAF7FD]">
              <h3 className="font-heading font-bold text-base text-[#27113D]">
                Update Target Role
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-[#8A7A9E] hover:text-[#27113D]"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateTargetRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#27113D] mb-1">
                  Target Career Role
                </label>
                <input
                  id="input-target-role"
                  type="text"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  placeholder="e.g. Software Engineer, Backend Developer, Data Analyst"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4D5F3] text-xs font-medium text-[#27113D] focus:outline-none focus:border-[#542477]"
                  required
                />
                <p className="text-[11px] text-[#8A7A9E] mt-1.5">
                  Synchronizes with your CareerTwin profile and customizes skill priorities.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F3E9FF]">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E4D5F3] text-xs font-bold text-[#69567E] hover:bg-[#FAF7FD]"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-target-role"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#542477] hover:bg-[#431B60] text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: PERSONAL PRACTICE NOTES                                     */}
      {/* ==================================================================== */}
      {activeNotesItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#E4D5F3] w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E4D5F3] flex items-center justify-between bg-[#FAF7FD]">
              <div>
                <h3 className="font-heading font-bold text-sm text-[#27113D]">
                  Notes: {activeNotesItem.title}
                </h3>
                <span className="text-[10px] text-[#8A7A9E] font-medium">
                  {activeNotesItem.topic}
                </span>
              </div>
              <button
                onClick={() => setActiveNotesItem(null)}
                className="text-[#8A7A9E] hover:text-[#27113D]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                id="textarea-notes"
                rows={4}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Write your approach, time complexity, formula, or key learning takeaways..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#E4D5F3] text-xs font-medium text-[#27113D] focus:outline-none focus:border-[#542477] resize-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F3E9FF]">
                <button
                  type="button"
                  onClick={() => setActiveNotesItem(null)}
                  className="px-4 py-2 rounded-xl border border-[#E4D5F3] text-xs font-bold text-[#69567E] hover:bg-[#FAF7FD]"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-notes"
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-5 py-2 bg-[#542477] hover:bg-[#431B60] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
