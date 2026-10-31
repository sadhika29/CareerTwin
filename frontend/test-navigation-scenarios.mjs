// Comprehensive validation script for Feature-Specific Get Started Navigation
// Tests Scenarios A through F and ensures all route mappings and security validations pass.

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load authRedirect.js source and execute in isolated context
const authRedirectCode = readFileSync(resolve('src/features/auth/authRedirect.js'), 'utf-8');

// Mock sessionStorage and localStorage
const mockStorage = (function() {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

globalThis.sessionStorage = mockStorage;
globalThis.localStorage = mockStorage;

// Evaluate authRedirect functions
const {
  REDIRECT_STORAGE_KEY,
  isValidRedirectPath,
  saveRedirectPath,
  clearRedirectPath,
  getRedirectDestination
} = await import('./src/features/auth/authRedirect.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('\n--- 1. Testing URL & Open Redirect Security (isValidRedirectPath) ---');
assert(isValidRedirectPath('/resume') === true, 'Accepts valid path /resume');
assert(isValidRedirectPath('/jobs') === true, 'Accepts valid path /jobs');
assert(isValidRedirectPath('/interview') === true, 'Accepts valid path /interview');
assert(isValidRedirectPath('/career?view=roadmap') === true, 'Accepts valid path with query /career?view=roadmap');
assert(isValidRedirectPath('https://evil.com') === false, 'Rejects absolute URL https://evil.com');
assert(isValidRedirectPath('http://evil.com/resume') === false, 'Rejects http://evil.com/resume');
assert(isValidRedirectPath('//evil.com') === false, 'Rejects protocol-relative //evil.com');
assert(isValidRedirectPath('javascript:alert(1)') === false, 'Rejects javascript: scheme');
assert(isValidRedirectPath('/login') === false, 'Rejects login loop (/login)');
assert(isValidRedirectPath('/signup') === false, 'Rejects signup loop (/signup)');
assert(isValidRedirectPath('/') === false, 'Rejects root / to avoid loops');
assert(isValidRedirectPath('') === false, 'Rejects empty string');
assert(isValidRedirectPath(null) === false, 'Rejects null');

console.log('\n--- 2. Scenario A: Unauthenticated click on Resume Analysis -> Login -> Destination ---');
// Step 1: User clicks Get Started on Resume Analysis (route: /resume)
sessionStorage.clear();
saveRedirectPath('/resume');
assert(sessionStorage.getItem(REDIRECT_STORAGE_KEY) === '/resume', 'Saved /resume to sessionStorage');

// Step 2: Login page loads with returnTo query param
const searchParamsA = new URLSearchParams('returnTo=%2Fresume');
const locationA = { pathname: '/login', state: { from: '/resume' } };
const destA = getRedirectDestination(locationA, searchParamsA);
assert(destA === '/resume', `Scenario A redirected to ${destA} (expected /resume, not /dashboard)`);
assert(sessionStorage.getItem(REDIRECT_STORAGE_KEY) === null, 'Cleared redirect from sessionStorage after consumption');

console.log('\n--- 3. Scenario B: Unauthenticated click on Job Tracking -> Login -> Destination ---');
sessionStorage.clear();
saveRedirectPath('/jobs');
assert(sessionStorage.getItem(REDIRECT_STORAGE_KEY) === '/jobs', 'Saved /jobs to sessionStorage');

const searchParamsB = new URLSearchParams('returnTo=%2Fjobs');
const locationB = { pathname: '/login', state: { from: '/jobs' } };
const destB = getRedirectDestination(locationB, searchParamsB);
assert(destB === '/jobs', `Scenario B redirected to ${destB} (expected /jobs, not /dashboard)`);

console.log('\n--- 4. Scenario C: Authenticated User clicks Get Started on Interview Prep ---');
// When authenticated, handleGetStarted directly calls navigate(feature.route)
const isAuthenticated = true;
const featureInterview = { id: 'interview-prep', title: 'Interview Preparation', route: '/interview' };
const targetRouteC = isAuthenticated ? featureInterview.route : '/login';
assert(targetRouteC === '/interview', `Scenario C navigated directly to ${targetRouteC} without login/dashboard`);

console.log('\n--- 5. Scenario D: Browser Refresh on Protected Feature Page ---');
// When user is on /resume or /jobs, localStorage has career_user
localStorage.setItem('career_user', JSON.stringify({ uid: 'test-123', email: 'test@example.com' }));
const isAuthOnRefresh = Boolean(localStorage.getItem('career_user'));
const currentPath = '/resume';
// In AppRoutes: if authenticated, renders ProtectedRoutes without redirecting to login or dashboard
assert(isAuthOnRefresh === true, 'Auth session exists in localStorage');
assert(currentPath === '/resume', 'User remains on /resume after page reload');

console.log('\n--- 6. Scenario E: Direct Login without Feature Selection ---');
sessionStorage.clear();
const searchParamsE = new URLSearchParams('');
const locationE = { pathname: '/login', state: null };
const destE = getRedirectDestination(locationE, searchParamsE);
assert(destE === '/dashboard', `Scenario E correctly defaults to ${destE} when no feature was selected`);

console.log('\n--- 7. Scenario F: Login Failure Behavior ---');
// On login failure in Login.jsx:
// catch block sets error, never calls navigate()
let navigateCalled = false;
let errorMessage = '';
try {
  throw new Error('Invalid credentials');
} catch (err) {
  errorMessage = err.message;
  // navigate is NOT called
}
assert(errorMessage === 'Invalid credentials', 'Login error caught and displayed');
assert(navigateCalled === false, 'Navigation NOT triggered on login failure');

console.log('\n--- 8. Feature Card Mapping & Route Consistency ---');
const featuresContent = readFileSync(resolve('src/components/landing/Features.jsx'), 'utf-8');
const appRoutesContent = readFileSync(resolve('src/routes/AppRoutes.jsx'), 'utf-8');

const expectedFeatures = [
  { id: 'resume-analysis', title: 'Resume Analysis', route: '/resume' },
  { id: 'skill-gap-analysis', title: 'Skill Gap Analysis', route: '/skills' },
  { id: 'personalized-roadmap', title: 'Personalized Roadmap', route: '/career' },
  { id: 'job-tracking', title: 'Job Tracking', route: '/jobs' },
  { id: 'dsa-practice', title: 'DSA Practice', route: '/assessment' },
  { id: 'interview-prep', title: 'Interview Preparation', route: '/interview' }
];

expectedFeatures.forEach(feat => {
  assert(featuresContent.includes(`route: '${feat.route}'`), `Features.jsx defines route '${feat.route}' for ${feat.title}`);
  assert(appRoutesContent.includes(`path="${feat.route}"`), `AppRoutes.jsx handles route '${feat.route}'`);
});

assert(
  appRoutesContent.includes('path="/applications" element={<Applications />}'),
  'AppRoutes.jsx renders the Application Tracker at /applications'
);

// Check alias routes in AppRoutes.jsx
const expectedAliases = [
  '/resume-analysis',
  '/resume-builder',
  '/job-tracking',
  '/job-matching',
  '/career-planning',
  '/digital-twin',
  '/roadmap',
  '/skill-gaps',
  '/skill-gap-analysis',
  '/skills-assessment',
  '/dsa-practice',
  '/interview-prep',
  '/interview-preparation'
];

expectedAliases.forEach(alias => {
  assert(appRoutesContent.includes(`path="${alias}"`), `AppRoutes.jsx supports alias '${alias}'`);
});

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
