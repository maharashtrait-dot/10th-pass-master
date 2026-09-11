require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 3001;


// ================================================
// MIDDLEWARE
// ================================================

app.use(cors());

app.use(express.json());

// ================================================
// SERVE FRONTEND
// ================================================

app.use(express.static(path.join(__dirname, "..", "frontend")));



// ================================================
// HOME ROUTE
// ================================================

app.get("/backend-status", (req, res) => {

    res.send("10th Pass Master Backend is Working!");

});


// ================================================
// GET ALL SUBJECTS
// ================================================

app.get("/api/subjects", async (req, res) => {

    try {

        const result = await pool.query(
            `SELECT *
             FROM subjects
             ORDER BY id`
        );

        res.json(result.rows);

    } catch (error) {

        console.error(
            "Database Error:",
            error
        );

        res.status(500).json({
            error: "Database error"
        });

    }

});


// ================================================
// GET CHAPTERS BY SUBJECT ID
// ================================================

app.get(
    "/api/subjects/:subjectId/chapters",
    async (req, res) => {

        try {

            const subjectId =
                req.params.subjectId;


            const studentId = req.query.studentId || null;

            const result = await pool.query(

                `SELECT c.*,
                        COUNT(q.id)::int AS total_questions,
                        COUNT(CASE WHEN q.is_active = TRUE THEN 1 END)::int AS active_questions,
                        COUNT(CASE WHEN q.is_active = TRUE AND p.status = 'known' THEN 1 END)::int AS known_questions,
                        COUNT(CASE WHEN q.is_active = TRUE AND p.status = 'revision' THEN 1 END)::int AS revision_questions
                 FROM chapters c
                 LEFT JOIN questions q ON q.chapter_id = c.id
                 LEFT JOIN student_question_progress p
                   ON p.question_id = q.id
                  AND p.student_id = $2
                 WHERE c.subject_id = $1
                 AND c.is_active = TRUE
                 GROUP BY c.id
                 ORDER BY c.id`,

                [subjectId, studentId]

            );


            res.json(result.rows);

        } catch (error) {

            console.error(
                "Chapter Database Error:",
                error
            );

            res.status(500).json({
                error: "Database error"
            });

        }

    }
);




// ================================================
// STAGE 10 STEP 2 - OFFICIAL SSC CHAPTER MASTER IMPORT
// ================================================

const OFFICIAL_SSC_CHAPTER_MASTER = {
    "English": [
        ["1.1", "Where the Mind is Without Fear"], ["1.2", "The Thief's Story"],
        ["1.3", "On Wings of Courage"], ["1.4", "All the World's a Stage"],
        ["1.5", "Joan of Arc"], ["1.6", "The Alchemy of Nature"],
        ["2.1", "Animals"], ["2.2", "Three Questions"], ["2.3", "Connecting the Dots"],
        ["2.4", "The Pulley"], ["2.5", "Let's March"], ["2.6", "Science and Spirituality"],
        ["3.1", "Night of the Scorpion"], ["3.2", "The Night I Met Einstein"], ["3.3", "Stephen Hawking"],
        ["3.4", "The Will to Win"], ["3.5", "Unbeatable Super Mom-Mary Kom"], ["3.6", "The Concert"],
        ["4.1", "A Thing of Beauty is a Joy For Ever"], ["4.2", "The Luncheon"], ["4.3", "World Heritage"],
        ["4.4", "The Height of the Ridiculous"], ["4.5", "The Old Man and The Sea: Book Review"], ["4.6", "The Gift of the Magi"]
    ],
    "Marathi": [
        ["1", "जय जय हे भारत देशा"], ["2", "बोलतो मराठी..."], ["3", "आजी : कुटुंबाचं आगळ"],
        ["4", "उत्तमलक्षण"], ["5", "वसंतहृदय चैत्र"], ["6", "वस्तू"], ["7", "गवताचे पाते"],
        ["8", "वाट पाहताना"], ["9", "आश्वासक चित्र"], ["10", "आप्पांचे पत्र"], ["11", "गोष्ट अरुणिमाची"],
        ["12", "भरतवाक्य"], ["13", "कर्ते सुधारक कर्वे"], ["14", "काळे केस"], ["15", "खोद आणखी थोडेसे"],
        ["16", "आकाशी झेप घे रे"], ["17", "सोनाली"], ["18", "निर्णय"],
        ["19", "तू झालास मूक समाजाचा नायक"], ["20", "सर्व विश्वचि व्हावे सुखी"]
    ],
    "Hindi": [
        ["1.1", "भारत महिमा"], ["1.2", "लक्ष्मी"], ["1.3", "वाह रे! हमदर्द"], ["1.4", "मन (पूरक पठन)"],
        ["1.5", "गोवा : जैसा मैंने देखा"], ["1.6", "गिरिधर नागर"], ["1.7", "खुला आकाश (पूरक पठन)"],
        ["1.8", "गजल"], ["1.9", "रीढ़ की हड्डी"], ["1.10", "ठेस (पूरक पठन)"], ["1.11", "कृषक का गान"],
        ["2.1", "बरषहिं जलद"], ["2.2", "दो लघुकथाएँ (पूरक पठन)"], ["2.3", "श्रम साधना"],
        ["2.4", "छापा"], ["2.5", "ईमानदारी की प्रतिमूर्ति"], ["2.6", "हम इस धरती की संतति हैं (पूरक पठन)"],
        ["2.7", "महिला आश्रम"], ["2.8", "अपनी गंध नहीं बेचूँगा"], ["2.9", "जब तक जिंदा रहूँ, लिखता रहूँ"],
        ["2.10", "बूढ़ी काकी (पूरक पठन)"], ["2.11", "समता की ओर"]
    ],
    "Sanskrit": [
        ["1", "आद्यकृषकः पृथुवैन्यः"], ["2", "व्यसने मित्रपरीक्षा"], ["3", "सूक्तिसुधा"],
        ["4", "अमूल्यं कमलम्"], ["5", "स एव परमाणुः"], ["6", "युग्ममाला"],
        ["7", "संस्कृतनाट्यस्तबकः"], ["8", "वाचनप्रशंसा"], ["9", "धेनोर्व्याघ्रः पलायते"],
        ["10", "नदीसूक्तम्"], ["11", "जटायुशौर्यम्"], ["12", "आदिशङ्कराचार्यः"],
        ["13", "चित्रकाव्यम्"], ["14", "प्रतिपदं संस्कृतम्"], ["15", "मानवताधर्मः"]
    ],
    "Mathematics Part I": [
        ["1", "Linear Equations in Two Variables"], ["2", "Quadratic Equations"],
        ["3", "Arithmetic Progression"], ["4", "Financial Planning"], ["5", "Probability"], ["6", "Statistics"]
    ],
    "Mathematics Part II": [
        ["1", "Similarity"], ["2", "Pythagoras Theorem"], ["3", "Circle"],
        ["4", "Geometric Constructions"], ["5", "Co-ordinate Geometry"], ["6", "Trigonometry"], ["7", "Mensuration"]
    ],
    "Science & Technology Part I": [
        ["1", "Gravitation"], ["2", "Periodic Classification of Elements"], ["3", "Chemical Reactions and Equations"],
        ["4", "Effects of Electric Current"], ["5", "Heat"], ["6", "Refraction of Light"], ["7", "Lenses"],
        ["8", "Metallurgy"], ["9", "Carbon Compounds"], ["10", "Space Missions"]
    ],
    "Science & Technology Part II": [
        ["1", "Heredity and Evolution"], ["2", "Life Processes in Living Organisms Part - 1"],
        ["3", "Life Processes in Living Organisms Part - 2"], ["4", "Environmental Management"],
        ["5", "Towards Green Energy"], ["6", "Animal Classification"], ["7", "Introduction to Microbiology"],
        ["8", "Cell Biology and Biotechnology"], ["9", "Social Health"], ["10", "Disaster Management"]
    ],
    "History & Political Science": [
        ["1", "Historiography : Development in the West"], ["2", "Historiography : Indian Tradition"],
        ["3", "Applied History"], ["4", "History of Indian Arts"], ["5", "Mass Media and History"],
        ["6", "Entertainment and History"], ["7", "Sports and History"], ["8", "Tourism and History"],
        ["9", "Heritage Management"], ["10", "Working of the Constitution"], ["11", "The Electoral Process"],
        ["12", "Political Parties"], ["13", "Social and Political Movements"], ["14", "Challenges faced by Indian Democracy"]
    ],
    "Geography": [
        ["1", "Field Visit"], ["2", "Location and Extent"], ["3", "Physiography and Drainage"],
        ["4", "Climate"], ["5", "Natural Vegetation and Wildlife"], ["6", "Population"],
        ["7", "Human Settlement"], ["8", "Economy and Occupation"], ["9", "Tourism, Transport and Communication"]
    ]
};

app.post("/api/admin/chapters/import-official", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const subjectsResult = await client.query(`SELECT id, name FROM subjects WHERE is_active = TRUE OR is_active IS NULL`);
        const subjectRows = subjectsResult.rows;
        const report = [];
        let added = 0;
        let skipped = 0;

        for (const [subjectName, chapters] of Object.entries(OFFICIAL_SSC_CHAPTER_MASTER)) {
            const subject = subjectRows.find(s => String(s.name).trim().toLowerCase() === subjectName.trim().toLowerCase());
            if (!subject) {
                report.push({ subject: subjectName, status: "subject_not_found", added: 0, skipped: chapters.length });
                skipped += chapters.length;
                continue;
            }

            let subjectAdded = 0;
            let subjectSkipped = 0;
            for (const [chapterNumber, chapterName] of chapters) {
                const existing = await client.query(
                    `SELECT id FROM chapters WHERE subject_id = $1 AND chapter_number = $2 LIMIT 1`,
                    [subject.id, chapterNumber]
                );
                if (existing.rowCount > 0) {
                    subjectSkipped++;
                    skipped++;
                    continue;
                }
                await client.query(
                    `INSERT INTO chapters (subject_id, chapter_number, chapter_name, is_active) VALUES ($1, $2, $3, TRUE)`,
                    [subject.id, chapterNumber, chapterName]
                );
                subjectAdded++;
                added++;
            }
            report.push({ subject: subjectName, status: "imported", added: subjectAdded, skipped: subjectSkipped });
        }

        await client.query("COMMIT");
        res.json({ success: true, added, skipped, report, source: "MSBSHSE SSC subjects / Balbharati chapter references" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Official Chapter Import Error:", error);
        res.status(500).json({ error: "Unable to import official chapter master." });
    } finally {
        client.release();
    }
});

app.get("/api/admin/chapters/import-official/preview", (req, res) => {
    const preview = Object.entries(OFFICIAL_SSC_CHAPTER_MASTER).map(([subject, chapters]) => ({
        subject,
        chapter_count: chapters.length,
        chapters: chapters.map(([chapter_number, chapter_name]) => ({ chapter_number, chapter_name }))
    }));
    res.json({ success: true, preview, total_chapters: preview.reduce((sum, item) => sum + item.chapter_count, 0) });
});

// ================================================
// ADMIN: CHAPTER MASTER MANAGEMENT (STAGE 10)
// ================================================

app.get("/api/admin/chapters", async (req, res) => {
    try {
        const { subject_id, status = "all", search = "" } = req.query;
        const conditions = [];
        const values = [];
        let index = 1;

        if (subject_id) {
            conditions.push(`c.subject_id = $${index++}`);
            values.push(subject_id);
        }

        if (status === "active") {
            conditions.push(`c.is_active = TRUE`);
        } else if (status === "inactive") {
            conditions.push(`c.is_active = FALSE`);
        }

        if (search.trim()) {
            conditions.push(`(c.chapter_name ILIKE $${index} OR c.chapter_number ILIKE $${index})`);
            values.push(`%${search.trim()}%`);
            index++;
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const result = await pool.query(
            `SELECT
                c.id,
                c.subject_id,
                c.chapter_number,
                c.chapter_name,
                c.is_active,
                c.created_at,
                s.name AS subject_name,
                COUNT(q.id)::INTEGER AS question_count
             FROM chapters c
             JOIN subjects s ON s.id = c.subject_id
             LEFT JOIN questions q ON q.chapter_id = c.id
             ${whereClause}
             GROUP BY c.id, c.subject_id, c.chapter_number, c.chapter_name,
                      c.is_active, c.created_at, s.id, s.name
             ORDER BY s.id, c.chapter_number, c.id`,
            values
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Admin Chapter List Error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/admin/chapters", async (req, res) => {
    try {
        const { subject_id, chapter_number, chapter_name } = req.body;

        if (!subject_id || !String(chapter_number || "").trim() || !String(chapter_name || "").trim()) {
            return res.status(400).json({ error: "Subject, chapter number and chapter name are required." });
        }

        const subjectCheck = await pool.query(
            `SELECT id FROM subjects WHERE id = $1`,
            [subject_id]
        );

        if (subjectCheck.rowCount === 0) {
            return res.status(400).json({ error: "Invalid subject." });
        }

        const duplicate = await pool.query(
            `SELECT id FROM chapters
             WHERE subject_id = $1
             AND chapter_number = $2
             LIMIT 1`,
            [subject_id, String(chapter_number).trim()]
        );

        if (duplicate.rowCount > 0) {
            return res.status(409).json({ error: "This chapter number already exists for the selected subject." });
        }

        const result = await pool.query(
            `INSERT INTO chapters (subject_id, chapter_number, chapter_name, is_active)
             VALUES ($1, $2, $3, TRUE)
             RETURNING *`,
            [subject_id, String(chapter_number).trim(), String(chapter_name).trim()]
        );

        res.status(201).json({ success: true, chapter: result.rows[0] });
    } catch (error) {
        console.error("Admin Add Chapter Error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

app.put("/api/admin/chapters/:chapterId", async (req, res) => {
    try {
        const chapterId = req.params.chapterId;
        const { subject_id, chapter_number, chapter_name } = req.body;

        if (!subject_id || !String(chapter_number || "").trim() || !String(chapter_name || "").trim()) {
            return res.status(400).json({ error: "Subject, chapter number and chapter name are required." });
        }

        const duplicate = await pool.query(
            `SELECT id FROM chapters
             WHERE subject_id = $1
             AND chapter_number = $2
             AND id <> $3
             LIMIT 1`,
            [subject_id, String(chapter_number).trim(), chapterId]
        );

        if (duplicate.rowCount > 0) {
            return res.status(409).json({ error: "This chapter number already exists for the selected subject." });
        }

        const result = await pool.query(
            `UPDATE chapters
             SET subject_id = $1,
                 chapter_number = $2,
                 chapter_name = $3
             WHERE id = $4
             RETURNING *`,
            [subject_id, String(chapter_number).trim(), String(chapter_name).trim(), chapterId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Chapter not found." });
        }

        res.json({ success: true, chapter: result.rows[0] });
    } catch (error) {
        console.error("Admin Update Chapter Error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

app.patch("/api/admin/chapters/:chapterId/status", async (req, res) => {
    try {
        const chapterId = req.params.chapterId;
        const { is_active } = req.body;

        if (typeof is_active !== "boolean") {
            return res.status(400).json({ error: "is_active must be true or false." });
        }

        const result = await pool.query(
            `UPDATE chapters
             SET is_active = $1
             WHERE id = $2
             RETURNING *`,
            [is_active, chapterId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Chapter not found." });
        }

        res.json({ success: true, chapter: result.rows[0] });
    } catch (error) {
        console.error("Admin Chapter Status Error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// ================================================
// GET QUESTIONS BY CHAPTER ID
// ================================================

app.get(
    "/api/chapters/:chapterId/questions",
    async (req, res) => {

        try {

            const chapterId =
                req.params.chapterId;


            const result = await pool.query(

                `SELECT q.*,
                        p.status AS student_status
                 FROM questions q
                 LEFT JOIN student_question_progress p
                   ON p.question_id = q.id
                  AND p.student_id = $2
                 WHERE q.chapter_id = $1
                 AND q.is_active = TRUE
                 ORDER BY q.id`,

                [chapterId, req.query.studentId || null]

            );


            res.json(result.rows);

        } catch (error) {

            console.error(
                "Question Database Error:",
                error
            );

            res.status(500).json({
                error: "Database error"
            });

        }

    }
);


// ================================================
// SAVE STUDENT QUESTION PROGRESS
// ================================================

app.post(
    "/api/progress",
    async (req, res) => {

        try {

            const {
                student_id,
                question_id,
                status
            } = req.body;


            const result = await pool.query(

                `INSERT INTO student_question_progress
                 (
                    student_id,
                    question_id,
                    status,
                    updated_at
                 )

                 VALUES
                 (
                    $1,
                    $2,
                    $3,
                    CURRENT_TIMESTAMP
                 )

                 ON CONFLICT
                 (
                    student_id,
                    question_id
                 )

                 DO UPDATE SET
                    status = EXCLUDED.status,
                    updated_at = CURRENT_TIMESTAMP

                 RETURNING *`,

                [
                    student_id,
                    question_id,
                    status
                ]

            );


            res.json({

                success: true,

                progress:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "Progress Save Error:",
                error
            );

            res.status(500).json({

                success: false,

                error:
                    "Unable to save progress"

            });

        }

    }
);


// ================================================
// GET REVISION QUESTIONS FOR STUDENT
// ================================================

app.get(
    "/api/students/:studentId/revision",
    async (req, res) => {

        try {

            const studentId =
                req.params.studentId;


            const result = await pool.query(

                `SELECT

                    q.id,
                    q.question_text,
                    q.marks,
                    q.hint,
                    q.easy_answer,
                    q.keywords,
                    q.question_type,
                    q.difficulty,
                    q.pyq_year,
                    q.question_paper_id,

                    c.chapter_number,
                    c.chapter_name,

                    s.name AS subject_name

                 FROM student_question_progress p

                 JOIN questions q
                    ON p.question_id = q.id

                 JOIN chapters c
                    ON q.chapter_id = c.id

                 JOIN subjects s
                    ON c.subject_id = s.id

                 WHERE p.student_id = $1
                 AND p.status = 'revision'

                 ORDER BY p.updated_at DESC`,

                [studentId]

            );


            res.json(result.rows);


        } catch (error) {

            console.error(
                "Revision Error:",
                error
            );

            res.status(500).json({

                error:
                    "Unable to load revision questions"

            });

        }

    }
);


// ================================================
// CREATE NEW STUDENT
// ================================================

app.post(
    "/api/students",
    async (req, res) => {

        try {

            const {
                name,
                mobile_number
            } = req.body;


            // Validate Name

            if (
                !name ||
                name.trim() === ""
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Student name is required"

                });

            }


            // Validate Mobile Number

            if (
                !mobile_number ||
                !/^[0-9]{10}$/.test(
                    mobile_number
                )
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Please enter a valid 10 digit mobile number"

                });

            }


            // Create Student

            const result = await pool.query(

                `INSERT INTO students
                 (
                    name,
                    mobile_number
                 )

                 VALUES
                 (
                    $1,
                    $2
                 )

                 RETURNING *`,

                [
                    name.trim(),
                    mobile_number.trim()
                ]

            );


            res.json({

                success: true,

                student:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "Student Create Error:",
                error
            );

            res.status(500).json({

                success: false,

                error:
                    "Unable to create student"

            });

        }

    }
);


// ================================================
// FIND EXISTING STUDENT BY MOBILE NUMBER
// ================================================

app.get(
    "/api/students/find/mobile/:mobile",
    async (req, res) => {

        try {

            const mobileNumber =
                req.params.mobile.trim();


            const result = await pool.query(

                `SELECT *
                 FROM students
                 WHERE mobile_number = $1
                 LIMIT 1`,

                [mobileNumber]

            );


            if (result.rows.length > 0) {

                return res.json({

                    found: true,

                    student:
                        result.rows[0]

                });

            }


            res.json({

                found: false

            });


        } catch (error) {

            console.error(
                "Find Student Error:",
                error
            );

            res.status(500).json({

                error:
                    "Unable to find student"

            });

        }

    }
);


// ================================================
// GET STUDENT PROGRESS SUMMARY
// ================================================

app.get(
    "/api/students/:studentId/progress-summary",
    async (req, res) => {

        try {

            const studentId =
                req.params.studentId;


            // Total Questions

            const totalResult =
                await pool.query(

                    `SELECT COUNT(*) AS total
                     FROM questions
                     WHERE is_active = TRUE`

                );


            // Known Questions

            const knownResult =
                await pool.query(

                    `SELECT COUNT(*) AS known
                     FROM student_question_progress
                     WHERE student_id = $1
                     AND status = 'known'`,

                    [studentId]

                );


            // Revision Questions

            const revisionResult =
                await pool.query(

                    `SELECT COUNT(*) AS revision
                     FROM student_question_progress
                     WHERE student_id = $1
                     AND status = 'revision'`,

                    [studentId]

                );


            const total =
                parseInt(
                    totalResult.rows[0].total
                );


            const known =
                parseInt(
                    knownResult.rows[0].known
                );


            const revision =
                parseInt(
                    revisionResult.rows[0].revision
                );


            // Attempted

            const attempted =
                known + revision;


            // Not Started

            const notStarted =
                Math.max(
                    total - attempted,
                    0
                );


            // Study Progress

            let percentage = 0;


            if (total > 0) {

                percentage =
                    Math.round(
                        (attempted / total) * 100
                    );

            }


            // Mastery Progress

            let masteryPercentage = 0;


            if (total > 0) {

                masteryPercentage =
                    Math.round(
                        (known / total) * 100
                    );

            }


            res.json({

                total: total,

                known: known,

                revision: revision,

                notStarted: notStarted,

                percentage: percentage,

                masteryPercentage:
                    masteryPercentage

            });


        } catch (error) {

            console.error(
                "Progress Summary Error:",
                error
            );

            res.status(500).json({

                error:
                    "Unable to load progress summary"

            });

        }

    }
);



// ================================================
// STAGE 8 STEP 4 — PASS READINESS SCORE
// ================================================

app.get(
    "/api/students/:studentId/pass-readiness",
    async (req, res) => {
        try {
            const studentId = Number(req.params.studentId);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Valid student ID is required"
                });
            }

            const studentResult = await pool.query(
                `SELECT id, name FROM students WHERE id = $1 LIMIT 1`,
                [studentId]
            );

            if (studentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Student not found"
                });
            }

            const statsResult = await pool.query(
                `SELECT
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (
                        WHERE p.status = 'known'
                    )::int AS known,
                    COUNT(*) FILTER (
                        WHERE p.status = 'revision'
                    )::int AS revision,
                    COUNT(*) FILTER (
                        WHERE qp.id IS NOT NULL
                    )::int AS pyq_total,
                    COUNT(*) FILTER (
                        WHERE qp.id IS NOT NULL
                        AND p.status = 'known'
                    )::int AS pyq_known
                 FROM questions q
                 LEFT JOIN student_question_progress p
                    ON p.question_id = q.id
                   AND p.student_id = $1
                 LEFT JOIN question_papers qp
                    ON qp.id = q.question_paper_id
                   AND qp.is_active = TRUE
                 WHERE q.is_active = TRUE`,
                [studentId]
            );

            const dailyResult = await pool.query(
                `SELECT
                    total_questions,
                    completed_questions,
                    completed_at
                 FROM daily_practice_sessions
                 WHERE student_id = $1
                   AND practice_date = CURRENT_DATE
                 LIMIT 1`,
                [studentId]
            );

            const row = statsResult.rows[0];
            const total = Number(row.total) || 0;
            const known = Number(row.known) || 0;
            const revision = Number(row.revision) || 0;
            const attempted = known + revision;
            const pyqTotal = Number(row.pyq_total) || 0;
            const pyqKnown = Number(row.pyq_known) || 0;

            const masteryPercentage = total > 0
                ? Math.round((known / total) * 100)
                : 0;

            const coveragePercentage = total > 0
                ? Math.round((attempted / total) * 100)
                : 0;

            const pyqPercentage = pyqTotal > 0
                ? Math.round((pyqKnown / pyqTotal) * 100)
                : masteryPercentage;

            let dailyPercentage = 0;
            let dailyCompleted = 0;
            let dailyTotal = 0;
            let dailyCompletedAt = null;

            if (dailyResult.rows.length > 0) {
                dailyTotal = Number(dailyResult.rows[0].total_questions) || 0;
                dailyCompleted = Number(dailyResult.rows[0].completed_questions) || 0;
                dailyCompletedAt = dailyResult.rows[0].completed_at;
                dailyPercentage = dailyTotal > 0
                    ? Math.round((dailyCompleted / dailyTotal) * 100)
                    : 0;
            }

            // Score weights:
            // 50% mastery + 25% overall coverage + 15% PYQ mastery + 10% daily practice.
            let score = Math.round(
                (masteryPercentage * 0.50) +
                (coveragePercentage * 0.25) +
                (pyqPercentage * 0.15) +
                (dailyPercentage * 0.10)
            );

            score = Math.max(0, Math.min(100, score));

            let level = "Needs More Practice";
            let message = "Start with Today's 10 Questions and revise weak questions.";

            if (score >= 80) {
                level = "PASS Ready";
                message = "Excellent! Keep revising and practicing PYQs to stay ready.";
            } else if (score >= 60) {
                level = "Almost Ready";
                message = "Good progress. Focus on revision questions and PYQs.";
            } else if (score >= 40) {
                level = "Building Confidence";
                message = "Keep studying daily. Improve your known questions and coverage.";
            }

            res.json({
                success: true,
                student: studentResult.rows[0],
                score,
                level,
                message,
                total,
                known,
                revision,
                notStarted: Math.max(total - attempted, 0),
                masteryPercentage,
                coveragePercentage,
                pyqTotal,
                pyqKnown,
                pyqPercentage,
                dailyTotal,
                dailyCompleted,
                dailyPercentage,
                dailyCompletedAt
            });
        } catch (error) {
            console.error("PASS Readiness Error:", error);
            res.status(500).json({
                success: false,
                error: "Unable to calculate PASS readiness"
            });
        }
    }
);


// ================================================
// ADMIN - ADD NEW QUESTION
// ================================================

app.post(
    "/api/admin/questions",
    async (req, res) => {

        try {

            const {

                chapter_id,

                question_text,

                marks,

                hint,

                easy_answer,

                keywords,

                question_type,

                difficulty,

                pyq_year,

                question_paper_id

            } = req.body;


            // ====================================
            // VALIDATION
            // ====================================

            if (!chapter_id) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Chapter is required"

                });

            }


            if (
                !question_text ||
                question_text.trim() === ""
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Question is required"

                });

            }


            // ====================================
            // INSERT QUESTION
            // ====================================

            const result =
                await pool.query(

                    `INSERT INTO questions
                    (
                        chapter_id,
                        question_text,
                        marks,
                        hint,
                        easy_answer,
                        keywords,
                        question_type,
                        difficulty,
                        pyq_year,
                        question_paper_id,
                        is_active
                    )

                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10,
                        TRUE
                    )

                    RETURNING *`,

                    [

                        chapter_id,

                        question_text.trim(),

                        Number(marks) || 1,

                        hint || null,

                        easy_answer || null,

                        keywords || null,

                        question_type ||
                            "Important",

                        difficulty ||
                            "Easy",

                        pyq_year
                            ? Number(pyq_year)
                            : null,

                        question_paper_id
                            ? Number(question_paper_id)
                            : null

                    ]

                );


            // ====================================
            // SUCCESS
            // ====================================

            res.json({

                success: true,

                message:
                    "Question added successfully",

                question:
                    result.rows[0]

            });


        } catch (error) {

            console.error(
                "Admin Add Question Error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    "Unable to add question"

            });

        }

    }
);


// ================================================
// ADMIN - QUESTION BANK MANAGEMENT
// ================================================

// GET ALL QUESTIONS FOR ADMIN
app.get("/api/admin/questions", async (req, res) => {
    try {
        const {
            subject_id,
            chapter_id,
            status = "all",
            search = ""
        } = req.query;

        const conditions = [];
        const values = [];
        let n = 1;

        if (subject_id) {
            conditions.push(`c.subject_id = $${n++}`);
            values.push(Number(subject_id));
        }

        if (chapter_id) {
            conditions.push(`q.chapter_id = $${n++}`);
            values.push(Number(chapter_id));
        }

        if (status === "active") {
            conditions.push(`q.is_active = TRUE`);
        } else if (status === "inactive") {
            conditions.push(`q.is_active = FALSE`);
        }

        if (search.trim()) {
            conditions.push(`q.question_text ILIKE $${n++}`);
            values.push(`%${search.trim()}%`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const result = await pool.query(
            `SELECT
                q.id,
                q.chapter_id,
                q.question_text,
                q.marks,
                q.hint,
                q.easy_answer,
                q.keywords,
                q.question_type,
                q.difficulty,
                q.pyq_year,
                q.question_paper_id,
                q.is_active,
                q.created_at,
                c.chapter_number,
                c.chapter_name,
                s.id AS subject_id,
                s.name AS subject_name,
                qp.exam_year,
                qp.exam_month,
                qp.paper_type
             FROM questions q
             JOIN chapters c ON q.chapter_id = c.id
             JOIN subjects s ON c.subject_id = s.id
             LEFT JOIN question_papers qp ON q.question_paper_id = qp.id
             ${whereClause}
             ORDER BY q.id DESC`,
            values
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Admin Questions Error:", error);
        res.status(500).json({
            error: "Unable to load admin questions"
        });
    }
});

// CHAPTER-WISE QUESTION BANK SUMMARY
app.get("/api/admin/chapter-question-summary", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id AS chapter_id,
                c.chapter_number,
                c.chapter_name,
                s.id AS subject_id,
                s.name AS subject_name,
                COUNT(q.id)::int AS total_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE)::int AS active_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = FALSE)::int AS inactive_questions,
                COUNT(q.id) FILTER (WHERE LOWER(COALESCE(q.difficulty, '')) = 'easy')::int AS easy_questions,
                COUNT(q.id) FILTER (WHERE LOWER(COALESCE(q.difficulty, '')) = 'medium')::int AS medium_questions,
                COUNT(q.id) FILTER (WHERE LOWER(COALESCE(q.difficulty, '')) = 'hard')::int AS hard_questions,
                COUNT(q.id) FILTER (WHERE q.question_paper_id IS NOT NULL)::int AS pyq_questions
            FROM chapters c
            JOIN subjects s ON c.subject_id = s.id
            LEFT JOIN questions q ON q.chapter_id = c.id
            WHERE c.is_active = TRUE AND s.is_active = TRUE
            GROUP BY c.id, c.chapter_number, c.chapter_name, s.id, s.name
            ORDER BY s.id, c.chapter_number, c.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Chapter Question Summary Error:", error);
        res.status(500).json({ error: "Unable to load chapter question summary" });
    }
});

// STAGE 10 STEP 7 - SUBJECT-WISE CONTENT PROGRESS
app.get("/api/admin/content-progress", async (req, res) => {
    try {
        const TARGET = 20;
        const result = await pool.query(`
            SELECT
                s.id AS subject_id,
                s.name AS subject_name,
                COUNT(DISTINCT c.id)::int AS total_chapters,
                COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = TRUE)::int AS active_chapters,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE)::int AS active_questions,
                COUNT(DISTINCT c.id) FILTER (
                    WHERE c.is_active = TRUE
                    AND (
                        SELECT COUNT(*)
                        FROM questions q2
                        WHERE q2.chapter_id = c.id AND q2.is_active = TRUE
                    ) >= $1
                )::int AS ready_chapters
            FROM subjects s
            LEFT JOIN chapters c ON c.subject_id = s.id
            LEFT JOIN questions q ON q.chapter_id = c.id
            WHERE s.is_active = TRUE
            GROUP BY s.id, s.name
            ORDER BY s.id
        `, [TARGET]);

        const rows = result.rows.map(r => {
            const chapters = Number(r.active_chapters || 0);
            const activeQuestions = Number(r.active_questions || 0);
            const targetQuestions = chapters * TARGET;
            const readyChapters = Number(r.ready_chapters || 0);
            const chapterProgress = chapters > 0
                ? Math.round((readyChapters / chapters) * 100)
                : 0;
            const questionProgress = targetQuestions > 0
                ? Math.min(100, Math.round((activeQuestions / targetQuestions) * 100))
                : 0;

            return {
                ...r,
                target_questions: targetQuestions,
                question_gap: Math.max(targetQuestions - activeQuestions, 0),
                ready_chapters: readyChapters,
                chapter_progress: chapterProgress,
                question_progress: questionProgress
            };
        });

        const totalChapters = rows.reduce((sum, r) => sum + Number(r.active_chapters || 0), 0);
        const totalQuestions = rows.reduce((sum, r) => sum + Number(r.active_questions || 0), 0);
        const totalTarget = rows.reduce((sum, r) => sum + Number(r.target_questions || 0), 0);
        const totalReady = rows.reduce((sum, r) => sum + Number(r.ready_chapters || 0), 0);

        res.json({
            success: true,
            targetPerChapter: TARGET,
            summary: {
                subjects: rows.length,
                activeChapters: totalChapters,
                activeQuestions: totalQuestions,
                targetQuestions: totalTarget,
                questionGap: Math.max(totalTarget - totalQuestions, 0),
                readyChapters: totalReady,
                chapterProgress: totalChapters > 0 ? Math.round((totalReady / totalChapters) * 100) : 0,
                questionProgress: totalTarget > 0 ? Math.min(100, Math.round((totalQuestions / totalTarget) * 100)) : 0
            },
            rows
        });
    } catch (error) {
        console.error("Content Progress Error:", error);
        res.status(500).json({ success: false, error: "Unable to load subject-wise content progress" });
    }
});

// STAGE 10 STEP 5 - QUESTION BANK HEALTH / CONTENT PLAN
app.get("/api/admin/question-bank-health", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id AS chapter_id, c.chapter_number, c.chapter_name,
                s.id AS subject_id, s.name AS subject_name,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE)::int AS active_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND LOWER(COALESCE(q.difficulty,'')) = 'easy')::int AS easy_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND LOWER(COALESCE(q.difficulty,'')) = 'medium')::int AS medium_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND LOWER(COALESCE(q.difficulty,'')) = 'hard')::int AS hard_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND q.question_paper_id IS NOT NULL)::int AS pyq_questions
            FROM chapters c
            JOIN subjects s ON s.id = c.subject_id
            LEFT JOIN questions q ON q.chapter_id = c.id
            WHERE c.is_active = TRUE AND s.is_active = TRUE
            GROUP BY c.id, c.chapter_number, c.chapter_name, s.id, s.name
            ORDER BY s.id, c.chapter_number, c.id
        `);
        const TARGET = 20;
        const rows = result.rows.map(r => {
            const total = Number(r.active_questions || 0);
            return {
                ...r,
                target_questions: TARGET,
                deficit: Math.max(TARGET - total, 0),
                status: total >= TARGET ? "Ready" : (total >= 10 ? "Growing" : "Needs Content")
            };
        });
        res.json({ targetPerChapter: TARGET, rows });
    } catch (error) {
        console.error("Question Bank Health Error:", error);
        res.status(500).json({ error: "Unable to load question bank health" });
    }
});

// ================================================
// STAGE 10 - ONE CLICK ENGLISH 24 CHAPTER IMPORT
// ================================================
function parseCSVLineOneClick(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            values.push(current); current = "";
        } else current += ch;
    }
    values.push(current);
    return values;
}

function readEnglish24Pack() {
    const dataDir = path.join(__dirname, "data", "english_all_24");
    const files = fs.readdirSync(dataDir)
        .filter(f => /^\d+_\d+_.*\.csv$/i.test(f))
        .sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
    const all = [];
    for (const file of files) {
        const text = fs.readFileSync(path.join(dataDir, file), "utf8").replace(/^\uFEFF/, "");
        const lines = text.split(/\r?\n/).filter(x => x.trim() !== "");
        if (lines.length < 2) continue;
        const headers = parseCSVLineOneClick(lines[0]).map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLineOneClick(lines[i]);
            const row = {};
            headers.forEach((h, idx) => row[h] = (vals[idx] || "").trim());
            row._file = file;
            row._row = i + 1;
            all.push(row);
        }
    }
    return { files, rows: all };
}

app.get("/api/admin/english-all-24/preview", async (req, res) => {
    try {
        const pack = readEnglish24Pack();
        const chapters = {};
        pack.rows.forEach(r => {
            const key = `${r.subject_name}|${r.chapter_number}`;
            chapters[key] = (chapters[key] || 0) + 1;
        });
        res.json({success:true, fileCount:pack.files.length, questionCount:pack.rows.length, chapters});
    } catch (error) {
        console.error("English chapter-specific Preview Error:", error);
        res.status(500).json({success:false,error:"Unable to read bundled chapter-specific English pack"});
    }
});

app.post("/api/admin/english-all-24/import", async (req, res) => {
    const client = await pool.connect();
    try {
        const pack = readEnglish24Pack();
        if (!pack.rows.length) return res.status(400).json({success:false,error:"Bundled English question pack is empty"});
        await client.query("BEGIN");
        let imported = 0, skipped = 0;
        const chapterStats = {};
        for (const row of pack.rows) {
            const subjectName = String(row.subject_name || '').trim();
            const chapterNumber = String(row.chapter_number || '').trim();
            const questionText = String(row.question_text || '').trim();
            const key = `${subjectName}|${chapterNumber}`;
            if (!subjectName || !chapterNumber || !questionText) { skipped++; continue; }
            const ch = await client.query(`SELECT c.id, c.chapter_name FROM chapters c JOIN subjects s ON s.id=c.subject_id WHERE LOWER(TRIM(s.name))=LOWER(TRIM($1)) AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`, [subjectName, chapterNumber]);
            if (!ch.rows.length) { skipped++; continue; }
            const exists = await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`, [ch.rows[0].id, questionText]);
            if (exists.rows.length) { skipped++; chapterStats[key] = chapterStats[key] || {imported:0,skipped:0}; chapterStats[key].skipped++; continue; }
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`, [ch.rows[0].id,questionText,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Important').trim()||'Important',String(row.difficulty||'Easy').trim()||'Easy',row.pyq_year?Number(row.pyq_year):null,row.question_paper_id?Number(row.question_paper_id):null]);
            imported++; chapterStats[key] = chapterStats[key] || {imported:0,skipped:0}; chapterStats[key].imported++;
        }
        await client.query("COMMIT");
        res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("English chapter-specific Import Error:", error);
        res.status(500).json({success:false,error:"Unable to import chapter-specific English questions"});
    } finally { client.release(); }
});


// STAGE 10 STEP 12 - HINDI LOKBHARATI ONE-CLICK IMPORT
function readHindi22Pack() {
    const dataDir = path.join(__dirname, "data", "hindi_lokbharati_22");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir)
        .filter(f => /^Hindi_Chapter_\d+\.csv$/i.test(f))
        .sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
    const all = [];
    for (const file of files) {
        const text = fs.readFileSync(path.join(dataDir, file), "utf8").replace(/^\uFEFF/, "");
        const lines = text.split(/\r?\n/).filter(x => x.trim() !== "");
        if (lines.length < 2) continue;
        const headers = parseCSVLineOneClick(lines[0]).map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLineOneClick(lines[i]);
            const row = {};
            headers.forEach((h, idx) => row[h] = (vals[idx] || "").trim());
            row._file = file; row._row = i + 1;
            all.push(row);
        }
    }
    return { files, rows: all };
}

app.get("/api/admin/hindi-lokbharati/preview", async (req, res) => {
    try {
        const pack = readHindi22Pack();
        const chapters = {};
        pack.rows.forEach(r => {
            const key = `${r.subject_name}|${r.chapter_number}`;
            chapters[key] = (chapters[key] || 0) + 1;
        });
        res.json({success:true, fileCount:pack.files.length, questionCount:pack.rows.length, chapters});
    } catch (error) {
        console.error("Hindi Preview Error:", error);
        res.status(500).json({success:false,error:"Unable to read bundled Hindi question pack"});
    }
});

app.post("/api/admin/hindi-lokbharati/import", async (req, res) => {
    const client = await pool.connect();
    try {
        const pack = readHindi22Pack();
        if (!pack.rows.length) return res.status(400).json({success:false,error:"Bundled Hindi question pack is empty"});
        await client.query("BEGIN");
        let imported = 0, skipped = 0;
        const chapterStats = {};
        for (const row of pack.rows) {
            const subjectName = String(row.subject_name || '').trim();
            const chapterNumber = String(row.chapter_number || '').trim();
            const questionText = String(row.question_text || '').trim();
            const key = `${subjectName}|${chapterNumber}`;
            if (!subjectName || !chapterNumber || !questionText) { skipped++; continue; }
            const ch = await client.query(`SELECT c.id, c.chapter_name FROM chapters c JOIN subjects s ON s.id=c.subject_id WHERE LOWER(TRIM(s.name))=LOWER(TRIM($1)) AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`, [subjectName, chapterNumber]);
            if (!ch.rows.length) { skipped++; chapterStats[key] = chapterStats[key] || {imported:0,skipped:0}; chapterStats[key].skipped++; continue; }
            const exists = await client.query(`SELECT id, is_active FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`, [ch.rows[0].id, questionText]);
            if (exists.rows.length) { skipped++; chapterStats[key] = chapterStats[key] || {imported:0,skipped:0}; chapterStats[key].skipped++; continue; }
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`, [ch.rows[0].id,questionText,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Important').trim()||'Important',String(row.difficulty||'Easy').trim()||'Easy',row.pyq_year?Number(row.pyq_year):null,row.question_paper_id?Number(row.question_paper_id):null]);
            imported++; chapterStats[key] = chapterStats[key] || {imported:0,skipped:0}; chapterStats[key].imported++;
        }
        await client.query("COMMIT");
        res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Hindi Import Error:", error);
        res.status(500).json({success:false,error:"Unable to import Hindi Lokbharati questions"});
    } finally { client.release(); }
});


// STAGE 10 STEP 13 - HINDI GRAMMAR & RACHNA ONE-CLICK IMPORT
function readHindiGrammar10Pack() {
    const dataDir = path.join(__dirname, "data", "hindi_grammar_rachna_10");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir)
        .filter(f => /^Hindi_Grammar_\d+_\d+\.csv$/i.test(f))
        .sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
    const all = [];
    for (const file of files) {
        const text = fs.readFileSync(path.join(dataDir, file), "utf8").replace(/^\uFEFF/, "");
        const lines = text.split(/\r?\n/).filter(x => x.trim() !== "");
        if (lines.length < 2) continue;
        const headers = parseCSVLineOneClick(lines[0]).map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLineOneClick(lines[i]); const row = {};
            headers.forEach((h, idx) => row[h] = (vals[idx] || "").trim());
            row._file = file; row._row = i + 1; all.push(row);
        }
    }
    return { files, rows: all };
}

app.get("/api/admin/hindi-grammar/preview", async (req, res) => {
    try {
        const pack = readHindiGrammar10Pack(); const chapters = {};
        pack.rows.forEach(r => { const key = `${r.subject_name}|${r.chapter_number}`; chapters[key] = (chapters[key] || 0) + 1; });
        res.json({success:true, fileCount:pack.files.length, questionCount:pack.rows.length, chapters});
    } catch (error) { console.error("Hindi Grammar Preview Error:", error); res.status(500).json({success:false,error:"Unable to read Hindi Grammar & Rachna pack"}); }
});

app.post("/api/admin/hindi-grammar/import", async (req, res) => {
    const client = await pool.connect();
    try {
        const pack = readHindiGrammar10Pack();
        if (!pack.rows.length) return res.status(400).json({success:false,error:"Hindi Grammar & Rachna pack is empty"});
        await client.query("BEGIN");
        const subject = await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Hindi')) LIMIT 1`);
        if (!subject.rows.length) throw new Error("Hindi subject not found");
        let imported=0, skipped=0; const chapterStats={};
        const chapterNames={"23.1":"शब्द-भेद","23.2":"संधि","23.3":"समास","23.4":"अलंकार","23.5":"वाक्य-शुद्धि","23.6":"पर्यायवाची-विलोम","23.7":"मुहावरे-लोकोक्तियाँ","23.8":"काल-वाच्य","23.9":"पत्र-अनुच्छेद","23.10":"संवाद-विज्ञापन"};
        for (const [num,name] of Object.entries(chapterNames)) {
            await client.query(`INSERT INTO chapters (subject_id, chapter_number, chapter_name, is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);
        }
        for (const row of pack.rows) {
            const subjectName=String(row.subject_name||'').trim(), chapterNumber=String(row.chapter_number||'').trim(), questionText=String(row.question_text||'').trim();
            const key=`${subjectName}|${chapterNumber}`;
            if (!questionText || !chapterNumber) { skipped++; continue; }
            const ch=await client.query(`SELECT c.id FROM chapters c JOIN subjects s ON s.id=c.subject_id WHERE s.id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,chapterNumber]);
            if (!ch.rows.length) { skipped++; continue; }
            const exists=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,questionText]);
            if (exists.rows.length) { skipped++; chapterStats[key]=chapterStats[key]||{imported:0,skipped:0}; chapterStats[key].skipped++; continue; }
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,questionText,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Important').trim()||'Important',String(row.difficulty||'Easy').trim()||'Easy',null,null]);
            imported++; chapterStats[key]=chapterStats[key]||{imported:0,skipped:0}; chapterStats[key].imported++;
        }
        await client.query("COMMIT");
        res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    } catch(error) { await client.query("ROLLBACK"); console.error("Hindi Grammar Import Error:",error); res.status(500).json({success:false,error:"Unable to import Hindi Grammar & Rachna questions"}); }
    finally { client.release(); }
});


// STAGE 10 STEP 11 - MARATHI KUMARBHARATI ONE-CLICK IMPORT
function readMarathi20Pack() {
    const dataDir = path.join(__dirname, "data", "marathi_kumarbharati_20");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir)
        .filter(f => /^Marathi_Chapter_\d+\.csv$/i.test(f))
        .sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
    const all = [];
    for (const file of files) {
        const text = fs.readFileSync(path.join(dataDir, file), "utf8").replace(/^\uFEFF/, "");
        const lines = text.split(/\r?\n/).filter(x => x.trim() !== "");
        if (lines.length < 2) continue;
        const headers = parseCSVLineOneClick(lines[0]).map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
            const vals = parseCSVLineOneClick(lines[i]);
            const row = {};
            headers.forEach((h, idx) => row[h] = (vals[idx] || "").trim());
            row._file = file; row._row = i + 1;
            all.push(row);
        }
    }
    return { files, rows: all };
}

app.get("/api/admin/marathi-kumarbharati/preview", async (req, res) => {
    try {
        const pack = readMarathi20Pack();
        const chapters = {};
        pack.rows.forEach(r => {
            const key = `${r.subject_name}|${r.chapter_number}`;
            chapters[key] = (chapters[key] || 0) + 1;
        });
        res.json({success:true, fileCount:pack.files.length, questionCount:pack.rows.length, chapters});
    } catch (error) {
        console.error("Marathi Preview Error:", error);
        res.status(500).json({success:false,error:"Unable to read bundled Marathi question pack"});
    }
});

app.post("/api/admin/marathi-kumarbharati/import", async (req, res) => {
    const client = await pool.connect();
    try {
        const pack = readMarathi20Pack();
        if (!pack.rows.length) return res.status(400).json({success:false,error:"Bundled Marathi question pack is empty"});
        await client.query("BEGIN");
        let imported = 0, skipped = 0;
        const chapterStats = {};
        for (const row of pack.rows) {
            const subjectName = String(row.subject_name || '').trim();
            const chapterNumber = String(row.chapter_number || '').trim();
            const questionText = String(row.question_text || '').trim();
            const key = `${subjectName}|${chapterNumber}`;
            if (!subjectName || !chapterNumber || !questionText) { skipped++; continue; }
            const ch = await client.query(`SELECT c.id, c.chapter_name FROM chapters c JOIN subjects s ON s.id=c.subject_id WHERE LOWER(TRIM(s.name))=LOWER(TRIM($1)) AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`, [subjectName, chapterNumber]);
            if (!ch.rows.length) { skipped++; chapterStats[key] = chapterStats[key] || {imported:0,skipped:0}; chapterStats[key].skipped++; continue; }
            const exists = await client.query(`SELECT id, is_active FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`, [ch.rows[0].id, questionText]);
            if (exists.rows.length) { skipped++; chapterStats[key] = chapterStats[key] || {imported:0,skipped:0}; chapterStats[key].skipped++; continue; }
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`, [ch.rows[0].id,questionText,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Important').trim()||'Important',String(row.difficulty||'Easy').trim()||'Easy',row.pyq_year?Number(row.pyq_year):null,row.question_paper_id?Number(row.question_paper_id):null]);
            imported++; chapterStats[key] = chapterStats[key] || {imported:0,skipped:0}; chapterStats[key].imported++;
        }
        await client.query("COMMIT");
        res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Marathi Import Error:", error);
        res.status(500).json({success:false,error:"Unable to import Marathi Kumarbharati questions"});
    } finally { client.release(); }
});

// UPDATE QUESTION
// ================================================
// STAGE 10 STEP 4 - BULK QUESTION IMPORT
// ================================================
app.post("/api/admin/questions/bulk", async (req, res) => {
    const client = await pool.connect();
    try {
        const rows = Array.isArray(req.body?.questions) ? req.body.questions : [];
        if (!rows.length) {
            return res.status(400).json({ success: false, error: "No questions supplied" });
        }
        if (rows.length > 500) {
            return res.status(400).json({ success: false, error: "Maximum 500 questions per import" });
        }

        await client.query("BEGIN");
        const results = [];
        let imported = 0;
        let skipped = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i] || {};
            const rowNumber = i + 2;
            const subjectName = String(row.subject_name || '').trim();
            const chapterNumber = String(row.chapter_number || '').trim();
            const questionText = String(row.question_text || '').trim();
            if (!subjectName || !chapterNumber || !questionText) {
                skipped++;
                results.push({ row: rowNumber, status: 'skipped', reason: 'subject_name, chapter_number and question_text are required' });
                continue;
            }

            const chapterResult = await client.query(
                `SELECT c.id, c.chapter_name, s.id AS subject_id
                 FROM chapters c
                 JOIN subjects s ON s.id = c.subject_id
                 WHERE LOWER(TRIM(s.name)) = LOWER(TRIM($1))
                   AND CAST(c.chapter_number AS TEXT) = $2
                   AND c.is_active = TRUE
                 LIMIT 1`,
                [subjectName, chapterNumber]
            );
            if (!chapterResult.rows.length) {
                skipped++;
                results.push({ row: rowNumber, status: 'skipped', reason: `Chapter not found: ${subjectName} / ${chapterNumber}` });
                continue;
            }

            const chapterId = chapterResult.rows[0].id;
            const questionPaperId = row.question_paper_id ? Number(row.question_paper_id) : null;
            if (questionPaperId) {
                const paperCheck = await client.query('SELECT id FROM question_papers WHERE id = $1 AND is_active = TRUE', [questionPaperId]);
                if (!paperCheck.rows.length) {
                    skipped++;
                    results.push({ row: rowNumber, status: 'skipped', reason: `PYQ paper not found or inactive: ${questionPaperId}` });
                    continue;
                }
            }

            const result = await client.query(
                `INSERT INTO questions
                 (chapter_id, question_text, marks, hint, easy_answer, keywords, question_type, difficulty, pyq_year, question_paper_id, is_active)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
                 RETURNING id`,
                [
                    chapterId,
                    questionText,
                    Number(row.marks) || 1,
                    String(row.hint || '').trim() || null,
                    String(row.easy_answer || '').trim() || null,
                    String(row.keywords || '').trim() || null,
                    String(row.question_type || 'Important').trim() || 'Important',
                    String(row.difficulty || 'Easy').trim() || 'Easy',
                    row.pyq_year ? Number(row.pyq_year) : null,
                    questionPaperId
                ]
            );
            imported++;
            results.push({ row: rowNumber, status: 'imported', question_id: result.rows[0].id, chapter_name: chapterResult.rows[0].chapter_name });
        }

        await client.query("COMMIT");
        res.json({ success: true, imported, skipped, results });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Bulk Question Import Error:", error);
        res.status(500).json({ success: false, error: "Unable to import questions" });
    } finally {
        client.release();
    }
});


app.put("/api/admin/questions/:questionId", async (req, res) => {
    try {
        const questionId = Number(req.params.questionId);
        const {
            chapter_id,
            question_text,
            marks,
            hint,
            easy_answer,
            keywords,
            question_type,
            difficulty,
            pyq_year,
            question_paper_id
        } = req.body;

        if (!questionId) {
            return res.status(400).json({
                success: false,
                error: "Invalid question ID"
            });
        }

        if (!chapter_id) {
            return res.status(400).json({
                success: false,
                error: "Chapter is required"
            });
        }

        if (!question_text || question_text.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Question is required"
            });
        }

        const result = await pool.query(
            `UPDATE questions
             SET
                chapter_id = $1,
                question_text = $2,
                marks = $3,
                hint = $4,
                easy_answer = $5,
                keywords = $6,
                question_type = $7,
                difficulty = $8,
                pyq_year = $9,
                question_paper_id = $10
             WHERE id = $11
             RETURNING *`,
            [
                Number(chapter_id),
                question_text.trim(),
                Number(marks) || 1,
                hint || null,
                easy_answer || null,
                keywords || null,
                question_type || "Important",
                difficulty || "Easy",
                pyq_year ? Number(pyq_year) : null,
                question_paper_id ? Number(question_paper_id) : null,
                questionId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Question not found"
            });
        }

        res.json({
            success: true,
            message: "Question updated successfully",
            question: result.rows[0]
        });
    } catch (error) {
        console.error("Admin Update Question Error:", error);
        res.status(500).json({
            success: false,
            error: "Unable to update question"
        });
    }
});

// ACTIVATE / DEACTIVATE QUESTION
app.patch("/api/admin/questions/:questionId/status", async (req, res) => {
    try {
        const questionId = Number(req.params.questionId);
        const { is_active } = req.body;

        if (!questionId || typeof is_active !== "boolean") {
            return res.status(400).json({
                success: false,
                error: "Question ID and status are required"
            });
        }

        const result = await pool.query(
            `UPDATE questions
             SET is_active = $1
             WHERE id = $2
             RETURNING id, is_active`,
            [is_active, questionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Question not found"
            });
        }

        res.json({
            success: true,
            message: is_active
                ? "Question activated successfully"
                : "Question deactivated successfully",
            question: result.rows[0]
        });
    } catch (error) {
        console.error("Admin Question Status Error:", error);
        res.status(500).json({
            success: false,
            error: "Unable to change question status"
        });
    }
});


// ================================================
// STAGE 8 - DAILY SMART PASS QUESTIONS
// ================================================

app.get(
    "/api/students/:studentId/daily-questions",
    async (req, res) => {

        try {

            const studentId = Number(req.params.studentId);
            const requestedLimit = Number(req.query.limit) || 10;
            const limit = Math.min(Math.max(requestedLimit, 1), 20);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid student ID"
                });
            }

            const result = await pool.query(
                `SELECT
                    q.id,
                    q.chapter_id,
                    q.question_text,
                    q.marks,
                    q.hint,
                    q.easy_answer,
                    q.keywords,
                    q.question_type,
                    q.difficulty,
                    q.pyq_year,
                    c.chapter_number,
                    c.chapter_name,
                    COALESCE(p.status, 'not_started') AS student_status,
                    CASE
                        WHEN p.status = 'revision' THEN 1
                        WHEN p.status IS NULL THEN 2
                        WHEN p.status <> 'known' THEN 3
                        WHEN q.question_type = 'PYQ' THEN 4
                        WHEN q.question_type = 'Important' THEN 5
                        ELSE 6
                    END AS smart_priority
                 FROM questions q
                 JOIN chapters c
                    ON q.chapter_id = c.id
                 LEFT JOIN student_question_progress p
                    ON p.question_id = q.id
                    AND p.student_id = $1
                 WHERE q.is_active = TRUE
                 ORDER BY
                    smart_priority,
                    CASE WHEN q.question_type = 'PYQ' THEN 1 ELSE 2 END,
                    CASE WHEN q.difficulty = 'Easy' THEN 1
                         WHEN q.difficulty = 'Medium' THEN 2
                         ELSE 3 END,
                    md5(q.id::text || '-' || $1::text || '-' || CURRENT_DATE::text)
                 LIMIT $2`,
                [studentId, limit]
            );

            res.json({
                success: true,
                date: new Date().toISOString().slice(0, 10),
                limit,
                count: result.rows.length,
                questions: result.rows
            });

        } catch (error) {

            console.error(
                "Daily Smart Questions Error:",
                error
            );

            res.status(500).json({
                success: false,
                error: "Unable to load daily questions"
            });
        }
    }
);

// ================================================
// STAGE 8 STEP 5 — SMART REVISION
// ================================================

app.get(
    "/api/students/:studentId/smart-revision",
    async (req, res) => {
        try {
            const studentId = Number(req.params.studentId);
            const requestedLimit = Number(req.query.limit) || 10;
            const limit = Math.min(Math.max(requestedLimit, 1), 20);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid student ID"
                });
            }

            const studentResult = await pool.query(
                `SELECT id, name FROM students WHERE id = $1 LIMIT 1`,
                [studentId]
            );

            if (studentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Student not found"
                });
            }

            const result = await pool.query(
                `SELECT
                    q.id,
                    q.chapter_id,
                    q.question_text,
                    q.marks,
                    q.hint,
                    q.easy_answer,
                    q.keywords,
                    q.question_type,
                    q.difficulty,
                    q.pyq_year,
                    q.question_paper_id,
                    c.chapter_number,
                    c.chapter_name,
                    s.name AS subject_name,
                    COALESCE(p.status, 'not_started') AS student_status,
                    CASE
                        WHEN p.status = 'revision' THEN 1
                        WHEN p.status = 'known' THEN 5
                        WHEN p.status IS NULL THEN 4
                        ELSE 2
                    END AS revision_priority,
                    CASE
                        WHEN q.question_type = 'PYQ' OR q.pyq_year IS NOT NULL THEN 1
                        WHEN q.question_type = 'Important' THEN 2
                        ELSE 3
                    END AS content_priority
                 FROM questions q
                 JOIN chapters c ON q.chapter_id = c.id
                 JOIN subjects s ON c.subject_id = s.id
                 LEFT JOIN student_question_progress p
                    ON p.question_id = q.id
                   AND p.student_id = $1
                 WHERE q.is_active = TRUE
                   AND (p.status IS NULL OR p.status <> 'known')
                 ORDER BY
                    revision_priority,
                    content_priority,
                    CASE WHEN q.difficulty = 'Easy' THEN 1
                         WHEN q.difficulty = 'Medium' THEN 2
                         ELSE 3 END,
                    md5(q.id::text || '-' || $1::text || '-' || CURRENT_DATE::text)
                 LIMIT $2`,
                [studentId, limit]
            );

            const revisionCountResult = await pool.query(
                `SELECT COUNT(*)::int AS count
                 FROM student_question_progress
                 WHERE student_id = $1
                   AND status = 'revision'`,
                [studentId]
            );

            res.json({
                success: true,
                count: result.rows.length,
                revisionCount: Number(revisionCountResult.rows[0].count) || 0,
                questions: result.rows
            });
        } catch (error) {
            console.error("Smart Revision Error:", error);
            res.status(500).json({
                success: false,
                error: "Unable to load smart revision questions"
            });
        }
    }
);

// ================================================
// GET ALL QUESTION PAPERS
// ================================================

app.get(
    "/api/question-papers",
    async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT
                    qp.id,
                    qp.subject_id,
                    qp.exam_year,
                    qp.exam_month,
                    qp.paper_type,
                    qp.source_name,
                    qp.source_url,
                    qp.has_solution,
                    qp.is_active,
                    s.name AS subject_name,
                    COUNT(q.id)::INTEGER AS question_count
                 FROM question_papers qp
                 JOIN subjects s
                    ON qp.subject_id = s.id
                 LEFT JOIN questions q
                    ON q.question_paper_id = qp.id
                    AND q.is_active = TRUE
                 WHERE qp.is_active = TRUE
                 GROUP BY
                    qp.id,
                    qp.subject_id,
                    qp.exam_year,
                    qp.exam_month,
                    qp.paper_type,
                    qp.source_name,
                    qp.source_url,
                    qp.has_solution,
                    qp.is_active,
                    s.name
                 ORDER BY
                    s.name,
                    qp.exam_year DESC,
                    qp.exam_month`
            );

            res.json(result.rows);

        } catch (error) {
            console.error("Question Papers Error:", error);

            res.status(500).json({
                error: "Unable to load question papers"
            });
        }
    }
);


// ================================================
// GET QUESTION PAPERS BY SUBJECT
// ================================================

app.get(
    "/api/subjects/:subjectId/question-papers",
    async (req, res) => {

        try {

            const subjectId =
                req.params.subjectId;


            const result =
                await pool.query(

                    `SELECT *

                     FROM question_papers

                     WHERE subject_id = $1
                     AND is_active = TRUE

                     ORDER BY
                        exam_year DESC,
                        exam_month`,

                    [subjectId]

                );


            res.json(
                result.rows
            );


        } catch (error) {

            console.error(
                "Subject Question Papers Error:",
                error
            );


            res.status(500).json({

                error:
                    "Unable to load question papers"

            });

        }

    }
);


// ================================================
// STAGE 9 STEP 1 — STUDENT DASHBOARD
// ================================================

app.get(
    "/api/students/:studentId/dashboard",
    async (req, res) => {
        try {
            const studentId = Number(req.params.studentId);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid student ID"
                });
            }

            const studentResult = await pool.query(
                `SELECT id, name, mobile_number
                 FROM students
                 WHERE id = $1
                 LIMIT 1`,
                [studentId]
            );

            if (studentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Student not found"
                });
            }

            const overallResult = await pool.query(
                `SELECT
                    COUNT(q.id)::INTEGER AS total_questions,
                    COUNT(q.id) FILTER (WHERE sp.status = 'known')::INTEGER AS known,
                    COUNT(q.id) FILTER (WHERE sp.status = 'revision')::INTEGER AS revision,
                    COUNT(q.id) FILTER (WHERE sp.status IS NULL)::INTEGER AS not_started,
                    COUNT(q.id) FILTER (WHERE sp.status IS NOT NULL)::INTEGER AS attempted
                 FROM questions q
                 LEFT JOIN student_question_progress sp
                    ON sp.question_id = q.id
                   AND sp.student_id = $1
                 WHERE q.is_active = TRUE`,
                [studentId]
            );

            const subjectResult = await pool.query(
                `SELECT
                    s.id AS subject_id,
                    s.name AS subject_name,
                    COUNT(q.id)::INTEGER AS total_questions,
                    COUNT(q.id) FILTER (WHERE sp.status = 'known')::INTEGER AS known,
                    COUNT(q.id) FILTER (WHERE sp.status = 'revision')::INTEGER AS revision,
                    COUNT(q.id) FILTER (WHERE sp.status IS NULL)::INTEGER AS not_started
                 FROM subjects s
                 LEFT JOIN chapters c
                    ON c.subject_id = s.id
                   AND c.is_active = TRUE
                 LEFT JOIN questions q
                    ON q.chapter_id = c.id
                   AND q.is_active = TRUE
                 LEFT JOIN student_question_progress sp
                    ON sp.question_id = q.id
                   AND sp.student_id = $1
                 GROUP BY s.id, s.name
                 ORDER BY s.id`,
                [studentId]
            );

            const chapterResult = await pool.query(
                `SELECT
                    s.id AS subject_id,
                    s.name AS subject_name,
                    c.id AS chapter_id,
                    c.chapter_number,
                    c.chapter_name,
                    COUNT(q.id)::INTEGER AS total_questions,
                    COUNT(q.id) FILTER (WHERE sp.status = 'known')::INTEGER AS known,
                    COUNT(q.id) FILTER (WHERE sp.status = 'revision')::INTEGER AS revision,
                    COUNT(q.id) FILTER (WHERE sp.status IS NULL)::INTEGER AS not_started
                 FROM chapters c
                 JOIN subjects s ON s.id = c.subject_id
                 LEFT JOIN questions q
                    ON q.chapter_id = c.id
                   AND q.is_active = TRUE
                 LEFT JOIN student_question_progress sp
                    ON sp.question_id = q.id
                   AND sp.student_id = $1
                 WHERE c.is_active = TRUE
                 GROUP BY s.id, s.name, c.id, c.chapter_number, c.chapter_name
                 ORDER BY s.id, c.id`,
                [studentId]
            );

            const overall = overallResult.rows[0] || {};
            const total = Number(overall.total_questions) || 0;
            const known = Number(overall.known) || 0;
            const attempted = Number(overall.attempted) || 0;

            const subjectSummary = subjectResult.rows.map(row => {
                const subjectTotal = Number(row.total_questions) || 0;
                const subjectKnown = Number(row.known) || 0;
                return {
                    subjectId: Number(row.subject_id),
                    subjectName: row.subject_name,
                    total: subjectTotal,
                    known: subjectKnown,
                    revision: Number(row.revision) || 0,
                    notStarted: Number(row.not_started) || 0,
                    masteryPercentage: subjectTotal > 0
                        ? Math.round((subjectKnown / subjectTotal) * 100)
                        : 0,
                    coveragePercentage: subjectTotal > 0
                        ? Math.round(((subjectKnown + (Number(row.revision) || 0)) / subjectTotal) * 100)
                        : 0
                };
            });

            const chapterSummary = chapterResult.rows.map(row => {
                const chapterTotal = Number(row.total_questions) || 0;
                const chapterKnown = Number(row.known) || 0;
                return {
                    subjectId: Number(row.subject_id),
                    subjectName: row.subject_name,
                    chapterId: Number(row.chapter_id),
                    chapterNumber: row.chapter_number,
                    chapterName: row.chapter_name,
                    total: chapterTotal,
                    known: chapterKnown,
                    revision: Number(row.revision) || 0,
                    notStarted: Number(row.not_started) || 0,
                    masteryPercentage: chapterTotal > 0
                        ? Math.round((chapterKnown / chapterTotal) * 100)
                        : 0
                };
            });

            const weakSubjects = [...subjectSummary]
                .filter(item => item.total > 0)
                .sort((a, b) => a.masteryPercentage - b.masteryPercentage)
                .slice(0, 3);

            const weakChapters = [...chapterSummary]
                .filter(item => item.total > 0 && item.masteryPercentage < 100)
                .sort((a, b) => a.masteryPercentage - b.masteryPercentage)
                .slice(0, 5);

            res.json({
                success: true,
                student: studentResult.rows[0],
                overall: {
                    total,
                    known,
                    revision: Number(overall.revision) || 0,
                    notStarted: Number(overall.not_started) || 0,
                    attempted,
                    masteryPercentage: total > 0 ? Math.round((known / total) * 100) : 0,
                    coveragePercentage: total > 0 ? Math.round((attempted / total) * 100) : 0
                },
                subjectSummary,
                chapterSummary,
                weakSubjects,
                weakChapters
            });
        } catch (error) {
            console.error("Student Dashboard Error:", error);
            res.status(500).json({
                success: false,
                error: "Unable to load student dashboard"
            });
        }
    }
);

// ================================================
// STAGE 9 STEP 6 — STUDENT ACHIEVEMENTS / BADGES
// ================================================

app.get(
    "/api/students/:studentId/achievements",
    async (req, res) => {
        try {
            const studentId = Number(req.params.studentId);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid student ID"
                });
            }

            const studentCheck = await pool.query(
                `SELECT id, name FROM students WHERE id = $1 LIMIT 1`,
                [studentId]
            );

            if (studentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Student not found"
                });
            }

            const progressResult = await pool.query(
                `SELECT
                    COUNT(q.id)::INTEGER AS total_questions,
                    COUNT(q.id) FILTER (WHERE sp.status = 'known')::INTEGER AS known,
                    COUNT(q.id) FILTER (WHERE sp.status IS NOT NULL)::INTEGER AS attempted
                 FROM questions q
                 LEFT JOIN student_question_progress sp
                    ON sp.question_id = q.id
                   AND sp.student_id = $1
                 WHERE q.is_active = TRUE`,
                [studentId]
            );

            const streakResult = await pool.query(
                `SELECT COUNT(*)::INTEGER AS practice_days
                 FROM daily_practice_sessions
                 WHERE student_id = $1
                   AND completed_at IS NOT NULL
                   AND completed_questions >= total_questions
                   AND total_questions > 0`,
                [studentId]
            );

            const todayResult = await pool.query(
                `SELECT
                    COALESCE(MAX(completed_questions) FILTER (
                        WHERE practice_date = CURRENT_DATE
                    ), 0)::INTEGER AS today_completed,
                    COALESCE(MAX(total_questions) FILTER (
                        WHERE practice_date = CURRENT_DATE
                    ), 0)::INTEGER AS today_total
                 FROM daily_practice_sessions
                 WHERE student_id = $1`,
                [studentId]
            );

            const readinessResult = await pool.query(
                `SELECT
                    COUNT(q.id)::INTEGER AS total,
                    COUNT(q.id) FILTER (WHERE sp.status = 'known')::INTEGER AS known
                 FROM questions q
                 LEFT JOIN student_question_progress sp
                    ON sp.question_id = q.id
                   AND sp.student_id = $1
                 WHERE q.is_active = TRUE`,
                [studentId]
            );

            const row = progressResult.rows[0] || {};
            const total = Number(row.total_questions) || 0;
            const known = Number(row.known) || 0;
            const attempted = Number(row.attempted) || 0;
            const practiceDays = Number(streakResult.rows[0]?.practice_days) || 0;
            const todayCompleted = Number(todayResult.rows[0]?.today_completed) || 0;
            const todayTotal = Number(todayResult.rows[0]?.today_total) || 0;
            const masteryPercentage = total > 0 ? Math.round((known / total) * 100) : 0;
            const coveragePercentage = total > 0 ? Math.round((attempted / total) * 100) : 0;

            const badges = [
                {
                    id: "first-question",
                    icon: "🌱",
                    title: "First Step",
                    description: "पहिला Question successfully attempted",
                    unlocked: attempted >= 1
                },
                {
                    id: "five-known",
                    icon: "⭐",
                    title: "5 Questions Known",
                    description: "5 Questions confidently known",
                    unlocked: known >= 5
                },
                {
                    id: "ten-known",
                    icon: "🏅",
                    title: "10 Questions Mastered",
                    description: "10 Questions confidently known",
                    unlocked: known >= 10
                },
                {
                    id: "daily-goal",
                    icon: "🎯",
                    title: "Daily Goal",
                    description: "आजचे Daily Goal पूर्ण केले",
                    unlocked: todayTotal > 0 && todayCompleted >= todayTotal
                },
                {
                    id: "three-day-streak",
                    icon: "🔥",
                    title: "3 Day Streak",
                    description: "3 दिवस Daily Practice पूर्ण केली",
                    unlocked: practiceDays >= 3
                },
                {
                    id: "pass-ready",
                    icon: "🏆",
                    title: "PASS Ready",
                    description: "PASS Readiness score 80% किंवा अधिक",
                    unlocked: masteryPercentage >= 80 && coveragePercentage >= 80
                }
            ];

            res.json({
                success: true,
                student: studentCheck.rows[0],
                summary: {
                    total,
                    known,
                    attempted,
                    masteryPercentage,
                    coveragePercentage,
                    practiceDays,
                    todayCompleted,
                    todayTotal,
                    unlockedCount: badges.filter(b => b.unlocked).length,
                    totalBadges: badges.length
                },
                badges
            });
        } catch (error) {
            console.error("Student Achievements Error:", error);
            res.status(500).json({
                success: false,
                error: "Unable to load student achievements"
            });
        }
    }
);

// ================================================
// STAGE 9 STEP 4 — PROGRESS IMPROVEMENT / SNAPSHOTS
// ================================================

app.get(
    "/api/students/:studentId/progress-improvement",
    async (req, res) => {
        try {
            const studentId = Number(req.params.studentId);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid student ID"
                });
            }

            const studentCheck = await pool.query(
                `SELECT id, name FROM students WHERE id = $1 LIMIT 1`,
                [studentId]
            );

            if (studentCheck.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Student not found"
                });
            }

            const currentResult = await pool.query(
                `SELECT
                    COUNT(q.id)::INTEGER AS total_questions,
                    COUNT(q.id) FILTER (WHERE sp.status = 'known')::INTEGER AS known,
                    COUNT(q.id) FILTER (WHERE sp.status = 'revision')::INTEGER AS revision,
                    COUNT(q.id) FILTER (WHERE sp.status IS NOT NULL)::INTEGER AS attempted
                 FROM questions q
                 LEFT JOIN student_question_progress sp
                    ON sp.question_id = q.id
                   AND sp.student_id = $1
                 WHERE q.is_active = TRUE`,
                [studentId]
            );

            const currentRow = currentResult.rows[0] || {};
            const total = Number(currentRow.total_questions) || 0;
            const known = Number(currentRow.known) || 0;
            const revision = Number(currentRow.revision) || 0;
            const attempted = Number(currentRow.attempted) || 0;
            const current = {
                total,
                known,
                revision,
                attempted,
                masteryPercentage: total > 0 ? Math.round((known / total) * 100) : 0,
                coveragePercentage: total > 0 ? Math.round((attempted / total) * 100) : 0
            };

            await pool.query(
                `INSERT INTO student_progress_snapshots
                    (student_id, snapshot_date, total_questions, known, revision, attempted, mastery_percentage, coverage_percentage)
                 VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (student_id, snapshot_date) DO NOTHING`,
                [studentId, current.total, current.known, current.revision, current.attempted, current.masteryPercentage, current.coveragePercentage]
            );

            const historyResult = await pool.query(
                `SELECT snapshot_date, total_questions, known, revision, attempted, mastery_percentage, coverage_percentage
                 FROM student_progress_snapshots
                 WHERE student_id = $1
                 ORDER BY snapshot_date ASC`,
                [studentId]
            );

            const history = historyResult.rows.map(row => ({
                date: row.snapshot_date,
                total: Number(row.total_questions) || 0,
                known: Number(row.known) || 0,
                revision: Number(row.revision) || 0,
                attempted: Number(row.attempted) || 0,
                masteryPercentage: Number(row.mastery_percentage) || 0,
                coveragePercentage: Number(row.coverage_percentage) || 0
            }));

            const baseline = history[0] || current;
            const firstDate = history.length > 0 ? history[0].date : null;
            const improvement = {
                masteryPoints: current.masteryPercentage - baseline.masteryPercentage,
                coveragePoints: current.coveragePercentage - baseline.coveragePercentage,
                knownQuestions: current.known - baseline.known,
                studiedQuestions: current.attempted - baseline.attempted
            };

            res.json({
                success: true,
                baselineDate: firstDate,
                baseline,
                current,
                improvement,
                history: history.slice(-7)
            });
        } catch (error) {
            console.error("Progress Improvement Error:", error);
            res.status(500).json({
                success: false,
                error: "Unable to load progress improvement"
            });
        }
    }
);


// ================================================
// STAGE 10 STEP 6 — STARTER QUESTION PACK
// ================================================

const ENGLISH_11_STARTER_PACK = [
    {q:"Who is the poet of 'Where the Mind is Without Fear'?",m:1,h:"Recall the poet's name.",a:"Rabindranath Tagore",k:"poet,Tagore",t:"Important",d:"Easy"},
    {q:"What kind of nation does the poet dream of in the poem?",m:2,h:"Think about the qualities of an ideal nation.",a:"He dreams of a free, fearless, truthful and progressive nation.",k:"ideal nation,freedom,truth",t:"Important",d:"Easy"},
    {q:"What does 'fearless mind' suggest in the poem?",m:2,h:"Think about confidence and freedom of thought.",a:"It suggests a mind that is confident, courageous and free from fear.",k:"fearless mind,courage",t:"Important",d:"Easy"},
    {q:"Why does the poet give importance to knowledge?",m:2,h:"Think about education and freedom.",a:"He wants knowledge to be freely available so people can grow and think independently.",k:"knowledge,education,freedom",t:"Important",d:"Easy"},
    {q:"What does the poet mean by 'narrow domestic walls'?",m:2,h:"Think of divisions among people.",a:"It refers to narrow divisions that separate people from one another.",k:"narrow domestic walls,division",t:"Important",d:"Easy"},
    {q:"How does truth play a role in the poet's ideal nation?",m:2,h:"The poet wants words to be truthful.",a:"He wants people to speak truthfully and live with honesty.",k:"truth,honesty",t:"Important",d:"Easy"},
    {q:"What is the importance of 'tireless striving' in the poem?",m:2,h:"Think about continuous effort.",a:"It represents continuous effort to improve oneself and reach perfection.",k:"tireless striving,perfection",t:"Important",d:"Easy"},
    {q:"What does the 'clear stream of reason' represent?",m:2,h:"Think of clear thinking.",a:"It represents clear, logical and rational thinking.",k:"reason,logical thinking",t:"Important",d:"Easy"},
    {q:"Why does the poet oppose 'dead habit'?",m:2,h:"Think about blind following of old customs.",a:"He opposes blind and harmful habits that stop people from thinking freely.",k:"dead habit,customs",t:"Important",d:"Easy"},
    {q:"What does the poem suggest about freedom?",m:2,h:"It is more than political freedom.",a:"It suggests freedom of mind, thought, knowledge and action along with freedom from fear.",k:"freedom,thought",t:"Important",d:"Easy"},
    {q:"Explain the central idea of the poem in simple words.",m:3,h:"Mention fear, knowledge, truth, reason and unity.",a:"The poet prays for an ideal India where people are fearless, truthful, educated, united and guided by reason.",k:"central idea,ideal India",t:"Important",d:"Medium"},
    {q:"How does the poem connect freedom with education and knowledge?",m:3,h:"Think about what knowledge enables people to do.",a:"The poet sees knowledge as a source of freedom because educated people can think independently and reject ignorance.",k:"education,knowledge,freedom",t:"Important",d:"Medium"},
    {q:"How can narrow divisions weaken a country?",m:3,h:"Think about unity and social harmony.",a:"Divisions can separate people and weaken unity; the poet therefore wishes for a society without narrow barriers.",k:"unity,division,society",t:"Important",d:"Medium"},
    {q:"Why is reason compared with a clear stream?",m:3,h:"Think about the qualities of clear water.",a:"A clear stream flows freely and is not polluted; similarly, clear reason should remain pure, logical and free from confusion.",k:"metaphor,reason,clear stream",t:"Important",d:"Medium"},
    {q:"What change does the poet want in people's attitudes towards old customs?",m:3,h:"Think about questioning harmful traditions.",a:"He wants people to question harmful old habits instead of following them blindly.",k:"old customs,reason,change",t:"Important",d:"Medium"},
    {q:"Identify one example of imagery used in the poem and explain its effect.",m:3,h:"Think about the images of a stream or desert.",a:"The clear stream of reason creates an image of pure, flowing thought and makes the idea of rational thinking easier to understand.",k:"imagery,reason",t:"Important",d:"Medium"},
    {q:"Explain how the poem presents an ideal form of freedom rather than only political freedom.",m:4,h:"Include freedom of mind, knowledge, truth and reason.",a:"The poem presents freedom as a complete awakening of people: they should be fearless, educated, truthful, united, rational and free from harmful habits.",k:"ideal freedom,awakening",t:"Important",d:"Hard"},
    {q:"How are truth, reason and continuous effort connected in the poet's vision?",m:4,h:"Show how these qualities help a person and a nation progress.",a:"Truth provides honesty, reason provides clear thinking, and continuous effort leads to improvement; together they help build a progressive nation.",k:"truth,reason,striving",t:"Important",d:"Hard"},
    {q:"Write a short paragraph on the qualities of the India imagined by the poet.",m:4,h:"List four or five qualities.",a:"The poet imagines an India that is fearless, truthful, educated, united, rational and continuously striving for improvement.",k:"ideal India,qualities",t:"Important",d:"Hard"},
    {q:"How does the poem encourage responsible citizenship among young people?",m:4,h:"Connect freedom with truth, unity, reason and effort.",a:"It encourages citizens to think freely, speak truthfully, respect unity, use reason and work steadily for the progress of society.",k:"responsible citizenship,freedom,truth,unity,reason",t:"Important",d:"Hard"}
];

app.get("/api/admin/starter-question-pack/preview", async (req,res) => {
    try {
        const chapter = await pool.query(
            `SELECT c.id, c.chapter_number, c.chapter_name, s.name AS subject_name
             FROM chapters c JOIN subjects s ON c.subject_id=s.id
             WHERE s.name='English' AND c.chapter_number='1.1' AND c.is_active=TRUE
             LIMIT 1`
        );
        if (!chapter.rows.length) return res.status(404).json({success:false,error:"English Chapter 1.1 was not found. Please import the official chapter master first."});
        const distribution = {easy:0,medium:0,hard:0};
        ENGLISH_11_STARTER_PACK.forEach(x => distribution[String(x.d).toLowerCase()]++);
        res.json({success:true,subjectName:chapter.rows[0].subject_name,chapterNumber:chapter.rows[0].chapter_number,chapterName:chapter.rows[0].chapter_name,questions:ENGLISH_11_STARTER_PACK.map(x=>({question_text:x.q,marks:x.m,hint:x.h,easy_answer:x.a,keywords:x.k,question_type:x.t,difficulty:x.d})),distribution});
    } catch(error) {
        console.error("Starter Pack Preview Error:",error);
        res.status(500).json({success:false,error:"Unable to preview starter pack"});
    }
});

app.post("/api/admin/starter-question-pack/import", async (req,res) => {
    const client = await pool.connect();
    try {
        const chapter = await client.query(
            `SELECT c.id, c.chapter_name FROM chapters c JOIN subjects s ON c.subject_id=s.id
             WHERE s.name='English' AND c.chapter_number='1.1' AND c.is_active=TRUE LIMIT 1`
        );
        if (!chapter.rows.length) return res.status(404).json({success:false,error:"English Chapter 1.1 was not found. Please import the official chapter master first."});
        await client.query('BEGIN');
        let imported=0, skipped=0;
        for (const x of ENGLISH_11_STARTER_PACK) {
            const exists = await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[chapter.rows[0].id,x.q]);
            if (exists.rows.length) { skipped++; continue; }
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,NULL,TRUE)`,[chapter.rows[0].id,x.q,x.m,x.h,x.a,x.k,x.t,x.d]);
            imported++;
        }
        await client.query('COMMIT');
        res.json({success:true,imported,skipped,chapterName:chapter.rows[0].chapter_name});
    } catch(error) {
        await client.query('ROLLBACK');
        console.error("Starter Pack Import Error:",error);
        res.status(500).json({success:false,error:"Unable to import starter pack"});
    } finally { client.release(); }
});

// ================================================
// STAGE 10 STEP 8 — ENGLISH CHAPTER 1.2 QUESTION PACK
// ================================================

const ENGLISH_12_STARTER_PACK = [
    {q:"Who is Hari Singh in 'The Thief's Story'?",m:1,h:"Recall the narrator's identity.",a:"Hari Singh is a young thief who narrates the story.",k:"Hari Singh,narrator,thief",t:"Important",d:"Easy"},
    {q:"Who is Anil?",m:1,h:"Think about the person Hari meets.",a:"Anil is a young writer who gives Hari a chance to live and learn honestly.",k:"Anil,writer",t:"Important",d:"Easy"},
    {q:"Why does Hari Singh keep changing his name?",m:2,h:"Think about his life as a thief.",a:"He changes his name to avoid being recognised and caught for his thefts.",k:"Hari Singh,name,thief",t:"Important",d:"Easy"},
    {q:"How does Hari Singh meet Anil?",m:2,h:"Recall the meeting near the wrestling match.",a:"Hari approaches Anil and offers to work for him after seeing him at a wrestling match.",k:"meeting,Anil,wrestling",t:"Important",d:"Easy"},
    {q:"What work does Anil give Hari Singh?",m:2,h:"Think about Hari's daily duties.",a:"Anil asks Hari to cook for him and do household work.",k:"work,cooking,Anil",t:"Important",d:"Easy"},
    {q:"Why is Hari Singh attracted to Anil despite Anil having little money?",m:2,h:"Think about what Hari hopes to learn.",a:"Hari believes Anil can teach him to read, write and do simple arithmetic, which can help him in life.",k:"education,reading,writing",t:"Important",d:"Easy"},
    {q:"What does Anil promise to teach Hari Singh?",m:2,h:"Remember the basic skills mentioned in the story.",a:"Anil promises to teach Hari Singh to write whole sentences and do simple arithmetic.",k:"Anil,education,arithmetic",t:"Important",d:"Easy"},
    {q:"Where does Anil keep the money he receives?",m:2,h:"Recall the place where Hari notices the money.",a:"Anil keeps the money under his mattress.",k:"money,mattress,Anil",t:"Important",d:"Easy"},
    {q:"Why does Hari Singh decide to steal Anil's money?",m:2,h:"Think about the opportunity and his old habit.",a:"His old habit of stealing returns when he sees the money and he decides to take it and run away.",k:"stealing,money,temptation",t:"Important",d:"Easy"},
    {q:"Why does Hari Singh return to Anil after stealing the money?",m:2,h:"Think about his feelings about education and trust.",a:"He realises that stealing will destroy his chance to learn and live honestly, so he decides to return the money.",k:"return,education,trust",t:"Important",d:"Easy"},
    {q:"What is the importance of education in Hari Singh's change?",m:3,h:"Connect education with his future.",a:"Education gives Hari a better future and a reason to leave his life of theft behind.",k:"education,change,future",t:"Important",d:"Medium"},
    {q:"How does Anil's trust influence Hari Singh?",m:3,h:"Think about how trust affects Hari's conscience.",a:"Anil's trust makes Hari feel guilty about stealing and encourages him to return the money and reform himself.",k:"trust,guilt,reform",t:"Important",d:"Medium"},
    {q:"Why is the rain important in the story when Hari returns?",m:3,h:"Think about the difficulty of his journey and his state of mind.",a:"The rain makes Hari's return difficult and adds to the tense atmosphere while he struggles with his decision.",k:"rain,return,atmosphere",t:"Important",d:"Medium"},
    {q:"Why does Hari Singh feel that a life of crime would not give him a better future?",m:3,h:"Compare stealing with learning.",a:"He understands that stealing may give quick money, but education can give him lasting skills and a better future.",k:"crime,education,future",t:"Important",d:"Medium"},
    {q:"What does Anil's reaction the next morning show about his character?",m:3,h:"Think about how Anil behaves after the theft.",a:"Anil shows kindness and understanding; he does not openly punish Hari and continues to support his education.",k:"Anil,kindness,understanding",t:"Important",d:"Medium"},
    {q:"Explain how Hari Singh changes from the beginning to the end of the story.",m:4,h:"Compare his attitude before and after meeting Anil.",a:"At first Hari is a clever young thief interested in quick gains. By the end, Anil's trust and the value of education lead him towards honesty and self-improvement.",k:"Hari Singh,change,honesty,education",t:"Important",d:"Hard"},
    {q:"Why can Anil be considered an important influence in Hari Singh's life?",m:4,h:"Mention trust, kindness and education.",a:"Anil gives Hari work, trusts him and offers education without treating him harshly. His kindness gives Hari a chance to change his life.",k:"Anil,influence,trust,education",t:"Important",d:"Hard"},
    {q:"What is the main message of 'The Thief's Story' for students?",m:4,h:"Think about education, trust and second chances.",a:"The story shows that trust, education and kindness can help a person change. A second chance can be more valuable than quick money gained dishonestly.",k:"message,education,trust,second chance",t:"Important",d:"Hard"},
    {q:"How does the story show that honesty can be a difficult but valuable choice?",m:4,h:"Focus on Hari's decision after the theft.",a:"Hari has to choose between keeping the stolen money and returning to Anil. Returning it means giving up quick gain, but it gives him a chance to learn, earn honestly and improve his future.",k:"honesty,choice,education,future",t:"Important",d:"Hard"},
    {q:"If you were Hari Singh, what would you learn from Anil's behaviour?",m:4,h:"Give two or three lessons.",a:"I would learn that trust should not be betrayed, education is more valuable than stolen money, and kindness can help a person become better.",k:"life lessons,trust,education,kindness",t:"Important",d:"Hard"}
];

app.get("/api/admin/english-12-pack/preview", async (req,res) => {
    try {
        const chapter = await pool.query(
            `SELECT c.id, c.chapter_number, c.chapter_name, s.name AS subject_name
             FROM chapters c JOIN subjects s ON c.subject_id=s.id
             WHERE s.name='English' AND c.chapter_number='1.2' AND c.is_active=TRUE
             LIMIT 1`
        );
        if (!chapter.rows.length) return res.status(404).json({success:false,error:"English Chapter 1.2 was not found. Please import the official chapter master first."});
        const distribution = {easy:0,medium:0,hard:0};
        ENGLISH_12_STARTER_PACK.forEach(x => distribution[String(x.d).toLowerCase()]++);
        res.json({success:true,subjectName:chapter.rows[0].subject_name,chapterNumber:chapter.rows[0].chapter_number,chapterName:chapter.rows[0].chapter_name,questions:ENGLISH_12_STARTER_PACK.map(x=>({question_text:x.q,marks:x.m,hint:x.h,easy_answer:x.a,keywords:x.k,question_type:x.t,difficulty:x.d})),distribution});
    } catch(error) {
        console.error("English 1.2 Pack Preview Error:",error);
        res.status(500).json({success:false,error:"Unable to preview English 1.2 pack"});
    }
});

app.post("/api/admin/english-12-pack/import", async (req,res) => {
    const client = await pool.connect();
    try {
        const chapter = await client.query(
            `SELECT c.id, c.chapter_name FROM chapters c JOIN subjects s ON c.subject_id=s.id
             WHERE s.name='English' AND c.chapter_number='1.2' AND c.is_active=TRUE LIMIT 1`
        );
        if (!chapter.rows.length) return res.status(404).json({success:false,error:"English Chapter 1.2 was not found. Please import the official chapter master first."});
        await client.query('BEGIN');
        let imported=0, skipped=0;
        for (const x of ENGLISH_12_STARTER_PACK) {
            const exists = await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[chapter.rows[0].id,x.q]);
            if (exists.rows.length) { skipped++; continue; }
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,NULL,TRUE)`,[chapter.rows[0].id,x.q,x.m,x.h,x.a,x.k,x.t,x.d]);
            imported++;
        }
        await client.query('COMMIT');
        res.json({success:true,imported,skipped,chapterName:chapter.rows[0].chapter_name});
    } catch(error) {
        await client.query('ROLLBACK');
        console.error("English 1.2 Pack Import Error:",error);
        res.status(500).json({success:false,error:"Unable to import English 1.2 pack"});
    } finally { client.release(); }
});


// ================================================
// STAGE 10 STEP 9 — ENGLISH CHAPTER 1.3 QUESTION PACK
// ================================================

const ENGLISH_13_STARTER_PACK = [
    {q:"Who is the central personality in 'On Wings of Courage'?",m:1,h:"Recall the Indian Air Force hero described in the lesson.",a:"The lesson is about Marshal of the Indian Air Force Arjan Singh.",k:"Arjan Singh,IAF,Marshal",t:"Important",d:"Easy"},
    {q:"When and where was Arjan Singh born?",m:2,h:"Recall the date and place given in his fact file.",a:"Arjan Singh was born on 15 April 1919 at Lyalpur, now Faisalabad in Pakistan.",k:"15 April 1919,Lyalpur,birth",t:"Important",d:"Easy"},
    {q:"At what age was Arjan Singh selected for pilot training?",m:1,h:"He was still a teenager when selected.",a:"He was selected for pilot training at the age of 19.",k:"19,pilot training",t:"Important",d:"Easy"},
    {q:"What was Arjan Singh's first flying assignment?",m:2,h:"Think of the aircraft and the squadron mentioned early in the lesson.",a:"His first assignment was to fly Westland Wapiti biplanes in the North-Western Frontier Province with No. 1 RIAF Squadron.",k:"Westland Wapiti,No.1 RIAF Squadron,first assignment",t:"Important",d:"Easy"},
    {q:"Why is Arjan Singh remembered as a war hero?",m:2,h:"Connect him with the 1965 Indo-Pak war.",a:"He is remembered as a war hero because he successfully led the Indian Air Force during the 1965 Indo-Pak war.",k:"1965 war,war hero,leadership",t:"Important",d:"Easy"},
    {q:"How many different types of aircraft did Arjan Singh fly?",m:1,h:"The lesson gives a number greater than fifty.",a:"He flew more than 60 different types of aircraft.",k:"60 aircraft,pilot",t:"Important",d:"Easy"},
    {q:"What was special about Arjan Singh's highest rank?",m:2,h:"Compare the Air Force rank with the Army's five-star rank.",a:"He became the only Indian Air Force officer to attain the rank of Marshal of the Air Force, equivalent to a five-star rank.",k:"Marshal of the Air Force,five-star rank",t:"Important",d:"Easy"},
    {q:"Which important gallantry award did Arjan Singh receive for his wartime service in 1944?",m:1,h:"Its abbreviation is DFC.",a:"He received the Distinguished Flying Cross (DFC) in 1944.",k:"Distinguished Flying Cross,DFC,1944",t:"Important",d:"Easy"},
    {q:"What major challenge did Arjan Singh face when he took over as Air Marshal?",m:2,h:"Think about rebuilding and preparing the Air Force.",a:"He faced the difficult task of rebuilding the Indian Air Force and preparing it to meet new challenges.",k:"Air Marshal,rebuilding IAF,challenges",t:"Important",d:"Easy"},
    {q:"When did Arjan Singh retire from the Indian Air Force?",m:1,h:"Recall the month and year in the fact file.",a:"He retired from the Indian Air Force in August 1969.",k:"retirement,August 1969",t:"Important",d:"Easy"},
    {q:"How did Arjan Singh show courage and professional skill during the 1965 war?",m:3,h:"Mention his leadership under pressure.",a:"He led the Indian Air Force calmly and decisively during a difficult war situation, using courage, determination and professional skill.",k:"1965 war,courage,professional skill,leadership",t:"Important",d:"Medium"},
    {q:"What does Arjan Singh's experience of flying many kinds of aircraft tell us about him?",m:3,h:"Think of adaptability and professional competence.",a:"It shows that he was a highly skilled, adaptable and dedicated pilot who kept improving his professional abilities.",k:"skill,adaptability,dedication,pilot",t:"Important",d:"Medium"},
    {q:"How did Arjan Singh contribute to the growth of the Indian Air Force?",m:3,h:"Think beyond one battle and focus on the organisation.",a:"Through strong leadership, training and modernisation, he helped transform the Indian Air Force into a powerful and respected air force.",k:"IAF,growth,modernisation,leadership",t:"Important",d:"Medium"},
    {q:"Which important public positions did Arjan Singh hold after retirement?",m:3,h:"Recall one diplomatic post and one administrative post.",a:"After retirement he served as India's Ambassador to Switzerland and later as the Lieutenant Governor of Delhi.",k:"Ambassador Switzerland,Lieutenant Governor Delhi",t:"Important",d:"Medium"},
    {q:"Why can Arjan Singh be described as a disciplined leader?",m:3,h:"Use examples from his long flying and leadership career.",a:"He maintained high professional standards, continued flying at senior rank and led the Air Force with calmness, responsibility and commitment.",k:"discipline,leadership,professional standards",t:"Important",d:"Medium"},
    {q:"What qualities of Arjan Singh make him an inspiration for students?",m:3,h:"Name qualities such as courage, discipline and dedication.",a:"His courage, discipline, determination, skill, leadership and dedication to the nation make him an inspiration for students.",k:"courage,discipline,determination,dedication",t:"Important",d:"Medium"},
    {q:"Explain why the title 'On Wings of Courage' is suitable for the lesson.",m:4,h:"Connect flying with bravery and achievement.",a:"The title combines Arjan Singh's life as an outstanding pilot with the courage he showed in war and leadership. His achievements literally involved wings and were driven by courage.",k:"title,wings,courage,Arjan Singh",t:"Important",d:"Hard"},
    {q:"Describe Arjan Singh's journey from a young pilot to Marshal of the Air Force.",m:4,h:"Mention training, flying, promotions, leadership and the highest rank.",a:"Arjan Singh began pilot training at a young age, served in operational squadrons, earned promotions through skill and leadership, led the IAF in major challenges and ultimately attained the rank of Marshal of the Air Force.",k:"career,promotions,Marshal of the Air Force,leadership",t:"Important",d:"Hard"},
    {q:"What leadership lessons can young people learn from Arjan Singh's life?",m:4,h:"Focus on preparation, calmness, responsibility and service.",a:"Young people can learn to prepare thoroughly, remain calm under pressure, accept responsibility, keep learning and use their abilities in service of a larger purpose.",k:"leadership lessons,calmness,responsibility,service",t:"Important",d:"Hard"},
    {q:"How does the lesson connect courage with service to the nation?",m:4,h:"Use Arjan Singh's wartime and later public service as examples.",a:"The lesson shows that courage is not only bravery in battle. Arjan Singh used courage, discipline and leadership throughout his career and continued serving the country even after retirement.",k:"courage,national service,leadership,retirement",t:"Important",d:"Hard"}
];

app.get("/api/admin/english-13-pack/preview", async (req,res) => {
    try {
        const chapter = await pool.query(
            `SELECT c.id, c.chapter_number, c.chapter_name, s.name AS subject_name
             FROM chapters c JOIN subjects s ON c.subject_id=s.id
             WHERE s.name='English' AND c.chapter_number='1.3' AND c.is_active=TRUE
             LIMIT 1`
        );
        if (!chapter.rows.length) return res.status(404).json({success:false,error:"English Chapter 1.3 was not found. Please import the official chapter master first."});
        const distribution = {easy:0,medium:0,hard:0};
        ENGLISH_13_STARTER_PACK.forEach(x => distribution[String(x.d).toLowerCase()]++);
        res.json({success:true,subjectName:chapter.rows[0].subject_name,chapterNumber:chapter.rows[0].chapter_number,chapterName:chapter.rows[0].chapter_name,questions:ENGLISH_13_STARTER_PACK.map(x=>({question_text:x.q,marks:x.m,hint:x.h,easy_answer:x.a,keywords:x.k,question_type:x.t,difficulty:x.d})),distribution});
    } catch(error) {
        console.error("English 1.3 Pack Preview Error:",error);
        res.status(500).json({success:false,error:"Unable to preview English 1.3 pack"});
    }
});

app.post("/api/admin/english-13-pack/import", async (req,res) => {
    const client = await pool.connect();
    try {
        const chapter = await client.query(
            `SELECT c.id, c.chapter_name FROM chapters c JOIN subjects s ON c.subject_id=s.id
             WHERE s.name='English' AND c.chapter_number='1.3' AND c.is_active=TRUE LIMIT 1`
        );
        if (!chapter.rows.length) return res.status(404).json({success:false,error:"English Chapter 1.3 was not found. Please import the official chapter master first."});
        await client.query('BEGIN');
        let imported=0, skipped=0;
        for (const x of ENGLISH_13_STARTER_PACK) {
            const exists = await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[chapter.rows[0].id,x.q]);
            if (exists.rows.length) { skipped++; continue; }
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,NULL,TRUE)`,[chapter.rows[0].id,x.q,x.m,x.h,x.a,x.k,x.t,x.d]);
            imported++;
        }
        await client.query('COMMIT');
        res.json({success:true,imported,skipped,chapterName:chapter.rows[0].chapter_name});
    } catch(error) {
        await client.query('ROLLBACK');
        console.error("English 1.3 Pack Import Error:",error);
        res.status(500).json({success:false,error:"Unable to import English 1.3 pack"});
    } finally { client.release(); }
});


// STAGE 10 STEP 17 - SCIENCE & TECHNOLOGY PART I 10 CHAPTERS ONE-CLICK IMPORT
function readSciencePartI10Pack() {
    const dataDir = path.join(__dirname, "data", "science_part1_10");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^Science_Part_I_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[];
    for(const file of files){
        const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");
        const lines=text.split(/\r?\n/).filter(x=>x.trim()!=="");
        if(lines.length<2) continue;
        const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());
        for(let i=1;i<lines.length;i++){
            const vals=parseCSVLineOneClick(lines[i]),row={};
            headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());
            row._file=file; row._row=i+1; all.push(row);
        }
    }
    return {files,rows:all};
}
app.get("/api/admin/science-part1/preview",async(req,res)=>{
    try{
        const pack=readSciencePartI10Pack(),chapters={};
        pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});
        res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters});
    }catch(error){console.error("Science Part I Preview Error:",error);res.status(500).json({success:false,error:"Unable to read Science & Technology Part I pack"});}
});
app.post("/api/admin/science-part1/import",async(req,res)=>{
    const client=await pool.connect();
    try{
        const pack=readSciencePartI10Pack();
        if(!pack.rows.length)return res.status(400).json({success:false,error:"Science & Technology Part I pack is empty"});
        await client.query("BEGIN");
        const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Science & Technology Part I')) LIMIT 1`);
        if(!subject.rows.length)throw new Error("Science & Technology Part I subject not found");
        const chapterNames={"1":"Gravitation","2":"Periodic Classification of Elements","3":"Chemical Reactions and Equations","4":"Effects of Electric Current","5":"Heat","6":"Refraction of Light","7":"Lenses","8":"Metallurgy","9":"Carbon Compounds","10":"Space Missions"};
        for(const [num,name] of Object.entries(chapterNames)) await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);
        let imported=0,skipped=0; const chapterStats={};
        for(const row of pack.rows){
            const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`Science & Technology Part I|${cn}`;
            chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};
            if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue;}
            const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);
            if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);
            if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);
            imported++;chapterStats[key].imported++;
        }
        await client.query("COMMIT");
        res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    }catch(error){await client.query("ROLLBACK");console.error("Science Part I Import Error:",error);res.status(500).json({success:false,error:"Unable to import Science & Technology Part I questions"});}
    finally{client.release();}
});

// STAGE 10 STEP 18 - SCIENCE & TECHNOLOGY PART II 10 CHAPTERS ONE-CLICK IMPORT
function readSciencePartII10Pack() {
    const dataDir = path.join(__dirname, "data", "science_part2_10");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^Science_Part_II_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[];
    for(const file of files){
        const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");
        const lines=text.split(/\r?\n/).filter(x=>x.trim()!=="");
        if(lines.length<2) continue;
        const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());
        for(let i=1;i<lines.length;i++){
            const vals=parseCSVLineOneClick(lines[i]),row={};
            headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());
            row._file=file; row._row=i+1; all.push(row);
        }
    }
    return {files,rows:all};
}
app.get("/api/admin/science-part2/preview",async(req,res)=>{
    try{
        const pack=readSciencePartII10Pack(),chapters={};
        pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});
        res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters});
    }catch(error){console.error("Science Part II Preview Error:",error);res.status(500).json({success:false,error:"Unable to read Science & Technology Part II pack"});}
});
app.post("/api/admin/science-part2/import",async(req,res)=>{
    const client=await pool.connect();
    try{
        const pack=readSciencePartII10Pack();
        if(!pack.rows.length)return res.status(400).json({success:false,error:"Science & Technology Part II pack is empty"});
        await client.query("BEGIN");
        const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Science & Technology Part II')) LIMIT 1`);
        if(!subject.rows.length)throw new Error("Science & Technology Part II subject not found");
        const chapterNames={"1":"Heredity and Evolution","2":"Life Processes in Living Organisms Part-1","3":"Life Processes in Living Organisms Part-2","4":"Environmental Management","5":"Towards Green Energy","6":"Animal Classification","7":"Introduction to Microbiology","8":"Cell Biology and Biotechnology","9":"Social Health","10":"Disaster Management"};
        for(const [num,name] of Object.entries(chapterNames)) await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);
        let imported=0,skipped=0; const chapterStats={};
        for(const row of pack.rows){
            const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`Science & Technology Part II|${cn}`;
            chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};
            if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue;}
            const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);
            if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);
            if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);
            imported++;chapterStats[key].imported++;
        }
        await client.query("COMMIT");
        res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    }catch(error){await client.query("ROLLBACK");console.error("Science Part II Import Error:",error);res.status(500).json({success:false,error:"Unable to import Science & Technology Part II questions"});}
    finally{client.release();}
});


// STAGE 10 STEP 19 - HISTORY & POLITICAL SCIENCE 14 CHAPTERS ONE-CLICK IMPORT
function readHistoryPoliticalScience14Pack() {
    const dataDir = path.join(__dirname, "data", "history_political_science_14");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^History_Political_Science_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[];
    for(const file of files){
        const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");
        const lines=text.split(/\r?\n/).filter(x=>x.trim()!==""); if(lines.length<2) continue;
        const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());
        for(let i=1;i<lines.length;i++){const vals=parseCSVLineOneClick(lines[i]),row={};headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());row._file=file;row._row=i+1;all.push(row);}
    }
    return {files,rows:all};
}
app.get("/api/admin/history-political-science/preview",async(req,res)=>{
    try{const pack=readHistoryPoliticalScience14Pack(),chapters={};pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters});}
    catch(error){console.error("History Political Science Preview Error:",error);res.status(500).json({success:false,error:"Unable to read History & Political Science pack"});}
});
app.post("/api/admin/history-political-science/import",async(req,res)=>{
    const client=await pool.connect();
    try{
        const pack=readHistoryPoliticalScience14Pack(); if(!pack.rows.length)return res.status(400).json({success:false,error:"History & Political Science pack is empty"});
        await client.query("BEGIN");
        const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('History & Political Science')) LIMIT 1`);
        if(!subject.rows.length)throw new Error("History & Political Science subject not found");
        const chapterNames={"1":"Historiography : Development in the West","2":"Historiography : Indian Tradition","3":"Applied History","4":"History of Indian Arts","5":"Mass Media and History","6":"Entertainment and History","7":"Sports and History","8":"Tourism and History","9":"Heritage Management","10":"Working of the Constitution","11":"The Electoral Process","12":"Political Parties","13":"Social and Political Movements","14":"Challenges faced by Indian Democracy"};
        for(const [num,name] of Object.entries(chapterNames)) await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);
        let imported=0,skipped=0;const chapterStats={};
        for(const row of pack.rows){const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`History & Political Science|${cn}`;chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue;}
            const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);
            if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);
            imported++;chapterStats[key].imported++;
        }
        await client.query("COMMIT");res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    }catch(error){await client.query("ROLLBACK");console.error("History Political Science Import Error:",error);res.status(500).json({success:false,error:"Unable to import History & Political Science questions"});}finally{client.release();}
});


// STAGE 10 STEP 20 - GEOGRAPHY 10 CHAPTERS ONE-CLICK IMPORT
function readGeography10Pack() {
    const dataDir = path.join(__dirname, "data", "geography_10");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^Geography_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[];
    for(const file of files){
        const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");
        const lines=text.split(/\r?\n/).filter(x=>x.trim()!==""); if(lines.length<2) continue;
        const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());
        for(let i=1;i<lines.length;i++){const vals=parseCSVLineOneClick(lines[i]),row={};headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());row._file=file;row._row=i+1;all.push(row);}
    }
    return {files,rows:all};
}
app.get("/api/admin/geography/preview",async(req,res)=>{
    try{const pack=readGeography10Pack(),chapters={};pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters});}
    catch(error){console.error("Geography Preview Error:",error);res.status(500).json({success:false,error:"Unable to read Geography pack"});}
});
app.post("/api/admin/geography/import",async(req,res)=>{
    const client=await pool.connect();
    try{
        const pack=readGeography10Pack(); if(!pack.rows.length)return res.status(400).json({success:false,error:"Geography pack is empty"});
        await client.query("BEGIN");
        const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Geography')) LIMIT 1`);
        if(!subject.rows.length)throw new Error("Geography subject not found");
        const chapterNames={"1":"Field Visit","2":"Location and Extent","3":"Physiography and Drainage","4":"Climate","5":"Natural Vegetation and Wildlife","6":"Population","7":"Human Settlement","8":"Economy and Occupation","9":"Tourism","10":"Transport and Communication"};
        for(const [num,name] of Object.entries(chapterNames)) await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);
        let imported=0,skipped=0;const chapterStats={};
        for(const row of pack.rows){const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`Geography|${cn}`;chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue;}
            const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);
            if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);
            imported++;chapterStats[key].imported++;
        }
        await client.query("COMMIT");res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    }catch(error){await client.query("ROLLBACK");console.error("Geography Import Error:",error);res.status(500).json({success:false,error:"Unable to import Geography questions"});}finally{client.release();}
});

// ================================================
// START SERVER
// ================================================

// ================================================
// GET QUESTIONS BY PYQ PAPER
// ================================================

app.get(
    "/api/question-papers/:paperId/questions",
    async (req, res) => {

        try {

            const paperId =
                req.params.paperId;

            const result =
                await pool.query(

                    `SELECT
                        q.id,
                        q.chapter_id,
                        q.question_text,
                        q.marks,
                        q.hint,
                        q.easy_answer,
                        q.keywords,
                        q.question_type,
                        q.difficulty,
                        q.pyq_year,

                        c.chapter_number,
                        c.chapter_name

                     FROM questions q

                     JOIN chapters c
                        ON q.chapter_id = c.id

                     WHERE q.question_paper_id = $1
                     AND q.is_active = TRUE

                     ORDER BY q.id`,

                    [paperId]

                );


            res.json(result.rows);


        } catch (error) {

            console.error(
                "PYQ Questions Error:",
                error
            );


            res.status(500).json({

                error:
                    "Unable to load PYQ questions"

            });

        }

    }
);


// ================================================
// STAGE 8 STEP 3 - DAILY PRACTICE TRACKING TABLES
// ================================================

async function ensureDailyPracticeTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_practice_sessions (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL,
            practice_date DATE NOT NULL DEFAULT CURRENT_DATE,
            total_questions INTEGER NOT NULL DEFAULT 0,
            completed_questions INTEGER NOT NULL DEFAULT 0,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            CONSTRAINT fk_daily_session_student
                FOREIGN KEY (student_id)
                REFERENCES students(id)
                ON DELETE CASCADE,
            CONSTRAINT uq_daily_session_student_date
                UNIQUE (student_id, practice_date)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_practice_questions (
            id SERIAL PRIMARY KEY,
            session_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            question_order INTEGER NOT NULL,
            is_completed BOOLEAN NOT NULL DEFAULT FALSE,
            completed_at TIMESTAMP NULL,
            CONSTRAINT fk_daily_question_session
                FOREIGN KEY (session_id)
                REFERENCES daily_practice_sessions(id)
                ON DELETE CASCADE,
            CONSTRAINT fk_daily_question_question
                FOREIGN KEY (question_id)
                REFERENCES questions(id)
                ON DELETE CASCADE,
            CONSTRAINT uq_daily_session_question
                UNIQUE (session_id, question_id)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS student_progress_snapshots (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL,
            snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
            total_questions INTEGER NOT NULL DEFAULT 0,
            known INTEGER NOT NULL DEFAULT 0,
            revision INTEGER NOT NULL DEFAULT 0,
            attempted INTEGER NOT NULL DEFAULT 0,
            mastery_percentage INTEGER NOT NULL DEFAULT 0,
            coverage_percentage INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_progress_snapshot_student
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            CONSTRAINT uq_progress_snapshot_student_date
                UNIQUE (student_id, snapshot_date)
        )
    `);
}

// ================================================
// START DAILY PRACTICE SESSION
// ================================================

app.post(
    "/api/students/:studentId/daily-practice/start",
    async (req, res) => {
        const client = await pool.connect();

        try {
            const studentId = Number(req.params.studentId);
            const requestedLimit = Number(req.body?.limit) || 10;
            const limit = Math.min(Math.max(requestedLimit, 1), 20);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid student ID"
                });
            }

            await client.query("BEGIN");

            const studentCheck = await client.query(
                `SELECT id, name
                 FROM students
                 WHERE id = $1`,
                [studentId]
            );

            if (studentCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    success: false,
                    error: "Student not found"
                });
            }

            let sessionResult = await client.query(
                `INSERT INTO daily_practice_sessions
                 (student_id, practice_date)
                 VALUES ($1, CURRENT_DATE)
                 ON CONFLICT (student_id, practice_date)
                 DO UPDATE SET student_id = EXCLUDED.student_id
                 RETURNING *`,
                [studentId]
            );

            let session = sessionResult.rows[0];

            const existingQuestions = await client.query(
                `SELECT COUNT(*)::int AS count
                 FROM daily_practice_questions
                 WHERE session_id = $1`,
                [session.id]
            );

            if (existingQuestions.rows[0].count === 0) {
                const questionResult = await client.query(
                    `SELECT
                        q.id,
                        CASE
                            WHEN p.status = 'revision' THEN 1
                            WHEN p.status IS NULL THEN 2
                            WHEN p.status <> 'known' THEN 3
                            WHEN q.question_type = 'PYQ' THEN 4
                            WHEN q.question_type = 'Important' THEN 5
                            ELSE 6
                        END AS smart_priority
                     FROM questions q
                     LEFT JOIN student_question_progress p
                        ON p.question_id = q.id
                        AND p.student_id = $1
                     WHERE q.is_active = TRUE
                     ORDER BY
                        smart_priority,
                        CASE WHEN q.question_type = 'PYQ' THEN 1 ELSE 2 END,
                        CASE WHEN q.difficulty = 'Easy' THEN 1
                             WHEN q.difficulty = 'Medium' THEN 2
                             ELSE 3 END,
                        md5(q.id::text || '-' || $1::text || '-' || CURRENT_DATE::text)
                     LIMIT $2`,
                    [studentId, limit]
                );

                for (let i = 0; i < questionResult.rows.length; i++) {
                    await client.query(
                        `INSERT INTO daily_practice_questions
                         (session_id, question_id, question_order)
                         VALUES ($1, $2, $3)`,
                        [session.id, questionResult.rows[i].id, i + 1]
                    );
                }

                await client.query(
                    `UPDATE daily_practice_sessions
                     SET total_questions = $2,
                         completed_questions = 0,
                         completed_at = NULL
                     WHERE id = $1`,
                    [session.id, questionResult.rows.length]
                );
            }

            const updatedSession = await client.query(
                `SELECT *
                 FROM daily_practice_sessions
                 WHERE id = $1`,
                [session.id]
            );

            const questions = await client.query(
                `SELECT
                    dpq.id AS daily_question_id,
                    dpq.question_id,
                    dpq.question_order,
                    dpq.is_completed,
                    dpq.completed_at,
                    q.chapter_id,
                    q.question_text,
                    q.marks,
                    q.hint,
                    q.easy_answer,
                    q.keywords,
                    q.question_type,
                    q.difficulty,
                    q.pyq_year,
                    c.chapter_number,
                    c.chapter_name,
                    s.name AS subject_name,
                    COALESCE(p.status, 'not_started') AS student_status
                 FROM daily_practice_questions dpq
                 JOIN questions q ON q.id = dpq.question_id
                 JOIN chapters c ON c.id = q.chapter_id
                 JOIN subjects s ON s.id = c.subject_id
                 LEFT JOIN student_question_progress p
                    ON p.question_id = q.id
                    AND p.student_id = $1
                 WHERE dpq.session_id = $2
                 ORDER BY dpq.question_order`,
                [studentId, session.id]
            );

            await client.query("COMMIT");

            res.json({
                success: true,
                date: updatedSession.rows[0].practice_date,
                session: updatedSession.rows[0],
                questions: questions.rows
            });
        } catch (error) {
            try { await client.query("ROLLBACK"); } catch (_) {}

            console.error(
                "Daily Practice Start Error:",
                error
            );

            res.status(500).json({
                success: false,
                error: "Unable to start daily practice"
            });
        } finally {
            client.release();
        }
    }
);

// ================================================
// GET TODAY'S DAILY PRACTICE SESSION
// ================================================

app.get(
    "/api/students/:studentId/daily-practice/today",
    async (req, res) => {
        try {
            const studentId = Number(req.params.studentId);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid student ID"
                });
            }

            const sessionResult = await pool.query(
                `SELECT *
                 FROM daily_practice_sessions
                 WHERE student_id = $1
                 AND practice_date = CURRENT_DATE
                 LIMIT 1`,
                [studentId]
            );

            if (sessionResult.rows.length === 0) {
                return res.json({
                    success: true,
                    has_session: false,
                    session: null,
                    questions: []
                });
            }

            const session = sessionResult.rows[0];

            const questions = await pool.query(
                `SELECT
                    dpq.id AS daily_question_id,
                    dpq.question_id,
                    dpq.question_order,
                    dpq.is_completed,
                    dpq.completed_at,
                    q.chapter_id,
                    q.question_text,
                    q.marks,
                    q.hint,
                    q.easy_answer,
                    q.keywords,
                    q.question_type,
                    q.difficulty,
                    q.pyq_year,
                    c.chapter_number,
                    c.chapter_name,
                    s.name AS subject_name,
                    COALESCE(p.status, 'not_started') AS student_status
                 FROM daily_practice_questions dpq
                 JOIN questions q ON q.id = dpq.question_id
                 JOIN chapters c ON c.id = q.chapter_id
                 JOIN subjects s ON s.id = c.subject_id
                 LEFT JOIN student_question_progress p
                    ON p.question_id = q.id
                    AND p.student_id = $1
                 WHERE dpq.session_id = $2
                 ORDER BY dpq.question_order`,
                [studentId, session.id]
            );

            res.json({
                success: true,
                has_session: true,
                date: session.practice_date,
                session,
                questions: questions.rows
            });
        } catch (error) {
            console.error(
                "Daily Practice Today Error:",
                error
            );

            res.status(500).json({
                success: false,
                error: "Unable to load today's practice"
            });
        }
    }
);

// ================================================
// COMPLETE ONE DAILY PRACTICE QUESTION
// ================================================

app.post(
    "/api/students/:studentId/daily-practice/:sessionId/complete",
    async (req, res) => {
        const client = await pool.connect();

        try {
            const studentId = Number(req.params.studentId);
            const sessionId = Number(req.params.sessionId);
            const questionId = Number(req.body?.question_id);

            if (
                !Number.isInteger(studentId) || studentId <= 0 ||
                !Number.isInteger(sessionId) || sessionId <= 0 ||
                !Number.isInteger(questionId) || questionId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid practice information"
                });
            }

            await client.query("BEGIN");

            const sessionResult = await client.query(
                `SELECT *
                 FROM daily_practice_sessions
                 WHERE id = $1
                 AND student_id = $2
                 FOR UPDATE`,
                [sessionId, studentId]
            );

            if (sessionResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({
                    success: false,
                    error: "Daily practice session not found"
                });
            }

            const questionResult = await client.query(
                `UPDATE daily_practice_questions
                 SET is_completed = TRUE,
                     completed_at = CURRENT_TIMESTAMP
                 WHERE session_id = $1
                 AND question_id = $2
                 AND is_completed = FALSE
                 RETURNING *`,
                [sessionId, questionId]
            );

            if (questionResult.rows.length > 0) {
                await client.query(
                    `UPDATE daily_practice_sessions
                     SET completed_questions = completed_questions + 1
                     WHERE id = $1`,
                    [sessionId]
                );
            }

            const countResult = await client.query(
                `SELECT
                    total_questions,
                    completed_questions
                 FROM daily_practice_sessions
                 WHERE id = $1`,
                [sessionId]
            );

            const current = countResult.rows[0];
            const isComplete =
                Number(current.total_questions) > 0 &&
                Number(current.completed_questions) >=
                    Number(current.total_questions);

            if (isComplete) {
                await client.query(
                    `UPDATE daily_practice_sessions
                     SET completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
                     WHERE id = $1`,
                    [sessionId]
                );
            }

            const finalSession = await client.query(
                `SELECT *
                 FROM daily_practice_sessions
                 WHERE id = $1`,
                [sessionId]
            );

            await client.query("COMMIT");

            res.json({
                success: true,
                question_completed: questionResult.rows.length > 0,
                session: finalSession.rows[0],
                daily_completed: isComplete
            });
        } catch (error) {
            try { await client.query("ROLLBACK"); } catch (_) {}

            console.error(
                "Daily Practice Complete Error:",
                error
            );

            res.status(500).json({
                success: false,
                error: "Unable to save daily practice completion"
            });
        } finally {
            client.release();
        }
    }
);

// ================================================
// STAGE 8 STEP 6 — DAILY STREAK
// ================================================

app.get(
    "/api/students/:studentId/daily-streak",
    async (req, res) => {
        try {
            const studentId = Number(req.params.studentId);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid student ID"
                });
            }

            const result = await pool.query(
                `SELECT practice_date,
                        completed_at,
                        total_questions,
                        completed_questions
                 FROM daily_practice_sessions
                 WHERE student_id = $1
                   AND completed_at IS NOT NULL
                   AND completed_questions >= total_questions
                   AND total_questions > 0
                 ORDER BY practice_date DESC`,
                [studentId]
            );

            const dates = result.rows.map(row => String(row.practice_date));
            const dateSet = new Set(dates);

            function previousDate(dateString) {
                const d = new Date(`${dateString}T00:00:00Z`);
                d.setUTCDate(d.getUTCDate() - 1);
                return d.toISOString().slice(0, 10);
            }

            const todayResult = await pool.query(`SELECT CURRENT_DATE::text AS today`);
            const today = todayResult.rows[0].today;

            let currentStreak = 0;
            let cursor = today;

            if (dateSet.has(today)) {
                while (dateSet.has(cursor)) {
                    currentStreak++;
                    cursor = previousDate(cursor);
                }
            }

            let longestStreak = 0;
            let runningStreak = 0;
            let previous = null;

            const ascendingDates = [...dates].sort();

            for (const date of ascendingDates) {
                if (previous && previousDate(date) === previous) {
                    runningStreak++;
                } else {
                    runningStreak = 1;
                }

                if (runningStreak > longestStreak) {
                    longestStreak = runningStreak;
                }

                previous = date;
            }

            const last7Days = [];
            let dayCursor = today;

            for (let i = 0; i < 7; i++) {
                last7Days.push({
                    date: dayCursor,
                    completed: dateSet.has(dayCursor)
                });
                dayCursor = previousDate(dayCursor);
            }

            res.json({
                success: true,
                today,
                currentStreak,
                longestStreak,
                totalPracticeDays: dates.length,
                lastCompletedDate: dates.length > 0 ? dates[0] : null,
                last7Days
            });
        } catch (error) {
            console.error("Daily Streak Error:", error);

            res.status(500).json({
                success: false,
                error: "Unable to load daily streak"
            });
        }
    }
);



// STAGE 10 STEP 18 - SCIENCE & TECHNOLOGY PART II 10 CHAPTERS ONE-CLICK IMPORT
function readSciencePartII10Pack() {
    const dataDir = path.join(__dirname, "data", "science_part2_10");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^Science_Part_II_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[];
    for(const file of files){
        const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");
        const lines=text.split(/\r?\n/).filter(x=>x.trim()!=="");
        if(lines.length<2) continue;
        const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());
        for(let i=1;i<lines.length;i++){
            const vals=parseCSVLineOneClick(lines[i]),row={};
            headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());
            row._file=file; row._row=i+1; all.push(row);
        }
    }
    return {files,rows:all};
}
app.get("/api/admin/science-part2/preview",async(req,res)=>{
    try{
        const pack=readSciencePartII10Pack(),chapters={};
        pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});
        res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters});
    }catch(error){console.error("Science Part II Preview Error:",error);res.status(500).json({success:false,error:"Unable to read Science & Technology Part II pack"});}
});
app.post("/api/admin/science-part2/import",async(req,res)=>{
    const client=await pool.connect();
    try{
        const pack=readSciencePartII10Pack();
        if(!pack.rows.length)return res.status(400).json({success:false,error:"Science & Technology Part II pack is empty"});
        await client.query("BEGIN");
        const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Science & Technology Part II')) LIMIT 1`);
        if(!subject.rows.length)throw new Error("Science & Technology Part II subject not found");
        const chapterNames={"1":"Heredity and Evolution","2":"Life Processes in Living Organisms Part-1","3":"Life Processes in Living Organisms Part-2","4":"Environmental Management","5":"Towards Green Energy","6":"Animal Classification","7":"Introduction to Microbiology","8":"Cell Biology and Biotechnology","9":"Social Health","10":"Disaster Management"};
        for(const [num,name] of Object.entries(chapterNames)) await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);
        let imported=0,skipped=0; const chapterStats={};
        for(const row of pack.rows){
            const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`Science & Technology Part II|${cn}`;
            chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};
            if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue;}
            const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);
            if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);
            if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);
            imported++;chapterStats[key].imported++;
        }
        await client.query("COMMIT");
        res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    }catch(error){await client.query("ROLLBACK");console.error("Science Part II Import Error:",error);res.status(500).json({success:false,error:"Unable to import Science & Technology Part II questions"});}
    finally{client.release();}
});


// STAGE 10 STEP 19 - HISTORY & POLITICAL SCIENCE 14 CHAPTERS ONE-CLICK IMPORT
function readHistoryPoliticalScience14Pack() {
    const dataDir = path.join(__dirname, "data", "history_political_science_14");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^History_Political_Science_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[];
    for(const file of files){
        const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");
        const lines=text.split(/\r?\n/).filter(x=>x.trim()!==""); if(lines.length<2) continue;
        const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());
        for(let i=1;i<lines.length;i++){const vals=parseCSVLineOneClick(lines[i]),row={};headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());row._file=file;row._row=i+1;all.push(row);}
    }
    return {files,rows:all};
}
app.get("/api/admin/history-political-science/preview",async(req,res)=>{
    try{const pack=readHistoryPoliticalScience14Pack(),chapters={};pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters});}
    catch(error){console.error("History Political Science Preview Error:",error);res.status(500).json({success:false,error:"Unable to read History & Political Science pack"});}
});
app.post("/api/admin/history-political-science/import",async(req,res)=>{
    const client=await pool.connect();
    try{
        const pack=readHistoryPoliticalScience14Pack(); if(!pack.rows.length)return res.status(400).json({success:false,error:"History & Political Science pack is empty"});
        await client.query("BEGIN");
        const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('History & Political Science')) LIMIT 1`);
        if(!subject.rows.length)throw new Error("History & Political Science subject not found");
        const chapterNames={"1":"Historiography : Development in the West","2":"Historiography : Indian Tradition","3":"Applied History","4":"History of Indian Arts","5":"Mass Media and History","6":"Entertainment and History","7":"Sports and History","8":"Tourism and History","9":"Heritage Management","10":"Working of the Constitution","11":"The Electoral Process","12":"Political Parties","13":"Social and Political Movements","14":"Challenges faced by Indian Democracy"};
        for(const [num,name] of Object.entries(chapterNames)) await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);
        let imported=0,skipped=0;const chapterStats={};
        for(const row of pack.rows){const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`History & Political Science|${cn}`;chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue;}
            const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);
            if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);
            imported++;chapterStats[key].imported++;
        }
        await client.query("COMMIT");res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    }catch(error){await client.query("ROLLBACK");console.error("History Political Science Import Error:",error);res.status(500).json({success:false,error:"Unable to import History & Political Science questions"});}finally{client.release();}
});


// STAGE 10 STEP 20 - GEOGRAPHY 10 CHAPTERS ONE-CLICK IMPORT
function readGeography10Pack() {
    const dataDir = path.join(__dirname, "data", "geography_10");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^Geography_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[];
    for(const file of files){
        const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");
        const lines=text.split(/\r?\n/).filter(x=>x.trim()!==""); if(lines.length<2) continue;
        const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());
        for(let i=1;i<lines.length;i++){const vals=parseCSVLineOneClick(lines[i]),row={};headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());row._file=file;row._row=i+1;all.push(row);}
    }
    return {files,rows:all};
}
app.get("/api/admin/geography/preview",async(req,res)=>{
    try{const pack=readGeography10Pack(),chapters={};pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters});}
    catch(error){console.error("Geography Preview Error:",error);res.status(500).json({success:false,error:"Unable to read Geography pack"});}
});
app.post("/api/admin/geography/import",async(req,res)=>{
    const client=await pool.connect();
    try{
        const pack=readGeography10Pack(); if(!pack.rows.length)return res.status(400).json({success:false,error:"Geography pack is empty"});
        await client.query("BEGIN");
        const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Geography')) LIMIT 1`);
        if(!subject.rows.length)throw new Error("Geography subject not found");
        const chapterNames={"1":"Field Visit","2":"Location and Extent","3":"Physiography and Drainage","4":"Climate","5":"Natural Vegetation and Wildlife","6":"Population","7":"Human Settlement","8":"Economy and Occupation","9":"Tourism","10":"Transport and Communication"};
        for(const [num,name] of Object.entries(chapterNames)) await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);
        let imported=0,skipped=0;const chapterStats={};
        for(const row of pack.rows){const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`Geography|${cn}`;chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue;}
            const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);
            if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue;}
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);
            imported++;chapterStats[key].imported++;
        }
        await client.query("COMMIT");res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats});
    }catch(error){await client.query("ROLLBACK");console.error("Geography Import Error:",error);res.status(500).json({success:false,error:"Unable to import Geography questions"});}finally{client.release();}
});

// STAGE 10 STEP 16 - MATHEMATICS PART II 7 CHAPTERS ONE-CLICK IMPORT
function readMathPartII7Pack() {
    const dataDir = path.join(__dirname, "data", "math_part2_7");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^Math_Part_II_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[]; for(const file of files){const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");const lines=text.split(/\r?\n/).filter(x=>x.trim()!=="");if(lines.length<2)continue;const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());for(let i=1;i<lines.length;i++){const vals=parseCSVLineOneClick(lines[i]),row={};headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());row._file=file;row._row=i+1;all.push(row);}} return {files,rows:all};
}
app.get("/api/admin/math-part2/preview",async(req,res)=>{try{const pack=readMathPartII7Pack(),chapters={};pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters})}catch(error){console.error("Math Part II Preview Error:",error);res.status(500).json({success:false,error:"Unable to read Mathematics Part II pack"})}});
app.post("/api/admin/math-part2/import",async(req,res)=>{const client=await pool.connect();try{const pack=readMathPartII7Pack();if(!pack.rows.length)return res.status(400).json({success:false,error:"Mathematics Part II pack is empty"});await client.query("BEGIN");const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Mathematics Part II')) LIMIT 1`);if(!subject.rows.length)throw new Error("Mathematics Part II subject not found");const chapterNames={"1":"Similarity","2":"Pythagoras Theorem","3":"Circle","4":"Geometric Constructions","5":"Co-ordinate Geometry","6":"Trigonometry","7":"Mensuration"};for(const [num,name] of Object.entries(chapterNames))await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);let imported=0,skipped=0;const chapterStats={};for(const row of pack.rows){const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`Mathematics Part II|${cn}`;chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue}const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue}const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue}await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);imported++;chapterStats[key].imported++}await client.query("COMMIT");res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats})}catch(error){await client.query("ROLLBACK");console.error("Math Part II Import Error:",error);res.status(500).json({success:false,error:"Unable to import Mathematics Part II questions"})}finally{client.release()}});

// STAGE 10 STEP 15 - MATHEMATICS PART I 6 CHAPTERS ONE-CLICK IMPORT
function readMathPartI6Pack() {
    const dataDir = path.join(__dirname, "data", "math_part1_6");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^Math_Part_I_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[]; for(const file of files){const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");const lines=text.split(/\r?\n/).filter(x=>x.trim()!=="");if(lines.length<2)continue;const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());for(let i=1;i<lines.length;i++){const vals=parseCSVLineOneClick(lines[i]),row={};headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());row._file=file;row._row=i+1;all.push(row);}} return {files,rows:all};
}
app.get("/api/admin/math-part1/preview",async(req,res)=>{try{const pack=readMathPartI6Pack(),chapters={};pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters})}catch(error){console.error("Math Part I Preview Error:",error);res.status(500).json({success:false,error:"Unable to read Mathematics Part I pack"})}});
app.post("/api/admin/math-part1/import",async(req,res)=>{const client=await pool.connect();try{const pack=readMathPartI6Pack();if(!pack.rows.length)return res.status(400).json({success:false,error:"Mathematics Part I pack is empty"});await client.query("BEGIN");const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Mathematics Part I')) LIMIT 1`);if(!subject.rows.length)throw new Error("Mathematics Part I subject not found");const chapterNames={"1":"Linear Equations in Two Variables","2":"Quadratic Equations","3":"Arithmetic Progression","4":"Financial Planning","5":"Probability","6":"Statistics"};for(const [num,name] of Object.entries(chapterNames))await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);let imported=0,skipped=0;const chapterStats={};for(const row of pack.rows){const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`Mathematics Part I|${cn}`;chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue}const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue}const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue}await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Practice').trim()||'Practice',String(row.difficulty||'Easy').trim()||'Easy',null,null]);imported++;chapterStats[key].imported++}await client.query("COMMIT");res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats})}catch(error){await client.query("ROLLBACK");console.error("Math Part I Import Error:",error);res.status(500).json({success:false,error:"Unable to import Mathematics Part I questions"})}finally{client.release()}});

// STAGE 10 STEP 14 - SANSKRIT AMOD 15 CHAPTERS ONE-CLICK IMPORT
function readSanskrit15Pack() {
    const dataDir = path.join(__dirname, "data", "sanskrit_amod_15");
    if (!fs.existsSync(dataDir)) return { files: [], rows: [] };
    const files = fs.readdirSync(dataDir).filter(f => /^Sanskrit_Chapter_\d+\.csv$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const all=[]; for(const file of files){const text=fs.readFileSync(path.join(dataDir,file),"utf8").replace(/^\uFEFF/,"");const lines=text.split(/\r?\n/).filter(x=>x.trim()!=="");if(lines.length<2)continue;const headers=parseCSVLineOneClick(lines[0]).map(h=>h.trim().toLowerCase());for(let i=1;i<lines.length;i++){const vals=parseCSVLineOneClick(lines[i]),row={};headers.forEach((h,idx)=>row[h]=(vals[idx]||"").trim());row._file=file;row._row=i+1;all.push(row);}} return {files,rows:all};
}
app.get("/api/admin/sanskrit-amod/preview",async(req,res)=>{try{const pack=readSanskrit15Pack(),chapters={};pack.rows.forEach(r=>{const k=`${r.subject_name}|${r.chapter_number}`;chapters[k]=(chapters[k]||0)+1});res.json({success:true,fileCount:pack.files.length,questionCount:pack.rows.length,chapters})}catch(error){console.error("Sanskrit Preview Error:",error);res.status(500).json({success:false,error:"Unable to read Sanskrit Amod pack"})}});
app.post("/api/admin/sanskrit-amod/import",async(req,res)=>{const client=await pool.connect();try{const pack=readSanskrit15Pack();if(!pack.rows.length)return res.status(400).json({success:false,error:"Sanskrit Amod pack is empty"});await client.query("BEGIN");const subject=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM('Sanskrit')) LIMIT 1`);if(!subject.rows.length)throw new Error("Sanskrit subject not found");const chapterNames={"1":"आद्यकृषकः पृथुवैन्यः।","2":"व्यसने मित्रपरीक्षा।","3":"सूक्तिसुधा।","4":"अमूल्यं कमलम्।","5":"स एव परमाणुः।","6":"युग्ममाला।","7":"संस्कृतनाट्यस्तबकः।","8":"वाचनप्रशंसा।","9":"धेनोर्व्याघ्रः पलायते।","10":"नदीसूक्तम्।","11":"जटायुशौर्यम्।","12":"आदिशङ्कराचार्यः।","13":"चित्रकाव्यम्।","14":"प्रतिपदं संस्कृतम्।","15":"मानवताधर्मः।"};for(const [num,name] of Object.entries(chapterNames))await client.query(`INSERT INTO chapters (subject_id,chapter_number,chapter_name,is_active) VALUES ($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[subject.rows[0].id,num,name]);let imported=0,skipped=0;const chapterStats={};for(const row of pack.rows){const cn=String(row.chapter_number||'').trim(),qt=String(row.question_text||'').trim(),key=`Sanskrit|${cn}`;chapterStats[key]=chapterStats[key]||{imported:0,skipped:0};if(!qt||!cn){skipped++;chapterStats[key].skipped++;continue}const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND CAST(c.chapter_number AS TEXT)=$2 AND c.is_active=TRUE LIMIT 1`,[subject.rows[0].id,cn]);if(!ch.rows.length){skipped++;chapterStats[key].skipped++;continue}const ex=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,qt]);if(ex.rows.length){skipped++;chapterStats[key].skipped++;continue}await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)`,[ch.rows[0].id,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.question_type||'Important').trim()||'Important',String(row.difficulty||'Easy').trim()||'Easy',null,null]);imported++;chapterStats[key].imported++}await client.query("COMMIT");res.json({success:true,fileCount:pack.files.length,totalQuestions:pack.rows.length,imported,skipped,chapterStats})}catch(error){await client.query("ROLLBACK");console.error("Sanskrit Import Error:",error);res.status(500).json({success:false,error:"Unable to import Sanskrit Amod questions"})}finally{client.release()}});


// ================================================
// STAGE 10 STEP 22 - QUESTION QUALITY & COVERAGE AUDIT
// ================================================
app.get("/api/admin/question-quality-audit", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                s.name AS subject_name, c.id AS chapter_id, c.chapter_number, c.chapter_name,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE)::int AS active_questions,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND COALESCE(TRIM(q.question_text),'')='')::int AS missing_text,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND COALESCE(TRIM(q.hint),'')='')::int AS missing_hint,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND COALESCE(TRIM(q.easy_answer),'')='')::int AS missing_answer,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND COALESCE(TRIM(q.keywords),'')='')::int AS missing_keywords,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND COALESCE(TRIM(q.difficulty),'')='')::int AS missing_difficulty,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND q.difficulty='Easy')::int AS easy_questions,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND q.difficulty='Medium')::int AS medium_questions,
                COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND q.difficulty='Hard')::int AS hard_questions
            FROM subjects s
            LEFT JOIN chapters c ON c.subject_id=s.id AND c.is_active=TRUE
            LEFT JOIN questions q ON q.chapter_id=c.id
            GROUP BY s.name,c.id,c.chapter_number,c.chapter_name
            ORDER BY s.name,c.chapter_number::text
        `);
        const chapters=result.rows.map(r=>{
            const total=Number(r.active_questions||0);
            const issues=Number(r.missing_text||0)+Number(r.missing_answer||0)+Number(r.missing_difficulty||0);
            const distributionOk=total===0 || (Number(r.easy_questions)>0 && Number(r.medium_questions)>0 && Number(r.hard_questions)>0);
            return {...r, metadata_issues:issues, distribution_status:distributionOk?'OK':'CHECK', status:issues===0 && distributionOk?'READY':'CHECK'};
        });
        const totals=chapters.reduce((a,r)=>{
            a.chapters++; a.active_questions+=Number(r.active_questions||0); a.metadata_issues+=Number(r.metadata_issues||0);
            a.easy_questions+=Number(r.easy_questions||0); a.medium_questions+=Number(r.medium_questions||0); a.hard_questions+=Number(r.hard_questions||0);
            if(r.status==='READY')a.ready_chapters++;else a.check_chapters++; return a;
        },{chapters:0,active_questions:0,metadata_issues:0,easy_questions:0,medium_questions:0,hard_questions:0,ready_chapters:0,check_chapters:0});
        res.json({success:true,totals,chapters});
    } catch(error){ console.error('Question Quality Audit Error:',error); res.status(500).json({success:false,error:'Unable to load question quality audit'}); }
});

// ================================================
// STAGE 10 STEP 21 - FULL QUESTION BANK AUDIT
// ================================================
app.get("/api/admin/content-audit", async (req, res) => {
    try {
        const target = 20;
        const result = await pool.query(`
            SELECT
                s.id AS subject_id,
                s.name AS subject_name,
                c.id AS chapter_id,
                c.chapter_number,
                c.chapter_name,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE)::int AS active_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND q.difficulty = 'Easy')::int AS easy_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND q.difficulty = 'Medium')::int AS medium_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND q.difficulty = 'Hard')::int AS hard_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND q.question_type = 'PYQ')::int AS pyq_questions,
                COUNT(q.id) FILTER (WHERE q.is_active = TRUE AND q.question_type = 'Important')::int AS important_questions
            FROM subjects s
            LEFT JOIN chapters c ON c.subject_id = s.id AND c.is_active = TRUE
            LEFT JOIN questions q ON q.chapter_id = c.id
            GROUP BY s.id, s.name, c.id, c.chapter_number, c.chapter_name
            ORDER BY s.name, c.chapter_number::text
        `);

        const rows = result.rows.map(r => ({
            ...r,
            target_questions: target,
            gap: Math.max(0, target - Number(r.active_questions || 0)),
            status: Number(r.active_questions || 0) >= target ? 'READY' : 'GAP'
        }));

        const subjects = {};
        for (const r of rows) {
            if (!subjects[r.subject_name]) subjects[r.subject_name] = {
                subject_name: r.subject_name,
                chapters: 0,
                ready_chapters: 0,
                gap_chapters: 0,
                active_questions: 0,
                target_questions: 0,
                total_gap: 0
            };
            const x = subjects[r.subject_name];
            x.chapters++;
            x.active_questions += Number(r.active_questions || 0);
            x.target_questions += target;
            x.total_gap += r.gap;
            if (r.status === 'READY') x.ready_chapters++; else x.gap_chapters++;
        }

        const totals = rows.reduce((a, r) => {
            a.chapters++;
            a.active_questions += Number(r.active_questions || 0);
            a.target_questions += target;
            a.total_gap += r.gap;
            if (r.status === 'READY') a.ready_chapters++; else a.gap_chapters++;
            return a;
        }, {chapters:0, ready_chapters:0, gap_chapters:0, active_questions:0, target_questions:0, total_gap:0});

        res.json({success:true, target_per_chapter:target, totals, subjects:Object.values(subjects), chapters:rows});
    } catch (error) {
        console.error('Content Audit Error:', error);
        res.status(500).json({success:false, error:'Unable to load full question bank audit'});
    }
});


// ================================================

// ================================================

// STAGE 10 STEP 26 - CONTENT + MCQ + EXAM MANAGEMENT
app.get('/api/admin/content-management/overview', async (req,res)=>{
  try{
    const r=await pool.query(`SELECT s.id subject_id,s.name subject_name,COUNT(DISTINCT c.id)::int chapters,COUNT(q.id) FILTER(WHERE q.is_active=TRUE)::int active_questions,COUNT(q.id) FILTER(WHERE q.is_active=TRUE AND q.option_a IS NOT NULL AND q.option_b IS NOT NULL AND q.option_c IS NOT NULL AND q.option_d IS NOT NULL AND q.correct_option IN ('A','B','C','D'))::int mcq_ready,COUNT(q.id) FILTER(WHERE q.is_active=TRUE AND (q.easy_answer IS NULL OR TRIM(q.easy_answer)=''))::int missing_answers FROM subjects s LEFT JOIN chapters c ON c.subject_id=s.id LEFT JOIN questions q ON q.chapter_id=c.id GROUP BY s.id,s.name ORDER BY s.name`);
    res.json({success:true,subjects:r.rows});
  }catch(e){console.error(e);res.status(500).json({success:false,error:'Unable to load content management overview'});}
});
app.get('/api/admin/content-management/chapters/:subjectId', async(req,res)=>{
  try{const r=await pool.query(`SELECT c.id,c.chapter_number,c.chapter_name,c.is_active,COUNT(q.id) FILTER(WHERE q.is_active=TRUE)::int active_questions,COUNT(q.id) FILTER(WHERE q.is_active=TRUE AND q.option_a IS NOT NULL AND q.option_b IS NOT NULL AND q.option_c IS NOT NULL AND q.option_d IS NOT NULL AND q.correct_option IN ('A','B','C','D'))::int mcq_ready FROM chapters c LEFT JOIN questions q ON q.chapter_id=c.id WHERE c.subject_id=$1 GROUP BY c.id ORDER BY c.chapter_number::text`,[req.params.subjectId]);res.json({success:true,chapters:r.rows});}catch(e){res.status(500).json({success:false,error:'Unable to load chapters'});}
});
app.get('/api/admin/exam-management/history', async(req,res)=>{
  try{const r=await pool.query(`SELECT mt.id,COALESCE(s.name,'Unknown') student_name,COALESCE(sub.name,'Unknown') subject_name,mt.total_questions,mt.known_count correct,mt.revision_count,mt.score,mt.is_submitted,mt.created_at FROM mock_tests mt LEFT JOIN students s ON s.id=mt.student_id LEFT JOIN subjects sub ON sub.id=mt.subject_id ORDER BY mt.created_at DESC LIMIT 100`);res.json({success:true,tests:r.rows});}catch(e){res.status(500).json({success:false,error:'Unable to load exam history'});}
});
app.get('/api/admin/mcq-management/stats', async(req,res)=>{
  try{const r=await pool.query(`SELECT COUNT(*) FILTER(WHERE is_active=TRUE)::int active,COUNT(*) FILTER(WHERE is_active=TRUE AND option_a IS NOT NULL AND option_b IS NOT NULL AND option_c IS NOT NULL AND option_d IS NOT NULL)::int with_options,COUNT(*) FILTER(WHERE is_active=TRUE AND correct_option IN ('A','B','C','D'))::int with_answer FROM questions`);res.json({success:true,stats:r.rows[0]});}catch(e){res.status(500).json({success:false,error:'Unable to load MCQ stats'});}
});

// STAGE 10 STEP 24 - AUTOMATIC MCQ EXAM SYSTEM
// ================================================
async function ensureMCQColumns() {
    await pool.query(`
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_a TEXT;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_b TEXT;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_c TEXT;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_d TEXT;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_option VARCHAR(1);
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS mcq_explanation TEXT;
    `);
}

app.get('/api/admin/mcq-readiness', async (req,res) => {
    try {
        const r=await pool.query(`
            SELECT s.id AS subject_id,s.name AS subject_name,
                   COUNT(q.id) FILTER (WHERE q.is_active=TRUE)::int AS active_questions,
                   COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND q.option_a IS NOT NULL AND q.option_b IS NOT NULL AND q.option_c IS NOT NULL AND q.option_d IS NOT NULL AND q.correct_option IN ('A','B','C','D'))::int AS mcq_ready,
                   GREATEST(0,20-COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND q.option_a IS NOT NULL AND q.option_b IS NOT NULL AND q.option_c IS NOT NULL AND q.option_d IS NOT NULL AND q.correct_option IN ('A','B','C','D')))::int AS gap
            FROM subjects s LEFT JOIN chapters c ON c.subject_id=s.id AND c.is_active=TRUE
            LEFT JOIN questions q ON q.chapter_id=c.id
            GROUP BY s.id,s.name ORDER BY s.id`);
        res.json({success:true,subjects:r.rows});
    } catch(e){console.error(e);res.status(500).json({success:false,error:'Unable to load MCQ readiness'});}
});

app.get('/api/admin/mcq-questions', async (req,res) => {
    try {
        const subjectId=Number(req.query.subjectId)||0, chapterId=Number(req.query.chapterId)||0;
        if(!subjectId) return res.status(400).json({success:false,error:'Subject is required'});
        const r=await pool.query(`
            SELECT q.id,q.question_text,q.marks,q.difficulty,q.option_a,q.option_b,q.option_c,q.option_d,q.correct_option,q.mcq_explanation,
                   c.chapter_number,c.chapter_name
            FROM questions q JOIN chapters c ON c.id=q.chapter_id
            WHERE c.subject_id=$1 AND c.is_active=TRUE AND q.is_active=TRUE
              AND ($2=0 OR c.id=$2)
            ORDER BY c.chapter_number,q.id LIMIT 100`,[subjectId,chapterId]);
        res.json({success:true,questions:r.rows});
    } catch(e){console.error(e);res.status(500).json({success:false,error:'Unable to load MCQ questions'});}
});

app.put('/api/admin/mcq-questions/:questionId', async (req,res) => {
    try {
        const id=Number(req.params.questionId), {option_a,option_b,option_c,option_d,correct_option,mcq_explanation}=req.body||{};
        if(!id) return res.status(400).json({success:false,error:'Question ID is required'});
        if(![option_a,option_b,option_c,option_d].every(x=>String(x||'').trim())) return res.status(400).json({success:false,error:'All four options are required'});
        if(!['A','B','C','D'].includes(String(correct_option||'').toUpperCase())) return res.status(400).json({success:false,error:'Correct option must be A, B, C or D'});
        const r=await pool.query(`UPDATE questions SET option_a=$1,option_b=$2,option_c=$3,option_d=$4,correct_option=$5,mcq_explanation=$6,question_type='MCQ' WHERE id=$7 RETURNING id`,[String(option_a).trim(),String(option_b).trim(),String(option_c).trim(),String(option_d).trim(),String(correct_option).toUpperCase(),String(mcq_explanation||'').trim()||null,id]);
        if(!r.rows.length) return res.status(404).json({success:false,error:'Question not found'});
        res.json({success:true,message:'MCQ saved'});
    } catch(e){console.error(e);res.status(500).json({success:false,error:'Unable to save MCQ'});}
});

// STAGE 10 STEP 23 - MOCK TEST SYSTEM
// ================================================
async function ensureMockTestTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS mock_tests (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
            started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            submitted_at TIMESTAMP,
            total_questions INTEGER NOT NULL DEFAULT 20,
            known_count INTEGER NOT NULL DEFAULT 0,
            revision_count INTEGER NOT NULL DEFAULT 0,
            score INTEGER NOT NULL DEFAULT 0,
            is_submitted BOOLEAN NOT NULL DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS mock_test_questions (
            id SERIAL PRIMARY KEY,
            test_id INTEGER NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
            question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
            question_order INTEGER NOT NULL,
            student_status VARCHAR(20),
            selected_option VARCHAR(1),
            is_correct BOOLEAN,
            UNIQUE(test_id, question_id)
        );
    `);
}

app.get('/api/students/:studentId/mock-test/subjects', async (req,res) => {
    try {
        const r = await pool.query(`
            SELECT s.id, s.name,
                   COUNT(q.id) FILTER (WHERE q.is_active=TRUE)::INTEGER AS question_count,
                   COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND q.option_a IS NOT NULL AND q.option_b IS NOT NULL AND q.option_c IS NOT NULL AND q.option_d IS NOT NULL AND q.correct_option IN ('A','B','C','D'))::INTEGER AS mcq_ready
            FROM subjects s
            LEFT JOIN chapters c ON c.subject_id=s.id AND c.is_active=TRUE
            LEFT JOIN questions q ON q.chapter_id=c.id
            GROUP BY s.id,s.name ORDER BY s.id`);
        res.json(r.rows);
    } catch(e) { console.error(e); res.status(500).json({error:'Unable to load mock test subjects'}); }
});

app.post('/api/students/:studentId/mock-test/start', async (req,res) => {
    const client=await pool.connect();
    try {
        const studentId=Number(req.params.studentId), subjectId=Number(req.body.subjectId);
        if(!studentId || !subjectId) return res.status(400).json({error:'Student and subject are required'});
        const qs=await client.query(`
            SELECT q.id,q.question_text,q.marks,q.hint,q.keywords,q.difficulty,
                   q.option_a,q.option_b,q.option_c,q.option_d,q.correct_option,q.mcq_explanation,
                   c.chapter_number,c.chapter_name
            FROM questions q JOIN chapters c ON c.id=q.chapter_id
            WHERE c.subject_id=$1 AND c.is_active=TRUE AND q.is_active=TRUE
              AND q.option_a IS NOT NULL AND q.option_b IS NOT NULL AND q.option_c IS NOT NULL AND q.option_d IS NOT NULL
              AND q.correct_option IN ('A','B','C','D')
            ORDER BY RANDOM() LIMIT 20`,[subjectId]);
        if(qs.rows.length<20) return res.status(400).json({error:`This subject has only ${qs.rows.length} MCQ-ready questions. Admin must prepare at least 20 MCQs.`});
        await client.query('BEGIN');
        const t=await client.query(`INSERT INTO mock_tests(student_id,subject_id,total_questions) VALUES($1,$2,$3) RETURNING *`,[studentId,subjectId,qs.rows.length]);
        for(let i=0;i<qs.rows.length;i++) await client.query(`INSERT INTO mock_test_questions(test_id,question_id,question_order) VALUES($1,$2,$3)`,[t.rows[0].id,qs.rows[i].id,i+1]);
        await client.query('COMMIT');
        res.json({success:true,test:t.rows[0],questions:qs.rows.map(q=>({...q,easy_answer:undefined}))});
    } catch(e){await client.query('ROLLBACK'); console.error(e); res.status(500).json({error:'Unable to start mock test'});} finally{client.release();}
});

app.get('/api/students/:studentId/mock-test/:testId', async (req,res)=>{
    try {
        const r=await pool.query(`
            SELECT mt.*,s.name AS subject_name,
                   COALESCE(json_agg(json_build_object('id',q.id,'question_text',q.question_text,'marks',q.marks,'hint',q.hint,'difficulty',q.difficulty,'option_a',q.option_a,'option_b',q.option_b,'option_c',q.option_c,'option_d',q.option_d,'question_order',mtq.question_order,'student_status',mtq.student_status,'selected_option',mtq.selected_option,'is_correct',mtq.is_correct) ORDER BY mtq.question_order) FILTER (WHERE q.id IS NOT NULL),'[]') AS questions
            FROM mock_tests mt JOIN subjects s ON s.id=mt.subject_id
            LEFT JOIN mock_test_questions mtq ON mtq.test_id=mt.id
            LEFT JOIN questions q ON q.id=mtq.question_id
            WHERE mt.id=$1 AND mt.student_id=$2 GROUP BY mt.id,s.name`,[req.params.testId,req.params.studentId]);
        if(!r.rows.length) return res.status(404).json({error:'Mock test not found'}); res.json(r.rows[0]);
    } catch(e){console.error(e);res.status(500).json({error:'Unable to load mock test'});}
});

app.get('/api/students/:studentId/mock-test-history', async (req,res)=>{
    try {
        const r=await pool.query(`
            SELECT mt.id, mt.subject_id, s.name AS subject_name, mt.started_at, mt.submitted_at,
                   mt.total_questions, mt.known_count AS correct, mt.revision_count, mt.score, mt.is_submitted
            FROM mock_tests mt
            JOIN subjects s ON s.id=mt.subject_id
            WHERE mt.student_id=$1
            ORDER BY mt.started_at DESC
            LIMIT 20`, [req.params.studentId]);
        res.json(r.rows);
    } catch(e){ console.error(e); res.status(500).json({error:'Unable to load mock test history'}); }
});

app.post('/api/students/:studentId/mock-test/:testId/submit', async (req,res)=>{
    const client=await pool.connect();
    try {
        const studentId=Number(req.params.studentId),testId=Number(req.params.testId),answers=req.body.answers||{};
        const t=await client.query(`SELECT * FROM mock_tests WHERE id=$1 AND student_id=$2`,[testId,studentId]);
        if(!t.rows.length) return res.status(404).json({error:'Mock test not found'});
        if(t.rows[0].is_submitted) return res.json({success:true,alreadySubmitted:true,test:t.rows[0]});
        await client.query('BEGIN');
        let correct=0,wrong=0,unanswered=0;
        const rows=await client.query(`SELECT mtq.question_id,q.correct_option FROM mock_test_questions mtq JOIN questions q ON q.id=mtq.question_id WHERE mtq.test_id=$1 ORDER BY mtq.question_order`,[testId]);
        for(const row of rows.rows) {
            const selected=String(answers[row.question_id]||'').toUpperCase();
            const st=selected==='A'||selected==='B'||selected==='C'||selected==='D' ? (selected===row.correct_option?'correct':'wrong') : 'unanswered';
            if(st==='correct') correct++; else if(st==='wrong') wrong++; else unanswered++;
            await client.query(`UPDATE mock_test_questions SET student_status=$1,selected_option=$2,is_correct=$3 WHERE test_id=$4 AND question_id=$5`,[st,selected||null,st==='correct'?true:st==='wrong'?false:null,testId,row.question_id]);
        }
        const total=t.rows[0].total_questions; const score=Math.round((correct/total)*100);
        const upd=await client.query(`UPDATE mock_tests SET submitted_at=CURRENT_TIMESTAMP,known_count=$1,revision_count=$2,score=$3,is_submitted=TRUE WHERE id=$4 RETURNING *`,[correct,wrong+unanswered,score,testId]);
        const pass=score>=40;
        await client.query('COMMIT'); res.json({success:true,test:upd.rows[0],correct,wrong,unanswered,pass,message:'MCQ Mock Test submitted'});
    } catch(e){await client.query('ROLLBACK');console.error(e);res.status(500).json({error:'Unable to submit mock test'});} finally{client.release();}
});


// ================================================
// STAGE 10 STEP 27 - EXAM RESULT ANALYSIS + WEAK TOPICS
// ================================================
app.get('/api/students/:studentId/exam-analysis', async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);
        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({ success:false, error:'Invalid student ID' });
        }

        const summaryQ = await pool.query(`
            SELECT COUNT(*)::INTEGER AS tests_completed,
                   COALESCE(ROUND(AVG(score)),0)::INTEGER AS average_score,
                   COALESCE(MAX(score),0)::INTEGER AS best_score,
                   COALESCE((ARRAY_AGG(score ORDER BY submitted_at DESC))[1],0)::INTEGER AS latest_score
            FROM mock_tests
            WHERE student_id=$1 AND is_submitted=TRUE`, [studentId]);

        const subjectQ = await pool.query(`
            SELECT s.id AS subject_id, s.name AS subject_name,
                   COUNT(mt.id)::INTEGER AS tests,
                   COALESCE(ROUND(AVG(mt.score)),0)::INTEGER AS average_score,
                   COALESCE(MAX(mt.score),0)::INTEGER AS best_score,
                   COALESCE((ARRAY_AGG(mt.score ORDER BY mt.submitted_at DESC))[1],0)::INTEGER AS latest_score
            FROM mock_tests mt
            JOIN subjects s ON s.id=mt.subject_id
            WHERE mt.student_id=$1 AND mt.is_submitted=TRUE
            GROUP BY s.id,s.name
            ORDER BY average_score ASC, s.id`, [studentId]);

        const chapterQ = await pool.query(`
            SELECT s.id AS subject_id, s.name AS subject_name,
                   c.id AS chapter_id, c.chapter_number, c.chapter_name,
                   COUNT(mtq.id)::INTEGER AS attempted,
                   COUNT(*) FILTER (WHERE mtq.is_correct=TRUE)::INTEGER AS correct,
                   COUNT(*) FILTER (WHERE mtq.is_correct=FALSE)::INTEGER AS wrong,
                   COUNT(*) FILTER (WHERE mtq.student_status='unanswered')::INTEGER AS unanswered,
                   CASE WHEN COUNT(mtq.id)>0
                        THEN ROUND((COUNT(*) FILTER (WHERE mtq.is_correct=TRUE)::NUMERIC / COUNT(mtq.id)) * 100)::INTEGER
                        ELSE 0 END AS accuracy
            FROM mock_test_questions mtq
            JOIN mock_tests mt ON mt.id=mtq.test_id AND mt.is_submitted=TRUE
            JOIN questions q ON q.id=mtq.question_id
            JOIN chapters c ON c.id=q.chapter_id
            JOIN subjects s ON s.id=c.subject_id
            WHERE mt.student_id=$1
            GROUP BY s.id,s.name,c.id,c.chapter_number,c.chapter_name
            ORDER BY accuracy ASC, attempted DESC, c.id
        `, [studentId]);

        const mistakesQ = await pool.query(`
            SELECT q.id AS question_id, q.question_text, q.correct_option,
                   q.option_a,q.option_b,q.option_c,q.option_d,q.mcq_explanation,
                   c.id AS chapter_id,c.chapter_number,c.chapter_name,
                   s.id AS subject_id,s.name AS subject_name,
                   COUNT(*) FILTER (WHERE mtq.is_correct=FALSE)::INTEGER AS wrong_count,
                   COUNT(*) FILTER (WHERE mtq.student_status='unanswered')::INTEGER AS unanswered_count,
                   (ARRAY_AGG(mtq.selected_option ORDER BY mt.submitted_at DESC))[1] AS latest_selected_option
            FROM mock_test_questions mtq
            JOIN mock_tests mt ON mt.id=mtq.test_id AND mt.is_submitted=TRUE
            JOIN questions q ON q.id=mtq.question_id
            JOIN chapters c ON c.id=q.chapter_id
            JOIN subjects s ON s.id=c.subject_id
            WHERE mt.student_id=$1 AND (mtq.is_correct=FALSE OR mtq.student_status='unanswered')
            GROUP BY q.id,q.question_text,q.correct_option,q.option_a,q.option_b,q.option_c,q.option_d,q.mcq_explanation,
                     c.id,c.chapter_number,c.chapter_name,s.id,s.name
            ORDER BY (COUNT(*) FILTER (WHERE mtq.is_correct=FALSE) + COUNT(*) FILTER (WHERE mtq.student_status='unanswered')) DESC,
                     q.id
            LIMIT 10`, [studentId]);

        const summary = summaryQ.rows[0] || {tests_completed:0,average_score:0,best_score:0,latest_score:0};
        const weakChapters = chapterQ.rows.filter(r => Number(r.accuracy) < 60).slice(0, 8);
        const recommendations = [];
        if (Number(summary.tests_completed) === 0) {
            recommendations.push('पहिला MCQ Mock Test द्या. त्यानंतर तुमचे weak topics आपोआप दिसतील.');
        } else {
            if (Number(summary.average_score) < 40) recommendations.push('सध्या average score 40% पेक्षा कमी आहे. Weak chapters चा Easy Answer + Revision सराव करा.');
            else if (Number(summary.average_score) < 60) recommendations.push('PASS स्तर जवळ आहे. Weak chapters वर लक्ष केंद्रित करून पुन्हा Mock Test द्या.');
            else recommendations.push('तुमचा average score चांगला आहे. आता repeated mistakes आणि PYQ वर लक्ष द्या.');
            if (weakChapters.length) recommendations.push(`${weakChapters[0].chapter_name} हा सध्या सर्वात कमजोर दिसणारा chapter आहे; प्रथम त्याचा सराव करा.`);
            if (mistakesQ.rows.length) recommendations.push('Repeated Wrong Questions पुन्हा सोडवा आणि योग्य उत्तराचे explanation वाचा.');
        }

        res.json({
            success:true,
            summary,
            subjectStats:subjectQ.rows,
            chapterStats:chapterQ.rows,
            weakChapters,
            repeatedMistakes:mistakesQ.rows,
            recommendations
        });
    } catch (e) {
        console.error('Exam Analysis Error:', e);
        res.status(500).json({success:false,error:'Unable to load exam analysis'});
    }
});


// ================================================
// STAGE 10 STEP 28 - SMART REVISION + 7-DAY PLAN
// ================================================
app.get('/api/students/:studentId/smart-study-plan', async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);
        if (!Number.isInteger(studentId) || studentId <= 0) return res.status(400).json({success:false,error:'Invalid student ID'});

        const q = await pool.query(`
            SELECT s.id AS subject_id, s.name AS subject_name,
                   c.id AS chapter_id, c.chapter_number, c.chapter_name,
                   COUNT(mtq.id)::INTEGER AS attempted,
                   COUNT(*) FILTER (WHERE mtq.is_correct=TRUE)::INTEGER AS correct,
                   COUNT(*) FILTER (WHERE mtq.is_correct=FALSE)::INTEGER AS wrong,
                   COUNT(*) FILTER (WHERE mtq.student_status='unanswered')::INTEGER AS unanswered,
                   CASE WHEN COUNT(mtq.id)>0 THEN ROUND((COUNT(*) FILTER (WHERE mtq.is_correct=TRUE)::NUMERIC / COUNT(mtq.id))*100)::INTEGER ELSE 0 END AS accuracy
            FROM mock_test_questions mtq
            JOIN mock_tests mt ON mt.id=mtq.test_id AND mt.is_submitted=TRUE
            JOIN questions qu ON qu.id=mtq.question_id
            JOIN chapters c ON c.id=qu.chapter_id
            JOIN subjects s ON s.id=c.subject_id
            WHERE mt.student_id=$1
            GROUP BY s.id,s.name,c.id,c.chapter_number,c.chapter_name
            ORDER BY accuracy ASC, attempted DESC, c.id
        `,[studentId]);

        const all = q.rows;
        const weak = all.filter(x=>Number(x.accuracy)<60).slice(0,12);
        const needs = all.filter(x=>Number(x.accuracy)>=60 && Number(x.accuracy)<80).slice(0,8);
        const strong = all.filter(x=>Number(x.accuracy)>=80).slice(0,8);
        const priority = [...weak,...needs];
        const plan=[];
        for(let day=1; day<=7; day++) {
            const primary = priority[(day-1)%Math.max(priority.length,1)];
            const secondary = priority[day%Math.max(priority.length,1)];
            const actions = day===7 ? ['Full revision of mistakes','Take one MCQ Mock Test','Compare score with previous best'] : ['Read Easy Answer / notes','Practice chapter questions','Revise wrong or unanswered questions'];
            plan.push({day, focus: primary ? {subjectName:primary.subject_name,chapterId:primary.chapter_id,chapterNumber:primary.chapter_number,chapterName:primary.chapter_name,accuracy:Number(primary.accuracy)} : null, secondFocus: secondary && primary && secondary.chapter_id!==primary.chapter_id ? {subjectName:secondary.subject_name,chapterId:secondary.chapter_id,chapterNumber:secondary.chapter_number,chapterName:secondary.chapter_name,accuracy:Number(secondary.accuracy)} : null, actions});
        }
        const next = weak[0] || needs[0] || strong[0] || null;
        const message = !all.length ? 'पहिला Automatic MCQ Mock Test द्या. त्यानंतर तुमच्यासाठी Smart Plan अधिक अचूक बनेल.' : weak.length ? `${weak[0].chapter_name} हा सध्या तुमचा Priority Chapter आहे. प्रथम त्याचा Easy Answer आणि Practice करा.` : 'तुमची accuracy चांगली आहे. आता revision, repeated mistakes आणि Mock Tests वर लक्ष द्या.';
        res.json({success:true,hasExamData:all.length>0,priority:next,weakChapters:weak,needsImprovement:needs,strongChapters:strong,sevenDayPlan:plan,message});
    } catch(e) { console.error('Smart Study Plan Error:',e); res.status(500).json({success:false,error:'Unable to create smart study plan'}); }
});

app.get('/api/students/:studentId/mock-test/:testId/result-details', async (req,res) => {
    try {
        const r = await pool.query(`
            SELECT mt.id AS test_id, mt.score, mt.total_questions, mt.known_count AS correct_count,
                   mt.revision_count, mt.submitted_at, s.name AS subject_name,
                   mtq.question_order, mtq.student_status, mtq.selected_option, mtq.is_correct,
                   q.id AS question_id,q.question_text,q.option_a,q.option_b,q.option_c,q.option_d,
                   q.correct_option,q.mcq_explanation,c.id AS chapter_id,c.chapter_number,c.chapter_name
            FROM mock_tests mt
            JOIN subjects s ON s.id=mt.subject_id
            JOIN mock_test_questions mtq ON mtq.test_id=mt.id
            JOIN questions q ON q.id=mtq.question_id
            JOIN chapters c ON c.id=q.chapter_id
            WHERE mt.id=$1 AND mt.student_id=$2 AND mt.is_submitted=TRUE
            ORDER BY mtq.question_order`, [Number(req.params.testId), Number(req.params.studentId)]);
        if (!r.rows.length) return res.status(404).json({success:false,error:'Submitted mock test not found'});
        const first=r.rows[0];
        res.json({success:true,test:{id:first.test_id,subject_name:first.subject_name,score:first.score,total_questions:first.total_questions,correct:first.correct_count,revision_count:first.revision_count,submitted_at:first.submitted_at},questions:r.rows});
    } catch(e) {
        console.error(e); res.status(500).json({success:false,error:'Unable to load result details'});
    }
});

// ================================================
// START SERVER
// ================================================
// Initialize database tables only AFTER all helper functions have been
// declared. This prevents a startup-time ReferenceError when a helper
// such as ensureMockTestTables is declared later in this file.
ensureDailyPracticeTables()
    .then(() => ensureMockTestTables())
    .then(() => ensureMCQColumns())
    .then(() => {
        app.listen(PORT, () => {
            console.log(`10th Pass Master server is running on port ${PORT}`);
            console.log("Stage 8 Step 3 daily practice tracking is ready.");
        });
    })
    .catch((error) => {
        console.error("Unable to initialize database tables:", error);
        process.exit(1);
    });

