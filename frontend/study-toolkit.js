/* STEP 88 - Rapid Study Toolkit
   Additive only: no DB changes, no PYQ rewriting, no claims of official content.
*/
(function(){
'use strict';
const formulas={
 'Mathematics Part I':[
  ['Linear Equations','a₁x+b₁y=c₁; a₂x+b₂y=c₂','Solve simultaneously / graphically.'],
  ['Quadratic Equations','D=b²−4ac','D>0 distinct real, D=0 equal, D<0 no real roots.'],
  ['Quadratic Formula','x=(−b±√D)/(2a)','Use after identifying a,b,c.'],
  ['Arithmetic Progression','tₙ=a+(n−1)d','nth term'],['AP Sum','Sₙ=n/2[2a+(n−1)d]','sum of first n terms'],
  ['Probability','P(E)=favourable outcomes/total outcomes','0≤P(E)≤1'],
  ['Mean','Mean=Σx/n','For grouped data use the prescribed board method.'],
  ['GST','Taxable value + GST = invoice value','Use the rate given in the question.'],
  ['Statistics – Median','Median=L+[(N/2−cf)/f]h','Identify median class first.'],
  ['Statistics – Mode','Mode=L+[(f₁−f₀)/(2f₁−f₀−f₂)]h','Identify modal class first.']
 ],
 'Mathematics Part II':[
  ['Pythagoras','c²=a²+b²','For a right triangle.'],['Distance Formula','d=√[(x₂−x₁)²+(y₂−y₁)²]','Coordinate geometry'],
  ['Section Formula','P=((mx₂+nx₁)/(m+n),(my₂+ny₁)/(m+n))','Internal division'],
  ['Slope','m=(y₂−y₁)/(x₂−x₁)','Coordinate geometry'],
  ['Trigonometry','sinθ=opposite/hypotenuse; cosθ=adjacent/hypotenuse; tanθ=opposite/adjacent','Right triangle ratios'],
  ['Circle','Angle in semicircle = 90°','Use the theorem stated in the question.'],
  ['Area – Triangle','Area=½bh','Use perpendicular base and height.']
 ],
 'Science & Technology Part I':[
  ['Ohm’s Law','V=IR','I=V/R; R=V/I'],['Current','I=Q/t','Q in coulomb, t in seconds'],
  ['Power','P=VI=I²R=V²/R','Electrical power'],['Electrical Energy','E=Pt','Use seconds for joules.'],
  ['Heat','Q=mcΔT','Check units before substitution.'],['Work','W=Fd','For force along displacement.'],
  ['Kinetic Energy','K.E.=½mv²','m in kg, v in m/s'],['Potential Energy','P.E.=mgh','Use consistent SI units.'],
  ['Density','ρ=m/V','Mass divided by volume']
 ],
 'Science & Technology Part II':[
  ['Photosynthesis','CO₂ + H₂O → glucose + O₂ (in presence of light/chlorophyll)','Learn as a process diagram.'],
  ['Genetics','Phenotype depends on genotype + environment','Use Punnett square where required.'],
  ['Cell','Cell → organelle → function','Use labelled diagrams.'],
  ['Classification','Kingdom → Phylum → Class → Order → Family → Genus → Species','Learn as a hierarchy.']
 ]
};
const visualAdvice={
 'Mathematics Part I':['graph','table','formula box','probability tree','histogram/ogive','step-by-step calculation'],
 'Mathematics Part II':['geometric diagram','construction','coordinate graph','triangle diagram','circle theorem diagram','trigonometric triangle'],
 'Science & Technology Part I':['ray diagram','electric circuit','reaction equation','periodic table','energy flow','labelled diagram'],
 'Science & Technology Part II':['labelled biology diagram','process flowchart','classification tree','Punnett square','cycle diagram'],
 'Geography':['map','thematic map','bar graph','line graph','pie chart','flowchart','table'],
 'History & Political Science':['timeline','cause-effect flowchart','comparison table','process diagram','institution chart'],
 'English':['mind map','grammar table','writing format box','character/theme map','sequence chart'],
 'Marathi':['धड्याचा mind map','काव्यभावार्थ chart','व्याकरण table','लेखन format'],
 'Hindi':['पाठ mind map','व्याकरण table','भावार्थ chart','लेखन format'],
 'Sanskrit':['शब्दरूप table','धातुरूप table','विभक्ति table','संधि/समास chart','अनुवाद steps']
};
function esc(x){return String(x??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function subjectKey(s){return Object.keys(formulas).find(k=>String(s||'').toLowerCase()===k.toLowerCase())||s;}
function getGuide(q,subject){
 const s=String(subject||q?.subject_name||''); const low=(String(q?.question_text||'')+' '+String(q?.keywords||'')).toLowerCase();
 let steps=['Read the question carefully.','Underline the important facts / keywords.'];
 if(/mathematics/.test(s.toLowerCase())) steps.push('Write the correct formula/theorem.','Substitute the given values step-by-step.','Show calculation clearly.','Write the final answer with units where applicable.');
 else if(/science/.test(s.toLowerCase())) steps.push('Identify the concept/law/process.','Write the relevant formula or principle if applicable.','Draw the required labelled diagram/process.','Explain the steps in order.','Write the final conclusion.');
 else if(/geography/.test(s.toLowerCase())) steps.push('Identify the geographical concept.','Use the required map/graph/table if applicable.','Write 2–5 precise points using keywords.','End with a clear conclusion/example.');
 else steps.push('Identify the required answer format.','Use the supplied keywords.','Write points in logical order.','Check spelling/grammar and finish with the required conclusion.');
 if(/graph|map|diagram|draw|illustrat|table|chart/.test(low)) steps.splice(2,0,'Visual required: use a neat labelled graph/map/diagram/table as asked.');
 return steps;
}
function renderToolkit(){
 const c=document.getElementById('subjectsContainer'); if(!c)return;
 const names=Object.keys(formulas).concat(['Geography','History & Political Science','English','Marathi','Hindi','Sanskrit']);
 const unique=[...new Set(names)];
 c.innerHTML=`<button type="button" id="toolkitBack">← Back to Home</button><h2>🧰 Smart Study Toolkit</h2><p>Formula, answer-writing, visual-learning and exam presentation helpers. Official PYQ status is kept separate from practice content.</p>
 <div class="toolkit-grid">
 ${unique.map(s=>`<div class="toolkit-card"><h4>📚 ${esc(s)}</h4><small>${(visualAdvice[s]||['concept map','table','diagram','flowchart']).map(x=>`<span class="toolkit-chip">${esc(x)}</span>`).join('')}</small><button type="button" data-tool-sub="${esc(s)}">Open Toolkit</button></div>`).join('')}
 </div><div id="toolkitDetail"></div>`;
 document.getElementById('toolkitBack').onclick=()=>{if(typeof window.showHome==='function')window.showHome();else location.reload();};
 c.querySelectorAll('[data-tool-sub]').forEach(b=>b.onclick=()=>showSubjectToolkit(b.getAttribute('data-tool-sub')));
}
function showSubjectToolkit(s){
 const d=document.getElementById('toolkitDetail');if(!d)return;
 const f=formulas[s]||[]; const va=visualAdvice[s]||['mind map','table','diagram','flowchart'];
 d.innerHTML=`<div class="question-box"><h3>📖 ${esc(s)} — Quick Revision</h3><h4>📐 Formula / Concept Cards</h4>${f.length?f.map(x=>`<div class="solution-step"><strong>${esc(x[0])}</strong><br><code>${esc(x[1])}</code><br><small>${esc(x[2])}</small></div>`).join(''):'<p>Formula card not configured yet. Use chapter notes and question-specific answers.</p>'}<h4>🖼️ Recommended Visuals</h4><p>${va.map(x=>`<span class="toolkit-chip">${esc(x)}</span>`).join('')}</p><h4>✍️ Board Answer Structure</h4><div class="solution-guide">${getGuide({question_text:'',keywords:''},s).map((x,i)=>`<div class="solution-step"><strong>Step ${i+1}:</strong> ${esc(x)}</div>`).join('')}</div></div>`;
}
window.renderRapidStudyToolkit=renderToolkit;window.showSubjectToolkit=showSubjectToolkit;window.getRapidSolutionGuide=getGuide;
document.addEventListener('DOMContentLoaded',()=>{
 const candidates=[...document.querySelectorAll('button,a')];
 if(candidates.some(x=>/Smart Study Toolkit/.test(x.textContent)))return;
 const menu=document.querySelector('.student-actions');
 if(menu){const b=document.createElement('button');b.type='button';b.id='rapidStudyToolkitButton';b.textContent='🧰 Study Toolkit';b.onclick=renderToolkit;menu.appendChild(b);}
});
})();

/* STEP 96 — English Medium student-facing content separation + cleanup */
(function(){
'use strict';
const MAIN=new Set(['english','mathematics part i','mathematics part ii','science & technology part i','science & technology part ii','history & political science','geography']);
const name=s=>String(s?.name||'').trim();
const safe=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
function renderMenu(subjects){
 const p=document.getElementById('subjectMenuPanel');if(!p)return;
 const a=Array.isArray(subjects)?subjects:[],m=a.filter(s=>MAIN.has(name(s).toLowerCase())),l=a.filter(s=>!MAIN.has(name(s).toLowerCase())),icons=['📘','📐','📐','🔬','🧪','📜','🌍'];
 p.innerHTML=`<div class="medium-menu-heading">🇬🇧 English Medium — Main Subjects</div>${m.length?m.map((s,i)=>`<button class="subject-menu-button em-main-subject" type="button" data-subject-id="${Number(s.id)}">${icons[i]||'📚'} ${safe(name(s))}</button>`).join(''):'<p class="submenu-empty">Main subjects उपलब्ध नाहीत.</p>'}<div class="medium-menu-heading language-heading">🌐 Language Subjects — School Selected</div><small class="medium-menu-note">Marathi / Hindi / Sanskrit हे स्वतंत्र language subjects आहेत; ते English-medium main subjects नाहीत.</small>${l.length?l.map(s=>`<button class="subject-menu-button em-language-subject" type="button" data-subject-id="${Number(s.id)}">🗣️ ${safe(name(s))}</button>`).join(''):'<p class="submenu-empty">Language subjects उपलब्ध नाहीत.</p>'}<div class="medium-menu-footer">📚 Standard 10 • Maharashtra SSC</div>`;
 p.querySelectorAll('.subject-menu-button').forEach(b=>{const s=a.find(x=>Number(x.id)===Number(b.dataset.subjectId));b.onclick=()=>{if(s)window.loadChapters?.(s);window.closeMainNavigation?.();};});
}
function visible(ch,sub){
 const n=String(ch?.chapter_name||'').trim().toLowerCase(),num=String(ch?.chapter_number??'').trim();
 if(!n||n==='null'||n==='undefined'||/^(demo|test)\b/i.test(n)||/test chapter|demo english/i.test(n))return false;
 if(name(sub).toLowerCase()==='english')return /^(1\.[1-6]|2\.[1-6]|3\.[1-6]|4\.[1-6])$/.test(num);
 return true;
}
async function loadEM(sub){
 const c=document.getElementById('subjectsContainer');if(!c)return;
 c.innerHTML=`<button id="backButton">← Back to Subjects</button><div class="medium-badge">🇬🇧 English Medium • SSC Class 10</div><h2>${safe(name(sub))}</h2><p>📖 Chapters loading...</p>`;
 try{
  const api=location.hostname==='localhost'||location.hostname==='127.0.0.1'?'http://localhost:3001':location.origin;
  const r=await fetch(`${api}/api/subjects/${sub.id}/chapters?studentId=${localStorage.getItem('studentId')||''}`);
  if(!r.ok)throw Error('Chapter API error');
  const cs=(await r.json()).filter(ch=>visible(ch,sub));
  c.innerHTML=`<button id="backButton">← Back to Subjects</button><div class="medium-badge">🇬🇧 English Medium • SSC Class 10</div><h2>${safe(name(sub))}</h2><p>📖 Select a chapter to start chapter-wise practice.</p><p class="content-source-note">Development/test chapters are hidden from students.</p>`;
  if(!cs.length)c.innerHTML+='<p>Chapters will be added soon.</p>';
  cs.forEach(ch=>{
   const b=document.createElement('button');b.className='subject-card';
   const t=Number(ch.active_questions||ch.total_questions||0),k=Number(ch.known_questions||0),rv=Number(ch.revision_questions||0),pc=t?Math.round((k+rv)/t*100):0;
   b.innerHTML=`<span><strong>Chapter ${safe(ch.chapter_number)}: ${safe(ch.chapter_name)}</strong><br><small>📚 ${t} Questions &nbsp;|&nbsp; ✅ ${k} Known &nbsp;|&nbsp; 🔄 ${rv} Revision</small><br><small>📊 Chapter Progress: ${pc}%</small></span>`;
   b.onclick=()=>window.loadQuestions?.(ch,sub);c.appendChild(b);
  });
  document.getElementById('backButton').onclick=()=>window.loadSubjects?.();
 }catch(e){console.error(e);c.innerHTML='<p>Unable to load chapters.</p>';}
}
function install(){
 window.updateSubjectMenu=renderMenu;
 window.loadChapters=loadEM;
 if(!document.getElementById('step96style')){
  const s=document.createElement('style');s.id='step96style';
  s.textContent='.medium-menu-heading{font-weight:800;padding:10px 12px 6px;border-bottom:1px solid rgba(31,111,235,.18)}.language-heading{margin-top:10px}.medium-menu-note{display:block;padding:4px 12px 8px;line-height:1.35;opacity:.8}.medium-menu-footer{padding:9px 12px;font-size:.82rem;opacity:.75}.medium-badge{display:inline-block;padding:7px 12px;margin:8px 0;border-radius:999px;font-weight:700;background:rgba(31,111,235,.10)}.content-source-note{font-size:.88rem;opacity:.75}.em-main-subject{font-weight:650}.em-language-subject{font-weight:500}';
  document.head.appendChild(s);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
