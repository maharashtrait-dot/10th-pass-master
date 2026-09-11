STEP 38 FETCH FIX

The PYQ buttons were showing "Failed to fetch" because the Admin page may be running on a different local port (such as VS Code Live Server) while the API runs on localhost:3001.
This build adds safe localhost-only CORS handling to the backend and keeps the PYQ API on port 3001.

After replacing files: restart backend, hard-refresh Admin (Ctrl+F5), then click CHECK PYQ STATUS. If it loads, click IMPORT 2025 MATH-I — 27 VERIFIED PYQs.
