STEP 37 — Parser V6 Fix

This build fixes question separation for PDFs whose text layer loses the left-margin question number or reorders text items.

V6 uses three levels:
1) sequential main-question markers at line start;
2) sequential markers in the full page stream;
3) page-level REVIEW fallback when safe question separation is impossible.

It never treats (A)-(D), (i)-(iii), or page/footer values such as 2/N 620 as independent main questions.

IMPORTANT: extraction is not verification. Do not import as ACTUAL_PYQ until chapter, marks and answer are reviewed.
