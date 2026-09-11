10th PASS MASTER - STEP 34 VISUAL LEARNING SYSTEM V6

This build improves question-specific visual selection and adds a quality-gap pack.

VISUAL FIX:
- Explicit VisualTag in keywords has highest priority.
- Question-specific overrides for the current Geography and Mathematics Part I questions are included.
- Chapter/subject names are never used as image triggers.
- 251 internal black-and-white SVG visuals are bundled in this build.
- 107 new questions have dedicated VisualTag assets.

QUALITY GAP PACK:
- Geography: 100 new questions (10 per chapter, 5 Medium + 5 Hard).
- Mathematics Part I - Probability: 7 new Hard questions.
- Total: 107 questions.
- Admin button: IMPORT 107 VISUAL-TAGGED QUESTIONS.
- Existing identical questions are skipped.

AFTER REPLACEMENT:
1. Restart backend: node server.js
2. Open: http://localhost:3001/admin.html
3. Click IMPORT 107 VISUAL-TAGGED QUESTIONS once.
4. Run Full Question Bank Audit.
5. Run Question Quality Audit.
6. Test Geography and Probability answers in Student App.

Do not run the old Geography/Math import buttons again unless you specifically need them; the new quality-gap button adds only the missing questions.
