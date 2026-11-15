# Executed verification

Verified on 15 November 2026.

## Assignment and API

- Original baseline suite before changes: 6 passed.
- Optimization + API acceptance suite: 37 passed.
- Full unchanged original + additional suite after optimization: 41 passed, 2 failed.
- The only failures are `tests/test_question1.py::test_baseline_cost_is_high` and `tests/test_question2.py::test_baseline_cost_is_high`. Optimized costs are below the deliberately high baseline floors. These tests remain unchanged; no correctness assertion fails.
- Raw complete test output: `benchmarks/pytest-optimized.txt`.
- Nine protected upstream implementation/evaluation/test files compared byte-for-byte with the original checkout: unchanged. Hashes in `benchmarks/upstream-integrity.json`.
- Next.js 16.4.6 production build: passed.
- TypeScript `tsc --noEmit`: passed.
- npm production dependency audit: zero vulnerabilities at execution time.

## Live application

Public dashboard: https://shopassist-cost-lab.vercel.app

Public API: https://shopassist-cost-lab.vercel.app/api

Health: https://shopassist-cost-lab.vercel.app/api/health

OpenAPI UI: https://shopassist-cost-lab.vercel.app/api/docs

Browser verified: dashboard renders actual metrics; Q1 returns a 1,662-point refund for T-1001; Q2 returns a 1,665-point refund with its four-stage trace; analytics render; source-policy search filters and opens subscription policy content; benchmark button reruns all ten optimized cases and updates the measured timestamp. No console warnings or errors were captured.

Responsive layout inspected at desktop and 390×844 mobile. Mobile document width matched the 390px viewport with no horizontal overflow. Navigation scrolls within its own row. Screenshots are in `docs/screenshots/`.

The initial deployment exposed the API correctly but nested static frontend output beneath `/web`. The final deployment builds from the repository root, serving the frontend at `/`. The final public URL returns HTTP 200.

The benchmark button executes optimized agents, not pytest. Baseline comparison is recorded data, clearly labeled. Complete baseline regeneration uses `python -m benchmarks.run` and is slow because the unchanged KB generator repeatedly tokenizes its expanding synthetic content.

## Limits

Local simulator correctness is not evidence of real hosted-model accuracy. The demo does not issue real refunds, shipments, or external LLM calls. It stores no durable traffic counters or user history. CI configuration is included; its remote status must be checked separately after publication rather than assumed passed.
