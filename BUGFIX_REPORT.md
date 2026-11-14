# Bug Audit & Fix Report — Bursa Intelligence Terminal

**Scope:** full-stack audit of the FastAPI backend (`backend/`) and the Next.js 15 frontend
(`frontend/`) against the running application (backend `:8008`, frontend `:3000`).
**Method:** live API probing, Python unit tests of every pure function, browser
end-to-end tests driven over the Chrome DevTools Protocol (desktop + 390px mobile,
dark + light themes), concurrency/malformed-input stress tests, and static review.
**Date:** 11 Nov 2026

---

## 1. Verification summary

| Suite | File | Result |
| --- | --- | --- |
| Backend unit tests (ratios, parsing, AST, PII, guardrails, anomalies) | `_qa/unit_backend.py` | **49 / 49 pass** |
| Live API probe (all endpoints, happy + failure paths) | `_qa/api_probe.py` | **31 / 31 pass** |
| RAG re-ingest / retrieval integrity | `_qa/rag_probe.py` | **6 / 6 pass** |
| Concurrency & malformed input | `_qa/stress_probe.py` | **9 / 9 pass** |
| Query-intent parser (`parseQuery`) | `_qa/unit_parsequery.js` | **21 / 21 pass** |
| Browser E2E — core journeys | `_qa/e2e.js` | **41 / 41 pass** |
| Browser E2E — edge cases | `_qa/e2e_edge.js` | **11 / 11 pass** |
| Browser E2E — user journeys | `_qa/e2e_journeys.js` | **11 / 11 pass** |
| Project's own integration suite | `backend/test_integration.py` | **pass** |
| TypeScript (`tsc --noEmit`, strict) | — | **clean** |
| Browser console / uncaught exceptions | E2E | **none** |

Reproduce:

```bash
python backend/main.py                  # terminal 1 (port 8008)
cd frontend && npm run dev              # terminal 2 (port 3000)

python _qa/unit_backend.py
python _qa/api_probe.py
python _qa/rag_probe.py
python _qa/stress_probe.py
node   _qa/unit_parsequery.js
node   _qa/e2e.js
node   _qa/e2e_edge.js
node   _qa/e2e_journeys.js
```

---

## 2. Bugs found and fixed

### High severity — wrong or missing information shown to the user

**B1. An unknown stock query silently returned another company's report.**
`resolve_bursa_stock_hybrid()` ended with a hard-coded fallback to Maybank (1155), and the
fuzzy matcher accepted any 3+ character query. Typing `9999` returned *99 Speed Mart
Retail* (5326), `8888` returned *JHM Consolidation* (0127), and `zzzzqqq` returned
*Malayan Banking* — all with HTTP 200, as if the search had succeeded.
*Fix:* fuzzy matching is now skipped for numeric queries; a 4-digit code that is not a
listed Bursa security fails immediately; the LLM disambiguation stage only runs for
descriptive queries (`>= 8` chars or multi-word); and resolution failure raises
`StockNotFoundError` → **HTTP 404** with actionable text. (`backend/app.py`, `backend/main.py`)

**B2. Markdown table extraction truncated every table to its first two columns.**
The regex `(\|.+?\|\n\|[-:| ]+\|\n(?:\|.+?\|\n?)+)` stopped at the second pipe of each row,
so the "atomic table" the README advertises was mangled — the sample Maybank P&L table
came back as `| Revenue |` with the numbers dropped. Anything downstream (LLM statement
extraction) received a useless table.
*Fix:* rewritten regex that anchors whole rows, plus an AST-token reconstruction fallback
so an unmatched table can never degrade into the entire document.
(`backend/document_engine.py`)

**B3. Cross-stock chat leakage.** Loading a stock with an auto-prompt appended that question
to the *previous* stock's transcript (stale closure over `chatMessages`) and persisted the
mixed conversation under the new stock's localStorage key. Reproduced in the browser:
Maybank's question appeared inside CIMB's transcript.
*Fix:* chat state is mirrored in a ref (`chatMessagesRef`) that every code path updates
synchronously; `handleSendMessage` reads from the ref. (`frontend/app/page.tsx`)

**B4. Failed requests were completely silent.** `error` was stored in component state and
never rendered — when the API was down the loading overlay vanished and nothing else
happened. *Fix:* dismissible `role="alert"` error toast, and backend `detail` messages are
now surfaced instead of a bare `HTTP Error 500`. (`frontend/app/page.tsx`)

**B5. The "Go" button in the terminal header was dead.** `handleSearchSubmit` opened the
confirmation modal, but `ConfirmationModal` was only mounted inside the home view, so
submitting a search from the workspace did nothing. *Fix:* the modal is mounted at the root
and works from both views (verified in the browser). (`frontend/app/page.tsx`)

**B6. Audit confidence rendered 100× too small.** `audit.score` is 0–1; the UI printed
`0.96%` ("1% Audit") in the badge and in the exported memo. *Fix:* normalise to a
percentage (with a guard for already-percentage inputs). (`AIFinancialSummary.tsx`,
`utils/exportUtils.ts`)

**B7. Wrong reporting period in the AI memo.** The KLSE Screener column read as
"financial year" is actually the financial year **end** (`"31 Dec, 2026"`), so the quarter
label became `Q2 31 Dec, 2026` and the memo stated "quarter ended 31 December 2026" for a
June quarter. *Fix:* extract the year from that column, format the real period end
(`30 Jun 2026`), pass it to the LLM prompt and forbid invented dates.
(`backend/report_fetcher.py`, `backend/app.py`)

### Medium severity — data integrity and correctness

**B8. Re-ingesting a filing left stale chunks retrievable.** `index_document_hierarchical`
reused section indexes, so a shorter replacement filing left the old notes in ChromaDB and
in `self.children`; queries kept citing superseded disclosures.
*Fix:* the engine purges a stock's parents/children/vectors before indexing, and rebuilds
(and clears) the BM25 index correctly. (`backend/advanced_rag.py`)

**B9. `POST /api/rag/ingest` returned 500 for a missing payload** because the deliberate
`HTTPException(400)` was swallowed by the generic `except Exception` handler.
*Fix:* `except HTTPException: raise` added to every handler that raises one; empty files,
whitespace-only text, unreadable PDFs and empty Markdown now return **400** with a clear
reason. (`backend/main.py`)

**B10. Empty documents reported success.** Indexing whitespace returned
`{"success": true, "sections_indexed": 0}`. *Fix:* 400 "no indexable narrative disclosure".
(`backend/main.py`)

**B11. PII sanitiser destroyed financial figures.** The NRIC pattern
`\b\d{6}-?\d{2}-?\d{4}\b` matched *any* 12-digit number, so amounts such as
`450000000000` were replaced with `[REDACTED_NRIC]` before reaching the model.
*Fix:* the candidate must have a valid `YYMMDD` date prefix. (`backend/governance.py`)

**B12. Chat had no memory.** The backend accepted `history`, but the frontend never sent it,
despite the UI advertising multi-turn reasoning. *Fix:* the last six turns are sent with
every request. (`frontend/app/page.tsx`)

**B13. CSV export contradicted the on-screen table.** The export hard-coded QoQ/YoY values
(equity `+1.01%` vs `+2.04%` in the table) and used different prior-year ratios.
*Fix:* a new single source of truth (`frontend/utils/financials.ts`) drives both the table
and the CSV. (`FinancialStatementTable.tsx`, `utils/exportUtils.ts`)

**B14. `NaN%` / `Infinity%` when a prior period is zero.** Any zero base quarter
produced `Infinity%` in the statement table. *Fix:* guarded `pctChange()` helper.
(`utils/financials.ts`)

**B15. Autocomplete leaked eight arbitrary listings for a blank query** (`?q=%20`).
*Fix:* blank/whitespace queries return `[]`. (`backend/main.py`)

**B16. RAG engine was not thread-safe.** Sync FastAPI endpoints run on a thread pool, so an
ingest could rebuild BM25 while a query was iterating it, producing intermittent 500s
(reproduced with parallel probes). *Fix:* an `RLock` serialises indexing and retrieval.
(`backend/advanced_rag.py`)

### Low severity — polish

**B17.** Search on a bare company name ("CIMB") produced the nonsense prompt `"CIMB"` and
auto-asked it. The intent parser now strips every identity token and treats a bare lookup as
a lookup (`instruction = ""`). (`frontend/constants/bursaData.ts`)

**B18.** Theme default ignored the OS preference while the bootstrap script honoured it
(light-flash on light systems). Both now use `prefers-color-scheme`.
(`frontend/app/page.tsx`)

**B19.** A superseded request cleared the loading overlay while the current one was still
running. Only the newest request may now clear it. (`frontend/app/page.tsx`)

**B20.** USD/MYR showed a *negative* move in green. (`MarketPulseBar.tsx`)

**B21.** `0` growth/margin/gearing values fell through truthiness checks to hard-coded
fallbacks (e.g. `0.45x`). All now use nullish checks. (`StockKPIStrip.tsx`,
`AIFinancialSummary.tsx`)

**B22.** The price series was rescaled per-point in a way that flattened the shape and made
Recharts auto-zoom onto rounding noise. It is now rescaled proportionally around the
reference price, preserving the curve. (`frontend/app/page.tsx`)

**B23.** `backend/test_integration.py` targeted port 8000 while the server listens on 8008;
the README pointed at a non-existent `scratch/test_suite.py`. Both corrected.

**B24.** `GET /api/audit/latest?limit=-5` sliced from the end in reverse. Limit is clamped
to 1–100. (`backend/main.py`)

**B25.** Confirmation modal lacked dialog semantics and used a non-existent
`backdrop-blur-xs` utility. Both fixed. (`ConfirmationModal.tsx`)

---

## 3. Observations left unchanged (by design, not defects)

- **Synthetic market data.** Landing-page quotes, movers, sector indices, the five filing
  cards and the valuation scenarios are curated constants, not live market data. They are
  clearly demo scaffolding; wiring them to a real feed is a product decision, not a bug fix.
- **`/api/dcf/simulate`, `/api/rag/ingest`, `/api/rag/index-markdown`, `/api/audit/latest`
  have no UI.** The README describes drag-and-drop filing ingestion that the frontend does
  not implement yet.
- **Genie/Gemini degradation.** When the Gemini free tier is exhausted (HTTP 429) or
  overloaded (503) the backend falls back to deterministic summaries and audit verdicts;
  this path was exercised during testing and behaves correctly.
- **Dead scratch files** (`backend/temp.py`, root-level duplicate modules, `gateway.py`,
  `evals.py`) are unreferenced and can be deleted separately.
