STEP 37 — Parser V4 Fix

Fixes based on the 2025 Mathematics Part I Marathi paper test:
- Removes page footer patterns such as "2/N 620" before question detection.
- Accepts only sequential main question numbers (1,2,3,...) so option numbers like "6 (B) 20 (D)" are not promoted to new questions.
- Supports number + punctuation, number + (A-D), and colon variants when the expected question number is present.
- Keeps subquestions/options attached to the current main question.
- Falls back conservatively instead of inventing question boundaries.
- No row is automatically imported as ACTUAL_PYQ; review remains mandatory.

Test again with the same 2025 Mathematics Part I Marathi PDF after replacing the project and Ctrl+F5.
