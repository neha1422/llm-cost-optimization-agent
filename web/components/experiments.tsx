"use client";
import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Download,
  FileText,
  Play,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  configNames,
  Execution,
  Experiment,
  human,
  num,
  request,
  sampleTickets,
  Ticket,
} from "../lib/api";
import {
  ErrorNotice,
  Eyebrow,
  Footer,
  Loading,
  Navigation,
  UnderHood,
} from "./chrome";
function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob(
      [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
      { type: "text/plain" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function ExecutionPanel({
  execution,
  original,
}: {
  execution: Execution;
  original?: boolean;
}) {
  return (
    <section
      className={`execution-panel ${original ? "original-execution" : "optimized-execution"}`}
    >
      <div className="execution-title">
        <span className="execution-icon">
          {original ? <Code2 size={21} /> : <Sparkles size={21} />}
        </span>
        <div>
          <span className="editorial-label">
            {original ? "THE STARTING POINT" : "THE FOCUSED APPROACH"}
          </span>
          <h2>{configNames[execution.configuration]}</h2>
        </div>
        <span className="subtle-tag">
          {execution.model_calls}{" "}
          {execution.model_calls === 1 ? "call" : "calls"}
        </span>
      </div>
      <div className="execution-price">
        <strong>{num(execution.points)}</strong>
        <span>billing points</span>
      </div>
      <div className="execution-bars">
        <div>
          <span>Input tokens</span>
          <strong>{num(execution.input_tokens)}</strong>
        </div>
        <div>
          <span>Output tokens</span>
          <strong>{num(execution.output_tokens)}</strong>
        </div>
        <div>
          <span>Cached input</span>
          <strong>{num(execution.cached_input_tokens)}</strong>
        </div>
        <div>
          <span>Execution duration</span>
          <strong>{num(execution.duration_ms)} ms</strong>
        </div>
        <div>
          <span>Initialization / hydration</span>
          <strong>{num(execution.setup_ms)} ms</strong>
        </div>
      </div>
      <div className="execution-outcome">
        <span className="editorial-label">ACTUAL DECISION</span>
        <h3>{human(execution.action)}</h3>
        <span>
          <FileText size={14} />
          {execution.kb_article}
        </span>
        <p>{execution.customer_reply}</p>
        <div
          className={`correctness-line ${!execution.correct ? "is-failure" : ""}`}
        >
          <ShieldCheck size={14} />
          {execution.correct
            ? "Matches reference action + policy"
            : "Reference mismatch"}
        </div>
      </div>
      <details className="execution-details">
        <summary>
          Calls, context & completions
          <ChevronDown size={15} />
        </summary>
        {execution.calls.map((c, i) => (
          <div key={i} className="call-disclosure">
            <div>
              <strong>
                {i + 1}. {human(c.label)}
              </strong>
              <span>
                {num(c.points)} pts · {num(c.duration_ms)} ms
              </span>
            </div>
            <span className="mono">
              {num(c.input_tokens)} INPUT / {num(c.output_tokens)} OUTPUT
            </span>
            <details>
              <summary>Actual model completion</summary>
              <pre>{c.completion}</pre>
            </details>
            <details>
              <summary>Actual prompt / model context</summary>
              <pre>{c.prompt.slice(0, 8000)}</pre>
              {c.prompt.length > 8000 ? (
                <p>
                  Preview: first 8,000 characters. Download the full trace for
                  all context.
                </p>
              ) : null}
            </details>
          </div>
        ))}
      </details>
      <p className="execution-note">{execution.setup_note}</p>
    </section>
  );
}
export function PromptXray({
  original,
  optimized,
}: {
  original: Execution;
  optimized: Execution;
}) {
  const [callIndex, setCallIndex] = useState(0);
  const old = original.calls[Math.min(callIndex, original.calls.length - 1)],
    fresh = optimized.calls[0];
  const oldLines = new Set(old.prompt.split("\n")),
    newLines = new Set(fresh.prompt.split("\n"));
  const flags = [
    {
      show: /Example ticket resolutions/.test(old.prompt),
      title: "Few-shot examples removed",
    },
    {
      show: /step by step|full reasoning|double-check|restate the ticket/i.test(
        old.prompt,
      ),
      title: "Verbose reasoning requests removed",
    },
    {
      show: (old.prompt.match(/TRIAGE/g) || []).length > 1,
      title: "Repeated triage context removed",
    },
    {
      show: old.input_tokens > fresh.input_tokens,
      title: "Model context reduced",
    },
    {
      show: /only JSON/.test(fresh.prompt),
      title: "Structured output instructions",
    },
  ].filter((f) => f.show);
  function lines(prompt: string, other: Set<string>, kind: string) {
    return prompt
      .slice(0, 10000)
      .split("\n")
      .map((line, i) => (
        <div
          key={i}
          className={!other.has(line) && line.trim() ? kind : "unchanged-line"}
        >
          <span className="line-number">{i + 1}</span>
          <code>{line || " "}</code>
        </div>
      ));
  }
  return (
    <section className="xray-section" id="prompt-xray">
      <div className="xray-heading">
        <div>
          <Eyebrow>Prompt X-Ray</Eyebrow>
          <h2>
            Nothing hidden.
            <br />
            <span>Not even the prompt.</span>
          </h2>
          <p>
            Every unnecessary token increases inference cost. Here is exactly
            what the optimized agent stopped sending.
          </p>
        </div>
        <button
          className="outline-button"
          onClick={() =>
            download({ original, optimized }, "shopassist-full-trace.json")
          }
        >
          <Download size={15} />
          Download full traces
        </button>
      </div>
      <div className="xray-flags">
        {flags.map((f) => (
          <span key={f.title}>
            <Check size={12} />
            {f.title}
          </span>
        ))}
      </div>
      <div className="xray-controls">
        <label htmlFor="xray-call">Original call to inspect</label>
        <select
          id="xray-call"
          value={Math.min(callIndex, original.calls.length - 1)}
          onChange={(e) => setCallIndex(Number(e.target.value))}
        >
          {original.calls.map((c, i) => (
            <option key={i} value={i}>
              {i + 1}. {human(c.label)}
            </option>
          ))}
        </select>
        <span>
          Compared with optimized {fresh.label}. Line highlighting shows changed
          content.
        </span>
      </div>
      <div className="prompt-pair">
        <div>
          <div className="prompt-title">
            <span>
              <i className="removed-dot" />
              Original · {old.label}
            </span>
            <strong>{num(old.input_tokens)} tokens</strong>
          </div>
          <div className="prompt-code">
            {lines(old.prompt, newLines, "removed-line")}
          </div>
        </div>
        <div>
          <div className="prompt-title">
            <span>
              <i className="added-dot" />
              Optimized · {fresh.label}
            </span>
            <strong>{num(fresh.input_tokens)} tokens</strong>
          </div>
          <div className="prompt-code">
            {lines(fresh.prompt, oldLines, "added-line")}
          </div>
        </div>
      </div>
      <div className="xray-footer">
        <span>
          <strong>{num(original.input_tokens - optimized.input_tokens)}</strong>{" "}
          total input tokens eliminated across all calls
        </span>
        <span>
          Prompt counts include role labels. Previews cap at 10,000 characters;
          downloads contain the complete trace.
        </span>
      </div>
    </section>
  );
}
export default function Experiments({ lab = false }: { lab?: boolean }) {
  const [selected, setSelected] = useState("T-1004"),
    [track, setTrack] = useState("q2"),
    [configs, setConfigs] = useState(["baseline_q2", "q1", "q2"]),
    [ticket, setTicket] = useState<Ticket | null>(null),
    [experiment, setExperiment] = useState<Experiment | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [scale, setScale] = useState<"linear" | "log">("linear");
  useEffect(() => {
    setExperiment(null);
  }, [selected, track]);
  useEffect(() => {
    let alive = true;
    setTicket(null);
    request<Ticket>("/tickets/" + selected)
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
    setBusy(true);
    setError("");
    setExperiment(null);
    try {
      setExperiment(
        await request<Experiment>("/explain/experiments", {
          ticket_id: selected,
          configurations: lab ? configs : [`baseline_${track}`, track],
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setBusy(false);
    }
  }
  const original = experiment?.executions.find((e) =>
      e.configuration.startsWith("baseline"),
    ),
    optimized = experiment?.executions.find(
      (e) => !e.configuration.startsWith("baseline"),
    );
  const chart =
    experiment?.executions.map((e) => ({
      name: configNames[e.configuration],
      points: e.points,
      fill: e.configuration.startsWith("baseline") ? "#d2cbc3" : "#ff5a1f",
    })) || [];
  return (
    <div className="product-site">
      <Navigation active={lab ? "lab" : "compare"} />
      <main className="engineering-page">
        <div className="engineering-intro">
          <Eyebrow>
            {lab
              ? "EXPERIMENTS / REPRODUCIBLE EXECUTIONS"
              : "THE ENGINEERING, EXPLAINED"}
          </Eyebrow>
          <h1>
            {lab ? (
              <>
                The Optimization<span> Lab.</span>
              </>
            ) : (
              <>
                Inside the<span> optimization.</span>
              </>
            )}
          </h1>
          <p>
            {lab
              ? "Explore the engineering decisions behind every saved token."
              : "Same customer. Same policy. Two different execution strategies."}
          </p>
        </div>
        <div className="experiment-console">
          <div className="console-toolbar">
            <div>
              <label htmlFor="experiment-ticket">SAMPLE TICKET</label>
              <select
                id="experiment-ticket"
                disabled={busy}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {sampleTickets.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            {!lab ? (
              <div>
                <label htmlFor="comparison-track">ASSIGNMENT TRACK</label>
                <select
                  id="comparison-track"
                  disabled={busy}
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                >
                  <option value="q2">Q2 · Four-stage pipeline</option>
                  <option value="q1">Q1 · Single-call agent</option>
                </select>
              </div>
            ) : (
              <span className="experiment-hint">
                Fresh billing sessions.
                <br />
                Genuine configurations only.
              </span>
            )}
            <button
              className="black-button"
              disabled={busy || !ticket || (lab && !configs.length)}
              onClick={run}
            >
              <Play size={14} />
              {busy
                ? "Executing real Python…"
                : lab
                  ? "Run experiment"
                  : "Run both strategies"}
              <ArrowRight size={15} />
            </button>
          </div>
          {lab ? (
            <div className="configuration-options">
              {Object.entries(configNames).map(([id, name]) => (
                <label
                  key={id}
                  className={configs.includes(id) ? "is-selected" : ""}
                >
                  <input
                    type="checkbox"
                    checked={configs.includes(id)}
                    disabled={busy}
                    onChange={(e) =>
                      setConfigs(
                        e.target.checked
                          ? [...configs, id]
                          : configs.filter((c) => c !== id),
                      )
                    }
                  />
                  <span>
                    <strong>{name}</strong>
                    <small>
                      {id === "baseline_q1"
                        ? "Original prompt · one call"
                        : id === "baseline_q2"
                          ? "Original pipeline · four calls"
                          : id === "q1"
                            ? "Focused prompt · one call"
                            : "Python stages · one model call"}
                    </small>
                  </span>
                  <span className="config-check">
                    <Check size={12} />
                  </span>
                </label>
              ))}
            </div>
          ) : null}
          {ticket ? (
            <div className="experiment-ticket-preview">
              <span className="editorial-label">CUSTOMER / {selected}</span>
              <p>{ticket.ticket.messages[0].text}</p>
              <span>
                {String(ticket.order.title)} ·{" "}
                {String(ticket.order.product_type)}
              </span>
            </div>
          ) : null}
          <div className="console-caption">
            <span className="live-dot" />
            Provided local simulator · gpt-4.1-mini model label · no hosted
            model calls
          </div>
        </div>
        <p className="experiment-disclosure">
          Original baselines retain random trace IDs, so their token counts can
          vary slightly between runs. Optimized decisions and billing are
          unchanged.
        </p>
        {error ? <ErrorNotice message={error} retry={run} /> : null}
        {busy ? (
          <Loading
            text={
              configs.includes("baseline_q2") || track === "q2"
                ? "Executing the original and optimized code; capturing complete prompts"
                : "Executing agents and measuring billing"
            }
          />
        ) : !experiment ? (
          <div className="experiment-empty">
            <div className="empty-diagram">
              <span>Original</span>
              <ArrowRight size={24} />
              <span>Optimized</span>
            </div>
            <h2>Make the comparison your own.</h2>
            <p>
              Pick a ticket and run the real code. Your decisions, prompts, and
              measured costs will appear here.
            </p>
            <span className="mono">NO PREGENERATED EXECUTION RESULTS</span>
          </div>
        ) : null}
        {experiment ? (
          <>
            <div className="experiment-measurement">
              <span>
                <Check size={13} />
                Executed {experiment.executions.length} configurations on{" "}
                {experiment.ticket_id}
              </span>
              <button
                className="quiet-link"
                onClick={() =>
                  download(experiment, "shopassist-experiment.json")
                }
              >
                <Download size={13} />
                Export experiment
              </button>
            </div>
            {original && optimized && !lab ? (
              <>
                <div className="comparison-summary">
                  <div>
                    <span>Cost reduction</span>
                    <strong>
                      {((1 - optimized.points / original.points) * 100).toFixed(
                        2,
                      )}
                      <em>%</em>
                      <ArrowDownRight size={25} />
                    </strong>
                  </div>
                  <div>
                    <span>Input tokens saved</span>
                    <strong>
                      {num(original.input_tokens - optimized.input_tokens)}
                    </strong>
                  </div>
                  <div>
                    <span>Output tokens saved</span>
                    <strong>
                      {num(original.output_tokens - optimized.output_tokens)}
                    </strong>
                  </div>
                  <div>
                    <span>Model calls avoided</span>
                    <strong>
                      {original.model_calls - optimized.model_calls}
                    </strong>
                  </div>
                </div>
                <div className="comparison-agreement">
                  <ShieldCheck size={17} />
                  <span>
                    {original.action === optimized.action &&
                    original.kb_article === optimized.kb_article
                      ? "Same action. Same supporting policy."
                      : "The executions produced different decisions."}
                  </span>
                  <span>
                    {original.correct && optimized.correct
                      ? "Both match the supplied reference."
                      : "Inspect reference mismatch."}
                  </span>
                </div>
                <div className="execution-pair">
                  <ExecutionPanel execution={original} original />
                  <ExecutionPanel execution={optimized} />
                </div>
                <PromptXray
                  key={original.configuration + selected}
                  original={original}
                  optimized={optimized}
                />
              </>
            ) : (
              <>
                <section className="experiment-chart-panel">
                  <div className="chart-editorial-heading">
                    <div>
                      <Eyebrow>Measured billing points</Eyebrow>
                      <h2>One ticket. Different economics.</h2>
                    </div>
                    <div className="mode-switch">
                      <button
                        className={scale === "linear" ? "chosen" : ""}
                        onClick={() => setScale("linear")}
                      >
                        Linear
                      </button>
                      <button
                        className={scale === "log" ? "chosen" : ""}
                        onClick={() => setScale("log")}
                      >
                        Log scale
                      </button>
                    </div>
                  </div>
                  <div className="experiment-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chart}
                        layout="vertical"
                        margin={{ right: 75, left: 20 }}
                      >
                        <CartesianGrid horizontal={false} stroke="#e7e4df" />
                        <XAxis
                          type="number"
                          scale={scale}
                          domain={scale === "log" ? [1, "auto"] : [0, "auto"]}
                          tick={{ fill: "#777", fontSize: 11 }}
                          tickFormatter={(v) => num(v)}
                          allowDataOverflow
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={115}
                          tick={{ fill: "#222", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "#f2f0ec" }}
                          contentStyle={{
                            background: "#fff",
                            border: "1px solid #e7e4df",
                            borderRadius: 8,
                          }}
                        />
                        <Bar
                          dataKey="points"
                          fill="#ff5a1f"
                          maxBarSize={28}
                          isAnimationActive={false}
                          radius={[0, 4, 4, 0]}
                        >
                          <LabelList
                            dataKey="points"
                            position="right"
                            formatter={(v: unknown) => num(Number(v))}
                            fill="#111"
                            fontSize={11}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="chart-note">
                    {scale === "log"
                      ? "Logarithmic axis begins at 1; equal distances represent equal ratios."
                      : "Linear axis begins at zero; bar lengths represent measured points."}{" "}
                    Exact values are labeled.
                  </p>
                </section>
                <div className="lab-result-grid">
                  {experiment.executions.map((e) => (
                    <ExecutionPanel
                      key={e.configuration}
                      execution={e}
                      original={e.configuration.startsWith("baseline")}
                    />
                  ))}
                </div>
                <div className="lab-methodology">
                  <ScanLine size={23} />
                  <div>
                    <h3>Configurations, not pretend switches.</h3>
                    <p>
                      Compression, retrieval, validation and caching are not
                      independently switchable in the preserved agents. This lab
                      compares the actual baseline, Q1 and Q2 implementations.
                      Combined savings are measured directly; individual effects
                      are not assumed additive.
                    </p>
                  </div>
                </div>
                {original && optimized ? (
                  <PromptXray
                    key={selected + original.configuration}
                    original={original}
                    optimized={optimized}
                  />
                ) : null}
              </>
            )}
          </>
        ) : null}
        <UnderHood />
      </main>
      <Footer />
    </div>
  );
}
