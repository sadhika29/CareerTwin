import test from 'node:test';
import assert from 'node:assert/strict';
import { getSkillLevel, mapLegacyProficiency, SKILL_LEVELS, SKILL_LEVEL_RANK } from './proficiency.js';

test('legacy percentages map to documented levels at band boundaries', () => {
  assert.deepEqual([0, 24.9, 25, 49.9, 50, 74.9, 75, 100].map(mapLegacyProficiency), [
    'Beginner', 'Beginner', 'Intermediate', 'Intermediate', 'Advanced', 'Advanced', 'Expert', 'Expert',
  ]);
  assert.equal(mapLegacyProficiency(101), '');
  assert.equal(mapLegacyProficiency(undefined), '');
});

test('saved skill levels take precedence over legacy fields and rank in order', () => {
  assert.equal(getSkillLevel({ current_level: 'Intermediate', proficiency: 90 }, 'current_level'), 'Intermediate');
  assert.equal(getSkillLevel({ target_proficiency: 80 }, 'target_level'), 'Expert');
  assert.deepEqual([...SKILL_LEVELS].sort((a, b) => SKILL_LEVEL_RANK[a] - SKILL_LEVEL_RANK[b]), SKILL_LEVELS);
});
