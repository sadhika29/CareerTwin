import { normalizeJobDescription, normalizeJobObject, decodeHtmlEntities } from './src/utils/jobUtils.js';

// Test 1: Full HTML with headings, strong, ul, li, p
const html1 = '<h3><strong>Key Responsibilities:</strong></h3><ul><li><p>Assist in designing and developing full-stack web applications using the MERN stack.</p></li><li><p>Work on both frontend and backend components, ensuring seamless integration.</p></li><li><p>Create and maintain scalable web applications.</p></li></ul>';
const res1 = normalizeJobDescription(html1);
console.log('--- Test 1 (Full HTML structure) ---');
console.log(res1);
if (res1.includes('<') || res1.includes('>')) throw new Error('Tags remain in Test 1');
if (!res1.includes('Key Responsibilities:')) throw new Error('Missing heading in Test 1');
if (!res1.includes('• Assist in designing and developing full-stack web applications')) throw new Error('Missing bullet 1 in Test 1');
if (!res1.includes('• Work on both frontend and backend components')) throw new Error('Missing bullet 2 in Test 1');
if (!res1.includes('• Create and maintain scalable web applications.')) throw new Error('Missing bullet 3 in Test 1');

// Test 2: Entities & Inline formatting
const html2 = '<p>Build <strong>scalable APIs</strong> &amp; microservices &nbsp; with &lt;100ms&gt; latency.</p>';
const res2 = normalizeJobDescription(html2);
console.log('--- Test 2 (HTML Entities) ---');
console.log(res2);
if (res2 !== 'Build scalable APIs & microservices with <100ms> latency.') {
  throw new Error(`Test 2 failed: got "${res2}"`);
}

// Test 3: Plain text preserved
const plain = 'Key engineering role responsible for scalable APIs.\n\nRequired skills:\n• Python\n• React';
const res3 = normalizeJobDescription(plain);
console.log('--- Test 3 (Plain text) ---');
console.log(res3);
if (res3 !== plain) throw new Error('Plain text altered in Test 3');

// Test 4: Empty & malformed inputs
if (normalizeJobDescription('') !== '') throw new Error('Empty string failed');
if (normalizeJobDescription(null) !== '') throw new Error('Null failed');
if (normalizeJobDescription(undefined) !== '') throw new Error('Undefined failed');
if (normalizeJobDescription('   ') !== '') throw new Error('Whitespace only failed');

// Test 5: Security / Script & Style tags
const malicious = '<p>Safe description.</p><script>alert("xss");</script><style>body {display:none;}</style><iframe src="javascript:alert(1)"></iframe>';
const resXss = normalizeJobDescription(malicious);
console.log('--- Test 5 (Security) ---');
console.log(resXss);
if (resXss !== 'Safe description.') throw new Error(`Security failed, got: "${resXss}"`);

// Test 6: Job object normalization
const jobObj = {
  job_id: 'job_123',
  title: 'Full Stack Engineer',
  description: '<h3>Overview</h3><p>Fast-paced environment &amp; modern tools.</p>',
  responsibilities: ['<p>Design <strong>scalable</strong> microservices</p>'],
  qualifications: ['Bachelor&#39;s degree in CS'],
};
const normObj = normalizeJobObject(jobObj);
console.log('--- Test 6 (Job Object) ---');
console.log(normObj);
if (normObj.description !== 'Overview\n\nFast-paced environment & modern tools.') throw new Error('Object description normalization failed');
if (normObj.responsibilities[0] !== 'Design scalable microservices') throw new Error('Object responsibilities normalization failed');
if (normObj.qualifications[0] !== "Bachelor's degree in CS") throw new Error('Object qualifications normalization failed');

console.log('\n[PASS] All 6 Frontend Job Description Normalization Tests Passed!');

