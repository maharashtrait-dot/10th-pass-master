/* STEP 106 — PYQ Library catalog */
(function(){
const CATALOG=[{"key": "English", "label": "English (First Language)"}, {"key": "Mathematics Part I", "label": "Mathematics 1 - Algebra"}, {"key": "Mathematics Part II", "label": "Mathematics 2 - Geometry"}, {"key": "Science & Technology Part I", "label": "Science and Technology 1"}, {"key": "Science & Technology Part II", "label": "Science and Technology 2"}, {"key": "History & Political Science", "label": "History and Political Science"}, {"key": "Geography", "label": "Geography"}, {"key": "Hindi", "label": "Hindi (Second/Third Language)"}, {"key": "Marathi", "label": "Marathi / Aksharbharati"}, {"key": "Sanskrit", "label": "Sanskrit / Sanskrit Composite"}];
const YEARS=[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];
const SOURCE="https://www.shaalaa.com/search-question-papers/maharashtra-state-board-ssc-marathi-medium-10th-standard_1438";
const OFFICIAL="https://www.mahahsscboard.in/en/questionPaper";
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
window.renderStep106PYQLibrary=function(){
 const c=document.getElementById('subjectsContainer'); if(!c)return;
 c.innerHTML=`<button id="s106back">← Back to Subjects</button>
 <h2>📚 PYQ LIBRARY — All Subjects & Years</h2>
 <p><strong>2026 → 2017</strong> • Subject-wise and year-wise paper catalog</p>
 <div class="question-box"><p>Full paper PDFs/third-party solution PDFs are not redistributed inside the app. Use the source/official buttons to open the paper and available solutions. Existing verified in-app PYQs remain available for practice.</p>
 <button id="s106src">📖 Open Papers + Solutions Source</button>
 <button id="s106off">🏛️ Official Board Portal</button></div>
 <div class="question-box"><label>📚 Subject: </label><select id="s106sub"><option value="">All Subjects</option>${CATALOG.map(s=>`<option value="${esc(s.key)}">${esc(s.label)}</option>`).join('')}</select>
 <label> 📅 Year: </label><select id="s106year"><option value="">All Years</option>${YEARS.map(y=>`<option>${y}</option>`).join('')}</select></div>
 <div id="s106results"></div>`;
 document.getElementById('s106back').onclick=()=>window.loadSubjects?.();
 document.getElementById('s106src').onclick=()=>window.open(SOURCE,'_blank');
 document.getElementById('s106off').onclick=()=>window.open(OFFICIAL,'_blank');
 function render(){
  const s=document.getElementById('s106sub').value,y=document.getElementById('s106year').value;
  const rows=[]; CATALOG.forEach(sub=>{if(s&&sub.key!==s)return; YEARS.forEach(year=>{if(y&&String(year)!==String(y))return;rows.push({sub,year});});});
  document.getElementById('s106results').innerHTML=rows.map(r=>`<div class="question-box"><h3>📘 ${esc(r.sub.label)}</h3><p>📅 <strong>${r.year}</strong> • Maharashtra SSC Class 10</p><p>📝 Question Paper + Solution: source available</p><button class="s106src">📖 Open Paper / Solution Source</button><button class="s106off">🏛️ Official Board Portal</button></div>`).join('');
 }
 document.getElementById('s106sub').onchange=render; document.getElementById('s106year').onchange=render;
 c.addEventListener('click',e=>{const b=e.target.closest('.s106src,.s106off');if(!b)return;window.open(b.classList.contains('s106src')?SOURCE:OFFICIAL,'_blank');});
 render();
};
})();