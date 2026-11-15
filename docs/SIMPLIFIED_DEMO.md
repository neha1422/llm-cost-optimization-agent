# Guided customer-support demo

The default experience now follows a single task rather than opening an analytics dashboard.

1. Choose a sample customer problem, using an everyday name instead of a ticket ID.
2. Read the actual customer message and the relevant order facts.
3. Click **Help this customer**.
4. Read the recommendation, the reply it would send, and the cited policy.
5. Optionally select **Compare the cost** and run both versions on that same request.

The result includes a plain-language explanation of what happened. Technical counters, raw order fields, and assignment-version settings are collapsed by default. **How it works** explains the workflow without requiring engineering terminology. Loading and retry states describe the next action; completed runs bring the answer into view. Tabs support keyboard navigation.

## Routes

- `/` and `/workspace`: guided demo by default.
- `/compare`: simple live cost comparison by default.
- `/workspace?view=Pipeline` (or the other existing view names): preserved engineering workspace.
- `/compare?details=1`: preserved full before/after execution and Prompt X-Ray.
- `/lab`: preserved advanced experiments, explicitly labeled optional.

All engineering pages are available from the **Engineering details** menu. The user’s light/dark preference remains intact.

## Data and limits

The guided screen invokes the existing `/explain/experiments` API. Recommendations, replies, policies, calls and billing come from real simulator executions. Sample names and action labels are presentation text, not replacement decision logic. The demo makes no actual refunds or shipments.

No agents, backend endpoints, retrieval rules, token accounting, reference answers or benchmark calculations changed.

## Executed checks

- Production build and TypeScript checks passed.
- Existing acceptance/API/instrumentation suite: 61 passed.
- Browser checked all five supplied customer cases, including refund, replacement, policy restriction and manual review.
- Real original/improved comparison checked on the same selected request.
- Plain-language explanation, keyboard tabs, mobile result layout and optional engineering links checked.
- Mobile viewport and document width both measured 390px; no captured console errors/warnings.
