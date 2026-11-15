"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  Execution,
  human,
  num,
  request,
  sampleTickets,
  Ticket,
} from "../lib/api";
import { ErrorNotice, Loading } from "./chrome";
export default function Playground({
  onResult,
  onPolicy,
}: {
  onResult?: (result: Execution & { mode: string }) => void;
  onPolicy?: (article: string) => void;
}) {
  const [selected, setSelected] = useState("T-1001"),
    [mode, setMode] = useState("q2"),
    [ticket, setTicket] = useState<Ticket | null>(null),
    [result, setResult] = useState<Execution | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setTicket(null);
    setResult(null);
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
    setResult(null);
    setError("");
    try {
      const r = await request<{ executions: Execution[] }>(
        "/explain/experiments",
        { ticket_id: selected, configurations: [mode] },
      );
      setResult(r.executions[0]);
      onResult?.({ ...r.executions[0], mode });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="play-toolbar">
        <div>
          <label htmlFor="play-ticket">Customer ticket</label>
          <select
            id="play-ticket"
            value={selected}
            disabled={busy}
            onChange={(e) => setSelected(e.target.value)}
          >
            {sampleTickets.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="mode-switch" aria-label="Agent mode">
          {["q1", "q2"].map((m) => (
            <button
              key={m}
              aria-pressed={mode === m}
              disabled={busy}
              className={mode === m ? "chosen" : ""}
              onClick={() => {
                setMode(m);
                setResult(null);
              }}
            >
              {m.toUpperCase()} · {m === "q1" ? "Single call" : "Pipeline"}
            </button>
          ))}
        </div>
        <button
          className="black-button"
          onClick={run}
          disabled={busy || !ticket}
        >
          <Play size={14} />
          {busy ? "Executing…" : "Run agent"}
          <ArrowRight size={15} />
        </button>
      </div>
      {error ? <ErrorNotice message={error} retry={run} /> : null}
      <div className="support-product">
        <section className="support-order">
          <span className="editorial-label">01 / CUSTOMER CONTEXT</span>
          {ticket ? (
            <>
              <h2>{String(ticket.order.title)}</h2>
              <div className="order-status">
                <span className="live-dot" />
                Order facts loaded
              </div>
              <dl>
                {Object.entries(ticket.order).map(([k, v]) => (
                  <div key={k}>
                    <dt>{human(k)}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <Loading text="Reading order" />
          )}
        </section>
        <section className="support-chat">
          <div className="support-chat-header">
            <span className="mini-mark">s</span>
            <strong>ShopAssist</strong>
            <span className="subtle-tag">{mode.toUpperCase()}</span>
          </div>
          <div className="chat-body">
            {ticket?.ticket.messages.map((m, i) => (
              <div
                key={i}
                className={`support-bubble ${m.from === "customer" ? "from-customer" : "from-agent"}`}
              >
                <small>
                  {m.from === "customer" ? "Customer" : "Support team"}
                </small>
                <p>{m.text}</p>
              </div>
            ))}
            {busy ? (
              <Loading text="Reading facts and composing a resolution" />
            ) : result ? (
              <div className="support-bubble from-ai" aria-live="polite">
                <small>
                  <Sparkles size={13} />
                  ShopAssist AI
                </small>
                <p>{result.customer_reply}</p>
                <span className="decision-stamp">
                  <Check size={11} />
                  {human(result.action)}
                </span>
              </div>
            ) : (
              <div className="chat-placeholder">
                <Sparkles size={22} />
                <p>
                  Your agent’s response belongs here.
                  <br />
                  Run the sample to begin.
                </p>
              </div>
            )}
          </div>
          <div className="chat-composer">
            <span>Sample tickets keep the demo reproducible.</span>
            <ShieldCheck size={16} />
          </div>
        </section>
        <aside className="decision-panel">
          <span className="editorial-label">02 / DECISION INTELLIGENCE</span>
          {result ? (
            <>
              <span className="decision-check">
                <ShieldCheck size={20} />
              </span>
              <h2>{human(result.action)}</h2>
              <div className="correctness-line">
                <Check size={13} />
                {result.correct
                  ? "Matches reference decision"
                  : "Reference mismatch"}
              </div>
              <button
                className="decision-policy"
                onClick={() => onPolicy?.(result.kb_article)}
                aria-label={`Read supporting policy ${result.kb_article}`}
              >
                <BookOpen size={17} />
                <span>
                  Supporting policy<strong>{result.kb_article}</strong>
                </span>
              </button>
              <dl>
                <div>
                  <dt>Input tokens</dt>
                  <dd>{num(result.input_tokens)}</dd>
                </div>
                <div>
                  <dt>Output tokens</dt>
                  <dd>{num(result.output_tokens)}</dd>
                </div>
                <div>
                  <dt>Model calls</dt>
                  <dd>{result.model_calls}</dd>
                </div>
                <div>
                  <dt>Execution</dt>
                  <dd>{num(result.duration_ms)} ms</dd>
                </div>
                <div className="total">
                  <dt>Billing points</dt>
                  <dd>{num(result.points)}</dd>
                </div>
              </dl>
              <span className="model-disclosure">
                <span className="live-dot" />
                Local simulator
                <code>{result.configured_model} · configured label</code>
              </span>
            </>
          ) : (
            <div className="decision-empty">
              <ShieldCheck size={28} />
              <p>
                Decision, evidence,
                <br />
                and exact cost.
                <br />
                <span>Visible after execution.</span>
              </p>
            </div>
          )}
        </aside>
      </div>
      {result?.stages.length ? (
        <div className="playground-stage-summary">
          <span className="editorial-label">EXECUTED PIPELINE</span>
          {result.stages.map((s) => (
            <div key={s.name}>
              <span>{human(s.name)}</span>
              <small>
                {s.kind === "llm" ? "1 model call" : "Python · 0 calls"}
              </small>
              <strong>{num(s.points)} pts</strong>
            </div>
          ))}
          <a href="/workspace?view=Pipeline">
            Open pipeline explorer <ArrowRight size={14} />
          </a>
        </div>
      ) : null}
    </>
  );
}
