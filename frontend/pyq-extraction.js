/* STEP 37 V7 - Official PYQ extraction with OCR fallback and quality gate */
(function(){
  const API_URL = window.PYQ_API_URL || 'http://localhost:3001';
  const $=id=>document.getElementById(id);
  let currentBatchId=null,currentItems=[],pdfjs=null;
  const msg=(t,ok=false)=>{const e=$('step37Message');if(e)e.textContent=(ok?'✅ ':'⚠️ ')+t;};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  async function getPdfJs(){if(pdfjs)return pdfjs;if(!window.pdfjsLib)throw Error('PDF.js could not be loaded.');pdfjs=window.pdfjsLib;if(pdfjs.GlobalWorkerOptions)pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';return pdfjs;}
  function normalizeLine(s){return String(s||'').replace(/\u0000/g,' ').replace(/[ \t]+/g,' ').trim();}
  async function extractPdfText(file){
    const lib=await getPdfJs(),data=await file.arrayBuffer(),pdf=await lib.getDocument({data}).promise;
    let text='',pages=0;
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i),tc=await page.getTextContent({disableCombineTextItems:true}),rows=[];
      for(const item of tc.items){const value=normalizeLine(item.str);if(!value)continue;const y=Number(item.transform?.[5]||0);let row=rows.find(r=>Math.abs(r.y-y)<=3);if(!row){row={y,items:[]};rows.push(row);}row.items.push(item);}
      rows.sort((a,b)=>b.y-a.y);
      const lines=rows.map(r=>r.items.sort((a,b)=>(a.transform?.[4]||0)-(b.transform?.[4]||0)).map(x=>x.str||'').join(' ')).map(normalizeLine).filter(Boolean);
      const pageText=lines.join('\n').trim();
      if(pageText)text+=`\n\n--- PAGE ${i} ---\n${pageText}`;
      if(pageText.length>20)pages++;
    }
    return {text,pdfPages:pdf.numPages,textPages:pages};
  }
  async function ensureOCR(){
    if(window.Tesseract)return window.Tesseract;
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=resolve;s.onerror=()=>reject(Error('OCR library could not be loaded. Check internet connection.'));document.head.appendChild(s);});
    return window.Tesseract;
  }
  async function ocrPdf(file){
    const lib=await getPdfJs(),data=await file.arrayBuffer(),pdf=await lib.getDocument({data}).promise,T=await ensureOCR();
    const worker=await T.createWorker('eng'); let out='',done=0;
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i),vp=page.getViewport({scale:2.2}),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);await page.render({canvasContext:ctx,viewport:vp}).promise;
      const r=await worker.recognize(canvas);out+=`\n\n--- PAGE ${i} ---\n${r.data.text||''}`;done++;msg(`OCR: page ${done}/${pdf.numPages}…`);
    }
    await worker.terminate();return {text:out,pdfPages:pdf.numPages,textPages:done};
  }
  function renderItems(items){
    currentItems=items||[];const box=$('step37ReviewResults');if(!box)return;
    if(!currentItems.length){box.innerHTML='<p>No extracted question blocks found.</p>';return;}
    box.innerHTML=`<div style="overflow:auto"><table border="1" cellpadding="5" style="border-collapse:collapse;width:100%"><thead><tr><th><input type="checkbox" id="step37SelectAll"></th><th>No.</th><th>Question</th><th>Suggested Chapter</th><th>Confidence</th><th>Marks</th><th>Answer / Easy Answer</th><th>Visual Tag</th><th>Status</th></tr></thead><tbody>${currentItems.map((x,i)=>`<tr data-id="${x.id}"><td><input class="step37Pick" type="checkbox" value="${x.id}"></td><td>${esc(x.question_no||i+1)}</td><td style="min-width:300px;white-space:pre-wrap">${esc(x.question_text)}</td><td><input class="step37Chapter" value="${esc(x.suggested_chapter_number||'')}" title="Chapter number"><br><small>${esc(x.suggested_chapter_name||'')}</small></td><td>${Number(x.mapping_confidence||0)}%</td><td><input class="step37Marks" type="number" min="1" max="20" value="${Number(x.marks||1)}" style="width:55px"></td><td><textarea class="step37Answer" rows="3" style="min-width:240px" placeholder="Verified board-style answer">${esc(x.easy_answer||x.answer_text||'')}</textarea></td><td><input class="step37Visual" value="${esc(x.visual_tag||'')}" placeholder="MAP / DIAGRAM / FORMULA"></td><td>${esc(x.status||'REVIEW')}</td></tr>`).join('')}</tbody></table></div>`;
    $('step37SelectAll').addEventListener('change',e=>document.querySelectorAll('.step37Pick').forEach(c=>c.checked=e.target.checked));
    box.querySelectorAll('tbody tr').forEach(row=>{const id=Number(row.dataset.id);row.querySelector('.step37Answer').addEventListener('blur',()=>saveItem(row,id));row.querySelector('.step37Chapter').addEventListener('blur',()=>saveItem(row,id));row.querySelector('.step37Marks').addEventListener('change',()=>saveItem(row,id));row.querySelector('.step37Visual').addEventListener('blur',()=>saveItem(row,id));});
    $('step37ImportApprovedButton').disabled=false;
  }
  async function saveItem(row,id){try{const r=await fetch(`${API_URL}/api/admin/pyq-extraction/update-item',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,suggested_chapter_number:row.querySelector('.step37Chapter').value.trim(),marks:Number(row.querySelector('.step37Marks').value)||1,answer_text:row.querySelector('.step37Answer').value.trim(),easy_answer:row.querySelector('.step37Answer').value.trim(),visual_tag:row.querySelector('.step37Visual').value.trim()})});if(!r.ok)throw Error();}catch(e){msg(`Could not save review item ${id}.`);}}
  async function extract(){
    const file=$('step37PdfFile').files?.[0],subject=$('step37Subject').value,year=Number($('step37Year').value);if(!file||!subject||!year){msg('Select Subject, Exam Year and the official PDF first.');return;}if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){msg('Please select a PDF file.');return;}
    msg('Reading PDF text layer…');
    try{
      let x=await extractPdfText(file);$('step37RawText').style.display='block';$('step37RawText').value=x.text.slice(0,30000);
      // V7 quality gate: a normal SSC Maths paper should produce many meaningful blocks.
      // If the text layer is scrambled/too sparse, automatically switch to OCR.
      const likelyPoor=x.text.trim().length<500 || (x.text.match(/\b(?:1|2|3|4)\b/g)||[]).length<4;
      if(likelyPoor){msg('PDF text layer is incomplete. Starting automatic OCR…');x=await ocrPdf(file);$('step37RawText').value=x.text.slice(0,30000);}
      msg(`Extracted ${x.textPages}/${x.pdfPages} pages. Separating questions…`);
      const r=await fetch(`${API_URL}/api/admin/pyq-extraction/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subject_name:subject,pyq_year:year,pyq_exam_month:$('step37Month').value.trim(),pyq_paper_set:$('step37Set').value.trim(),source_url:$('step37SourceUrl').value.trim(),source_note:$('step37SourceNote').value.trim()||`Official MSBSHSE paper: ${file.name}`,raw_text:x.text})});
      const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'Analysis failed');currentBatchId=d.batchId;renderItems(d.items);msg(d.message,true);
    }catch(e){console.error(e);msg(e.message||'PDF extraction failed.');}
  }
  async function importApproved(){const ids=[...document.querySelectorAll('.step37Pick:checked')].map(x=>Number(x.value));if(!ids.length){msg('Select reviewed questions first.');return;}if(!confirm(`Import ${ids.length} reviewed questions as ACTUAL_PYQ?`))return;const r=await fetch(`${API_URL}/api/admin/pyq-extraction/import-approved',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({item_ids:ids})});const d=await r.json();if(!r.ok||!d.success){msg(d.error||'Import failed.');return;}msg(d.message,true);await runRepeat();}
  async function runRepeat(){
    const box=$('step37RepeatResults');
    if(box) box.innerHTML='<div style="padding:10px;border:1px solid #aaa;margin:10px 0"><strong>⏳ Repeated PYQ analysis is running…</strong><br>Please wait.</div>';
    try{
      const r=await fetch(`${API_URL}/api/admin/pyq-repeat-analysis`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      const text=await r.text();
      let d={}; try{d=JSON.parse(text)}catch(e){d={error:text||'Server returned an invalid response.'};}
      if(!r.ok||!d.success) throw Error(d.error||`Server error (${r.status})`);
      const years=(d.yearsAvailable||[]).join(', ')||'None';
      const note=d.repeatedGroups>0
        ? `Found ${d.repeatedGroups} repeated groups across multiple years.`
        : 'No cross-year repeated PYQs can be confirmed yet. This is normal because only one verified year is currently available.';
      if(box) box.innerHTML=`<div style="padding:12px;border:2px solid #2e7d32;margin:10px 0;background:#f5fff5"><strong>✅ REPEATED PYQ ANALYSIS COMPLETED</strong><br><br>Verified Actual PYQs checked: <strong>${d.totalActualPYQ||0}</strong><br>Verified years available: <strong>${esc(years)}</strong><br>Repeated groups: <strong>${d.repeatedGroups||0}</strong><br>Repeated questions: <strong>${d.repeatedQuestions||0}</strong><br><br>${esc(note)}<br><br><button id="step37AutoReportButton">📈 LOAD CURRENT PYQ REPORT</button></div>`;
      msg('Repeated PYQ analysis completed.',true);
      const b=$('step37AutoReportButton'); if(b)b.addEventListener('click',report);
    }catch(e){
      if(box) box.innerHTML=`<div style="padding:12px;border:2px solid #c62828;margin:10px 0"><strong>❌ Repeated PYQ analysis failed</strong><br>${esc(e.message||'Unknown error')}<br><br><small>Check that the backend is running on port 3001, then try again.</small></div>`;
      msg(e.message||'Repeated analysis failed.');
    }
  }
  async function report(){
    const box=$('step37RepeatResults');
    if(box) box.innerHTML='<div style="padding:10px;border:1px solid #aaa;margin:10px 0"><strong>⏳ Loading repeated PYQ report…</strong></div>';
    try{
      const r=await fetch(`${API_URL}/api/admin/pyq-repeat-report`);
      const text=await r.text(); let d={}; try{d=JSON.parse(text)}catch(e){d={error:text||'Invalid server response.'};}
      if(!r.ok||!d.success) throw Error(d.error||`Server error (${r.status})`);
      const rows=d.rows||[];
      if(box) box.innerHTML=`<h4>🔥 Repeated PYQ Report</h4>${rows.length?`<div style="overflow:auto"><table border="1" cellpadding="5" style="border-collapse:collapse;width:100%"><tr><th>Subject</th><th>Chapter</th><th>Frequency</th><th>Questions</th><th>Years Seen</th></tr>${rows.map(x=>`<tr><td>${esc(x.subject_name)}</td><td>${esc(x.chapter_number)} - ${esc(x.chapter_name)}</td><td><strong>${x.pyq_frequency}×</strong></td><td>${x.question_count}</td><td>${esc(x.years_seen||x.latest_year||'')}</td></tr>`).join('')}</table></div>`:'<p>ℹ️ No repeated PYQ groups yet. Add another verified Board year to enable cross-year repetition detection.</p>'}`;
    }catch(e){
      if(box) box.innerHTML=`<div style="padding:12px;border:2px solid #c62828"><strong>❌ Report could not be loaded</strong><br>${esc(e.message||'Unknown error')}</div>`;
      msg(e.message||'Unable to load report.');
    }
  }
  async function status(){const r=await fetch(`${API_URL}/api/admin/pyq-extraction/status'),d=await r.json();if(!r.ok||!d.success)return;$('step37BatchResults').innerHTML=`<h4>Recent Extraction Batches</h4>${d.batches.map(x=>`<div>Batch #${x.id} — ${esc(x.subject_name)} — ${x.pyq_year} — ${esc(x.pyq_exam_month||'')} — <strong>${esc(x.status)}</strong></div>`).join('')||'<p>No batches yet.</p>'}`;}
  document.addEventListener('DOMContentLoaded',()=>{if(!$('step37PdfFile'))return;loadSubjects();$('step37ExtractPdfButton').addEventListener('click',extract);$('step37ImportApprovedButton').addEventListener('click',importApproved);$('step37RepeatAnalysisButton').addEventListener('click',runRepeat);$('step37RepeatReportButton').addEventListener('click',report);$('step37LoadStatusButton').addEventListener('click',status);});
  async function loadSubjects(){try{const r=await fetch('/api/subjects'),d=await r.json();if(Array.isArray(d))$('step37Subject').innerHTML='<option value="">Select Subject</option>'+d.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('');}catch(e){msg('Unable to load subjects.');}}
})();
