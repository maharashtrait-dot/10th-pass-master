
/* STEP 101 — English Kumarbharati 5-Year PYQ Master
   Uses verified board-paper sources but stores concise paraphrases, not full copyrighted paper text.
*/
(function(){
'use strict';
let english5=null;

async function loadEnglish5PYQ(){
  const container=document.getElementById('subjectsContainer');
  if(!container)return;
  try{
    if(!english5){
      const r=await fetch('english-5yr-pyq-master.json?v=101englishpyq20260921',{cache:'no-store'});
      if(!r.ok)throw new Error('English 5-year PYQ data not found');
      english5=await r.json();
    }
    const years=[2026,2025,2024,2023,2022];
    container.innerHTML=`
      <button id="backFromEnglish5PYQ">← Back</button>
      <div class="medium-badge">🇬🇧 English Medium • English Kumarbharati</div>
      <h2>🏆 PYQ MASTER — English Kumarbharati</h2>
      <div class="question-box">
        <h3>📚 Last 5 Board Years: 2026 → 2022</h3>
        <p>50 verified PYQ-based revision questions with answers, grouped year-wise.</p>
        <p><strong>Important:</strong> These are concise paraphrases of verified board-paper questions. They are not presented as verbatim copies of the full papers.</p>
        <div class="pyq-year-buttons">
          ${years.map(y=>`<button class="english-pyq-year" data-year="${y}">📅 ${y}</button>`).join('')}
          <button class="english-pyq-year" data-year="all">📚 All 5 Years</button>
        </div>
      </div>
      <div class="question-box">
        <strong>🎯 What to study first</strong>
        <ul>
          <li>Grammar transformations and sentence work</li>
          <li>Textual passage activities</li>
          <li>Poetry appreciation, figures of speech and rhyme scheme</li>
          <li>Letter writing and information transfer</li>
          <li>Creative writing formats</li>
        </ul>
      </div>
      <div id="english5PYQList"></div>`;
    document.getElementById('backFromEnglish5PYQ').onclick=()=>window.loadSubjects?.();
    document.querySelectorAll('.english-pyq-year').forEach(b=>b.onclick=()=>renderEnglish5(b.dataset.year));
    renderEnglish5('all');
  }catch(e){
    container.innerHTML=`<button onclick="loadSubjects()">← Back</button><h2>🏆 English PYQ Master</h2><p>❌ ${e.message}</p>`;
  }
}

function renderEnglish5(year){
  const box=document.getElementById('english5PYQList'); if(!box)return;
  const arr=year==='all'?english5.items:english5.items.filter(x=>String(x.year)===String(year));
  const grouped={};
  arr.forEach(x=>(grouped[x.year]??=[]).push(x));
  box.innerHTML=Object.keys(grouped).sort((a,b)=>b-a).map(y=>`
    <div class="question-box">
      <h3>📅 ${y} Board PYQ Master</h3>
      ${grouped[y].map((q,i)=>`
        <div class="question-box english5-item">
          <div><span class="pyq-badge">🟢 VERIFIED PYQ-BASED</span> <span class="pyq-section">${q.section}</span></div>
          <p><strong>${i+1}. ${q.chapter}</strong> ${q.marks?`<span class="marks-badge">${q.marks} Marks</span>`:''}</p>
          <p>${q.q}</p>
          <button class="english5-answer-btn">👁️ Show Answer</button>
          <div class="english5-answer" style="display:none">
            <p><strong>✅ Answer:</strong> ${q.a}</p>
            <p><strong>🧠 Keywords:</strong> ${keywordsForEnglish5(q)}</p>
            <p><small>Source year: ${q.year} • Verified board-paper reference</small></p>
          </div>
        </div>`).join('')}
    </div>`).join('');
  box.querySelectorAll('.english5-answer-btn').forEach(btn=>{
    btn.onclick=()=>{const a=btn.nextElementSibling;a.style.display=a.style.display==='none'?'block':'none';};
  });
}
function keywordsForEnglish5(q){
  const s=(q.q+' '+q.chapter).toLowerCase();
  if(s.includes('infinitive'))return 'infinitive, to + verb';
  if(s.includes('rhyme'))return 'rhyme scheme, figures of speech, theme';
  if(s.includes('letter'))return 'format, subject, salutation, body, closing';
  if(s.includes('flowchart')||s.includes('table'))return 'sequence, headings, key points';
  if(s.includes('metaphor'))return 'comparison, metaphor';
  if(s.includes('modal'))return 'modal auxiliary, function';
  if(s.includes('punctuat'))return 'capital letter, punctuation mark';
  return 'key point, complete sentence, board format';
}

function installEnglish5(){
  const b=document.getElementById('pyqMasterButton');
  if(!b)return;
  b.onclick=(e)=>{e.preventDefault();loadEnglish5PYQ();};
  // Also expose it for menu handlers.
  window.loadEnglish5PYQ=loadEnglish5PYQ;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installEnglish5);else installEnglish5();
})();
