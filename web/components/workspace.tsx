"use client";
import { useEffect, useState } from "react";
import Playground from "./playground";
import { ThemeToggle } from "./theme";
import type { Execution, Experiment } from "../lib/api";
import { Wordmark } from "./chrome";
import verification from "../lib/verification.json";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Code2,
  FlaskConical,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Ticket,
  Workflow,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Call = {
  label: string;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  points: number;
};
type Stage = {
  name: string;
  kind: string;
  result: Record<string, unknown>;
  input_tokens: number;
  output_tokens: number;
  points: number;
  duration_ms: number;
};
type Measurement = {
  action: string;
  kb_article: string;
  correct: boolean;
  points: number;
  calls: Call[];
  stages: Stage[];
};
type Row = {
  mode: string;
  ticket_id: string;
  target: number;
  target_met: boolean;
  baseline: Measurement;
  optimized: Measurement;
  savings_percent: number;
};
type Report = {
  generated_at: string;
  engine: string;
  cost_method: string;
  execution?: string;
  rows: Row[];
};
type TicketData = {
  ticket: { ticket_id: string; messages: { from: string; text: string }[] };
  order: Record<string, unknown>;
};
type Resolution = {
  ticket_id: string;
  mode: string;
  action: string;
  kb_article: string;
  customer_reply: string;
  points: number;
  calls: Call[];
  stages: Stage[];
  duration_ms: number;
};
type Article = { id: string; content: string };
function PipelineRunner() {
  const [trace, setTrace] = useState<Execution | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [ticket, setTicket] = useState("T-1004");
  async function execute() {
    setBusy(true);
    setError("");
    try {
      const r = await request<Experiment>("/explain/experiments", {
        ticket_id: ticket,
        configurations: ["q2"],
      });
      setTrace(r.executions[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="pipeline-toolbar">
        <select
          aria-label="Pipeline sample ticket"
          value={ticket}
          disabled={busy}
          onChange={(e) => {
            setTicket(e.target.value);
            setTrace(null);
          }}
        >
          {["T-1001", "T-1002", "T-1003", "T-1004", "T-1091"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <button className="button primary" disabled={busy} onClick={execute}>
          {busy ? "Executing…" : "Run pipeline"}
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <Pipeline stages={trace?.stages} />
      {trace ? (
        <p className="muted">
          Executed {trace.ticket_id} · {num(trace.points)} points ·{" "}
          {trace.model_calls} model call
        </p>
      ) : null}
    </>
  );
}
const API = process.env.NEXT_PUBLIC_API_URL || "/api";
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(API + path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`API request failed (${response.status}). Please retry.`);
  return response.json();
}
const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Ticket playground", icon: Ticket },
  { name: "Pipeline", icon: Workflow },
  { name: "Cost analytics", icon: Activity },
  { name: "Knowledge base", icon: BookOpen },
  { name: "Benchmarks", icon: FlaskConical },
  { name: "Architecture", icon: Layers3 },
];
const num = (n: number) => new Intl.NumberFormat("en-US").format(n);
const label = (s: string) => s.replaceAll("-", " ").replaceAll("_", " ");
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="badge">
      <span />
      {children}
    </span>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <Terminal size={28} />
      <p>{children}</p>
    </div>
  );
}
function Chart({ rows }: { rows: Row[] }) {
  const [log, setLog] = useState(false);
  const data = rows.map((r) => ({
    name: `${r.mode.toUpperCase()} · ${r.ticket_id.slice(2)}`,
    Baseline: r.baseline.points,
    Optimized: r.optimized.points,
  }));
  return (
    <>
      <div className="scale-control">
        <span>Billing points</span>
        <button aria-pressed={log} onClick={() => setLog(!log)}>
          {log
            ? "Logarithmic scale · switch to linear"
            : "Linear scale · switch to log"}
        </button>
      </div>
      <div
        className="chart"
        role="img"
        aria-label="Measured baseline and optimized points per ticket"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={3}>
            <CartesianGrid
              strokeDasharray="3 5"
              stroke="#e7e4df"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#8b99b2", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              scale={log ? "log" : "linear"}
              domain={log ? [1, "auto"] : [0, "auto"]}
              allowDataOverflow
              tick={{ fill: "#8b99b2", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e7e4df",
                borderRadius: 10,
                color: "#111111",
              }}
              cursor={{ fill: "#ffffff05" }}
            />
            <Legend />
            <Bar dataKey="Baseline" fill="#cbc5bd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Optimized" fill="#ff5a1f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="chart-note">
        {log
          ? "Log scale starts at 1; equal spacing represents equal ratios."
          : "Linear scale starts at zero. Optimized points are detailed separately below."}
      </p>
    </>
  );
}
function Metrics({ report }: { report: Report }) {
  const base = report.rows.reduce((s, r) => s + r.baseline.points, 0),
    opt = report.rows.reduce((s, r) => s + r.optimized.points, 0);
  const correct = report.rows.filter((r) => r.optimized.correct).length;
  return (
    <div className="metrics">
      {[
        {
          title: "Cost reduction",
          value: `${((1 - opt / base) * 100).toFixed(1)}%`,
          detail: "Against the measured baseline",
          icon: ArrowDownRight,
          color: "purple",
        },
        {
          title: "Optimized billing",
          value: num(opt),
          detail: `${num(base)} baseline points`,
          icon: CircleDollarSign,
          color: "cyan",
        },
        {
          title: "Evaluated correctness",
          value: `${correct}/${report.rows.length}`,
          detail: "Action + policy reference match",
          icon: ShieldCheck,
          color: "green",
        },
        {
          title: "Tickets evaluated",
          value: String(report.rows.length / 2).padStart(2, "0"),
          detail: "Across both optimization tracks",
          icon: Ticket,
          color: "blue",
        },
      ].map((m) => (
        <div className={`metric ${m.color}`} key={m.title}>
          <div className="metric-top">
            {m.title}
            <m.icon size={18} />
          </div>
          <strong>{m.value}</strong>
          <small>{m.detail}</small>
        </div>
      ))}
    </div>
  );
}
function Pipeline({ stages }: { stages?: Stage[] }) {
  const [active, setActive] = useState(0);
  const descriptions = [
    "Read customer context and order facts. No LLM needed.",
    "Find relevant source policies with fact-aware lexical search.",
    "One concise model call produces structured resolution JSON.",
    "Check schema, citation, valid action and policy compatibility.",
  ];
  const names = ["triage", "retrieve", "compose", "audit"];
  return (
    <>
      <div className="pipeline">
        {names.map((name, i) => {
          const s = stages?.find((s) => s.name === name);
          return (
            <button
              key={name}
              className={`stage ${active === i ? "selected" : ""}`}
              onClick={() => setActive(i)}
            >
              <span className="stage-no">0{i + 1}</span>
              <div className="stage-symbol">
                {i === 2 ? (
                  <Sparkles size={23} />
                ) : i === 3 ? (
                  <ShieldCheck size={23} />
                ) : i === 1 ? (
                  <Search size={23} />
                ) : (
                  <Workflow size={23} />
                )}
              </div>
              <strong>{label(name)}</strong>
              <small>{i === 2 ? "1 LLM call" : "Deterministic"}</small>
              <span className={`stage-cost ${i === 2 ? "billable" : ""}`}>
                {s
                  ? `${num(s.points)} pts`
                  : i === 2
                    ? "Measured on execution"
                    : "0 pts"}
              </span>
              {i < 3 ? (
                <ChevronRight className="stage-arrow" size={17} />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="stage-detail">
        <span className="mono">
          0{active + 1} / {names[active].toUpperCase()}
        </span>
        <p>{descriptions[active]}</p>
        {stages?.[active] ? (
          <pre>{JSON.stringify(stages[active], null, 2)}</pre>
        ) : null}
      </div>
    </>
  );
}
export default function Home() {
  const [view, setView] = useState("Overview");
  const [report, setReport] = useState<Report | null>(null);
  const [tickets, setTickets] = useState<
    { ticket_id: string; title: string }[]
  >([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState("T-1001");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [mode, setMode] = useState("q2");
  const [result, setResult] = useState<Resolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [benchLoading, setBenchLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [article, setArticle] = useState<Article | null>(null);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("view");
    if (requested && navigation.some((n) => n.name === requested))
      setView(requested);
    let alive = true;
    Promise.all([
      request<Report>("/benchmarks/results"),
      request<typeof tickets>("/tickets"),
      request<Article[]>("/kb/articles"),
    ])
      .then(([r, t, a]) => {
        if (alive) {
          setReport(r);
          setTickets(t);
          setArticles(a);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    setTicket(null);
    setResult(null);
    request<TicketData>(`/tickets/${selected}`)
      .then((t) => {
        if (alive) setTicket(t);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      });
    return () => {
      alive = false;
    };
  }, [selected]);
  async function run() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(
        await request<Resolution>(`/agent/${mode}/run`, {
          ticket_id: selected,
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setLoading(false);
    }
  }
  async function benchmark() {
    setBenchLoading(true);
    setError("");
    try {
      setReport(await request<Report>("/benchmarks/run", {}));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Benchmark failed");
    } finally {
      setBenchLoading(false);
    }
  }
  const rows = report?.rows || [];
  const chartRows = rows.filter((r) => filter === "all" || r.mode === filter);
  const input = rows.reduce(
    (sum, r) => sum + r.optimized.calls.reduce((s, c) => s + c.input_tokens, 0),
    0,
  );
  const output = rows.reduce(
    (sum, r) =>
      sum + r.optimized.calls.reduce((s, c) => s + c.output_tokens, 0),
    0,
  );
  const filteredArticles = articles.filter(
    (a) =>
      (a.id + " " + a.content).toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || a.id.includes(filter)),
  );
  const retrievedIds = result?.stages.find((s) => s.name === "retrieve")?.result
    .articles;
  const pageTitles: Record<string, [string, string]> = {
    Overview: [
      "Less spend. Same intelligence.",
      "A clear view of every token, decision, and optimization.",
    ],
    "Ticket playground": [
      "Put the agents to work.",
      "Run real Python agents on the assignment’s sample support tickets.",
    ],
    Pipeline: [
      "Four stages. One model call.",
      "Explore how each responsibility contributes to an efficient resolution.",
    ],
    "Cost analytics": [
      "Every token accounted for.",
      "Measured billing points, compared across tickets and agent architectures.",
    ],
    "Knowledge base": [
      "Policy is the source of truth.",
      "Explore the actual help-center articles used by the agents.",
    ],
    Benchmarks: [
      "Proof, not promises.",
      "Reproduce optimized results and compare with recorded baseline measurements.",
    ],
    Architecture: [
      "Built for clarity. Optimized for cost.",
      "A transparent look at the original and optimized execution paths.",
    ],
  };
  function navigate(name: string) {
    setView(name);
    setFilter("all");
    setError("");
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="workspace-brand">
          <Wordmark />
        </div>
        <div className="workspace">
          <span className="workspace-icon">S</span>
          <div>
            Engineering workspace<small>Internship assignment</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <div className="nav-caption">ENGINEERING WORKSPACE</div>
        <div className="new-workspace-links">
          <a href="/compare">
            <Code2 size={17} />
            Before vs after
            <ArrowRight size={13} />
          </a>
          <a href="/lab">
            <FlaskConical size={17} />
            Optimization lab
            <ArrowRight size={13} />
          </a>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <button
              key={n.name}
              className={view === n.name ? "active" : ""}
              disabled={!report}
              onClick={() => navigate(n.name)}
            >
              <n.icon size={18} />
              <span>{n.name}</span>
              {view === n.name ? <span className="nav-dot" /> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="simulator">
            <span className="status-dot" />
            <strong>Local LLM simulator</strong>
            <p>
              Provided assignment engine.
              <br />
              No external API calls or keys.
            </p>
            <span className="mono">PYTHON ENGINE / V1.0</span>
          </div>
          <a href={`${API}/docs`} target="_blank" rel="noreferrer">
            <Code2 size={16} />
            API documentation
            <ArrowRight size={14} />
          </a>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            <a href="/">ShopAssist AI</a> <ChevronRight size={14} />
            <strong>{view}</strong>
          </span>
          <div>
            <ThemeToggle />
            <span className="top-label">LLM ENGINEERING</span>
            <span className="avatar">SA</span>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> SHOPASSIST AI / {view.toUpperCase()}
              </div>
              <h1>{pageTitles[view][0]}</h1>
              <p>{pageTitles[view][1]}</p>
            </div>
            <button
              className="button primary"
              onClick={() =>
                view === "Benchmarks"
                  ? benchmark()
                  : navigate("Ticket playground")
              }
              disabled={benchLoading || !report}
            >
              {benchLoading ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Play size={15} />
              )}{" "}
              {view === "Benchmarks" ? "Run benchmarks" : "Launch playground"}
              <ArrowRight size={15} />
            </button>
          </div>
          {error ? (
            <div className="error" role="alert">
              {error}
              <button onClick={() => window.location.reload()}>Reload</button>
            </div>
          ) : null}
          {!report && !error ? (
            <Empty>Loading measured benchmark data…</Empty>
          ) : null}
          {view === "Overview" && report ? (
            <>
              <Metrics report={report} />
              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Optimization impact</h2>
                      <p>Baseline vs optimized · billing points per ticket</p>
                    </div>
                    <Badge>MEASURED DATA</Badge>
                  </div>
                  <Chart rows={rows.filter((r) => r.mode === "q2")} />
                  <div className="panel-foot">
                    <span>
                      <span className="status-dot" />
                      All five Q2 samples meet the cost target
                    </span>
                    <button
                      className="text-button"
                      onClick={() => navigate("Cost analytics")}
                    >
                      Explore analytics <ArrowRight size={14} />
                    </button>
                  </div>
                </section>
                <section className="panel track-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Two tracks. One goal.</h2>
                      <p>Correct decisions, fewer tokens.</p>
                    </div>
                    <Zap size={19} />
                  </div>
                  {["q1", "q2"].map((m, i) => {
                    const r = rows.filter((r) => r.mode === m);
                    const avg =
                      r.reduce((s, r) => s + r.optimized.points, 0) / r.length;
                    return (
                      <button
                        className="track"
                        key={m}
                        onClick={() => {
                          setMode(m);
                          navigate("Ticket playground");
                        }}
                      >
                        <div className="track-title">
                          <span className={`track-icon track-${i}`}>
                            {i === 0 ? (
                              <Sparkles size={20} />
                            ) : (
                              <Workflow size={20} />
                            )}
                          </span>
                          <div>
                            <strong>
                              {m.toUpperCase()} ·{" "}
                              {i === 0
                                ? "Single-call agent"
                                : "Optimized pipeline"}
                            </strong>
                            <small>
                              {i === 0
                                ? "A focused prompt, a precise answer."
                                : "Four responsibilities, one model call."}
                            </small>
                          </div>
                          <ArrowRight size={16} />
                        </div>
                        <div className="track-metrics">
                          <span>
                            <strong>{num(avg)}</strong>avg. points / ticket
                          </span>
                          <span className="target">
                            <Check size={13} />≤ {i === 0 ? "3,000" : "2,500"}{" "}
                            target
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  <div className="callout">
                    <ShieldCheck size={18} />
                    <p>
                      Correctness preserved on every supplied ticket, including
                      the subscription holdout.
                    </p>
                  </div>
                </section>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>A leaner path to resolution</h2>
                    <p>Q2 architecture · select a stage to inspect its role</p>
                  </div>
                  <span className="chip">3 deterministic stages</span>
                </div>
                <Pipeline />
              </section>
              <div className="bottom-stats">
                <span>
                  <Terminal size={15} /> {num(input)} input tokens ·{" "}
                  {num(output)} output tokens
                </span>
                <span>Fresh sessions · no cache discount claimed</span>
                <span>5 sample tickets × 2 tracks</span>
              </div>
            </>
          ) : null}
          {view === "Ticket playground" ? (
            <Playground
              onResult={setResult}
              onPolicy={(id) => {
                setArticle(articles.find((a) => a.id === id) || null);
                setSearch("");
                navigate("Knowledge base");
              }}
            />
          ) : null}
          {view === "Pipeline" ? (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Optimized Q2 pipeline</h2>
                  <p>
                    {result?.stages.length
                      ? `Last executed: ${result.ticket_id}`
                      : "Run a Q2 ticket to populate a live trace."}
                  </p>
                </div>
                <button
                  className="button"
                  onClick={() => {
                    setMode("q2");
                    navigate("Ticket playground");
                  }}
                >
                  Run a ticket <ArrowRight size={14} />
                </button>
              </div>
              <PipelineRunner />
              <div className="callout">
                <ShieldCheck size={20} />
                <p>
                  Deterministic stages have zero LLM billing points. Their token
                  counts describe text processed, not billed model input. Audit
                  checks structure and policy/action compatibility; it is not an
                  independent guarantee of semantic correctness.
                </p>
              </div>
            </section>
          ) : null}
          {view === "Cost analytics" && report ? (
            <>
              <Metrics report={report} />
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Cost by ticket and track</h2>
                    <p>
                      Cold-session measurements · exact repository billing
                      formula
                    </p>
                  </div>
                  <select
                    aria-label="Filter track"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Both tracks</option>
                    <option value="q1">Q1 single call</option>
                    <option value="q2">Q2 pipeline</option>
                  </select>
                </div>
                <Chart rows={chartRows} />
              </section>
              <section className="panel">
                <h2>Optimized cost detail</h2>
                <p className="muted">
                  A separate zero-based view keeps the optimized measurements
                  readable.
                </p>
                <div className="detail-bars">
                  {chartRows.map((r) => (
                    <div key={r.mode + r.ticket_id}>
                      <span>
                        {r.mode.toUpperCase()} · {r.ticket_id}
                      </span>
                      <i
                        style={{
                          width: `${(r.optimized.points / 3000) * 100}%`,
                        }}
                      />
                      <strong>{num(r.optimized.points)} pts</strong>
                      <small>{r.savings_percent}% saved</small>
                    </div>
                  ))}
                </div>
              </section>
              <div className="two-col">
                <section className="panel">
                  <h2>Token consumption</h2>
                  <p className="muted">Optimized input vs output tokens</p>
                  <div className="token-bars">
                    <div>
                      <span>
                        Input <b>{num(input)}</b>
                      </span>
                      <i
                        style={{
                          width: `${(input / (input + output)) * 100}%`,
                        }}
                      />
                    </div>
                    <div>
                      <span>
                        Output <b>{num(output)}</b>
                      </span>
                      <i
                        style={{
                          width: `${(output / (input + output)) * 100}%`,
                          background: "#62d4c5",
                        }}
                      />
                    </div>
                  </div>
                  <p className="muted">
                    Cached input: 0 tokens. Prompts are below the 1,024-token
                    cache threshold.
                  </p>
                </section>
                <section className="panel">
                  <h2>Q2 stage costs</h2>
                  <p className="muted">Average across five sample tickets</p>
                  {["triage", "retrieve", "compose", "audit"].map((s) => (
                    <div className="cost-line" key={s}>
                      <span>{label(s)}</span>
                      <strong>
                        {num(
                          rows
                            .filter((r) => r.mode === "q2")
                            .reduce(
                              (a, r) =>
                                a +
                                (r.optimized.stages.find((t) => t.name === s)
                                  ?.points || 0),
                              0,
                            ) / 5,
                        )}{" "}
                        pts
                      </strong>
                    </div>
                  ))}
                </section>
              </div>
              <div className="formula mono">
                points = uncached input × 3 + cached input × 0.3 + output × 15
              </div>
            </>
          ) : null}
          {view === "Knowledge base" ? (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Help-center policies</h2>
                    <p>
                      {articles.length} source articles · real repository
                      content
                    </p>
                  </div>
                  <BookOpen size={20} />
                </div>
                <div className="search-row">
                  <div className="search">
                    <Search size={17} />
                    <input
                      aria-label="Search policies"
                      placeholder="Search policies, products, or conditions…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Policy category"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All policies</option>
                    <option value="returns">Returns</option>
                    <option value="damage">Damage</option>
                    <option value="digital">Digital</option>
                    <option value="custom">Custom</option>
                    <option value="subscription">Subscriptions</option>
                  </select>
                </div>
                <div className="articles">
                  {filteredArticles.map((a) => (
                    <button
                      key={a.id}
                      className={`article-card ${article?.id === a.id ? "chosen" : ""}`}
                      onClick={() => setArticle(a)}
                    >
                      <BookOpen size={22} />
                      <h3>{label(a.id)}</h3>
                      {Array.isArray(retrievedIds) &&
                      retrievedIds.includes(a.id) ? (
                        <span className="retrieved-tag">
                          <Check size={10} />
                          Retrieved in last Q2 run
                        </span>
                      ) : null}
                      <p>
                        {a.content
                          .split("\n")
                          .filter(Boolean)
                          .slice(1)
                          .join(" ")
                          .replaceAll("**", "")}
                      </p>
                      <span>
                        Read policy <ArrowRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
                {!filteredArticles.length ? (
                  <Empty>No policies match this search.</Empty>
                ) : null}
              </section>
              {article ? (
                <section className="panel article-reader">
                  <span className="eyebrow">SOURCE POLICY</span>
                  <h2>{label(article.id)}</h2>
                  <div className="policy-text">
                    {article.content
                      .replace(/^# .*\n/, "")
                      .replaceAll("**", "")}
                  </div>
                  <span className="mono muted">data/kb/{article.id}.md</span>
                </section>
              ) : null}
            </>
          ) : null}
          {view === "Benchmarks" && report ? (
            <>
              <Metrics report={report} />
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Acceptance results</h2>
                    <p>
                      {report.execution ||
                        "Baseline and optimized agents measured by the reproducible CLI suite."}
                    </p>
                  </div>
                  <Badge>
                    {rows.every((r) => r.target_met && r.optimized.correct)
                      ? "ALL TARGETS MET"
                      : "REVIEW REQUIRED"}
                  </Badge>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Track</th>
                        <th>Decision / policy</th>
                        <th>Baseline pts</th>
                        <th>Optimized pts</th>
                        <th>Savings</th>
                        <th>Correctness</th>
                        <th>Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.mode + r.ticket_id}>
                          <td className="mono">{r.ticket_id}</td>
                          <td>
                            <span className="chip">{r.mode.toUpperCase()}</span>
                          </td>
                          <td className="benchmark-decision">
                            <strong>{r.optimized.action}</strong>
                            <small>{r.optimized.kb_article}</small>
                          </td>
                          <td>{num(r.baseline.points)}</td>
                          <td className="bright">{num(r.optimized.points)}</td>
                          <td className="green-text">{r.savings_percent}%</td>
                          <td>
                            {r.optimized.correct ? (
                              <span className="success">
                                <CheckCircle2 size={14} />
                                Pass
                              </span>
                            ) : (
                              "Fail"
                            )}
                          </td>
                          <td>
                            {r.target_met ? "Met" : "Exceeded"} /{" "}
                            {num(r.target)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="panel-foot">
                  <span>
                    4 public cases + T-1091 subscription holdout per track ·
                    measured {new Date(report.generated_at).toLocaleString()}
                  </span>
                  <button
                    className="text-button"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(report, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "shopassist-benchmarks.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download JSON <ArrowRight size={14} />
                  </button>
                </div>
              </section>
              <section className="panel">
                <h2>Recorded regression evidence</h2>
                <p className="muted">
                  {verification.passed} acceptance, API and instrumentation
                  tests passed in the recorded local pytest run. These include
                  new order combinations and policy boundary ages. The complete
                  suite recorded {verification.full_suite_passed} passes and{" "}
                  {verification.full_suite_failed} unchanged legacy high-cost
                  assertion failures. The benchmark button reruns sample agents,
                  not this test suite.
                </p>
                <details className="recorded-tests">
                  <summary>
                    Inspect the {verification.cases.length} executed acceptance
                    cases
                  </summary>
                  <div>
                    {verification.cases.map((c) => (
                      <p key={c.suite + c.name}>
                        <span>{c.name}</span>
                        <strong>{c.passed ? "PASS" : "FAIL"}</strong>
                      </p>
                    ))}
                  </div>
                </details>
                <h2>What the benchmark button runs</h2>
                <p className="muted">
                  All five tickets are executed again through each optimized
                  Python agent. Baseline costs come from the recorded CLI run.
                  Run <code>python -m benchmarks.run</code> locally to
                  regenerate both. This button does not run pytest.
                </p>
                <div className="formula mono">
                  Input × 3 + cached input × 0.3 + output × 15
                </div>
              </section>
            </>
          ) : null}
          {view === "Architecture" ? (
            <>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Q1 · One call, focused context</h2>
                    <p>
                      The interface stays the same. The prompt becomes smaller.
                    </p>
                  </div>
                  <Sparkles size={22} />
                </div>
                <div className="architecture">
                  <div>
                    <span className="field-label">ORIGINAL</span>
                    <div className="flow">
                      <span>Ticket + order</span>
                      <ArrowRight />
                      <span>All policies + examples + random ID</span>
                      <ArrowRight />
                      <span>Verbose LLM response</span>
                    </div>
                  </div>
                  <div>
                    <span className="field-label green-text">OPTIMIZED</span>
                    <div className="flow optimized">
                      <span>Ticket + compact order</span>
                      <ArrowRight />
                      <span>Relevant source policies</span>
                      <ArrowRight />
                      <span>One call → validated JSON</span>
                    </div>
                  </div>
                </div>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Q2 · Keep responsibilities, remove waste</h2>
                    <p>
                      Python handles deterministic work; the model handles
                      composition.
                    </p>
                  </div>
                  <Workflow size={22} />
                </div>
                <div className="flow baseline-flow">
                  <span>LLM triage + huge KB</span>
                  <ArrowRight />
                  <span>LLM retrieve</span>
                  <ArrowRight />
                  <span>LLM compose</span>
                  <ArrowRight />
                  <span>LLM audit + huge KB</span>
                </div>
                <Pipeline />
              </section>
              <section className="panel">
                <h2>Engineering boundaries</h2>
                <div className="boundary-grid">
                  <div>
                    <Code2 />
                    <h3>Python stays Python</h3>
                    <p>
                      Next.js dashboard → HTTPS API → FastAPI → original Python
                      agent interfaces.
                    </p>
                  </div>
                  <div>
                    <BookOpen />
                    <h3>Source-backed retrieval</h3>
                    <p>
                      Fact-aware lexical candidates retain policy exceptions and
                      the general fallback. No ticket-specific answer mapping.
                    </p>
                  </div>
                  <div>
                    <CircleDollarSign />
                    <h3>Unchanged accounting</h3>
                    <p>
                      The supplied simulator, tokenizer, billing system,
                      reference answers, and original tests are preserved.
                    </p>
                  </div>
                </div>
                <div className="callout">
                  <Terminal size={20} />
                  <p>
                    This demo uses the provided local simulator. Its decisions
                    are derived from order facts internally; results do not
                    establish hosted-model accuracy. A real model needs separate
                    evaluation, prompt-injection defenses and business-policy
                    validation.
                  </p>
                </div>
              </section>
            </>
          ) : null}
          <footer>
            <span>
              ShopAssist AI <span className="footer-dot">·</span> Intelligent
              Customer Support. Optimized for Accuracy and Cost.
            </span>
            <a
              href="https://github.com/Induseuro-labs/intern-assignment-llm-cost-optimization"
              target="_blank"
              rel="noreferrer"
            >
              Original assignment <ArrowRight size={12} />
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
