export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const SKILL_LEVEL_RANK = Object.freeze({
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
  Expert: 3,
});

/**
 * Legacy percentage migration bands: [0,25) Beginner, [25,50) Intermediate,
 * [50,75) Advanced, and [75,100] Expert. This is a deterministic mapping;
 * original numeric values are retained in Firestore as legacy fields.
 */
export function mapLegacyProficiency(value) {
  if (value === null || value === undefined || value === '') return '';
  const percentage = Number(value);
  if (!Number.isFinite(percentage)) return '';
  if (percentage < 25) return 'Beginner';
  if (percentage < 50) return 'Intermediate';
  if (percentage < 75) return 'Advanced';
  if (percentage <= 100) return 'Expert';
  return '';
}

export function getSkillLevel(skill, key) {
  const currentKey = key === 'target_level' ? 'target_level' : 'current_level';
  const legacyKey = currentKey === 'target_level' ? 'target_proficiency' : 'proficiency';
  const value = skill?.[currentKey];
  return SKILL_LEVELS.includes(value) ? value : mapLegacyProficiency(skill?.[legacyKey]);
}
