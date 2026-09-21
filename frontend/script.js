let currentStudentId = null;
let currentStudentName = null;


// ================================================
// API URL
// ================================================

const API_URL = (() => {
    // Local file / Live Server -> backend on localhost:3001.
    // Published app served by the same Node server -> use the current origin.
    if (window.location.protocol === "file:") return "http://localhost:3001";
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3001";
    return window.location.origin;
})();


// ================================================
// STEP 86 — STUDENT-FRIENDLY MAIN MENU / SUBMENUS
// ================================================
function setupMainNavigation() {
    const navToggle = document.getElementById("navToggleButton");
    const navLinks = document.getElementById("navLinks");

    navToggle?.addEventListener("click", () => {
        const open = navLinks?.classList.toggle("nav-open");
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.querySelectorAll(".nav-trigger").forEach(trigger => {
        trigger.addEventListener("click", (event) => {
            const item = event.currentTarget.closest(".nav-item");
            document.querySelectorAll(".nav-item.menu-open").forEach(other => {
                if (other !== item) other.classList.remove("menu-open");
            });
            item?.classList.toggle("menu-open");
        });
    });

    document.querySelectorAll("[data-nav-target]").forEach(button => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.navTarget);
            if (target) target.click();
            closeMainNavigation();
            // Every menu item opens its page in the single content area directly under the menu.
            setTimeout(() => document.getElementById("subjectsContainer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        });
    });

    document.getElementById("navHomeButton")?.addEventListener("click", () => {
        closeMainNavigation();
        const page = document.getElementById("subjectsContainer");
        if (page) page.innerHTML = "";
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("navLogoutButton")?.addEventListener("click", () => {
        document.getElementById("logoutButton")?.click();
        closeMainNavigation();
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".main-nav")) {
            document.querySelectorAll(".nav-item.menu-open").forEach(x => x.classList.remove("menu-open"));
        }
    });
}

function closeMainNavigation() {
    document.querySelectorAll(".nav-item.menu-open").forEach(x => x.classList.remove("menu-open"));
    const navLinks = document.getElementById("navLinks");
    const navToggle = document.getElementById("navToggleButton");
    navLinks?.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
}

function updateSubjectMenu(subjects) {
    const panel = document.getElementById("subjectMenuPanel");
    if (!panel) return;
    if (!Array.isArray(subjects) || !subjects.length) {
        panel.innerHTML = '<p class="submenu-empty">Subjects उपलब्ध नाहीत.</p>';
        return;
    }
    const icons = ["📐","🔬","🌍","📜","🗺️","🧮","⚡","🧪","📝","📖","🔢","🎓"];
    panel.innerHTML = subjects.map((subject, index) =>
        `<button class="subject-menu-button" type="button" data-subject-id="${Number(subject.id)}">${icons[index % icons.length]} ${dailyPracticeEscape(subject.name)}</button>`
    ).join("");
    panel.querySelectorAll(".subject-menu-button").forEach(button => {
        const subject = subjects.find(x => Number(x.id) === Number(button.dataset.subjectId));
        button.addEventListener("click", () => {
            if (subject) loadChapters(subject);
            closeMainNavigation();
            setTimeout(() => document.getElementById("subjectsContainer")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        });
    });
}

setupMainNavigation();

// ================================================
// LOAD SUBJECTS
// ================================================

async function loadSubjects() {

    const container =
        document.getElementById("subjectsContainer");

    container.innerHTML =
        "<p>Subjects loading...</p>";

    try {

        const response = await fetch(
            `${API_URL}/api/subjects`
        );

        if (!response.ok) {
            throw new Error("Unable to load subjects");
        }

        const subjects = await response.json();

        updateSubjectMenu(subjects);
        // Subjects are intentionally shown only inside the main menu.
        // The page area stays empty until a menu/submenu item is selected.
        container.innerHTML = "";

    } catch (error) {

        console.error(
            "Subject Load Error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load subjects.</p>";

    }

}


// ================================================
// CREATE / LOGIN STUDENT
// ================================================

async function createStudent() {

    const nameInput =
        document.getElementById("studentName");

    const mobileInput =
        document.getElementById("studentMobile");

    const message =
        document.getElementById("studentMessage");


    const name =
        nameInput.value.trim();

    const mobile =
        mobileInput.value.trim();


    // Validate Name

    if (!name) {

        message.innerText =
            "Please enter your name.";

        return;

    }


    // Validate Mobile

    if (!/^[0-9]{10}$/.test(mobile)) {

        message.innerText =
            "Please enter a valid 10 digit mobile number.";

        return;

    }


    try {

        // ====================================
        // CHECK EXISTING STUDENT
        // ====================================

        const checkResponse = await fetch(

            `${API_URL}/api/students/find/mobile/${mobile}`

        );


        const checkData =
            await checkResponse.json();


        let isExistingStudent = false;


        // ====================================
        // EXISTING STUDENT
        // ====================================

        if (checkData.found) {

            isExistingStudent = true;

            currentStudentId =
                checkData.student.id;

            currentStudentName =
                checkData.student.name;

            message.innerText =
                `Welcome back, ${currentStudentName}!`;

        }


        // ====================================
        // NEW STUDENT
        // ====================================

        else {

            const response = await fetch(

                `${API_URL}/api/students`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        name: name,

                        mobile_number: mobile

                    })

                }

            );


            const data =
                await response.json();


            if (!data.success) {

                message.innerText =
                    data.error ||
                    "Unable to create student.";

                return;

            }


            currentStudentId =
                data.student.id;

            currentStudentName =
                data.student.name;


            message.innerText =
                `Welcome, ${currentStudentName}!`;

        }


        // ====================================
        // SAVE LOGIN
        // ====================================

        localStorage.setItem(
            "studentId",
            currentStudentId
        );

        localStorage.setItem(
            "studentName",
            currentStudentName
        );

        localStorage.setItem(
            "studentMobile",
            mobile
        );


        // ====================================
        // WELCOME MESSAGE
        // ====================================

        document
            .getElementById("welcomeMessage")
            .innerText =
            isExistingStudent
                ? `Welcome back, ${currentStudentName}! 👋`
                : `Welcome, ${currentStudentName}! 👋`;


        // Hide Login

        document
            .getElementById("studentSection")
            .style.display =
            "none";


        // Show Logout

        document
            .getElementById("logoutButton")
            .style.display =
            "inline-block";
        document.getElementById("navLogoutButton")?.style && (document.getElementById("navLogoutButton").style.display = "inline-block");


        // Load Subjects

        loadSubjects();


        // Load Progress

        loadStudentProgress();


    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        message.innerText =
            "Server connection error.";

    }

}


// ================================================
// LOAD CHAPTERS
// ================================================

async function loadChapters(subject) {

    const container =
        document.getElementById("subjectsContainer");


    container.innerHTML = `

        <button id="backButton">
            ← Back to Subjects
        </button>

        <h2>${subject.name}</h2>

        <p>Chapters loading...</p>

    `;


    try {

        const response = await fetch(

            `${API_URL}/api/subjects/${subject.id}/chapters?studentId=${currentStudentId || ""}`

        );


        if (!response.ok) {
            throw new Error("Chapter API error");
        }


        const chapters =
            await response.json();


        container.innerHTML = `

            <button id="backButton">
                ← Back to Subjects
            </button>

            <h2>${subject.name}</h2>
            <p>📖 Select a chapter to start chapter-wise practice.</p>

        `;


        if (chapters.length === 0) {

            container.innerHTML += `

                <p>
                    Chapters will be added soon.
                </p>

            `;

        }

        else {

            chapters.forEach((chapter) => {

                const chapterCard =
                    document.createElement("button");


                chapterCard.className =
                    "subject-card";


                const totalQuestions = Number(chapter.active_questions || chapter.total_questions || 0);
                const knownQuestions = Number(chapter.known_questions || 0);
                const revisionQuestions = Number(chapter.revision_questions || 0);
                const studiedQuestions = knownQuestions + revisionQuestions;
                const completion = totalQuestions > 0 ? Math.round((studiedQuestions / totalQuestions) * 100) : 0;

                chapterCard.innerHTML = `
                    <span>
                        <strong>Chapter ${chapter.chapter_number}: ${chapter.chapter_name}</strong>
                        <br>
                        <small>📚 ${totalQuestions} Questions &nbsp; | &nbsp; ✅ ${knownQuestions} Known &nbsp; | &nbsp; 🔄 ${revisionQuestions} Revision</small>
                        <br>
                        <small>📊 Chapter Progress: ${completion}%</small>
                    </span>
                `;


                chapterCard.addEventListener(
                    "click",
                    () => {

                        loadQuestions(
                            chapter,
                            subject
                        );

                    }
                );


                container.appendChild(
                    chapterCard
                );

            });

        }


        document
            .getElementById("backButton")
            .addEventListener(
                "click",
                loadSubjects
            );


    } catch (error) {

        console.error(
            "Chapter Load Error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load chapters.</p>";

    }

}


// ================================================
// SAVE QUESTION PROGRESS
// ================================================

async function saveProgress(
    questionId,
    status
) {

    if (!currentStudentId) {

        alert(
            "Please login first."
        );

        return null;

    }


    try {

        const response = await fetch(

            `${API_URL}/api/progress`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    student_id:
                        currentStudentId,

                    question_id:
                        questionId,

                    status:
                        status

                })

            }

        );


        const data =
            await response.json();


        console.log(
            "Progress saved:",
            data
        );


        // Refresh Progress Dashboard

        loadStudentProgress();


        return data;


    } catch (error) {

        console.error(
            "Progress Error:",
            error
        );

        alert(
            "Unable to save progress."
        );

        return null;

    }

}


// ================================================
// STEP 95 — EXAM-ORIENTED CHAPTER PASS BOOSTER
// Dynamic from live chapter questions. Targets are study recommendations,
// not claims about the official board paper pattern.
// ================================================
function examPackSafe(v){
    return dailyPracticeEscape(v==null?'':v);
}
function examPackIsPYQ(q){
    return q && (q.pyq_verified===true || q.source_type==='ACTUAL_PYQ' || q.source_type==='PYQ_REPEATED' || q.question_type==='PYQ' || q.pyq_year);
}
function examPackIsRepeated(q){ return q && (q.source_type==='PYQ_REPEATED' || Number(q.pyq_frequency||0)>1); }
function examPackRepType(q,subject){
    const t=String((q.question_text||'')+' '+(q.keywords||'')).toLowerCase();
    const sub=String(subject?.name||'').toLowerCase();
    if(/graph|plot|coordinate|line\s*graph|bar graph|histogram|pie chart/.test(t)) return 'GRAPH';
    if(/table|tabulate|frequency distribution|data|class interval/.test(t)) return 'TABLE';
    if(/diagram|draw|figure|label|circuit|ray diagram|structure|map|outline map|flowchart/.test(t)) return 'DIAGRAM';
    if(/formula|calculate|find|solve|equation|area|volume|mean|median|mode|probability|resistance|power|energy|heat|density|speed|acceleration|force/.test(t) || /mathematics|science/.test(sub)) return 'FORMULA';
    return 'NONE';
}
function renderChapterExamPack(chapter,subject,questions){
    const total=questions.length;
    const marks={1:0,2:0,3:0,4:0};
    questions.forEach(q=>{const m=Number(q.marks); if(m===1||m===2||m===3||m>=4) marks[m>=4?4:m]++;});
    const pyqs=questions.filter(examPackIsPYQ), repeated=questions.filter(examPackIsRepeated);
    const verified=questions.filter(q=>q.pyq_verified===true && (q.source_type==='ACTUAL_PYQ'||q.source_type==='PYQ_REPEATED'));
    const formula=questions.filter(q=>examPackRepType(q,subject)==='FORMULA').length;
    const diagram=questions.filter(q=>examPackRepType(q,subject)==='DIAGRAM').length;
    const graph=questions.filter(q=>examPackRepType(q,subject)==='GRAPH').length;
    const table=questions.filter(q=>examPackRepType(q,subject)==='TABLE').length;
    const answer=questions.filter(q=>String(q.easy_answer||'').trim()).length;
    const solution=questions.filter(q=>String(q.solution||q.mcq_explanation||'').trim() || String(q.easy_answer||'').trim()).length;
    const target={one:Math.min(4,total),two:Math.min(3,total),three:Math.min(2,total),four:Math.min(1,total)};
    const checklistKey=`examPackChecklist_${subject.id}_${chapter.id}`;
    let checks={}; try{checks=JSON.parse(localStorage.getItem(checklistKey)||'{}')}catch(e){}
    const item=(id,label)=>`<label style="display:block;margin:7px 0"><input type="checkbox" class="exam-check" data-key="${id}" ${checks[id]?'checked':''}> ${label}</label>`;
    const status=(n,targetN)=>n>=targetN?'🟢':'🟡';
    return `<div class="question-box exam-pass-pack" id="chapterExamPassPack">
      <h3>🎯 EXAM-ORIENTED PASS BOOSTER</h3>
      <p><strong>${examPackSafe(subject.name)} — Chapter ${examPackSafe(chapter.chapter_number)}: ${examPackSafe(chapter.chapter_name)}</strong></p>
      <p class="exam-note">ℹ️ 1/2/3/4-mark balance below is a <strong>PASS-study target</strong> based on the live question bank, not an official board-paper blueprint.</p>
      <div class="exam-grid">
        <div><strong>1 Mark</strong><br>${status(marks[1],target.one)} ${marks[1]} / ${target.one}</div>
        <div><strong>2 Marks</strong><br>${status(marks[2],target.two)} ${marks[2]} / ${target.two}</div>
        <div><strong>3 Marks</strong><br>${status(marks[3],target.three)} ${marks[3]} / ${target.three}</div>
        <div><strong>4+ Marks</strong><br>${status(marks[4],target.four)} ${marks[4]} / ${target.four}</div>
      </div>
      <div class="exam-grid">
        <div><strong>🏆 Verified PYQ</strong><br>${verified.length}</div>
        <div><strong>🔥 Repeated PYQ</strong><br>${repeated.length}</div>
        <div><strong>📝 Answer Ready</strong><br>${answer}/${total}</div>
        <div><strong>🧩 Solution Ready</strong><br>${solution}/${total}</div>
      </div>
      <p><strong>📐 Representation scan:</strong> Formula ${formula} &nbsp;|&nbsp; Diagram ${diagram} &nbsp;|&nbsp; Graph ${graph} &nbsp;|&nbsp; Table ${table}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">
        <button type="button" class="exam-filter-btn" data-filter="pyq">🏆 PYQ First</button>
        <button type="button" class="exam-filter-btn" data-filter="1">1 Mark</button>
        <button type="button" class="exam-filter-btn" data-filter="2">2 Marks</button>
        <button type="button" class="exam-filter-btn" data-filter="3">3 Marks</button>
        <button type="button" class="exam-filter-btn" data-filter="4">4+ Marks</button>
        <button type="button" class="exam-filter-btn" data-filter="all">📚 All Questions</button>
      </div>
      <details open><summary><strong>📌 PYQ Priority + Exam Strategy</strong></summary>
        <ol>
          <li>First solve <strong>Verified PYQ</strong> and <strong>Repeated PYQ</strong>.</li>
          <li>Then complete the 1-mark and 2-mark questions for quick PASS coverage.</li>
          <li>Then practise 3-mark and 4+/long-answer questions with full working/answer structure.</li>
          <li>For formula/diagram/graph/table questions, practise the required representation—not only the final answer.</li>
        </ol>
      </details>
      <details open><summary><strong>✅ Final Chapter Revision Checklist</strong></summary>
        ${item('pyq','🏆 PYQ First set completed')}
        ${item('one','1-mark questions revised')}
        ${item('two','2-mark questions revised')}
        ${item('three','3-mark questions revised')}
        ${item('four','4+/long-answer questions revised')}
        ${item('repr','Formula / Diagram / Graph / Table practice completed')}
        ${item('answers','Easy answers + keywords memorised')}
        ${item('self','One final self-test completed without help')}
      </details>
      <p><strong>🎯 PASS Rule:</strong> finish the checklist, then use <strong>Smart Revision</strong> for every question marked “Need Revision”.</p>
    </div>`;
}
function wireChapterExamPack(){
    const pack=document.getElementById('chapterExamPassPack'); if(!pack) return;
    pack.querySelectorAll('.exam-check').forEach(cb=>cb.addEventListener('change',()=>{
        const all=[...pack.querySelectorAll('.exam-check')];
        const key=pack.dataset.checklistKey;
        let state={}; try{state=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}
        state[cb.dataset.key]=cb.checked; localStorage.setItem(key,JSON.stringify(state));
    }));
    pack.querySelectorAll('.exam-filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
        const f=btn.dataset.filter;
        document.querySelectorAll('#chapterQuestionsList .question-box').forEach(box=>{
            const source=box.dataset.source||'', marks=Number(box.dataset.marks||0);
            const pyq=source==='ACTUAL_PYQ'||source==='PYQ_REPEATED';
            const ok=f==='all'||(f==='pyq'&&pyq)||(f==='4'&&marks>=4)||(f!=='pyq'&&f!=='all'&&Number(f)===marks);
            box.style.display=ok?'block':'none';
        });
    }));
}

// ================================================
// LOAD QUESTIONS BY CHAPTER
// ================================================

async function loadQuestions(
    chapter,
    subject,
    backAction = () => loadChapters(subject)
) {

    const container =
        document.getElementById(
            "subjectsContainer"
        );


    container.innerHTML = `

        <button id="backToChapters">
            ← Back to Chapters
        </button>

        <h2>${subject.name}</h2>

        <h3>
            Chapter ${chapter.chapter_number}:
            ${chapter.chapter_name}
        </h3>

        <p>Questions loading...</p>

    `;


    try {

        const response = await fetch(

            `${API_URL}/api/chapters/${chapter.id}/questions`

        );


        if (!response.ok) {
            throw new Error("Question API error");
        }


        const questions =
            await response.json();


        container.innerHTML = `

            <button id="backToChapters">
                ← Back to Chapters
            </button>

            <h2>${subject.name}</h2>

            <h3>
                Chapter ${chapter.chapter_number}:
                ${chapter.chapter_name}
            </h3>
            <p><strong>📚 ${questions.length} Questions</strong> — Practice, check Hint/Answer, then mark your status.</p>
            <label for="chapterDifficultyFilter">🎚️ Filter: </label>
            <select id="chapterDifficultyFilter">
                <option value="all">All Questions</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
            </select>
            <label for="chapterSourceFilter"> &nbsp; Source: </label>
            <select id="chapterSourceFilter">
                <option value="all">All Sources</option>
                <option value="ACTUAL_PYQ">🟢 Actual Board PYQ</option>
                <option value="PYQ_REPEATED">🔵 Repeated PYQ</option>
                <option value="PYQ_BASED">🟡 PYQ Based</option>
                <option value="IMPORTANT">🟠 Important</option>
                <option value="PRACTICE">🟣 Practice</option>
            </select>
            ${renderChapterExamPack(chapter, subject, questions)}
            <div id="chapterQuestionsList"></div>

        `;
        const examPack=document.getElementById('chapterExamPassPack');
        if(examPack) examPack.dataset.checklistKey=`examPackChecklist_${subject.id}_${chapter.id}`;
        wireChapterExamPack();

        if (questions.length === 0) {

            container.innerHTML += `

                <p>
                    Questions will be added soon.
                </p>

            `;

        }

        else {

            questions.forEach(
                (question, index) => {

                    const questionBox =
                        document.createElement("div");


                    questionBox.className =
                        "question-box";


                    questionBox.innerHTML = `

                        <h3>
                            Question ${index + 1}
                        </h3>

                        <p>
                            <strong>
                                ${question.question_text}
                            </strong>
                        </p>

                        <p>
                            📖 <strong>Chapter / Topic:</strong>
                            ${question.chapter_number ? `Chapter ${question.chapter_number}: ` : ""}${question.chapter_name || chapter.chapter_name}
                        </p>

                        <p>
                            Marks: ${question.marks}
                            ${question.difficulty ? `&nbsp; | &nbsp; <strong>🎚️ ${question.difficulty}</strong>` : ""}
                            ${question.source_type === 'ACTUAL_PYQ' || question.question_type === 'PYQ' ? `&nbsp; | &nbsp; <strong>🟢 ACTUAL PYQ${question.pyq_year ? ' '+question.pyq_year : ''}</strong>` : question.source_type === 'PYQ_REPEATED' ? `&nbsp; | &nbsp; <strong>🔵 REPEATED PYQ</strong>` : question.source_type === 'PYQ_BASED' ? `&nbsp; | &nbsp; <strong>🟡 PYQ-BASED</strong>` : question.source_type === 'IMPORTANT' || question.question_type === 'Important' ? `&nbsp; | &nbsp; <strong>🟠 IMPORTANT</strong>` : `&nbsp; | &nbsp; <strong>🟣 PRACTICE</strong>`}
                            ${question.pyq_frequency && Number(question.pyq_frequency) > 1 ? `&nbsp; | &nbsp; <strong>🔥 Seen ${question.pyq_frequency}×</strong>` : ""}
                            ${question.student_status === "known" ? `&nbsp; | &nbsp; <strong>✅ Known</strong>` : question.student_status === "revision" ? `&nbsp; | &nbsp; <strong>🔄 Revision</strong>` : ""}
                        </p>


                        ${
                            question.pyq_year
                            ? `
                                <p>
                                    📅 PYQ Year:
                                    ${question.pyq_year}
                                </p>
                              `
                            : ""
                        }


                        <button class="hint-button">
                            💡 Show Hint
                        </button>

                        <div
                            class="hint-content"
                            style="display:none;"
                        >

                            <p>
                                ${question.hint ||
                                "No hint available."}
                            </p>

                        </div>


                        <button class="answer-button">
                            👁 Show Answer
                        </button>

                        <button class="smart-learn-button" style="margin-left:6px;">
                            🎓 Smart Learn
                        </button>

                        <div
                            class="answer-content"
                            style="display:none;"
                        >

                            <p>
                                ${question.easy_answer ||
                                "Answer not available."}
                            </p>

                            <p>
                                <strong>
                                    Keywords:
                                </strong>

                                ${question.keywords || ""}
                            </p>

                            ${typeof window.renderVisualLearning === "function"
                                ? window.renderVisualLearning(question, subject, chapter)
                                : ""}

                        </div>


                        <br><br>


                        <button class="know-button">
                            👍 I Know This
                        </button>


                        <button class="revision-button">
                            🔄 Need Revision
                        </button>

                    `;


                    // ====================================
                    // HINT
                    // ====================================

                    const hintButton =
                        questionBox.querySelector(
                            ".hint-button"
                        );


                    const hintContent =
                        questionBox.querySelector(
                            ".hint-content"
                        );


                    hintButton.addEventListener(
                        "click",
                        () => {

                            hintContent.style.display =
                                "block";

                        }
                    );


                    // ====================================
                    // ANSWER
                    // ====================================

                    const answerButton =
                        questionBox.querySelector(
                            ".answer-button"
                        );


                    const answerContent =
                        questionBox.querySelector(
                            ".answer-content"
                        );


                    answerButton.addEventListener(
                        "click",
                        () => {

                            answerContent.style.display =
                                "block";

                        }
                    );


                    // ====================================
                    // STEP 60 — SMART QUESTION LEARNING
                    // ====================================
                    const smartLearnButton = questionBox.querySelector(".smart-learn-button");
                    smartLearnButton?.addEventListener("click", () => {
                        startSmartQuestionLearning(question, subject, chapter, questionBox);
                    });

                    // ====================================
                    // I KNOW
                    // ====================================

                    const knowButton =
                        questionBox.querySelector(
                            ".know-button"
                        );


                    knowButton.addEventListener(
                        "click",
                        async () => {

                            await saveProgress(
                                question.id,
                                "known"
                            );

                            alert(
                                "Excellent! Progress saved."
                            );

                        }
                    );


                    // ====================================
                    // NEED REVISION
                    // ====================================

                    const revisionButton =
                        questionBox.querySelector(
                            ".revision-button"
                        );


                    revisionButton.addEventListener(
                        "click",
                        async () => {

                            await saveProgress(
                                question.id,
                                "revision"
                            );

                            alert(
                                "Question added to revision list."
                            );

                        }
                    );


                    questionBox.dataset.difficulty = question.difficulty || "";
                    questionBox.dataset.marks = Number(question.marks || 0);
                    questionBox.dataset.source = question.source_type || (question.question_type === 'PYQ' || question.pyq_year ? 'ACTUAL_PYQ' : (question.question_type === 'Important' ? 'IMPORTANT' : 'PRACTICE'));
                    document.getElementById("chapterQuestionsList").appendChild(questionBox);

                }
            );

        }


        const difficultyFilter = document.getElementById("chapterDifficultyFilter");
        const sourceFilter = document.getElementById("chapterSourceFilter");
        const applyChapterFilters = () => {
            const d = difficultyFilter?.value || 'all';
            const s = sourceFilter?.value || 'all';
            document.querySelectorAll("#chapterQuestionsList .question-box").forEach(box => {
                const okD = d === 'all' || box.dataset.difficulty === d;
                const okS = s === 'all' || box.dataset.source === s;
                box.style.display = okD && okS ? 'block' : 'none';
            });
        };
        difficultyFilter?.addEventListener('change', applyChapterFilters);
        sourceFilter?.addEventListener('change', applyChapterFilters);

        document
            .getElementById("backToChapters")
            .addEventListener(
                "click",
                () => {

                    backAction();

                }
            );


    } catch (error) {

        console.error(
            "Question Load Error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load questions.</p>";

    }

}


// ================================================
// STEP 60 — SMART QUESTION LEARNING FLOW
// Visual → Easy Answer → Keywords → Self Check → Save Status
// Additive only; uses the existing question data.
// ================================================
function evaluateSmartSelfAnswer(userAnswer, question) {
    const raw = String(userAnswer || '').trim();
    const answer = String(question.easy_answer || '').trim();
    const keywordRaw = String(question.keywords || '').trim();
    const norm = value => String(value || '').toLowerCase()
        .replace(/[^\p{L}\p{N}²³⁴⁵₀₁₂₃₄₅₆₇₈₉+\-./=%√]/gu, ' ')
        .replace(/\s+/g, ' ').trim();
    const u = norm(raw), a = norm(answer);
    if (!u) return {level:'empty', title:'✍️ उत्तर लिहिलेले नाही', message:'आधी स्वतःचे उत्तर लिहा. नंतर Check Answer करा.'};
    if (u === a || (a && u.includes(a)) || (u && a.includes(u) && u.length >= 8)) {
        return {level:'strong', title:'🌟 Strong Match', message:'तुमचे उत्तर Easy Answer शी चांगले जुळते. तरीही textbook मधील keywords एकदा तपासा.'};
    }
    const keywordList = keywordRaw.split(/[;,|]/).map(norm).filter(x => x.length >= 2);
    const sourceWords = keywordList.length ? keywordList : a.split(/\s+/).filter(x => x.length >= 4).slice(0, 8);
    const matched = sourceWords.filter(k => u.includes(k) || k.split(/\s+/).every(w => w && u.includes(w)));
    const numericU = (u.match(/[-+]?\d+(?:\.\d+)?/g) || []);
    const numericA = (a.match(/[-+]?\d+(?:\.\d+)?/g) || []);
    const numberMatch = numericA.length && numericA.some(n => numericU.includes(n));
    if (numberMatch || (sourceWords.length && matched.length >= Math.max(1, Math.ceil(sourceWords.length * 0.5)))) {
        return {level:'partial', title:'🟡 Partial Match', message:`तुमच्या उत्तरात ${matched.length || (numberMatch ? 1 : 0)} महत्त्वाचा भाग/keyword जुळतो. पूर्ण उत्तरासाठी Easy Answer आणि Keywords पुन्हा वाचा.`};
    }
    return {level:'weak', title:'🔄 Needs Revision', message:'तुमचे उत्तर source answer शी पुरेसे जुळत नाही. Easy Answer + Keywords पुन्हा पाहा आणि स्वतःचे उत्तर पुन्हा लिहा.'};
}

function startSmartQuestionLearning(question, subject, chapter, questionBox) {
    const safeText = value => dailyPracticeEscape(value == null ? "" : value);
    const existing = questionBox.querySelector(".smart-learning-panel");
    if (existing) {
        existing.remove();
        return;
    }

    const panel = document.createElement("div");
    panel.className = "smart-learning-panel";
    panel.style.cssText = "margin-top:14px;padding:14px;border:2px solid #888;border-radius:12px;background:#f7f7f7;";

    const visual = typeof window.renderVisualLearning === "function"
        ? window.renderVisualLearning(question, subject, chapter)
        : "";
    const answer = question.easy_answer || "Answer not available yet.";
    const keywords = question.keywords || "Keywords not available yet.";
    const hint = question.hint || "Hint not available yet.";

    panel.innerHTML = `
        <div class="smart-stage" data-stage="1">
            <h4>🎓 Smart Learning — Step 1 of 5</h4>
            <p><strong>📌 First understand the question</strong></p>
            <p>📖 <strong>Chapter / Topic:</strong> ${safeText(question.chapter_number ? `Chapter ${question.chapter_number}: ` : "")}${safeText(question.chapter_name || chapter?.chapter_name || "Practice Topic")}</p>
            <p>${safeText(question.question_text)}</p>
            <p>💡 <strong>Hint:</strong> ${safeText(hint)}</p>
            <button class="smart-next">Next → Easy Answer</button>
        </div>
        <div class="smart-stage" data-stage="2" style="display:none;">
            <h4>🎓 Step 2 of 5 — Easy Answer</h4>
            <div class="question-box"><p>${safeText(answer)}</p></div>
            ${typeof window.getRapidSolutionGuide === "function" ? `<details style="margin-top:10px;"><summary><strong>📝 Full Answer Writing / Solution Guide</strong></summary><div class="solution-guide">${window.getRapidSolutionGuide(question, subject).map((x,i)=>`<div class="solution-step"><strong>Step ${i+1}:</strong> ${safeText(x)}</div>`).join("")}</div></details>` : ""}
            <button class="smart-next">Next → Keywords</button>
        </div>
        <div class="smart-stage" data-stage="3" style="display:none;">
            <h4>🎓 Step 3 of 5 — Keywords</h4>
            <p>🧠 हे शब्द लक्षात ठेवा:</p>
            <div class="question-box"><strong>${safeText(keywords)}</strong></div>
            ${visual ? `<div style="margin-top:10px;"><strong>🖼️ Visual Learning</strong>${visual}</div>` : ""}
            <button class="smart-next">Next → Self Check</button>
        </div>
        <div class="smart-stage" data-stage="4" style="display:none;">
            <h4>🎓 Step 4 of 5 — स्वतः उत्तर द्या</h4>
            <p>आता answer न पाहता मनात/वहीत स्वतः उत्तर लिहा.</p>
            <textarea class="smart-self-answer" rows="4" placeholder="तुमचे उत्तर येथे लिहा..."></textarea>
            <button class="smart-next">Next → Check Answer</button>
        </div>
        <div class="smart-stage" data-stage="5" style="display:none;">
            <h4>🎓 Step 5 of 5 — Check & Save</h4>
            <p>तुमचे उत्तर योग्य असेल तर <strong>👍 I Know This</strong> निवडा. अजून सराव हवा असेल तर <strong>🔄 Need Revision</strong> निवडा.</p>
            <div class="question-box"><p><strong>Easy Answer:</strong><br>${safeText(answer)}</p></div>
            <div class="question-box smart-check-result" style="display:none;margin-top:10px;"></div>
            <button class="smart-known">👍 I Know This</button>
            <button class="smart-revision">🔄 Need Revision</button>
            <button class="smart-close">✕ Close</button>
            <p class="smart-save-message" style="font-weight:bold;"></p>
        </div>
    `;

    questionBox.appendChild(panel);
    const stages = [...panel.querySelectorAll(".smart-stage")];
    panel.querySelectorAll(".smart-next").forEach((button, index) => {
        button.addEventListener("click", () => {
            if (index === 3) {
                const selfAnswer = panel.querySelector(".smart-self-answer")?.value || "";
                const check = evaluateSmartSelfAnswer(selfAnswer, question);
                const box = panel.querySelector(".smart-check-result");
                if (box) {
                    const saveable = check.level === "strong" || check.level === "partial" || check.level === "weak";
                    const suggestedStatus = check.level === "strong" ? "known" : "revision";
                    const saveLabel = suggestedStatus === "known" ? "💾 Save as Known" : "🔄 Save for Revision";
                    box.innerHTML = `<strong>${safeText(check.title)}</strong><br><span>${safeText(check.message)}</span>${saveable ? `<div style="margin-top:10px;"><button type="button" class="smart-self-save-result">${saveLabel}</button></div>` : ""}`;
                    box.style.display = "block";
                    const saveBtn = box.querySelector(".smart-self-save-result");
                    if (saveBtn) {
                        saveBtn.addEventListener("click", async () => {
                            const result = await saveProgress(question.id, suggestedStatus);
                            if (result) {
                                saveBtn.disabled = true;
                                saveBtn.textContent = suggestedStatus === "known" ? "✅ Saved as Known" : "✅ Saved for Revision";
                            } else {
                                saveBtn.textContent = "⚠️ Save failed — use I Know / Need Revision";
                            }
                        });
                    }
                }
            }
            stages.forEach((stage, i) => stage.style.display = i === index + 1 ? "block" : "none");
        });
    });
    panel.querySelector(".smart-close")?.addEventListener("click", () => panel.remove());

    const saveSmart = async status => {
        const result = await saveProgress(question.id, status);
        const msg = panel.querySelector(".smart-save-message");
        if (result) {
            msg.textContent = status === "known" ? "✅ Saved as Known. Excellent!" : "🔄 Saved for Revision.";
            questionBox.querySelectorAll(".smart-known,.smart-revision").forEach(b => b.disabled = true);
        }
    };
    panel.querySelector(".smart-known")?.addEventListener("click", () => saveSmart("known"));
    panel.querySelector(".smart-revision")?.addEventListener("click", () => saveSmart("revision"));
}

// ================================================
// LOAD REVISION
// ================================================

async function loadRevision() {

    const container =
        document.getElementById(
            "subjectsContainer"
        );


    if (!currentStudentId) {

        alert(
            "Please login first."
        );

        return;

    }


    container.innerHTML = `

        <button id="backFromRevision">
            ← Back to Subjects
        </button>

        <h2>
            📚 My Revision
        </h2>

        <p>
            Revision questions loading...
        </p>

    `;


    try {

        const response = await fetch(

            `${API_URL}/api/students/${currentStudentId}/revision`

        );


        if (!response.ok) {
            throw new Error("Revision API error");
        }


        const questions =
            await response.json();


        container.innerHTML = `

            <button id="backFromRevision">
                ← Back to Subjects
            </button>

            <h2>
                📚 My Revision
            </h2>

            <h3>
                Questions to revise:
                ${questions.length}
            </h3>

        `;


        if (questions.length === 0) {

            container.innerHTML += `

                <p>
                    🎉 Excellent!
                    No revision questions.
                </p>

            `;

        }

        else {

            questions.forEach(
                (question, index) => {

                    const questionBox =
                        document.createElement(
                            "div"
                        );


                    questionBox.className =
                        "question-box";


                    questionBox.innerHTML = `

                        <p>
                            <strong>
                                ${question.subject_name}
                            </strong>
                        </p>

                        <p>
                            Chapter
                            ${question.chapter_number}:
                            ${question.chapter_name}
                        </p>


                        <h3>
                            Question
                            ${index + 1}
                        </h3>


                        <p>
                            <strong>
                                ${question.question_text}
                            </strong>
                        </p>


                        <button class="revision-hint-button">
                            💡 Show Hint
                        </button>


                        <div
                            class="revision-hint-content"
                            style="display:none;"
                        >

                            <p>
                                ${question.hint ||
                                "No hint available."}
                            </p>

                        </div>


                        <button class="revision-answer-button">
                            👁 Show Answer
                        </button>


                        <div
                            class="revision-answer-content"
                            style="display:none;"
                        >

                            <p>
                                ${question.easy_answer ||
                                "Answer not available."}
                            </p>

                            <p>
                                <strong>
                                    Keywords:
                                </strong>

                                ${question.keywords || ""}
                            </p>

                            ${typeof window.renderVisualLearning === "function"
                                ? window.renderVisualLearning(
                                    question,
                                    { name: question.subject_name },
                                    { chapter_name: question.chapter_name }
                                  )
                                : ""}

                        </div>


                        <br><br>


                        <button class="now-known-button">
                            👍 Now I Know This
                        </button>

                    `;


                    const hintButton =
                        questionBox.querySelector(
                            ".revision-hint-button"
                        );


                    const hintContent =
                        questionBox.querySelector(
                            ".revision-hint-content"
                        );


                    hintButton.addEventListener(
                        "click",
                        () => {

                            hintContent.style.display =
                                "block";

                        }
                    );


                    const answerButton =
                        questionBox.querySelector(
                            ".revision-answer-button"
                        );


                    const answerContent =
                        questionBox.querySelector(
                            ".revision-answer-content"
                        );


                    answerButton.addEventListener(
                        "click",
                        () => {

                            answerContent.style.display =
                                "block";

                        }
                    );


                    const knownButton =
                        questionBox.querySelector(
                            ".now-known-button"
                        );


                    knownButton.addEventListener(
                        "click",
                        async () => {

                            await saveProgress(
                                question.id,
                                "known"
                            );

                            alert(
                                "Excellent! Question marked as known."
                            );

                            loadRevision();

                        }
                    );


                    container.appendChild(
                        questionBox
                    );

                }
            );

        }


        document
            .getElementById("backFromRevision")
            .addEventListener(
                "click",
                loadSubjects
            );


    } catch (error) {

        console.error(
            "Revision Error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load revision questions.</p>";

    }

}


// ================================================
// LOAD STUDENT PROGRESS
// ================================================

async function loadStudentProgress() {

    if (!currentStudentId) {

        return;

    }


    try {

        const response = await fetch(

            `${API_URL}/api/students/${currentStudentId}/progress-summary`

        );


        if (!response.ok) {
            throw new Error("Progress API error");
        }


        const data =
            await response.json();


        const progressSection =
            document.querySelector(
                ".progress"
            );


        if (!progressSection) {

            return;

        }


        progressSection.innerHTML = `

            <h2>
                📊 Your Progress
            </h2>


            <p>
                📚 Total Questions:
                <strong>
                    ${data.total}
                </strong>
            </p>


            <p>
                ✅ I Know This:
                <strong>
                    ${data.known}
                </strong>
            </p>


            <p>
                🔄 Need Revision:
                <strong>
                    ${data.revision}
                </strong>
            </p>


            <p>
                ⏳ Not Started:
                <strong>
                    ${data.notStarted}
                </strong>
            </p>


            <hr>


            <h3>
                📚 Study Progress:
                ${data.percentage}%
            </h3>


            <div class="progress-bar">

                <div
                    class="progress-fill"
                    style="
                        width:
                        ${data.percentage}%;
                    "
                ></div>

            </div>


            <p>
                Questions studied:
                ${data.known + data.revision}
                out of
                ${data.total}
            </p>


            <hr>


            <h3>
                🏆 Mastery:
                ${data.masteryPercentage || 0}%
            </h3>


            <div class="progress-bar">

                <div
                    class="progress-fill mastery-fill"
                    style="
                        width:
                        ${data.masteryPercentage || 0}%;
                    "
                ></div>

            </div>


            <p>
                Questions confidently known:
                ${data.known}
            </p>

        `;


    } catch (error) {

        console.error(
            "Progress Load Error:",
            error
        );

    }

}


// ================================================
// LOAD PYQ LIBRARY
// SUBJECT + YEAR FILTER
// ================================================

async function loadPYQLibrary() {

    const container =
        document.getElementById(
            "subjectsContainer"
        );

    container.innerHTML = `

        <button id="backFromPYQ">
            ← Back to Subjects
        </button>

        <h2>
            📚 PYQ Library
        </h2>

        <div>

            <label>
                📚 Subject:
            </label>

            <select id="pyqSubjectFilter">

                <option value="">
                    All Subjects
                </option>

            </select>

        </div>

        <br>

        <div>

            <label>
                📅 Year:
            </label>

            <select id="pyqYearFilter">

                <option value="">
                    All Years
                </option>

            </select>

        </div>

        <br>

        <div>

            <label>
                🗓 Exam Month:
            </label>

            <select id="pyqMonthFilter">

                <option value="">
                    All Months
                </option>

            </select>

        </div>

        <br>

        <div>

            <label>
                📖 Solution:
            </label>

            <select id="pyqSolutionFilter">

                <option value="">
                    All Papers
                </option>

                <option value="true">
                    ✅ Solution Available
                </option>

                <option value="false">
                    📄 Solution Not Available
                </option>

            </select>

        </div>

        <br>

        <button id="searchPYQButton">

            🔍 SEARCH

        </button>

        <button id="clearPYQButton">

            ♻ Clear Filters

        </button>

        <hr>

        <div id="pyqResults">

            <p>
                Loading question papers...
            </p>

        </div>

    `;

    try {

        const response =
            await fetch(
                `${API_URL}/api/question-papers`
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load PYQ papers"
            );

        }

        const papers =
            await response.json();

        const subjectFilter =
            document.getElementById(
                "pyqSubjectFilter"
            );

        const yearFilter =
            document.getElementById(
                "pyqYearFilter"
            );

        const monthFilter =
            document.getElementById(
                "pyqMonthFilter"
            );

        const solutionFilter =
            document.getElementById(
                "pyqSolutionFilter"
            );

        // ====================================
        // LOAD SUBJECT FILTER
        // ====================================

        const subjectMap = new Map();

        papers.forEach((paper) => {

            if (
                paper.subject_id &&
                !subjectMap.has(
                    String(paper.subject_id)
                )
            ) {

                subjectMap.set(
                    String(paper.subject_id),
                    paper.subject_name
                );

            }

        });

        Array.from(subjectMap.entries())
            .sort((a, b) =>
                a[1].localeCompare(b[1])
            )
            .forEach(([id, name]) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value = id;
                option.textContent = name;

                subjectFilter.appendChild(
                    option
                );

            });

        // ====================================
        // LOAD YEAR FILTER
        // ====================================

        const years = [
            ...new Set(
                papers
                    .map(
                        (paper) =>
                            paper.exam_year
                    )
                    .filter(Boolean)
            )
        ];

        years.sort(
            (a, b) => b - a
        );

        years.forEach((year) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value = year;
            option.textContent = year;

            yearFilter.appendChild(
                option
            );

        });

        // ====================================
        // LOAD MONTH FILTER
        // ====================================

        const months = [
            ...new Set(
                papers
                    .map(
                        (paper) =>
                            paper.exam_month
                    )
                    .filter(Boolean)
            )
        ];

        const monthOrder = {
            "March": 1,
            "July": 2,
            "October": 3,
            "November": 4,
            "December": 5
        };

        months.sort((a, b) => {

            const orderA =
                monthOrder[a] || 99;

            const orderB =
                monthOrder[b] || 99;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            return String(a).localeCompare(
                String(b)
            );

        });

        months.forEach((month) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value = month;
            option.textContent = month;

            monthFilter.appendChild(
                option
            );

        });

        // ====================================
        // DISPLAY PAPERS
        // ====================================

        function displayPapers(
            filteredPapers
        ) {

            const results =
                document.getElementById(
                    "pyqResults"
                );

            results.innerHTML = "";

            if (
                filteredPapers.length === 0
            ) {

                results.innerHTML = `

                    <p>
                        ❌ No question papers found.
                    </p>

                `;

                return;

            }

            filteredPapers.forEach(
                (paper) => {

                    const paperBox =
                        document.createElement(
                            "div"
                        );

                    paperBox.className =
                        "question-box";

                    const questionCount =
                        Number(
                            paper.question_count
                        ) || 0;

                    paperBox.innerHTML = `

                        <h3>
                            📘 ${paper.subject_name}
                        </h3>

                        <p>
                            📅 Year:
                            <strong>
                                ${paper.exam_year}
                            </strong>
                        </p>

                        <p>
                            🗓 Exam:
                            ${paper.exam_month || "—"}
                        </p>

                        <p>
                            📄
                            ${paper.paper_type || "Question Paper"}
                        </p>

                        <p>
                            ${
                                paper.has_solution
                                ? "✅ Solution Available"
                                : "📄 Solution Not Available"
                            }
                        </p>

                        <p>
                            📝 Questions in 10th PASS MASTER:
                            <strong>
                                ${questionCount}
                            </strong>
                        </p>

                        <br>

                        <button
                            class="practice-pyq-button"
                            ${
                                questionCount === 0
                                    ? "disabled"
                                    : ""
                            }
                        >

                            ${
                                questionCount === 0
                                    ? "⏳ Questions Not Added Yet"
                                    : "▶ Start PYQ Practice"
                            }

                        </button>

                        <button class="open-paper-button">

                            📖 Open Original Paper

                        </button>

                    `;

                    // ====================================
                    // PRACTICE BUTTON
                    // ====================================

                    const practiceButton =
                        paperBox.querySelector(
                            ".practice-pyq-button"
                        );

                    practiceButton.addEventListener(
                        "click",
                        () => {

                            if (
                                questionCount === 0
                            ) {

                                alert(
                                    "Questions for this paper have not yet been added to 10th PASS MASTER."
                                );

                                return;

                            }

                            loadPYQQuestions(
                                paper
                            );

                        }
                    );

                    // ====================================
                    // OPEN ORIGINAL PAPER
                    // ====================================

                    const openButton =
                        paperBox.querySelector(
                            ".open-paper-button"
                        );

                    openButton.addEventListener(
                        "click",
                        () => {

                            if (
                                paper.source_url
                            ) {

                                window.open(
                                    paper.source_url,
                                    "_blank"
                                );

                            } else {

                                alert(
                                    "Source link is not available."
                                );

                            }

                        }
                    );

                    results.appendChild(
                        paperBox
                    );

                }
            );

        }

        // ====================================
        // APPLY FILTERS
        // ====================================

        function applyPYQFilters() {

            const selectedSubject =
                subjectFilter.value;

            const selectedYear =
                yearFilter.value;

            const selectedMonth =
                monthFilter.value;

            const selectedSolution =
                solutionFilter.value;

            const filtered =
                papers.filter(
                    (paper) => {

                        const subjectMatch =
                            !selectedSubject ||
                            String(
                                paper.subject_id
                            ) ===
                            String(
                                selectedSubject
                            );

                        const yearMatch =
                            !selectedYear ||
                            String(
                                paper.exam_year
                            ) ===
                            String(
                                selectedYear
                            );

                        const monthMatch =
                            !selectedMonth ||
                            String(
                                paper.exam_month || ""
                            ) ===
                            String(
                                selectedMonth
                            );

                        const solutionMatch =
                            !selectedSolution ||
                            String(
                                Boolean(
                                    paper.has_solution
                                )
                            ) ===
                            selectedSolution;

                        return (
                            subjectMatch &&
                            yearMatch &&
                            monthMatch &&
                            solutionMatch
                        );

                    }
                );

            displayPapers(
                filtered
            );

        }

        // ====================================
        // SEARCH
        // ====================================

        document
            .getElementById(
                "searchPYQButton"
            )
            .addEventListener(
                "click",
                applyPYQFilters
            );

        // ====================================
        // CLEAR FILTERS
        // ====================================

        document
            .getElementById(
                "clearPYQButton"
            )
            .addEventListener(
                "click",
                () => {

                    subjectFilter.value = "";
                    yearFilter.value = "";
                    monthFilter.value = "";
                    solutionFilter.value = "";

                    displayPapers(
                        papers
                    );

                }
            );

        // Show all papers initially

        displayPapers(
            papers
        );

        // ====================================
        // BACK BUTTON
        // ====================================

        document
            .getElementById(
                "backFromPYQ"
            )
            .addEventListener(
                "click",
                loadSubjects
            );

    } catch (error) {

        console.error(
            "PYQ Library Error:",
            error
        );

        container.innerHTML = `

            <button id="backFromPYQ">
                ← Back to Subjects
            </button>

            <h2>
                📚 PYQ Library
            </h2>

            <p>
                ❌ Unable to load PYQ Library.
            </p>

        `;

        document
            .getElementById(
                "backFromPYQ"
            )
            .addEventListener(
                "click",
                loadSubjects
            );

    }

}


// ================================================
// LOAD QUESTIONS BY PYQ PAPER
// ================================================

async function loadPYQQuestions(
    paper
) {

    const container =
        document.getElementById(
            "subjectsContainer"
        );


    container.innerHTML = `

        <button id="backToPYQLibrary">
            ← Back to PYQ Library
        </button>


        <h2>
            📚 ${paper.subject_name}
        </h2>


        <h3>
            📅 ${paper.exam_year}
            ${paper.exam_month || ""}
        </h3>


        <p>
            PYQ Questions loading...
        </p>

    `;


    try {

        const response =
            await fetch(

                `${API_URL}/api/question-papers/${paper.id}/questions`

            );


        if (!response.ok) {

            throw new Error(
                "Unable to load PYQ questions"
            );

        }


        const questions =
            await response.json();


        container.innerHTML = `

            <button id="backToPYQLibrary">
                ← Back to PYQ Library
            </button>


            <h2>
                📚 ${paper.subject_name}
            </h2>


            <h3>
                📅 ${paper.exam_year}
                ${paper.exam_month || ""}
            </h3>


            <p>
                📝 Total PYQ Questions:
                <strong>
                    ${questions.length}
                </strong>
            </p>

        `;


        if (questions.length === 0) {

            container.innerHTML += `

                <div class="question-box">

                    <h3>
                        📚 Questions Not Added Yet
                    </h3>

                    <p>
                        This question paper is available
                        in the PYQ Library, but its questions
                        have not yet been added to
                        10th PASS MASTER.
                    </p>

                    <p>
                        You can still open the original paper
                        using the button below.
                    </p>

                    <br>

                    <button id="openOriginalPYQ">

                        📖 Open Original Paper

                    </button>

                </div>

            `;


            document
                .getElementById(
                    "openOriginalPYQ"
                )
                .addEventListener(
                    "click",
                    () => {

                        if (
                            paper.source_url
                        ) {

                            window.open(
                                paper.source_url,
                                "_blank"
                            );

                        }

                    }
                );

        }

        else {

            questions.forEach(
                (question, index) => {

                    const questionBox =
                        document.createElement(
                            "div"
                        );


                    questionBox.className =
                        "question-box";


                    questionBox.innerHTML = `

                        <h3>
                            PYQ Question
                            ${index + 1}
                        </h3>


                        <p>
                            <strong>
                                ${question.question_text}
                            </strong>
                        </p>


                        <p>
                            📖 Chapter:
                            ${question.chapter_number} -
                            ${question.chapter_name}
                        </p>


                        <p>
                            🔢 Marks:
                            ${question.marks}
                        </p>


                        <button class="pyq-hint-button">

                            💡 Show Hint

                        </button>


                        <div
                            class="pyq-hint-content"
                            style="display:none;"
                        >

                            <p>
                                ${
                                    question.hint ||
                                    "No hint available."
                                }
                            </p>

                        </div>


                        <button class="pyq-answer-button">

                            👁 Show Easy Answer

                        </button>


                        <div
                            class="pyq-answer-content"
                            style="display:none;"
                        >

                            <p>
                                ${
                                    question.easy_answer ||
                                    "Answer not available."
                                }
                            </p>


                            <p>

                                <strong>
                                    Keywords:
                                </strong>

                                ${
                                    question.keywords ||
                                    ""
                                }

                            </p>

                        </div>


                        <br><br>


                        <button class="pyq-know-button">

                            👍 I Know This

                        </button>


                        <button class="pyq-revision-button">

                            🔄 Need Revision

                        </button>

                    `;


                    // ====================================
                    // HINT
                    // ====================================

                    const hintButton =
                        questionBox.querySelector(
                            ".pyq-hint-button"
                        );


                    const hintContent =
                        questionBox.querySelector(
                            ".pyq-hint-content"
                        );


                    hintButton.addEventListener(
                        "click",
                        () => {

                            hintContent.style.display =
                                hintContent.style.display ===
                                "none"
                                    ? "block"
                                    : "none";

                        }
                    );


                    // ====================================
                    // ANSWER
                    // ====================================

                    const answerButton =
                        questionBox.querySelector(
                            ".pyq-answer-button"
                        );


                    const answerContent =
                        questionBox.querySelector(
                            ".pyq-answer-content"
                        );


                    answerButton.addEventListener(
                        "click",
                        () => {

                            answerContent.style.display =
                                answerContent.style.display ===
                                "none"
                                    ? "block"
                                    : "none";

                        }
                    );


                    // ====================================
                    // I KNOW THIS
                    // ====================================

                    const knowButton =
                        questionBox.querySelector(
                            ".pyq-know-button"
                        );


                    knowButton.addEventListener(
                        "click",
                        async () => {

                            const result =
                                await saveProgress(
                                    question.id,
                                    "known"
                                );


                            if (result) {

                                alert(
                                    "Excellent! PYQ question marked as known."
                                );

                            }

                        }
                    );


                    // ====================================
                    // NEED REVISION
                    // ====================================

                    const revisionButton =
                        questionBox.querySelector(
                            ".pyq-revision-button"
                        );


                    revisionButton.addEventListener(
                        "click",
                        async () => {

                            const result =
                                await saveProgress(
                                    question.id,
                                    "revision"
                                );


                            if (result) {

                                alert(
                                    "PYQ question added to revision list."
                                );

                            }

                        }
                    );


                    container.appendChild(
                        questionBox
                    );

                }
            );

        }


        document
            .getElementById(
                "backToPYQLibrary"
            )
            .addEventListener(
                "click",
                loadPYQLibrary
            );


    } catch (error) {

        console.error(
            "PYQ Questions Error:",
            error
        );


        container.innerHTML = `

            <button id="backToPYQLibrary">
                ← Back to PYQ Library
            </button>

            <h2>
                📚 ${paper.subject_name}
            </h2>

            <p>
                ❌ Unable to load PYQ questions.
            </p>

        `;


        document
            .getElementById(
                "backToPYQLibrary"
            )
            .addEventListener(
                "click",
                loadPYQLibrary
            );

    }

}


// ================================================
// CHECK SAVED STUDENT
// ================================================

function checkSavedStudent() {

    const savedStudentId =
        localStorage.getItem(
            "studentId"
        );


    const savedStudentName =
        localStorage.getItem(
            "studentName"
        );


    if (
        savedStudentId &&
        savedStudentName
    ) {

        currentStudentId =
            savedStudentId;


        currentStudentName =
            savedStudentName;


        document
            .getElementById(
                "welcomeMessage"
            )
            .innerText =
            `Welcome back, ${currentStudentName}! 👋`;


        document
            .getElementById(
                "studentSection"
            )
            .style.display =
            "none";


        document
            .getElementById(
                "logoutButton"
            )
            .style.display =
            "inline-block";


        loadSubjects();

        loadStudentProgress();

    }

}


// ================================================
// LOGOUT
// ================================================

function logoutStudent() {
    document.getElementById("navLogoutButton")?.style && (document.getElementById("navLogoutButton").style.display = "none");


    localStorage.removeItem(
        "studentId"
    );


    localStorage.removeItem(
        "studentName"
    );


    localStorage.removeItem(
        "studentMobile"
    );


    currentStudentId = null;

    currentStudentName = null;


    document
        .getElementById(
            "welcomeMessage"
        )
        .innerText = "";


    document
        .getElementById(
            "logoutButton"
        )
        .style.display =
        "none";


    document
        .getElementById(
            "studentSection"
        )
        .style.display =
        "block";


    document
        .getElementById(
            "studentName"
        )
        .value = "";


    document
        .getElementById(
            "studentMobile"
        )
        .value = "";


    document
        .getElementById(
            "studentMessage"
        )
        .innerText = "";


    document
        .getElementById(
            "subjectsContainer"
        )
        .innerHTML = `

            <p>
                Please enter your name
                and mobile number
                to start studying.
            </p>

        `;

}


// ================================================
// STAGE 8 STEP 3 - TODAY'S 10 PRACTICE MODE
// ================================================

let dailyPracticeSession = null;
let dailyPracticeQuestions = [];
let dailyPracticeIndex = 0;
let dailyPracticeAnswered = false;

function dailyPracticeEscape(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function loadDailyPracticeSession(autoStart = false) {
    const container = document.getElementById("subjectsContainer");

    if (!currentStudentId) {
        alert("Please login first.");
        return;
    }

    container.innerHTML = `
        <button id="backFromDailyPractice">← Back to Subjects</button>
        <h2>🎯 Today's 10 Questions</h2>
        <p>⏳ Checking today's practice...</p>
    `;

    try {
        const todayResponse = await fetch(
            `${API_URL}/api/students/${currentStudentId}/daily-practice/today`
        );

        if (!todayResponse.ok) {
            throw new Error("Today's practice API error");
        }

        const todayData = await todayResponse.json();

        if (todayData.has_session && todayData.session) {
            dailyPracticeSession = todayData.session;
            dailyPracticeQuestions = todayData.questions || [];

            if (dailyPracticeSession.completed_at) {
                showDailyPracticeCompleted();
                return;
            }

            showDailyPracticeDashboard();
            return;
        }

        showDailyPracticeStartScreen();
    } catch (error) {
        console.error("Daily Practice Load Error:", error);
        container.innerHTML = `
            <button id="backFromDailyPractice">← Back to Subjects</button>
            <h2>🎯 Today's 10 Questions</h2>
            <p>❌ Unable to load today's practice.</p>
        `;
    }

    const backButton = document.getElementById("backFromDailyPractice");
    if (backButton) backButton.addEventListener("click", loadSubjects);
}

function showDailyPracticeStartScreen() {
    const container = document.getElementById("subjectsContainer");

    container.innerHTML = `
        <button id="backFromDailyPractice">← Back to Subjects</button>
        <h2>🎯 Today's 10 Questions</h2>

        <div class="question-box">
            <h3>🚀 Your Daily PASS Practice</h3>
            <p>
                10 smart questions are selected specially for you.
            </p>
            <p>
                🎯 First solve the question yourself.<br>
                💡 Then use Hint / Easy Answer.<br>
                ✅ Mark what you know or 🔄 what needs revision.
            </p>
            <p><strong>📊 Your completion will be saved automatically.</strong></p>
            <button id="startDailyPracticeButton">
                ▶ Start Today's Practice
            </button>
        </div>
    `;

    document
        .getElementById("backFromDailyPractice")
        .addEventListener("click", loadSubjects);

    document
        .getElementById("startDailyPracticeButton")
        .addEventListener("click", startDailyPractice);
}

async function startDailyPractice() {
    const container = document.getElementById("subjectsContainer");

    container.innerHTML = `
        <h2>🎯 Today's 10 Questions</h2>
        <p>⏳ Preparing your practice set...</p>
    `;

    try {
        const response = await fetch(
            `${API_URL}/api/students/${currentStudentId}/daily-practice/start`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ limit: 10 })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Unable to start practice");
        }

        dailyPracticeSession = data.session;
        dailyPracticeQuestions = data.questions || [];
        dailyPracticeIndex = 0;
        dailyPracticeAnswered = false;

        if (dailyPracticeQuestions.length === 0) {
            container.innerHTML = `
                <button id="backFromDailyPractice">← Back to Subjects</button>
                <h2>🎯 Today's 10 Questions</h2>
                <div class="question-box">
                    <h3>📚 Questions Coming Soon</h3>
                    <p>No active questions are available yet.</p>
                </div>
            `;
            document
                .getElementById("backFromDailyPractice")
                .addEventListener("click", loadSubjects);
            return;
        }

        renderDailyPracticeQuestion();
    } catch (error) {
        console.error("Start Daily Practice Error:", error);
        container.innerHTML = `
            <button id="backFromDailyPractice">← Back to Subjects</button>
            <h2>🎯 Today's 10 Questions</h2>
            <p>❌ ${dailyPracticeEscape(error.message)}</p>
        `;
        document
            .getElementById("backFromDailyPractice")
            .addEventListener("click", loadSubjects);
    }
}

function showDailyPracticeDashboard() {
    const container = document.getElementById("subjectsContainer");
    const total = Number(dailyPracticeSession.total_questions) || dailyPracticeQuestions.length;
    const completed = Number(dailyPracticeSession.completed_questions) || 0;
    const remaining = Math.max(total - completed, 0);

    container.innerHTML = `
        <button id="backFromDailyPractice">← Back to Subjects</button>
        <h2>🎯 Today's 10 Questions</h2>

        <div class="question-box">
            <h3>📊 Today's Progress</h3>
            <p>✅ Completed: <strong>${completed}</strong> / ${total}</p>
            <p>⏳ Remaining: <strong>${remaining}</strong></p>
            <button id="continueDailyPracticeButton">
                ▶ ${completed > 0 ? "Continue Practice" : "Start Practice"}
            </button>
        </div>
    `;

    document
        .getElementById("backFromDailyPractice")
        .addEventListener("click", loadSubjects);

    document
        .getElementById("continueDailyPracticeButton")
        .addEventListener("click", () => {
            const firstIncomplete = dailyPracticeQuestions.findIndex(
                (q) => !q.is_completed
            );
            dailyPracticeIndex = firstIncomplete >= 0 ? firstIncomplete : 0;
            dailyPracticeAnswered = false;
            renderDailyPracticeQuestion();
        });
}

function showDailyPracticeCompleted() {
    const container = document.getElementById("subjectsContainer");
    const total = Number(dailyPracticeSession?.total_questions) || 10;

    container.innerHTML = `
        <button id="backFromDailyPractice">← Back to Subjects</button>
        <div class="question-box">
            <h2>🎉 Daily Practice Completed!</h2>
            <p>🏆 You completed <strong>${total} / ${total}</strong> questions today.</p>
            <p>💪 Excellent! Come back tomorrow for a fresh PASS practice set.</p>
        </div>
    `;

    document
        .getElementById("backFromDailyPractice")
        .addEventListener("click", loadSubjects);
}

function renderDailyPracticeQuestion() {
    const container = document.getElementById("subjectsContainer");

    if (!dailyPracticeQuestions.length) {
        showDailyPracticeCompleted();
        return;
    }

    while (
        dailyPracticeIndex < dailyPracticeQuestions.length &&
        dailyPracticeQuestions[dailyPracticeIndex].is_completed
    ) {
        dailyPracticeIndex++;
    }

    if (dailyPracticeIndex >= dailyPracticeQuestions.length) {
        showDailyPracticeCompleted();
        return;
    }

    const question = dailyPracticeQuestions[dailyPracticeIndex];
    dailyPracticeAnswered = false;

    const statusText =
        question.student_status === "revision"
            ? "🔄 Revision"
            : question.student_status === "known"
                ? "✅ Known"
                : "⏳ Practice";

    const pyqText = question.pyq_year
        ? `<p>📅 PYQ Year: ${dailyPracticeEscape(question.pyq_year)}</p>`
        : "";

    const completed = Number(dailyPracticeSession.completed_questions) || 0;
    const total = Number(dailyPracticeSession.total_questions) || dailyPracticeQuestions.length;

    container.innerHTML = `
        <button id="backFromDailyPractice">← Back to Subjects</button>

        <h2>🎯 Today's 10 Questions</h2>

        <p>
            <strong>Question ${dailyPracticeIndex + 1}</strong> of ${total}
            &nbsp; | &nbsp; ✅ Completed: ${completed}/${total}
        </p>

        <div class="question-box">
            <h3>${dailyPracticeEscape(statusText)}</h3>

            <p><strong>${dailyPracticeEscape(question.question_text)}</strong></p>

            <p>📚 Subject: ${dailyPracticeEscape(question.subject_name || "—")}</p>
            <p>
                📖 Chapter ${dailyPracticeEscape(question.chapter_number)}:
                ${dailyPracticeEscape(question.chapter_name)}
            </p>
            <p>🔢 Marks: ${dailyPracticeEscape(question.marks)}</p>
            ${pyqText}

            <button id="dailyPracticeHintButton">💡 Show Hint</button>
            <div id="dailyPracticeHint" style="display:none;">
                <p>${dailyPracticeEscape(question.hint || "No hint available.")}</p>
            </div>

            <button id="dailyPracticeAnswerButton">👁 Show Easy Answer</button>
            <div id="dailyPracticeAnswer" style="display:none;">
                <p>${dailyPracticeEscape(question.easy_answer || "Answer not available.")}</p>
                <p><strong>Keywords:</strong> ${dailyPracticeEscape(question.keywords || "")}</p>
            </div>

            <br><br>

            <button id="dailyPracticeKnowButton">👍 I Know This</button>
            <button id="dailyPracticeRevisionButton">🔄 Need Revision</button>

            <p id="dailyPracticeActionMessage"></p>

            <button id="dailyPracticeNextButton" disabled>
                ➡ Complete & Next
            </button>
        </div>
    `;

    document
        .getElementById("backFromDailyPractice")
        .addEventListener("click", loadSubjects);

    document
        .getElementById("dailyPracticeHintButton")
        .addEventListener("click", () => {
            const el = document.getElementById("dailyPracticeHint");
            el.style.display = el.style.display === "none" ? "block" : "none";
        });

    document
        .getElementById("dailyPracticeAnswerButton")
        .addEventListener("click", () => {
            const el = document.getElementById("dailyPracticeAnswer");
            el.style.display = el.style.display === "none" ? "block" : "none";
        });

    document
        .getElementById("dailyPracticeKnowButton")
        .addEventListener("click", async () => {
            await markDailyPracticeAnswer(question, "known");
        });

    document
        .getElementById("dailyPracticeRevisionButton")
        .addEventListener("click", async () => {
            await markDailyPracticeAnswer(question, "revision");
        });

    document
        .getElementById("dailyPracticeNextButton")
        .addEventListener("click", completeDailyPracticeQuestion);
}

async function markDailyPracticeAnswer(question, status) {
    const message = document.getElementById("dailyPracticeActionMessage");
    const nextButton = document.getElementById("dailyPracticeNextButton");

    message.innerText = "⏳ Saving...";

    const result = await saveProgress(question.question_id || question.id, status);

    if (!result) {
        message.innerText = "❌ Unable to save your answer.";
        return;
    }

    dailyPracticeAnswered = true;

    const knowButton = document.getElementById("dailyPracticeKnowButton");
    const revisionButton = document.getElementById("dailyPracticeRevisionButton");

    knowButton.disabled = true;
    revisionButton.disabled = true;

    if (status === "known") {
        knowButton.innerText = "✅ Saved as Known";
        message.innerText = "✅ Great! This question is marked as Known.";
    } else {
        revisionButton.innerText = "🔄 Added to Revision";
        message.innerText = "🔄 Good. We will remember this for revision.";
    }

    nextButton.disabled = false;
}

async function completeDailyPracticeQuestion() {
    if (!dailyPracticeAnswered) return;

    const question = dailyPracticeQuestions[dailyPracticeIndex];
    const nextButton = document.getElementById("dailyPracticeNextButton");

    nextButton.disabled = true;
    nextButton.innerText = "⏳ Saving...";

    try {
        const response = await fetch(
            `${API_URL}/api/students/${currentStudentId}/daily-practice/${dailyPracticeSession.id}/complete`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question_id: question.question_id
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Unable to save completion");
        }

        dailyPracticeSession = data.session;
        question.is_completed = true;

        if (data.daily_completed) {
            showDailyPracticeCompleted();
            return;
        }

        dailyPracticeIndex++;
        renderDailyPracticeQuestion();
    } catch (error) {
        console.error("Daily Practice Completion Error:", error);
        const message = document.getElementById("dailyPracticeActionMessage");
        message.innerText = "❌ " + error.message;
        nextButton.disabled = false;
        nextButton.innerText = "➡ Complete & Next";
    }
}

// Backward-compatible entry point for the existing button.
async function loadDailyQuestions() {
    await loadDailyPracticeSession();
}

// ================================================
// CREATE TODAY'S 10 BUTTON
// ================================================

function setupDailyQuestionsButton() {

    if (document.getElementById("dailyQuestionsButton")) {
        return;
    }

    const pyqButton =
        document.getElementById("pyqLibraryButton");

    const revisionButton =
        document.getElementById("myRevisionButton");

    if (!pyqButton && !revisionButton) {
        return;
    }

    const button = document.createElement("button");

    button.id = "dailyQuestionsButton";
    button.innerText = "🎯 Today's 10 Questions";

    button.style.marginTop = "10px";
    button.style.marginLeft = "5px";
    button.style.marginRight = "5px";

    button.addEventListener(
        "click",
        loadDailyQuestions
    );

    if (pyqButton) {
        pyqButton.insertAdjacentElement(
            "afterend",
            button
        );
    } else {
        revisionButton.insertAdjacentElement(
            "afterend",
            button
        );
    }
}



// ================================================
// STAGE 8 STEP 6 — DAILY STREAK
// ================================================

async function loadDailyStreak() {
    const container = document.getElementById("subjectsContainer");

    if (!currentStudentId) {
        if (container) {
            container.innerHTML = `
                <h2>🔥 Daily Streak</h2>
                <p>पहिले Student Login / Registration करा.</p>
            `;
        }
        return;
    }

    if (!container) return;

    container.innerHTML = `
        <div style="text-align:center;">
            <h2>🔥 Daily Streak</h2>
            <p>⏳ तुमचा अभ्यास streak तपासत आहे...</p>
        </div>
    `;

    try {
        const response = await fetch(
            `${API_URL}/api/students/${currentStudentId}/daily-streak`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Daily Streak API error");
        }

        const dayNames = ["आज", "काल", "-2 दिवस", "-3 दिवस", "-4 दिवस", "-5 दिवस", "-6 दिवस"];

        const activityHTML = (data.last7Days || []).map((day, index) => `
            <div style="display:inline-block; min-width:72px; margin:5px; padding:10px; border:1px solid #ccc; border-radius:8px;">
                <div>${dayNames[index]}</div>
                <div style="font-size:24px; margin-top:4px;">${day.completed ? "🔥" : "⚪"}</div>
            </div>
        `).join("");

        let motivation = "आजची Today's 10 Questions Practice पूर्ण करा आणि streak सुरू करा! 💪";

        if (data.currentStreak >= 30) {
            motivation = "🏆 30+ दिवसांचा जबरदस्त streak! तुम्ही PASS MASTER बनत आहात!";
        } else if (data.currentStreak >= 15) {
            motivation = "🌟 15 दिवस पूर्ण! तुमची consistency खूप छान आहे.";
        } else if (data.currentStreak >= 7) {
            motivation = "🔥 7 दिवसांचा streak! आता तो 15 दिवसांपर्यंत घेऊन चला.";
        } else if (data.currentStreak > 0) {
            motivation = "👏 छान सुरुवात! आजचा अभ्यास पूर्ण करून streak टिकवा.";
        }

        container.innerHTML = `
            <div style="text-align:center;">
                <h2>🔥 Daily Streak</h2>

                <div style="padding:18px; margin:12px 0; border:2px solid #ccc; border-radius:12px;">
                    <div style="font-size:42px;">🔥</div>
                    <h1 style="margin:5px 0;">${data.currentStreak} Days</h1>
                    <p><strong>Current Streak</strong></p>
                </div>

                <p>🏆 Longest Streak: <strong>${data.longestStreak} Days</strong></p>
                <p>📚 Total Completed Practice Days: <strong>${data.totalPracticeDays}</strong></p>
                <p>📅 Last Completed: <strong>${data.lastCompletedDate || "अजून नाही"}</strong></p>

                <hr>
                <h3>📆 Last 7 Days</h3>
                <div>${activityHTML}</div>

                <p style="margin-top:18px;"><strong>${motivation}</strong></p>

                <button id="streakDailyPracticeButton">🎯 Today's 10 Questions</button>
                <button id="streakSmartRevisionButton">🧠 Smart Revision</button>
            </div>
        `;

        document
            .getElementById("streakDailyPracticeButton")
            .addEventListener("click", loadDailyQuestions);

        document
            .getElementById("streakSmartRevisionButton")
            .addEventListener("click", loadSmartRevision);

    } catch (error) {
        console.error("Daily Streak Error:", error);

        container.innerHTML = `
            <h2>🔥 Daily Streak</h2>
            <p>❌ Daily Streak load झाला नाही.</p>
            <p>${dailyPracticeEscape(error.message)}</p>
        `;
    }
}

// ================================================
// STAGE 8 STEP 5 — SMART REVISION
// ================================================

async function loadSpacedRevision() {
    if (!currentStudentId) return;
    const container = document.getElementById("subjectsContainer");
    if (!container) return;
    container.innerHTML = `<h2>⏰ Revision Due Today</h2><p>तुमचे revision questions तपासत आहे...</p>`;
    try {
        const response = await fetch(`${API_URL}/api/students/${currentStudentId}/spaced-revision`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Spaced Revision API error");
        const card = q => `<div class="question-box" style="margin:12px 0;">
            <h3>📘 ${dailyPracticeEscape(q.subject_name)} — Ch.${dailyPracticeEscape(q.chapter_number)} ${dailyPracticeEscape(q.chapter_name)}</h3>
            <p><strong>Question:</strong> ${dailyPracticeEscape(q.question_text)}</p>
            <p>⭐ ${dailyPracticeEscape(q.marks)} marks &nbsp; | &nbsp; ${dailyPracticeEscape(q.difficulty || "")}</p>
            <button class="spaced-answer-btn">📝 Easy Answer</button>
            <div class="spaced-answer" style="display:none;margin-top:8px;padding:10px;border:1px solid #ccc;border-radius:8px;">${dailyPracticeEscape(q.easy_answer || "Easy Answer उपलब्ध नाही.")}</div>
            <button class="spaced-known-btn" data-id="${Number(q.id)}">✅ I Know This</button>
            <button class="spaced-revision-btn" data-id="${Number(q.id)}">🔄 Revise Again</button>
        </div>`;
        container.innerHTML = `<h2>⏰ Revision Due Today</h2>
            <p><strong>🔄 Revision Queue:</strong> ${Number(data.revisionCount)||0} &nbsp; | &nbsp; <strong>⏰ Due Today:</strong> ${Number(data.dueCount)||0}</p>
            <p>${dailyPracticeEscape(data.message||"")}</p>
            ${data.due?.length ? data.due.map(card).join("") : `<div class="question-box"><h3>🎉 आज revision due नाही!</h3><p>नवीन questions शिका आणि Need Revision mark करा.</p></div>`}
            ${data.upcoming?.length ? `<hr><h3>📅 Upcoming Revision</h3><ul>${data.upcoming.map(q=>`<li>📘 ${dailyPracticeEscape(q.subject_name)} — ${dailyPracticeEscape(q.chapter_name)} — <strong>${new Date(q.nextReviewAt).toLocaleDateString()}</strong></li>`).join("")}</ul>` : ""}
            <button id="spacedBackDashboard">← Back to Dashboard</button>`;
        container.querySelectorAll(".spaced-answer-btn").forEach(b=>b.addEventListener("click",()=>{const a=b.nextElementSibling;a.style.display=a.style.display==='none'?'block':'none';}));
        const save=(id,status)=>saveProgress(id,status).then(()=>loadSpacedRevision());
        container.querySelectorAll(".spaced-known-btn").forEach(b=>b.addEventListener("click",()=>save(Number(b.dataset.id),"known")));
        container.querySelectorAll(".spaced-revision-btn").forEach(b=>b.addEventListener("click",()=>save(Number(b.dataset.id),"revision")));
        document.getElementById("spacedBackDashboard")?.addEventListener("click",loadStudentDashboard);
    } catch(e){
        console.error("Spaced Revision Error",e);
        container.innerHTML=`<h2>⏰ Revision Due Today</h2><p>❌ ${dailyPracticeEscape(e.message)}</p>`;
    }
}

async function loadSmartRevision() {
    if (!currentStudentId) {
        const container = document.getElementById("subjectsContainer");
        if (container) {
            container.innerHTML = `
                <h2>🧠 Smart Revision</h2>
                <p>पहिले Student Login / Registration करा.</p>
            `;
        }
        return;
    }

    const container = document.getElementById("subjectsContainer");
    if (!container) return;

    container.innerHTML = `
        <h2>🧠 Smart Revision</h2>
        <p>⏳ तुमच्यासाठी weak आणि revision questions शोधत आहे...</p>
    `;

    try {
        const response = await fetch(
            `${API_URL}/api/students/${currentStudentId}/smart-revision?limit=10`
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Smart Revision API error");
        }

        if (!data.questions || data.questions.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;">
                    <h2>🧠 Smart Revision</h2>
                    <h3>🎉 Excellent!</h3>
                    <p>सध्या Revision साठी प्रश्न उपलब्ध नाहीत.</p>
                    <p>नवीन प्रश्न अभ्यासून ते <strong>Need Revision</strong> म्हणून mark केल्यावर ते येथे दिसतील.</p>
                </div>
            `;
            return;
        }

        const questions = data.questions;
        let index = 0;

        function render() {
            const q = questions[index];
            container.innerHTML = `
                <div>
                    <h2>🧠 Smart Revision</h2>
                    <p><strong>Revision Queue:</strong> ${index + 1} / ${questions.length}</p>
                    <p>📘 ${dailyPracticeEscape(q.subject_name)} — Chapter ${dailyPracticeEscape(q.chapter_number)}: ${dailyPracticeEscape(q.chapter_name)}</p>
                    <p><strong>Question:</strong></p>
                    <div style="padding:12px; border:1px solid #ccc; border-radius:8px;">
                        ${dailyPracticeEscape(q.question_text)}
                    </div>
                    <p>⭐ ${dailyPracticeEscape(q.marks)} marks &nbsp; | &nbsp; ${dailyPracticeEscape(q.difficulty)}</p>

                    <button id="smartRevisionHintButton">💡 Hint</button>
                    <div id="smartRevisionHint" style="display:none; margin:10px 0; padding:10px; border:1px solid #ccc;">
                        ${dailyPracticeEscape(q.hint || "Hint उपलब्ध नाही.")}
                    </div>

                    <button id="smartRevisionAnswerButton">📝 Easy Answer</button>
                    <div id="smartRevisionAnswer" style="display:none; margin:10px 0; padding:10px; border:1px solid #ccc;">
                        ${dailyPracticeEscape(q.easy_answer || "Easy Answer उपलब्ध नाही.")}
                    </div>

                    <hr>
                    <button id="smartRevisionKnowButton">✅ I Know This</button>
                    <button id="smartRevisionRevisionButton">🔄 Need Revision</button>
                    <button id="smartRevisionNextButton">➡ Next</button>
                    <p id="smartRevisionMessage"></p>
                </div>
            `;

            const hintButton = document.getElementById("smartRevisionHintButton");
            const hint = document.getElementById("smartRevisionHint");
            hintButton.addEventListener("click", () => {
                hint.style.display = hint.style.display === "none" ? "block" : "none";
            });

            const answerButton = document.getElementById("smartRevisionAnswerButton");
            const answer = document.getElementById("smartRevisionAnswer");
            answerButton.addEventListener("click", () => {
                answer.style.display = answer.style.display === "none" ? "block" : "none";
            });

            document.getElementById("smartRevisionKnowButton").addEventListener("click", async () => {
                await saveSmartRevisionStatus(q, "known");
            });

            document.getElementById("smartRevisionRevisionButton").addEventListener("click", async () => {
                await saveSmartRevisionStatus(q, "revision");
            });

            document.getElementById("smartRevisionNextButton").addEventListener("click", () => {
                if (index < questions.length - 1) {
                    index++;
                    render();
                } else {
                    container.innerHTML = `
                        <div style="text-align:center;">
                            <h2>🧠 Smart Revision Complete</h2>
                            <h3>🎉 आजची revision queue पूर्ण झाली!</h3>
                            <p>आता PASS Readiness पाहा किंवा Today's 10 Questions करा.</p>
                            <button id="smartRevisionReadinessButton">🏆 PASS Readiness</button>
                        </div>
                    `;
                    document.getElementById("smartRevisionReadinessButton")
                        .addEventListener("click", loadPassReadiness);
                }
            });
        }

        async function saveSmartRevisionStatus(q, status) {
            const message = document.getElementById("smartRevisionMessage");
            const knowButton = document.getElementById("smartRevisionKnowButton");
            const revisionButton = document.getElementById("smartRevisionRevisionButton");

            knowButton.disabled = true;
            revisionButton.disabled = true;
            message.innerText = "⏳ Saving...";

            const saved = await saveProgress(q.id, status);
            if (!saved) {
                knowButton.disabled = false;
                revisionButton.disabled = false;
                message.innerText = "❌ Save झाले नाही. पुन्हा प्रयत्न करा.";
                return;
            }

            if (status === "known") {
                message.innerText = "✅ Great! हा प्रश्न Known मध्ये गेला.";
            } else {
                message.innerText = "🔄 हा प्रश्न पुन्हा Revision साठी ठेवला आहे.";
            }
        }

        render();
    } catch (error) {
        console.error("Smart Revision Error:", error);
        container.innerHTML = `
            <h2>🧠 Smart Revision</h2>
            <p>❌ Smart Revision load झाला नाही.</p>
            <p>${dailyPracticeEscape(error.message)}</p>
        `;
    }
}

// ================================================
// STAGE 8 STEP 4 — PASS READINESS
// ================================================

async function loadPassReadiness() {
    if (!currentStudentId) {
        const container = document.getElementById("subjectsContainer");
        if (container) {
            container.innerHTML = `
                <h2>🏆 PASS Readiness</h2>
                <p>पहिले Student Login / Registration करा.</p>
            `;
        }
        return;
    }

    const container = document.getElementById("subjectsContainer");
    if (!container) return;

    container.innerHTML = `
        <h2>🏆 PASS Readiness</h2>
        <p>⏳ तुमचा PASS Readiness Score तयार होत आहे...</p>
    `;

    try {
        const response = await fetch(
            `${API_URL}/api/students/${currentStudentId}/pass-readiness`
        );

        if (!response.ok) {
            throw new Error("PASS Readiness API error");
        }

        const data = await response.json();
        const score = Number(data.score) || 0;
        const scoreText = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";

        container.innerHTML = `
            <div style="text-align:center;">
                <h2>🏆 PASS Readiness</h2>
                <h1 style="font-size:48px; margin:10px 0;">
                    ${scoreText} ${score}%
                </h1>
                <h3>${dailyPracticeEscape(data.level)}</h3>
                <p>${dailyPracticeEscape(data.message)}</p>
            </div>

            <hr>

            <h3>📊 Score Details</h3>

            <p>✅ Mastery: <strong>${data.masteryPercentage}%</strong></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${data.masteryPercentage}%;"></div>
            </div>

            <p>📚 Study Coverage: <strong>${data.coveragePercentage}%</strong></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${data.coveragePercentage}%;"></div>
            </div>

            <p>📝 PYQ Mastery: <strong>${data.pyqPercentage}%</strong></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${data.pyqPercentage}%;"></div>
            </div>

            <p>🎯 Today's Practice: <strong>${data.dailyPercentage}%</strong></p>
            <div class="progress-bar">
                <div class="progress-fill" style="width:${data.dailyPercentage}%;"></div>
            </div>

            <hr>

            <p>📚 Total Questions: <strong>${data.total}</strong></p>
            <p>✅ Known: <strong>${data.known}</strong></p>
            <p>🔄 Revision: <strong>${data.revision}</strong></p>
            <p>⏳ Not Started: <strong>${data.notStarted}</strong></p>
            <p>📝 PYQ Known: <strong>${data.pyqKnown} / ${data.pyqTotal}</strong></p>
            <p>🎯 Today's Practice: <strong>${data.dailyCompleted} / ${data.dailyTotal}</strong></p>

            <hr>

            <p><strong>Score formula:</strong> Mastery 50% + Coverage 25% + PYQ 15% + Daily Practice 10%.</p>
        `;
    } catch (error) {
        console.error("PASS Readiness Error:", error);
        container.innerHTML = `
            <h2>🏆 PASS Readiness</h2>
            <p>❌ PASS Readiness Score load झाला नाही.</p>
            <p>${dailyPracticeEscape(error.message)}</p>
        `;
    }
}


// ================================================
// STAGE 9 STEP 6 — STUDENT ACHIEVEMENTS / BADGES
// ================================================

async function loadStudentAchievements() {
    const container = document.getElementById("subjectsContainer");
    if (!container) return;

    if (!currentStudentId) {
        container.innerHTML = `
            <h2>🏆 Achievements</h2>
            <p>पहिले Student Login / Registration करा.</p>
        `;
        return;
    }

    container.innerHTML = `
        <h2>🏆 My Achievements</h2>
        <p>⏳ तुमचे Badges तयार होत आहेत...</p>
    `;

    try {
        const response = await fetch(
            `${API_URL}/api/students/${currentStudentId}/achievements`
        );

        if (!response.ok) {
            throw new Error("Achievements API error");
        }

        const data = await response.json();
        const summary = data.summary || {};
        const badges = data.badges || [];
        const safe = value => dailyPracticeEscape(value == null ? "" : value);

        container.innerHTML = `
            <div style="text-align:center;">
                <h2>🏆 My Achievements</h2>
                <p>प्रत्येक छोट्या यशासाठी एक Badge! 💪</p>
                <p><strong>${summary.unlockedCount || 0} / ${summary.totalBadges || badges.length}</strong> Badges Unlocked</p>
            </div>

            <hr>

            <div class="question-box">
                <p>🌱 Questions Attempted: <strong>${summary.attempted || 0}</strong></p>
                <p>⭐ Questions Known: <strong>${summary.known || 0}</strong></p>
                <p>🔥 Practice Days: <strong>${summary.practiceDays || 0}</strong></p>
                <p>🏆 Mastery: <strong>${summary.masteryPercentage || 0}%</strong></p>
            </div>

            <h3>🎖️ Badges</h3>
            ${badges.map(badge => `
                <div class="question-box" style="opacity:${badge.unlocked ? "1" : "0.55"};">
                    <h3>${badge.icon} ${safe(badge.title)} ${badge.unlocked ? "✅" : "🔒"}</h3>
                    <p>${safe(badge.description)}</p>
                    <p><strong>${badge.unlocked ? "Unlocked 🎉" : "Keep Practicing 💪"}</strong></p>
                </div>
            `).join("")}

            <hr>

            <div style="text-align:center;">
                <button id="achievementDashboardButton">📊 Back to My Dashboard</button>
                <button id="achievementDailyButton">🎯 Today's 10 Questions</button>
            </div>
        `;

        document.getElementById("achievementDashboardButton")
            ?.addEventListener("click", loadStudentDashboard);
        document.getElementById("achievementDailyButton")
            ?.addEventListener("click", loadDailyQuestions);
    } catch (error) {
        console.error("Achievements Error:", error);
        container.innerHTML = `
            <h2>🏆 My Achievements</h2>
            <p>❌ Achievements load झाले नाहीत.</p>
            <p>${dailyPracticeEscape(error.message)}</p>
        `;
    }
}


// ================================================
// STAGE 9 — STUDENT DASHBOARD / COMPLETE STUDY SUMMARY
// ================================================

async function loadMockHistoryForDashboard() {
    const sid = localStorage.getItem('studentId');
    if (!sid) return [];
    try {
        const r = await fetch(`${API_URL}/api/students/${sid}/mock-test-history`);
        if (!r.ok) return [];
        return await r.json();
    } catch (e) { return []; }
}

async function loadStudentDashboard() {
    if (!currentStudentId) {
        const container = document.getElementById("subjectsContainer");
        if (container) {
            container.innerHTML = `
                <h2>📊 My Dashboard</h2>
                <p>पहिले Student Login / Registration करा.</p>
            `;
        }
        return;
    }

    const container = document.getElementById("subjectsContainer");
    if (!container) return;

    container.innerHTML = `
        <h2>📊 My Student Dashboard</h2>
        <p>⏳ तुमचा Complete Study Summary तयार होत आहे...</p>
    `;

    try {
        const [dashboardResponse, dailyResponse, improvementResponse, streakResponse, achievementResponse, weakEngineResponse, mockHistory] = await Promise.all([
            fetch(`${API_URL}/api/students/${currentStudentId}/dashboard`),
            fetch(`${API_URL}/api/students/${currentStudentId}/daily-practice/today`),
            fetch(`${API_URL}/api/students/${currentStudentId}/progress-improvement`),
            fetch(`${API_URL}/api/students/${currentStudentId}/daily-streak`),
            fetch(`${API_URL}/api/students/${currentStudentId}/achievements`),
            fetch(`${API_URL}/api/students/${currentStudentId}/weak-chapter-engine`),
            loadMockHistoryForDashboard()
        ]);

        if (!dashboardResponse.ok) throw new Error("Dashboard API error");

        const data = await dashboardResponse.json();
        const overall = data.overall || {};
        const subjectSummary = data.subjectSummary || [];
        const chapterSummary = data.chapterSummary || [];
        const weakSubjects = data.weakSubjects || [];
        const weakChapters = data.weakChapters || [];
        const dailyToday = dailyResponse.ok ? await dailyResponse.json() : null;
        const improvementData = improvementResponse.ok ? await improvementResponse.json() : null;
        const streakData = streakResponse.ok ? await streakResponse.json() : null;
        const achievementData = achievementResponse.ok ? await achievementResponse.json() : null;
        const weakEngineData = weakEngineResponse.ok ? await weakEngineResponse.json() : null;
        const weakEngineChapters = weakEngineData?.chapters || [];

        const safe = value => dailyPracticeEscape(value == null ? "" : value);
        const num = value => Number(value) || 0;
        const pct = value => Math.max(0, Math.min(100, num(value)));
        const signed = value => {
            const n = num(value);
            return n > 0 ? `+${n}` : `${n}`;
        };

        const sessionTotal = num(dailyToday?.session?.total_questions);
        const sessionCompleted = num(dailyToday?.session?.completed_questions);
        const dailyGoal = sessionTotal > 0 ? sessionTotal : Math.min(10, num(overall.total));
        const dailyCompleted = Math.min(sessionCompleted, dailyGoal);
        const dailyPercent = dailyGoal > 0 ? Math.round((dailyCompleted / dailyGoal) * 100) : 0;
        const dailyDone = dailyGoal > 0 && (dailyToday?.session?.completed_at || dailyCompleted >= dailyGoal);

        const improvement = improvementData?.improvement || {};
        const baseline = improvementData?.baseline || {};
        const current = improvementData?.current || overall;
        const baselineDate = improvementData?.baselineDate
            ? new Date(improvementData.baselineDate).toLocaleDateString()
            : "आजपासून";

        const unlocked = num(achievementData?.summary?.unlockedCount);
        const totalBadges = num(achievementData?.summary?.totalBadges) || 6;
        const currentStreak = num(streakData?.currentStreak);
        const longestStreak = num(streakData?.longestStreak);

        let nextAction = "🎉 छान! तुमची तयारी सुरू आहे. रोजचा सराव चालू ठेवा.";
        if (num(overall.notStarted) > 0) {
            nextAction = `📚 अजून ${num(overall.notStarted)} प्रश्न बाकी आहेत. प्रथम Today's 10 Questions करा.`;
        }
        if (weakChapters.length > 0) {
            nextAction = `⚡ ${safe(weakChapters[0].chapterName)} हा सध्या तुमचा सर्वात कमजोर Chapter आहे. त्याचा Practice सुरू करा.`;
        }
        if (dailyGoal > 0 && !dailyDone) {
            nextAction = `🎯 आजचे Target पूर्ण करण्यासाठी अजून ${Math.max(0, dailyGoal - dailyCompleted)} प्रश्न करा.`;
        }
        if (num(overall.masteryPercentage) >= 80 && num(overall.coveragePercentage) >= 80) {
            nextAction = "🏆 तुमची तयारी PASS Ready स्तरावर आहे. आता PYQ आणि Smart Revision वर लक्ष द्या.";
        }

        container.innerHTML = `
            <div style="text-align:center;">
                <h2>📊 ${safe(data.student?.name || "Student")} — My Dashboard</h2>
                <p>🎯 तुमची संपूर्ण PASS तयारी एका नजरेत</p>
            </div>

            <div class="question-box" style="text-align:center;">
                <h3>📌 Next Best Action</h3>
                <p><strong>${nextAction}</strong></p>
            </div>

            <hr>

            <h3>📈 Overall Progress</h3>
            <p>📚 Study Coverage: <strong>${num(overall.coveragePercentage)}%</strong></p>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct(overall.coveragePercentage)}%;"></div></div>
            <p>🏆 Mastery: <strong>${num(overall.masteryPercentage)}%</strong></p>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct(overall.masteryPercentage)}%;"></div></div>

            <!-- STEP 63 FINAL FIX: Always-visible overall PASS preparation target -->
            <div class="question-box" style="margin:18px 0;padding:16px;border:3px solid #333;border-radius:12px;background:#fff;display:block;visibility:visible;opacity:1;">
                <h2 style="margin:0 0 8px;">🎯 PASS Preparation Target</h2>
                <p style="margin:6px 0;">App cha study target: <strong>35% confident questions</strong> — हा Board च्या official passing marks चा दावा नाही.</p>
                <p style="margin:8px 0;font-size:18px;"><strong>${num(overall.known)} / ${Math.ceil(num(overall.total) * 0.35)}</strong> Known Questions</p>
                <div class="progress-bar" style="display:block;min-height:14px;"><div class="progress-fill" style="width:${pct(num(overall.total) > 0 ? Math.min(100, Math.round((num(overall.known) / Math.max(1, Math.ceil(num(overall.total) * 0.35))) * 100)) : 0)}%;"></div></div>
                <p style="margin:8px 0 0;">${num(overall.total) > 0 ? (Math.max(0, Math.ceil(num(overall.total) * 0.35) - num(overall.known)) > 0 ? `अजून <strong>${Math.max(0, Math.ceil(num(overall.total) * 0.35) - num(overall.known))}</strong> questions confidently learn करा.` : '✅ PASS preparation target पूर्ण झाला! आता Revision + PYQ + Mock Test करा.') : '📚 Questions उपलब्ध झाल्यावर PASS target येथे दिसेल.'}</p>
            </div>

            <div class="question-box">
                <p>📚 Total Questions: <strong>${num(overall.total)}</strong></p>
                <p>✅ Known: <strong>${num(overall.known)}</strong></p>
                <p>🔄 Need Revision: <strong>${num(overall.revision)}</strong></p>
                <p>⏳ Not Started: <strong>${num(overall.notStarted)}</strong></p>
                <p>📝 Attempted: <strong>${num(overall.attempted)}</strong></p>
            </div>

            <hr>

            <!-- STEP 65: STUDENT SMART STUDY HUB -->
            <div class="question-box" style="margin:18px 0;padding:16px;border:3px solid #333;border-radius:12px;background:#fff;display:block;visibility:visible;opacity:1;">
                <h2 style="margin:0 0 8px;">🚀 Smart Study Center</h2>
                <p style="margin:6px 0 12px;">Dashboard वरून आता पुढचा अभ्यासाचा मार्ग थेट निवडा:</p>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                    <button id="dashboardSmartLearnButton" type="button">🎓 Smart Learn</button>
                    <button id="dashboardSmartRevisionButton" type="button">🧠 Smart Revision</button>
                    <button id="dashboardPYQMasterButton" type="button">🏆 PYQ Master</button>
                    <button id="dashboardVerifiedPYQButton" type="button">🟢 Verified PYQ Practice</button>
                    <button id="dashboardWeakPracticeButton" type="button">⚡ Weak Chapter Practice</button>
                </div>
                <p style="margin:10px 0 0;font-size:13px;">Smart Learn उघडल्यावर priority/weak chapter मधील प्रश्नांसोबत 🎓 Smart Learn flow मिळेल.</p>
            </div>

            <hr>

            <h3>🎯 Today's Goal</h3>
            <div class="question-box">
                <p>📅 Target: <strong>${dailyGoal}</strong> Questions</p>
                <p>✅ Completed: <strong>${dailyCompleted} / ${dailyGoal}</strong></p>
                <div class="progress-bar"><div class="progress-fill" style="width:${dailyPercent}%;"></div></div>
                <p>${dailyGoal === 0 ? "📚 अजून प्रश्न उपलब्ध नाहीत." : dailyDone ? "🎉 आजचे Target पूर्ण झाले! शाब्बास!" : `⏳ अजून <strong>${dailyGoal - dailyCompleted}</strong> Questions बाकी आहेत.`}</p>
                ${dailyGoal > 0 ? `<button id="dashboardDailyGoalButton">${dailyDone ? "🔁 Practice Again" : (dailyToday?.has_session ? "▶️ Continue Today's Goal" : "🚀 Start Today's Goal")}</button>` : ""}
            </div>

            <hr>

            <h3>📈 Progress Improvement</h3>
            <div class="question-box">
                <p>📅 First recorded: <strong>${safe(baselineDate)}</strong></p>
                <p>🏆 Mastery: <strong>${num(baseline.masteryPercentage)}%</strong> → <strong>${num(current.masteryPercentage)}%</strong> (${signed(improvement.masteryPoints)} points)</p>
                <p>📚 Coverage: <strong>${num(baseline.coveragePercentage)}%</strong> → <strong>${num(current.coveragePercentage)}%</strong> (${signed(improvement.coveragePoints)} points)</p>
                <p>✅ Known: <strong>${num(baseline.known)}</strong> → <strong>${num(current.known)}</strong> (${signed(improvement.knownQuestions)})</p>
                <p>📖 Studied: <strong>${num(baseline.attempted)}</strong> → <strong>${num(current.attempted)}</strong> (${signed(improvement.studiedQuestions)})</p>
            </div>

            <hr>

            <h3>🔥 Practice & Achievements</h3>
            <div class="question-box">
                <p>🔥 Current Streak: <strong>${currentStreak} day${currentStreak === 1 ? "" : "s"}</strong></p>
                <p>🏅 Longest Streak: <strong>${longestStreak} day${longestStreak === 1 ? "" : "s"}</strong></p>
                <p>🏆 Badges: <strong>${unlocked} / ${totalBadges}</strong> unlocked</p>
            </div>

            <hr>

            <h3>📚 Subject-wise PASS Progress</h3>
            <div class="question-box">
                <p>🎯 प्रत्येक subject साठी app चा <strong>35% confident-question preparation target</strong> वापरला जातो. हा app मधील study target आहे; तो Board च्या official passing marks ची गणना नाही.</p>
            </div>
            ${subjectSummary.length === 0 ? `<p>अजून Subject data उपलब्ध नाही.</p>` : subjectSummary.map(item => {
                const targetKnown = item.passTargetKnown != null ? num(item.passTargetKnown) : Math.ceil(num(item.total) * 0.35);
                const targetProgress = item.passTargetProgressPercentage != null ? num(item.passTargetProgressPercentage) : (targetKnown > 0 ? Math.min(100, Math.round((num(item.known) / targetKnown) * 100)) : 0);
                const targetRemaining = item.passTargetRemaining != null ? num(item.passTargetRemaining) : Math.max(0, targetKnown - num(item.known));
                return `
                <div class="question-box">
                    <h3>📖 ${safe(item.subjectName)}</h3>
                    <p>🏆 Mastery: <strong>${num(item.masteryPercentage)}%</strong> &nbsp; 📚 Coverage: <strong>${num(item.coveragePercentage)}%</strong></p>
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct(item.masteryPercentage)}%;"></div></div>
                    <p>📝 ${num(item.total)} Total &nbsp; ✅ ${num(item.known)} Known &nbsp; 🔄 ${num(item.revision)} Revision &nbsp; ⏳ ${num(item.notStarted)} Not Started</p>
                    <div class="pass-target-card" style="margin-top:10px;padding:12px;border:2px solid #888;border-radius:10px;background:#f8f8f8;display:block;visibility:visible;">
                        <div style="font-size:17px;font-weight:700;">🎯 PASS Preparation Target</div>
                        <p style="margin:6px 0;"><strong>${num(item.known)} / ${targetKnown}</strong> Known Questions &nbsp; <strong>(${targetProgress}%)</strong> &nbsp; <span>Target: 35%</span></p>
                        <div class="progress-bar" style="display:block;min-height:12px;"><div class="progress-fill" style="width:${pct(targetProgress)}%;"></div></div>
                        <p style="margin:7px 0 0;">${targetRemaining > 0 ? `अजून <strong>${targetRemaining}</strong> questions confidently learn करा.` : '✅ हा preparation target पूर्ण झाला. आता Revision + PYQ + Mock Test वर लक्ष द्या.'}</p>
                    </div>
                    <button class="dashboard-subject-button" data-subject-id="${num(item.subjectId)}">📖 Open Chapters & Progress →</button>
                </div>
            `;
            }).join("")}

            <hr>

            <h3>⚠️ Weak Subjects — First Revise These</h3>
            ${weakSubjects.length === 0 ? `<p>🎉 सध्या weak subject सापडले नाहीत.</p>` : weakSubjects.map(item => `
                <div class="question-box">
                    <strong>⚠️ ${safe(item.subjectName)}</strong>
                    <p>Mastery: <strong>${num(item.masteryPercentage)}%</strong></p>
                    <button class="dashboard-subject-button" data-subject-id="${num(item.subjectId)}">⚡ Open Subject Practice</button>
                </div>
            `).join("")}

            <hr>

            <h3>📖 Chapters Needing Attention</h3>
            ${weakChapters.length === 0 ? `<p>🎉 सर्व उपलब्ध chapters पूर्ण झाले आहेत.</p>` : weakChapters.map(item => `
                <div class="question-box">
                    <strong>📖 ${safe(item.chapterNumber)} - ${safe(item.chapterName)}</strong>
                    <p>Subject: ${safe(item.subjectName)}</p>
                    <p>🏆 Mastery: <strong>${num(item.masteryPercentage)}%</strong> &nbsp; 🔄 Revision: ${num(item.revision)}</p>
                    <p>📚 ${num(item.known)} Known &nbsp; ⏳ ${num(item.notStarted)} Not Started &nbsp; 📝 ${num(item.total)} Total</p>
                    <button class="weak-chapter-practice-button" data-chapter-id="${num(item.chapterId)}">⚡ Practice This Chapter</button>
                </div>
            `).join("")}

            <hr>

            <h3>⚡ Weak Chapter Action Plan</h3>
            <div class="question-box">
                <p><strong>Weak Chapter → Easy Answers → Repeated PYQ → Practice → Revision → Mock Test</strong></p>
                <p>${safe(weakEngineData?.message || 'Chapter-wise action plan तयार होत आहे.')}</p>
            </div>
            ${weakEngineChapters.length === 0 ? `<p>🎉 सध्या action plan साठी weak chapter उपलब्ध नाही.</p>` : weakEngineChapters.map((item, index) => `
                <div class="question-box weak-engine-card">
                    <h3>${index + 1}. ⚠️ ${safe(item.chapterNumber)} - ${safe(item.chapterName)}</h3>
                    <p><strong>Subject:</strong> ${safe(item.subjectName)} &nbsp; | &nbsp; <strong>Mastery:</strong> ${num(item.masteryPercentage)}%</p>
                    <p>📚 ${num(item.total)} Total &nbsp; ✅ ${num(item.known)} Known &nbsp; 🔄 ${num(item.revision)} Revision &nbsp; ⏳ ${num(item.notStarted)} Not Started</p>
                    <p>🟢 Verified PYQ: <strong>${num(item.verifiedPyq)}</strong> &nbsp; 🔵 Repeated PYQ: <strong>${num(item.repeatedPyq)}</strong></p>
                    <div style="margin:8px 0;padding:10px;border-left:4px solid #888;background:#f7f7f7;">
                        ${(item.steps || []).map(step => `<div style="margin:4px 0;">${safe(step)}</div>`).join('')}
                    </div>
                    ${(item.questions || []).length ? `<h4>⭐ First Questions to Learn</h4>${(item.questions || []).map((q,qidx) => `
                        <div style="margin:8px 0;padding:10px;border:1px solid #ccc;border-radius:8px;">
                            <p><strong>Q${qidx+1}. ${safe(q.questionText)}</strong></p>
                            <p>🏷️ ${safe(q.sourceType)} ${q.pyqYear ? `| ${num(q.pyqYear)}` : ''} ${q.studentStatus === 'revision' ? '| 🔄 Revision' : q.studentStatus === 'not_started' ? '| ⏳ Not Started' : ''}</p>
                            ${q.easyAnswer ? `<p>💡 <strong>Easy Answer:</strong> ${safe(q.easyAnswer)}</p>` : '<p>💡 Easy Answer अजून उपलब्ध नाही.</p>'}
                        </div>`).join('')}` : '<p>या chapter साठी questions उपलब्ध नाहीत.</p>'}
                    <button class="weak-engine-practice-button" data-chapter-id="${num(item.chapterId)}" data-subject-id="${num(item.subjectId)}" data-chapter-number="${safe(item.chapterNumber)}" data-chapter-name="${safe(item.chapterName)}" data-subject-name="${safe(item.subjectName)}">⚡ Practice This Weak Chapter</button>
                </div>
            `).join('')}

            <hr>

            <div class="dashboard-card" style="text-align:center;">
                <h3>🚀 Continue Smart Study</h3>
                <p>App tumchya progress nusar pudhil sarvat mahatvache study step nivadel.</p>
                <button id="dashboardContinueStudyButton">🚀 Continue Smart Study</button>
            </div>

            <hr>

            <div class="dashboard-card">
                <h3>📝 Recent Mock Test Results</h3>
                ${mockHistory.length ? `
                    <div style="overflow-x:auto;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead><tr><th style="text-align:left;">Subject</th><th>Score</th><th>Correct</th><th>Date</th></tr></thead>
                        <tbody>${mockHistory.slice(0,5).map(t=>`<tr><td>${safe(t.subject_name)}</td><td><strong>${num(t.score)}%</strong></td><td>${num(t.correct)}/${num(t.total_questions)}</td><td>${t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : 'Not submitted'}</td></tr>`).join('')}</tbody>
                    </table></div>` : '<p>No mock tests attempted yet. Start your first MCQ Mock Test!</p>'}
                <button id="dashboardMockButton">📝 Take Mock Test</button>
            </div>

            <hr>

            <div style="text-align:center;">
                <button id="dashboardReadinessButton">🏆 PASS Readiness</button>
                <button id="dashboardRevisionButton">🧠 Smart Revision</button>
                <button id="dashboardSpacedRevisionButton">⏰ Revision Due Today</button>
                <button id="dashboardDailyButton">🎯 Today's 10 Questions</button>
                <button id="dashboardAchievementsButton">🏅 Achievements</button>
                <button id="dashboardExamAnalysisButton">📊 Exam Analysis</button>
            </div>
        `;

        document.getElementById("dashboardContinueStudyButton")?.addEventListener("click", async () => {
            const button = document.getElementById("dashboardContinueStudyButton");
            if (button) { button.disabled = true; button.textContent = "⏳ Choosing your next study step..."; }
            try {
                const r = await fetch(`${API_URL}/api/students/${currentStudentId}/spaced-revision`);
                if (r.ok) {
                    const d = await r.json();
                    if (Number(d.dueCount || 0) > 0) { loadSpacedRevision(); return; }
                }
            } catch (e) { console.warn("Continue Study revision check failed", e); }
            loadSmartRevision();
        });

        document.getElementById("dashboardMockButton")?.addEventListener("click", loadMockTest);
        document.getElementById("dashboardReadinessButton")?.addEventListener("click", loadPassReadiness);
        document.getElementById("dashboardRevisionButton")?.addEventListener("click", loadSmartRevision);
        document.getElementById("dashboardSpacedRevisionButton")?.addEventListener("click", loadSpacedRevision);
        document.getElementById("dashboardDailyButton")?.addEventListener("click", loadDailyQuestions);
        document.getElementById("dashboardAchievementsButton")?.addEventListener("click", loadStudentAchievements);
        document.getElementById("dashboardExamAnalysisButton")?.addEventListener("click", loadExamAnalysis);
        document.getElementById("dashboardDailyGoalButton")?.addEventListener("click", loadDailyQuestions);

        // STEP 65: Dashboard Smart Study Center actions
        document.getElementById("dashboardSmartRevisionButton")?.addEventListener("click", loadSmartRevision);
        document.getElementById("dashboardPYQMasterButton")?.addEventListener("click", loadPYQMasterPriority);
        document.getElementById("dashboardVerifiedPYQButton")?.addEventListener("click", loadPYQPriority);

        document.getElementById("dashboardWeakPracticeButton")?.addEventListener("click", () => {
            const item = weakEngineChapters[0] || weakChapters[0];
            if (!item) {
                alert("सध्या Practice साठी weak chapter उपलब्ध नाही.");
                return;
            }
            const chapterId = Number(item.chapterId);
            const subjectId = Number(item.subjectId);
            if (!chapterId || !subjectId) return;
            loadQuestions(
                { id: chapterId, chapter_number: item.chapterNumber, chapter_name: item.chapterName },
                { id: subjectId, name: item.subjectName },
                loadStudentDashboard
            );
        });

        document.getElementById("dashboardSmartLearnButton")?.addEventListener("click", () => {
            const item = weakEngineChapters[0] || weakChapters[0];
            if (!item) {
                alert("Smart Learn सुरू करण्यासाठी chapter questions उपलब्ध नाहीत.");
                return;
            }
            const chapterId = Number(item.chapterId);
            const subjectId = Number(item.subjectId);
            if (!chapterId || !subjectId) return;
            loadQuestions(
                { id: chapterId, chapter_number: item.chapterNumber, chapter_name: item.chapterName },
                { id: subjectId, name: item.subjectName },
                loadStudentDashboard
            );
        });

        document.querySelectorAll(".weak-engine-practice-button").forEach(button => {
            button.addEventListener("click", () => {
                const chapterId = Number(button.dataset.chapterId);
                const subjectId = Number(button.dataset.subjectId);
                if (!chapterId) return;
                loadQuestions(
                    { id: chapterId, chapter_number: button.dataset.chapterNumber, chapter_name: button.dataset.chapterName },
                    { id: subjectId, name: button.dataset.subjectName },
                    loadStudentDashboard
                );
            });
        });

        document.querySelectorAll(".weak-chapter-practice-button").forEach(button => {
            button.addEventListener("click", () => {
                const chapterId = Number(button.dataset.chapterId);
                const item = weakChapters.find(chapter => Number(chapter.chapterId) === chapterId);
                if (!item) return;
                loadQuestions(
                    { id: item.chapterId, chapter_number: item.chapterNumber, chapter_name: item.chapterName },
                    { id: item.subjectId, name: item.subjectName },
                    loadStudentDashboard
                );
            });
        });

        document.querySelectorAll(".dashboard-subject-button").forEach(button => {
            button.addEventListener("click", () => showDashboardSubjectChapters(Number(button.dataset.subjectId), data));
        });

    } catch (error) {
        console.error("Student Dashboard Error:", error);
        container.innerHTML = `
            <h2>📊 My Student Dashboard</h2>
            <p>❌ Dashboard load झाला नाही.</p>
            <p>${dailyPracticeEscape(error.message)}</p>
        `;
    }
}

async function showDashboardSubjectChapters(subjectId, dashboardData) {
    const container = document.getElementById("subjectsContainer");
    if (!container) return;

    const subjects = dashboardData.subjectSummary || [];
    const chapters = (dashboardData.chapterSummary || []).filter(item => Number(item.subjectId) === Number(subjectId));
    const subject = subjects.find(item => Number(item.subjectId) === Number(subjectId));
    const safe = value => dailyPracticeEscape(value == null ? "" : value);

    if (!subject) return;

    container.innerHTML = `
        <div style="text-align:center;">
            <h2>📖 ${safe(subject.subjectName)}</h2>
            <p>🏆 Mastery: <strong>${Number(subject.masteryPercentage) || 0}%</strong> &nbsp; 📚 Coverage: <strong>${Number(subject.coveragePercentage) || 0}%</strong></p>
        </div>
        <hr>
        <h3>📚 Chapters & Progress</h3>
        ${chapters.length === 0 ? `<p>या Subject साठी अजून Questions/Chapters उपलब्ध नाहीत.</p>` : chapters.map(item => `
            <div class="question-box">
                <h3>📖 ${safe(item.chapterNumber)} - ${safe(item.chapterName)}</h3>
                <p>🏆 Mastery: <strong>${Number(item.masteryPercentage) || 0}%</strong></p>
                <p>📝 ${Number(item.total) || 0} Total &nbsp; ✅ ${Number(item.known) || 0} Known &nbsp; 🔄 ${Number(item.revision) || 0} Revision &nbsp; ⏳ ${Number(item.notStarted) || 0} Not Started</p>
                <div class="progress-bar"><div class="progress-fill" style="width:${Math.max(0, Math.min(100, Number(item.masteryPercentage) || 0))}%;"></div></div>
                ${Number(item.total) > 0 ? `<button class="subject-chapter-practice-button" data-chapter-id="${Number(item.chapterId)}">⚡ Practice This Chapter</button>` : ""}
            </div>
        `).join("")}
        <hr>
        <div style="text-align:center;">
            <button id="backDashboardFromSubjectButton">📊 Back to My Dashboard</button>
        </div>
    `;

    document.getElementById("backDashboardFromSubjectButton")?.addEventListener("click", loadStudentDashboard);

    document.querySelectorAll(".subject-chapter-practice-button").forEach(button => {
        button.addEventListener("click", () => {
            const chapterId = Number(button.dataset.chapterId);
            const item = chapters.find(chapter => Number(chapter.chapterId) === chapterId);
            if (!item) return;
            loadQuestions(
                { id: item.chapterId, chapter_number: item.chapterNumber, chapter_name: item.chapterName },
                { id: item.subjectId, name: item.subjectName },
                () => showDashboardSubjectChapters(subjectId, dashboardData)
            );
        });
    });
}

// ================================================
// STAGE 8 STEP 5 — SMART REVISION BUTTON
// ================================================

document
    .getElementById("smartRevisionButton")
    .addEventListener("click", loadSmartRevision);


// ================================================
// BUTTON EVENTS
// ================================================

document
    .getElementById(
        "myRevisionButton"
    )
    .addEventListener(
        "click",
        loadRevision
    );


document
    .getElementById(
        "passReadinessButton"
    )
    .addEventListener(
        "click",
        loadPassReadiness
    );


document
    .getElementById(
        "dailyStreakButton"
    )
    .addEventListener(
        "click",
        loadDailyStreak
    );


document
    .getElementById(
        "studentDashboardButton"
    )
    .addEventListener(
        "click",
        loadStudentDashboard
    );

document
    .getElementById(
        "achievementsButton"
    )
    .addEventListener(
        "click",
        loadStudentAchievements
    );


document
    .getElementById(
        "startStudyButton"
    )
    .addEventListener(
        "click",
        createStudent
    );


document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        logoutStudent
    );


document
    .getElementById(
        "pyqLibraryButton"
    )
    .addEventListener(
        "click",
        loadPYQLibrary
    );




// ================================================
// STEP 36 - PYQ FIRST PASS PRIORITY
// ================================================
async function loadPYQPriority(){
  const container=document.getElementById('subjectsContainer');
  const sid=localStorage.getItem('studentId');
  if(!sid){container.innerHTML='<h2>🎯 PYQ First</h2><p>Please login first.</p>';return;}
  try{
    const r=await fetch(`${API_URL}/api/students/${sid}/pyq-priority?limit=30`); const d=await r.json();
    if(!r.ok||!d.success)throw Error(d.error||'Unable to load PYQ priority');
    container.innerHTML=`<button id="backFromPYQPriority">← Back to Subjects</button><h2>🎯 PYQ First – PASS Priority</h2><p>पहिले verified Board PYQs करा. Repeated PYQs त्यानंतर.</p><div id="pyqPriorityList"></div>`;
    document.getElementById('backFromPYQPriority').onclick=loadSubjects;
    const box=document.getElementById('pyqPriorityList');
    if(!d.questions.length){box.innerHTML='<p>अजून verified PYQs import झालेले नाहीत. Admin मधून actual Board PYQ CSV import करा.</p>';return;}
    d.questions.forEach((q,i)=>{
      const div=document.createElement('div');div.className='question-box';
      const badge=q.source_type==='ACTUAL_PYQ'?'🟢 ACTUAL PYQ':q.source_type==='PYQ_REPEATED'?'🔵 REPEATED PYQ':'🟡 PYQ-BASED';
      div.innerHTML=`<h3>${i+1}. ${badge}</h3><p><strong>${q.subject_name} — Chapter ${q.chapter_number}: ${q.chapter_name}</strong></p><p>${q.question_text}</p><p>Marks: ${q.marks} ${q.pyq_year?`| 📅 ${q.pyq_year}`:''} ${Number(q.pyq_frequency)>1?`| 🔥 Seen ${q.pyq_frequency}×`:''}</p><button class="priority-answer">👁 Show Easy Answer</button><div class="priority-answer-box" style="display:none"><p>${q.easy_answer||'Answer not available.'}</p><p><strong>Keywords:</strong> ${q.keywords||''}</p>${typeof window.renderVisualLearning==='function'?window.renderVisualLearning(q,{name:q.subject_name},{chapter_number:q.chapter_number,chapter_name:q.chapter_name}):''}</div>`;
      div.querySelector('.priority-answer').onclick=()=>{div.querySelector('.priority-answer-box').style.display='block';}; box.appendChild(div);
    });
  }catch(e){container.innerHTML=`<p>❌ ${e.message}</p>`;}
}



document.getElementById('pyqPriorityButton')?.addEventListener('click',loadPYQPriority);

// ================================================
// STEP 56 - PYQ MASTER / PASS PRIORITY ENGINE
// ================================================
async function loadPYQMasterPriority(){
  const container=document.getElementById('subjectsContainer');
  const sid=localStorage.getItem('studentId');
  if(!sid){container.innerHTML='<h2>🏆 PYQ Master</h2><p>Please login first.</p>';return;}
  try{
    const r=await fetch(`${API_URL}/api/students/${sid}/pyq-master-priority?limit=40`,{cache:'no-store'});
    const d=await r.json(); if(!r.ok||!d.success)throw Error(d.error||'Unable to load PYQ Master');
    container.innerHTML=`<button id="backFromPYQMaster">← Back to Subjects</button><h2>🏆 STEP 56 — PYQ MASTER</h2><p>${d.message||''}</p><div class="question-box"><h3>🎯 First study these chapters</h3>${(d.priorityChapters||[]).map((c,i)=>`<p><strong>${i+1}. ${c.subject_name} — Chapter ${c.chapter_number}: ${c.chapter_name}</strong><br>🔁 Repeated: ${c.repeated} &nbsp; | &nbsp; 📝 Unstarted: ${c.unstarted} &nbsp; | &nbsp; 🔄 Revision: ${c.revision}</p>`).join('')}</div><div id="pyqMasterList"></div>`;
    document.getElementById('backFromPYQMaster').onclick=loadSubjects;
    const box=document.getElementById('pyqMasterList');
    if(!d.questions.length){box.innerHTML='<p>अजून verified PYQs उपलब्ध नाहीत.</p>';return;}
    d.questions.forEach((q,i)=>{
      const div=document.createElement('div'); div.className='question-box';
      const badge=q.source_type==='PYQ_REPEATED'?'🔵 REPEATED PYQ':'🟢 ACTUAL PYQ';
      const status=q.student_status==='revision'?'🔴 REVISION':q.student_status==='known'?'🟢 KNOWN':'🟡 FIRST STUDY';
      div.innerHTML=`<h3>${i+1}. ${badge} &nbsp; ${status}</h3><p><strong>${q.subject_name} — Chapter ${q.chapter_number}: ${q.chapter_name}</strong></p><p>${q.question_text}</p><p>Marks: ${q.marks||1} ${q.pyq_year?`| 📅 ${q.pyq_year}`:''} ${Number(q.pyq_frequency)>1?`| 🔥 Seen ${q.pyq_frequency}×`:''}</p><button class="pyq-master-answer">👁 Show Easy Answer</button><div class="pyq-master-answer-box" style="display:none"><p>${q.easy_answer||'Answer not available.'}</p><p><strong>Keywords:</strong> ${q.keywords||''}</p>${typeof window.renderVisualLearning==='function'?window.renderVisualLearning(q,{name:q.subject_name},{chapter_number:q.chapter_number,chapter_name:q.chapter_name}):''}</div>`;
      div.querySelector('.pyq-master-answer').onclick=()=>{div.querySelector('.pyq-master-answer-box').style.display='block';};
      box.appendChild(div);
    });
  }catch(e){container.innerHTML=`<p>❌ ${e.message}</p>`;}
}

document.getElementById('pyqMasterButton')?.addEventListener('click',loadPYQMasterPriority);


// ================================================
// STAGE 10 STEP 23 - MOCK TEST
// ================================================
let mockTestState = { testId:null, subjectId:null, subjectName:null, questions:[], answers:{}, timer:null, seconds:0, localMode:false };
async function loadMockTest() {
    const container=document.getElementById('subjectsContainer'); const sid=localStorage.getItem('studentId');
    if (!sid) { container.innerHTML='<h2>📝 MCQ Mock Test</h2><p>Please login first.</p>'; return; }
    try {
        const r=await fetch(`${API_URL}/api/subjects`); const subs=await r.json();
        container.innerHTML=`<button id="backFromMock">← Back to Subjects</button><h2>📝 Automatic MCQ Mock Test</h2><p>20 MCQs • 30 minutes • <strong>All SSC subjects</strong> • Pass target 40%</p><div class="question-box"><strong>📚 Mock Test:</strong><br>सर्व subjects उपलब्ध आहेत. प्रत्येक test मध्ये उपलब्ध answered questions वरून 20 practice MCQs तयार केले जातील.</div><div id="mockSubjects"></div>`;
        document.getElementById('backFromMock').onclick=loadSubjects; const box=document.getElementById('mockSubjects');
        subs.forEach(sub=>{const b=document.createElement('button');b.style.display='block';b.style.margin='8px 0';b.textContent=`${sub.name} — Start 20 MCQs`;b.onclick=()=>startMockTest(sub.id,sub.name);box.appendChild(b);});
    } catch(e){console.error(e);container.innerHTML='<p>Unable to load MCQ Mock Test subjects.</p>';}
}
function mockEscape(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function mockSubjectName(q){return String(q.subject_name||'').toLowerCase();}
function mockText(q){return String(q.question_text||'').trim();}
function mockAnswer(q){return String(q.easy_answer||'').trim();}
function numFmt(n){return Number.isInteger(n)?String(n):String(Number(n.toFixed(4)));}

// STEP 76 QUALITY FIX: build mathematically meaningful options instead of
// mixing unrelated answers from other questions.
function deriveReliableMath(q){
    const t=mockText(q), a=mockAnswer(q);
    let m=t.match(/(?:mean of (?:the )?data)[:\s]+([\d,\.\s\-]+)/i);
    if(m){const ns=m[1].split(',').map(Number).filter(Number.isFinite);if(ns.length){const sum=ns.reduce((x,y)=>x+y,0),mean=sum/ns.length;return {answer:numFmt(mean),solution:`Step 1: Add the observations: ${ns.join(' + ')} = ${numFmt(sum)}.\nStep 2: Number of observations = ${ns.length}.\nStep 3: Mean = Sum ÷ Number of observations = ${numFmt(sum)} ÷ ${ns.length} = ${numFmt(mean)}.\nAnswer: ${numFmt(mean)}.`};}}
    m=t.match(/(?:10th|\d+(?:st|nd|rd|th)) term of (?:the )?arithmetic progression\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if(m){const n=Number((t.match(/(\d+)(?:st|nd|rd|th)/i)||[])[1]||10),a1=Number(m[1]),d=Number(m[2])-a1,ans=a1+(n-1)*d;return {answer:numFmt(ans),solution:`Step 1: First term a = ${a1}, common difference d = ${d}.\nStep 2: Use aₙ = a + (n − 1)d.\nStep 3: a${n} = ${a1} + (${n} − 1)(${d}) = ${numFmt(ans)}.\nAnswer: ${numFmt(ans)}.`};}
    m=t.match(/(?:sum of )?(?:the )?first\s+(\d+)\s+terms? of (?:the )?A\.?P\.?\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if(m){const n=Number(m[1]),a1=Number(m[2]),d=Number(m[3])-a1,ans=n*(2*a1+(n-1)*d)/2;return {answer:numFmt(ans),solution:`Step 1: a = ${a1}, d = ${d}, n = ${n}.\nStep 2: Use Sₙ = n/2 [2a + (n − 1)d].\nStep 3: S${n} = ${n}/2 [2(${a1}) + (${n} − 1)(${d})] = ${numFmt(ans)}.\nAnswer: ${numFmt(ans)}.`};}
    m=t.match(/(?:discriminant of|discriminant).*?([\d]+)x[²2]\s*([+\-])\s*([\d]+)x\s*([+\-])\s*([\d]+)/i);
    if(m){const A=Number(m[1]),B=(m[2]=='-'?-1:1)*Number(m[3]),C=(m[4]=='-'?-1:1)*Number(m[5]),D=B*B-4*A*C;return {answer:numFmt(D),solution:`Step 1: Compare with ax² + bx + c = 0: a = ${A}, b = ${B}, c = ${C}.\nStep 2: D = b² − 4ac.\nStep 3: D = (${B})² − 4(${A})(${C}) = ${numFmt(D)}.\nStep 4: Since D ${D>0?'>':'='} 0, the nature of roots follows accordingly.\nAnswer: D = ${numFmt(D)}.`};}
    m=t.match(/(\d+)x\s*\+\s*(\d+)y\s*=\s*(\-?\d+)\s+and\s+(\d*)x\s*\+\s*(\d+)y\s*=\s*(\-?\d+)/i);
    if(m){const A=+m[1],B=+m[2],C=+m[3],D=+(m[4]||1),E=+m[5],F=+m[6],det=A*E-D*B;if(det){const x=(C*E-F*B)/det,y=(A*F-D*C)/det,fx=numFmt(x),fy=numFmt(y);return {answer:`x = ${fx}, y = ${fy}`,solution:`Step 1: Equations: ${A}x + ${B}y = ${C} and ${D}x + ${E}y = ${F}.\nStep 2: Eliminate one variable.\nStep 3: x = ${fx}.\nStep 4: Substitute x back to obtain y = ${fy}.\nAnswer: x = ${fx}, y = ${fy}.`};}}
    m=t.match(/graph of\s*x\s*\+\s*y\s*=\s*(\d+)/i);
    if(m){const k=Number(m[1]),area=k*k/2;return {answer:`Right isosceles triangle; area = ${numFmt(area)} square units`,solution:`Step 1: For x + y = ${k}, the x-intercept is (${k}, 0) and the y-intercept is (0, ${k}).\nStep 2: The triangle has perpendicular sides ${k} and ${k}.\nStep 3: Area = 1/2 × base × height = 1/2 × ${k} × ${k} = ${numFmt(area)} square units.\nStep 4: The two legs are equal, so it is a right isosceles triangle.\nAnswer: Area = ${numFmt(area)} square units.`};}
    m=t.match(/(?:sides|legs)\s*(?:are|of)\s*(\d+(?:\.\d+)?)\s*(?:cm)?\s*and\s*(\d+(?:\.\d+)?).*hypotenuse/i);
    if(m){const x=+m[1],y=+m[2],z=Math.sqrt(x*x+y*y);return {answer:numFmt(z),solution:`Step 1: Use c² = a² + b².\nStep 2: c² = ${x}² + ${y}² = ${numFmt(x*x+y*y)}.\nStep 3: c = √${numFmt(x*x+y*y)} = ${numFmt(z)}.\nAnswer: ${numFmt(z)}.`};}
    m=t.match(/check whether\s*\((\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)\)\s*satisfies\s*(\d+)x\s*\+\s*(\d+)y\s*=\s*(\-?\d+)/i);
    if(m){const x=+m[1],y=+m[2],A=+m[3],B=+m[4],C=+m[5],lhs=A*x+B*y;return {answer:lhs===C?'Yes, because LHS = RHS':'No, because LHS ≠ RHS',solution:`Step 1: Substitute x = ${x}, y = ${y}.\nStep 2: LHS = ${A}(${x}) + ${B}(${y}) = ${numFmt(lhs)}.\nStep 3: RHS = ${C}.\nStep 4: ${lhs===C?'LHS = RHS, so the point satisfies the equation.':'LHS ≠ RHS, so the point does not satisfy the equation.'}\nAnswer: ${lhs===C?'Yes':'No'}.`};}
    // STEP 80: additional safe Mathematics derivations.
    m=t.match(/probability.*?(?:favourable|desired|successful)\s*(?:outcomes?|cases?)\s*(?:are|=)\s*(\d+).*?(?:total|possible)\s*(?:outcomes?|cases?)\s*(?:are|=)\s*(\d+)/i);
    if(m){const f=+m[1],n=+m[2],p=f/n;return {answer:numFmt(p),solution:`Step 1: Favourable outcomes = ${f}; total outcomes = ${n}.\nStep 2: P(E) = favourable outcomes ÷ total outcomes.\nStep 3: P(E) = ${f}/${n} = ${numFmt(p)}.\nAnswer: ${numFmt(p)}.`};}
    m=t.match(/(?:roots?|solutions?).*?(?:equation|quadratic).*?(\d+)x[²2]\s*([+\-])\s*(\d+)x\s*([+\-])\s*(\d+)/i);
    if(m){const A=+m[1],B=(m[2]==='-'?-1:1)*+m[3],C=(m[4]==='-'?-1:1)*+m[5],D=B*B-4*A*C;if(D>=0){const r1=(-B+Math.sqrt(D))/(2*A),r2=(-B-Math.sqrt(D))/(2*A);return {answer:`x = ${numFmt(r1)}, ${numFmt(r2)}`,solution:`Step 1: a = ${A}, b = ${B}, c = ${C}.\nStep 2: D = b² − 4ac = ${numFmt(D)}.\nStep 3: x = (−b ± √D)/(2a).\nStep 4: x = ${numFmt(r1)} or ${numFmt(r2)}.\nAnswer: x = ${numFmt(r1)}, ${numFmt(r2)}.`};}}
    return null;
}

// STEP 79 QUALITY FIX: science step-by-step derivations and meaningful numeric MCQ options.
function deriveReliableScience(q){
    const t=mockText(q), a=mockAnswer(q);
    let m;
    // Ohm's law / electric current
    m=t.match(/(?:voltage|potential difference)\s*(?:is|=)\s*(\d+(?:\.\d+)?)\s*V.*?(?:resistance|R)\s*(?:is|=)\s*(\d+(?:\.\d+)?)\s*(?:ohm|Ω)/i);
    if(m){const V=+m[1],R=+m[2],I=V/R;return {answer:numFmt(I)+' A',solution:`Step 1: Given voltage V = ${V} V and resistance R = ${R} Ω.\nStep 2: Use Ohm's law: V = IR.\nStep 3: I = V ÷ R = ${V} ÷ ${R} = ${numFmt(I)} A.\nAnswer: I = ${numFmt(I)} A.`};}
    // Current from charge and time
    m=t.match(/(?:charge|Q)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*C.*?(?:time|t)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*s/i);
    if(m){const Q=+m[1],tt=+m[2],I=Q/tt;return {answer:numFmt(I)+' A',solution:`Step 1: Charge Q = ${Q} C and time t = ${tt} s.\nStep 2: Use I = Q/t.\nStep 3: I = ${Q} ÷ ${tt} = ${numFmt(I)} A.\nAnswer: ${numFmt(I)} A.`};}
    // Electrical power
    m=t.match(/(?:voltage|potential difference)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*V.*?(?:current|I)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*A.*?(?:power|P)/i);
    if(m){const V=+m[1],I=+m[2],P=V*I;return {answer:numFmt(P)+' W',solution:`Step 1: V = ${V} V and I = ${I} A.\nStep 2: Use P = VI.\nStep 3: P = ${V} × ${I} = ${numFmt(P)} W.\nAnswer: P = ${numFmt(P)} W.`};}
    // Work done
    m=t.match(/(?:force|F)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*N.*?(?:distance|displacement|d)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*m.*?(?:work|W)/i);
    if(m){const F=+m[1],d=+m[2],W=F*d;return {answer:numFmt(W)+' J',solution:`Step 1: Force F = ${F} N and displacement d = ${d} m.\nStep 2: Use W = F × d (for force along displacement).\nStep 3: W = ${F} × ${d} = ${numFmt(W)} J.\nAnswer: W = ${numFmt(W)} J.`};}
    // Speed
    m=t.match(/(?:distance|d)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*(?:km|m).*?(?:time|t)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*(?:h|hr|hours?|s|sec)/i);
    if(m){const dist=+m[1],time=+m[2]; if(time){return null;}}
    // Density
    m=t.match(/(?:mass|m)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*(?:g|kg).*?(?:volume|V)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*(?:cm³|cm3|m³|m3).*?(?:density|ρ)/i);
    if(m){const mass=+m[1],vol=+m[2],rho=mass/vol;return {answer:numFmt(rho),solution:`Step 1: Mass = ${mass} and volume = ${vol}.\nStep 2: Density = Mass ÷ Volume.\nStep 3: ρ = ${mass} ÷ ${vol} = ${numFmt(rho)}.\nAnswer: ρ = ${numFmt(rho)} (in the given units).`};}
    // Kinetic energy
    m=t.match(/(?:mass|m)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*kg.*?(?:speed|velocity|v)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*m\/s.*?(?:kinetic energy|K\.E\.?)/i);
    if(m){const mass=+m[1],v=+m[2],ke=.5*mass*v*v;return {answer:numFmt(ke)+' J',solution:`Step 1: m = ${mass} kg and v = ${v} m/s.\nStep 2: Use K.E. = ½mv².\nStep 3: K.E. = ½ × ${mass} × ${v}² = ${numFmt(ke)} J.\nAnswer: ${numFmt(ke)} J.`};}
    // Potential energy
    m=t.match(/(?:mass|m)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*kg.*?(?:height|h)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*m.*?(?:g|acceleration due to gravity)\s*(?:=|of)\s*(\d+(?:\.\d+)?)\s*m\/s².*?(?:potential energy|P\.E\.?)/i);
    if(m){const mass=+m[1],h=+m[2],g=+m[3],pe=mass*g*h;return {answer:numFmt(pe)+' J',solution:`Step 1: m = ${mass} kg, h = ${h} m, g = ${g} m/s².\nStep 2: Use P.E. = mgh.\nStep 3: P.E. = ${mass} × ${g} × ${h} = ${numFmt(pe)} J.\nAnswer: ${numFmt(pe)} J.`};}
    // STEP 80: additional safe Science derivations.
    m=t.match(/(?:voltage|potential difference)\s*(?:is|=|of)\s*(\d+(?:\.\d+)?)\s*V.*?(?:current|I)\s*(?:is|=|of)\s*(\d+(?:\.\d+)?)\s*A.*?(?:resistance|R)/i);
    if(m){const V=+m[1],I=+m[2],R=V/I;return {answer:numFmt(R)+' Ω',solution:`Step 1: V = ${V} V and I = ${I} A.\nStep 2: From V = IR, R = V ÷ I.\nStep 3: R = ${V} ÷ ${I} = ${numFmt(R)} Ω.\nAnswer: R = ${numFmt(R)} Ω.`};}
    m=t.match(/(?:power|P)\s*(?:is|=|of)\s*(\d+(?:\.\d+)?)\s*W.*?(?:time|t)\s*(?:is|=|of)\s*(\d+(?:\.\d+)?)\s*(h|hr|hours?|s|sec).*?(?:electrical energy|energy)/i);
    if(m){const P=+m[1],tt=+m[2],u=m[3].toLowerCase(),secs=/s|sec/.test(u)?tt:tt*3600,E=P*secs;return {answer:numFmt(E)+' J',solution:`Step 1: P = ${P} W and t = ${tt} ${u}.\nStep 2: Time = ${numFmt(secs)} s.\nStep 3: E = Pt = ${P} × ${numFmt(secs)} = ${numFmt(E)} J.\nAnswer: E = ${numFmt(E)} J.`};}
    m=t.match(/(?:mass|m)\s*(?:of|=)\s*(\d+(?:\.\d+)?)\s*kg.*?(?:specific heat|specific heat capacity)\s*(?:of|=)\s*(\d+(?:\.\d+)?).*?(?:temperature change|change in temperature|ΔT)\s*(?:of|=)\s*(\d+(?:\.\d+)?).*?(?:heat|Q)/i);
    if(m){const mass=+m[1],c=+m[2],dt=+m[3],Q=mass*c*dt;return {answer:numFmt(Q)+' J',solution:`Step 1: m = ${mass} kg, c = ${c} J/kg°C, ΔT = ${dt}°C.\nStep 2: Q = mcΔT.\nStep 3: Q = ${mass} × ${c} × ${dt} = ${numFmt(Q)} J.\nAnswer: Q = ${numFmt(Q)} J.`};}
    return null;
}

function numericDistractors(correct){
    const n=Number(String(correct).replace(/[^\d.\-]/g,''));
    if(!Number.isFinite(n))return [];
    const d=Math.max(1,Math.abs(n)>=10?5:1);
    return [numFmt(n+d),numFmt(n-d),numFmt(n+2*d)].filter(x=>x!==numFmt(n));
}
function formulaDistractors(correct){
    const s=String(correct);
    const out=[];
    const variants=[
        s.replace(/\/r²|\/r2/gi,'/r'),
        s.replace(/\/r/gi,'/r²'),
        s.replace(/\+/g,'-'),
        s.replace(/\-/g,'+'),
        s.replace(/m₁m₂/g,'m₁+m₂')
    ];
    for(const v of variants){if(v&&v!==s&&!out.includes(v))out.push(v);if(out.length===3)break;}
    return out;
}
function relatedAnswerDistractors(q,pool){
    const keys=String(q.keywords||'').toLowerCase().split(/[;,|]/).map(x=>x.trim()).filter(Boolean);
    const correct=mockAnswer(q);
    const scored=[];
    for(const v0 of pool){const v=String(v0||'').trim();if(!v||v===correct||scored.some(x=>x.v===v))continue;const low=v.toLowerCase();let score=0;for(const k of keys)if(low.includes(k)||k.includes(low.slice(0,Math.min(12,low.length))))score++;if(Math.abs(v.length-correct.length)<80)score++;scored.push({v,score});}
    return scored.sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.v);
}
function buildLocalMockQuestion(q,pool){
    let correct=mockAnswer(q),solution='';
    const subj=mockSubjectName(q);
    if(subj.includes('mathematics')){const d=deriveReliableMath(q);if(d){correct=d.answer;solution=d.solution;}}
    if(subj.includes('science')){const d=deriveReliableScience(q);if(d){correct=d.answer;solution=d.solution;}}
    if(!correct)return null;
    const existing=['A','B','C','D'].map(k=>q['option_'+k.toLowerCase()]);
    if(existing.every(x=>String(x||'').trim())&&['A','B','C','D'].includes(String(q.correct_option||'').toUpperCase()))return {...q,solution:q.mcq_explanation||solution||buildLocalSolution(q),solution_type:(q.mcq_explanation||solution)?'STEP_BY_STEP':'EXPLANATION'};
    let ds=[];
    if(/^[\-+]?\d+(?:\.\d+)?$/.test(correct))ds=numericDistractors(correct);
    if(ds.length<3 && /[=²\/]/.test(correct))ds=[...ds,...formulaDistractors(correct)];
    if(ds.length<3)ds=[...ds,...relatedAnswerDistractors(q,pool)];
    while(ds.length<3)ds.push('None of the above');
    ds=[...new Set(ds)].filter(x=>x!==correct).slice(0,3);
    while(ds.length<3)ds.push('None of the above');
    const pos=Math.abs((Number(q.id)||0)*7+3)%4,opts=[...ds];opts.splice(pos,0,correct);
    return {...q,easy_answer:correct,option_a:opts[0],option_b:opts[1],option_c:opts[2],option_d:opts[3],correct_option:'ABCD'[pos],solution:solution||buildLocalSolution({...q,easy_answer:correct}),solution_type:solution?'STEP_BY_STEP':'EXPLANATION',dynamically_built:true};
}
function buildLocalSolution(q){
    const d=deriveReliableMath(q);if(d)return d.solution;
    const sd=deriveReliableScience(q);if(sd)return sd.solution;
    const t=mockText(q),a=mockAnswer(q),h=String(q.hint||'').trim();
    const parts=['Step 1: Understand what the question is asking.'];
    if(h)parts.push(`Step 2: Method / Hint — ${h}`);
    parts.push('Step 3: Apply the required rule, formula or concept to the given information.');
    if(a)parts.push(`Step 4: Final answer — ${a}`);else parts.push('Step 4: Solution not available in the source data.');
    return parts.join('\n');
}

function getCompositeMockQuestions(subjectName){
    const name=String(subjectName||'').trim().toLowerCase();
    if(name==='hindi composite'){
        const rows=[
            ['संज्ञा', '“राम विद्यालय गया।” इस वाक्य में “राम” कौन-सी संज्ञा है?', ['व्यक्तिवाचक','जातिवाचक','भाववाचक','समूहवाचक'],'A','“राम” किसी विशेष व्यक्ति का नाम है, इसलिए यह व्यक्तिवाचक संज्ञा है.'],
            ['सर्वनाम', '“सीमा ने कहा कि वह आज आएगी।” यहाँ “वह” कौन-सा शब्द है?', ['संज्ञा','सर्वनाम','विशेषण','क्रियाविशेषण'],'B','“वह” संज्ञा के स्थान पर आया है, इसलिए यह सर्वनाम है.'],
            ['विशेषण', '“सुंदर फूल खिला है।” इसमें “सुंदर” क्या है?', ['क्रिया','सर्वनाम','विशेषण','संज्ञा'],'C','“सुंदर” फूल का गुण बताता है, इसलिए यह विशेषण है.'],
            ['क्रिया', '“बच्चे मैदान में खेलते हैं।” इसमें मुख्य क्रिया कौन-सी है?', ['बच्चे','मैदान','में','खेलते हैं'],'D','काम का बोध कराने वाला शब्द “खेलते हैं” क्रिया है.'],
            ['काल', '“मैं कल बाजार गया था।” यह किस काल का उदाहरण है?', ['वर्तमान काल','भूतकाल','भविष्यत् काल','अपूर्ण वर्तमान'],'B','“गया था” बीते समय का बोध कराता है, इसलिए भूतकाल है.'],
            ['विलोम शब्द', '“आशा” का विलोम शब्द कौन-सा है?', ['विश्वास','निराशा','प्रेम','साहस'],'B','आशा का विपरीत अर्थ निराशा है.'],
            ['पर्यायवाची', '“सूर्य” का पर्यायवाची शब्द कौन-सा है?', ['रवि','पवन','जल','धरा'],'A','रवि सूर्य का प्रचलित पर्यायवाची है.'],
            ['लिंग', '“नदी” का लिंग क्या है?', ['पुल्लिंग','स्त्रीलिंग','नपुंसकलिंग','उभयलिंग'],'B','“नदी” स्त्रीलिंग शब्द है.'],
            ['वचन', '“लड़के” शब्द का वचन क्या है?', ['एकवचन','बहुवचन','द्विवचन','कोई नहीं'],'B','“लड़के” एक से अधिक का बोध कराता है, इसलिए बहुवचन है.'],
            ['मुहावरा', '“आँखों का तारा” मुहावरे का अर्थ क्या है?', ['बहुत दूर होना','बहुत प्रिय होना','बहुत क्रोधित होना','बहुत तेज दौड़ना'],'B','“आँखों का तारा” का अर्थ बहुत प्रिय व्यक्ति है.'],
            ['मुहावरा', '“नाक में दम करना” का अर्थ क्या है?', ['बहुत परेशान करना','बहुत सम्मान करना','चुप रहना','मदद करना'],'A','किसी को बहुत परेशान करना “नाक में दम करना” है.'],
            ['संधि', '“विद्यालय” शब्द का सही संधि-विच्छेद कौन-सा है?', ['विद्या + आलय','विद्य + आलय','विद्या + लय','विद + यालय'],'A','विद्यालय = विद्या + आलय.'],
            ['समास', '“राजपुत्र” में कौन-सा समास है?', ['द्वंद्व','तत्पुरुष','बहुव्रीहि','अव्ययीभाव'],'B','राजा का पुत्र = राजपुत्र, इसलिए तत्पुरुष समास है.'],
            ['वाक्य शुद्धि', 'सही वाक्य चुनिए।', ['वह स्कूल जाता हैं।','वह स्कूल जाते है।','वह स्कूल जाता है।','वह स्कूल जाओ है।'],'C','कर्ता “वह” एकवचन है, इसलिए “जाता है” सही है.'],
            ['अलंकार', '“मुख चंद्रमा सा सुंदर है।” इसमें कौन-सा अलंकार है?', ['उपमा','रूपक','अनुप्रास','यमक'],'A','“सा” द्वारा तुलना की गई है, इसलिए उपमा अलंकार है.'],
            ['वाक्य भेद', '“क्या तुमने गृहकार्य किया?” यह किस प्रकार का वाक्य है?', ['विधानवाचक','प्रश्नवाचक','आज्ञावाचक','विस्मयादिबोधक'],'B','प्रश्न पूछा गया है, इसलिए यह प्रश्नवाचक वाक्य है.'],
            ['अशुद्ध-शुद्ध', '“कृपया करके बैठिए।” के स्थान पर अधिक शुद्ध रूप कौन-सा है?', ['कृपया बैठिए।','कृपया करके बैठना।','कृपया बैठता है।','कृपया बैठेंगे।'],'A','“कृपया” के साथ “करके” अनावश्यक है; “कृपया बैठिए” शुद्ध है.'],
            ['पर्यायवाची', '“पृथ्वी” का पर्यायवाची कौन-सा है?', ['आकाश','धरती','अग्नि','वायु'],'B','धरती पृथ्वी का पर्यायवाची है.'],
            ['विलोम शब्द', '“उन्नति” का विलोम शब्द कौन-सा है?', ['प्रगति','अवनति','विकास','समृद्धि'],'B','उन्नति का विपरीत अर्थ अवनति है.'],
            ['काल', '“हम अगले सप्ताह परीक्षा देंगे।” यह किस काल का उदाहरण है?', ['भूतकाल','वर्तमान काल','भविष्यत् काल','पूर्ण भूतकाल'],'C','“देंगे” आने वाले समय का बोध कराता है, इसलिए भविष्यत् काल है.']
        ];
        return rows.map((r,i)=>({id:-1000-i,question_text:r[1],chapter_name:r[0],chapter_number:String(i+1),marks:1,easy_answer:r[4],option_a:r[2][0],option_b:r[2][1],option_c:r[2][2],option_d:r[2][3],correct_option:r[3],solution:`Step 1: प्रश्नातील मुख्य शब्द/नियम ओळखा.\nStep 2: ${r[4]}\nStep 3: योग्य पर्याय ${r[3]} आहे.\nAnswer: ${r[4]}`,dynamically_built:true,source_type:'PRACTICE'}));
    }
    if(name==='sanskrit composite'){
        const rows=[
            ['शब्दरूप', '“रामः” शब्दस्य द्वितीया एकवचनरूपं किम्?', ['रामम्','रामः','रामेण','रामाय'],'A','“राम” अकारान्त पुल्लिङ्ग शब्दस्य द्वितीया एकवचनम् “रामम्” भवति.'],
            ['शब्दरूप', '“फलम्” शब्दस्य प्रथमा बहुवचनरूपं किम्?', ['फलः','फलानि','फले','फलम्'],'B','नपुंसकलिङ्ग अकारान्त शब्दस्य प्रथमा बहुवचनम् “फलानि” भवति.'],
            ['शब्दरूप', '“बालिका” शब्दस्य तृतीया एकवचनरूपं किम्?', ['बालिकाम्','बालिकया','बालिकायै','बालिकायाः'],'B','आकारान्त स्त्रीलिङ्ग शब्दस्य तृतीया एकवचनम् “बालिकया” भवति.'],
            ['विभक्ति', '“गुरवे नमः” इत्यत्र “गुरवे” का विभक्तिः?', ['प्रथमा','द्वितीया','चतुर्थी','सप्तमी'],'C','“नमः” योगे चतुर्थी विभक्तिः प्रयुज्यते; “गुरवे” चतुर्थी एकवचनम्.'],
            ['विभक्ति', '“गृहे बालकः अस्ति” इत्यत्र “गृहे” का विभक्तिः?', ['तृतीया','चतुर्थी','षष्ठी','सप्तमी'],'D','स्थानवाचक अर्थे “गृहे” सप्तमी एकवचनम्.'],
            ['लकार', '“रामः पठति।” अत्र “पठति” कः लकारः?', ['लट्','लङ्','लृट्','लोट्'],'A','“पठति” वर्तमानकालस्य क्रियारूपम्, अतः लट् लकारः.'],
            ['लकार', '“रामः अपठत्।” अत्र “अपठत्” कः लकारः?', ['लट्','लङ्','लृट्','विधिलिङ्'],'B','“अपठत्” भूतकालं दर्शयति, अतः लङ् लकारः.'],
            ['लकार', '“रामः पठिष्यति।” अत्र “पठिष्यति” कः लकारः?', ['लट्','लङ्','लृट्','लोट्'],'C','“पठिष्यति” भविष्यत्कालं दर्शयति, अतः लृट् लकारः.'],
            ['लोट्', '“पठतु” इत्यस्य अर्थः कः?', ['पठति','पठत्','पठिष्यति','पठो/पठतु इति आज्ञा'],'D','“पठतु” आज्ञार्थक रूपम्; अतः लोट् लकारः.'],
            ['धातुरूप', '“गम्” धातोः लट् लकारे प्रथमपुरुष एकवचनरूपं किम्?', ['गच्छति','अगच्छत्','गमिष्यति','गच्छतु'],'A','गम् धातोः वर्तमानकाले प्रथमपुरुष एकवचनम् “गच्छति”.'],
            ['संधि', '“देव + आलयः” इत्यस्य संधिरूपं किम्?', ['देवालयः','देवालायः','देवालयम्','देवालये'],'A','देव + आलयः = देवालयः.'],
            ['संधि', '“विद्या + अर्थी” इत्यस्य योग्यरूपं किम्?', ['विद्यार्थी','विद्यार्थि','विद्यर्थी','विद्याअर्थी'],'A','विद्या + अर्थी = विद्यार्थी.'],
            ['समास', '“राजपुत्रः” इत्यत्र कः समासः?', ['द्वन्द्वः','तत्पुरुषः','बहुव्रीहिः','अव्ययीभावः'],'B','“राज्ञः पुत्रः” इति षष्ठी तत्पुरुष समासः.'],
            ['समास', '“नीलकमलम्” इत्यत्र कः समासः?', ['कर्मधारयः','द्वन्द्वः','बहुव्रीहिः','अव्ययीभावः'],'A','“नीलं कमलम्” विशेषण-विशेष्य सम्बन्धः, अतः कर्मधारयः.'],
            ['अव्यय', '“अत्र” इति कः शब्दभेदः?', ['संज्ञा','सर्वनाम','अव्ययम्','धातुः'],'C','“अत्र” अव्ययम् अस्ति; अस्य रूपपरिवर्तनं न भवति.'],
            ['सर्वनाम', '“अहम् विद्यालयं गच्छामि।” अत्र “अहम्” किम्?', ['संज्ञा','सर्वनाम','विशेषणम्','क्रिया'],'B','“अहम्” वक्तृवाचक सर्वनामम्.'],
            ['विशेषण', '“सुन्दरः बालकः” इत्यत्र “सुन्दरः” किम्?', ['विशेषणम्','क्रिया','अव्ययम्','सर्वनाम'],'A','“सुन्दरः” बालकस्य गुणं दर्शयति, अतः विशेषणम्.'],
            ['अनुवाद', '“बालकः पुस्तकं पठति।” अस्य योग्यः हिन्दी-अर्थः कः?', ['बालक पुस्तक पढ़ता है।','बालक खेलता है।','बालिका पुस्तक पढ़ती है।','बालक विद्यालय जाता है।'],'A','“बालकः” = बालक, “पुस्तकं” = पुस्तक, “पठति” = पढ़ता है.'],
            ['अनुवाद', '“सीता फलम् खादति।” अस्य योग्यः हिन्दी-अर्थः कः?', ['सीता फल खाती है।','सीता जल पीती है।','राम फल खाता है।','सीता पुस्तक पढ़ती है।'],'A','“सीता” कर्ता, “फलम्” कर्म और “खादति” = खाती है.'],
            ['वचन', '“बालकाः” इति कस्य वचनस्य रूपम्?', ['एकवचनम्','द्विवचनम्','बहुवचनम्','नपुंसकलिङ्गम्'],'C','“बालकाः” अनेक बालकों का बोध कराता है, अतः बहुवचनम्.']
        ];
        return rows.map((r,i)=>({id:-2000-i,question_text:r[1],chapter_name:r[0],chapter_number:String(i+1),marks:1,easy_answer:r[4],option_a:r[2][0],option_b:r[2][1],option_c:r[2][2],option_d:r[2][3],correct_option:r[3],solution:`Step 1: प्रश्नातील संस्कृत व्याकरणाचा नियम ओळखा.\nStep 2: ${r[4]}\nStep 3: योग्य पर्याय ${r[3]} आहे.\nAnswer: ${r[4]}`,dynamically_built:true,source_type:'PRACTICE'}));
    }
    return [];
}

async function startMockTest(subjectId,subjectName){
    const sid=localStorage.getItem('studentId');const container=document.getElementById('subjectsContainer');
    try{
        // Hindi/Sanskrit Composite currently have no reliable answered rows in the
        // imported bank. Use a clearly-labelled built-in practice bank instead of
        // showing an empty/zero-question mock test.
        let qs=getCompositeMockQuestions(subjectName);
        if(!qs.length){
            const cr=await fetch(`${API_URL}/api/subjects/${subjectId}/chapters?studentId=${sid}`);const chapters=await cr.json();qs=[];
            for(const ch of chapters){if(qs.length>=80)break;const r=await fetch(`${API_URL}/api/chapters/${ch.id}/questions`);const arr=await r.json();for(const q of arr){
                const ans=String(q.easy_answer||q.answer||q.correct_answer||q.solution||'').trim();
                if(ans)qs.push({...q,easy_answer:ans,chapter_number:ch.chapter_number,chapter_name:ch.chapter_name});
                if(qs.length>=80)break;
            }}
            if(qs.length<20){alert(`${subjectName} has only ${qs.length} usable answered questions. At least 20 are required.`);return;}
            const pool=qs.map(q=>q.easy_answer).filter(Boolean);qs=qs.sort(()=>Math.random()-0.5).map(q=>buildLocalMockQuestion(q,pool)).filter(Boolean).slice(0,20);
        }
        if(qs.length<20){alert(`Unable to prepare 20 MCQs for ${subjectName}.`);return;}
        // Give every mock question an explicit chapter/topic label so students know
        // which lesson/topic the question belongs to.
        qs=qs.slice(0,20).map((q,i)=>({...q,mock_number:i+1,chapter_name:String(q.chapter_name||'Practice Topic').trim()}));
        mockTestState={testId:null,subjectId,subjectName,questions:qs,answers:{},timer:null,seconds:30*60,localMode:true};renderMockTest(subjectName);startMockTimer();
    }catch(e){console.error(e);container.innerHTML='<p>Unable to prepare this mock test.</p>';}
}
function startMockTimer(){clearInterval(mockTestState.timer);mockTestState.timer=setInterval(()=>{mockTestState.seconds--;const el=document.getElementById('mockTimer');if(el)el.textContent=`⏱ ${Math.floor(mockTestState.seconds/60)}:${String(mockTestState.seconds%60).padStart(2,'0')}`;if(mockTestState.seconds<=0){clearInterval(mockTestState.timer);submitMockTest(true);}},1000);}
function renderMockTest(subjectName){
    const c=document.getElementById('subjectsContainer');c.innerHTML=`<h2>📝 ${mockEscape(subjectName)} – Automatic MCQ Test</h2><div id="mockTimer" style="font-weight:bold">⏱ 30:00</div><p>Select one answer for every question.</p><div class="question-box" style="border-left:4px solid #2b65ec"><strong>📚 Chapter-wise Practice</strong><br>प्रत्येक प्रश्नाखाली त्याचा Chapter / Topic दिलेला आहे. Composite subjects मधील हे questions <strong>practice questions</strong> आहेत; ते official PYQs म्हणून दाखवलेले नाहीत.</div><div id="mockQuestions"></div><button id="submitMock" style="margin-top:15px">✅ Submit Test</button>`;
    const box=document.getElementById('mockQuestions');mockTestState.questions.forEach((q,i)=>{const d=document.createElement('div');d.style.margin='16px 0';d.className='question-box';d.innerHTML=`<b>Q${i+1}. ${mockEscape(q.question_text)}</b><p style="margin:6px 0">📖 <strong>Chapter / Topic:</strong> ${mockEscape(q.chapter_name||'Practice Topic')}</p><div style="margin-top:8px"><label><input type="radio" name="q${q.id}" value="A"> A. ${mockEscape(q.option_a)}</label><br><label><input type="radio" name="q${q.id}" value="B"> B. ${mockEscape(q.option_b)}</label><br><label><input type="radio" name="q${q.id}" value="C"> C. ${mockEscape(q.option_c)}</label><br><label><input type="radio" name="q${q.id}" value="D"> D. ${mockEscape(q.option_d)}</label></div>`;box.appendChild(d);d.querySelectorAll('input').forEach(x=>x.onchange=()=>mockTestState.answers[q.id]=x.value);});document.getElementById('submitMock').onclick=()=>submitMockTest(false);
}
async function submitMockTest(auto){
    clearInterval(mockTestState.timer);const unanswered=mockTestState.questions.length-Object.keys(mockTestState.answers).length;if(!auto&&unanswered>0&&!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)){startMockTimer();return;}
    let correct=0,wrong=0,unansweredCount=0;const review=[];mockTestState.questions.forEach(q=>{const selected=String(mockTestState.answers[q.id]||'').toUpperCase();const st=selected?(selected===q.correct_option?'correct':'wrong'):'unanswered';if(st==='correct')correct++;else if(st==='wrong')wrong++;else unansweredCount++;review.push({id:q.id,question_text:q.question_text,chapter_number:q.chapter_number,chapter_name:q.chapter_name,option_a:q.option_a,option_b:q.option_b,option_c:q.option_c,option_d:q.option_d,selected_option:selected||null,correct_option:q.correct_option,solution:q.solution});});
    const score=Math.round(correct/mockTestState.questions.length*100);const c=document.getElementById('subjectsContainer');c.innerHTML=`<button id="backAfterMock">← Back to Mock Tests</button><h2>📊 MCQ Result</h2><h3>Score: ${score}%</h3><p>✅ Correct: ${correct} &nbsp; ❌ Wrong: ${wrong} &nbsp; ⭕ Unanswered: ${unansweredCount}</p><h3>${score>=40?'🎉 PASS – Keep practising!':'📚 Needs Improvement – Use Smart Revision and try again.'}</h3><p>Question-wise solved review is given below.</p><hr><h3>📖 Question-wise Solutions &amp; Working</h3>${review.map((q,i)=>{const ch=q.selected_option||'Not answered',ok=ch===q.correct_option;const opts=[['A',q.option_a],['B',q.option_b],['C',q.option_c],['D',q.option_d]].map(x=>`<li><strong>${x[0]}.</strong> ${mockEscape(x[1])}</li>`).join('');return `<div class="question-box"><h4>Q${i+1}. ${mockEscape(q.question_text)}</h4><p>📖 <strong>Chapter / Topic:</strong> ${mockEscape(q.chapter_number ? `Chapter ${q.chapter_number}: ` : "")}${mockEscape(q.chapter_name || "Practice Topic")}</p><ul>${opts}</ul><p>Your answer: <strong>${mockEscape(ch)}</strong> &nbsp; ${ok?'✅ Correct':'❌ Wrong / Unanswered'} &nbsp; Correct answer: <strong>${mockEscape(q.correct_option)}</strong></p><div class="question-box"><strong>🧮 Solution / Working:</strong><pre style="white-space:pre-wrap;font-family:inherit;">${mockEscape(q.solution)}</pre></div></div>`;}).join('')}<button id="fullExamAnalysisAfterMock">📊 View Full Exam Analysis</button>`;document.getElementById('backAfterMock').onclick=loadMockTest;document.getElementById('fullExamAnalysisAfterMock').onclick=loadExamAnalysis;
}
document.getElementById("mockTestButton").addEventListener("click", loadMockTest);


// ================================================
// STAGE 10 STEP 27 - STUDENT EXAM RESULT ANALYSIS
// ================================================
async function loadExamAnalysis() {
    const container = document.getElementById('subjectsContainer');
    const sid = localStorage.getItem('studentId');
    if (!container) return;
    if (!sid) {
        container.innerHTML = '<h2>📊 Exam Analysis</h2><p>पहिले Student Login करा.</p>';
        return;
    }
    container.innerHTML = '<h2>📊 Exam Result Analysis</h2><p>⏳ तुमचे Mock Test results तपासत आहे...</p>';
    try {
        const r = await fetch(`${API_URL}/api/students/${sid}/exam-analysis`);
        const d = await r.json();
        if (!r.ok || d.success === false) throw new Error(d.error || 'Analysis load failed');
        const safe = v => dailyPracticeEscape(v == null ? '' : v);
        const n = v => Number(v) || 0;
        const summary = d.summary || {};
        const subjects = d.subjectStats || [];
        const weak = d.weakChapters || [];
        const mistakes = d.repeatedMistakes || [];
        const recommendations = d.recommendations || [];
        const optionText = (q, letter) => {
            const key = `option_${String(letter || '').toLowerCase()}`;
            return letter && q[key] ? `${letter}. ${q[key]}` : (letter || '—');
        };

        container.innerHTML = `
            <button id="analysisBackDashboard">← Back to Dashboard</button>
            <h2>📊 Exam Result Analysis</h2>
            <p>तुमच्या Automatic MCQ Mock Tests वर आधारित weak-topic report.</p>

            <div class="question-box">
                <h3>🎯 Overall Exam Summary</h3>
                <p>📝 Tests Completed: <strong>${n(summary.tests_completed)}</strong></p>
                <p>📊 Average Score: <strong>${n(summary.average_score)}%</strong></p>
                <p>🏆 Best Score: <strong>${n(summary.best_score)}%</strong></p>
                <p>🕒 Latest Score: <strong>${n(summary.latest_score)}%</strong></p>
            </div>

            <h3>📚 Subject-wise Exam Performance</h3>
            ${subjects.length ? subjects.map(x => `
                <div class="question-box">
                    <strong>📖 ${safe(x.subject_name)}</strong>
                    <p>Tests: ${n(x.tests)} &nbsp; | &nbsp; Average: <strong>${n(x.average_score)}%</strong> &nbsp; | &nbsp; Best: ${n(x.best_score)}% &nbsp; | &nbsp; Latest: ${n(x.latest_score)}%</p>
                </div>`).join('') : '<p>अजून submitted Mock Test नाही.</p>'}

            <h3>⚠️ Weak Chapters from Exam Answers</h3>
            ${weak.length ? weak.map(x => `
                <div class="question-box">
                    <strong>${safe(x.subject_name)} — ${safe(x.chapter_number)} ${safe(x.chapter_name)}</strong>
                    <p>Accuracy: <strong>${n(x.accuracy)}%</strong> &nbsp; | &nbsp; Correct: ${n(x.correct)}/${n(x.attempted)} &nbsp; | &nbsp; Wrong: ${n(x.wrong)} &nbsp; | &nbsp; Unanswered: ${n(x.unanswered)}</p>
                    <button class="analysis-practice-chapter" data-chapter-id="${n(x.chapter_id)}" data-subject-id="${n(x.subject_id)}" data-chapter-number="${safe(x.chapter_number)}" data-chapter-name="${safe(x.chapter_name)}" data-subject-name="${safe(x.subject_name)}">⚡ Practice This Chapter</button>
                </div>`).join('') : '<p>🎉 60% पेक्षा कमी accuracy असलेला chapter सध्या दिसत नाही.</p>'}

            <h3>❌ Repeated Wrong / Unanswered Questions</h3>
            ${mistakes.length ? mistakes.map((q,i) => `
                <div class="question-box">
                    <strong>Q${i+1}. ${safe(q.question_text)}</strong>
                    <p>📖 ${safe(q.subject_name)} — ${safe(q.chapter_number)} ${safe(q.chapter_name)}</p>
                    <p>तुमचे अलीकडचे उत्तर: <strong>${safe(optionText(q,q.latest_selected_option))}</strong></p>
                    <p>✅ योग्य उत्तर: <strong>${safe(optionText(q,q.correct_option))}</strong></p>
                    ${q.mcq_explanation ? `<p>💡 Explanation: ${safe(q.mcq_explanation)}</p>` : ''}
                    <p>❌ Wrong: ${n(q.wrong_count)} &nbsp; ⭕ Unanswered: ${n(q.unanswered_count)}</p>
                </div>`).join('') : '<p>Repeated mistakes सापडल्या नाहीत.</p>'}

            <h3>💡 What Should I Do Next?</h3>
            <div class="question-box">
                ${recommendations.length ? `<ol>${recommendations.map(x=>`<li>${safe(x)}</li>`).join('')}</ol>` : '<p>Mock Test द्या आणि analysis तयार होईल.</p>'}
                <button id="analysisMockTestButton">📝 Take Another Mock Test</button>
                <button id="analysisSmartRevisionButton">🧠 Smart Revision</button>
            </div>
        `;
        document.getElementById('analysisBackDashboard')?.addEventListener('click', loadStudentDashboard);
        document.getElementById('analysisMockTestButton')?.addEventListener('click', loadMockTest);
        document.getElementById('analysisSmartRevisionButton')?.addEventListener('click', loadSmartRevision);
        document.querySelectorAll('.analysis-practice-chapter').forEach(btn => {
            btn.addEventListener('click', () => {
                loadQuestions(
                    {id:Number(btn.dataset.chapterId),chapter_number:btn.dataset.chapterNumber,chapter_name:btn.dataset.chapterName},
                    {id:Number(btn.dataset.subjectId),name:btn.dataset.subjectName},
                    loadExamAnalysis
                );
            });
        });
    } catch (e) {
        console.error('Exam Analysis Error', e);
        container.innerHTML = `<h2>📊 Exam Result Analysis</h2><p>❌ Analysis load झाला नाही.</p><p>${dailyPracticeEscape(e.message)}</p>`;
    }
}

document.getElementById('examAnalysisButton')?.addEventListener('click', loadExamAnalysis);

// ================================================
// STAGE 10 STEP 28 - SMART REVISION + 7-DAY PLAN
// ================================================
async function loadSmartRevision() {
    const container=document.getElementById('subjectsContainer'); const sid=localStorage.getItem('studentId');
    if(!container) return;
    if(!sid){container.innerHTML='<h2>🧠 Smart Revision</h2><p>पहिले Student Login करा.</p>';return;}
    container.innerHTML='<h2>🧠 Smart Revision</h2><p>⏳ तुमच्यासाठी personalized plan तयार करत आहे...</p>';
    try{
        const r=await fetch(`${API_URL}/api/students/${sid}/smart-study-plan`); const d=await r.json(); if(!r.ok||d.success===false) throw new Error(d.error||'Plan load failed');
        const safe=v=>dailyPracticeEscape(v==null?'':v), n=v=>Number(v)||0;
        const chapterCard=(x,button=true)=>x?`<div class="question-box"><strong>📖 ${safe(x.subjectName)} — ${safe(x.chapterNumber)} ${safe(x.chapterName)}</strong><p>Exam Accuracy: <strong>${n(x.accuracy)}%</strong></p>${button?`<button class="smart-practice" data-chapter-id="${n(x.chapterId)}" data-subject-id="${n(x.subjectId)}">⚡ Practice</button>`:''}</div>`:'';
        container.innerHTML=`<button id="smartBack">← Back</button><h2>🧠 Smart Revision & Personalized Study Plan</h2><div class="question-box"><h3>🎯 आजचा Focus</h3><p>${safe(d.message)}</p>${chapterCard(d.priority)}</div><h3>🔴 Weak Chapters</h3>${d.weakChapters?.length?d.weakChapters.map(x=>chapterCard(x)).join(''):'<p>🎉 60% पेक्षा कमी accuracy असलेला chapter नाही.</p>'}<h3>🟡 Improvement Chapters</h3>${d.needsImprovement?.length?d.needsImprovement.map(x=>chapterCard(x)).join(''):'<p>सध्या major improvement chapter नाही.</p>'}<h3>🟢 Strong Chapters</h3>${d.strongChapters?.length?d.strongChapters.map(x=>chapterCard(x,false)).join(''):'<p>Mock Test data उपलब्ध नाही.</p>'}<h3>📅 7-Day Smart Study Plan</h3>${(d.sevenDayPlan||[]).map(day=>`<div class="question-box"><h4>Day ${day.day}</h4>${day.focus?`<p><strong>🎯 Focus:</strong> ${safe(day.focus.subjectName)} — ${safe(day.focus.chapterNumber)} ${safe(day.focus.chapterName)} (${n(day.focus.accuracy)}%)</p>`:'<p>🎯 Focus: General revision</p>'}${day.secondFocus?`<p><strong>➕ Secondary:</strong> ${safe(day.secondFocus.subjectName)} — ${safe(day.secondFocus.chapterNumber)} ${safe(day.secondFocus.chapterName)}</p>`:''}<ul>${(day.actions||[]).map(a=>`<li>${safe(a)}</li>`).join('')}</ul></div>`).join('')}<div class="question-box"><button id="smartMock">📝 Take Mock Test</button><button id="smartExamAnalysis">📊 Exam Analysis</button></div>`;
        document.getElementById('smartBack')?.addEventListener('click',loadStudentDashboard); document.getElementById('smartMock')?.addEventListener('click',loadMockTest); document.getElementById('smartExamAnalysis')?.addEventListener('click',loadExamAnalysis);
    }catch(e){console.error('Smart Revision Error',e);container.innerHTML=`<h2>🧠 Smart Revision</h2><p>❌ Smart Plan load झाला नाही.</p><p>${dailyPracticeEscape(e.message)}</p>`;}
}



// ================================================
// STEP 57 — 30-DAY PASS STUDY ENGINE
// ================================================
function passChallengeKey() {
    const sid = localStorage.getItem("studentId") || "guest";
    return `passChallenge_${sid}`;
}
function passChallengeLoad() {
    try { return JSON.parse(localStorage.getItem(passChallengeKey()) || "null"); }
    catch(e) { return null; }
}
function passChallengeSave(data) { localStorage.setItem(passChallengeKey(), JSON.stringify(data)); }

async function loadPassChallenge() {
    const container=document.getElementById("subjectsContainer");
    const sid=localStorage.getItem("studentId");
    if(!container) return;
    if(!sid){ container.innerHTML='<h2>📅 30-Day PASS Study Engine</h2><p>पहिले Student Login करा.</p>'; return; }
    container.innerHTML='<h2>📅 30-Day PASS Study Engine</h2><p>⏳ तुमच्या verified PYQs वरून personalized 30-day plan तयार होत आहे...</p>';
    try{
        const r=await fetch(`${API_URL}/api/students/${sid}/pass-plan-30`,{cache:'no-store'});
        const d=await r.json();
        if(!r.ok||!d.success) throw new Error(d.error||'Unable to load PASS plan');
        let state=passChallengeLoad();
        if(!state || state.planVersion!=='57'){
            state={planVersion:'57',completed:{},createdAt:new Date().toISOString()};
            passChallengeSave(state);
        }
        const completed=state.completed||{};
        const completedCount=Object.values(completed).filter(Boolean).length;
        const progress=Math.round((completedCount/30)*100);
        const day=Math.min(30,Math.max(1,Math.max(1,completedCount+1)));
        const plan=d.days[day-1]||d.days[0];
        const safe=v=>dailyPracticeEscape(v==null?'':v);
        const focus=plan.focus;
        const questionHtml=(plan.questions||[]).map((q,i)=>`<div class="question-box" style="margin:8px 0"><strong>${i+1}. ${safe(q.subject_name)} — ${safe(q.chapter_number)} ${safe(q.chapter_name)}</strong><p>${safe(q.question_text)}</p><p>📅 ${safe(q.pyq_year)} &nbsp; | &nbsp; Marks: ${Number(q.marks)||1} ${Number(q.pyq_frequency)>1?'| 🔥 Repeated '+Number(q.pyq_frequency)+'×':''}</p><p>${q.student_status==='revision'?'🔴 Revision priority':q.source_type==='PYQ_REPEATED'?'🔁 Repeated PYQ':'🟡 First study'}</p><button class="pass-show-answer" data-answer="${safe(q.id)}">👁 Show Easy Answer</button><div id="pass-answer-${safe(q.id)}" style="display:none"><strong>Easy Answer:</strong> ${safe(q.easy_answer||'Answer not available.')}</div></div>`).join('');
        container.innerHTML=`<button id="challengeBack">← Back</button>
          <h2>📅 STEP 57 — 30-Day PASS Study Engine</h2>
          <div class="question-box"><h3>🎯 PASS-first plan for ${safe(d.student.name)}</h3>
          <p>${safe(d.message)}</p><p><strong>Verified PYQs:</strong> ${Number(d.stats.verifiedPYQs)||0} &nbsp; | &nbsp; <strong>Repeated:</strong> ${Number(d.stats.repeated)||0} &nbsp; | &nbsp; <strong>Revision:</strong> ${Number(d.stats.revision)||0}</p>
          <p><strong>30-Day Completion:</strong> ${completedCount}/30 (${progress}%)</p>
          <div style="background:#eee;border-radius:8px;height:14px;overflow:hidden"><div style="width:${progress}%;height:14px;background:#4caf50"></div></div></div>
          <div class="question-box"><h3>🔥 Day ${plan.day} — ${safe(plan.phase)}</h3>
          ${focus?`<p><strong>📖 Focus:</strong> ${safe(focus.subject_name)} — ${safe(focus.chapter_number)} ${safe(focus.chapter_name)}</p>`:''}
          <ul>${(plan.actions||[]).map(a=>`<li>${safe(a)}</li>`).join('')}</ul>
          <p><strong>Today's verified PYQs:</strong> ${plan.questionCount}</p>
          ${completed[String(plan.day)]?'<p>✅ आजचा दिवस पूर्ण झाला.</p>':'<button id="completePassDay">✅ Complete Day '+plan.day+'</button>'}
          <button id="challengeSmartRevision">🧠 Smart Revision</button> <button id="challengeMockTest">📝 Mock Test</button></div>
          <h3>📝 Today's PYQ Practice</h3>${questionHtml||'<p>आजचे प्रश्न उपलब्ध नाहीत. Smart Revision वापरा.</p>'}
          <h3>📊 Priority Chapters</h3>${(d.priorityChapters||[]).slice(0,10).map((c,i)=>`<div class="question-box"><strong>${i+1}. ${safe(c.subject_name)} — ${safe(c.chapter_number)} ${safe(c.chapter_name)}</strong><p>🔁 Repeated: ${c.repeated} | 🟡 Unstarted: ${c.unstarted} | 🔴 Revision: ${c.revision}</p></div>`).join('')}
          <h3>📆 30-Day Plan</h3>${(d.days||[]).map(x=>`<div class="question-box" style="margin:6px 0"><strong>${completed[String(x.day)]?'✅':x.day===plan.day?'🎯':'⬜'} Day ${x.day}</strong> — ${safe(x.phase)} — ${x.questionCount} PYQs</div>`).join('')}
          <div class="question-box"><p><strong>ℹ️ Important:</strong> हा study-planning tool आहे. Board चा official syllabus, paper pattern किंवा passing rule बदलत नाही.</p></div>`;
        document.getElementById("challengeBack")?.addEventListener("click",loadStudentDashboard);
        document.getElementById("completePassDay")?.addEventListener("click",()=>{state.completed=state.completed||{};state.completed[String(plan.day)]=true;state.lastCompletedAt=new Date().toISOString();passChallengeSave(state);loadPassChallenge();});
        document.getElementById("challengeSmartRevision")?.addEventListener("click",loadSmartRevision);
        document.getElementById("challengeMockTest")?.addEventListener("click",loadMockTest);
        document.querySelectorAll('.pass-show-answer').forEach(btn=>btn.addEventListener('click',()=>{ const id=btn.getAttribute('data-answer'); const box=document.getElementById(`pass-answer-${id}`); if(box) box.style.display='block'; }));
    }catch(e){ console.error('STEP 57 PASS Engine Error',e); container.innerHTML=`<h2>📅 STEP 57 — 30-Day PASS Study Engine</h2><p>❌ Plan load झाला नाही.</p><p>${dailyPracticeEscape(e.message)}</p>`; }
}

document.getElementById("passChallengeButton")?.addEventListener("click", loadPassChallenge);


/* STEP 98 — Keep Student Login at the very top of the public/student page */
(function(){
  function moveStudentLoginToTop(){
    const top=document.getElementById('studentLoginTop');
    if(!top) return;
    const selectors=[
      '#loginSection','#loginCard','.login-card','.login-section',
      '[id*="login" i]','[class*="login" i]'
    ];
    let target=null;
    for(const sel of selectors){
      const els=document.querySelectorAll(sel);
      for(const el of els){
        if(el && el.id!=='studentLoginTop' && /login|sign.?in/i.test((el.id||'')+' '+(el.className||''))){
          target=el; break;
        }
      }
      if(target) break;
    }
    if(target && target.parentElement!==top){
      top.appendChild(target);
      target.classList.add('student-login-top');
    }
  }
  document.addEventListener('DOMContentLoaded',moveStudentLoginToTop);
  const obs=new MutationObserver(()=>moveStudentLoginToTop());
  if(document.body) obs.observe(document.body,{childList:true,subtree:true});
  window.moveStudentLoginToTop=moveStudentLoginToTop;
})();


\n/* STEP 102 — English Kumarbharati 5-Year PYQ Master: direct menu handler\n   This handler is embedded in script.js so it works even if the external PYQ file is not loaded.\n*/\n(function(){\n  const ENGLISH_5YR_PYQ=[{"year":2026,"section":"Grammar","chapter":"Grammar","q":"Identify the infinitive in the sentence about every child being free to grow.","a":"The infinitive is 'to grow'.","marks":1,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Grammar","chapter":"Grammar","q":"Give two original compound words as required in the board paper.","a":"Examples: classroom, notebook. Any two correct compound words are acceptable.","marks":1,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Grammar","chapter":"Grammar","q":"Rewrite the sentence about someone telling three stories in the future perfect tense.","a":"Use 'will/shall have + past participle'. Example: I shall have told you three stories.","marks":2,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Grammar","chapter":"Grammar","q":"Change the sentence about Anil watching a wrestling match into passive voice.","a":"A wrestling match was being watched by Anil.","marks":2,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Textual Passage","chapter":"1.2 An Encounter of a Special Kind","q":"What lesson can a student draw from a passage-based question about courage and human values?","a":"The answer should identify the value shown in the passage and explain it with a relevant detail, using complete sentences.","marks":2,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Poetry","chapter":"Poetry","q":"Identify the rhyme scheme, figure of speech and central idea from the prescribed poem extract.","a":"Read the end words to determine the rhyme scheme, identify the comparison/image used for the figure of speech, and state the poem's main message in 2–3 sentences.","marks":4,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Non-textual Passage","chapter":"Reading Skills","q":"What are the main causes of species extinction discussed in the 2026 passage?","a":"The passage points to air and water pollution, habitat loss from forest cutting, drying water sources and hunting as important causes.","marks":2,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Writing Skills","chapter":"Writing Skill","q":"Write a suitable response based on a non-textual passage and its activities.","a":"Use the passage only: identify the requested facts, write complete grammatical sentences, and keep the answer directly linked to the information given.","marks":2,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Writing Skills","chapter":"Writing Skill","q":"For a board speech/view-counterview task, how should the answer be structured?","a":"Begin with greeting/topic, develop the given points logically, add one or two relevant supporting ideas, and close appropriately.","marks":5,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2026,"section":"Creative Writing","chapter":"Creative Writing","q":"How should a student attempt a 5-mark creative-writing task in the board paper?","a":"Follow the required format, give a clear beginning-middle-end, use correct tense and paragraphing, and ensure the content directly matches the prompt.","marks":5,"source":"https://www.shaalaa.com/hin/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2025-2026-board-question-paper_20627"},{"year":2025,"section":"Grammar","chapter":"Grammar","q":"Pick out the infinitive from the sentence about asking to go for a concert.","a":"The infinitive is 'to go'.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Grammar","chapter":"Grammar","q":"Identify the type of the sentence that tells someone to get out and wait in the yard.","a":"It is an imperative sentence because it expresses a command/instruction.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Grammar","chapter":"Grammar","q":"Arrange the four words beginning with 'in...' in alphabetical order.","a":"Compare the letters from left to right and arrange them lexicographically; 'indisputable' comes before words beginning with 'inter...' when the shared letters are compared.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Grammar","chapter":"Grammar","q":"Change 'I am doing my bit' into the past perfect continuous tense.","a":"I had been doing my bit.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Textual Passage","chapter":"2.1 The Thief's Story","q":"How can a student answer a 2-mark personal-response question based on the textual passage?","a":"State your own view clearly, then give one or two logical reasons connected with the values or situation in the passage.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Textual Passage","chapter":"Reading Skills","q":"From the World Heritage passage, name the type of information that can be matched between sites and countries.","a":"The activity tests factual reading: match each heritage site with the country named in the passage.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Textual Passage","chapter":"Reading Skills","q":"State two ways historical monuments can be preserved.","a":"Prevent vandalism and pollution, control uncontrolled tourism, maintain the sites scientifically, and enforce heritage-protection laws. Any two relevant measures earn credit.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Poetry","chapter":"3.4 The Inchcape Rock","q":"In a poem-appreciation answer, what five elements should be covered?","a":"Mention the title, poet, rhyme scheme, important figures of speech, and the central idea/theme. Write them as a connected paragraph.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Writing Skills","chapter":"Writing Skill","q":"Write a formal letter inviting an educationist to address students on Reading Inspiration Day.","a":"Use sender address/date, receiver address, subject, salutation, concise invitation with event details, polite closing and signature.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2025,"section":"Creative Writing","chapter":"Creative Writing","q":"Develop a story ending with a lesson about punctuality.","a":"Create a logical incident where delay causes a problem, show the character learning from it, and end with the given punctuality lesson.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2024-2025-official_20026"},{"year":2024,"section":"Grammar","chapter":"Grammar","q":"Pick out the infinitive from the sentence 'Every child is free to grow.'","a":"The infinitive is 'to grow'.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Grammar","chapter":"Grammar","q":"Give suitable collocations for the words 'ticket' and 'drizzle'.","a":"Examples: ticket booth/ticket counter; light drizzle. Use natural word combinations accepted in context.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Grammar","chapter":"Grammar","q":"Punctuate the sentence about Dr. Kalam sitting and contemplating deeply.","a":"Dr. Kalam sat, contemplating deeply.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Grammar","chapter":"Grammar","q":"Rewrite the sentence about the bill being passed using 'as soon as'.","a":"As soon as the bill is passed, it will become an act.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Textual Passage","chapter":"1.2 An Encounter of a Special Kind","q":"Why did the girl in the passage become excited?","a":"She was excited because the expected musical event/meeting offered her an opportunity connected with the musician she admired.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Poetry","chapter":"1.4 All the World's a Stage","q":"Identify the stages of life represented by the soldier, schoolboy, lover and justice.","a":"They represent the fourth, second, third and fifth stages respectively in Shakespeare's seven-age description of human life.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Poetry","chapter":"1.4 All the World's a Stage","q":"Identify the figure of speech in the statement comparing the whole world to a stage.","a":"It is a metaphor: the world is directly compared with a stage.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Poetry","chapter":"3.3 The Height of the Ridiculous","q":"What should an appreciation of 'The Height of the Ridiculous' include?","a":"Write the title, poet, rhyme scheme, figures of speech and central idea/theme in a coherent paragraph.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Writing Skills","chapter":"Writing Skill","q":"Write a formal letter to a newspaper editor about the role of sports in a student's life.","a":"Follow formal-letter format and explain physical fitness, mental freshness, discipline, teamwork and efficiency, with a suitable closing.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2024,"section":"Writing Skills","chapter":"Writing Skill","q":"Convert information about sugar-beet processing into a flowchart.","a":"Show the sequence: harvesting → washing → slicing → hot-water extraction → purification/filtering → crystallisation → washing/drying/cooling → delivery.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2023-2024-official_18733"},{"year":2023,"section":"Textual Passage","chapter":"1.2 An Encounter of a Special Kind","q":"Why was Anant better than his sister at playing the sitar?","a":"The passage says he was better at several things and had progressed enough to compose his own tunes.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Textual Passage","chapter":"1.2 An Encounter of a Special Kind","q":"Why did Smita become nervous in the passage?","a":"Her nervousness was linked to the serious illness and the important musical opportunity surrounding Anant and the concert.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Grammar","chapter":"Grammar","q":"Frame a Wh-question so that the underlined action 'to play the sitar' is the answer.","a":"What was he learning to do?","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Grammar","chapter":"Grammar","q":"Identify the modal auxiliary in the sentence about someone being treated at a cancer hospital and state its function.","a":"The modal is 'could'. It expresses possibility/ability in the context of treatment.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Poetry","chapter":"1.4 All the World's a Stage","q":"Identify the life stages represented by 'full of strange oaths', 'creeping like a snail', 'sighing like a furnace' and 'fair round belly'.","a":"They represent soldier, schoolboy, lover and justice respectively.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Poetry","chapter":"1.4 All the World's a Stage","q":"What similarities exist between the first and last stages of human life in the poem?","a":"Both resemble childhood: dependence increases, physical abilities decline, and the person becomes childlike again.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Poetry","chapter":"1.4 All the World's a Stage","q":"Identify the figure of speech in 'All the world's a stage'.","a":"Metaphor, because the world is directly compared with a stage.","marks":1,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Writing Skills","chapter":"Writing Skill","q":"Write a letter to a newspaper editor creating awareness about the role of sports in a student's life.","a":"Explain how sports improve physical fitness, mental health, discipline, teamwork and efficiency. Use correct formal-letter format.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Writing Skills","chapter":"Writing Skill","q":"Convert the sugar-beet processing information into a flowchart.","a":"Present the processing stages in correct order from harvesting and washing through slicing, extraction, purification, crystallisation and final delivery.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2023,"section":"Creative Writing","chapter":"Creative Writing","q":"Write a story from the given ending that teaches the importance of punctuality.","a":"Build a coherent incident leading naturally to the given ending, then highlight punctuality as the lesson learned.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2022-2023-official_18490"},{"year":2022,"section":"Textual Passage","chapter":"1.2 An Encounter of a Special Kind","q":"Why was Smita nervous in the passage involving Anant's illness and the planned musical event?","a":"She was anxious because Anant was seriously ill and the musical opportunity was emotionally important to the family.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Reading Skills","chapter":"Reading Skills","q":"Why should historical sites be protected, according to the heritage passage?","a":"They preserve cultural and natural heritage for future generations and need protection from damage, pollution, war and uncontrolled development.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Grammar","chapter":"Grammar","q":"Rewrite a sentence about UNESCO and an international council using 'not only ... but also'.","a":"Join the two relevant actions with the correlative conjunction: not only ... but also, keeping the meaning and tense correct.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Grammar","chapter":"Grammar","q":"Identify whether the sentence describing conservation goals is simple, compound or complex.","a":"Check the number and relationship of independent/dependent clauses. A sentence containing a main clause plus a dependent clause is complex.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Poetry","chapter":"3.2 Animals","q":"State whether animals are shown as placid and self-contained in the poem 'Animals'.","a":"True. The poet presents animals as calm, contented and free from many human anxieties.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Poetry","chapter":"3.2 Animals","q":"What craze do the animals never display, according to the poem?","a":"They do not show the human mania for possessing and owning things.","marks":2,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Poetry","chapter":"3.1 Night of the Scorpion","q":"What should an appreciation of 'Night of the Scorpion' cover?","a":"Mention title, poet, rhyme scheme, figures of speech and the central idea/theme, then connect them in a short paragraph.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Writing Skills","chapter":"Writing Skill","q":"Write a formal letter requesting an event to felicitate young girl achievers.","a":"Use formal format, state the purpose clearly, suggest the event and its benefits, and close politely with the writer's details.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Writing Skills","chapter":"Writing Skill","q":"Write an informal letter explaining the importance of women in society.","a":"Write in friendly letter format and explain women's roles in education, family, work, leadership and social development with relevant examples.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"},{"year":2022,"section":"Information Transfer","chapter":"Writing Skill","q":"Convert information comparing turtles and tortoises into a table or chart.","a":"Compare habitat, shell, feet/legs, food habits and lifespan under clear headings.","marks":5,"source":"https://www.shaalaa.com/question-paper-solution/maharashtra-board-ssc-english-10th-standard-2021-2022-set-1_18254"}];\n  function escE(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}\n  function openEnglishPYQMaster(){\n    const c=document.getElementById('subjectsContainer'); if(!c)return;\n    c.innerHTML=`<button id="backEnglish5Direct">← Back</button><div class="medium-badge">🇬🇧 English Medium • English Kumarbharati</div><h2>🏆 PYQ MASTER — ENGLISH KUMARBHARATI</h2><div class="question-box"><h3>📚 Last 5 Board Years — 2026 → 2022</h3><p><strong>50 PYQ-based questions with answers</strong> • 10 from each year</p><div id="english5DirectYears">${[2026,2025,2024,2023,2022].map(y=>`<button class="english5direct-year" data-year="${y}">📅 ${y}</button>`).join('')}<button class="english5direct-year" data-year="all">📚 All 5 Years</button></div></div><div id="english5DirectList"></div>`;\n    document.getElementById('backEnglish5Direct').onclick=()=>window.loadSubjects?.();\n    c.querySelectorAll('.english5direct-year').forEach(b=>b.onclick=()=>renderE(b.dataset.year));\n    renderE('all');\n  }\n  function renderE(year){\n    const box=document.getElementById('english5DirectList'); if(!box)return;\n    const arr=year==='all'?ENGLISH_5YR_PYQ:ENGLISH_5YR_PYQ.filter(x=>String(x.year)===String(year));\n    const grouped={}; arr.forEach(x=>(grouped[x.year]??=[]).push(x));\n    box.innerHTML=Object.keys(grouped).sort((a,b)=>b-a).map(y=>`<div class="question-box"><h3>📅 ${y} — English Kumarbharati PYQs</h3>${grouped[y].map((q,i)=>`<div class="question-box"><span class="pyq-badge">🟢 PYQ-BASED • ${q.year}</span><p><strong>${i+1}. ${escE(q.chapter)}</strong> • ${escE(q.section)} • ${q.marks||1} Marks</p><p>${escE(q.q)}</p><button class="english5direct-answer">👁️ Show Answer</button><div class="english5direct-answer-box" style="display:none"><p><strong>✅ Answer:</strong> ${escE(q.a)}</p><p><strong>🧠 Keywords:</strong> English Kumarbharati, ${escE(q.section)}, ${escE(q.chapter)}</p><small>Year: ${q.year} • Verified board-paper source reference</small></div></div>`).join('')}</div>`).join('');\n    box.querySelectorAll('.english5direct-answer').forEach(b=>b.onclick=()=>{const a=b.nextElementSibling;a.style.display=a.style.display==='none'?'block':'none';});\n  }\n  window.openEnglishPYQMaster=openEnglishPYQMaster;\n  function wire(){\n    document.querySelectorAll('[data-nav-target="pyqMasterButton"]').forEach(b=>{b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();openEnglishPYQMaster();};});\n    const b=document.getElementById('pyqMasterButton'); if(b)b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();openEnglishPYQMaster();};\n  }\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire();\n  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});\n})();\n

/* STEP 103 — Reliable Student Login -> Start Studying navigation */
(function(){
 async function go(e){
  const b=e.target.closest('button'); if(!b)return;
  if(!/start\s*studying/i.test((b.innerText||b.textContent||'').replace(/\s+/g,' ').trim()))return;
  e.preventDefault(); e.stopImmediatePropagation();
  const n=(document.getElementById('studentName')?.value||localStorage.getItem('studentName')||'').trim();
  const m=(document.getElementById('studentMobile')?.value||localStorage.getItem('studentMobile')||'').trim();
  if(!n){alert('Please enter your name.');return;}
  if(m && !/^\d{10}$/.test(m)){alert('Please enter a valid 10-digit mobile number.');return;}
  const old=b.innerHTML;b.disabled=true;b.innerHTML='⏳ Starting...';
  try{
   let ok=!!localStorage.getItem('studentId');
   const api=window.API_URL||location.origin;
   for(const ep of ['/api/students/login','/api/students/register','/api/students']){
    if(ok)break;
    try{
     const r=await fetch(api+ep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,mobile:m})});
     const d=await r.json().catch(()=>null); const s=d?.student||d?.data||d;
     const id=s?.id||d?.studentId||d?.id;
     if(r.ok&&id){localStorage.setItem('studentId',String(id));localStorage.setItem('studentName',n);if(m)localStorage.setItem('studentMobile',m);ok=true;}
    }catch(_){}
   }
   if(ok && typeof window.loadSubjects==='function') await window.loadSubjects();
   else if(ok) document.getElementById('subjectsContainer')?.scrollIntoView({behavior:'smooth'});
   else alert('Login could not be completed. Please try again.');
  }finally{b.disabled=false;b.innerHTML=old;}
 }
 document.addEventListener('click',go,true);
})();
