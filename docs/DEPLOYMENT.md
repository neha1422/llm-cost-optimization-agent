# Deployment

The frontend is a real Next.js static export. It calls the Python FastAPI application at `/api` in production. No Python business logic is translated into JavaScript.

## Vercel

Deploy from the repository root using `vercel --prod`, or import the personal GitHub repository into Vercel. The tracked `vercel.json` builds the root `package.json` (which builds `web/`) with `@vercel/static-build` and `api/index.py` with `@vercel/python`. The API entrypoint mounts the local application at `/api`; static assets are served from the CDN.

No secrets or paid external model are required. Keep deployment protection off for this newly created public demo project. Do not change protection on unrelated projects.

Health: `/api/health`. Interactive API docs: `/api/docs`.

## Local production preview

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm --prefix web ci
npm --prefix web run build
uvicorn preview:app --host 127.0.0.1 --port 3000
```

Open http://127.0.0.1:3000. This serves the production export and API together.

## Separate development servers

Run `uvicorn backend.app:app --port 8000`, then `NEXT_PUBLIC_API_URL=http://localhost:8000 npm --prefix web run dev`. The default CORS origin is http://localhost:3000; set `CORS_ORIGINS` to a comma-separated explicit list for other origins. `.env.example` documents the configuration. Never commit local `.env` files.

## Public resource limits

Only five supplied sample ticket IDs can execute through the API; request bodies are capped at 4 KB. Concurrency is capped at four per process and requests have a 30-second response timeout. This does not provide a global distributed rate limit or forcibly cancel a running Python thread. A real hosted LLM deployment needs authentication, provider budgets and a distributed limiter. This demo uses no external model API.

The benchmark endpoint reruns optimized agents and compares them with the recorded baseline. Full baseline regeneration is a local CLI command because the unchanged expanded KB builder is intentionally expensive. Results are returned without mutating deployment files or pretending to persist invocation history.
