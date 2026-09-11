STEP 37 PDF EXTRACTION WORKER FIX

Problem fixed:
The Admin page showed: “No 'GlobalWorkerOptions.workerSrc' specified.” when EXTRACT QUESTIONS FROM PDF was clicked.

Cause:
The page mixed the PDF.js 4.x ES-module build with a separate extraction script. In some browsers the worker configuration was not applied to the PDF.js instance used by getDocument().

Fix:
- Admin now loads the matching PDF.js 3.11.174 classic browser build.
- pyq-extraction.js configures the matching pdf.worker.min.js before reading the PDF.
- No manual worker setup is required.

Testing:
1. Restart/reload Admin page with Ctrl+F5.
2. Select Mathematics Part I, Year 2025, March.
3. Choose the official PDF (math1-Marathi-2025.pdf).
4. Click EXTRACT QUESTIONS FROM PDF.
5. Expected: “Extracted text from X/Y pages. Sending to chapter-mapping engine…”

If the paper is scanned/image-only, the app will report OCR REQUIRED rather than inventing questions.
