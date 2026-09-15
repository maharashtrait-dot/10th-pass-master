const API_URL = (() => {
    // Local file / localhost -> local backend. Published app -> same Node origin.
    if (window.location.protocol === "file:") return "http://localhost:3001";
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3001";
    return window.location.origin;
})();


// ================================================
// LOAD ALL SUBJECTS
// ================================================

async function loadAdminSubjects() {

    const subjectSelect =
        document.getElementById("adminSubject");

    try {

        const response = await fetch(
            `${API_URL}/api/subjects`
        );

        if (!response.ok) {
            throw new Error("Unable to load subjects");
        }

        const subjects =
            await response.json();


        subjectSelect.innerHTML = `
            <option value="">
                Select Subject
            </option>
        `;


        subjects.forEach((subject) => {

            const option =
                document.createElement("option");

            option.value =
                subject.id;

            option.textContent =
                subject.name;

            subjectSelect.appendChild(option);

        });


    } catch (error) {

        console.error(
            "Subject Load Error:",
            error
        );

        document
            .getElementById("adminMessage")
            .innerText =
            "Unable to load subjects.";

    }

}


// ================================================
// LOAD CHAPTERS
// ================================================

async function loadAdminChapters() {

    const subjectSelect =
        document.getElementById("adminSubject");

    const chapterSelect =
        document.getElementById("adminChapter");

    const subjectId =
        subjectSelect.value;


    chapterSelect.innerHTML =
        '<option value="">Loading chapters...</option>';


    if (!subjectId) {

        chapterSelect.innerHTML =
            '<option value="">Select Chapter</option>';

        return;

    }


    try {

        const response = await fetch(
            `${API_URL}/api/subjects/${subjectId}/chapters`
        );


        if (!response.ok) {

            throw new Error(
                "Chapter API error"
            );

        }


        const chapters =
            await response.json();


        chapterSelect.innerHTML =
            '<option value="">Select Chapter</option>';


        if (
            !Array.isArray(chapters) ||
            chapters.length === 0
        ) {

            chapterSelect.innerHTML =
                '<option value="">No chapters available</option>';

            return;

        }


        chapters.forEach((chapter) => {

            const option =
                document.createElement("option");

            option.value =
                chapter.id;

            option.textContent =
                `Chapter ${chapter.chapter_number}: ${chapter.chapter_name}`;

            chapterSelect.appendChild(option);

        });


    } catch (error) {

        console.error(
            "Chapter Load Error:",
            error
        );


        chapterSelect.innerHTML =
            '<option value="">Unable to load chapters</option>';


        document
            .getElementById("adminMessage")
            .innerText =
            "Unable to load chapters.";

    }

}


// ================================================
// LOAD PYQ QUESTION PAPERS
// ================================================

async function loadAdminQuestionPapers() {

    const select =
        document.getElementById(
            "questionPaper"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">-- Select PYQ Paper --</option>';


    try {

        const response = await fetch(
            `${API_URL}/api/question-papers`
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load PYQ papers"
            );

        }


        const papers =
            await response.json();


        papers.forEach((paper) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                paper.id;


            option.textContent =
                `${paper.subject_name} - ${paper.exam_year} - ${paper.exam_month || ""} - ${paper.paper_type || ""}`;


            select.appendChild(option);

        });


    } catch (error) {

        console.error(
            "PYQ Paper Load Error:",
            error
        );


        select.innerHTML =
            '<option value="">Unable to load PYQ papers</option>';

    }

}


// ================================================
// FILTER PYQ PAPERS BY SELECTED SUBJECT
// ================================================

async function loadQuestionPapersForSubject() {

    const subjectId =
        document
            .getElementById("adminSubject")
            .value;


    const select =
        document.getElementById(
            "questionPaper"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">-- Select PYQ Paper --</option>';


    if (!subjectId) {
        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/api/subjects/${subjectId}/question-papers`
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load subject PYQ papers"
            );

        }


        const papers =
            await response.json();


        if (papers.length === 0) {

            select.innerHTML =
                '<option value="">No PYQ papers for this subject</option>';

            return;

        }


        papers.forEach((paper) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                paper.id;


            option.textContent =
                `${paper.exam_year} - ${paper.exam_month || ""} - ${paper.paper_type || ""}`;


            select.appendChild(option);

        });


    } catch (error) {

        console.error(
            "Subject PYQ Paper Error:",
            error
        );


        select.innerHTML =
            '<option value="">Unable to load PYQ papers</option>';

    }

}


// ================================================
// ADD NEW QUESTION
// ================================================

async function addQuestion() {

    const message =
        document.getElementById(
            "adminMessage"
        );


    const subjectId =
        document
            .getElementById("adminSubject")
            .value;


    const chapterId =
        document
            .getElementById("adminChapter")
            .value;


    const questionPaperElement =
        document.getElementById(
            "questionPaper"
        );


    const questionPaperId =
        questionPaperElement
            ? questionPaperElement.value
            : "";


    const questionText =
        document
            .getElementById("adminQuestion")
            .value
            .trim();


    const marks =
        document
            .getElementById("adminMarks")
            .value;


    const pyqYear =
        document
            .getElementById("adminPyqYear")
            .value;


    const hint =
        document
            .getElementById("adminHint")
            .value
            .trim();


    const easyAnswer =
        document
            .getElementById("adminEasyAnswer")
            .value
            .trim();


    const keywords =
        document
            .getElementById("adminKeywords")
            .value
            .trim();


    const questionType =
        document
            .getElementById("adminQuestionType")
            .value;


    const difficulty =
        document
            .getElementById("adminDifficulty")
            .value;


    // ====================================
    // VALIDATION
    // ====================================

    if (!subjectId) {

        message.innerText =
            "Please select a Subject.";

        return;

    }


    if (!chapterId) {

        message.innerText =
            "Please select a Chapter.";

        return;

    }


    if (!questionText) {

        message.innerText =
            "Please enter a question.";

        return;

    }


    message.innerText =
        "Saving question...";


    try {

        const response = await fetch(

            `${API_URL}/api/admin/questions`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },


                body: JSON.stringify({

                    chapter_id:
                        Number(chapterId),

                    question_text:
                        questionText,

                    marks:
                        Number(marks) || 1,

                    hint:
                        hint || null,

                    easy_answer:
                        easyAnswer || null,

                    keywords:
                        keywords || null,

                    question_type:
                        questionType,

                    difficulty:
                        difficulty,

                    pyq_year:
                        pyqYear
                            ? Number(pyqYear)
                            : null,

                    question_paper_id:
                        questionPaperId
                            ? Number(questionPaperId)
                            : null

                })

            }

        );


        const data =
            await response.json();


        if (!response.ok) {

            message.innerText =
                data.error ||
                "Unable to add question.";

            return;

        }


        // ====================================
        // SUCCESS
        // ====================================

        if (data.success) {

            message.innerText =
                "✅ Question added successfully!";


            // Clear question fields

            document
                .getElementById("adminQuestion")
                .value = "";


            document
                .getElementById("adminMarks")
                .value = "1";


            document
                .getElementById("adminPyqYear")
                .value = "";


            document
                .getElementById("adminHint")
                .value = "";


            document
                .getElementById("adminEasyAnswer")
                .value = "";


            document
                .getElementById("adminKeywords")
                .value = "";


            document
                .getElementById("adminQuestionType")
                .value = "Important";


            document
                .getElementById("adminDifficulty")
                .value = "Easy";


            // Keep Subject + Chapter selected
            // but reset PYQ paper

            if (questionPaperElement) {

                questionPaperElement.value = "";

            }


        } else {

            message.innerText =
                data.error ||
                "Unable to add question.";

        }


    } catch (error) {

        console.error(
            "Add Question Error:",
            error
        );


        message.innerText =
            "Server connection error.";

    }

}


// ================================================
// SUBJECT CHANGE EVENT
// ================================================

document
    .getElementById("adminSubject")
    .addEventListener(

        "change",

        async function () {

            await loadAdminChapters();

            await loadQuestionPapersForSubject();

        }

    );


// ================================================
// ADD QUESTION BUTTON
// ================================================

document
    .getElementById("addQuestionButton")
    .addEventListener(

        "click",

        addQuestion

    );


// ================================================
// START ADMIN PAGE
// ================================================

loadAdminSubjects();

loadAdminQuestionPapers();

// ================================================
// QUESTION BANK MANAGEMENT - STAGE 7
// ================================================

let editingQuestionId = null;
let managementSubjects = [];

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function loadManagementSubjects() {
    const select = document.getElementById("manageSubject");
    if (!select) return;

    try {
        const response = await fetch(`${API_URL}/api/subjects`);
        if (!response.ok) throw new Error("Unable to load subjects");

        managementSubjects = await response.json();

        select.innerHTML = `<option value="">All Subjects</option>`;

        managementSubjects.forEach((subject) => {
            const option = document.createElement("option");
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Management Subject Error:", error);
    }
}

async function loadManagementChapters() {
    const subjectId = document.getElementById("manageSubject").value;
    const chapterSelect = document.getElementById("manageChapter");

    chapterSelect.innerHTML = `<option value="">All Chapters</option>`;

    if (!subjectId) return;

    try {
        const response = await fetch(
            `${API_URL}/api/subjects/${subjectId}/chapters`
        );
        if (!response.ok) throw new Error("Unable to load chapters");

        const chapters = await response.json();

        chapters.forEach((chapter) => {
            const option = document.createElement("option");
            option.value = chapter.id;
            option.textContent =
                `Chapter ${chapter.chapter_number}: ${chapter.chapter_name}`;
            chapterSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Management Chapter Error:", error);
    }
}

async function loadManagedQuestions() {
    const results = document.getElementById("questionManagementResults");
    const message = document.getElementById("questionManagementMessage");

    if (!results) return;

    results.innerHTML = `<p>⏳ Loading questions...</p>`;
    message.innerText = "";

    const subjectId = document.getElementById("manageSubject").value;
    const chapterId = document.getElementById("manageChapter").value;
    const status = document.getElementById("manageStatus").value;
    const search = document.getElementById("manageSearch").value.trim();

    const params = new URLSearchParams();
    if (subjectId) params.set("subject_id", subjectId);
    if (chapterId) params.set("chapter_id", chapterId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);

    try {
        const response = await fetch(
            `${API_URL}/api/admin/questions?${params.toString()}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to load questions");
        }

        results.innerHTML = "";

        if (!Array.isArray(data) || data.length === 0) {
            results.innerHTML = `<div class="question-box"><p>❌ No questions found.</p></div>`;
            message.innerText = "0 questions found.";
            return;
        }

        message.innerText = `${data.length} question(s) found.`;

        data.forEach((question) => {
            const box = document.createElement("div");
            box.className = "question-box";

            const statusText = question.is_active
                ? "🟢 ACTIVE"
                : "🔴 INACTIVE";

            const pyqText = question.question_paper_id
                ? `PYQ: ${escapeHTML(question.exam_year || question.pyq_year || "")} ${escapeHTML(question.exam_month || "")}`
                : (question.pyq_year ? `PYQ Year: ${escapeHTML(question.pyq_year)}` : "Not linked to PYQ");

            box.innerHTML = `
                <h3>Question ID: ${question.id}</h3>
                <p><strong>${statusText}</strong></p>
                <p>📚 <strong>${escapeHTML(question.subject_name)}</strong></p>
                <p>📖 Chapter ${escapeHTML(question.chapter_number)}: ${escapeHTML(question.chapter_name)}</p>
                <p>🔢 Marks: ${escapeHTML(question.marks)}</p>
                <p>📝 Type: ${escapeHTML(question.question_type)} | 🎯 ${escapeHTML(question.difficulty)}</p>
                <p>📄 ${pyqText}</p>
                <p><strong>❓ ${escapeHTML(question.question_text)}</strong></p>
                <button class="edit-question-button">✏ Edit</button>
                <button class="status-question-button">
                    ${question.is_active ? "⛔ Deactivate" : "✅ Activate"}
                </button>
            `;

            box.querySelector(".edit-question-button")
                .addEventListener("click", () => startEditQuestion(question));

            box.querySelector(".status-question-button")
                .addEventListener("click", () => toggleQuestionStatus(question));

            results.appendChild(box);
        });
    } catch (error) {
        console.error("Managed Questions Error:", error);
        results.innerHTML = `<div class="question-box"><p>❌ Unable to load questions.</p></div>`;
        message.innerText = error.message;
    }
}

async function startEditQuestion(question) {
    editingQuestionId = question.id;

    const subjectSelect = document.getElementById("adminSubject");
    const chapterSelect = document.getElementById("adminChapter");
    const paperSelect = document.getElementById("questionPaper");

    subjectSelect.value = String(question.subject_id);
    await loadAdminChapters();
    await loadQuestionPapersForSubject();
    chapterSelect.value = String(question.chapter_id);

    if (paperSelect) {
        paperSelect.value = question.question_paper_id
            ? String(question.question_paper_id)
            : "";
    }

    document.getElementById("adminQuestion").value = question.question_text || "";
    document.getElementById("adminMarks").value = question.marks || 1;
    document.getElementById("adminPyqYear").value = question.pyq_year || "";
    document.getElementById("adminHint").value = question.hint || "";
    document.getElementById("adminEasyAnswer").value = question.easy_answer || "";
    document.getElementById("adminKeywords").value = question.keywords || "";
    document.getElementById("adminQuestionType").value = question.question_type || "Important";
    document.getElementById("adminDifficulty").value = question.difficulty || "Easy";

    document.getElementById("addQuestionButton").innerText = "✏ UPDATE QUESTION";
    document.getElementById("adminMessage").innerText =
        `Editing Question ID ${question.id}. Make changes and click UPDATE QUESTION.`;

    let cancelButton = document.getElementById("cancelEditButton");
    if (!cancelButton) {
        cancelButton = document.createElement("button");
        cancelButton.id = "cancelEditButton";
        cancelButton.innerText = "❌ CANCEL EDIT";
        document.getElementById("addQuestionButton").insertAdjacentElement("afterend", cancelButton);
        cancelButton.addEventListener("click", cancelEditQuestion);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEditQuestion() {
    editingQuestionId = null;

    document.getElementById("adminQuestion").value = "";
    document.getElementById("adminMarks").value = "1";
    document.getElementById("adminPyqYear").value = "";
    document.getElementById("adminHint").value = "";
    document.getElementById("adminEasyAnswer").value = "";
    document.getElementById("adminKeywords").value = "";
    document.getElementById("adminQuestionType").value = "Important";
    document.getElementById("adminDifficulty").value = "Easy";

    const paperSelect = document.getElementById("questionPaper");
    if (paperSelect) paperSelect.value = "";

    document.getElementById("addQuestionButton").innerText = "💾 ADD QUESTION";
    document.getElementById("adminMessage").innerText = "Edit cancelled.";

    const cancelButton = document.getElementById("cancelEditButton");
    if (cancelButton) cancelButton.remove();
}

async function updateQuestion() {
    const message = document.getElementById("adminMessage");

    const chapterId = document.getElementById("adminChapter").value;
    const questionText = document.getElementById("adminQuestion").value.trim();
    const marks = document.getElementById("adminMarks").value;
    const pyqYear = document.getElementById("adminPyqYear").value;
    const hint = document.getElementById("adminHint").value.trim();
    const easyAnswer = document.getElementById("adminEasyAnswer").value.trim();
    const keywords = document.getElementById("adminKeywords").value.trim();
    const questionType = document.getElementById("adminQuestionType").value;
    const difficulty = document.getElementById("adminDifficulty").value;
    const paperValue = document.getElementById("questionPaper")?.value || "";

    if (!editingQuestionId) return;

    if (!chapterId || !questionText) {
        message.innerText = "Please select Chapter and enter Question.";
        return;
    }

    message.innerText = "Updating question...";

    try {
        const response = await fetch(
            `${API_URL}/api/admin/questions/${editingQuestionId}`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chapter_id: Number(chapterId),
                    question_text: questionText,
                    marks: Number(marks) || 1,
                    hint: hint || null,
                    easy_answer: easyAnswer || null,
                    keywords: keywords || null,
                    question_type: questionType,
                    difficulty: difficulty,
                    pyq_year: pyqYear ? Number(pyqYear) : null,
                    question_paper_id: paperValue ? Number(paperValue) : null
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            message.innerText = data.error || "Unable to update question.";
            return;
        }

        message.innerText = "✅ Question updated successfully!";
        cancelEditQuestion();
        await loadManagedQuestions();
    } catch (error) {
        console.error("Update Question Error:", error);
        message.innerText = "Server connection error.";
    }
}

async function toggleQuestionStatus(question) {
    const action = question.is_active ? "deactivate" : "activate";
    const confirmed = confirm(
        `Are you sure you want to ${action} Question ID ${question.id}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/api/admin/questions/${question.id}/status`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !question.is_active })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Unable to change question status.");
            return;
        }

        await loadManagedQuestions();
    } catch (error) {
        console.error("Question Status Error:", error);
        alert("Server connection error.");
    }
}

// Change Add button behaviour between ADD and UPDATE
const originalAddQuestionButton = document.getElementById("addQuestionButton");
if (originalAddQuestionButton) {
    originalAddQuestionButton.removeEventListener("click", addQuestion);
    originalAddQuestionButton.addEventListener("click", () => {
        if (editingQuestionId) {
            updateQuestion();
        } else {
            addQuestion();
        }
    });
}

const manageSubject = document.getElementById("manageSubject");
if (manageSubject) {
    manageSubject.addEventListener("change", async () => {
        await loadManagementChapters();
        await loadManagedQuestions();
    });
}

const manageChapter = document.getElementById("manageChapter");
if (manageChapter) {
    manageChapter.addEventListener("change", loadManagedQuestions);
}

const manageStatus = document.getElementById("manageStatus");
if (manageStatus) {
    manageStatus.addEventListener("change", loadManagedQuestions);
}

const searchQuestionsButton = document.getElementById("searchQuestionsButton");
if (searchQuestionsButton) {
    searchQuestionsButton.addEventListener("click", loadManagedQuestions);
}

const manageSearch = document.getElementById("manageSearch");
if (manageSearch) {
    manageSearch.addEventListener("keydown", (event) => {
        if (event.key === "Enter") loadManagedQuestions();
    });
}

const clearQuestionFiltersButton = document.getElementById("clearQuestionFiltersButton");
if (clearQuestionFiltersButton) {
    clearQuestionFiltersButton.addEventListener("click", async () => {
        document.getElementById("manageSubject").value = "";
        await loadManagementChapters();
        document.getElementById("manageStatus").value = "all";
        document.getElementById("manageSearch").value = "";
        await loadManagedQuestions();
    });
}

loadManagementSubjects().then(loadManagedQuestions);

// ================================================
// STAGE 10 - CHAPTER MASTER MANAGEMENT
// ================================================

let editingChapterId = null;

async function loadChapterMasterSubjects() {
    const select = document.getElementById("chapterMasterSubject");
    if (!select) return;

    try {
        const response = await fetch(`${API_URL}/api/subjects`);
        if (!response.ok) throw new Error("Unable to load subjects");
        const subjects = await response.json();

        select.innerHTML = `<option value="">Select Subject</option>`;
        subjects.forEach(subject => {
            const option = document.createElement("option");
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Chapter Master Subject Error:", error);
        document.getElementById("chapterMasterMessage").innerText = "Unable to load subjects.";
    }
}

async function loadChapterMasterList() {
    const results = document.getElementById("chapterMasterResults");
    if (!results) return;

    const subjectId = document.getElementById("chapterMasterSubject").value;
    const status = document.getElementById("chapterMasterStatus").value;
    const search = document.getElementById("chapterMasterSearch").value.trim();

    const params = new URLSearchParams();
    if (subjectId) params.set("subject_id", subjectId);
    params.set("status", status);
    if (search) params.set("search", search);

    results.innerHTML = "<p>Loading chapters...</p>";

    try {
        const response = await fetch(`${API_URL}/api/admin/chapters?${params.toString()}`);
        if (!response.ok) throw new Error("Unable to load chapters");
        const chapters = await response.json();

        if (!chapters.length) {
            results.innerHTML = "<p>No chapters found.</p>";
            return;
        }

        results.innerHTML = chapters.map(chapter => `
            <div class="question-box" style="margin-top:12px;">
                <strong>📖 Chapter ${escapeHTML(chapter.chapter_number)} — ${escapeHTML(chapter.chapter_name)}</strong>
                <p>Subject: ${escapeHTML(chapter.subject_name)}</p>
                <p>Questions: ${chapter.question_count} &nbsp; | &nbsp; Status: ${chapter.is_active ? "✅ Active" : "🔴 Inactive"}</p>
                <button onclick="editChapterMaster(${chapter.id})">✏️ Edit</button>
                <button onclick="toggleChapterMasterStatus(${chapter.id}, ${!chapter.is_active})">
                    ${chapter.is_active ? "🔴 Deactivate" : "🟢 Activate"}
                </button>
            </div>
        `).join("");
    } catch (error) {
        console.error("Chapter Master Load Error:", error);
        results.innerHTML = "<p>Unable to load chapters.</p>";
    }
}

function editChapterMaster(chapterId) {
    fetch(`${API_URL}/api/admin/chapters?status=all`)
        .then(response => response.json())
        .then(chapters => {
            const chapter = chapters.find(item => Number(item.id) === Number(chapterId));
            if (!chapter) throw new Error("Chapter not found");

            editingChapterId = chapter.id;
            document.getElementById("chapterMasterSubject").value = chapter.subject_id;
            document.getElementById("chapterMasterNumber").value = chapter.chapter_number;
            document.getElementById("chapterMasterName").value = chapter.chapter_name;
            document.getElementById("saveChapterButton").innerText = "💾 UPDATE CHAPTER";
            document.getElementById("cancelChapterEditButton").style.display = "inline-block";
            document.getElementById("chapterMasterMessage").innerText = "Editing chapter. Make your changes and click UPDATE CHAPTER.";
            window.scrollTo({ top: 0, behavior: "smooth" });
        })
        .catch(error => {
            console.error("Edit Chapter Error:", error);
            document.getElementById("chapterMasterMessage").innerText = "Unable to load chapter for editing.";
        });
}

function cancelChapterMasterEdit() {
    editingChapterId = null;
    document.getElementById("chapterMasterSubject").value = "";
    document.getElementById("chapterMasterNumber").value = "";
    document.getElementById("chapterMasterName").value = "";
    document.getElementById("saveChapterButton").innerText = "💾 ADD CHAPTER";
    document.getElementById("cancelChapterEditButton").style.display = "none";
    document.getElementById("chapterMasterMessage").innerText = "";
}

async function saveChapterMaster() {
    const subjectId = document.getElementById("chapterMasterSubject").value;
    const chapterNumber = document.getElementById("chapterMasterNumber").value.trim();
    const chapterName = document.getElementById("chapterMasterName").value.trim();
    const message = document.getElementById("chapterMasterMessage");

    if (!subjectId || !chapterNumber || !chapterName) {
        message.innerText = "Please enter Subject, Chapter Number and Chapter Name.";
        return;
    }

    const payload = {
        subject_id: Number(subjectId),
        chapter_number: chapterNumber,
        chapter_name: chapterName
    };

    try {
        const url = editingChapterId
            ? `${API_URL}/api/admin/chapters/${editingChapterId}`
            : `${API_URL}/api/admin/chapters`;
        const method = editingChapterId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to save chapter");

        const successMessage = editingChapterId
            ? "✅ Chapter updated successfully."
            : "✅ Chapter added successfully.";

        cancelChapterMasterEdit();
        message.innerText = successMessage;
        await loadChapterMasterList();
    } catch (error) {
        console.error("Save Chapter Error:", error);
        message.innerText = `❌ ${error.message}`;
    }
}

async function toggleChapterMasterStatus(chapterId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/api/admin/chapters/${chapterId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: newStatus })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to update status");

        document.getElementById("chapterMasterMessage").innerText =
            `✅ Chapter ${newStatus ? "activated" : "deactivated"} successfully.`;
        await loadChapterMasterList();
    } catch (error) {
        console.error("Chapter Status Error:", error);
        document.getElementById("chapterMasterMessage").innerText = `❌ ${error.message}`;
    }
}

const chapterMasterSaveButton = document.getElementById("saveChapterButton");
if (chapterMasterSaveButton) {
    chapterMasterSaveButton.addEventListener("click", saveChapterMaster);
}

const chapterMasterCancelButton = document.getElementById("cancelChapterEditButton");
if (chapterMasterCancelButton) {
    chapterMasterCancelButton.addEventListener("click", cancelChapterMasterEdit);
}

const chapterMasterStatus = document.getElementById("chapterMasterStatus");
if (chapterMasterStatus) {
    chapterMasterStatus.addEventListener("change", loadChapterMasterList);
}

const chapterMasterSubject = document.getElementById("chapterMasterSubject");
if (chapterMasterSubject) {
    chapterMasterSubject.addEventListener("change", loadChapterMasterList);
}

const chapterMasterSearchButton = document.getElementById("searchChapterMasterButton");
if (chapterMasterSearchButton) {
    chapterMasterSearchButton.addEventListener("click", loadChapterMasterList);
}

const chapterMasterSearch = document.getElementById("chapterMasterSearch");
if (chapterMasterSearch) {
    chapterMasterSearch.addEventListener("keydown", event => {
        if (event.key === "Enter") loadChapterMasterList();
    });
}

const clearChapterMasterButton = document.getElementById("clearChapterMasterButton");
if (clearChapterMasterButton) {
    clearChapterMasterButton.addEventListener("click", async () => {
        document.getElementById("chapterMasterSubject").value = "";
        document.getElementById("chapterMasterStatus").value = "all";
        document.getElementById("chapterMasterSearch").value = "";
        await loadChapterMasterList();
    });
}

loadChapterMasterSubjects().then(loadChapterMasterList);


// ================================================
// STAGE 10 STEP 2 - OFFICIAL SSC CHAPTER IMPORT
// ================================================

async function previewOfficialChapters() {
    const message = document.getElementById("officialImportMessage");
    const preview = document.getElementById("officialChapterPreview");
    if (!message || !preview) return;

    message.innerText = "Loading official chapter master preview...";
    preview.innerHTML = "";
    try {
        const response = await fetch(`${API_URL}/api/admin/chapters/import-official/preview`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load preview");

        preview.innerHTML = `
            <div class="question-box" style="margin-top:12px;">
                <strong>📚 Official SSC Chapter Master Preview</strong>
                <p>Total chapters prepared: <strong>${data.total_chapters}</strong></p>
                ${data.preview.map(item => `
                    <p><strong>${escapeHTML(item.subject)}</strong> — ${item.chapter_count} chapters</p>
                `).join("")}
                <p>Existing chapters will be skipped. No duplicate chapter numbers will be created.</p>
            </div>`;
        message.innerText = "✅ Preview ready.";
    } catch (error) {
        console.error("Official Chapter Preview Error:", error);
        message.innerText = `❌ ${error.message}`;
    }
}

async function importOfficialChapters() {
    const message = document.getElementById("officialImportMessage");
    if (!message) return;

    const confirmed = window.confirm(
        "Import the official SSC chapter master now? Existing chapters will be kept and duplicates will be skipped."
    );
    if (!confirmed) return;

    message.innerText = "Importing official SSC chapters...";
    try {
        const response = await fetch(`${API_URL}/api/admin/chapters/import-official`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to import chapters");

        message.innerText = `✅ Import complete. Added: ${data.added} | Existing/skipped: ${data.skipped}`;
        await loadChapterMasterList();
        await loadManagementSubjects();
        await loadAdminSubjects();
    } catch (error) {
        console.error("Official Chapter Import Error:", error);
        message.innerText = `❌ ${error.message}`;
    }
}

const previewOfficialChapterButton = document.getElementById("previewOfficialChapterButton");
if (previewOfficialChapterButton) previewOfficialChapterButton.addEventListener("click", previewOfficialChapters);

const importOfficialChapterButton = document.getElementById("importOfficialChapterButton");
if (importOfficialChapterButton) importOfficialChapterButton.addEventListener("click", importOfficialChapters);


// ================================================
// STAGE 10 STEP 4 - BULK QUESTION IMPORT
// ================================================
function parseCSVLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            values.push(current.trim());
            current = "";
        } else {
            current += ch;
        }
    }
    values.push(current.trim());
    return values;
}

function csvToObjects(text) {
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("CSV must contain a header and at least one question row.");
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const required = ["subject_name", "chapter_number", "question_text"];
    required.forEach(name => {
        if (!headers.includes(name)) throw new Error(`Missing required CSV column: ${name}`);
    });
    return lines.slice(1).map((line, index) => {
        const vals = parseCSVLine(line);
        const obj = {};
        headers.forEach((header, i) => obj[header] = vals[i] ?? "");
        obj._row = index + 2;
        return obj;
    });
}

function escapeCSV(value) {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
}

function getBulkQuestionsFromUI() {
    const text = document.getElementById('bulkQuestionCsv')?.value || '';
    return csvToObjects(text);
}

function renderBulkPreview(rows) {
    const preview = document.getElementById('bulkQuestionPreview');
    if (!preview) return;
    const shown = rows.slice(0, 20);
    preview.innerHTML = `
        <div class="question-box">
            <h3>👁️ Preview: ${rows.length} question(s)</h3>
            ${shown.map(row => `
                <p><strong>Row ${row._row}:</strong> ${escapeHTML(row.subject_name)} → Ch. ${escapeHTML(row.chapter_number)} → ${escapeHTML(row.question_text)}</p>
            `).join('')}
            ${rows.length > 20 ? `<p>…and ${rows.length - 20} more.</p>` : ''}
        </div>`;
}

function downloadBulkTemplate() {
    const headers = ['subject_name','chapter_number','question_text','marks','hint','easy_answer','keywords','question_type','difficulty','pyq_year','question_paper_id'];
    const sample = [
        ['English','1','What is a noun?','1','A simple hint','A naming word','noun grammar','Important','Easy','',''],
        ['English','1','Write the plural of child.','1','Think of more than one.','children','plural','Important','Easy','','']
    ];
    const csv = [headers, ...sample].map(row => row.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '10th_PASS_MASTER_question_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}

async function previewBulkQuestions() {
    const message = document.getElementById('bulkQuestionMessage');
    try {
        const rows = getBulkQuestionsFromUI();
        renderBulkPreview(rows);
        message.innerText = `✅ ${rows.length} question(s) ready for preview.`;
    } catch (error) {
        message.innerText = `❌ ${error.message}`;
    }
}

async function importBulkQuestions() {
    const message = document.getElementById('bulkQuestionMessage');
    try {
        const rows = getBulkQuestionsFromUI();
        if (!confirm(`Import ${rows.length} question(s) into the Question Bank?`)) return;
        message.innerText = '⏳ Importing questions...';
        const response = await fetch(`${API_URL}/api/admin/questions/bulk`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({questions: rows.map(({_row, ...row}) => row)})
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Bulk import failed');
        message.innerText = `✅ Imported ${data.imported} question(s). Skipped ${data.skipped}.`;
        renderBulkPreview((data.results || []).map(r => ({...r, _row: r.row})));
        if (typeof loadChapterQuestionSummary === 'function') loadChapterQuestionSummary();
    } catch (error) {
        console.error('Bulk Question Import Error:', error);
        message.innerText = `❌ ${error.message}`;
    }
}

const downloadBulkTemplateButton = document.getElementById('downloadBulkTemplateButton');
if (downloadBulkTemplateButton) downloadBulkTemplateButton.addEventListener('click', downloadBulkTemplate);
const previewBulkQuestionsButton = document.getElementById('previewBulkQuestionsButton');
if (previewBulkQuestionsButton) previewBulkQuestionsButton.addEventListener('click', previewBulkQuestions);
const importBulkQuestionsButton = document.getElementById('importBulkQuestionsButton');
if (importBulkQuestionsButton) importBulkQuestionsButton.addEventListener('click', importBulkQuestions);

// ================================================
// ONE CLICK ENGLISH - REMAINING 21 CHAPTERS
// ================================================
async function previewEnglish24Pack() {
    const message = document.getElementById('english24Message');
    const preview = document.getElementById('english24Preview');
    try {
        message.innerText = '⏳ Checking bundled chapter-specific English pack...';
        const response = await fetch(`${API_URL}/api/admin/english-all-24/preview`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to preview English pack');
        let html = `<h3>✅ ${data.fileCount} chapter files • ${data.questionCount} questions</h3>`;
        html += '<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>Chapter</th><th>Questions</th></tr>';
        Object.entries(data.chapters).forEach(([key,count]) => {
            const parts = key.split('|');
            html += `<tr><td>${escapeHTML(parts[0])} – Chapter ${escapeHTML(parts[1])}</td><td>${count}</td></tr>`;
        });
        html += '</table>';
        preview.innerHTML = html;
        message.innerText = '✅ Preview ready. These are original practice questions, not claimed as Board PYQs.';
    } catch (error) {
        console.error('English 24 Preview Error:', error);
        message.innerText = `❌ ${error.message}`;
    }
}

async function importEnglish24Pack() {
    const message = document.getElementById('english24Message');
    const preview = document.getElementById('english24Preview');
    if (!confirm('Import all 480 bundled English chapter questions? Existing identical questions will be skipped.')) return;
    try {
        message.innerText = '⏳ Importing all 24 chapters... Please wait.';
        const response = await fetch(`${API_URL}/api/admin/english-all-24/import`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({}) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'English 24 import failed');
        message.innerText = `✅ Complete! Imported ${data.imported} questions. Skipped ${data.skipped} existing/invalid questions.`;
        preview.innerHTML = `<div class="question-box"><h3>📚 English 24 Chapter Import</h3><p>Files: ${data.fileCount}</p><p>Total questions processed: ${data.totalQuestions}</p><p>New questions imported: <strong>${data.imported}</strong></p><p>Skipped: <strong>${data.skipped}</strong></p><p>Now refresh the Question Bank / Content Progress to see the updated totals.</p></div>`;
        if (typeof loadChapterQuestionSummary === 'function') loadChapterQuestionSummary();
        if (typeof loadQuestionBankHealth === 'function') loadQuestionBankHealth();
        if (typeof loadContentProgress === 'function') loadContentProgress();
    } catch (error) {
        console.error('English 24 Import Error:', error);
        message.innerText = `❌ ${error.message}`;
    }
}

const previewEnglish24Button = document.getElementById('previewEnglish24Button');
if (previewEnglish24Button) previewEnglish24Button.addEventListener('click', previewEnglish24Pack);
const importEnglish24Button = document.getElementById('importEnglish24Button');
if (importEnglish24Button) importEnglish24Button.addEventListener('click', importEnglish24Pack);


// ================================================
// STAGE 10 STEP 3 - CHAPTER-WISE QUESTION SUMMARY
// ================================================
async function loadChapterQuestionSummary() {
    const results = document.getElementById("chapterSummaryResults");
    const message = document.getElementById("chapterSummaryMessage");
    if (!results) return;

    results.innerHTML = `<p>⏳ Loading chapter summary...</p>`;
    message.innerText = "";

    try {
        const response = await fetch(`${API_URL}/api/admin/chapter-question-summary`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load chapter summary");

        if (!Array.isArray(data) || data.length === 0) {
            results.innerHTML = `<div class="question-box"><p>❌ No chapters found.</p></div>`;
            return;
        }

        message.innerText = `${data.length} chapter(s) found.`;
        results.innerHTML = data.map(row => `
            <div class="question-box">
                <h3>📖 ${escapeHTML(row.subject_name)} — Chapter ${escapeHTML(row.chapter_number)}</h3>
                <p><strong>${escapeHTML(row.chapter_name)}</strong></p>
                <p>📝 Total: <strong>${row.total_questions}</strong> &nbsp; 🟢 Active: ${row.active_questions} &nbsp; 🔴 Inactive: ${row.inactive_questions}</p>
                <p>🎯 Easy: ${row.easy_questions} &nbsp; Medium: ${row.medium_questions} &nbsp; Hard: ${row.hard_questions}</p>
                <p>📄 PYQ Linked: ${row.pyq_questions}</p>
                <button class="practice-chapter-admin-button" data-chapter-id="${row.chapter_id}">📝 Manage This Chapter</button>
            </div>
        `).join("");

        results.querySelectorAll(".practice-chapter-admin-button").forEach(button => {
            button.addEventListener("click", () => {
                const chapterId = button.dataset.chapterId;
                const subjectId = data.find(r => String(r.chapter_id) === String(chapterId))?.subject_id;
                const subjectSelect = document.getElementById("manageSubject");
                const chapterSelect = document.getElementById("manageChapter");
                if (subjectSelect && subjectId) {
                    subjectSelect.value = String(subjectId);
                    loadManagementChapters().then(() => {
                        if (chapterSelect) chapterSelect.value = String(chapterId);
                        loadManagedQuestions();
                        document.getElementById("questionManagementResults")?.scrollIntoView({behavior:"smooth"});
                    });
                }
            });
        });
    } catch (error) {
        console.error("Chapter Summary Error:", error);
        results.innerHTML = `<div class="question-box"><p>❌ Unable to load chapter summary.</p></div>`;
        message.innerText = error.message;
    }
}

const chapterSummaryButton = document.getElementById("loadChapterSummaryButton");
if (chapterSummaryButton) {
    chapterSummaryButton.addEventListener("click", loadChapterQuestionSummary);
}

// ================================================
// STAGE 10 STEP 5 - QUESTION BANK CONTENT PLAN
// ================================================
async function loadQuestionBankHealth() {
    const results = document.getElementById("questionBankHealthResults");
    const message = document.getElementById("questionBankHealthMessage");
    if (!results) return;
    results.innerHTML = "";
    message.innerText = "Loading content gaps...";
    try {
        const response = await fetch(`${API_URL}/api/admin/question-bank-health`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load content gaps");
        const rows = data.rows || [];
        if (!rows.length) {
            results.innerHTML = `<div class="question-box"><p>⚠️ No active chapters found.</p></div>`;
            message.innerText = "";
            return;
        }
        let html = `<div class="question-box"><h3>🎯 Target: ${data.targetPerChapter} active questions / chapter</h3>`;
        html += `<p>Use this only as our internal content-building target.</p></div>`;
        rows.forEach(r => {
            const statusIcon = r.status === "Ready" ? "🟢" : (r.status === "Growing" ? "🟡" : "🔴");
            html += `<div class="question-box" style="margin-top:12px;">
                <h3>${statusIcon} ${escapeHTML(r.subject_name)} — ${escapeHTML(String(r.chapter_number))} - ${escapeHTML(r.chapter_name)}</h3>
                <p>Active: <strong>${r.active_questions}</strong> / ${r.target_questions} &nbsp; | &nbsp; Gap: <strong>${r.deficit}</strong></p>
                <p>Easy: ${r.easy_questions} &nbsp; Medium: ${r.medium_questions} &nbsp; Hard: ${r.hard_questions} &nbsp; PYQ: ${r.pyq_questions}</p>
                <button onclick="manageChapterFromHealth(${r.subject_id}, ${r.chapter_id})">📝 Manage Questions</button>
            </div>`;
        });
        results.innerHTML = html;
        message.innerText = `Checked ${rows.length} active chapters.`;
    } catch (error) {
        console.error("Question Bank Health Error:", error);
        results.innerHTML = `<div class="question-box"><p>❌ Unable to load content gaps.</p></div>`;
        message.innerText = error.message;
    }
}

function manageChapterFromHealth(subjectId, chapterId) {
    const subjectSelect = document.getElementById("manageSubject");
    const chapterSelect = document.getElementById("manageChapter");
    if (subjectSelect) subjectSelect.value = String(subjectId);
    if (typeof loadManagementChapters === "function") {
        loadManagementChapters().then(() => {
            if (chapterSelect) chapterSelect.value = String(chapterId);
            if (typeof loadManagedQuestions === "function") loadManagedQuestions();
            document.getElementById("questionManagementResults")?.scrollIntoView({behavior:"smooth"});
        });
    }
}

const questionBankHealthButton = document.getElementById("loadQuestionBankHealthButton");
if (questionBankHealthButton) {
    questionBankHealthButton.addEventListener("click", loadQuestionBankHealth);
}


// ================================================
// STAGE 10 STEP 6 - STARTER QUESTION PACK
// ================================================
async function loadStarterPackPreview() {
    const box = document.getElementById("starterPackPreview");
    const message = document.getElementById("starterPackMessage");
    if (!box) return;
    message.innerText = "Loading starter pack...";
    box.innerHTML = "";
    try {
        const response = await fetch(`${API_URL}/api/admin/starter-question-pack/preview`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to preview starter pack");
        let html = `<div class="question-box"><h3>📚 ${escapeHTML(data.subjectName)} — ${escapeHTML(data.chapterNumber)} ${escapeHTML(data.chapterName)}</h3><p>Total: <strong>${data.questions.length}</strong> | Easy: ${data.distribution.easy} | Medium: ${data.distribution.medium} | Hard: ${data.distribution.hard}</p></div>`;
        data.questions.forEach((q, i) => {
            html += `<div class="question-box" style="margin-top:10px;"><strong>${i+1}. ${escapeHTML(q.question_text)}</strong><p>Marks: ${q.marks} | ${escapeHTML(q.difficulty)} | ${escapeHTML(q.question_type)}</p><p><b>Answer:</b> ${escapeHTML(q.easy_answer)}</p></div>`;
        });
        box.innerHTML = html;
        message.innerText = "Preview ready. Import only after checking the questions.";
    } catch (error) {
        console.error("Starter Pack Preview Error:", error);
        message.innerText = error.message;
    }
}

async function importStarterPack() {
    const box = document.getElementById("starterPackPreview");
    const message = document.getElementById("starterPackMessage");
    if (!confirm("Import the 20 original English Chapter 1.1 starter questions? Existing questions will not be deleted.")) return;
    message.innerText = "Importing starter questions...";
    try {
        const response = await fetch(`${API_URL}/api/admin/starter-question-pack/import`, { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to import starter pack");
        message.innerText = `Import complete: ${data.imported} added, ${data.skipped} skipped.`;
        if (box) box.innerHTML = `<div class="question-box"><h3>✅ Starter Pack Imported</h3><p>Added: ${data.imported} | Skipped: ${data.skipped}</p><p>Chapter: ${escapeHTML(data.chapterName)}</p></div>`;
        if (typeof loadQuestionBankHealth === "function") loadQuestionBankHealth();
        if (typeof loadChapterQuestionSummary === "function") loadChapterQuestionSummary();
    } catch (error) {
        console.error("Starter Pack Import Error:", error);
        message.innerText = error.message;
    }
}

const previewStarterPackButton = document.getElementById("previewStarterPackButton");
if (previewStarterPackButton) previewStarterPackButton.addEventListener("click", loadStarterPackPreview);
const importStarterPackButton = document.getElementById("importStarterPackButton");
if (importStarterPackButton) importStarterPackButton.addEventListener("click", importStarterPack);


// ================================================
// STAGE 10 STEP 8 - ENGLISH 1.2 QUESTION PACK
// ================================================
async function loadEnglish12PackPreview() {
    const box = document.getElementById("english12PackPreview");
    const message = document.getElementById("english12PackMessage");
    if (!box) return;
    message.innerText = "Loading English 1.2 question pack...";
    box.innerHTML = "";
    try {
        const response = await fetch(`${API_URL}/api/admin/english-12-pack/preview`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to preview English 1.2 pack");
        let html = `<div class="question-box"><h3>📚 ${escapeHTML(data.subjectName)} — ${escapeHTML(data.chapterNumber)} ${escapeHTML(data.chapterName)}</h3><p>Total: <strong>${data.questions.length}</strong> | Easy: ${data.distribution.easy} | Medium: ${data.distribution.medium} | Hard: ${data.distribution.hard}</p></div>`;
        data.questions.forEach((q, i) => {
            html += `<div class="question-box" style="margin-top:10px;"><strong>${i+1}. ${escapeHTML(q.question_text)}</strong><p>Marks: ${q.marks} | ${escapeHTML(q.difficulty)} | ${escapeHTML(q.question_type)}</p><p><b>Answer:</b> ${escapeHTML(q.easy_answer)}</p></div>`;
        });
        box.innerHTML = html;
        message.innerText = "Preview ready. Import only after checking the questions.";
    } catch (error) {
        console.error("English 1.2 Pack Preview Error:", error);
        message.innerText = error.message;
    }
}

async function importEnglish12Pack() {
    const box = document.getElementById("english12PackPreview");
    const message = document.getElementById("english12PackMessage");
    if (!confirm("Import the 20 original English Chapter 1.2 questions? Existing questions will not be deleted.")) return;
    message.innerText = "Importing English 1.2 questions...";
    try {
        const response = await fetch(`${API_URL}/api/admin/english-12-pack/import`, { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to import English 1.2 pack");
        message.innerText = `Import complete: ${data.imported} added, ${data.skipped} skipped.`;
        if (box) box.innerHTML = `<div class="question-box"><h3>✅ English 1.2 Pack Imported</h3><p>Added: ${data.imported} | Skipped: ${data.skipped}</p><p>Chapter: ${escapeHTML(data.chapterName)}</p></div>`;
        if (typeof loadQuestionBankHealth === "function") loadQuestionBankHealth();
        if (typeof loadChapterQuestionSummary === "function") loadChapterQuestionSummary();
        if (typeof loadContentProgress === "function") loadContentProgress();
    } catch (error) {
        console.error("English 1.2 Pack Import Error:", error);
        message.innerText = error.message;
    }
}

const previewEnglish12PackButton = document.getElementById("previewEnglish12PackButton");
if (previewEnglish12PackButton) previewEnglish12PackButton.addEventListener("click", loadEnglish12PackPreview);
const importEnglish12PackButton = document.getElementById("importEnglish12PackButton");
if (importEnglish12PackButton) importEnglish12PackButton.addEventListener("click", importEnglish12Pack);


// ================================================
// STAGE 10 STEP 9 - ENGLISH 1.3 QUESTION PACK
// ================================================
async function loadEnglish13PackPreview() {
    const box = document.getElementById("english13PackPreview");
    const message = document.getElementById("english13PackMessage");
    if (!box) return;
    message.innerText = "Loading English 1.3 question pack...";
    box.innerHTML = "";
    try {
        const response = await fetch(`${API_URL}/api/admin/english-13-pack/preview`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to preview English 1.3 pack");
        let html = `<div class="question-box"><h3>✈️ ${escapeHTML(data.subjectName)} — ${escapeHTML(data.chapterNumber)} ${escapeHTML(data.chapterName)}</h3><p>Total: <strong>${data.questions.length}</strong> | Easy: ${data.distribution.easy} | Medium: ${data.distribution.medium} | Hard: ${data.distribution.hard}</p></div>`;
        data.questions.forEach((q, i) => {
            html += `<div class="question-box" style="margin-top:10px;"><strong>${i+1}. ${escapeHTML(q.question_text)}</strong><p>Marks: ${q.marks} | ${escapeHTML(q.difficulty)} | ${escapeHTML(q.question_type)}</p><p><b>Answer:</b> ${escapeHTML(q.easy_answer)}</p></div>`;
        });
        box.innerHTML = html;
        message.innerText = "Preview ready. Import only after checking the questions.";
    } catch (error) {
        console.error("English 1.3 Pack Preview Error:", error);
        message.innerText = error.message;
    }
}

async function importEnglish13Pack() {
    const box = document.getElementById("english13PackPreview");
    const message = document.getElementById("english13PackMessage");
    if (!confirm("Import the 20 original English Chapter 1.3 questions? Existing questions will not be deleted.")) return;
    message.innerText = "Importing English 1.3 questions...";
    try {
        const response = await fetch(`${API_URL}/api/admin/english-13-pack/import`, { method: "POST" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to import English 1.3 pack");
        message.innerText = `Import complete: ${data.imported} added, ${data.skipped} skipped.`;
        if (box) box.innerHTML = `<div class="question-box"><h3>✅ English 1.3 Pack Imported</h3><p>Added: ${data.imported} | Skipped: ${data.skipped}</p><p>Chapter: ${escapeHTML(data.chapterName)}</p></div>`;
        if (typeof loadQuestionBankHealth === "function") loadQuestionBankHealth();
        if (typeof loadChapterQuestionSummary === "function") loadChapterQuestionSummary();
        if (typeof loadContentProgress === "function") loadContentProgress();
    } catch (error) {
        console.error("English 1.3 Pack Import Error:", error);
        message.innerText = error.message;
    }
}

const previewEnglish13PackButton = document.getElementById("previewEnglish13PackButton");
if (previewEnglish13PackButton) previewEnglish13PackButton.addEventListener("click", loadEnglish13PackPreview);
const importEnglish13PackButton = document.getElementById("importEnglish13PackButton");
if (importEnglish13PackButton) importEnglish13PackButton.addEventListener("click", importEnglish13Pack);


// ================================================
// STAGE 10 STEP 7 - SUBJECT-WISE CONTENT PROGRESS
// ================================================
async function loadContentProgress() {
    const results = document.getElementById("contentProgressResults");
    const message = document.getElementById("contentProgressMessage");
    if (!results) return;

    message.innerText = "Loading overall content progress...";
    results.innerHTML = "";

    try {
        const response = await fetch(`${API_URL}/api/admin/content-progress`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load content progress");

        const s = data.summary || {};
        let html = `
            <div class="question-box">
                <h3>📊 Overall Question Bank Status</h3>
                <p><strong>Subjects:</strong> ${s.subjects || 0}</p>
                <p><strong>Active Chapters:</strong> ${s.activeChapters || 0} &nbsp; | &nbsp; <strong>Ready Chapters:</strong> ${s.readyChapters || 0}</p>
                <p><strong>Active Questions:</strong> ${s.activeQuestions || 0} / ${s.targetQuestions || 0}</p>
                <p><strong>Question-bank Progress:</strong> ${s.questionProgress || 0}% &nbsp; | &nbsp; <strong>Chapter Ready Progress:</strong> ${s.chapterProgress || 0}%</p>
                <p><strong>Questions Still Needed:</strong> ${s.questionGap || 0}</p>
            </div>`;

        if (!data.rows || !data.rows.length) {
            html += `<div class="question-box"><p>⚠️ No active subjects found.</p></div>`;
        } else {
            html += `<div class="question-box" style="margin-top:12px; overflow-x:auto;">
                <h3>📚 Subject-wise Progress</h3>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="padding:8px; text-align:left;">Subject</th>
                            <th style="padding:8px;">Chapters</th>
                            <th style="padding:8px;">Ready</th>
                            <th style="padding:8px;">Questions</th>
                            <th style="padding:8px;">Target</th>
                            <th style="padding:8px;">Progress</th>
                            <th style="padding:8px;">Gap</th>
                        </tr>
                    </thead><tbody>`;

            data.rows.forEach(r => {
                const progress = Number(r.question_progress || 0);
                const icon = progress >= 100 ? "🟢" : (progress >= 50 ? "🟡" : "🔴");
                html += `<tr>
                    <td style="padding:8px; border-top:1px solid #ddd;"><strong>${icon} ${escapeHTML(r.subject_name)}</strong></td>
                    <td style="padding:8px; text-align:center; border-top:1px solid #ddd;">${r.active_chapters}</td>
                    <td style="padding:8px; text-align:center; border-top:1px solid #ddd;">${r.ready_chapters}</td>
                    <td style="padding:8px; text-align:center; border-top:1px solid #ddd;">${r.active_questions}</td>
                    <td style="padding:8px; text-align:center; border-top:1px solid #ddd;">${r.target_questions}</td>
                    <td style="padding:8px; text-align:center; border-top:1px solid #ddd;"><strong>${progress}%</strong></td>
                    <td style="padding:8px; text-align:center; border-top:1px solid #ddd;">${r.question_gap}</td>
                </tr>`;
            });

            html += `</tbody></table></div>`;
        }

        results.innerHTML = html;
        message.innerText = "Overall content progress loaded.";
    } catch (error) {
        console.error("Content Progress Error:", error);
        message.innerText = error.message;
        results.innerHTML = `<div class="question-box"><p>❌ Unable to load overall content progress.</p></div>`;
    }
}

const loadContentProgressButton = document.getElementById("loadContentProgressButton");
if (loadContentProgressButton) {
    loadContentProgressButton.addEventListener("click", loadContentProgress);
}

async function previewMarathiPack() {
    const box = document.getElementById('marathiPackPreview');
    const msg = document.getElementById('marathiPackMessage');
    if (msg) msg.textContent = 'Loading...';
    try {
        const r = await fetch('/api/admin/marathi-kumarbharati/preview');
        const d = await r.json();
        if (!d.success) throw new Error(d.error || 'Preview failed');
        if (msg) msg.textContent = `✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;
        if (box) box.textContent = JSON.stringify(d.chapters, null, 2);
    } catch (e) { if (msg) msg.textContent = '❌ ' + e.message; }
}

async function importMarathiPack() {
    const msg = document.getElementById('marathiPackMessage');
    if (!confirm('Import all 400 Marathi Kumarbharati questions?')) return;
    if (msg) msg.textContent = 'Importing...';
    try {
        const r = await fetch('/api/admin/marathi-kumarbharati/import', {method:'POST', headers:{'Content-Type':'application/json'}});
        const d = await r.json();
        if (!d.success) throw new Error(d.error || 'Import failed');
        if (msg) msg.textContent = `✅ Imported: ${d.imported} • Skipped: ${d.skipped}`;
    } catch (e) { if (msg) msg.textContent = '❌ ' + e.message; }
}

async function previewHindiPack() {
    const box = document.getElementById('hindiPackPreview');
    const msg = document.getElementById('hindiPackMessage');
    if (msg) msg.textContent = 'Loading...';
    try {
        const r = await fetch('/api/admin/hindi-lokbharati/preview');
        const d = await r.json();
        if (!d.success) throw new Error(d.error || 'Preview failed');
        if (msg) msg.textContent = `✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;
        if (box) box.textContent = JSON.stringify(d.chapters, null, 2);
    } catch (e) { if (msg) msg.textContent = '❌ ' + e.message; }
}

async function importHindiPack() {
    const msg = document.getElementById('hindiPackMessage');
    if (!confirm('Import all 440 Hindi Lokbharati questions?')) return;
    if (msg) msg.textContent = 'Importing...';
    try {
        const r = await fetch('/api/admin/hindi-lokbharati/import', {method:'POST', headers:{'Content-Type':'application/json'}});
        const d = await r.json();
        if (!d.success) throw new Error(d.error || 'Import failed');
        if (msg) msg.textContent = `✅ Imported: ${d.imported} • Skipped: ${d.skipped}`;
    } catch (e) { if (msg) msg.textContent = '❌ ' + e.message; }
}

const previewHindiButton = document.getElementById('previewHindiButton');
if (previewHindiButton) previewHindiButton.addEventListener('click', previewHindiPack);
const importHindiButton = document.getElementById('importHindiButton');
if (importHindiButton) importHindiButton.addEventListener('click', importHindiPack);

const previewMarathiButton = document.getElementById('previewMarathiButton');
if (previewMarathiButton) previewMarathiButton.addEventListener('click', previewMarathiPack);
const importMarathiButton = document.getElementById('importMarathiButton');
if (importMarathiButton) importMarathiButton.addEventListener('click', importMarathiPack);


// STAGE 10 STEP 13 - HINDI GRAMMAR & RACHNA
async function previewHindiGrammarPack() {
    const box=document.getElementById('hindiGrammarPreview'), msg=document.getElementById('hindiGrammarMessage');
    if(msg) msg.textContent='Loading...';
    try { const r=await fetch('/api/admin/hindi-grammar/preview'); const d=await r.json(); if(!d.success) throw new Error(d.error||'Preview failed');
        if(msg) msg.textContent=`✅ ${d.fileCount} section files • ${d.questionCount} questions`; if(box) box.textContent=JSON.stringify(d.chapters,null,2);
    } catch(e){ if(msg) msg.textContent='❌ '+e.message; }
}
async function importHindiGrammarPack() {
    const msg=document.getElementById('hindiGrammarMessage'); if(!confirm('Import all 200 Hindi Grammar & Rachna questions?')) return; if(msg) msg.textContent='Importing...';
    try { const r=await fetch('/api/admin/hindi-grammar/import',{method:'POST',headers:{'Content-Type':'application/json'}}); const d=await r.json(); if(!d.success) throw new Error(d.error||'Import failed');
        if(msg) msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`;
    } catch(e){ if(msg) msg.textContent='❌ '+e.message; }
}
const previewHindiGrammarButton=document.getElementById('previewHindiGrammarButton'); if(previewHindiGrammarButton) previewHindiGrammarButton.addEventListener('click',previewHindiGrammarPack);
const importHindiGrammarButton=document.getElementById('importHindiGrammarButton'); if(importHindiGrammarButton) importHindiGrammarButton.addEventListener('click',importHindiGrammarPack);


// STAGE 10 STEP 15 - MATHEMATICS PART I 6 CHAPTERS
async function previewMathPartIPack(){const box=document.getElementById('mathPartIPackPreview'),msg=document.getElementById('mathPartIPackMessage');if(msg)msg.textContent='Loading...';try{const r=await fetch('/api/admin/math-part1/preview');const d=await r.json();if(!d.success)throw new Error(d.error||'Preview failed');if(msg)msg.textContent=`✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;if(box)box.textContent=JSON.stringify(d.chapters,null,2)}catch(e){if(msg)msg.textContent='❌ '+e.message}}
async function importMathPartIPack(){const msg=document.getElementById('mathPartIPackMessage');if(!confirm('Import all 120 Mathematics Part I questions?'))return;if(msg)msg.textContent='Importing...';try{const r=await fetch('/api/admin/math-part1/import',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();if(!d.success)throw new Error(d.error||'Import failed');if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`}catch(e){if(msg)msg.textContent='❌ '+e.message}}
const previewMathPartIButton=document.getElementById('previewMathPartIButton');if(previewMathPartIButton)previewMathPartIButton.addEventListener('click',previewMathPartIPack);const importMathPartIButton=document.getElementById('importMathPartIButton');if(importMathPartIButton)importMathPartIButton.addEventListener('click',importMathPartIPack);

// STAGE 10 STEP 14 - SANSKRIT AMOD 15 CHAPTERS
async function previewSanskritPack(){const box=document.getElementById('sanskritPackPreview'),msg=document.getElementById('sanskritPackMessage');if(msg)msg.textContent='Loading...';try{const r=await fetch('/api/admin/sanskrit-amod/preview');const d=await r.json();if(!d.success)throw new Error(d.error||'Preview failed');if(msg)msg.textContent=`✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;if(box)box.textContent=JSON.stringify(d.chapters,null,2)}catch(e){if(msg)msg.textContent='❌ '+e.message}}
async function importSanskritPack(){const msg=document.getElementById('sanskritPackMessage');if(!confirm('Import all 300 Sanskrit Amod questions?'))return;if(msg)msg.textContent='Importing...';try{const r=await fetch('/api/admin/sanskrit-amod/import',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();if(!d.success)throw new Error(d.error||'Import failed');if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`}catch(e){if(msg)msg.textContent='❌ '+e.message}}
const previewSanskritButton=document.getElementById('previewSanskritButton');if(previewSanskritButton)previewSanskritButton.addEventListener('click',previewSanskritPack);const importSanskritButton=document.getElementById('importSanskritButton');if(importSanskritButton)importSanskritButton.addEventListener('click',importSanskritPack);


// STAGE 10 STEP 16 - MATHEMATICS PART II 7 CHAPTERS
async function previewMathPartIIPack(){const box=document.getElementById('mathPartIIPackPreview'),msg=document.getElementById('mathPartIIPackMessage');if(msg)msg.textContent='Loading...';try{const r=await fetch('/api/admin/math-part2/preview');const d=await r.json();if(!d.success)throw new Error(d.error||'Preview failed');if(msg)msg.textContent=`✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;if(box)box.textContent=JSON.stringify(d.chapters,null,2)}catch(e){if(msg)msg.textContent='❌ '+e.message}}
async function importMathPartIIPack(){const msg=document.getElementById('mathPartIIPackMessage');if(!confirm('Import all 140 Mathematics Part II questions?'))return;if(msg)msg.textContent='Importing...';try{const r=await fetch('/api/admin/math-part2/import',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();if(!d.success)throw new Error(d.error||'Import failed');if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`}catch(e){if(msg)msg.textContent='❌ '+e.message}}
const previewMathPartIIButton=document.getElementById('previewMathPartIIButton');if(previewMathPartIIButton)previewMathPartIIButton.addEventListener('click',previewMathPartIIPack);const importMathPartIIButton=document.getElementById('importMathPartIIButton');if(importMathPartIIButton)importMathPartIIButton.addEventListener('click',importMathPartIIPack);

// STAGE 10 STEP 17 - SCIENCE & TECHNOLOGY PART I 10 CHAPTERS
async function previewSciencePartIPack(){const box=document.getElementById('sciencePartIPackPreview'),msg=document.getElementById('sciencePartIPackMessage');if(msg)msg.textContent='Loading...';try{const r=await fetch('/api/admin/science-part1/preview');const d=await r.json();if(!d.success)throw new Error(d.error||'Preview failed');if(msg)msg.textContent=`✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;if(box)box.textContent=JSON.stringify(d.chapters,null,2)}catch(e){if(msg)msg.textContent='❌ '+e.message}}
async function importSciencePartIPack(){const msg=document.getElementById('sciencePartIPackMessage');if(!confirm('Import all 200 Science & Technology Part I questions?'))return;if(msg)msg.textContent='Importing...';try{const r=await fetch('/api/admin/science-part1/import',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();if(!d.success)throw new Error(d.error||'Import failed');if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`}catch(e){if(msg)msg.textContent='❌ '+e.message}}
const previewSciencePartIButton=document.getElementById('previewSciencePartIButton');if(previewSciencePartIButton)previewSciencePartIButton.addEventListener('click',previewSciencePartIPack);const importSciencePartIButton=document.getElementById('importSciencePartIButton');if(importSciencePartIButton)importSciencePartIButton.addEventListener('click',importSciencePartIPack);

async function previewSciencePartIIPack(){const box=document.getElementById('sciencePartIIPackPreview'),msg=document.getElementById('sciencePartIIPackMessage');if(msg)msg.textContent='Loading...';try{const r=await fetch('/api/admin/science-part2/preview');const d=await r.json();if(!d.success)throw new Error(d.error||'Preview failed');if(msg)msg.textContent=`✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;if(box)box.textContent=JSON.stringify(d.chapters,null,2)}catch(e){if(msg)msg.textContent='❌ '+e.message}}
async function importSciencePartIIPack(){const msg=document.getElementById('sciencePartIIPackMessage');if(!confirm('Import all 200 Science & Technology Part II questions?'))return;if(msg)msg.textContent='Importing...';try{const r=await fetch('/api/admin/science-part2/import',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();if(!d.success)throw new Error(d.error||'Import failed');if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`}catch(e){if(msg)msg.textContent='❌ '+e.message}}
const previewSciencePartIIButton=document.getElementById('previewSciencePartIIButton');if(previewSciencePartIIButton)previewSciencePartIIButton.addEventListener('click',previewSciencePartIIPack);const importSciencePartIIButton=document.getElementById('importSciencePartIIButton');if(importSciencePartIIButton)importSciencePartIIButton.addEventListener('click',importSciencePartIIPack);

// STAGE 10 STEP 19 - HISTORY & POLITICAL SCIENCE 14 CHAPTERS
async function previewHistoryPoliticalSciencePack(){const box=document.getElementById('historyPoliticalSciencePackPreview'),msg=document.getElementById('historyPoliticalSciencePackMessage');if(msg)msg.textContent='Loading...';try{const r=await fetch('/api/admin/history-political-science/preview');const d=await r.json();if(!d.success)throw new Error(d.error||'Preview failed');if(msg)msg.textContent=`✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;if(box)box.textContent=JSON.stringify(d.chapters,null,2)}catch(e){if(msg)msg.textContent='❌ '+e.message}}
async function importHistoryPoliticalSciencePack(){const msg=document.getElementById('historyPoliticalSciencePackMessage');if(!confirm('Import all 280 History & Political Science questions?'))return;if(msg)msg.textContent='Importing...';try{const r=await fetch('/api/admin/history-political-science/import',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();if(!d.success)throw new Error(d.error||'Import failed');if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`}catch(e){if(msg)msg.textContent='❌ '+e.message}}
const previewHistoryPoliticalScienceButton=document.getElementById('previewHistoryPoliticalScienceButton');if(previewHistoryPoliticalScienceButton)previewHistoryPoliticalScienceButton.addEventListener('click',previewHistoryPoliticalSciencePack);const importHistoryPoliticalScienceButton=document.getElementById('importHistoryPoliticalScienceButton');if(importHistoryPoliticalScienceButton)importHistoryPoliticalScienceButton.addEventListener('click',importHistoryPoliticalSciencePack);

// STAGE 10 STEP 20 - GEOGRAPHY 10 CHAPTERS
async function previewGeographyPack(){const box=document.getElementById('geographyPackPreview'),msg=document.getElementById('geographyPackMessage');if(msg)msg.textContent='Loading...';try{const r=await fetch('/api/admin/geography/preview');const d=await r.json();if(!d.success)throw new Error(d.error||'Preview failed');if(msg)msg.textContent=`✅ ${d.fileCount} chapter files • ${d.questionCount} questions`;if(box)box.textContent=JSON.stringify(d.chapters,null,2)}catch(e){if(msg)msg.textContent='❌ '+e.message}}
async function importGeographyPack(){const msg=document.getElementById('geographyPackMessage');if(!confirm('Import all 200 Geography questions?'))return;if(msg)msg.textContent='Importing...';try{const r=await fetch('/api/admin/geography/import',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();if(!d.success)throw new Error(d.error||'Import failed');if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`}catch(e){if(msg)msg.textContent='❌ '+e.message}}
async function importVisualQualityGapPack(){const msg=document.getElementById('visualQualityGapMessage');if(!confirm('Import 107 Visual-tagged quality questions: 100 Geography + 7 Mathematics Part I Probability?'))return;if(msg)msg.textContent='Importing...';try{const r=await fetch('/api/admin/visual-quality-gap-v6/import',{method:'POST',headers:{'Content-Type':'application/json'}});const d=await r.json();if(!d.success)throw new Error(d.error||'Import failed');if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}`;}catch(e){if(msg)msg.textContent='❌ '+e.message}}

const previewGeographyButton=document.getElementById('previewGeographyButton');if(previewGeographyButton)previewGeographyButton.addEventListener('click',previewGeographyPack);const importGeographyButton=document.getElementById('importGeographyButton');if(importGeographyButton)importGeographyButton.addEventListener('click',importGeographyPack);const importVisualQualityGapButton=document.getElementById('importVisualQualityGapButton');if(importVisualQualityGapButton)importVisualQualityGapButton.addEventListener('click',importVisualQualityGapPack);

// STAGE 10 STEP 21 - FULL QUESTION BANK AUDIT
async function loadFullQuestionBankAudit(){
 const msg=document.getElementById('contentAuditMessage'),box=document.getElementById('contentAuditResults');
 if(msg)msg.textContent='Running full question bank audit...';
 if(box)box.innerHTML='';
 try{
  const r=await fetch(`${API_URL}/api/admin/content-audit`);
  const d=await r.json();
  if(!r.ok || !d.success) throw new Error(d.error||'Unable to load full question bank audit');
  const t=d.totals||{};
  if(msg)msg.textContent=`✅ Audit complete • ${t.active_questions||0} active questions • ${t.ready_chapters||0} chapters READY • ${t.gap_chapters||0} chapters with gaps`;
  let html=`<div class="question-box" style="margin-top:12px;">
    <h3>📊 Full Question Bank Summary</h3>
    <p><b>Chapters:</b> ${t.chapters||0} &nbsp; | &nbsp; <b>Active Questions:</b> ${t.active_questions||0} &nbsp; | &nbsp; <b>Internal Target:</b> ${t.target_questions||0}</p>
    <p><b>Ready Chapters:</b> ${t.ready_chapters||0} &nbsp; | &nbsp; <b>Gap Chapters:</b> ${t.gap_chapters||0} &nbsp; | &nbsp; <b>Total Question Gap:</b> ${t.total_gap||0}</p>
  </div>`;
  const subjects=d.subjects||[];
  html+=`<div class="question-box" style="margin-top:12px;"><h3>📚 Subject-wise Summary</h3>
   <table border="1" cellpadding="6" cellspacing="0" style="width:100%">
    <tr><th>Subject</th><th>Chapters</th><th>Ready</th><th>Gap Chapters</th><th>Active Questions</th><th>Target</th><th>Total Gap</th></tr>
    ${subjects.map(x=>`<tr><td>${escapeHTML(x.subject_name)}</td><td>${x.chapters}</td><td>${x.ready_chapters}</td><td>${x.gap_chapters}</td><td>${x.active_questions}</td><td>${x.target_questions}</td><td>${x.total_gap}</td></tr>`).join('')}
   </table></div>`;
  const gaps=(d.chapters||[]).filter(x=>x.status!=='READY');
  html+=`<div class="question-box" style="margin-top:12px;"><h3>🔴 Chapters Below Target</h3>`;
  if(gaps.length){
   html+=`<table border="1" cellpadding="6" cellspacing="0" style="width:100%"><tr><th>Subject</th><th>Chapter</th><th>Active</th><th>Target</th><th>Gap</th><th>Action</th></tr>`;
   html+=gaps.map(x=>`<tr><td>${escapeHTML(x.subject_name)}</td><td>${escapeHTML(String(x.chapter_number))} - ${escapeHTML(x.chapter_name)}</td><td>${x.active_questions}</td><td>${x.target_questions}</td><td><b>${x.gap}</b></td><td><button onclick="manageChapterFromHealth(${x.subject_id},${x.chapter_id})">📝 Manage</button></td></tr>`).join('');
   html+='</table>';
  }else{
   html+='<p>🎉 Every active chapter has reached the internal 20-question target.</p>';
  }
  html+='</div>';
  if(box)box.innerHTML=html;
 }catch(e){
  console.error('Full Question Bank Audit Error:',e);
  if(msg)msg.textContent='❌ '+e.message;
  if(box)box.innerHTML='<div class="question-box"><p>❌ Full Question Bank Audit could not be loaded.</p><p>Please keep the backend running and try again.</p></div>';
 }
}
const fullQuestionBankAuditButton=document.getElementById('loadContentAuditButton');
if(fullQuestionBankAuditButton)fullQuestionBankAuditButton.addEventListener('click',loadFullQuestionBankAudit);

async function repairChapterStructure(){
 const msg=document.getElementById('contentAuditMessage'),box=document.getElementById('contentAuditResults');
 const ok=confirm('⚠️ Duplicate/invalid chapter rows will be consolidated. Questions will NOT be deleted; duplicate question text will be deactivated if the same question already exists in the canonical chapter. Continue?');
 if(!ok)return;
 if(msg)msg.textContent='Repairing chapter structure...';
 try{
  const r=await fetch(`${API_URL}/api/admin/repair-chapters`,{method:'POST',headers:{'Content-Type':'application/json'}});
  const d=await r.json();
  if(!r.ok||!d.success)throw new Error(d.error||'Chapter repair failed');
  if(msg)msg.textContent=`✅ Chapter repair complete • ${d.mergedChapters||0} duplicate chapters consolidated • ${d.movedQuestions||0} questions moved • ${d.deactivatedInvalid||0} invalid placeholders deactivated`;
  if(box)box.innerHTML=`<div class="question-box"><h3>🛠️ Chapter Structure Repair Complete</h3><p><b>Duplicate chapters consolidated:</b> ${d.mergedChapters||0}</p><p><b>Questions moved:</b> ${d.movedQuestions||0}</p><p><b>Invalid/demo/test placeholders deactivated:</b> ${d.deactivatedInvalid||0}</p><p>Now run <b>🔎 RUN FULL QUESTION BANK AUDIT</b> again.</p></div>`;
 }catch(e){
  console.error('Chapter Repair Error:',e);
  if(msg)msg.textContent='❌ '+e.message;
 }
}
const repairChapterStructureButton=document.getElementById('repairChapterStructureButton');
if(repairChapterStructureButton)repairChapterStructureButton.addEventListener('click',repairChapterStructure);

// STAGE 10 STEP 22 - QUESTION QUALITY & COVERAGE AUDIT
async function loadQuestionQualityAudit(){
 const msg=document.getElementById('questionQualityAuditMessage'),box=document.getElementById('questionQualityAuditResults');
 if(msg)msg.textContent='Running audit...';
 try{
  const r=await fetch('/api/admin/question-quality-audit'); const d=await r.json();
  if(!d.success)throw new Error(d.error||'Audit failed');
  const t=d.totals;
  if(msg)msg.textContent=`✅ ${t.active_questions} active questions • ${t.ready_chapters} chapters READY • ${t.check_chapters} chapters to CHECK`;
  const rows=d.chapters.filter(x=>x.status!=='READY');
  let html=`<div style="margin:12px 0"><b>Totals:</b> Easy ${t.easy_questions} • Medium ${t.medium_questions} • Hard ${t.hard_questions} • Metadata issues ${t.metadata_issues}</div>`;
  html += rows.length ? `<table border="1" cellpadding="6" cellspacing="0"><tr><th>Subject</th><th>Chapter</th><th>Questions</th><th>Easy</th><th>Medium</th><th>Hard</th><th>Missing Answer</th><th>Missing Difficulty</th><th>Status</th></tr>${rows.map(x=>`<tr><td>${x.subject_name}</td><td>${x.chapter_number} - ${x.chapter_name}</td><td>${x.active_questions}</td><td>${x.easy_questions}</td><td>${x.medium_questions}</td><td>${x.hard_questions}</td><td>${x.missing_answer}</td><td>${x.missing_difficulty}</td><td>${x.status}</td></tr>`).join('')}</table>` : '<p>🎉 All active chapters passed the basic quality checks.</p>';
  if(box)box.innerHTML=html;
 }catch(e){if(msg)msg.textContent='❌ '+e.message;}
}
const questionQualityAuditButton=document.getElementById('loadQuestionQualityAuditButton');
if(questionQualityAuditButton)questionQualityAuditButton.addEventListener('click',loadQuestionQualityAudit);


// ================================================
// STAGE 10 STEP 24 - AUTOMATIC MCQ QUESTION EDITOR
// ================================================
async function loadMCQEditorSubjects(){
    const select=document.getElementById('mcqSubjectSelect'); if(!select)return;
    try{
        const r=await fetch(`${API_URL}/api/subjects`); const subjects=await r.json();
        select.innerHTML='<option value="">Select Subject</option>';
        subjects.forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=s.name;select.appendChild(o);});
        await loadMCQReadiness();
    }catch(e){console.error(e);}
}
async function loadMCQReadiness(){
    const box=document.getElementById('mcqReadinessResults'); const msg=document.getElementById('mcqReadinessMessage'); if(!box)return;
    try{const r=await fetch(`${API_URL}/api/admin/mcq-readiness`);const d=await r.json();if(!d.success)throw new Error(d.error);
      box.innerHTML='<table border="1" cellpadding="6" cellspacing="0"><tr><th>Subject</th><th>Active</th><th>MCQ Ready</th><th>Gap to 20</th></tr>'+d.subjects.map(x=>`<tr><td>${x.subject_name}</td><td>${x.active_questions}</td><td>${x.mcq_ready}</td><td>${x.gap}</td></tr>`).join('')+'</table>';
      if(msg)msg.textContent='✅ MCQ readiness loaded.';
    }catch(e){if(msg)msg.textContent='❌ '+e.message;}
}
async function loadMCQQuestions(){
    const sid=document.getElementById('mcqSubjectSelect').value, box=document.getElementById('mcqEditorResults'),msg=document.getElementById('mcqReadinessMessage');
    if(!sid){alert('Please select a subject.');return;} if(msg)msg.textContent='Loading questions...';
    try{const r=await fetch(`${API_URL}/api/admin/mcq-questions?subjectId=${sid}`);const d=await r.json();if(!d.success)throw new Error(d.error);
      box.innerHTML=''; d.questions.forEach((q,i)=>{
        const div=document.createElement('div');div.style.border='1px solid #ccc';div.style.padding='12px';div.style.margin='10px 0';
        div.innerHTML=`<b>Q${i+1}. ${q.question_text}</b><br><small>${q.chapter_number} - ${q.chapter_name} | ${q.difficulty}</small><p>A <input class="mcq-a" value="${escapeHtmlAttr(q.option_a||'')}"></p><p>B <input class="mcq-b" value="${escapeHtmlAttr(q.option_b||'')}"></p><p>C <input class="mcq-c" value="${escapeHtmlAttr(q.option_c||'')}"></p><p>D <input class="mcq-d" value="${escapeHtmlAttr(q.option_d||'')}"></p><p>Correct: <select class="mcq-correct"><option>A</option><option>B</option><option>C</option><option>D</option></select></p><p>Explanation <input class="mcq-exp" value="${escapeHtmlAttr(q.mcq_explanation||'')}"></p><button class="save-mcq">💾 SAVE MCQ</button> <span class="mcq-status"></span>`;
        div.querySelector('.mcq-correct').value=q.correct_option||'A';
        div.querySelector('.save-mcq').onclick=async()=>{const b=div.querySelector('.save-mcq'),st=div.querySelector('.mcq-status');b.disabled=true;try{const payload={option_a:div.querySelector('.mcq-a').value,option_b:div.querySelector('.mcq-b').value,option_c:div.querySelector('.mcq-c').value,option_d:div.querySelector('.mcq-d').value,correct_option:div.querySelector('.mcq-correct').value,mcq_explanation:div.querySelector('.mcq-exp').value};const rr=await fetch(`${API_URL}/api/admin/mcq-questions/${q.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const dd=await rr.json();if(!rr.ok||!dd.success)throw new Error(dd.error||'Save failed');st.textContent='✅ Saved';await loadMCQReadiness();}catch(e){st.textContent='❌ '+e.message;}finally{b.disabled=false;}};
        box.appendChild(div);
      }); if(msg)msg.textContent=`✅ ${d.questions.length} questions loaded. Save MCQs one by one.`;
    }catch(e){if(msg)msg.textContent='❌ '+e.message;}
}
function escapeHtmlAttr(v){return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
const mcqLoadBtn=document.getElementById('loadMcqQuestionsButton');if(mcqLoadBtn)mcqLoadBtn.addEventListener('click',loadMCQQuestions);
if(document.getElementById('mcqSubjectSelect')) loadMCQEditorSubjects();


// STAGE 10 STEP 26 - CONTENT + MCQ + EXAM MANAGEMENT
async function loadStep26Overview(){
 const box=document.getElementById('step26OverviewResults'),msg=document.getElementById('step26OverviewMessage'),sel=document.getElementById('step26SubjectSelect');
 if(msg)msg.textContent='Loading...';
 try{const r=await fetch('/api/admin/content-management/overview');const d=await r.json();if(!d.success)throw Error(d.error||'Failed');
   if(msg)msg.textContent='✅ Management dashboard loaded';
   sel.innerHTML='<option value="">Select Subject</option>';
   box.innerHTML=`<table border="1" cellpadding="6" cellspacing="0" style="width:100%"><tr><th>Subject</th><th>Chapters</th><th>Active Questions</th><th>MCQ Ready</th><th>Missing Easy Answer</th></tr>${d.subjects.map(x=>{const o=document.createElement('option');o.value=x.subject_id;o.textContent=x.subject_name;sel.appendChild(o);return `<tr><td>${x.subject_name}</td><td>${x.chapters}</td><td>${x.active_questions}</td><td>${x.mcq_ready}</td><td>${x.missing_answers}</td></tr>`}).join('')}</table>`;
 }catch(e){if(msg)msg.textContent='❌ '+e.message;}
}
async function loadStep26Chapters(){const sid=document.getElementById('step26SubjectSelect').value,box=document.getElementById('step26ChapterResults');if(!sid){box.innerHTML='<p>Select a subject.</p>';return;}const r=await fetch('/api/admin/content-management/chapters/'+sid);const d=await r.json();box.innerHTML=d.success?`<table border="1" cellpadding="6" cellspacing="0" style="width:100%"><tr><th>Chapter</th><th>Active</th><th>Questions</th><th>MCQ Ready</th><th>Status</th></tr>${d.chapters.map(c=>`<tr><td>${c.chapter_number} - ${c.chapter_name}</td><td>${c.is_active?'YES':'NO'}</td><td>${c.active_questions}</td><td>${c.mcq_ready}</td><td>${Number(c.mcq_ready)>=20?'READY':'PREPARE'}</td></tr>`).join('')}</table>`:'❌ '+(d.error||'Unable to load');}
async function loadStep26McqStats(){const box=document.getElementById('step26McqStats');const r=await fetch('/api/admin/mcq-management/stats');const d=await r.json();box.innerHTML=d.success?`<p>Active Questions: <b>${d.stats.active}</b> | With 4 Options: <b>${d.stats.with_options}</b> | With Correct Answer: <b>${d.stats.with_answer}</b></p><p>Use <b>Automatic MCQ Question Setup</b> above to edit individual MCQs.</p>`:'❌ '+(d.error||'Unable to load');}
async function loadStep26ExamHistory(){const box=document.getElementById('step26ExamHistory');const r=await fetch('/api/admin/exam-management/history');const d=await r.json();box.innerHTML=d.success?`<table border="1" cellpadding="6" cellspacing="0" style="width:100%"><tr><th>Student</th><th>Subject</th><th>Total</th><th>Correct</th><th>Revision</th><th>Score</th><th>Submitted</th></tr>${d.tests.map(x=>`<tr><td>${x.student_name}</td><td>${x.subject_name}</td><td>${x.total_questions}</td><td>${x.correct}</td><td>${x.revision_count}</td><td>${x.score??'-'}%</td><td>${x.is_submitted?'YES':'NO'}</td></tr>`).join('')}</table>`:'❌ '+(d.error||'Unable to load');}
document.getElementById('loadStep26OverviewButton')?.addEventListener('click',loadStep26Overview);
document.getElementById('loadStep26ChaptersButton')?.addEventListener('click',loadStep26Chapters);
document.getElementById('loadStep26McqStatsButton')?.addEventListener('click',loadStep26McqStats);
document.getElementById('loadStep26ExamHistoryButton')?.addEventListener('click',loadStep26ExamHistory);


// ================================================
// STEP 35 - MCQ-READY STARTER BANK + MOCK TEST
// ================================================
async function step35Readiness(){
 const msg=document.getElementById('step35Message'),box=document.getElementById('step35Results');
 try{const r=await fetch('/api/admin/step35-mcq-readiness');const d=await r.json();if(!d.success)throw Error(d.error||'Failed');
   if(msg)msg.textContent='✅ MCQ readiness loaded';
   box.innerHTML='<table border="1" cellpadding="6" cellspacing="0"><tr><th>Subject</th><th>Active Questions</th><th>MCQ Ready</th><th>Gap to 20</th></tr>'+d.subjects.map(x=>`<tr><td>${x.subject_name}</td><td>${x.active_questions}</td><td><strong>${x.mcq_ready}</strong></td><td>${Math.max(0,20-Number(x.mcq_ready))}</td></tr>`).join('')+'</table>';
 }catch(e){if(msg)msg.textContent='❌ '+e.message;}
}
async function step35Import(){
 const msg=document.getElementById('step35Message'); const btn=document.getElementById('step35ImportButton');
 if(!confirm('Import 40 curated MCQs (20 Geography + 20 Mathematics Part I)?'))return;
 btn.disabled=true;
 try{const r=await fetch('/api/admin/step35-import-mcq',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'Import failed');
   if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped}${d.missingChapters?.length?' • Missing: '+d.missingChapters.join(', '):''}`;
   await step35Readiness();
 }catch(e){if(msg)msg.textContent='❌ '+e.message;}finally{btn.disabled=false;}
}
document.getElementById('step35ReadinessButton')?.addEventListener('click',step35Readiness);
document.getElementById('step35ImportButton')?.addEventListener('click',step35Import);
if(document.getElementById('step35Results')) step35Readiness();


// ================================================
// STEP 36 - PYQ-FIRST / AUTHENTIC BOARD QUESTION BANK
// ================================================
async function importVerifiedPYQCSV(){
  const file=document.getElementById('pyqCsvFile')?.files?.[0], msg=document.getElementById('pyqImportMessage');
  if(!file){if(msg)msg.textContent='❌ Please select a verified PYQ CSV file.';return;}
  if(!confirm('Import only questions that you have verified as actual Maharashtra SSC Board PYQs?'))return;
  try{
    const csv=await file.text();
    const r=await fetch(`${API_URL}/api/admin/pyq-import`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({csv})});
    const d=await r.json(); if(!r.ok||!d.success)throw Error(d.error||'PYQ import failed');
    if(msg)msg.textContent=`✅ Imported: ${d.imported} • Skipped: ${d.skipped} • Failed: ${d.failed}`+(d.errors?.length?` | ${d.errors.slice(0,3).join(' ; ')}`:'');
    await loadPYQStats();
  }catch(e){if(msg)msg.textContent='❌ '+(e.message==='Failed to fetch'?'Backend connection blocked. Restart backend and refresh the Admin page.':e.message);}
}
async function loadPYQStats(){
  const box=document.getElementById('pyqStatsResults'),msg=document.getElementById('pyqImportMessage'); if(!box)return;
  try{const r=await fetch(`${API_URL}/api/admin/pyq-stats`);const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'Unable to load');
    box.innerHTML=`<h4>By source</h4><table border="1" cellpadding="6"><tr><th>Source</th><th>Active Questions</th></tr>${d.bySource.map(x=>`<tr><td>${x.source_type}</td><td>${x.count}</td></tr>`).join('')}</table><h4>Actual PYQ by year</h4><table border="1" cellpadding="6"><tr><th>Year</th><th>Questions</th></tr>${d.byYear.map(x=>`<tr><td>${x.pyq_year}</td><td>${x.count}</td></tr>`).join('')}</table>`;
    if(msg)msg.textContent='✅ PYQ status loaded.';
  }catch(e){if(msg)msg.textContent='❌ '+(e.message==='Failed to fetch'?'Backend connection blocked. Restart backend and refresh the Admin page.':e.message);}
}
document.getElementById('importPyqCsvButton')?.addEventListener('click',importVerifiedPYQCSV);
document.getElementById('pyqStatsButton')?.addEventListener('click',loadPYQStats);
if(document.getElementById('pyqStatsResults')) loadPYQStats();

// STEP 38/40 — bundled verified 2025 Mathematics-I manual PYQs
const BUNDLED_MATH1_2025_PYQS = [{"subject_name":"Mathematics Part I","chapter_number":1,"question_text":"1(A)(ii) — To draw the graph of x + 2y = 4, find x when y = 1.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":1,"hint":"Put y=1.","easy_answer":"2","keywords":"linear equations;graph","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Linear equation graph","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":2,"question_text":"1(A)(i) — If 3 is one of the roots of the quadratic equation kx² – 7x + 12 = 0, then find k.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":1,"hint":"Substitute x=3.","easy_answer":"1","keywords":"quadratic equations;roots","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Quadratic equation","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":3,"question_text":"1(A)(iii) — For an A.P., t₇ = 4 and d = −4. Find a.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":1,"hint":"Use t7=a+6d.","easy_answer":"28","keywords":"arithmetic progression;AP;nth term","difficulty":"Medium","pyq_frequency":2,"visual_tag":"Arithmetic progression","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":4,"question_text":"1(A)(iv) — In the format of GSTIN, there are how many alpha-numerals?","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":1,"hint":"GSTIN has 15 alpha-numeric characters.","easy_answer":"15","keywords":"GSTIN;financial planning","difficulty":"Easy","pyq_frequency":1,"visual_tag":"GSTIN","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":1,"question_text":"1(B)(i) — If 17x + 15y = 11 and 15x + 17y = 21, find x − y.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":1,"hint":"Subtract the two equations.","easy_answer":"-5","keywords":"simultaneous equations;linear equations","difficulty":"Medium","pyq_frequency":2,"visual_tag":"Simultaneous equations","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":3,"question_text":"1(B)(ii) — Find the first term of the sequence tₙ = 3n − 2.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":1,"hint":"Put n=1.","easy_answer":"1","keywords":"sequence","difficulty":"Easy","pyq_frequency":1,"visual_tag":"Sequences","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":4,"question_text":"1(B)(iii) — If the face value of a share is ₹100 and market value is ₹150, and the rate of brokerage is 2%, find brokerage paid on one share.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":1,"hint":"Brokerage is 2% of ₹150.","easy_answer":"₹3","keywords":"shares;brokerage","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Shares and brokerage","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":5,"question_text":"1(B)(iv) — Two digit numbers are formed using digits 2, 3 and 5 without repeating a digit. Write the sample space.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":1,"hint":"List all two-digit arrangements without repetition.","easy_answer":"23,25,32,35,52,53","keywords":"probability;sample space","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Probability sample space","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":1,"question_text":"2(A)(i) — If (0,2) is the solution of 2x + 3y = k, complete the activity to find k.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":2,"hint":"Substitute (0,2).","easy_answer":"6","keywords":"linear equations;activity","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Linear equation","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":2,"question_text":"2(A)(ii) — If 2 and 5 are the roots of a quadratic equation, complete the activity to form the quadratic equation.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":2,"hint":"Use x²−(sum of roots)x+product of roots=0.","easy_answer":"x²−7x+10=0","keywords":"quadratic equations;roots","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Quadratic equation","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":5,"question_text":"2(A)(iii) — Two coins are tossed simultaneously. Write the sample space and events A: at least one head, B: no head.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":2,"hint":"List all outcomes.","easy_answer":"S={HH,HT,TH,TT}; A={HH,HT,TH}; B={TT}","keywords":"probability;sample space;events","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Probability events","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":1,"question_text":"2(B)(i) — ABCD is a rectangle. Using the diagram information, write two simultaneous equations in the form ax + by = c.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":2,"hint":"Equate opposite sides of the rectangle using the diagram.","easy_answer":"2x+y=−8 and 4x−y=x+4","keywords":"simultaneous equations;rectangle","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Rectangle and linear equations","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":2,"question_text":"2(B)(ii) — Solve x² + x − 20 = 0 by factorisation method.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":2,"hint":"Factor (x+5)(x−4)=0.","easy_answer":"x=4 or x=−5","keywords":"quadratic equations;factorisation","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Quadratic factorisation","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":3,"question_text":"2(B)(iii) — Find the 19th term of the A.P. 7, 13, 19, 25, …","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":2,"hint":"a=7,d=6; t19=7+18×6.","easy_answer":"115","keywords":"arithmetic progression;AP","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Arithmetic progression","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":5,"question_text":"2(B)(iv) — A card is drawn from a well-shuffled pack of 52 playing cards. Find the probability that the card drawn is a face card.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":2,"hint":"12 face cards out of 52.","easy_answer":"3/13","keywords":"probability;playing cards","difficulty":"Easy","pyq_frequency":3,"visual_tag":"Playing cards probability","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":6,"question_text":"2(B)(v) — The table gives number of workers and hours worked: 8–10:150, 10–12:500, 12–14:300, 14–16:50. Prepare a less-than upper-limit cumulative frequency distribution.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":2,"hint":"Add frequencies cumulatively.","easy_answer":"10→150; 12→650; 14→950; 16→1000","keywords":"statistics;cumulative frequency","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Cumulative frequency table","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":6,"question_text":"3(A)(i) — Using the given frequency distribution of petrol filled, complete the activity to find the mode. Classes: 0.5–3.5(33), 3.5–6.5(40), 6.5–9.5(27), 9.5–12.5(18), 12.5–15.5(12).","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":3,"hint":"Mode=3.5+[(40−33)/(80−33−27)]×3=4.55.","easy_answer":"4.55 L","keywords":"statistics;mode","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Mode","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":4,"question_text":"3(A)(ii) — The total value including GST of a remote-controlled toy car is ₹2360. GST rate is 18%. Complete the activity to find the taxable value.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":3,"hint":"2360=118x/100.","easy_answer":"₹2000","keywords":"GST;taxable value","difficulty":"Easy","pyq_frequency":3,"visual_tag":"GST calculation","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":2,"question_text":"3(B)(i) — Solve 3m² − m − 10 = 0 by formula method.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":3,"hint":"Apply quadratic formula.","easy_answer":"m=2 or −5/3","keywords":"quadratic equations;formula method","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Quadratic formula","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":1,"question_text":"3(B)(ii) — Solve 3x − 4y = 10 and 4x + 3y = 5 using Cramer's rule.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":3,"hint":"Solve by Cramer’s rule.","easy_answer":"x=2, y=−1","keywords":"simultaneous equations;Cramers rule","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Cramer's rule","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":4,"question_text":"3(B)(iii) — 50 shares of face value ₹10 were purchased for market value ₹25. Company declared 30% dividend. Find (1) sum invested, (2) dividend received, (3) rate of return.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":3,"hint":"Investment=50×25; dividend=50×10×30%; return=150/1250×100.","easy_answer":"₹1250; ₹150; 12%","keywords":"shares;dividend;rate of return","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Shares dividend return","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":5,"question_text":"3(B)(iv) — One coin and a die are thrown simultaneously. Find the probability of A: head and a prime number; B: tail and an odd number.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":3,"hint":"Three prime die outcomes and three odd die outcomes, with specified coin side.","easy_answer":"1/4 and 1/4","keywords":"probability;coin;die","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Coin and die probability","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":2,"question_text":"4(i) — A tank can be filled by two taps in 6 hours. The smaller tap alone takes 5 hours more than the bigger tap alone. Find the time required by each tap separately.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":4,"hint":"Let bigger tap take x hours and smaller x+5; solve 1/x+1/(x+5)=1/6.","easy_answer":"10 hours and 15 hours","keywords":"quadratic equations;word problems","difficulty":"Hard","pyq_frequency":3,"visual_tag":"Tank filling word problem","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":6,"question_text":"4(ii) — The table shows percentage of marks and number of students: 20–40:25, 40–60:65, 60–80:80, 80–100:15. Draw a frequency polygon without drawing histogram.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":4,"hint":"Plot class marks against frequencies and add zero-frequency end points as needed.","easy_answer":"Class marks 30,50,70,90","keywords":"statistics;frequency polygon","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Frequency polygon","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":3,"question_text":"4(iii) — In a Mahila Bachat Gat, Kavita saves ₹20 on day 1, ₹40 on day 2, ₹60 on day 3 and continues similarly. Find total saving in February 2020.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":4,"hint":"February 2020 has 29 days; AP sum = 29/2[40+28×20].","easy_answer":"₹8700","keywords":"arithmetic progression;savings","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Arithmetic progression savings","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":6,"question_text":"5(i) — The pie diagram represents money spent on different sports. If football expenditure is ₹9000, find (a) total amount spent on sports and (b) amount spent on cricket.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":5,"hint":"From the pie chart, football is 45° and cricket is 160°.","easy_answer":"₹72,000 total; ₹32,000 cricket","keywords":"statistics;pie chart","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Pie chart","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null},{"subject_name":"Mathematics Part I","chapter_number":1,"question_text":"5(ii) — Draw the graph of x + y = 4 and answer: (a) what type of triangle is formed with the X- and Y-axes based on its sides? (b) find its area.","pyq_year":2025,"pyq_exam_month":"March","pyq_paper_set":"English","marks":5,"hint":"Intercepts are 4 and 4; area=1/2×4×4.","easy_answer":"Right isosceles triangle; area 8 sq. units","keywords":"linear equations;graph;coordinate geometry","difficulty":"Medium","pyq_frequency":3,"visual_tag":"Graph and triangle","source_note":"Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper. Review before final student-facing use.","question_paper_id":null}];

async function importBundledMath1PYQs(){
  const msg=document.getElementById('pyqImportMessage');
  if(!confirm('Import/verify all 27 manually verified March 2025 Mathematics-I English PYQs? Existing matching questions will be upgraded to ACTUAL_PYQ.')) return;
  try{
    const items=BUNDLED_MATH1_2025_PYQS;
    if(!Array.isArray(items)||items.length!==27) throw new Error('Bundled 2025 PYQ package is incomplete.');
    const r=await fetch(`${API_URL}/api/admin/pyq-import-bundled-2025-math1`,{method:'GET',cache:'no-store'});
    const text=await r.text();
    let d; try{d=JSON.parse(text);}catch(_){throw new Error(`Server returned invalid response (${r.status}).`);}
    if(!r.ok||!d.success) throw Error(d.error||'Bundled PYQ import failed');
    if(msg) msg.textContent=`✅ 2025 Mathematics-I: New ${d.imported||0} • Upgraded/Verified ${d.upgraded||0} • Failed ${d.failed||0}`+(d.errors?.length?` | ${d.errors.slice(0,5).join(' ; ')}`:'');
    await loadPYQStats();
  }catch(e){
    console.error('Bundled PYQ import error:',e);
    if(msg) msg.textContent='❌ '+e.message;
  }
}

document.getElementById('importBundledMath1Button')?.addEventListener('click',importBundledMath1PYQs);


// STEP 43/44 FIX — Repeated PYQ Analysis buttons
async function runRepeatedPYQAnalysisFixed(){
  const box=document.getElementById('step37RepeatResults');
  const btn=document.getElementById('step37RepeatAnalysisButton');
  if(box) box.innerHTML='<div style="padding:10px;border:1px solid #ccc;background:#fff8dc">⏳ Running repeated PYQ analysis...</div>';
  if(btn) btn.disabled=true;
  try{
    const r=await fetch(`${API_URL}/api/admin/pyq-repeat-analysis?ts=${Date.now()}`,{method:'GET',cache:'no-store'});
    const text=await r.text();
    let d; try{d=JSON.parse(text)}catch(e){throw new Error(`Server returned invalid response (${r.status}).`)}
    if(!r.ok || !d.success) throw new Error(d.error || 'Repeated PYQ analysis failed.');
    const years=(d.yearsAvailable||[]).join(', ') || 'None';
    if(box){
      box.innerHTML=`<div style="padding:12px;border:2px solid #2e7d32;background:#f4fff4">
        <h3 style="margin:0 0 8px">✅ REPEATED PYQ ANALYSIS COMPLETED</h3>
        <p><b>Verified Actual PYQs checked:</b> ${d.totalActualPYQ||0}</p>
        <p><b>Verified years available:</b> ${years}</p>
        <p><b>Repeated groups:</b> ${d.repeatedGroups||0}</p>
        <p><b>Repeated questions:</b> ${d.repeatedQuestions||0}</p>
        <p><b>${d.message||''}</b></p>
      </div>`;
    }
    if(typeof loadPYQStats==='function') await loadPYQStats();
  }catch(e){
    console.error('Repeated PYQ analysis:',e);
    if(box) box.innerHTML=`<div style="padding:12px;border:2px solid #b71c1c;background:#fff5f5"><b>❌ ${e.message}</b><br><small>Backend API: ${API_URL}/api/admin/pyq-repeat-analysis</small></div>`;
  }finally{ if(btn) btn.disabled=false; }
}

async function loadRepeatedPYQReportFixed(){
  const box=document.getElementById('step37RepeatResults');
  try{
    const r=await fetch(`${API_URL}/api/admin/pyq-repeat-report`,{cache:'no-store'});
    const text=await r.text();
    let d; try{d=JSON.parse(text)}catch(e){throw new Error(`Server returned invalid response (${r.status}).`)}
    if(!r.ok || !d.success) throw new Error(d.error || 'Unable to load repeated PYQ report.');
    if(!d.rows?.length){
      if(box) box.innerHTML='<div style="padding:12px;border:1px solid #aaa">ℹ️ No cross-year repeated PYQs are confirmed yet. Add another verified year.</div>';
      return;
    }
    if(box){
      box.innerHTML='<h3>📈 Repeated PYQ Report</h3><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;background:white"><tr><th>Subject</th><th>Chapter</th><th>Frequency</th><th>Questions</th><th>Years</th></tr>'+d.rows.map(x=>`<tr><td>${x.subject_name}</td><td>${x.chapter_number} — ${x.chapter_name}</td><td>${x.pyq_frequency}</td><td>${x.question_count}</td><td>${x.years_seen}</td></tr>`).join('')+'</table>';
    }
  }catch(e){
    if(box) box.innerHTML=`<div style="padding:12px;border:2px solid #b71c1c"><b>❌ ${e.message}</b></div>`;
  }
}

function wireRepeatedPYQButtons(){
  document.getElementById('step37RepeatAnalysisButton')?.addEventListener('click',runRepeatedPYQAnalysisFixed);
  document.getElementById('step37RepeatReportButton')?.addEventListener('click',loadRepeatedPYQReportFixed);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wireRepeatedPYQButtons); else wireRepeatedPYQButtons();

// STEP 47 — PYQ year coverage / 2024 intake
async function loadStep47Coverage(){
  const box=document.getElementById('step47CoverageResults');
  if(!box)return;
  box.innerHTML='<div style="padding:10px;background:#fff8dc">⏳ Loading verified PYQ year coverage...</div>';
  try{
    const r=await fetch(`${API_URL}/api/admin/pyq-year-coverage?ts=${Date.now()}`,{cache:'no-store'});
    const d=await r.json();
    if(!r.ok||!d.success) throw new Error(d.error||'Unable to load coverage');
    const rows=d.coverage||[];
    let html='<h3>📊 Verified PYQ Year Coverage</h3><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;background:white"><tr><th>Year</th><th>Actual/Repeted PYQs</th><th>Chapters</th><th>Subjects</th><th>Status</th></tr>';
    const byYear=new Map(rows.map(x=>[Number(x.pyq_year),x]));
    (d.targets||[2025,2024,2023,2022,2021,2020]).forEach(y=>{const x=byYear.get(y);html+=`<tr><td>${y}</td><td>${x?.count||0}</td><td>${x?.chapters||0}</td><td>${x?.subjects||0}</td><td>${x?'✅ VERIFIED DATA':'⬜ NOT ADDED'}</td></tr>`;});
    html+='</table>';
    html+=`<p><strong>Current verified years:</strong> ${rows.length?rows.map(x=>x.pyq_year).join(', '):'None'}<br><strong>Next priority:</strong> 2024 Mathematics-I</p>`;
    box.innerHTML=html;
  }catch(e){box.innerHTML=`<div style="padding:10px;border:2px solid #b71c1c;background:#fff5f5">❌ ${e.message}</div>`;}
}

document.getElementById('step47CoverageButton')?.addEventListener('click',loadStep47Coverage);
document.getElementById('step47OpenOfficialPortalButton')?.addEventListener('click',()=>window.open('https://mahahsscboard.in/question-paper','_blank','noopener'));
document.getElementById('step47ShowImportHelpButton')?.addEventListener('click',()=>{const x=document.getElementById('step47ImportHelp');if(x)x.style.display=x.style.display==='none'?'block':'none';});
if(document.getElementById('step47CoverageResults')) loadStep47Coverage();


// STEP 48 — import the 27 verified March 2024 Mathematics-I PYQs bundled from the uploaded paper.
async function importStep48Math1_2024(){
  const msg=document.getElementById('step48Import2024Message');
  if(!confirm('Import/verify all 27 manually verified March 2024 Mathematics-I English PYQs? Existing matching questions will be upgraded to ACTUAL_PYQ.')) return;
  if(msg) msg.textContent='⏳ Importing 2024 Mathematics-I PYQs...';
  try{
    const r=await fetch(`${API_URL}/api/admin/pyq-import-bundled-2024-math1?ts=${Date.now()}`,{cache:'no-store'});
    const d=await r.json();
    if(!r.ok||!d.success) throw new Error(d.error||'Import failed');
    if(msg) msg.textContent=`✅ 2024 Mathematics-I: New ${d.imported||0} • Upgraded/Verified ${d.upgraded||0} • Failed ${d.failed||0}`+(d.errors?.length?` | ${d.errors.slice(0,5).join(' ; ')}`:'');
    if(typeof loadStep47Coverage==='function') loadStep47Coverage();
  }catch(e){ if(msg) msg.textContent=`❌ ${e.message}`; }
}
document.getElementById('step48Import2024Math1Button')?.addEventListener('click',importStep48Math1_2024);


// STEP 91 — LIVE QUESTION-BANK CONTENT COMPLETENESS AUDIT
let latestContentAudit = null;
function escAudit(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
async function runContentCompletenessAudit(){
  const box=document.getElementById('contentCompletenessAuditResults');
  const btn=document.getElementById('contentCompletenessAuditButton');
  const exp=document.getElementById('contentCompletenessExportButton');
  if(!box)return;
  if(btn)btn.disabled=true;
  box.innerHTML='<div style="padding:12px;background:#fff8dc">⏳ Checking every active live question. Please wait...</div>';
  try{
    let d=null;
    // STEP 92: Prefer the dedicated live endpoint, but automatically fall back
    // to the already-existing admin question endpoint. This keeps the audit
    // usable even if Render is temporarily running an older backend build.
    let r=await fetch(`${API_URL}/api/admin/live-content-audit-v2?ts=${Date.now()}`,{cache:'no-store'});
    let contentType=(r.headers.get('content-type')||'').toLowerCase();
    if(r.ok && contentType.includes('application/json')){
      d=await r.json();
      if(!d.success) d=null;
    }
    if(!d){
      const fallback=await fetch(`${API_URL}/api/admin/questions?status=active&ts=${Date.now()}`,{cache:'no-store'});
      const fallbackType=(fallback.headers.get('content-type')||'').toLowerCase();
      if(!fallback.ok || !fallbackType.includes('application/json')){
        const raw=await fallback.text();
        throw new Error(`Live question-bank API unavailable (${fallback.status}). ${raw.slice(0,100)}`);
      }
      const rows=await fallback.json();
      const list=Array.isArray(rows)?rows:[];
      const audited=list.map(q=>{
        const text=String(q.question_text||'').trim(), answer=String(q.easy_answer||'').trim(), hint=String(q.hint||'').trim(), keywords=String(q.keywords||'').trim();
        const t=`${q.subject_name||''} ${text} ${keywords}`.toLowerCase();
        const visual=/mean|median|mode|statistics|frequency|data|probability|coordinate|linear equation|quadratic|circle|pythagoras|trigonometry|electric|voltage|resistance|chemical|gravitation|democracy|election|history|latitude|longitude|map|diagram|figure|graph|table|process|cycle/.test(t);
        let representation='NOT_REQUIRED';
        if(/graph|coordinate|straight line|plot|statistics|frequency|data|histogram|bar graph|pie chart|table/.test(t)) representation='GRAPH/TABLE';
        else if(/diagram|figure|label|structure|circuit|ray|triangle|circle|map|flow|process|cycle/.test(t)) representation='DIAGRAM';
        else if(/formula|equation|calculate|find the value|solve|probability|mean|median|mode|resistance|voltage|current|power|energy|heat|density|speed|work|area|volume/.test(t)) representation='FORMULA';
        const issues=[]; if(!text)issues.push('QUESTION'); if(!answer)issues.push('ANSWER'); if(!hint)issues.push('HINT'); if(!keywords)issues.push('KEYWORDS'); if(!q.difficulty)issues.push('DIFFICULTY'); if(!answer)issues.push('SOLUTION');
        return {id:q.id,subject_name:q.subject_name,chapter_number:q.chapter_number,chapter_name:q.chapter_name,question_text:text,marks:q.marks,pyq_year:q.pyq_year,question_paper_id:q.question_paper_id,answer_status:answer?'OK':'MISSING',solution_status:answer?(hint?'GENERATABLE':'BASIC_GENERATABLE'):'MISSING',visual_status:visual?'FALLBACK/ENGINE':'FALLBACK/ENGINE',visual_type:visual?'Topic visual':'General learning visual',representation_type:representation,representation_status:representation==='NOT_REQUIRED'?'NOT_REQUIRED':representation==='FORMULA'?'FORMULA_EXPECTED':representation==='DIAGRAM'?'DIAGRAM_EXPECTED':'GRAPH_TABLE_EXPECTED',hint_status:hint?'OK':'MISSING',keywords_status:keywords?'OK':'MISSING',difficulty_status:q.difficulty?'OK':'MISSING',issue_count:issues.length,issues,audit_status:issues.length?'CHECK':'READY'};
      });
      const summary={total_questions:audited.length,ready_questions:audited.filter(x=>x.audit_status==='READY').length,check_questions:audited.filter(x=>x.audit_status==='CHECK').length,missing_answer:audited.filter(x=>x.answer_status==='MISSING').length,solution_missing:audited.filter(x=>x.solution_status==='MISSING').length,solution_generatable:audited.filter(x=>x.solution_status!=='MISSING').length,missing_hint:audited.filter(x=>x.hint_status==='MISSING').length,missing_keywords:audited.filter(x=>x.keywords_status==='MISSING').length,missing_difficulty:audited.filter(x=>x.difficulty_status==='MISSING').length,formula_expected:audited.filter(x=>x.representation_type==='FORMULA').length,diagram_expected:audited.filter(x=>x.representation_type==='DIAGRAM').length,graph_table_expected:audited.filter(x=>x.representation_type==='GRAPH/TABLE').length,visual_engine_coverage:audited.length};
      const subjects={}; for(const x of audited){const k=x.subject_name||'Unknown'; if(!subjects[k])subjects[k]={subject_name:k,total:0,ready:0,check:0,missing_answer:0,solution_missing:0,formula_expected:0,diagram_expected:0,graph_table_expected:0}; const a=subjects[k]; a.total++; if(x.audit_status==='READY')a.ready++;else a.check++; if(x.answer_status==='MISSING')a.missing_answer++; if(x.solution_status==='MISSING')a.solution_missing++; if(x.representation_type==='FORMULA')a.formula_expected++; if(x.representation_type==='DIAGRAM')a.diagram_expected++; if(x.representation_type==='GRAPH/TABLE')a.graph_table_expected++;}
      d={success:true,generated_at:new Date().toISOString(),summary,subjects:Object.values(subjects),rows:audited,fallback:true};
    }
    latestContentAudit=d;
    const x=d.summary||{};
    const pct=x.total_questions?Math.round((x.ready_questions/x.total_questions)*100):0;
    let h=`<div style="padding:14px;border:2px solid #6a1b9a;background:#fbf5ff"><h3>✅ LIVE AUDIT COMPLETED</h3>`;
    h+=`<p><strong>Total active questions:</strong> ${x.total_questions} &nbsp; <strong>READY:</strong> ${x.ready_questions} &nbsp; <strong>CHECK:</strong> ${x.check_questions} &nbsp; <strong>Readiness:</strong> ${pct}%</p>`;
    h+=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">`;
    const cards=[['📝 Missing Answer',x.missing_answer],['🧩 Solution Missing',x.solution_missing],['💡 Solution Generatable',x.solution_generatable],['💭 Missing Hint',x.missing_hint],['🔑 Missing Keywords',x.missing_keywords],['📊 Formula Expected',x.formula_expected],['📐 Diagram Expected',x.diagram_expected],['📈 Graph/Table Expected',x.graph_table_expected],['🖼️ Visual Engine Coverage',x.visual_engine_coverage]];
    cards.forEach(c=>h+=`<div style="padding:10px;border:1px solid #ccc;background:white"><strong>${c[0]}</strong><br><span style="font-size:20px">${c[1]||0}</span></div>`);
    h+='</div><h3>📚 Subject-wise Audit</h3><div style="overflow:auto"><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;background:white;min-width:900px"><tr><th>Subject</th><th>Total</th><th>Ready</th><th>Check</th><th>Missing Answer</th><th>Solution Missing</th><th>Formula</th><th>Diagram</th><th>Graph/Table</th></tr>';
    (d.subjects||[]).forEach(a=>h+=`<tr><td>${escAudit(a.subject_name)}</td><td>${a.total}</td><td>${a.ready}</td><td>${a.check}</td><td>${a.missing_answer}</td><td>${a.solution_missing}</td><td>${a.formula_expected}</td><td>${a.diagram_expected}</td><td>${a.graph_table_expected}</td></tr>`);
    h+='</table></div><h3>⚠️ Questions needing attention</h3><div style="max-height:500px;overflow:auto"><table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;background:white;min-width:1100px"><tr><th>ID</th><th>Subject</th><th>Chapter</th><th>Question</th><th>Answer</th><th>Solution</th><th>Visual</th><th>Formula/Diagram/Graph/Table</th><th>Issues</th></tr>';
    (d.rows||[]).filter(q=>q.audit_status==='CHECK').forEach(q=>h+=`<tr><td>${q.id}</td><td>${escAudit(q.subject_name)}</td><td>${escAudit(q.chapter_number)} — ${escAudit(q.chapter_name)}</td><td>${escAudit(q.question_text)}</td><td>${q.answer_status}</td><td>${q.solution_status}</td><td>${q.visual_status}</td><td>${q.representation_status}</td><td>${escAudit((q.issues||[]).join(', '))}</td></tr>`);
    h+='</table></div><p><small>Note: Solution status means the existing answer/hint can generate a guided solution in the app; it does not claim an officially authored source solution. Visual status checks coverage by the app visual engine/fallback. Formula/Diagram/Graph/Table is an automatic applicability check, not a claim that an official figure exists.</small></p></div>';
    box.innerHTML=h; if(exp)exp.style.display='inline-block';
  }catch(e){box.innerHTML=`<div style="padding:12px;border:2px solid #b71c1c;background:#fff5f5"><strong>❌ ${escAudit(e.message)}</strong></div>`;}
  finally{if(btn)btn.disabled=false;}
}
function exportContentAuditCSV(){
  if(!latestContentAudit?.rows?.length)return;
  const head=['ID','Subject','Chapter Number','Chapter Name','Question','Marks','PYQ Year','Answer','Solution','Visual','Visual Type','Representation','Representation Status','Hint','Keywords','Difficulty','Issues','Audit Status'];
  const lines=[head,...latestContentAudit.rows.map(q=>[q.id,q.subject_name,q.chapter_number,q.chapter_name,q.question_text,q.marks,q.pyq_year||'',q.answer_status,q.solution_status,q.visual_status,q.visual_type,q.representation_type,q.representation_status,q.hint_status,q.keywords_status,q.difficulty_status,(q.issues||[]).join('; '),q.audit_status])].map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(','));
  const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='10th-PASS-MASTER_CONTENT_COMPLETENESS_AUDIT.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
document.getElementById('contentCompletenessAuditButton')?.addEventListener('click',runContentCompletenessAudit);
document.getElementById('contentCompletenessExportButton')?.addEventListener('click',exportContentAuditCSV);
