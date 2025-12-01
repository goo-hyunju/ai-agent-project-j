# FDS Agent Repository Analysis

This document summarizes the current implementation of the FDS agent stack, mapping the checked-in code to the intended end-to-end flow (upload → preprocessing → anomaly scoring → rule generation → report output).

## Repository layout
- `mcp-server/`: MCP-style tool server exposing data loading, preprocessing, anomaly scoring, and report generation endpoints (Express + TS).
- `agent-server/`: LangChain.js powered orchestration server that uploads data, calls MCP tools, invokes the LLM for rule generation, and returns report output (Express + TS).
- `ml-service/`: FastAPI inference stub that returns random anomaly scores; intended to be replaced by an AutoEncoder model.
- `frontend/`: Simple Next.js UI to upload CSV/log files and trigger the agent run.

## MCP tools implemented
- **Data loading & preprocessing** (`mcp-server/src/modules/fds.ts`):
  - `POST /fds/load-csv`: resolves a path, validates the file, and parses CSV rows into JSON using PapaParse. Returns `dataframeJson`.
  - `POST /fds/preprocess`: strips null/empty values, retains non-empty rows, infers columns, and computes basic stats (row count, column count, detected amount/time columns, and optional amount aggregations). Returns `cleanDataframeJson` and `summaryStats`.
  - `POST /fds/anomaly-score`: attempts to call the Python ML service (`/predict`) to append `anomaly_score`; falls back to random scores if the service is unavailable.
- **Report generation** (`mcp-server/src/modules/report.ts`):
  - `POST /report/generate-markdown`: composes a Markdown report with summary stats, rule candidates, and top anomalies, saves it under `reports/`, and returns both Markdown text and the saved file path.

### Missing / to-be-added tools from the spec
- Visualization endpoints (e.g., histogram/line/bar chart generation).
- PDF export endpoint for Markdown reports.
- BigQuery ingestion helper (currently only file-based CSV loading).

## Agent orchestration (LangChain.js)
- `agent-server/src/index.ts`: Express endpoint `/agent/run` accepts file uploads, selects either the FDS or log agent, and cleans up uploaded files after execution.
- `agent-server/src/agents/fdsAgent.ts`:
  - Calls MCP data tools for CSV loading, preprocessing, and anomaly scoring.
  - Sorts records by `anomaly_score` and samples the top 20 anomalies.
  - Prompts `gpt-4o-mini` to propose 5–10 FDS rules (condition, description, riskLevel) using summary stats and anomaly samples, parsing JSON output when possible.
  - Requests the MCP report tool to generate a Markdown report and returns stats, rules, anomaly count, and report markdown to the caller.
- `agent-server/src/agents/logAgent.ts`: stub for future log analysis.

## ML service stub
- `ml-service/main.py`: FastAPI app exposing `/predict` and `/predict/batch`; currently returns random anomaly scores and documents where an AutoEncoder inference pipeline should be inserted.

## Frontend flow
- `frontend/app/page.tsx`: Client-side Next.js page with two modes (FDS vs. log). It lets users upload CSV/log files, posts them to `http://localhost:4000/agent/run`, and displays the resulting Markdown report, summary stats, and rule candidates for FDS runs.

## Suggested next steps
1. Implement visualization and PDF export tools in `mcp-server` and wire them through `agent-server`/frontend.
2. Harden preprocessing (type coercion, timestamp parsing, outlier clipping) and expand stats (time histograms, entity frequency tables).
3. Replace the ML stub with a real AutoEncoder model and feature extraction pipeline; add health checks/timeouts on the MCP side.
4. Improve rule generation prompts with guardrails (JSON schema, retry on invalid JSON) and add evaluation metrics or manual review hooks.
5. Enhance UI with result tables, charts, and download buttons aligned with the FDS workflow described in the project spec.
