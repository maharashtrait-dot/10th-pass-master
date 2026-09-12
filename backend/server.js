require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pool = require("./db");

const app = express();

// Allow the Admin/Frontend page to call the backend when VS Code Live Server
// or another local frontend server is used (for example localhost:5500).
// This fixes browser "Failed to fetch" errors caused by cross-origin API calls.
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && /^https?:\/\/(localhost|127\.0\.1)(:\d+)?$/.test(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

const PORT = process.env.PORT || 3001;

// STEP 63 - lightweight health check for final testing and hosting.
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ success: true, status: "ok", database: "connected" });
    } catch (error) {
        console.error("Health check database error:", error.message);
        res.status(503).json({ success: false, status: "degraded", database: "disconnected" });
    }
});


// ================================================
// MIDDLEWARE
// ================================================

app.use(cors());

app.use(express.json());

// ================================================
// SERVE FRONTEND
// STEP 59 - prevent stale dashboard HTML/JS from hiding new PASS progress UI
// ================================================
app.use(express.static(path.join(__dirname, "..", "frontend"), {
    setHeaders: (res, filePath) => {
        if (/\.(html|js|css)$/i.test(filePath)) {
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
        }
    }
}));



// ================================================
// HOME ROUTE
// ================================================


// ================================================
// STEP 36 - PYQ AUTHENTICITY / PRIORITY LAYER
// ================================================
async function ensurePYQMetadata() {
    await pool.query(`
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_type VARCHAR(30) DEFAULT 'PRACTICE';
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS pyq_exam_month VARCHAR(30);
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS pyq_paper_set VARCHAR(80);
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS pyq_frequency INTEGER DEFAULT 1;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS pyq_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS visual_tag VARCHAR(120);
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_note TEXT;
    `);
    await pool.query(`
        UPDATE questions
        SET source_type = CASE
            WHEN COALESCE(question_type,'')='Important' THEN 'IMPORTANT'
            WHEN COALESCE(question_type,'')='PYQ' OR pyq_year IS NOT NULL THEN 'PRACTICE'
            ELSE 'PRACTICE'
        END
        WHERE source_type IS NULL;
    `);
}

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
            const rawSubjectName = String(row.subject_name || '').trim();
            const subjectName = rawSubjectName.toLowerCase() === 'hindi lokbharati' ? 'Hindi' : rawSubjectName;
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
            const rawSubjectName = String(row.subject_name || '').trim();
            const subjectName = rawSubjectName.toLowerCase() === 'marathi kumarbharati' ? 'Marathi' : rawSubjectName;
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
            const rawSubjectName = String(row.subject_name || '').trim();
            const subjectName = rawSubjectName.toLowerCase() === 'marathi kumarbharati' ? 'Marathi' : (rawSubjectName.toLowerCase() === 'hindi lokbharati' ? 'Hindi' : rawSubjectName);
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
// STEP 61 — SPACED REVISION QUEUE (ADDITIVE)
// Uses existing student_question_progress.updated_at; no DB migration.
// ================================================
app.get("/api/students/:studentId/spaced-revision", async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);
        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({ success:false, error:"Invalid student ID" });
        }
        const result = await pool.query(`
            SELECT q.id, q.chapter_id, q.question_text, q.marks, q.hint,
                   q.easy_answer, q.keywords, q.question_type, q.difficulty,
                   q.pyq_year, c.chapter_number, c.chapter_name,
                   s.name AS subject_name, p.updated_at
            FROM questions q
            JOIN chapters c ON q.chapter_id=c.id
            JOIN subjects s ON c.subject_id=s.id
            JOIN student_question_progress p
              ON p.question_id=q.id AND p.student_id=$1
            WHERE q.is_active=TRUE AND p.status='revision'
            ORDER BY p.updated_at ASC, q.marks DESC, q.id ASC
            LIMIT 50`, [studentId]);

        const now=Date.now();
        const rows=result.rows.map(r=>{
            const updated=new Date(r.updated_at).getTime();
            const ageDays=Math.max(0, Math.floor((now-updated)/86400000));
            let interval=1;
            if(ageDays>=14) interval=14;
            else if(ageDays>=7) interval=7;
            else if(ageDays>=3) interval=3;
            const due=ageDays>=interval;
            const nextReviewAt=new Date(updated+interval*86400000).toISOString();
            return {...r, ageDays, reviewIntervalDays:interval, due, nextReviewAt};
        });
        const due=rows.filter(x=>x.due);
        const upcoming=rows.filter(x=>!x.due).slice(0,20);
        res.json({success:true, revisionCount:rows.length, dueCount:due.length, due, upcoming,
            message: due.length ? `${due.length} questions are due for revision today.` : "No revision questions are due today. Keep learning and return on the suggested date."});
    } catch(error){
        console.error("Spaced Revision Error:",error);
        res.status(500).json({success:false,error:"Unable to load spaced revision"});
    }
});

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
// STEP 36 - PYQ-FIRST QUESTION FEED
// ================================================
app.get('/api/chapters/:chapterId/pyq-questions', async (req,res) => {
    try {
        const chapterId = Number(req.params.chapterId);
        const studentId = Number(req.query.studentId) || null;
        if (!chapterId) return res.status(400).json({success:false,error:'Chapter ID is required'});
        const r = await pool.query(`
            SELECT q.id,q.chapter_id,q.question_text,q.marks,q.hint,q.easy_answer,q.keywords,
                   q.question_type,q.difficulty,q.pyq_year,q.source_type,q.pyq_exam_month,q.pyq_paper_set,
                   q.pyq_frequency,q.pyq_verified,q.visual_tag,q.source_note,
                   COALESCE(p.status,'not_started') AS student_status
            FROM questions q
            LEFT JOIN student_question_progress p ON p.question_id=q.id AND p.student_id=$2
            WHERE q.chapter_id=$1 AND q.is_active=TRUE
              AND (q.source_type IN ('ACTUAL_PYQ','PYQ_REPEATED') OR q.question_type='PYQ' OR q.pyq_year IS NOT NULL)
            ORDER BY CASE WHEN q.source_type='ACTUAL_PYQ' THEN 1 ELSE 2 END,
                     COALESCE(q.pyq_frequency,1) DESC, q.pyq_year DESC NULLS LAST, q.id
        `,[chapterId,studentId]);
        res.json({success:true,count:r.rows.length,questions:r.rows});
    } catch(e){ console.error('PYQ feed error:',e); res.status(500).json({success:false,error:'Unable to load PYQ questions'}); }
});

app.get('/api/students/:studentId/pyq-priority', async (req,res) => {
    try {
        const studentId=Number(req.params.studentId), limit=Math.min(Math.max(Number(req.query.limit)||20,1),50);
        const r=await pool.query(`
          SELECT q.id,q.question_text,q.marks,q.easy_answer,q.keywords,q.question_type,q.difficulty,q.pyq_year,
                 q.source_type,q.pyq_exam_month,q.pyq_paper_set,q.pyq_frequency,q.pyq_verified,q.visual_tag,
                 c.chapter_number,c.chapter_name,s.name subject_name,COALESCE(p.status,'not_started') student_status
          FROM questions q JOIN chapters c ON c.id=q.chapter_id JOIN subjects s ON s.id=c.subject_id
          LEFT JOIN student_question_progress p ON p.question_id=q.id AND p.student_id=$1
          WHERE q.is_active=TRUE AND (q.source_type IN ('ACTUAL_PYQ','PYQ_REPEATED') OR q.question_type='PYQ' OR q.pyq_year IS NOT NULL)
          ORDER BY CASE WHEN p.status='revision' THEN 1 WHEN p.status IS NULL THEN 2 ELSE 3 END,
                   CASE WHEN q.source_type='ACTUAL_PYQ' THEN 1 ELSE 2 END,
                   COALESCE(q.pyq_frequency,1) DESC,q.pyq_year DESC NULLS LAST
          LIMIT $2`,[studentId,limit]);
        res.json({success:true,count:r.rows.length,questions:r.rows});
    } catch(e){ console.error(e); res.status(500).json({success:false,error:'Unable to load PYQ priority questions'}); }
});


// ================================================
// STEP 56 - PYQ MASTER / PASS PRIORITY ENGINE
// Additive: uses only verified actual PYQs and student progress.
// ================================================
app.get('/api/students/:studentId/pyq-master-priority', async (req,res) => {
  try {
    const studentId=Number(req.params.studentId);
    const limit=Math.min(Math.max(Number(req.query.limit)||40,1),80);
    if(!Number.isInteger(studentId)||studentId<=0) return res.status(400).json({success:false,error:'Invalid student ID'});
    const r=await pool.query(`
      SELECT q.id,q.question_text,q.marks,q.easy_answer,q.keywords,q.difficulty,q.pyq_year,
             q.source_type,q.pyq_frequency,q.pyq_verified,q.visual_tag,
             c.id chapter_id,c.chapter_number,c.chapter_name,s.id subject_id,s.name subject_name,
             COALESCE(p.status,'not_started') student_status
      FROM questions q
      JOIN chapters c ON c.id=q.chapter_id AND c.is_active=TRUE
      JOIN subjects s ON s.id=c.subject_id
      LEFT JOIN student_question_progress p ON p.question_id=q.id AND p.student_id=$1
      WHERE q.is_active=TRUE
        AND q.pyq_verified=TRUE
        AND q.pyq_year IS NOT NULL
        AND q.source_type IN ('ACTUAL_PYQ','PYQ_REPEATED')
      ORDER BY
        CASE WHEN p.status='revision' THEN 0 WHEN p.status IS NULL THEN 1 ELSE 2 END,
        CASE WHEN q.source_type='PYQ_REPEATED' THEN 0 ELSE 1 END,
        COALESCE(q.pyq_frequency,1) DESC,
        CASE WHEN q.marks>=3 THEN 0 WHEN q.marks=2 THEN 1 ELSE 2 END,
        CASE WHEN q.difficulty='Easy' THEN 0 WHEN q.difficulty='Medium' THEN 1 ELSE 2 END,
        q.pyq_year DESC,q.id
      LIMIT $2`,[studentId,limit]);

    const rows=r.rows.map(x=>({
      ...x,
      priorityScore:(x.student_status==='revision'?40:x.student_status==='not_started'?30:10)
        +(x.source_type==='PYQ_REPEATED'?30:20)
        +Math.min(Number(x.pyq_frequency)||1,5)*5
        +(Number(x.marks)>=3?10:Number(x.marks)===2?6:3)
    }));
    const chapterMap=new Map();
    for(const x of rows){
      const k=`${x.subject_id}|${x.chapter_id}`;
      if(!chapterMap.has(k)) chapterMap.set(k,{subject_id:Number(x.subject_id),subject_name:x.subject_name,chapter_id:Number(x.chapter_id),chapter_number:x.chapter_number,chapter_name:x.chapter_name,total:0,unstarted:0,revision:0,repeated:0,score:0});
      const c=chapterMap.get(k); c.total++; if(x.student_status==='not_started')c.unstarted++; if(x.student_status==='revision')c.revision++; if(x.source_type==='PYQ_REPEATED')c.repeated++; c.score+=Number(x.priorityScore)||0;
    }
    const chapters=[...chapterMap.values()].sort((a,b)=>b.score-a.score||b.repeated-a.repeated||b.unstarted-a.unstarted).slice(0,10);
    res.json({success:true,count:rows.length,questions:rows,priorityChapters:chapters,message:rows.length?'Follow the list from top to bottom: Revision → Unstarted → Repeated → high-mark PYQs.':'No verified PYQs are available yet.'});
  } catch(e){ console.error('STEP 56 PYQ Master error:',e); res.status(500).json({success:false,error:'Unable to load PYQ Master priority'}); }
});


// ================================================
// STEP 59 — WEAK CHAPTER ACTION ENGINE
// Weak Chapter -> Easy Answers -> Repeated PYQ -> Practice -> Mini Mock
// Additive only. Uses existing question/progress data; no DB changes.
// ================================================
app.get('/api/students/:studentId/weak-chapter-engine', async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);
        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({ success:false, error:'Invalid student ID' });
        }
        const student = await pool.query(`SELECT id,name FROM students WHERE id=$1 LIMIT 1`, [studentId]);
        if (!student.rows.length) return res.status(404).json({ success:false, error:'Student not found' });

        const chaptersResult = await pool.query(`
            SELECT
                s.id AS subject_id, s.name AS subject_name,
                c.id AS chapter_id, c.chapter_number, c.chapter_name,
                COUNT(q.id)::INTEGER AS total,
                COUNT(q.id) FILTER (WHERE p.status='known')::INTEGER AS known,
                COUNT(q.id) FILTER (WHERE p.status='revision')::INTEGER AS revision,
                COUNT(q.id) FILTER (WHERE p.status IS NULL)::INTEGER AS not_started,
                COUNT(q.id) FILTER (
                    WHERE q.pyq_verified=TRUE AND q.pyq_year IS NOT NULL
                      AND q.source_type IN ('ACTUAL_PYQ','PYQ_REPEATED')
                )::INTEGER AS verified_pyq,
                COUNT(q.id) FILTER (
                    WHERE q.pyq_verified=TRUE AND q.source_type='PYQ_REPEATED'
                )::INTEGER AS repeated_pyq
            FROM chapters c
            JOIN subjects s ON s.id=c.subject_id
            LEFT JOIN questions q ON q.chapter_id=c.id AND q.is_active=TRUE
            LEFT JOIN student_question_progress p ON p.question_id=q.id AND p.student_id=$1
            WHERE c.is_active=TRUE
            GROUP BY s.id,s.name,c.id,c.chapter_number,c.chapter_name
            HAVING COUNT(q.id) > 0
        `, [studentId]);

        const chapters = chaptersResult.rows.map(r => {
            const total=Number(r.total)||0, known=Number(r.known)||0, revision=Number(r.revision)||0, notStarted=Number(r.not_started)||0;
            const mastery = total ? Math.round(known/total*100) : 0;
            const score = (100-mastery)*2 + revision*6 + notStarted*2 + (Number(r.repeated_pyq)||0)*5;
            return {
                subjectId:Number(r.subject_id), subjectName:r.subject_name,
                chapterId:Number(r.chapter_id), chapterNumber:String(r.chapter_number), chapterName:r.chapter_name,
                total, known, revision, notStarted,
                verifiedPyq:Number(r.verified_pyq)||0, repeatedPyq:Number(r.repeated_pyq)||0,
                masteryPercentage:mastery, priorityScore:score
            };
        }).sort((a,b)=>b.priorityScore-a.priorityScore || a.masteryPercentage-b.masteryPercentage).slice(0,8);

        for (const ch of chapters) {
            const qr = await pool.query(`
                SELECT q.id,q.question_text,q.easy_answer,q.hint,q.keywords,q.marks,q.difficulty,
                       q.pyq_year,q.source_type,q.pyq_frequency,
                       COALESCE(p.status,'not_started') AS student_status
                FROM questions q
                LEFT JOIN student_question_progress p ON p.question_id=q.id AND p.student_id=$1
                WHERE q.chapter_id=$2 AND q.is_active=TRUE
                ORDER BY
                  CASE WHEN p.status='revision' THEN 0 ELSE 1 END,
                  CASE WHEN q.pyq_verified=TRUE AND q.source_type='PYQ_REPEATED' THEN 0
                       WHEN q.pyq_verified=TRUE AND q.source_type='ACTUAL_PYQ' THEN 1 ELSE 2 END,
                  CASE WHEN p.status IS NULL THEN 0 ELSE 1 END,
                  COALESCE(q.pyq_frequency,1) DESC,
                  CASE WHEN q.marks>=3 THEN 0 WHEN q.marks=2 THEN 1 ELSE 2 END,
                  CASE WHEN q.difficulty='Easy' THEN 0 WHEN q.difficulty='Medium' THEN 1 ELSE 2 END,
                  q.id
                LIMIT 5
            `, [studentId, ch.chapterId]);
            ch.questions = qr.rows.map(q => ({
                id:Number(q.id), questionText:q.question_text, easyAnswer:q.easy_answer,
                hint:q.hint, keywords:q.keywords, marks:Number(q.marks)||1, difficulty:q.difficulty,
                pyqYear:q.pyq_year==null?null:Number(q.pyq_year), sourceType:q.source_type,
                pyqFrequency:Number(q.pyq_frequency)||1, studentStatus:q.student_status,
                isVerifiedPyq:q.pyq_verified===true
            }));
            ch.steps = [
                `Step 1: ${Math.min(5,ch.questions.length)} Easy/priority questions shika`,
                ch.repeatedPyq > 0 ? `Step 2: ${ch.repeatedPyq} Repeated PYQ revise kara` : 'Step 2: Available verified PYQ revise kara',
                'Step 3: Chapter Practice kara',
                'Step 4: Wrong/Revision questions punha solve kara',
                'Step 5: Nantar short Mock Test dya'
            ];
        }

        const message = chapters.length
            ? `${chapters[0].chapterName} ha sadhya tumcha highest-priority weak chapter aahe. Khali dilelya क्रमाने practice kara.`
            : 'Ajun chapter-wise questions/progress data available nahi.';
        res.json({success:true, count:chapters.length, chapters, message});
    } catch(e) {
        console.error('STEP 59 Weak Chapter Engine Error:', e);
        res.status(500).json({success:false,error:'Unable to create weak chapter action plan'});
    }
});

// ================================================
// STEP 57 — 30-DAY PASS STUDY ENGINE
// Uses verified ACTUAL_PYQ/PYQ_REPEATED content + student progress.
// Additive endpoint; does not modify existing data.
// ================================================
app.get('/api/students/:studentId/pass-plan-30', async (req,res) => {
  try {
    const studentId=Number(req.params.studentId);
    if(!Number.isInteger(studentId)||studentId<=0) return res.status(400).json({success:false,error:'Invalid student ID'});
    const student=await pool.query(`SELECT id,name FROM students WHERE id=$1 LIMIT 1`,[studentId]);
    if(!student.rows.length) return res.status(404).json({success:false,error:'Student not found'});

    const r=await pool.query(`
      SELECT q.id,q.question_text,q.marks,q.easy_answer,q.keywords,q.difficulty,q.pyq_year,
             q.source_type,q.pyq_frequency,q.visual_tag,
             c.id chapter_id,c.chapter_number,c.chapter_name,
             s.id subject_id,s.name subject_name,
             COALESCE(p.status,'not_started') student_status
      FROM questions q
      JOIN chapters c ON c.id=q.chapter_id AND c.is_active=TRUE
      JOIN subjects s ON s.id=c.subject_id
      LEFT JOIN student_question_progress p ON p.question_id=q.id AND p.student_id=$1
      WHERE q.is_active=TRUE AND q.pyq_verified=TRUE AND q.pyq_year IS NOT NULL
        AND q.source_type IN ('ACTUAL_PYQ','PYQ_REPEATED')
      ORDER BY
        CASE WHEN p.status='revision' THEN 0 WHEN p.status IS NULL THEN 1 ELSE 2 END,
        CASE WHEN q.source_type='PYQ_REPEATED' THEN 0 ELSE 1 END,
        COALESCE(q.pyq_frequency,1) DESC,
        CASE WHEN q.marks>=3 THEN 0 WHEN q.marks=2 THEN 1 ELSE 2 END,
        CASE WHEN q.difficulty='Easy' THEN 0 WHEN q.difficulty='Medium' THEN 1 ELSE 2 END,
        q.pyq_year DESC,q.id
      LIMIT 300`,[studentId]);

    const rows=r.rows;
    const chapterMap=new Map();
    for(const q of rows){
      const key=`${q.subject_id}|${q.chapter_id}`;
      if(!chapterMap.has(key)) chapterMap.set(key,{subject_id:Number(q.subject_id),subject_name:q.subject_name,chapter_id:Number(q.chapter_id),chapter_number:String(q.chapter_number),chapter_name:q.chapter_name,total:0,unstarted:0,revision:0,repeated:0,score:0});
      const c=chapterMap.get(key); c.total++;
      if(q.student_status==='not_started') c.unstarted++;
      if(q.student_status==='revision') c.revision++;
      if(q.source_type==='PYQ_REPEATED') c.repeated++;
      c.score += (q.student_status==='revision'?40:q.student_status==='not_started'?30:10)+(q.source_type==='PYQ_REPEATED'?30:20)+Math.min(Number(q.pyq_frequency)||1,5)*5+(Number(q.marks)>=3?10:Number(q.marks)===2?6:3);
    }
    const chapters=[...chapterMap.values()].sort((a,b)=>b.score-a.score||b.repeated-a.repeated||b.unstarted-a.unstarted);

    // Build a balanced 30-day queue. Early days emphasize revision/unstarted/repeated PYQs;
    // later days emphasize mixed practice and final revision/mock work.
    const ordered=rows.slice();
    const byChapter=new Map();
    for(const q of ordered){const k=`${q.subject_id}|${q.chapter_id}`;(byChapter.get(k)||byChapter.set(k,[]).get(k)).push(q);}
    const queues=[...byChapter.entries()].sort((a,b)=>{
      const ca=chapterMap.get(a[0]), cb=chapterMap.get(b[0]); return (cb?.score||0)-(ca?.score||0);
    }).map(x=>x[1]);
    const flat=[]; let round=0;
    while(flat.length<ordered.length && round<20){ for(const q of queues){ if(q[round]) flat.push(q[round]); } round++; }
    const used=new Set();
    const plans=[];
    for(let day=1;day<=30;day++){
      const phase=day<=10?'Foundation':day<=20?'Practice':'Revision & Exam';
      const target=day===30?0:(day<=10?4:day<=20?5:6);
      const dayQuestions=[];
      if(target>0){
        let start=((day-1)*4)%Math.max(flat.length,1);
        for(let step=0;step<flat.length && dayQuestions.length<target;step++){
          const q=flat[(start+step)%flat.length];
          if(!q) continue;
          const key=String(q.id);
          if(used.has(key) && flat.length>=target*10) continue;
          dayQuestions.push({id:Number(q.id),question_text:q.question_text,easy_answer:q.easy_answer,marks:Number(q.marks)||1,subject_name:q.subject_name,chapter_number:String(q.chapter_number),chapter_name:q.chapter_name,pyq_year:Number(q.pyq_year),source_type:q.source_type,pyq_frequency:Number(q.pyq_frequency)||1,student_status:q.student_status});
          used.add(key);
        }
      }
      const focus=chapters[(day-1)%Math.max(chapters.length,1)]||null;
      const actions=day<=10
        ? ['Read the focus chapter basics for 20 minutes','Solve the selected verified PYQs','Write/remember the easy answers and keywords']
        : day<=20
        ? ['Revise yesterday’s mistakes','Solve the selected verified PYQs without seeing the answer','Mark wrong/unanswered questions for revision']
        : ['Revise important points and repeated PYQs','Solve the selected PYQs as exam practice','Review wrong and unanswered questions'];
      if(day%5===0 && day<30) actions.push('Take a short self-test and record your score');
      if(day===30) actions.push('Take a Mock Test and revise your final weak chapters');
      plans.push({day,phase,focus,questionCount:dayQuestions.length,questions:dayQuestions,actions});
    }
    const total=rows.length;
    const unstarted=rows.filter(q=>q.student_status==='not_started').length;
    const revision=rows.filter(q=>q.student_status==='revision').length;
    const repeated=rows.filter(q=>q.source_type==='PYQ_REPEATED').length;
    res.json({success:true,student:student.rows[0],stats:{verifiedPYQs:total,unstarted,revision,repeated,chapters:chapters.length},priorityChapters:chapters.slice(0,10),days:plans,message:total?`30-day plan built from ${total} verified PYQs. Follow Day 1 onward; the plan prioritizes revision, unstarted and repeated PYQs.`:'No verified PYQs are available yet.'});
  } catch(e){ console.error('STEP 57 PASS plan error:',e); res.status(500).json({success:false,error:'Unable to build 30-day PASS study plan'}); }
});

// Robust bundled JSON import for verified manual PYQs.
app.post('/api/admin/pyq-import-json', async (req,res)=>{
    const items=Array.isArray(req.body?.items)?req.body.items:[];
    if(!items.length) return res.status(400).json({success:false,error:'No PYQ items received'});
    const client=await pool.connect(); let imported=0,upgraded=0,skipped=0,failed=0; const errors=[];
    const chapterNames={
      '1':'Linear Equations in Two Variables','2':'Quadratic Equations','3':'Arithmetic Progression',
      '4':'Financial Planning','5':'Probability','6':'Statistics'
    };
    const normalizeChapterNumber=(v)=>String(v??'').trim().replace(/^0+(?=\d)/,'');
    try{
      await client.query('BEGIN');
      for(let i=0;i<items.length;i++){
        const row=items[i];
        try{
          const subjectName=String(row.subject_name||'').trim();
          const sr=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name)) IN (LOWER(TRIM($1)),LOWER(TRIM('Mathematics I')),LOWER(TRIM('Mathematics Part I'))) ORDER BY CASE WHEN LOWER(TRIM(name))=LOWER(TRIM($1)) THEN 0 ELSE 1 END LIMIT 1`,[subjectName]);
          if(!sr.rows.length) throw new Error(`Subject not found: ${subjectName}`);
          const sid=sr.rows[0].id;
          const cn=normalizeChapterNumber(row.chapter_number);
          const cname=chapterNames[cn]||'';
          let cr=await client.query(`SELECT id,chapter_name FROM chapters WHERE subject_id=$1 AND is_active=TRUE AND (TRIM(CAST(chapter_number AS TEXT))=$2 OR LOWER(TRIM(chapter_name))=LOWER(TRIM($3))) ORDER BY CASE WHEN TRIM(CAST(chapter_number AS TEXT))=$2 THEN 0 ELSE 1 END,id LIMIT 1`,[sid,cn,cname]);
          if(!cr.rows.length && cname){
            await client.query(`INSERT INTO chapters(subject_id,chapter_number,chapter_name,is_active) VALUES($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[sid,cn,cname]);
            cr=await client.query(`SELECT id,chapter_name FROM chapters WHERE subject_id=$1 AND is_active=TRUE AND (TRIM(CAST(chapter_number AS TEXT))=$2 OR LOWER(TRIM(chapter_name))=LOWER(TRIM($3))) ORDER BY id LIMIT 1`,[sid,cn,cname]);
          }
          if(!cr.rows.length) throw new Error(`Chapter not found: ${subjectName} / ${cn}`);
          const chapterId=cr.rows[0].id;
          const qt=String(row.question_text||'').trim();
          if(!qt) throw new Error('Question text is empty');
          const existing=await client.query(`SELECT q.id,q.source_type FROM questions q JOIN chapters c ON c.id=q.chapter_id WHERE c.subject_id=$1 AND q.question_text=$2 ORDER BY q.id LIMIT 1`,[sid,qt]);
          const vals=[chapterId,qt,Number(row.marks)||1,row.hint||null,row.easy_answer||null,row.keywords||null,row.difficulty||'Easy',Number(row.pyq_year)||null,row.question_paper_id?Number(row.question_paper_id):null,row.pyq_exam_month||null,row.pyq_paper_set||null,Math.max(1,Number(row.pyq_frequency)||1),row.visual_tag||null,row.source_note||null];
          if(existing.rows.length){
            const qid=existing.rows[0].id;
            await client.query(`UPDATE questions SET chapter_id=$1,marks=$3,hint=$4,easy_answer=$5,keywords=$6,difficulty=$7,pyq_year=$8,question_paper_id=$9,source_type='ACTUAL_PYQ',pyq_exam_month=$10,pyq_paper_set=$11,pyq_frequency=$12,pyq_verified=TRUE,visual_tag=$13,source_note=$14,question_type='PYQ',is_active=TRUE WHERE id=$15`,[...vals,qid]);
            upgraded++;
          }else{
            await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note)
             VALUES($1,$2,$3,$4,$5,$6,'PYQ',$7,$8,$9,TRUE,'ACTUAL_PYQ',$10,$11,$12,TRUE,$13,$14)`,vals);
            imported++;
          }
        }catch(err){failed++;if(errors.length<30)errors.push(`Row ${i+1}: ${err.message}`);}
      }
      await client.query('COMMIT');
      res.json({success:true,imported,upgraded,skipped,failed,total:items.length,errors,message:`PYQ import complete: ${imported} new, ${upgraded} upgraded/verified, ${failed} failed.`});
    }catch(e){await client.query('ROLLBACK');console.error('Bundled PYQ import error:',e);res.status(500).json({success:false,error:'Unable to import bundled PYQs'});}finally{client.release();}
});

// STEP 50 — import the 27 verified March 2024 Mathematics-II (Geometry) PYQs bundled from the March 2024 paper.
// This follows STEP 48 and uses the same safe GET + explicit text chapter matching strategy.
app.get('/api/admin/pyq-import-bundled-2024-math2', async (req,res)=>{
    const filePath=path.join(__dirname,'..','PYQ_2024_MATH2_MARCH_ENGLISH_27_BUNDLED.json');
    if(!fs.existsSync(filePath)) return res.status(404).json({success:false,error:'Bundled 2024 Mathematics-II PYQ file not found on server.'});
    let items;
    try { items=JSON.parse(fs.readFileSync(filePath,'utf8')); }
    catch(e){ return res.status(400).json({success:false,error:'Bundled 2024 Mathematics-II PYQ package is invalid JSON.'}); }
    if(!Array.isArray(items)||items.length!==27) return res.status(400).json({success:false,error:`Bundled 2024 Mathematics-II PYQ package is invalid (${Array.isArray(items)?items.length:0} items).`});

    const chapterNames={
      '1':'Similarity','2':'Pythagoras Theorem','3':'Circle','4':'Geometric Constructions',
      '5':'Co-ordinate Geometry','6':'Trigonometry','7':'Mensuration'
    };
    const norm=v=>String(v??'').trim().replace(/^0+(?=\d)/,'');
    const client=await pool.connect();
    let imported=0,upgraded=0,failed=0,skipped=0;
    const errors=[];
    try{
      await client.query('BEGIN');
      const subjectNames=['Mathematics Part II','Mathematics II','Mathematics-II'];
      let sr=null;
      for(const name of subjectNames){
        const r=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1::text)) ORDER BY id LIMIT 1`,[name]);
        if(r.rows.length){sr=r;break;}
      }
      if(!sr) throw new Error('Subject not found: Mathematics Part II');
      const sid=Number(sr.rows[0].id);

      for(let i=0;i<items.length;i++){
        const row=items[i], savepoint=`pyq_m2_row_${i}`;
        try{
          await client.query(`SAVEPOINT ${savepoint}`);
          const cn=norm(row.chapter_number), cname=chapterNames[cn]||'';
          const n=Number.parseInt(cn,10);
          if(!Number.isFinite(n)) throw new Error(`Invalid chapter number: ${row.chapter_number}`);
          const qt=String(row.question_text||'').trim();
          if(!qt) throw new Error('Question text is empty');

          let cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text ORDER BY id LIMIT 1`,[sid,String(n)]);
          if(!cr.rows.length && cname){
            await client.query(`INSERT INTO chapters(subject_id,chapter_number,chapter_name,is_active) VALUES($1::int,$2::text,$3::text,TRUE) ON CONFLICT DO NOTHING`,[sid,String(n),cname]);
            cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text ORDER BY id LIMIT 1`,[sid,String(n)]);
          }
          if(!cr.rows.length) throw new Error(`Chapter not found: Mathematics Part II / ${cn} / ${cname}`);
          const chapterId=Number(cr.rows[0].id);

          const existing=await client.query(`SELECT id FROM questions WHERE chapter_id=$1::int AND LOWER(TRIM(question_text))=LOWER(TRIM($2::text)) ORDER BY id LIMIT 1`,[chapterId,qt]);
          const vals=[chapterId,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.difficulty||'Medium').trim()||'Medium',2024,String(row.pyq_exam_month||'March'),String(row.pyq_paper_set||'English'),Math.max(1,Number(row.pyq_frequency)||1),String(row.visual_tag||'').trim()||null,String(row.source_note||'').trim()||null];
          if(existing.rows.length){
            await client.query(`UPDATE questions SET chapter_id=$1::int,marks=$3::int,hint=$4::text,easy_answer=$5::text,keywords=$6::text,difficulty=$7::text,pyq_year=$8::int,question_paper_id=NULL,is_active=TRUE,source_type='ACTUAL_PYQ',pyq_exam_month=$9::text,pyq_paper_set=$10::text,pyq_frequency=$11::int,pyq_verified=TRUE,visual_tag=$12::text,source_note=$13::text,question_type='PYQ' WHERE id=$14::int`,[...vals,existing.rows[0].id]);
            upgraded++;
          }else{
            await client.query(`INSERT INTO questions(chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note) VALUES($1::int,$2::text,$3::int,$4::text,$5::text,$6::text,'PYQ',$7::text,$8::int,NULL,TRUE,'ACTUAL_PYQ',$9::text,$10::text,$11::int,TRUE,$12::text,$13::text)`,vals);
            imported++;
          }
          await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        }catch(err){
          failed++; if(errors.length<30) errors.push(`Row ${i+1}: ${err.message}`);
          try{await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);}catch(_){ }
          try{await client.query(`RELEASE SAVEPOINT ${savepoint}`);}catch(_){ }
        }
      }
      await client.query('COMMIT');
      res.json({success:true,total:items.length,imported,upgraded,skipped,failed,errors,message:`2024 Mathematics-II PYQ import complete: ${imported} new, ${upgraded} upgraded/verified, ${failed} failed.`});
    }catch(e){await client.query('ROLLBACK');console.error('STEP50 Math-II bundled import error:',e);res.status(500).json({success:false,error:`Unable to import 2024 Mathematics-II PYQs: ${e.message}`});}
    finally{client.release();}
});

// STEP 41 — GET-based bundled import fallback.
// The Admin page already has a bundled 27-question package. This GET endpoint
// avoids browser POST/CORS/body parsing issues on local setups.


// STEP 48 FIX — Robust GET-based bundled import for verified March 2024 Mathematics-I English PYQs.
// Uses explicit PostgreSQL casts and a SAVEPOINT per row so one bad row cannot
// abort the whole transaction. This fixes: "could not determine data type of parameter $2".
// STEP 51 — verified 2024 Science & Technology Part-I bundled import (28 records).
// STEP 52 — verified 2024 Science & Technology Part-II bundled import (28 records).

// STEP 53 — verified 2024 Social Science bundled import (20 selected actual PYQs).
app.get('/api/admin/pyq-import-bundled-2024-social-science', async (req,res)=>{
  const filePath=path.join(__dirname,'..','PYQ_2024_SOCIAL_SCIENCE_MARCH_ENGLISH_VERIFIED_20_BUNDLED.json');
  if(!fs.existsSync(filePath)) return res.status(404).json({success:false,error:'Bundled 2024 Social Science PYQ file not found on server.'});
  let items; try{items=JSON.parse(fs.readFileSync(filePath,'utf8'));}catch(e){return res.status(400).json({success:false,error:'Bundled 2024 Social Science package is invalid JSON.'});}
  if(!Array.isArray(items)||items.length!==20) return res.status(400).json({success:false,error:`Bundled 2024 Social Science package is invalid (${Array.isArray(items)?items.length:0} items).`});
  const chapterNames={
    'History & Political Science':{'1':'Historiography','2':'Historiography: Indian Tradition','3':'Applied History','4':'Indian Arts','5':'Mass Media','6':'Entertainment','7':'Sports History','8':'Tourism','9':'Heritage','10':'Constitution','11':'Electoral Process','12':'Political Parties','13':'Social and Political Movements','14':'Challenges before Indian Democracy'},
    'Geography':{'1':'Field Visit','2':'Location and Extent','3':'Physiography and Drainage','4':'Climate','5':'Natural Vegetation and Wildlife','6':'Population','7':'Human Settlements','8':'Economy and Occupations','9':'Tourism','10':'Transport and Communication'}
  };
  const subjectNames={
    'History & Political Science':['History & Political Science','History and Political Science'],
    'Geography':['Geography']
  };
  const norm=v=>String(v??'').trim().replace(/^0+(?=\\d)/,'');
  const normQ=v=>String(v??'').trim().replace(/\\s+/g,' ');
  const client=await pool.connect(); let imported=0,upgraded=0,failed=0; const errors=[];
  try{
    await client.query('BEGIN');
    for(let i=0;i<items.length;i++){
      const row=items[i], sp=`pyq_ss_row_${i}`;
      try{
        await client.query(`SAVEPOINT ${sp}`);
        const subjectKey=String(row.subject_name||'').trim();
        const names=subjectNames[subjectKey]||[subjectKey]; let sr=null;
        for(const name of names){const r=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1::text)) ORDER BY id LIMIT 1`,[name]);if(r.rows.length){sr=r;break;}}
        if(!sr) throw new Error(`Subject not found: ${subjectKey}`);
        const sid=Number(sr.rows[0].id), cn=norm(row.chapter_number), cname=(chapterNames[subjectKey]||{})[cn];
        if(!cname) throw new Error(`Invalid chapter ${cn} for ${subjectKey}`);
        const qt=String(row.question_text||'').trim(); if(!qt) throw new Error('Question text is empty');
        let cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text ORDER BY id LIMIT 1`,[sid,String(cn)]);
        if(!cr.rows.length){await client.query(`INSERT INTO chapters(subject_id,chapter_number,chapter_name,is_active) VALUES($1::int,$2::text,$3::text,TRUE) ON CONFLICT DO NOTHING`,[sid,String(cn),cname]);cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text ORDER BY id LIMIT 1`,[sid,String(cn)]);}
        if(!cr.rows.length) throw new Error(`Chapter not found: ${subjectKey}/${cn}`);
        const chapterId=Number(cr.rows[0].id);
        const existingRows=await client.query(`SELECT id,question_text FROM questions WHERE chapter_id=$1::int ORDER BY id`,[chapterId]);
        const existing=existingRows.rows.find(q=>normQ(q.question_text)===normQ(qt));
        const vals=[chapterId,qt,Number(row.marks)||1,String(row.hint||'Verified Board PYQ').trim()||'Verified Board PYQ',String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.difficulty||'Medium').trim()||'Medium',2024,String(row.pyq_exam_month||'March'),String(row.pyq_paper_set||'English'),Math.max(1,Number(row.pyq_frequency)||1),String(row.visual_tag||'').trim()||null,String(row.source_note||'').trim()||null];
        if(existing){
          await client.query(`UPDATE questions SET question_text=$2::text,marks=$3::int,hint=$4::text,easy_answer=$5::text,keywords=$6::text,question_type='PYQ',difficulty=$7::text,pyq_year=$8::int,is_active=TRUE,source_type='ACTUAL_PYQ',pyq_exam_month=$9::text,pyq_paper_set=$10::text,pyq_frequency=$11::int,pyq_verified=TRUE,visual_tag=$12::text,source_note=$13::text WHERE id=$1::int`,vals);
          upgraded++;
        }else{
          await client.query(`INSERT INTO questions(chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note) VALUES($1::int,$2::text,$3::int,$4::text,$5::text,$6::text,'PYQ',$7::text,$8::int,TRUE,'ACTUAL_PYQ',$9::text,$10::text,$11::int,TRUE,$12::text,$13::text)`,vals);
          imported++;
        }
        await client.query(`RELEASE SAVEPOINT ${sp}`);
      }catch(err){failed++;if(errors.length<30)errors.push(`Row ${i+1}: ${err.message}`);try{await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);}catch(_){}try{await client.query(`RELEASE SAVEPOINT ${sp}`);}catch(_){} }
    }
    await client.query('COMMIT');
    res.json({success:true,total:items.length,imported,upgraded,failed,errors,message:`2024 Social Science import complete: ${imported} new, ${upgraded} upgraded/verified, ${failed} failed.`});
  }catch(e){try{await client.query('ROLLBACK');}catch(_){}console.error('STEP53 Social Science bundled import error:',e);res.status(500).json({success:false,error:`Unable to import 2024 Social Science PYQs: ${e.message}`});}
  finally{client.release();}
});
app.get('/api/admin/pyq-import-bundled-2024-science2', async (req,res)=>{
    const filePath=path.join(__dirname,'..','PYQ_2024_SCIENCE_PART2_MARCH_ENGLISH_28_BUNDLED.json');
    if(!fs.existsSync(filePath)) return res.status(404).json({success:false,error:'Bundled 2024 Science & Technology Part-II PYQ file not found on server.'});
    let items;
    try { items=JSON.parse(fs.readFileSync(filePath,'utf8')); }
    catch(e){ return res.status(400).json({success:false,error:'Bundled 2024 Science & Technology Part-II PYQ package is invalid JSON.'}); }
    if(!Array.isArray(items)||items.length!==28) return res.status(400).json({success:false,error:`Bundled 2024 Science Part-II package is invalid (${Array.isArray(items)?items.length:0} items).`});
    const chapterNames={
      '1':'Heredity and Evolution','2':'Life Processes in Living Organisms Part -1','3':'Life Processes in Living Organisms Part -2',
      '4':'Environmental Management','5':'Towards Green Energy','6':'Animal Classification','7':'Introduction to Microbiology',
      '8':'Cell Biology and Biotechnology','9':'Social Health','10':'Disaster Management'
    };
    const norm=v=>String(v??'').trim().replace(/^0+(?=\d)/,'');
    const normQ=v=>String(v??'').trim().replace(/\s+/g,' ');
    const client=await pool.connect(); let imported=0,upgraded=0,failed=0; const errors=[];
    try{
      await client.query('BEGIN');
      const names=['Science & Technology Part II','Science and Technology Part II','Science & Technology Part-II','Science and Technology Part-II'];
      let sr=null;
      for(const name of names){
        const r=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1::text)) ORDER BY id LIMIT 1`,[name]);
        if(r.rows.length){sr=r;break;}
      }
      if(!sr) throw new Error('Subject not found: Science & Technology Part II');
      const sid=Number(sr.rows[0].id);
      for(let i=0;i<items.length;i++){
        const row=items[i], savepoint=`pyq_s2_row_${i}`;
        try{
          await client.query(`SAVEPOINT ${savepoint}`);
          const cn=norm(row.chapter_number), n=Number.parseInt(cn,10), cname=chapterNames[cn]||'';
          if(!Number.isFinite(n)||!cname) throw new Error(`Invalid chapter number: ${row.chapter_number}`);
          const qt=String(row.question_text||'').trim(); if(!qt) throw new Error('Question text is empty');
          let cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text ORDER BY id LIMIT 1`,[sid,String(n)]);
          if(!cr.rows.length){
            await client.query(`INSERT INTO chapters(subject_id,chapter_number,chapter_name,is_active) VALUES($1::int,$2::text,$3::text,TRUE) ON CONFLICT DO NOTHING`,[sid,String(n),cname]);
            cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text ORDER BY id LIMIT 1`,[sid,String(n)]);
          }
          if(!cr.rows.length) throw new Error(`Chapter not found: Science Part II / ${cn} / ${cname}`);
          const chapterId=Number(cr.rows[0].id);
          const existingRows=await client.query(`SELECT id,question_text FROM questions WHERE chapter_id=$1::int ORDER BY id`,[chapterId]);
          const existing=existingRows.rows.find(q=>normQ(q.question_text)===normQ(qt));
          const vals=[chapterId,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.difficulty||'Medium').trim()||'Medium',2024,String(row.pyq_exam_month||'March'),String(row.pyq_paper_set||'English'),Math.max(1,Number(row.pyq_frequency)||1),String(row.visual_tag||'').trim()||null,String(row.source_note||'').trim()||null];
          if(existing){
            await client.query(`UPDATE questions SET chapter_id=$1::int,marks=$3::int,hint=$4::text,easy_answer=$5::text,keywords=$6::text,difficulty=$7::text,pyq_year=$8::int,question_paper_id=NULL,is_active=TRUE,source_type='ACTUAL_PYQ',pyq_exam_month=$9::text,pyq_paper_set=$10::text,pyq_frequency=$11::int,pyq_verified=TRUE,visual_tag=$12::text,source_note=$13::text,question_type='PYQ' WHERE id=$14::int`,[...vals,existing.id]); upgraded++;
          }else{
            await client.query(`INSERT INTO questions(chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note) VALUES($1::int,$2::text,$3::int,$4::text,$5::text,$6::text,'PYQ',$7::text,$8::int,NULL,TRUE,'ACTUAL_PYQ',$9::text,$10::text,$11::int,TRUE,$12::text,$13::text)`,vals); imported++;
          }
          await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        }catch(err){
          failed++; if(errors.length<30) errors.push(`Row ${i+1}: ${err.message}`);
          try{await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);}catch(_){ }
          try{await client.query(`RELEASE SAVEPOINT ${savepoint}`);}catch(_){ }
        }
      }
      await client.query('COMMIT');
      res.json({success:true,total:items.length,imported,upgraded,failed,errors,message:`2024 Science & Technology Part-II PYQ import complete: ${imported} new, ${upgraded} upgraded/verified, ${failed} failed.`});
    }catch(e){ try{await client.query('ROLLBACK');}catch(_){} console.error('STEP52 Science-II bundled import error:',e); res.status(500).json({success:false,error:`Unable to import 2024 Science & Technology Part-II PYQs: ${e.message}`}); }
    finally{client.release();}
});

app.get('/api/admin/pyq-import-bundled-2024-science1', async (req,res)=>{
    const filePath=path.join(__dirname,'..','PYQ_2024_SCIENCE_PART1_MARCH_ENGLISH_28_BUNDLED.json');
    if(!fs.existsSync(filePath)) return res.status(404).json({success:false,error:'Bundled 2024 Science & Technology Part-I PYQ file not found on server.'});
    let items;
    try { items=JSON.parse(fs.readFileSync(filePath,'utf8')); }
    catch(e){ return res.status(400).json({success:false,error:'Bundled 2024 Science & Technology Part-I PYQ package is invalid JSON.'}); }
    if(!Array.isArray(items)||items.length!==28) return res.status(400).json({success:false,error:`Bundled 2024 Science Part-I package is invalid (${Array.isArray(items)?items.length:0} items).`});
    const chapterNames={
      '1':'Gravitation','2':'Periodic Classification of Elements','3':'Chemical Reactions and Equations',
      '4':'Effects of Electric Current','5':'Heat','6':'Refraction of Light','7':'Lenses','8':'Metallurgy',
      '9':'Carbon Compounds','10':'Space Missions'
    };
    const norm=v=>String(v??'').trim().replace(/^0+(?=\d)/,'');
    const normQ=v=>String(v??'').trim().replace(/\s+/g,' ');
    const client=await pool.connect(); let imported=0,upgraded=0,failed=0; const errors=[];
    try{
      await client.query('BEGIN');
      const names=['Science & Technology Part I','Science and Technology Part I','Science & Technology Part-I'];
      let sr=null;
      for(const name of names){
        const r=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1::text)) ORDER BY id LIMIT 1`,[name]);
        if(r.rows.length){sr=r;break;}
      }
      if(!sr) throw new Error('Subject not found: Science & Technology Part I');
      const sid=Number(sr.rows[0].id);
      for(let i=0;i<items.length;i++){
        const row=items[i], savepoint=`pyq_s1_row_${i}`;
        try{
          await client.query(`SAVEPOINT ${savepoint}`);
          const cn=norm(row.chapter_number), n=Number.parseInt(cn,10), cname=chapterNames[cn]||'';
          if(!Number.isFinite(n)||!cname) throw new Error(`Invalid chapter number: ${row.chapter_number}`);
          const qt=String(row.question_text||'').trim(); if(!qt) throw new Error('Question text is empty');
          let cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text ORDER BY id LIMIT 1`,[sid,String(n)]);
          if(!cr.rows.length){
            await client.query(`INSERT INTO chapters(subject_id,chapter_number,chapter_name,is_active) VALUES($1::int,$2::text,$3::text,TRUE) ON CONFLICT DO NOTHING`,[sid,String(n),cname]);
            cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text ORDER BY id LIMIT 1`,[sid,String(n)]);
          }
          if(!cr.rows.length) throw new Error(`Chapter not found: Science Part I / ${cn} / ${cname}`);
          const chapterId=Number(cr.rows[0].id);
          const existingRows=await client.query(`SELECT id,question_text FROM questions WHERE chapter_id=$1::int ORDER BY id`,[chapterId]);
          const existing=existingRows.rows.find(q=>normQ(q.question_text)===normQ(qt));
          const vals=[chapterId,qt,Number(row.marks)||1,String(row.hint||'').trim()||null,String(row.easy_answer||'').trim()||null,String(row.keywords||'').trim()||null,String(row.difficulty||'Medium').trim()||'Medium',2024,String(row.pyq_exam_month||'March'),String(row.pyq_paper_set||'English'),Math.max(1,Number(row.pyq_frequency)||1),String(row.visual_tag||'').trim()||null,String(row.source_note||'').trim()||null];
          if(existing){
            await client.query(`UPDATE questions SET chapter_id=$1::int,marks=$3::int,hint=$4::text,easy_answer=$5::text,keywords=$6::text,difficulty=$7::text,pyq_year=$8::int,question_paper_id=NULL,is_active=TRUE,source_type='ACTUAL_PYQ',pyq_exam_month=$9::text,pyq_paper_set=$10::text,pyq_frequency=$11::int,pyq_verified=TRUE,visual_tag=$12::text,source_note=$13::text,question_type='PYQ' WHERE id=$14::int`,[...vals,existing.id]); upgraded++;
          }else{
            await client.query(`INSERT INTO questions(chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note) VALUES($1::int,$2::text,$3::int,$4::text,$5::text,$6::text,'PYQ',$7::text,$8::int,NULL,TRUE,'ACTUAL_PYQ',$9::text,$10::text,$11::int,TRUE,$12::text,$13::text)`,vals); imported++;
          }
          await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        }catch(err){
          failed++; if(errors.length<30) errors.push(`Row ${i+1}: ${err.message}`);
          try{await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`);}catch(_){ }
          try{await client.query(`RELEASE SAVEPOINT ${savepoint}`);}catch(_){ }
        }
      }
      await client.query('COMMIT');
      res.json({success:true,total:items.length,imported,upgraded,failed,errors,message:`2024 Science & Technology Part-I PYQ import complete: ${imported} new, ${upgraded} upgraded/verified, ${failed} failed.`});
    }catch(e){ try{await client.query('ROLLBACK');}catch(_){} console.error('STEP51 Science-I bundled import error:',e); res.status(500).json({success:false,error:`Unable to import 2024 Science & Technology Part-I PYQs: ${e.message}`}); }
    finally{client.release();}
});

app.get('/api/admin/pyq-import-bundled-2024-math1', async (req,res)=>{
    const filePath=path.join(__dirname,'..','PYQ_2024_MATH1_MARCH_ENGLISH_27_BUNDLED.json');
    if(!fs.existsSync(filePath)) return res.status(404).json({success:false,error:'Bundled 2024 Mathematics-I PYQ file not found on server.'});
    let items;
    try { items=JSON.parse(fs.readFileSync(filePath,'utf8')); }
    catch(e){ return res.status(400).json({success:false,error:'Bundled 2024 PYQ package is invalid JSON.'}); }
    if(!Array.isArray(items)||items.length!==27) return res.status(400).json({success:false,error:`Bundled 2024 PYQ package is invalid (${Array.isArray(items)?items.length:0} items).`});

    const chapterNames={
      '1':'Linear Equations in Two Variables','2':'Quadratic Equations','3':'Arithmetic Progression',
      '4':'Financial Planning','5':'Probability','6':'Statistics'
    };
    const norm=v=>String(v??'').trim().replace(/^0+(?=\d)/,'');
    const normQ=v=>String(v??'').trim().replace(/\s+/g,' ');
    const client=await pool.connect();
    let imported=0,upgraded=0,failed=0;
    const errors=[];
    try{
      await client.query('BEGIN');

      // Resolve the subject once. Every parameter in this endpoint is explicitly typed.
      const subjectNames=['Mathematics Part I','Mathematics I','Mathematics-I'];
      let sr=null;
      for(const name of subjectNames){
        const r=await client.query(
          `SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1::text)) ORDER BY id LIMIT 1`,
          [name]
        );
        if(r.rows.length){sr=r;break;}
      }
      if(!sr) throw new Error('Subject not found: Mathematics Part I');
      const sid=Number(sr.rows[0].id);

      for(let i=0;i<items.length;i++){
        const row=items[i];
        const savepoint=`pyq_row_${i}`;
        try{
          const cn=norm(row.chapter_number);
          const cname=chapterNames[cn]||'';
          const chapterNoInt=Number.parseInt(cn,10);
          if(!Number.isFinite(chapterNoInt)) throw new Error(`Invalid chapter number: ${row.chapter_number}`);
          const qt=String(row.question_text||'').trim();
          if(!qt) throw new Error('Question text is empty');

          await client.query(`SAVEPOINT ${savepoint}`);

          // Deliberately avoid ambiguous PostgreSQL $2/$3 comparisons here.
          // chapterNoInt is validated as an integer before being embedded as a numeric literal.
          let cr=await client.query(
            `SELECT id FROM chapters
             WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text
             ORDER BY id LIMIT 1`,
            [sid,String(chapterNoInt)]
          );

          if(!cr.rows.length && cname){
            await client.query(
              `INSERT INTO chapters(subject_id,chapter_number,chapter_name,is_active)
               VALUES($1::int,$2::text,$3::text,TRUE) ON CONFLICT DO NOTHING`,
              [sid,String(chapterNoInt),cname]
            );
            cr=await client.query(
              `SELECT id FROM chapters
               WHERE subject_id=$1::int AND is_active=TRUE AND CAST(chapter_number AS TEXT)=$2::text
               ORDER BY id LIMIT 1`,
              [sid,String(chapterNoInt)]
            );
          }
          if(!cr.rows.length) throw new Error(`Chapter not found: Mathematics Part I / ${cn} / ${cname}`);

          const chapterId=Number(cr.rows[0].id);

          // Fetch the small chapter question set and compare text in JavaScript.
          // This removes the remaining $2 text comparison that was triggering the local PostgreSQL error.
          const existingRows=await client.query(
            `SELECT q.id,q.question_text FROM questions q
             WHERE q.chapter_id=${chapterId}
             ORDER BY q.id`,
            []
          );
          const existing=existingRows.rows.find(q=>normQ(q.question_text)===normQ(qt));

          const vals=[
            chapterId,qt,Number(row.marks)||1,row.hint||null,row.easy_answer||null,row.keywords||null,
            row.difficulty||'Easy',2024,null,row.pyq_exam_month||'March',row.pyq_paper_set||'English',
            Math.max(1,Number(row.pyq_frequency)||1),row.visual_tag||null,
            row.source_note||'Verified from the user-uploaded official Maharashtra SSC Mathematics-I March 2024 English paper (N 619).'
          ];

          if(existing){
            await client.query(
              `UPDATE questions SET chapter_id=$1::int,marks=$2::int,hint=$3::text,easy_answer=$4::text,
               keywords=$5::text,difficulty=$6::text,pyq_year=$7::int,question_paper_id=$8::int,
               source_type='ACTUAL_PYQ',pyq_exam_month=$9::text,pyq_paper_set=$10::text,pyq_frequency=$11::int,
               pyq_verified=TRUE,visual_tag=$12::text,source_note=$13::text,question_type='PYQ',is_active=TRUE
               WHERE id=$14::int`,
              [chapterId,vals[2],vals[3],vals[4],vals[5],vals[6],vals[7],vals[8],vals[9],vals[10],vals[11],vals[12],vals[13],existing.id]
            );
            upgraded++;
          }else{
            await client.query(
              `INSERT INTO questions
               (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,
                question_paper_id,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,
                pyq_verified,visual_tag,source_note)
               VALUES($1::int,$2::text,$3::int,$4::text,$5::text,$6::text,'PYQ',$7::text,$8::int,$9::int,
                TRUE,'ACTUAL_PYQ',$10::text,$11::text,$12::int,TRUE,$13::text,$14::text)`,
              vals
            );
            imported++;
          }
          await client.query(`RELEASE SAVEPOINT ${savepoint}`);
        }catch(err){
          try{await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`); await client.query(`RELEASE SAVEPOINT ${savepoint}`);}catch(_e){}
          failed++;
          if(errors.length<30) errors.push(`Row ${i+1}: ${err.message}`);
        }
      }
      await client.query('COMMIT');
      res.json({success:true,year:2024,subject:'Mathematics Part I',imported,upgraded,failed,total:items.length,errors,message:`2024 Mathematics-I PYQ import complete: ${imported} new, ${upgraded} upgraded/verified, ${failed} failed.`});
    }catch(e){
      try{await client.query('ROLLBACK');}catch(_e){}
      console.error('Bundled 2024 PYQ import error:',e);
      res.status(500).json({success:false,error:e.message||'Unable to import bundled 2024 Mathematics-I PYQs'});
    }finally{client.release();}
});
app.get('/api/admin/pyq-import-bundled-2025-math1', async (req,res)=>{
    const filePath=path.join(__dirname,'..','PYQ_2025_MATH1_MARCH_ENGLISH_27_BUNDLED.json');
    try{
        if(!fs.existsSync(filePath)) return res.status(404).json({success:false,error:'Bundled 2025 Mathematics-I PYQ file not found on server.'});
        const raw=fs.readFileSync(filePath,'utf8');
        const items=JSON.parse(raw);
        if(!Array.isArray(items)||items.length!==27) return res.status(400).json({success:false,error:`Bundled PYQ package is invalid (${Array.isArray(items)?items.length:0} items).`});
        // Reuse the same import logic through a direct internal function below.
        const client=await pool.connect(); let imported=0,upgraded=0,skipped=0,failed=0; const errors=[];
        const chapterNames={'1':'Linear Equations in Two Variables','2':'Quadratic Equations','3':'Arithmetic Progression','4':'Financial Planning','5':'Probability','6':'Statistics'};
        const norm=v=>String(v??'').trim().replace(/^0+(?=\d)/,'');
        try{
            await client.query('BEGIN');
            for(let i=0;i<items.length;i++){
                const row=items[i];
                try{
                    const subjectName=String(row.subject_name||'').trim();
                    const sr=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name)) IN (LOWER(TRIM($1)),LOWER(TRIM('Mathematics I')),LOWER(TRIM('Mathematics Part I'))) ORDER BY CASE WHEN LOWER(TRIM(name))=LOWER(TRIM($1)) THEN 0 ELSE 1 END LIMIT 1`,[subjectName]);
                    if(!sr.rows.length) throw new Error(`Subject not found: ${subjectName}`);
                    const sid=sr.rows[0].id, cn=norm(row.chapter_number), cname=chapterNames[cn]||'';
                    let cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1 AND is_active=TRUE AND (TRIM(CAST(chapter_number AS TEXT))=$2 OR LOWER(TRIM(chapter_name))=LOWER(TRIM($3))) ORDER BY CASE WHEN TRIM(CAST(chapter_number AS TEXT))=$2 THEN 0 ELSE 1 END,id LIMIT 1`,[sid,cn,cname]);
                    if(!cr.rows.length && cname){ await client.query(`INSERT INTO chapters(subject_id,chapter_number,chapter_name,is_active) VALUES($1,$2,$3,TRUE) ON CONFLICT DO NOTHING`,[sid,cn,cname]); cr=await client.query(`SELECT id FROM chapters WHERE subject_id=$1 AND is_active=TRUE AND (TRIM(CAST(chapter_number AS TEXT))=$2 OR LOWER(TRIM(chapter_name))=LOWER(TRIM($3))) ORDER BY id LIMIT 1`,[sid,cn,cname]); }
                    if(!cr.rows.length) throw new Error(`Chapter not found: ${subjectName} / ${cn}`);
                    const chapterId=cr.rows[0].id, qt=String(row.question_text||'').trim();
                    if(!qt) throw new Error('Question text is empty');
                    const existing=await client.query(`SELECT q.id FROM questions q JOIN chapters c ON c.id=q.chapter_id WHERE c.subject_id=$1 AND q.question_text=$2 ORDER BY q.id LIMIT 1`,[sid,qt]);
                    const vals=[chapterId,qt,Number(row.marks)||1,row.hint||null,row.easy_answer||null,row.keywords||null,row.difficulty||'Easy',Number(row.pyq_year)||2025,row.question_paper_id?Number(row.question_paper_id):null,row.pyq_exam_month||'March',row.pyq_paper_set||'English',Math.max(1,Number(row.pyq_frequency)||1),row.visual_tag||null,row.source_note||'Verified from user-uploaded official Maharashtra SSC Mathematics-I March 2025 English paper.'];
                    if(existing.rows.length){
                        await client.query(`UPDATE questions SET chapter_id=$1,marks=$3,hint=$4,easy_answer=$5,keywords=$6,difficulty=$7,pyq_year=$8,question_paper_id=$9,source_type='ACTUAL_PYQ',pyq_exam_month=$10,pyq_paper_set=$11,pyq_frequency=$12,pyq_verified=TRUE,visual_tag=$13,source_note=$14,question_type='PYQ',is_active=TRUE WHERE id=$15`,[...vals,existing.rows[0].id]); upgraded++;
                    } else {
                        await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note) VALUES($1,$2,$3,$4,$5,$6,'PYQ',$7,$8,$9,TRUE,'ACTUAL_PYQ',$10,$11,$12,TRUE,$13,$14)`,vals); imported++;
                    }
                }catch(err){ failed++; if(errors.length<20) errors.push(`Row ${i+1}: ${err.message}`); }
            }
            await client.query('COMMIT');
            res.json({success:true,total:items.length,imported,upgraded,skipped,failed,errors,message:`2025 Mathematics-I PYQ import complete: ${imported} new, ${upgraded} upgraded/verified, ${failed} failed.`});
        }catch(e){ await client.query('ROLLBACK'); console.error('GET bundled PYQ import error:',e); res.status(500).json({success:false,error:`Database import failed: ${e.message}`}); }
        finally{ client.release(); }
    }catch(e){ console.error('Bundled file import error:',e); res.status(500).json({success:false,error:e.message}); }
});

// CSV import for verified PYQs. CSV columns are documented in PYQ_IMPORT_TEMPLATE.csv.
app.post('/api/admin/pyq-import', async (req,res)=>{
    const csv=String(req.body?.csv||'');
    if(!csv.trim()) return res.status(400).json({success:false,error:'CSV content is required'});
    const parseCSV=(text)=>{ const rows=[]; let row=[],cell='',q=false; for(let i=0;i<text.length;i++){ const ch=text[i],n=text[i+1]; if(ch==='"'){ if(q&&n==='"'){cell+='"';i++;} else q=!q; } else if(ch===','&&!q){row.push(cell);cell='';} else if((ch==='\\n'||ch==='\\r')&&!q){ if(ch==='\\r'&&n==='\\n')i++; row.push(cell); if(row.some(x=>String(x).trim())) rows.push(row); row=[];cell=''; } else cell+=ch; } if(cell.length||row.length){row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row);} return rows; };
    const rows=parseCSV(csv).map(r=>r.map(x=>String(x).trim()));
    if(rows.length<2) return res.status(400).json({success:false,error:'CSV must contain header and at least one data row'});
    const headers=rows[0].map(x=>x.toLowerCase());
    const idx=(n)=>headers.indexOf(n); const get=(r,n)=>idx(n)>=0?r[idx(n)]:'';
    const required=['subject_name','chapter_number','question_text','pyq_year'];
    for(const n of required) if(idx(n)<0) return res.status(400).json({success:false,error:`Missing CSV column: ${n}`});
    const client=await pool.connect(); let imported=0,skipped=0,failed=0; const errors=[];
    try{
      await client.query('BEGIN');
      for(let i=1;i<rows.length;i++){
        const row=rows[i], subjectName=get(row,'subject_name'), chapterNumber=get(row,'chapter_number'), qt=get(row,'question_text');
        try{
          const sr=await client.query('SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1',[subjectName]);
          if(!sr.rows.length) throw new Error(`Subject not found: ${subjectName}`);
          const cr=await client.query('SELECT id FROM chapters WHERE subject_id=$1 AND CAST(chapter_number AS TEXT)=$2 AND is_active=TRUE ORDER BY id LIMIT 1',[sr.rows[0].id,chapterNumber]);
          if(!cr.rows.length) throw new Error(`Chapter not found: ${subjectName} / ${chapterNumber}`);
          const dup=await client.query('SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1',[cr.rows[0].id,qt]);
          if(dup.rows.length){skipped++;continue;}
          await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note)
             VALUES($1,$2,$3,$4,$5,$6,'PYQ',$7,$8,$9,TRUE,'ACTUAL_PYQ',$10,$11,$12,TRUE,$13,$14)`,[
             cr.rows[0].id,qt,Number(get(row,'marks'))||1,get(row,'hint')||null,get(row,'easy_answer')||null,get(row,'keywords')||null,get(row,'difficulty')||'Easy',Number(get(row,'pyq_year'))||null,Number(get(row,'question_paper_id'))||null,get(row,'pyq_exam_month')||null,get(row,'pyq_paper_set')||null,Math.max(1,Number(get(row,'pyq_frequency'))||1),get(row,'visual_tag')||null,get(row,'source_note')||null]);
          imported++;
        }catch(err){failed++; if(errors.length<20)errors.push(`Row ${i+1}: ${err.message}`);}
      }
      await client.query('COMMIT');
      res.json({success:true,imported,skipped,failed,errors,message:`PYQ import complete: ${imported} imported, ${skipped} skipped, ${failed} failed.`});
    }catch(e){await client.query('ROLLBACK');console.error(e);res.status(500).json({success:false,error:'Unable to import PYQs'});}finally{client.release();}
});

app.get('/api/admin/pyq-year-coverage', async(req,res)=>{
  try{
    const r=await pool.query(`SELECT pyq_year, COUNT(*)::int count, COUNT(DISTINCT chapter_id)::int chapters, COUNT(DISTINCT s.id)::int subjects FROM questions q JOIN chapters c ON c.id=q.chapter_id JOIN subjects s ON s.id=c.subject_id WHERE q.is_active=TRUE AND q.source_type IN ('ACTUAL_PYQ','PYQ_REPEATED') AND q.pyq_verified=TRUE AND q.pyq_year IS NOT NULL GROUP BY pyq_year ORDER BY pyq_year DESC`);
    const years=[...new Set(r.rows.map(x=>Number(x.pyq_year)))];
    const targets=[2025,2024,2023,2022,2021,2020];
    res.json({success:true,targets,coverage:r.rows,missing:targets.filter(y=>!years.includes(y)),message:'PYQ year coverage loaded'});
  }catch(e){console.error('PYQ year coverage error:',e);res.status(500).json({success:false,error:'Unable to load PYQ year coverage'});}
});

// STEP 54 — verified 2024 language CSV import with upgrade/verify semantics.
app.post('/api/admin/pyq-import-verified-language-2024', async (req,res)=>{
  const csv=String(req.body?.csv||'');
  if(!csv.trim()) return res.status(400).json({success:false,error:'CSV content is required'});
  const parseCSV=(text)=>{ const rows=[]; let row=[],cell='',q=false; for(let i=0;i<text.length;i++){ const ch=text[i],n=text[i+1]; if(ch==='"'){ if(q&&n==='"'){cell+='"';i++;} else q=!q; } else if(ch===','&&!q){row.push(cell);cell='';} else if((ch==='\\n'||ch==='\\r')&&!q){ if(ch==='\\r'&&n==='\\n')i++; row.push(cell); if(row.some(x=>String(x).trim()))rows.push(row); row=[];cell=''; } else cell+=ch; } if(cell.length||row.length){row.push(cell);if(row.some(x=>String(x).trim()))rows.push(row);} return rows; };
  const rows=parseCSV(csv).map(r=>r.map(x=>String(x).trim()));
  if(rows.length<2)return res.status(400).json({success:false,error:'CSV must contain header and at least one data row'});
  const headers=rows[0].map(x=>x.toLowerCase()); const idx=n=>headers.indexOf(n); const get=(r,n)=>idx(n)>=0?r[idx(n)]:'';
  for(const n of ['subject_name','chapter_number','question_text','pyq_year']) if(idx(n)<0)return res.status(400).json({success:false,error:`Missing CSV column: ${n}`});
  const allowed=new Set(['english','marathi','hindi','sanskrit']);
  const client=await pool.connect(); let imported=0,upgraded=0,failed=0; const errors=[];
  try{
    await client.query('BEGIN');
    for(let i=1;i<rows.length;i++){
      const row=rows[i],subjectName=get(row,'subject_name'),chapterNumber=get(row,'chapter_number'),qt=get(row,'question_text');
      try{
        if(Number(get(row,'pyq_year'))!==2024) throw new Error('Only pyq_year=2024 is allowed in STEP 54.');
        if(!allowed.has(subjectName.toLowerCase())) throw new Error(`Unsupported language subject: ${subjectName}. Use English, Marathi, Hindi or Sanskrit.`);
        if(!qt||!chapterNumber) throw new Error('chapter_number and question_text are required.');
        const sr=await client.query('SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1',[subjectName]);
        if(!sr.rows.length)throw new Error(`Subject not found: ${subjectName}`);
        const cr=await client.query('SELECT id FROM chapters WHERE subject_id=$1 AND CAST(chapter_number AS TEXT)=$2 AND is_active=TRUE ORDER BY id LIMIT 1',[sr.rows[0].id,chapterNumber]);
        if(!cr.rows.length)throw new Error(`Chapter not found: ${subjectName} / ${chapterNumber}`);
        const dup=await client.query('SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 ORDER BY id LIMIT 1',[cr.rows[0].id,qt]);
        const vals=[cr.rows[0].id,qt,Number(get(row,'marks'))||1,get(row,'hint')||null,get(row,'easy_answer')||null,get(row,'keywords')||null,get(row,'difficulty')||'Medium',2024,Number(get(row,'question_paper_id'))||null,get(row,'pyq_exam_month')||'March',get(row,'pyq_paper_set')||'English',Math.max(1,Number(get(row,'pyq_frequency'))||1),get(row,'visual_tag')||null,get(row,'source_note')||null];
        if(dup.rows.length){
          await client.query(`UPDATE questions SET chapter_id=$1,marks=$3,hint=$4,easy_answer=$5,keywords=$6,difficulty=$7,pyq_year=$8,question_paper_id=$9,source_type='ACTUAL_PYQ',pyq_exam_month=$10,pyq_paper_set=$11,pyq_frequency=$12,pyq_verified=TRUE,visual_tag=$13,source_note=$14,question_type='PYQ',is_active=TRUE WHERE id=$15`,[...vals,dup.rows[0].id]);
          upgraded++;
        }else{
          await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note) VALUES($1,$2,$3,$4,$5,$6,'PYQ',$7,$8,$9,TRUE,'ACTUAL_PYQ',$10,$11,$12,TRUE,$13,$14)`,vals);
          imported++;
        }
      }catch(err){failed++;if(errors.length<20)errors.push(`Row ${i+1}: ${err.message}`);}
    }
    await client.query('COMMIT');
    res.json({success:true,total:rows.length-1,imported,upgraded,failed,errors,message:`2024 language PYQ import complete: ${imported} new, ${upgraded} upgraded/verified, ${failed} failed.`});
  }catch(e){try{await client.query('ROLLBACK');}catch(_){}res.status(500).json({success:false,error:`Unable to import 2024 language PYQs: ${e.message}`});}finally{client.release();}
});

app.get('/api/admin/pyq-language-status-2024', async(req,res)=>{
  try{
    const r=await pool.query(`SELECT s.name subject_name, COUNT(q.id)::int count FROM subjects s LEFT JOIN chapters c ON c.subject_id=s.id LEFT JOIN questions q ON q.chapter_id=c.id AND q.is_active=TRUE AND q.source_type='ACTUAL_PYQ' AND q.pyq_verified=TRUE AND q.pyq_year=2024 WHERE LOWER(TRIM(s.name)) IN ('english','marathi','hindi','sanskrit') GROUP BY s.name ORDER BY CASE LOWER(TRIM(s.name)) WHEN 'english' THEN 1 WHEN 'marathi' THEN 2 WHEN 'hindi' THEN 3 WHEN 'sanskrit' THEN 4 ELSE 9 END`);
    res.json({success:true,rows:r.rows});
  }catch(e){res.status(500).json({success:false,error:'Unable to load 2024 language PYQ status'});}
});

app.get('/api/admin/pyq-stats', async(req,res)=>{
  try{const r=await pool.query(`SELECT source_type,COUNT(*)::int count FROM questions WHERE is_active=TRUE GROUP BY source_type ORDER BY source_type`); const years=await pool.query(`SELECT pyq_year,COUNT(*)::int count FROM questions WHERE is_active=TRUE AND source_type='ACTUAL_PYQ' GROUP BY pyq_year ORDER BY pyq_year DESC`); res.json({success:true,bySource:r.rows,byYear:years.rows});}
  catch(e){res.status(500).json({success:false,error:'Unable to load PYQ stats'});}
});

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
                        : 0,
                    // Internal PASS-preparation target: 35% of available questions
                    // should be confidently known before the student moves to broader revision.
                    // This is a study target, not an official Board marks/passing calculation.
                    passTargetPercentage: 35,
                    passTargetKnown: subjectTotal > 0 ? Math.ceil(subjectTotal * 0.35) : 0,
                    passTargetProgressPercentage: subjectTotal > 0
                        ? Math.min(100, Math.round((subjectKnown / Math.max(1, Math.ceil(subjectTotal * 0.35))) * 100))
                        : 0,
                    passTargetRemaining: subjectTotal > 0
                        ? Math.max(0, Math.ceil(subjectTotal * 0.35) - subjectKnown)
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
// STEP 34 - VISUAL QUALITY GAP PACK (GEOGRAPHY + MATH I)
// Imports only the new gap questions; existing identical questions are skipped.
// ================================================
app.post('/api/admin/visual-quality-gap-v6/import', async (req, res) => {
    const client = await pool.connect();
    try {
        const dataDir = path.join(__dirname, 'data', 'quality_gap_v6');
        const files = fs.readdirSync(dataDir).filter(f => f.toLowerCase().endsWith('.csv')).sort();
        let imported = 0, skipped = 0;
        const chapterStats = {};
        await client.query('BEGIN');
        for (const file of files) {
            const full = path.join(dataDir, file);
            const text = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
            const lines = text.split(/\r?\n/).filter(x => x.trim() !== '');
            if (lines.length < 2) continue;
            const headers = parseCSVLineOneClick(lines[0]).map(h => h.trim().toLowerCase());
            for (let i = 1; i < lines.length; i++) {
                const vals = parseCSVLineOneClick(lines[i]);
                const row = {}; headers.forEach((h,idx)=>row[h]=(vals[idx]||'').trim());
                const subjectName = String(row.subject_name||'').trim();
                const cn = String(row.chapter_number||'').trim();
                const qt = String(row.question_text||'').trim();
                if (!subjectName || !cn || !qt) { skipped++; continue; }
                const key = `${subjectName}|${cn}`;
                chapterStats[key] = chapterStats[key] || { imported: 0, skipped: 0 };
                const subj = await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1`, [subjectName]);
                if (!subj.rows.length) { skipped++; chapterStats[key].skipped++; continue; }
                const ch = await client.query(`SELECT id FROM chapters WHERE subject_id=$1 AND CAST(chapter_number AS TEXT)=$2 AND is_active=TRUE ORDER BY id LIMIT 1`, [subj.rows[0].id, cn]);
                if (!ch.rows.length) { skipped++; chapterStats[key].skipped++; continue; }
                const ex = await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`, [ch.rows[0].id, qt]);
                if (ex.rows.length) { skipped++; chapterStats[key].skipped++; continue; }
                await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,NULL,TRUE)`,
                    [ch.rows[0].id, qt, Number(row.marks)||1, String(row.hint||'').trim()||null,
                     String(row.easy_answer||'').trim()||null, String(row.keywords||'').trim()||null,
                     String(row.question_type||'Practice').trim()||'Practice', String(row.difficulty||'Medium').trim()||'Medium']);
                imported++; chapterStats[key].imported++;
            }
        }
        await client.query('COMMIT');
        res.json({success:true, fileCount:files.length, imported, skipped, chapterStats, message:`Visual-tagged quality pack imported: ${imported} new questions.`});
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Visual Quality Gap Import Error:', e);
        res.status(500).json({success:false,error:'Unable to import Visual Learning quality-gap pack'});
    } finally { client.release(); }
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
// STAGE 10 STEP 31 - REPAIR DUPLICATE / INVALID CHAPTERS
// ================================================
// Safe repair: consolidates duplicate chapter numbers within each subject,
// moves questions to one canonical chapter, and deactivates duplicate/invalid
// chapter rows. It does NOT delete questions.
app.post("/api/admin/repair-chapters", async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const canonical = {};
        for (const [subjectName, chapters] of Object.entries(OFFICIAL_SSC_CHAPTER_MASTER)) {
            canonical[subjectName] = Object.fromEntries(chapters);
        }
        // The Geography question pack contains 10 chapters. Keep the two
        // content-bearing chapters 9 and 10 as the app's canonical structure.
        canonical["Geography"] = {
            ...canonical["Geography"],
            "9": "Tourism",
            "10": "Transport and Communication"
        };

        const subjects = await client.query(`SELECT id, name FROM subjects ORDER BY id`);
        const report = [];
        let mergedChapters = 0;
        let movedQuestions = 0;
        let deactivatedChapters = 0;
        let deactivatedInvalid = 0;

        for (const subject of subjects.rows) {
            const subjectName = String(subject.name || '').trim();
            const chaptersResult = await client.query(`
                SELECT id, chapter_number, chapter_name, is_active
                FROM chapters
                WHERE subject_id = $1
                ORDER BY id
            `, [subject.id]);

            const groups = {};
            for (const ch of chaptersResult.rows) {
                const number = String(ch.chapter_number ?? '').trim();
                if (!number || number.toLowerCase() === 'null') continue;
                (groups[number] ||= []).push(ch);
            }

            for (const [number, group] of Object.entries(groups)) {
                if (group.length <= 1) continue;

                const wantedName = canonical[subjectName]?.[number];
                let keeper = null;
                if (wantedName) {
                    keeper = group.find(ch => String(ch.chapter_name || '').trim().toLowerCase() === String(wantedName).trim().toLowerCase());
                }
                if (!keeper) keeper = group.find(ch => ch.is_active) || group[0];

                if (!keeper.is_active) {
                    await client.query(`UPDATE chapters SET is_active = TRUE WHERE id = $1`, [keeper.id]);
                }
                if (wantedName && String(keeper.chapter_name || '').trim().toLowerCase() !== String(wantedName).trim().toLowerCase()) {
                    await client.query(`UPDATE chapters SET chapter_name = $1 WHERE id = $2`, [wantedName, keeper.id]);
                }

                const others = group.filter(ch => ch.id !== keeper.id);
                const otherIds = others.map(ch => ch.id);
                if (otherIds.length) {
                    const moved = await client.query(`
                        UPDATE questions q
                        SET chapter_id = $1
                        WHERE q.chapter_id = ANY($2::int[])
                          AND NOT EXISTS (
                              SELECT 1 FROM questions cq
                              WHERE cq.chapter_id = $1
                                AND cq.question_text = q.question_text
                          )
                        RETURNING q.id
                    `, [keeper.id, otherIds]);
                    movedQuestions += moved.rowCount;

                    // Duplicate question text already present in the keeper is
                    // retained there; the duplicate rows are simply deactivated.
                    await client.query(`
                        UPDATE questions q
                        SET is_active = FALSE
                        WHERE q.chapter_id = ANY($1::int[])
                          AND EXISTS (
                              SELECT 1 FROM questions cq
                              WHERE cq.chapter_id = $2
                                AND cq.question_text = q.question_text
                          )
                    `, [otherIds, keeper.id]);

                    await client.query(`UPDATE chapters SET is_active = FALSE WHERE id = ANY($1::int[])`, [otherIds]);
                    mergedChapters += others.length;
                    deactivatedChapters += others.length;
                    report.push({subject: subjectName, chapter_number: number, keeper_id: keeper.id, merged_ids: otherIds, canonical_name: keeper.chapter_name});
                }
            }
        }

        // Remove old demo/test chapter rows from the active audit without
        // touching the real imported question bank.
        const invalid = await client.query(`
            UPDATE chapters
            SET is_active = FALSE
            WHERE is_active = TRUE
              AND (
                  LOWER(COALESCE(chapter_name,'')) LIKE '%demo english chapter%'
                  OR LOWER(COALESCE(chapter_name,'')) LIKE '%tester chapter%'
                  OR LOWER(COALESCE(chapter_name,'')) = 'null'
              )
            RETURNING id, subject_id, chapter_number, chapter_name
        `);
        deactivatedInvalid = invalid.rowCount;

        // Old composite subjects in this project contain only a placeholder
        // null chapter. Deactivate that placeholder chapter, not the subject.
        const composite = await client.query(`
            UPDATE chapters c
            SET is_active = FALSE
            FROM subjects s
            WHERE c.subject_id = s.id
              AND c.is_active = TRUE
              AND s.name IN ('Hindi Composite','Sanskrit Composite')
              AND LOWER(COALESCE(c.chapter_name,'')) = 'null'
            RETURNING c.id
        `);
        deactivatedInvalid += composite.rowCount;

        await client.query("COMMIT");
        res.json({
            success: true,
            message: "Chapter structure repaired successfully.",
            mergedChapters,
            movedQuestions,
            deactivatedChapters,
            deactivatedInvalid,
            report
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Chapter Repair Error:", error);
        res.status(500).json({success:false, error:"Unable to repair duplicate chapter structure"});
    } finally {
        client.release();
    }
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

// STEP 75 - All-subject Mock Test + solution/working support.
function buildDetailedSolution(q) {
    const text = String(q.question_text || '').trim();
    const answer = String(q.easy_answer || '').trim();
    const hint = String(q.hint || '').trim();
    const explanation = String(q.mcq_explanation || '').trim();
    if (explanation) return explanation;

    const subject = String(q.subject_name || '').toLowerCase();

    // Common Mathematics calculations: provide real working where the
    // question pattern is unambiguous, otherwise preserve the supplied
    // curriculum answer and method rather than inventing facts.
    if (subject.includes('mathematics')) {
        let m = text.match(/mean of (?:the )?data[:\s]+([\d,\.\s\-]+)/i);
        if (m) {
            const nums = m[1].split(',').map(x=>Number(x.trim())).filter(Number.isFinite);
            if (nums.length) {
                const sum = nums.reduce((a,b)=>a+b,0);
                const mean = sum/nums.length;
                return `Step 1: Add all observations: ${nums.join(' + ')} = ${sum}.\nStep 2: Number of observations = ${nums.length}.\nStep 3: Mean = Sum of observations ÷ Number of observations = ${sum} ÷ ${nums.length} = ${mean}.\nAnswer: ${answer || mean}.`;
            }
        }

        m = text.match(/(?:discriminant of|for)\s*([0-9]+)x[²2]\s*([+\-])\s*([0-9]+)x\s*([+\-])\s*([0-9]+)/i);
        if (m) {
            const a=Number(m[1]), b=(m[2]==='-'?-1:1)*Number(m[3]), c=(m[4]==='-'?-1:1)*Number(m[5]);
            const D=b*b-4*a*c;
            return `Step 1: Compare with ax² + bx + c = 0, so a=${a}, b=${b}, c=${c}.\nStep 2: Use D = b² − 4ac.\nStep 3: D = (${b})² − 4(${a})(${c}) = ${D}.\nStep 4: Since D > 0, the roots are real and distinct.\nAnswer: ${answer || D}.`;
        }

        m = text.match(/quadratic equation\s*([0-9]+)?x[²2]\s*([+\-])\s*([0-9]+)x\s*([+\-])\s*([0-9]+)/i);
        if (m) {
            const a=Number(m[1]||1), b=(m[2]==='-'?-1:1)*Number(m[3]), c=(m[4]==='-'?-1:1)*Number(m[5]);
            const D=b*b-4*a*c;
            if (D>=0) {
                const r1=(-b+Math.sqrt(D))/(2*a), r2=(-b-Math.sqrt(D))/(2*a);
                const fmt=x=>Number.isInteger(x)?String(x):String(Number(x.toFixed(4)));
                return `Step 1: Identify a=${a}, b=${b}, c=${c}.\nStep 2: Use x = [−b ± √(b²−4ac)] ÷ 2a.\nStep 3: D = b²−4ac = ${D}.\nStep 4: x = [${-b} ± √${D}] ÷ ${2*a}.\nAnswer: x = ${fmt(r1)} or x = ${fmt(r2)}.`;
            }
        }

        m = text.match(/(\d+)x\s*\+\s*(\d+)y\s*=\s*(\d+)\s+and\s+(\d*)x\s*\+\s*(\d+)y\s*=\s*(\d+)/i);
        if (m) {
            const a=Number(m[1]), b=Number(m[2]), c=Number(m[3]), d=Number(m[4]||1), e=Number(m[5]), f=Number(m[6]);
            const det=a*e-d*b;
            if (det!==0) {
                const x=(c*e-f*b)/det, y=(a*f-d*c)/det;
                const fmt=v=>Number.isInteger(v)?String(v):String(Number(v.toFixed(4)));
                return `Step 1: Write the equations: ${a}x + ${b}y = ${c} and ${d}x + ${e}y = ${f}.\nStep 2: Eliminate one variable (or use Cramer's rule).\nStep 3: x = (ce − fb)/(ae − db) = ${fmt(x)}.\nStep 4: Substitute x back to get y = ${fmt(y)}.\nAnswer: x = ${fmt(x)}, y = ${fmt(y)}.`;
            }
        }

        m = text.match(/x\s*=\s*([\-\d.]+).*equation\s*([0-9]+)x\s*\+\s*y\s*=\s*([\-\d.]+)/i);
        if (m) {
            const x=Number(m[1]), a=Number(m[2]), c=Number(m[3]), y=c-a*x;
            return `Step 1: Given x = ${x}.\nStep 2: Substitute in ${a}x + y = ${c}.\nStep 3: ${a}(${x}) + y = ${c}, so y = ${y}.\nAnswer: y = ${answer || y}.`;
        }

        m = text.match(/(?:legs|sides)\s*(?:are|of)\s*(\d+(?:\.\d+)?)\s*(?:cm)?\s*and\s*(\d+(?:\.\d+)?).*hypotenuse/i);
        if (m) {
            const a=Number(m[1]), b=Number(m[2]), c=Math.sqrt(a*a+b*b);
            return `Step 1: Use Pythagoras theorem c² = a² + b².\nStep 2: c² = ${a}² + ${b}² = ${a*a+b*b}.\nStep 3: c = √${a*a+b*b} = ${Number.isInteger(c)?c:Number(c.toFixed(4))}.\nAnswer: ${answer || c}.`;
        }
    }

    // Safe curriculum fallback: gives a genuine method + final answer
    // without fabricating intermediate facts when the source only stores
    // an easy answer.
    const parts=[];
    parts.push(`Step 1: Understand what the question is asking.`);
    if (hint) parts.push(`Step 2: Method / Hint — ${hint}`);
    parts.push(`Step 3: Apply the required rule, formula or concept to the given information.`);
    if (answer) parts.push(`Step 4: Final answer — ${answer}`);
    return parts.join('\n');
}

function buildDynamicMcq(q, answerPool) {
    const existing = ['A','B','C','D'].map(k=>q['option_'+k.toLowerCase()]);
    if (existing.every(x=>String(x||'').trim()) && ['A','B','C','D'].includes(String(q.correct_option||'').toUpperCase())) {
        return {...q, solution:buildDetailedSolution(q)};
    }
    const correct = String(q.easy_answer || '').trim();
    if (!correct) return null;
    const distractors=[];
    for (const a of answerPool) {
        const v=String(a||'').trim();
        if (!v || v===correct || distractors.includes(v)) continue;
        distractors.push(v);
        if (distractors.length===3) break;
    }
    while (distractors.length<3) distractors.push('None of the above');
    const seed=(Number(q.id)||0)*1103515245+12345;
    const pos=Math.abs(seed)%4;
    const opts=[...distractors]; opts.splice(pos,0,correct);
    return {
        ...q,
        option_a:opts[0],option_b:opts[1],option_c:opts[2],option_d:opts[3],
        correct_option:['A','B','C','D'][pos],
        solution:buildDetailedSolution(q),
        dynamically_built:true
    };
}

app.get('/api/students/:studentId/mock-test/subjects', async (req,res) => {
    try {
        const r = await pool.query(`
            SELECT s.id, s.name,
                   COUNT(q.id) FILTER (WHERE q.is_active=TRUE)::INTEGER AS question_count,
                   COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND q.option_a IS NOT NULL AND q.option_b IS NOT NULL AND q.option_c IS NOT NULL AND q.option_d IS NOT NULL AND q.correct_option IN ('A','B','C','D'))::INTEGER AS stored_mcq_ready,
                   COUNT(q.id) FILTER (WHERE q.is_active=TRUE AND q.easy_answer IS NOT NULL AND TRIM(q.easy_answer)<>'')::INTEGER AS answered_ready
            FROM subjects s
            LEFT JOIN chapters c ON c.subject_id=s.id AND c.is_active=TRUE
            LEFT JOIN questions q ON q.chapter_id=c.id
            GROUP BY s.id,s.name ORDER BY s.id`);
        res.json(r.rows.map(x=>({...x,mcq_ready:Math.max(Number(x.stored_mcq_ready||0),Number(x.answered_ready||0))})));
    } catch(e) { console.error(e); res.status(500).json({error:'Unable to load mock test subjects'}); }
});

app.post('/api/students/:studentId/mock-test/start', async (req,res) => {
    const client=await pool.connect();
    try {
        const studentId=Number(req.params.studentId), subjectId=Number(req.body.subjectId);
        if(!studentId || !subjectId) return res.status(400).json({error:'Student and subject are required'});
        const qs=await client.query(`
            SELECT q.id,q.question_text,q.marks,q.hint,q.keywords,q.difficulty,
                   q.option_a,q.option_b,q.option_c,q.option_d,q.correct_option,q.mcq_explanation,q.easy_answer,
                   s.name AS subject_name,c.chapter_number,c.chapter_name
            FROM questions q JOIN chapters c ON c.id=q.chapter_id JOIN subjects s ON s.id=c.subject_id
            WHERE c.subject_id=$1 AND c.is_active=TRUE AND q.is_active=TRUE
              AND (q.easy_answer IS NOT NULL AND TRIM(q.easy_answer)<>'')
            ORDER BY RANDOM() LIMIT 80`,[subjectId]);
        if(qs.rows.length<20) return res.status(400).json({error:`This subject has only ${qs.rows.length} answered questions. At least 20 are required.`});
        const answerPool=qs.rows.map(q=>q.easy_answer).filter(Boolean);
        const built=qs.rows.map(q=>buildDynamicMcq(q,answerPool)).filter(Boolean).slice(0,20);
        if(built.length<20) return res.status(400).json({error:'Unable to prepare 20 reliable MCQs for this subject.'});
        await client.query('BEGIN');
        const t=await client.query(`INSERT INTO mock_tests(student_id,subject_id,total_questions) VALUES($1,$2,$3) RETURNING *`,[studentId,subjectId,built.length]);
        for(let i=0;i<built.length;i++) await client.query(`INSERT INTO mock_test_questions(test_id,question_id,question_order) VALUES($1,$2,$3)`,[t.rows[0].id,built[i].id,i+1]);
        await client.query('COMMIT');
        res.json({success:true,test:t.rows[0],questions:built.map(q=>({...q,correct_option:undefined}))});
    } catch(e){try{await client.query('ROLLBACK')}catch{} console.error(e);res.status(500).json({error:'Unable to start mock test'});} finally{client.release();}
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
        const rows=await client.query(`
            SELECT mtq.question_id,q.correct_option,q.easy_answer,q.question_text,q.hint,q.mcq_explanation,q.marks,q.keywords,q.difficulty,s.name AS subject_name,c.chapter_number,c.chapter_name,q.option_a,q.option_b,q.option_c,q.option_d
            FROM mock_test_questions mtq JOIN questions q ON q.id=mtq.question_id JOIN chapters c ON c.id=q.chapter_id JOIN subjects s ON s.id=c.subject_id
            WHERE mtq.test_id=$1 ORDER BY mtq.question_order`,[testId]);
        const poolAnswers=rows.rows.map(r=>r.easy_answer).filter(Boolean);
        const review=[];
        for(const row of rows.rows) {
            const built=buildDynamicMcq(row,poolAnswers) || row;
            const selected=String(answers[row.question_id]||'').toUpperCase();
            const st=selected==='A'||selected==='B'||selected==='C'||selected==='D' ? (selected===built.correct_option?'correct':'wrong') : 'unanswered';
            if(st==='correct') correct++; else if(st==='wrong') wrong++; else unanswered++;
            await client.query(`UPDATE mock_test_questions SET student_status=$1,selected_option=$2,is_correct=$3 WHERE test_id=$4 AND question_id=$5`,[st,selected||null,st==='correct'?true:st==='wrong'?false:null,testId,row.question_id]);
            review.push({id:row.question_id,question_text:row.question_text,marks:row.marks,option_a:built.option_a,option_b:built.option_b,option_c:built.option_c,option_d:built.option_d,selected_option:selected||null,correct_option:built.correct_option,solution:built.solution});
        }
        const total=t.rows[0].total_questions; const score=Math.round((correct/total)*100);
        const upd=await client.query(`UPDATE mock_tests SET submitted_at=CURRENT_TIMESTAMP,known_count=$1,revision_count=$2,score=$3,is_submitted=TRUE WHERE id=$4 RETURNING *`,[correct,wrong+unanswered,score,testId]);
        const pass=score>=40;
        await client.query('COMMIT'); res.json({success:true,test:upd.rows[0],correct,wrong,unanswered,pass,review,message:'MCQ Mock Test submitted'});
    } catch(e){try{await client.query('ROLLBACK')}catch{} console.error(e);res.status(500).json({error:'Unable to submit mock test'});} finally{client.release();}
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
// STEP 34 - VISUAL QUALITY GAP PACK (GEOGRAPHY + MATH I)
// Imports only the new gap questions; existing identical questions are skipped.
// ================================================
app.post('/api/admin/visual-quality-gap-v6/import', async (req, res) => {
    const client = await pool.connect();
    try {
        const dataDir = path.join(__dirname, 'data', 'quality_gap_v6');
        const files = fs.readdirSync(dataDir).filter(f => f.toLowerCase().endsWith('.csv')).sort();
        let imported = 0, skipped = 0;
        const chapterStats = {};
        await client.query('BEGIN');
        for (const file of files) {
            const full = path.join(dataDir, file);
            const text = fs.readFileSync(full, 'utf8').replace(/^\\uFEFF/, '');
            const lines = text.split(/\\r?\\n/).filter(Boolean);
            if (lines.length < 2) continue;
            const header = lines[0].split(',').map(x => x.trim());
            for (const raw of lines.slice(1)) {
                // The bundled pack intentionally contains no commas in question fields.
                const cols = raw.split(',');
                if (cols.length < header.length) { skipped++; continue; }
                const row = {}; header.forEach((h,i)=>row[h]=cols[i] ?? '');
                const subjectName = String(row.subject_name||'').trim();
                const cn = String(row.chapter_number||'').trim();
                const qt = String(row.question_text||'').trim();
                if (!subjectName || !cn || !qt) { skipped++; continue; }
                const key = `${subjectName}|${cn}`;
                chapterStats[key] = chapterStats[key] || { imported: 0, skipped: 0 };
                const subj = await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1`, [subjectName]);
                if (!subj.rows.length) { skipped++; chapterStats[key].skipped++; continue; }
                const ch = await client.query(`SELECT id FROM chapters WHERE subject_id=$1 AND CAST(chapter_number AS TEXT)=$2 AND is_active=TRUE ORDER BY id LIMIT 1`, [subj.rows[0].id, cn]);
                if (!ch.rows.length) { skipped++; chapterStats[key].skipped++; continue; }
                const ex = await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`, [ch.rows[0].id, qt]);
                if (ex.rows.length) { skipped++; chapterStats[key].skipped++; continue; }
                await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,question_paper_id,is_active)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,NULL,TRUE)`,
                    [ch.rows[0].id, qt, Number(row.marks)||1, String(row.hint||'').trim()||null,
                     String(row.easy_answer||'').trim()||null, String(row.keywords||'').trim()||null,
                     String(row.question_type||'Practice').trim()||'Practice', String(row.difficulty||'Medium').trim()||'Medium']);
                imported++; chapterStats[key].imported++;
            }
        }
        await client.query('COMMIT');
        res.json({success:true, fileCount:files.length, imported, skipped, chapterStats, message:`Visual-tagged quality pack imported: ${imported} new questions.`});
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Visual Quality Gap Import Error:', e);
        res.status(500).json({success:false,error:'Unable to import Visual Learning quality-gap pack'});
    } finally { client.release(); }
});

// ================================================
// START SERVER
// ================================================
// Initialize database tables only AFTER all helper functions have been
// declared. This prevents a startup-time ReferenceError when a helper
// such as ensureMockTestTables is declared later in this file.

// ================================================
// STEP 35 - CURATED MCQ-READY STARTER BANK
// 20 Geography + 20 Mathematics Part I MCQs
// ================================================
const STEP35_GEOGRAPHY_MCQ = [
  {chapter:"1",q:"Which activity is most suitable during a field visit?",a:"Observing and recording geographical features",b:"Memorising only definitions",c:"Avoiding maps",d:"Skipping observations",correct:"A",explanation:"A field visit involves direct observation and recording of geographical features.",keywords:"field visit,observation"},
  {chapter:"1",q:"Which tool is commonly used to record the location of features during a field visit?",a:"Map",b:"Thermometer only",c:"Stopwatch only",d:"Calculator only",correct:"A",explanation:"A map helps record and represent locations and features.",keywords:"field visit,map"},
  {chapter:"2",q:"Which line is used to measure distance north or south of the Equator?",a:"Latitude",b:"Longitude",c:"Prime Meridian",d:"International Date Line",correct:"A",explanation:"Latitude measures angular distance north or south of the Equator.",keywords:"latitude,equator"},
  {chapter:"2",q:"Which line is used to measure distance east or west of the Prime Meridian?",a:"Longitude",b:"Latitude",c:"Tropic of Cancer",d:"Equator",correct:"A",explanation:"Longitude measures angular distance east or west of the Prime Meridian.",keywords:"longitude,prime meridian"},
  {chapter:"3",q:"The Western Ghats are also known as which physical feature?",a:"Sahyadri",b:"Aravalli",c:"Himalaya",d:"Nilgiri",correct:"A",explanation:"The Western Ghats are also called the Sahyadri range.",keywords:"western ghats,sahyadri"},
  {chapter:"3",q:"Which river is an important west-flowing river of Maharashtra?",a:"Tapi",b:"Godavari",c:"Krishna",d:"Bhima",correct:"A",explanation:"The Tapi is a major west-flowing river associated with Maharashtra.",keywords:"tapi,west flowing river"},
  {chapter:"4",q:"What is climate?",a:"Long-term pattern of weather of a place",b:"Weather at one particular hour",c:"A single rainfall event",d:"Only temperature on one day",correct:"A",explanation:"Climate describes the long-term pattern of weather of a place.",keywords:"climate,long term weather"},
  {chapter:"4",q:"Which season brings most of the rainfall to Maharashtra?",a:"South-west monsoon season",b:"Winter season",c:"Summer season only",d:"Autumn season",correct:"A",explanation:"Most rainfall in Maharashtra is received during the south-west monsoon.",keywords:"monsoon,rainfall"},
  {chapter:"5",q:"Which type of vegetation is generally associated with areas receiving heavy rainfall?",a:"Evergreen forests",b:"Thorn forests",c:"Desert vegetation",d:"Tundra vegetation",correct:"A",explanation:"Heavy rainfall supports dense evergreen vegetation.",keywords:"evergreen forest,rainfall"},
  {chapter:"5",q:"Which animal is commonly associated with Indian forests?",a:"Tiger",b:"Polar bear",c:"Penguin",d:"Reindeer",correct:"A",explanation:"The tiger is a major wild animal found in Indian forests.",keywords:"wildlife,tiger"},
  {chapter:"6",q:"What does population density mean?",a:"Number of people living per unit area",b:"Total number of villages",c:"Number of cities only",d:"Birth rate only",correct:"A",explanation:"Population density expresses people per unit area.",keywords:"population density"},
  {chapter:"6",q:"Which factor can influence the distribution of population?",a:"Availability of water",b:"Shape of a school bag",c:"Colour of roads",d:"Length of a railway ticket",correct:"A",explanation:"Water availability strongly influences where people settle.",keywords:"population distribution,water"},
  {chapter:"7",q:"What is a human settlement?",a:"A place where people live",b:"A natural mountain only",c:"A river channel",d:"A forest animal",correct:"A",explanation:"A human settlement is a place where people live and establish activities.",keywords:"human settlement"},
  {chapter:"7",q:"Which settlement is generally more densely populated?",a:"Urban settlement",b:"Isolated forest camp",c:"Desert dune",d:"Mountain peak",correct:"A",explanation:"Urban settlements generally have high population concentration.",keywords:"urban settlement"},
  {chapter:"8",q:"Which activity belongs to the primary sector?",a:"Agriculture",b:"Banking",c:"Software development",d:"Retail trade",correct:"A",explanation:"Agriculture is a primary economic activity because it uses natural resources directly.",keywords:"primary sector,agriculture"},
  {chapter:"8",q:"Which activity is an example of manufacturing?",a:"Converting cotton into cloth",b:"Growing wheat",c:"Fishing in a river",d:"Selling vegetables",correct:"A",explanation:"Manufacturing converts raw materials into finished or semi-finished goods.",keywords:"manufacturing,industry"},
  {chapter:"9",q:"Which mode of transport is generally most suitable for carrying heavy bulk goods over land for long distances?",a:"Railways",b:"Bicycles",c:"Walking",d:"Motorcycles",correct:"A",explanation:"Railways are well suited to transporting heavy bulk goods over long distances.",keywords:"transport,railways"},
  {chapter:"9",q:"Tourism is mainly related to which activity?",a:"Travel for recreation, leisure or related purposes",b:"Only farming",c:"Only mining",d:"Only manufacturing",correct:"A",explanation:"Tourism involves travel for recreation, leisure, cultural and related purposes.",keywords:"tourism"},
  {chapter:"9",q:"Which facility helps transmit information quickly over long distances?",a:"Telecommunication",b:"Irrigation canal",c:"Dam",d:"Plough",correct:"A",explanation:"Telecommunication systems transmit information over long distances.",keywords:"communication,telecommunication"},
  {chapter:"9",q:"Which map is especially useful for locating places and routes?",a:"Transport or road map",b:"Rain gauge",c:"Barometer",d:"Thermometer",correct:"A",explanation:"Transport/road maps show routes and connected places.",keywords:"map,transport,communication"},
];
const STEP35_MATH1_MCQ = [
  {chapter:"1",q:"Which graph represents a linear equation in two variables?",a:"A straight line",b:"A circle only",c:"A parabola only",d:"An ellipse only",correct:"A",explanation:"A linear equation in two variables is represented by a straight line.",keywords:"linear equation,straight line"},
  {chapter:"1",q:"If x + y = 5 and x = 2, what is y?",a:"3",b:"2",c:"5",d:"7",correct:"A",explanation:"Substituting x = 2 gives y = 3.",keywords:"linear equation,substitution"},
  {chapter:"2",q:"For a quadratic equation ax² + bx + c = 0, what is the discriminant?",a:"b² − 4ac",b:"b² + 4ac",c:"4ac − b",d:"a² − c²",correct:"A",explanation:"The discriminant is b² − 4ac.",keywords:"quadratic equation,discriminant"},
  {chapter:"2",q:"If the discriminant of a quadratic equation is zero, what type of roots does it have?",a:"Real and equal roots",b:"Real and unequal roots",c:"No real roots",d:"Only imaginary roots",correct:"A",explanation:"A zero discriminant gives two real and equal roots.",keywords:"quadratic equation,equal roots"},
  {chapter:"3",q:"What is the common difference of the AP 5, 8, 11, 14, ...?",a:"3",b:"2",c:"4",d:"5",correct:"A",explanation:"Each term increases by 3, so the common difference is 3.",keywords:"arithmetic progression,common difference"},
  {chapter:"3",q:"What is the 5th term of the AP 2, 5, 8, 11, ...?",a:"14",b:"12",c:"15",d:"16",correct:"A",explanation:"The terms are 2, 5, 8, 11, 14.",keywords:"arithmetic progression,fifth term"},
  {chapter:"4",q:"Which document is commonly used as evidence of a financial transaction?",a:"Receipt",b:"Storybook",c:"Atlas",d:"Timetable",correct:"A",explanation:"A receipt records a financial transaction.",keywords:"financial planning,receipt"},
  {chapter:"4",q:"Why is budgeting useful?",a:"It helps plan income and expenditure",b:"It increases every expense automatically",c:"It removes the need to save",d:"It guarantees profit",correct:"A",explanation:"A budget helps plan and control income and expenditure.",keywords:"financial planning,budget"},
  {chapter:"5",q:"What is the probability of getting a head when a fair coin is tossed once?",a:"1/2",b:"1",c:"0",d:"2",correct:"A",explanation:"There are two equally likely outcomes and one is a head, so probability is 1/2.",keywords:"probability,fair coin"},
  {chapter:"5",q:"What is the probability of an impossible event?",a:"0",b:"1",c:"1/2",d:"2",correct:"A",explanation:"An impossible event has probability 0.",keywords:"probability,impossible event"},
  {chapter:"5",q:"What is the probability of a certain event?",a:"1",b:"0",c:"1/2",d:"-1",correct:"A",explanation:"A certain event always occurs, so its probability is 1.",keywords:"probability,certain event"},
  {chapter:"6",q:"Which measure of central tendency is obtained by adding all observations and dividing by their number?",a:"Mean",b:"Median",c:"Mode",d:"Range",correct:"A",explanation:"The arithmetic mean is the sum of observations divided by their number.",keywords:"statistics,mean"},
  {chapter:"6",q:"Which graph is commonly used to represent continuous grouped data?",a:"Histogram",b:"Pictograph",c:"Pie chart only",d:"Line drawing of a map",correct:"A",explanation:"A histogram represents continuous grouped frequency data.",keywords:"statistics,histogram"},
  {chapter:"6",q:"Which value occurs most frequently in a data set?",a:"Mode",b:"Mean",c:"Median",d:"Range",correct:"A",explanation:"The mode is the value with the highest frequency.",keywords:"statistics,mode"},
  {chapter:"2",q:"Which method can be used to solve a quadratic equation?",a:"Factorisation",b:"Only measuring angles",c:"Only drawing a pie chart",d:"Only using a ruler",correct:"A",explanation:"Factorisation is one standard method for solving quadratic equations.",keywords:"quadratic equation,factorisation"},
  {chapter:"3",q:"What is the formula for the nth term of an AP?",a:"a + (n − 1)d",b:"a + nd²",c:"ad + n",d:"a(n + d)",correct:"A",explanation:"The nth term of an arithmetic progression is a + (n − 1)d.",keywords:"arithmetic progression,nth term"},
  {chapter:"4",q:"Which choice is an example of saving?",a:"Depositing money in a savings account",b:"Spending all income immediately",c:"Ignoring expenses",d:"Borrowing for every purchase",correct:"A",explanation:"Putting aside income for future use is saving.",keywords:"financial planning,saving"},
  {chapter:"5",q:"A bag contains 3 red and 2 blue balls. What is the probability of drawing a red ball?",a:"3/5",b:"2/5",c:"1/2",d:"3/2",correct:"A",explanation:"There are 3 favourable outcomes out of 5 total balls, so probability is 3/5.",keywords:"probability,red balls"},
  {chapter:"6",q:"What is the median of 2, 4, 6, 8, 10?",a:"6",b:"4",c:"8",d:"10",correct:"A",explanation:"The middle value of the ordered data is 6.",keywords:"statistics,median"},
  {chapter:"6",q:"Which measure is least affected by an extremely large or small value?",a:"Median",b:"Mean",c:"Sum",d:"Range",correct:"A",explanation:"The median is generally less affected by extreme values than the mean.",keywords:"statistics,median,outlier"},
];

app.get('/api/admin/step35-mcq-readiness', async (req,res) => {
  try {
    const r=await pool.query(`SELECT s.name subject_name, COUNT(q.id) FILTER(WHERE q.is_active=TRUE)::int active_questions,
      COUNT(q.id) FILTER(WHERE q.is_active=TRUE AND q.option_a IS NOT NULL AND q.option_b IS NOT NULL AND q.option_c IS NOT NULL AND q.option_d IS NOT NULL AND q.correct_option IN ('A','B','C','D'))::int mcq_ready
      FROM subjects s LEFT JOIN chapters c ON c.subject_id=s.id LEFT JOIN questions q ON q.chapter_id=c.id GROUP BY s.id,s.name ORDER BY s.id`);
    res.json({success:true,subjects:r.rows});
  } catch(e){console.error(e);res.status(500).json({success:false,error:'Unable to load MCQ readiness'});}
});

app.post('/api/admin/step35-import-mcq', async (req,res) => {
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    let imported=0, skipped=0, missingChapters=[];
    const all=[['Geography',STEP35_GEOGRAPHY_MCQ],['Mathematics Part I',STEP35_MATH1_MCQ]];
    for(const [subjectName,pack] of all){
      const sub=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) AND (is_active=TRUE OR is_active IS NULL) LIMIT 1`,[subjectName]);
      if(!sub.rows.length){missingChapters.push(subjectName); continue;}
      for(const x of pack){
        const ch=await client.query(`SELECT c.id FROM chapters c WHERE c.subject_id=$1 AND c.chapter_number=$2 AND c.is_active=TRUE ORDER BY c.id LIMIT 1`,[sub.rows[0].id,x.chapter]);
        if(!ch.rows.length){missingChapters.push(`${subjectName} chapter ${x.chapter}`); continue;}
        const exists=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND question_text=$2 LIMIT 1`,[ch.rows[0].id,x.q]);
        if(exists.rows.length){skipped++;continue;}
        await client.query(`INSERT INTO questions (chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,option_a,option_b,option_c,option_d,correct_option,mcq_explanation,is_active) VALUES ($1,$2,1,$3,$4,$5,'MCQ','Easy',$6,$7,$8,$9,$10,$11,TRUE)`,[ch.rows[0].id,x.q,'Choose the correct answer.',x.a,x.keywords,x.a,x.b,x.c,x.d,x.correct,x.explanation]);
        imported++;
      }
    }
    await client.query('COMMIT');
    res.json({success:true,imported,skipped,missingChapters:[...new Set(missingChapters)]});
  } catch(e){await client.query('ROLLBACK');console.error('STEP35 MCQ import error:',e);res.status(500).json({success:false,error:'Unable to import MCQ starter bank'});}
  finally{client.release();}
});


// ================================================
// STEP 37 - OFFICIAL PYQ EXTRACTION / REVIEW / REPEAT ANALYSIS
// ================================================
async function ensurePYQExtractionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pyq_extraction_batches (
      id SERIAL PRIMARY KEY,
      subject_name VARCHAR(120) NOT NULL,
      pyq_year INTEGER NOT NULL,
      pyq_exam_month VARCHAR(30),
      pyq_paper_set VARCHAR(80),
      source_url TEXT,
      source_note TEXT,
      raw_text TEXT,
      status VARCHAR(30) DEFAULT 'EXTRACTED',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS pyq_extraction_items (
      id SERIAL PRIMARY KEY,
      batch_id INTEGER REFERENCES pyq_extraction_batches(id) ON DELETE CASCADE,
      question_no VARCHAR(30),
      question_text TEXT NOT NULL,
      marks INTEGER DEFAULT 1,
      suggested_chapter_number VARCHAR(30),
      suggested_chapter_name VARCHAR(255),
      mapping_confidence NUMERIC(5,2) DEFAULT 0,
      answer_text TEXT,
      easy_answer TEXT,
      visual_tag VARCHAR(120),
      normalized_question TEXT,
      repeated_count INTEGER DEFAULT 1,
      status VARCHAR(30) DEFAULT 'REVIEW',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_pyq_extract_batch ON pyq_extraction_items(batch_id);
    CREATE INDEX IF NOT EXISTS idx_pyq_extract_status ON pyq_extraction_items(status);
    CREATE INDEX IF NOT EXISTS idx_pyq_extract_norm ON pyq_extraction_items(normalized_question);
  `);
}

function pyqNormalizeText(v){
  return String(v||'').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu,' ')
    .replace(/\s+/g,' ').trim();
}
function pyqVisualTag(text){
  const t=String(text||'').toLowerCase();
  const rules=[
    ['map','MAP'],['river','MAP'],['location','MAP'],['distribution','MAP'],['region','MAP'],
    ['graph','GRAPH'],['bar graph','GRAPH'],['pie chart','GRAPH'],['histogram','GRAPH'],
    ['diagram','DIAGRAM'],['figure','DIAGRAM'],['ray','DIAGRAM'],['circuit','DIAGRAM'],['lens','DIAGRAM'],
    ['formula','FORMULA'],['equation','FORMULA'],['probability','FORMULA'],['statistics','FORMULA'],
    ['flow chart','FLOWCHART'],['process','FLOWCHART'],['cycle','FLOWCHART'],
    ['table','TABLE'],['data','TABLE'],['timeline','TIMELINE'],
  ];
  for(const [needle,tag] of rules) if(t.includes(needle)) return tag;
  return null;
}
function pyqExtractQuestionBlocks(rawText){
  // V9: marker-position parser. Browser PDF text extraction can flatten many
  // visual lines into one line, so line-based parsing is unreliable. Instead,
  // detect the official section markers in the complete text and then split
  // each section on roman-numbered sub-question markers.
  const raw=String(rawText||'').replace(/\r/g,'');
  const pages=raw.split(/---\s*PAGE\s*\d+\s*---/i).map(p=>p.trim()).filter(Boolean);
  const clean=s=>String(s||'')
    .replace(/\b\d+\s*\/\s*N\s*\d+\b/gi,' ')
    .replace(/\b(?:P\.?\s*T\.?\s*O\.?|Page\s+\d+)\b/gi,' ')
    .replace(/\s+/g,' ').trim();
  const compact=s=>clean(s).replace(/[^\p{L}\p{N}]+/gu,'');
  const all=pages.map(clean).join(' ');
  const markers=[];
  const sectionRe=/(\d+)\.\s*\(([AB])\)/gi;
  const standaloneSectionRe=/\(([AB])\)\s+(?=(?:Choose|Complete|Solve|Construct|Answer|Find|Write|Draw|The|If|Two|ABC|Event)\b)/gi;
  let m;
  while((m=sectionRe.exec(all))) markers.push({idx:m.index,end:sectionRe.lastIndex,main:Number(m[1]),section:m[2].toUpperCase(),type:'section'});
  // A/B section headings may start on the next PDF page, so the page
  // number can be separated from the heading. Detect standalone headings
  // only when followed by a section-style instruction, avoiding MCQ options.
  let currentMainForStandalone=1;
  const standalone= []; let sm;
  while((sm=standaloneSectionRe.exec(all))){
    const before=all.slice(0,sm.index);
    const nums=[...before.matchAll(/(?:^|\s)(\d+)\.\s/g)].map(x=>Number(x[1])).filter(n=>n>=1&&n<=20);
    const main=nums.length?nums[nums.length-1]:currentMainForStandalone;
    currentMainForStandalone=main;
    standalone.push({idx:sm.index,end:standaloneSectionRe.lastIndex,main,section:sm[1].toUpperCase(),type:'section'});
  }
  // Keep standalone headings only when a numbered section marker is not
  // already present at the same location. This is what happens when (B)
  // starts on a new PDF page after the preceding '1.' or '2.' was printed
  // on the previous page.
  for(const st of standalone){
    const duplicate=markers.some(x=>x.type==='section' && x.main===st.main && x.section===st.section && Math.abs(x.idx-st.idx)<40);
    if(!duplicate) markers.push(st);
  }
  // Q.4 and Q.5 are direct question groups without A/B sections.
  const directRe=/(\d+)\.\s+(?=(?:Solve|Draw|Answer|In\b|The\b|A\b))/gi;
  while((m=directRe.exec(all))){
    const n=Number(m[1]);
    if(n>=4 && n<=20) markers.push({idx:m.index,end:directRe.lastIndex,main:n,section:null,type:'direct'});
  }
  markers.sort((a,b)=>a.idx-b.idx || a.end-b.end);
  // Remove duplicate/overlapping main markers.
  const groups=[];
  for(let i=0;i<markers.length;i++){
    const g=markers[i];
    if(i>0 && g.idx<markers[i-1].end) continue;
    const next=markers[i+1];
    const text=all.slice(g.end,next?next.idx:all.length).trim();
    if(text) groups.push({...g,text});
  }
  const blocks=[];
  const romanRe=/\((viii|vii|vi|v|iv|iii|ii|i|ix|x)\)/gi;
  for(const g of groups){
    // Q.1(A) is an MCQ section. In this particular Board PDF the (ii),
    // (iii), (iv) labels are printed at the top of the next page before
    // their stems. Use the four option-(A) boundaries to recover the four
    // MCQ stems without attaching one question to another.
    if(g.main===1 && g.section==='A') {
      const optA=[...g.text.matchAll(/\(A\)/g)].map(x=>x.index).filter((v,i,a)=>i===0 || v>a[i-1]+20);
      const optD=[...g.text.matchAll(/\(D\)/g)].map(x=>x.index).filter((v,i,a)=>i===0 || v>a[i-1]+20);
      if(optA.length>=4 && optD.length>=3){
        const labels=['i','ii','iii','iv'];
        const starts=[];
        const firstRoman=g.text.search(/\(i\)/i);
        if(firstRoman>=0) starts.push(firstRoman+3);
        for(let k=0;k<3;k++) starts.push(optD[k]+3);
        for(let k=0;k<4;k++){
          const end=optA[k];
          let text=g.text.slice(starts[k],end).replace(/\((?:ii|iii|iv)\)/gi,'').replace(/^[\s:–—-]+/,'').trim();
          if(k===0) text=text.replace(/^4\s+/,'');
          if(compact(text).length>=12) blocks.push({no:`1(A)(${labels[k]})`,text,page:null,marks:1});
        }
        continue;
      }
    }
    const rm=[]; let r;
    romanRe.lastIndex=0;
    while((r=romanRe.exec(g.text))) rm.push({idx:r.index,end:romanRe.lastIndex,no:r[1].toLowerCase()});
    if(!rm.length) continue;
    for(let i=0;i<rm.length;i++){
      const a=rm[i], b=rm[i+1];
      let text=g.text.slice(a.end,b?b.idx:g.text.length).trim();
      // The first roman marker can be followed by the tail of the section
      // heading only when PDF extraction misplaced punctuation; keep the
      // actual question text, but strip a leading separator.
      text=text.replace(/^[\s:–—-]+/,'').trim();
      if(compact(text).length<12) continue;
      const no=`${g.main}${g.section?`(${g.section})`:''}(${a.no})`;
      let marks=1;
      if(/^2\(A\)/i.test(no) || /^2\(B\)/i.test(no)) marks=2;
      else if(/^3\(A\)/i.test(no) || /^3\(B\)/i.test(no)) marks=3;
      else if(/^4\(/i.test(no)) marks=4;
      else if(/^5\(/i.test(no)) marks=3;
      blocks.push({no,text,page:null,marks});
    }
  }
  // Assign approximate page numbers from the original page boundaries.
  for(const b of blocks){
    const pos=all.indexOf(clean(b.text));
    if(pos>=0){
      let acc=0;
      for(let p=0;p<pages.length;p++){const pt=clean(pages[p]);const end=acc+pt.length+1;if(pos<end){b.page=p+1;break;}acc=end;}
    }
  }
  if(blocks.length>=10) return blocks.slice(0,100);
  // Last-resort page groups only when marker parsing genuinely fails.
  return pages.map((p,i)=>({no:`PAGE-${i+1}`,text:clean(p),page:i+1,marks:1})).filter(x=>compact(x.text).length>=30).slice(0,30);
}

app.get('/api/admin/pyq-extraction/status', async (req,res)=>{
  try{
    const b=await pool.query(`SELECT id,subject_name,pyq_year,pyq_exam_month,pyq_paper_set,status,created_at FROM pyq_extraction_batches ORDER BY id DESC LIMIT 30`);
    const i=await pool.query(`SELECT status,COUNT(*)::int count FROM pyq_extraction_items GROUP BY status ORDER BY status`);
    res.json({success:true,batches:b.rows,items:i.rows});
  }catch(e){console.error(e);res.status(500).json({success:false,error:'Unable to load PYQ extraction status'});}
});

app.post('/api/admin/pyq-extraction/analyze', async (req,res)=>{
  const client=await pool.connect();
  try{
    const {subject_name,pyq_year,pyq_exam_month,pyq_paper_set,source_url,source_note,raw_text}=req.body||{};
    if(!subject_name || !Number(pyq_year) || !String(raw_text||'').trim()) return res.status(400).json({success:false,error:'Subject, PYQ year and extracted text are required.'});
    const sub=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1`,[subject_name]);
    if(!sub.rows.length) return res.status(400).json({success:false,error:`Subject not found: ${subject_name}`});
    const chapters=await client.query(`SELECT chapter_number,chapter_name FROM chapters WHERE subject_id=$1 AND is_active=TRUE ORDER BY CAST(chapter_number AS INTEGER),id`,[sub.rows[0].id]);
    const blocks=pyqExtractQuestionBlocks(raw_text);
    if(!blocks.length) return res.status(400).json({success:false,error:'No question blocks detected. Try a text-based PDF or paste the extracted text.'});
    const batch=(await client.query(`INSERT INTO pyq_extraction_batches(subject_name,pyq_year,pyq_exam_month,pyq_paper_set,source_url,source_note,raw_text,status) VALUES($1,$2,$3,$4,$5,$6,$7,'EXTRACTED') RETURNING id`,[subject_name,Number(pyq_year),pyq_exam_month||null,pyq_paper_set||null,source_url||null,source_note||null,raw_text])).rows[0];
    const out=[];
    for(const b of blocks){
      const norm=pyqNormalizeText(b.text);
      let best=null;
      for(const c of chapters.rows){
        const nameTokens=pyqNormalizeText(c.chapter_name).split(' ').filter(x=>x.length>=4);
        const hits=nameTokens.filter(t=>norm.includes(t)).length;
        const confidence=nameTokens.length?Math.min(100,Math.round(hits/nameTokens.length*100)):0;
        if(!best || confidence>best.confidence) best={chapter_number:c.chapter_number,chapter_name:c.chapter_name,confidence};
      }
      if(!best) best={chapter_number:null,chapter_name:null,confidence:0};
      const visual=pyqVisualTag(b.text);
      const ins=await client.query(`INSERT INTO pyq_extraction_items(batch_id,question_no,question_text,marks,suggested_chapter_number,suggested_chapter_name,mapping_confidence,visual_tag,normalized_question,status) VALUES($1,$2,$3,1,$4,$5,$6,$7,$8,'REVIEW') RETURNING id`,[batch.id,b.no,b.text,best.chapter_number,best.chapter_name,best.confidence,visual,norm]);
      out.push({...ins.rows[0],question_text:b.text});
    }
    await client.query(`UPDATE pyq_extraction_batches SET status='REVIEW' WHERE id=$1`,[batch.id]);
    res.json({success:true,batchId:batch.id,total:out.length,items:out,message:`Extracted ${out.length} question blocks. Review chapter mapping and answers before importing as ACTUAL_PYQ.`});
  }catch(e){console.error('STEP37 analyze error:',e);res.status(500).json({success:false,error:'Unable to analyze PYQ text'});}finally{client.release();}
});

app.get('/api/admin/pyq-extraction/batch/:batchId', async(req,res)=>{
  try{
    const b=await pool.query(`SELECT * FROM pyq_extraction_batches WHERE id=$1`,[Number(req.params.batchId)]);
    if(!b.rows.length)return res.status(404).json({success:false,error:'Batch not found'});
    const i=await pool.query(`SELECT * FROM pyq_extraction_items WHERE batch_id=$1 ORDER BY id`,[Number(req.params.batchId)]);
    res.json({success:true,batch:b.rows[0],items:i.rows});
  }catch(e){res.status(500).json({success:false,error:'Unable to load PYQ extraction batch'});}
});

app.post('/api/admin/pyq-extraction/update-item', async(req,res)=>{
  try{
    const {id,suggested_chapter_number,suggested_chapter_name,mapping_confidence,marks,answer_text,easy_answer,visual_tag}=req.body||{};
    const r=await pool.query(`UPDATE pyq_extraction_items SET suggested_chapter_number=$2,suggested_chapter_name=$3,mapping_confidence=$4,marks=$5,answer_text=$6,easy_answer=$7,visual_tag=$8 WHERE id=$1 RETURNING *`,[Number(id),suggested_chapter_number||null,suggested_chapter_name||null,Number(mapping_confidence)||0,Number(marks)||1,answer_text||null,easy_answer||null,visual_tag||null]);
    if(!r.rows.length)return res.status(404).json({success:false,error:'Extraction item not found'});
    res.json({success:true,item:r.rows[0]});
  }catch(e){res.status(500).json({success:false,error:'Unable to update extraction item'});}
});

app.post('/api/admin/pyq-extraction/import-approved', async(req,res)=>{
  const client=await pool.connect();
  try{
    const ids=Array.isArray(req.body?.item_ids)?req.body.item_ids.map(Number).filter(Boolean):[];
    if(!ids.length)return res.status(400).json({success:false,error:'Select at least one reviewed question.'});
    await client.query('BEGIN');
    const items=await client.query(`SELECT i.*,b.subject_name,b.pyq_year,b.pyq_exam_month,b.pyq_paper_set,b.source_url,b.source_note FROM pyq_extraction_items i JOIN pyq_extraction_batches b ON b.id=i.batch_id WHERE i.id=ANY($1::int[])`,[ids]);
    let imported=0,skipped=0,errors=[];
    for(const x of items.rows){
      if(!x.answer_text && !x.easy_answer){errors.push({id:x.id,reason:'Answer missing'});continue;}
      const sub=await client.query(`SELECT id FROM subjects WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1`,[x.subject_name]);
      const ch=await client.query(`SELECT id FROM chapters WHERE subject_id=$1 AND CAST(chapter_number AS TEXT)=$2 AND is_active=TRUE ORDER BY id LIMIT 1`,[sub.rows[0]?.id,x.suggested_chapter_number]);
      if(!sub.rows.length || !ch.rows.length){errors.push({id:x.id,reason:'Chapter mapping missing'});continue;}
      const dup=await client.query(`SELECT id FROM questions WHERE chapter_id=$1 AND LOWER(TRIM(question_text))=LOWER(TRIM($2)) LIMIT 1`,[ch.rows[0].id,x.question_text]);
      if(dup.rows.length){skipped++; await client.query(`UPDATE pyq_extraction_items SET status='IMPORTED' WHERE id=$1`,[x.id]);continue;}
      await client.query(`INSERT INTO questions(chapter_id,question_text,marks,hint,easy_answer,keywords,question_type,difficulty,pyq_year,is_active,source_type,pyq_exam_month,pyq_paper_set,pyq_frequency,pyq_verified,visual_tag,source_note) VALUES($1,$2,$3,$4,$5,$6,'PYQ',$7,$8,TRUE,'ACTUAL_PYQ',$9,$10,1,TRUE,$11,$12)`,[ch.id,x.question_text,x.marks,'Verified Board PYQ',x.easy_answer||x.answer_text,null,'Medium',x.pyq_year,x.pyq_exam_month,x.pyq_paper_set,x.visual_tag,x.source_note||x.source_url||null]);
      imported++; await client.query(`UPDATE pyq_extraction_items SET status='IMPORTED' WHERE id=$1`,[x.id]);
    }
    await client.query('COMMIT');
    res.json({success:true,imported,skipped,failed:errors.length,errors,message:`Imported ${imported} verified PYQs. ${errors.length} need review.`});
  }catch(e){await client.query('ROLLBACK');console.error('STEP37 import error:',e);res.status(500).json({success:false,error:'Unable to import approved PYQs'});}finally{client.release();}
});

app.get('/api/admin/pyq-repeat-analysis', async(req,res)=>{
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const rows=await client.query(`SELECT id,question_text,pyq_year,chapter_id FROM questions WHERE is_active=TRUE AND source_type IN ('ACTUAL_PYQ','PYQ_REPEATED') AND pyq_verified=TRUE AND pyq_year IS NOT NULL`);
    const groups=new Map();
    for(const r of rows.rows){
      const n=pyqNormalizeText(String(r.question_text||'').replace(/^\s*\d+\s*\([^)]*\)\s*[—:-]?\s*/,'')).replace(/[^a-z0-9]+/g,'');
      if(!n)continue;
      const key=`${r.chapter_id}|${n}`;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(r);
    }
    let repeatedGroups=0,repeatedQuestions=0;
    for(const [key,items] of groups){
      const years=[...new Set(items.map(x=>Number(x.pyq_year)).filter(Boolean))].sort();
      const ids=items.map(x=>x.id);
      if(years.length>=2){
        repeatedGroups++; repeatedQuestions+=ids.length;
        await client.query(`UPDATE questions SET pyq_frequency=$1,source_type='PYQ_REPEATED' WHERE id=ANY($2::int[])`,[years.length,ids]);
      } else {
        await client.query(`UPDATE questions SET pyq_frequency=1,source_type='ACTUAL_PYQ' WHERE id=ANY($1::int[])`,[ids]);
      }
    }
    await client.query('COMMIT');
    res.json({success:true,repeatedGroups,repeatedQuestions,totalActualPYQ:rows.rows.length,yearsAvailable:[...new Set(rows.rows.map(x=>Number(x.pyq_year)).filter(Boolean))].sort(),message:repeatedGroups?`Found ${repeatedGroups} repeated PYQ groups across multiple years.`:'No cross-year repeated PYQs can be confirmed yet. Add verified papers from another year.'});
  }catch(e){await client.query('ROLLBACK');console.error('PYQ repeat analysis error:',e);res.status(500).json({success:false,error:'Unable to analyze repeated PYQs'});}finally{client.release();}
});app.post('/api/admin/pyq-repeat-analysis', async(req,res)=>{
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const rows=await client.query(`SELECT id,question_text,pyq_year,chapter_id FROM questions WHERE is_active=TRUE AND source_type IN ('ACTUAL_PYQ','PYQ_REPEATED') AND pyq_verified=TRUE AND pyq_year IS NOT NULL`);
    const groups=new Map();
    for(const r of rows.rows){
      const n=pyqNormalizeText(String(r.question_text||'').replace(/^\s*\d+\s*\([^)]*\)\s*[—:-]?\s*/,'')).replace(/[^a-z0-9]+/g,'');
      if(!n)continue;
      const key=`${r.chapter_id}|${n}`;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(r);
    }
    let repeatedGroups=0,repeatedQuestions=0;
    for(const [key,items] of groups){
      const years=[...new Set(items.map(x=>Number(x.pyq_year)).filter(Boolean))].sort();
      const ids=items.map(x=>x.id);
      if(years.length>=2){
        repeatedGroups++; repeatedQuestions+=ids.length;
        await client.query(`UPDATE questions SET pyq_frequency=$1,source_type='PYQ_REPEATED' WHERE id=ANY($2::int[])`,[years.length,ids]);
      } else {
        await client.query(`UPDATE questions SET pyq_frequency=1,source_type='ACTUAL_PYQ' WHERE id=ANY($1::int[])`,[ids]);
      }
    }
    await client.query('COMMIT');
    res.json({success:true,repeatedGroups,repeatedQuestions,totalActualPYQ:rows.rows.length,yearsAvailable:[...new Set(rows.rows.map(x=>Number(x.pyq_year)).filter(Boolean))].sort(),message:repeatedGroups?`Found ${repeatedGroups} repeated PYQ groups across multiple years.`:'No cross-year repeated PYQs can be confirmed yet. Add verified papers from another year.'});
  }catch(e){await client.query('ROLLBACK');console.error('PYQ repeat analysis error:',e);res.status(500).json({success:false,error:'Unable to analyze repeated PYQs'});}finally{client.release();}
});

app.get('/api/admin/pyq-repeat-report-v2', async(req,res)=>{
  try{
    const r=await pool.query(`
      SELECT q.id, s.name AS subject_name, c.chapter_number, c.chapter_name,
             q.question_text, q.pyq_year, q.pyq_frequency
      FROM questions q
      JOIN chapters c ON c.id=q.chapter_id
      JOIN subjects s ON s.id=c.subject_id
      WHERE q.is_active=TRUE
        AND q.source_type IN ('ACTUAL_PYQ','PYQ_REPEATED')
        AND q.pyq_verified=TRUE
        AND q.pyq_year IS NOT NULL
      ORDER BY s.name,c.chapter_number,q.pyq_year,q.id`);
    const groups=new Map();
    for(const row of r.rows){
      const normalized=pyqNormalizeText(String(row.question_text||'').replace(/^\s*\d+\s*(\([^)]*\))?\s*[—:-]?\s*/,''));
      if(!normalized) continue;
      const key=`${row.subject_name}|${row.chapter_number}|${normalized.replace(/[^a-z0-9]+/g,'')}`;
      if(!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(row);
    }
    const repeated=[];
    for(const items of groups.values()){
      const years=[...new Set(items.map(x=>Number(x.pyq_year)).filter(Boolean))].sort((a,b)=>a-b);
      if(years.length<2) continue;
      const first=items[0];
      repeated.push({
        subject_name:first.subject_name,
        chapter_number:first.chapter_number,
        chapter_name:first.chapter_name,
        question_text:first.question_text,
        frequency:years.length,
        years,
        records:items.map(x=>({id:x.id,year:Number(x.pyq_year),frequency:Number(x.pyq_frequency)||1}))
      });
    }
    repeated.sort((a,b)=>b.frequency-a.frequency || a.subject_name.localeCompare(b.subject_name) || String(a.chapter_number).localeCompare(String(b.chapter_number)));
    res.json({success:true,repeatedGroups:repeated.length,repeatedQuestions:repeated.reduce((n,x)=>n+x.records.length,0),rows:repeated});
  }catch(e){console.error('PYQ repeat report v2 error:',e);res.status(500).json({success:false,error:'Unable to load detailed repeated PYQ report'});}
});

app.get('/api/admin/pyq-repeat-report', async(req,res)=>{
  try{
    const r=await pool.query(`SELECT s.name subject_name,c.chapter_number,c.chapter_name,q.pyq_frequency,COUNT(q.id)::int question_count,MAX(q.pyq_year) latest_year, STRING_AGG(DISTINCT q.pyq_year::text, ', ' ORDER BY q.pyq_year::text) years_seen FROM questions q JOIN chapters c ON c.id=q.chapter_id JOIN subjects s ON s.id=c.subject_id WHERE q.is_active=TRUE AND q.source_type IN ('ACTUAL_PYQ','PYQ_REPEATED') GROUP BY s.name,c.chapter_number,c.chapter_name,q.pyq_frequency ORDER BY q.pyq_frequency DESC,question_count DESC,s.name,c.chapter_number`);
    res.json({success:true,rows:r.rows});
  }catch(e){res.status(500).json({success:false,error:'Unable to load repeated PYQ report'});}
});

ensureDailyPracticeTables()
    .then(() => ensureMockTestTables())
    .then(() => ensureMCQColumns())
    .then(() => ensurePYQMetadata())
    .then(() => ensurePYQExtractionTables())
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`10th Pass Master server is running on port ${PORT}`);
            console.log("Stage 8 Step 3 daily practice tracking is ready.");
        });
    })
    .catch((error) => {
        console.error("Unable to initialize database tables:", error);
        process.exit(1);
    });

