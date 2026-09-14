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
// Expose a small non-invasive button through existing menu if possible.
document.addEventListener('DOMContentLoaded',()=>{
 const candidates=[...document.querySelectorAll('button,a')];
 if(candidates.some(x=>/Smart Study Toolkit/.test(x.textContent)))return;
 const menu=document.querySelector('.student-actions');
 if(menu){const b=document.createElement('button');b.type='button';b.id='rapidStudyToolkitButton';b.textContent='🧰 Study Toolkit';b.onclick=renderToolkit;menu.appendChild(b);}
});
})();
