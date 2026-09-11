STEP 37 V7 - OCR + QUESTION EXTRACTION QUALITY FIX

Why V7:
The 2025 Mathematics-I PDF text layer is readable but its text-item order is not reliable enough to separate board questions. V7 adds an automatic quality gate and browser OCR fallback using Tesseract.js, then applies a safer sequential main-question parser.

Important:
- User did nothing wrong.
- Do NOT import anything until the review table is verified.
- ACTUAL_PYQ is only assigned after review, chapter mapping and answer are supplied.
- If OCR is triggered, the first run can take several minutes depending on PC/internet.
