STEP 37 Parser V3 Fix

Fixes:
- Ignores PDF footer patterns such as "2/N 620".
- Uses page-aware parsing.
- Detects stronger top-level question markers without splitting on every numeric value.
- Keeps subquestions together when the PDF loses a main question marker at a page break.
- Avoids falsely treating formula numbers/options as separate questions.
- Browser cache version bumped to v3.

IMPORTANT:
Do not import a batch unless the Review table contains clean, complete question text and correct chapter/answer mapping.
