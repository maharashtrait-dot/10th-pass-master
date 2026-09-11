STEP 37 PDF EXTRACTION PARSER FIX

Fixes:
1. PDF.js text extraction now rebuilds approximate visual lines from PDF text-item coordinates.
2. Backend question parser now supports normal numbered lines and a fallback for PDFs whose text layer collapses into one long stream.
3. The fallback recognizes sequential top-level question numbers and avoids common sub-part markers such as (i), (ii), (A).
4. Admin pyq-extraction.js cache version bumped to v2.

Test sequence:
- Restart backend.
- Open http://localhost:3001/admin.html
- Ctrl+F5.
- Select Mathematics Part I / 2025 / March.
- Select math1-2025-marathi.pdf.
- Click EXTRACT QUESTIONS FROM PDF.
- Confirm question rows appear under Review / Chapter Mapping / Answer / Visual Tag.

This fix does not claim scanned/image-only PDFs are text-based. OCR is still required when no usable text layer exists.
