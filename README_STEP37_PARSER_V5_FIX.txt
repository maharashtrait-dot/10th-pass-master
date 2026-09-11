STEP 37 - Official PYQ Extraction Parser V5 Fix

Problem fixed:
Previous parser collapsed PDF text-layer lines into one long sentence. This caused answer options and numeric values in Mathematics papers to be interpreted as new question numbers.

V5 approach:
1. Preserve PDF text-layer line boundaries in the browser extraction.
2. Ignore common MSBSHSE page markers/footers such as N/620 and P.T.O.
3. Recognize a main question number only at the START of a text line.
4. Require the number to match the next expected sequential question number (1,2,3...).
5. Do not treat (A),(B),(C),(D), (i),(ii),(iii), or numeric values inside an existing question as new questions.
6. Keep extraction in REVIEW status. Nothing becomes ACTUAL_PYQ until a human/admin review supplies chapter mapping and answer.

Testing:
- Restart backend.
- Open http://localhost:3001/admin.html
- Ctrl+F5
- Select Mathematics Part I, 2025, March, and math1-2025-marathi.pdf
- Click EXTRACT QUESTIONS FROM PDF.
- Verify Q1, Q2, Q3... are separated sensibly.
- DO NOT import until the table is correct.
