10th PASS MASTER - STEP 33 VISUAL LEARNING SYSTEM V2

What this version does:
- Automatically selects a relevant internal black-and-white visual from the actual question, keywords and easy answer.
- Chapter name is NOT used as a trigger, so one chapter image is not repeated for every question.
- Uses specificity scoring: exact question phrases and specific terms beat generic terms.
- Shows the matched keyword beside the visual.
- Shows a short memory caption.
- Works in Student Questions and My Revision wherever the existing renderer is used.
- Uses the app's local SVG assets only; no external image hotlinks.

Files changed:
- frontend/visual-learning.js
- frontend/visual-learning.css

Existing project files/assets are preserved.

Restart backend after replacing files:
node server.js

Then open:
http://localhost:3001/index.html
