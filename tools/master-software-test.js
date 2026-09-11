const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
let passed = 0, failed = 0;
function check(name, ok, detail='') {
  if (ok) { console.log(`PASS  ${name}${detail ? ' — '+detail : ''}`); passed++; }
  else { console.log(`FAIL  ${name}${detail ? ' — '+detail : ''}`); failed++; }
}
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function syntax(rel) {
  try { execFileSync(process.execPath, ['--check', path.join(root, rel)], {stdio:'ignore'}); return true; }
  catch { return false; }
}

console.log('\n=== 10th PASS MASTER — STAGE 10 STEP 30 MASTER SOFTWARE TEST ===\n');

for (const f of ['frontend/index.html','frontend/script.js','frontend/admin.html','frontend/admin.js','backend/server.js'])
  check(`Required file: ${f}`, exists(f));
for (const f of ['frontend/script.js','frontend/admin.js','backend/server.js'])
  check(`JavaScript syntax: ${f}`, syntax(f));

const index = read('frontend/index.html');
const script = read('frontend/script.js');
const admin = read('frontend/admin.html');
const adminjs = read('frontend/admin.js');
const server = read('backend/server.js');

check('Student page loads script.js', /script\.js/.test(index));
check('Admin page loads admin.js', /admin\.js/.test(admin));
check('30-Day PASS Challenge UI exists', /passChallengeButton|PASS Challenge|30-Day/i.test(index) && /challenge/i.test(script));
check('Smart Revision feature exists', /smart-study-plan|Smart Revision/i.test(server) && /Smart Revision|smart-study-plan/i.test(script));
check('Mock Test feature exists', /mock/i.test(server) && /mock/i.test(script));
check('Automatic MCQ fields exist', /option_a|correct_option|mcq_explanation/.test(server));
check('Exam analysis / weak topics exists', /exam-analysis|weak/i.test(server) && /Exam Analysis|weak/i.test(script));
check('Chapter-wise student progress exists', /student_status|studentId/.test(server));
check('Student login/logout exists', /find\/mobile|logoutStudent|studentMobile/.test(server+'\n'+script));
check('Admin question management exists', /ADD QUESTION|Manage Questions|question/i.test(admin) && /question/i.test(adminjs));

// Detect accidental local-file absolute references in the frontend.
const absWin = /(file:\/\/\/|[A-Za-z]:\\\\Users\\\\)/i.test(index+'\n'+script+'\n'+admin+'\n'+adminjs);
check('No obvious Windows file:// dependency in frontend', !absWin);

console.log('\n--- RESULT ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(failed === 0 ? 'STATIC TEST RESULT: PASS' : 'STATIC TEST RESULT: REVIEW REQUIRED');
console.log('\nNOTE: This test checks files and feature markers only. It does NOT prove PostgreSQL connectivity or browser runtime behavior. Follow MASTER_SOFTWARE_TEST_GUIDE.txt for live testing.\n');
process.exitCode = failed ? 1 : 0;
