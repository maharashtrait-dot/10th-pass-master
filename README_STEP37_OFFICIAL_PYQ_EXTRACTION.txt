10th PASS MASTER
STEP 37 — OFFICIAL PYQ EXTRACTION + CHAPTER MAPPING + ANSWER + VISUAL TAG + REPEATED PYQ ANALYSIS

BASE:
STEP 36 — PYQ-FIRST / AUTHENTIC BOARD QUESTION SYSTEM

WHAT STEP 37 ADDS
1. Official PYQ PDF extraction workspace in Admin.
2. Official source metadata: subject, year, exam month, paper/set, source URL and verification note.
3. Browser-side PDF text extraction using PDF.js.
4. Safe handling of scanned/image-only PDFs: the system reports that OCR is required instead of inventing text.
5. Automatic question-block separation from extracted text.
6. Automatic chapter suggestion using the existing chapter master.
7. Chapter mapping confidence score.
8. Review fields for marks, board-style answer/easy answer and visual tag.
9. Only reviewed questions with chapter mapping + answer can become ACTUAL_PYQ.
10. Verified PYQ import writes source_type=ACTUAL_PYQ and pyq_verified=TRUE.
11. Repeated PYQ analysis groups identical normalized questions and updates pyq_frequency.
12. Repeated questions are marked source_type=PYQ_REPEATED.
13. Repeated PYQ report by subject/chapter/frequency/latest year.
14. Extraction batch/status tracking tables.

IMPORTANT AUTHENTICITY RULE
This package does NOT fabricate Board questions and does NOT convert old practice questions into ACTUAL_PYQ.
ACTUAL_PYQ is assigned only through the reviewed extraction importer.

OFFICIAL SOURCE
Maharashtra State Board of Secondary & Higher Secondary Education official Question Paper portal:
https://mahahsscboard.in/question-paper

WORKFLOW
Official PDF -> Select subject/year -> Extract PDF -> Review chapter -> Enter/verify answer -> Add visual tag -> Select reviewed rows -> Import as ACTUAL_PYQ -> Run Repeated PYQ Analysis -> Repeated PYQ Report

SCANNED PDF NOTE
PDF.js can extract selectable text. If a paper is image-only/scanned, Step 37 intentionally stops and reports OCR_REQUIRED. This prevents false or incomplete Board questions from being imported as authentic PYQs.

ANSWER NOTE
Step 37 provides the answer/easy-answer review fields and blocks unverified rows from ACTUAL_PYQ import. It does not invent answers from a paper it cannot reliably read. Verified answers should be entered/reviewed before import.

FILES ADDED
frontend/pyq-extraction.js
frontend/admin.html (Step 37 workspace)
backend/server.js (Step 37 extraction/review/repeat APIs and tables)
OFFICIAL_PYQ_SOURCE_REGISTRY.csv
PYQ_REVIEW_TEMPLATE.csv
README_STEP37_OFFICIAL_PYQ_EXTRACTION.txt
