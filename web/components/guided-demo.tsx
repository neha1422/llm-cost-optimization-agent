"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Wordmark } from "./chrome";
import { ThemeToggle } from "./theme";
import { EngineeringMenu } from "./tools-menu";
import { Execution, Experiment, human, num, request, Ticket } from "../lib/api";

type Tab = "try" | "compare" | "learn";
type Article = { id: string; content: string };
const samples = [
  { id: "T-1004", name: "A mug arrived broken", hint: "Replacement request" },
  { id: "T-1001", name: "Return unopened headphones", hint: "Refund request" },
  { id: "T-1002", name: "Refund an ebook purchase", hint: "Digital purchase" },
  {
    id: "T-1003",
    name: "A personalized mug arrived broken",
    hint: "Custom item",
  },
  {
    id: "T-1091",
    name: "Cancel an annual subscription",
    hint: "Subscription refund",
  },
];
const actionCopy: Record<string, { title: string; description: string }> = {
  REPLACE: {
    title: "Offer a replacement",
    description: "The assistant recommends replacing the item.",
  },
  REFUND: {
    title: "Approve the refund",
    description: "The assistant recommends approving this refund request.",
  },
  SEND_ARTICLE: {
    title: "Explain the refund policy",
    description:
      "The assistant recommends sharing the policy instead of automatically issuing a refund.",
  },
  ESCALATE_TIER2: {
    title: "Ask a support specialist",
    description:
      "The assistant recommends a manual review by the support team.",
  },
};
const tabNames: { id: Tab; label: string }[] = [
  { id: "try", label: "1. Try the assistant" },
  { id: "compare", label: "2. Compare the cost" },
  { id: "learn", label: "How it works" },
];
function facts(order: Record<string, unknown>) {
  const result: string[] = [];
  if (order.product_type === "subscription")
    result.push(
      `Subscription age: ${order.subscription_age_days ?? "unknown"} days`,
    );
  else if (typeof order.delivered_days_ago === "number")
    result.push(`Delivered ${order.delivered_days_ago} days ago`);
  if (order.customized === true) result.push("Personalized item");
  if (order.product_type === "physical" && order.customized !== true)
    result.push("Standard physical item");
  if (order.damage_reported === true) result.push("Damage reported");
  if (order.opened === false && order.product_type === "physical")
    result.push("Unopened packaging");
  if (order.product_type === "digital")
    result.push(
      order.license_revealed
        ? "License already shown to the customer"
        : "Digital purchase",
    );
  return result;
}
function cleanPolicy(article?: Article) {
  return (
    article?.content
      .replace(/^# .*\n/, "")
      .replaceAll("**", "")
      .trim() || ""
  );
}
function Decision({ execution }: { execution: Execution }) {
  const copy = actionCopy[execution.action];
  return (
    <>
      <span className="guide-result-label">
        <CheckCircle2 size={17} />
        Assistant finished
      </span>
      <h2>{copy?.title || human(execution.action)}</h2>
      <p>{copy?.description}</p>
      <div className="guide-reply">
        <span>
          <MessageCircle size={15} />
          Reply it would send
        </span>
        <blockquote>{execution.customer_reply}</blockquote>
      </div>
      <p className="guide-recommendation">
        This is a recommendation in a demo. No refund or shipment is created.
      </p>
    </>
  );
}
function RunButton({
  busy,
  disabled,
  onClick,
  comparison = false,
}: {
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  comparison?: boolean;
}) {
  return (
    <button className="guide-primary" onClick={onClick} disabled={disabled}>
      {busy ? (
        <LoaderCircle size={18} className="spin" />
      ) : (
        <Sparkles size={18} />
      )}
      <span>
        {busy
          ? "Running the assistant…"
          : comparison
            ? "Compare both versions"
            : "Help this customer"}
      </span>
      {!busy ? <ArrowRight size={17} /> : null}
    </button>
  );
}
export default function GuidedDemo({
  initialTab = "try",
}: {
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab),
    [selected, setSelected] = useState("T-1004"),
    [mode, setMode] = useState("q2");
  const [ticket, setTicket] = useState<Ticket | null>(null),
    [articles, setArticles] = useState<Article[]>([]),
    [result, setResult] = useState<Execution | null>(null),
    [comparison, setComparison] = useState<Experiment | null>(null);
  const [busy, setBusy] = useState(false),
    [comparing, setComparing] = useState(false),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  const outcome = useRef<HTMLElement>(null),
    tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const requested = new URLSearchParams(location.search).get("tab");
    if (requested === "learn" || requested === "compare" || requested === "try")
      setTab(requested);
    let alive = true;
    request<Article[]>("/kb/articles")
      .then((a) => {
        if (alive) setArticles(a);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    setTicket(null);
    setResult(null);
    setComparison(null);
    setError("");
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
  }, [selected, reload]);
  const original = comparison?.executions.find((e) =>
    e.configuration.startsWith("baseline_"),
  );
  const improved = comparison?.executions.find(
    (e) => !e.configuration.startsWith("baseline_"),
  );
  const policy = articles.find((a) => a.id === result?.kb_article);
  const active = busy || comparing;
  const hasOutcome = tab === "try" ? Boolean(result) : Boolean(comparison);
  useEffect(() => {
    if ((tab === "try" && result) || (tab === "compare" && comparison))
      outcome.current?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
  }, [result, comparison]);
  async function run(compare = false) {
    setError("");
    if (compare) {
      setComparing(true);
      setComparison(null);
    } else {
      setBusy(true);
      setResult(null);
    }
    try {
      const response = await request<Experiment>("/explain/experiments", {
        ticket_id: selected,
        configurations: compare ? [`baseline_${mode}`, mode] : [mode],
      });
      if (compare) setComparison(response);
      else setResult(response.executions[0]);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.name === "TimeoutError" || e.name === "AbortError"
            ? "This run took longer than expected. Please try again."
            : e.message
          : "The assistant could not finish. Please try again.",
      );
    } finally {
      setBusy(false);
      setComparing(false);
    }
  }
  function changeTab(next: Tab) {
    setTab(next);
    setError("");
    document.querySelector(".guide-tabs")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }
  function tabKeys(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % 3;
    else if (event.key === "ArrowLeft") next = (index + 2) % 3;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 2;
    else return;
    event.preventDefault();
    changeTab(tabNames[next].id);
    tabRefs.current[next]?.focus();
  }
  return (
    <div className="guided-demo">
      <header className="guide-header">
        <div>
          <Wordmark />
          <span className="guide-header-note">Customer support, explained</span>
          <div className="guide-header-actions">
            <EngineeringMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="guide-main">
        <div className="guide-intro">
          <span className="guide-kicker">START HERE</span>
          <h1>Help a customer, step by step.</h1>
          <p>
            Choose a sample request. Run the assistant. See its recommendation
            and the support policy behind it.
          </p>
        </div>
        <div className="guide-tabs" role="tablist" aria-label="Demo sections">
          {tabNames.map((t, i) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              onClick={() => changeTab(t.id)}
              onKeyDown={(e) => tabKeys(e, i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <section
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          className="guide-tab-panel"
        >
          {tab !== "learn" ? (
            <>
              <div className="guide-stepper" aria-label="Your progress">
                <div className={active || hasOutcome ? "complete" : "current"}>
                  <span>{active || hasOutcome ? <Check size={12} /> : 1}</span>
                  Choose a problem
                </div>
                <ArrowRight size={15} />
                <div
                  className={hasOutcome ? "complete" : active ? "current" : ""}
                >
                  <span>{hasOutcome ? <Check size={12} /> : 2}</span>
                  {tab === "compare"
                    ? "Run both versions"
                    : "Run the assistant"}
                </div>
                <ArrowRight size={15} />
                <div
                  className={
                    (tab === "try" ? result : comparison) ? "current" : ""
                  }
                >
                  <span>3</span>Read the result
                </div>
              </div>
              <section className="guide-case">
                <div className="guide-section-heading">
                  <span className="guide-number">1</span>
                  <div>
                    <h2>Choose a customer problem</h2>
                    <p>Pick one of the sample requests below.</p>
                  </div>
                </div>
                <label
                  className="guide-select-label"
                  htmlFor="customer-problem"
                >
                  Sample customer request
                </label>
                <select
                  id="customer-problem"
                  value={selected}
                  disabled={active}
                  onChange={(e) => {
                    if (e.target.value === selected) return;
                    setSelected(e.target.value);
                    setTicket(null);
                    setResult(null);
                    setComparison(null);
                  }}
                >
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.hint}
                    </option>
                  ))}
                </select>
                {ticket ? (
                  <div className="guide-case-body">
                    <div className="guide-customer-message">
                      <span>THE CUSTOMER SAYS</span>
                      {ticket.ticket.messages
                        .filter((m) => m.from === "customer")
                        .map((m, i) => (
                          <blockquote key={i}>{m.text}</blockquote>
                        ))}
                    </div>
                    <div className="guide-order-facts">
                      <span>WHAT THE ORDER TELLS US</span>
                      <strong>{String(ticket.order.title)}</strong>
                      <ul>
                        {facts(ticket.order).map((f) => (
                          <li key={f}>
                            <Check size={13} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <details>
                        <summary>
                          View all order details
                          <ChevronDown size={13} />
                        </summary>
                        <dl>
                          {Object.entries(ticket.order).map(([k, v]) => (
                            <div key={k}>
                              <dt>{human(k)}</dt>
                              <dd>
                                {typeof v === "boolean"
                                  ? v
                                    ? "Yes"
                                    : "No"
                                  : String(v)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    </div>
                  </div>
                ) : (
                  <div className="guide-loading" role="status">
                    <LoaderCircle className="spin" size={17} />
                    {error
                      ? "This request could not be loaded. Use Try again below."
                      : "Loading this customer request…"}
                  </div>
                )}
                <div className="guide-run-row">
                  <div>
                    <h3>
                      {tab === "compare"
                        ? "Compare two ways of solving the same request"
                        : "Ready to help this customer?"}
                    </h3>
                    <p>
                      {tab === "compare"
                        ? "The original version uses extra AI calls and longer prompts. The improved version removes that waste."
                        : "The assistant will check the order, consult the support policies, and suggest a reply."}
                    </p>
                  </div>
                  <RunButton
                    busy={active}
                    disabled={active || !ticket}
                    onClick={() => run(tab === "compare")}
                    comparison={tab === "compare"}
                  />
                </div>
                <details className="guide-version">
                  <summary>
                    Optional: choose the assignment version{" "}
                    <ChevronDown size={13} />
                  </summary>
                  <p>
                    The improved workflow is selected for you. Both versions use
                    the same sample data.
                  </p>
                  <label htmlFor="assignment-version">Version</label>
                  <select
                    id="assignment-version"
                    value={mode}
                    disabled={active}
                    onChange={(e) => {
                      setMode(e.target.value);
                      setResult(null);
                      setComparison(null);
                    }}
                  >
                    <option value="q2">
                      Q2 — improved multi-stage workflow (recommended)
                    </option>
                    <option value="q1">Q1 — concise single-call version</option>
                  </select>
                </details>
              </section>
              {error ? (
                <div className="guide-error" role="alert">
                  <p>{error}</p>
                  <button
                    onClick={() =>
                      ticket ? run(tab === "compare") : setReload((n) => n + 1)
                    }
                    disabled={active}
                  >
                    Try again <RotateCcw size={14} />
                  </button>
                </div>
              ) : null}
              <section
                ref={outcome}
                className="guide-outcome"
                aria-live="polite"
              >
                {active ? (
                  <div className="guide-running" role="status">
                    <LoaderCircle size={25} className="spin" />
                    <h2>
                      {comparing
                        ? "Comparing the original and improved versions…"
                        : "The assistant is working on this request…"}
                    </h2>
                    <p>
                      It is reading the order facts, checking the policies, and
                      preparing a response. The results will appear here when
                      the run finishes.
                    </p>
                  </div>
                ) : tab === "try" && result ? (
                  <>
                    <div className="guide-result-card">
                      <div className="guide-answer">
                        <Decision execution={result} />
                      </div>
                      <div className="guide-why">
                        <span>
                          <BookOpen size={17} />
                          Why this answer?
                        </span>
                        <h3>The policy used</h3>
                        <strong>{human(result.kb_article)}</strong>
                        <p>
                          {cleanPolicy(policy) ||
                            "Policy text is unavailable here. You can open the source policies below."}
                        </p>
                        <a href="/workspace?view=Knowledge%20base">
                          Read the source policies <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                    <div className="guide-explained">
                      <h2>What happened in this run</h2>
                      <ol>
                        <li>
                          <span>1</span>
                          <div>
                            <strong>
                              Read the customer’s request and order
                            </strong>
                            <p>
                              The assistant received the message above and the
                              order facts shown beside it.
                            </p>
                          </div>
                          <CheckCircle2 size={18} />
                        </li>
                        <li>
                          <span>2</span>
                          <div>
                            <strong>Checked the support rules</strong>
                            <p>
                              It cited the “{human(result.kb_article)}” policy
                              as support for its decision.
                            </p>
                          </div>
                          <CheckCircle2 size={18} />
                        </li>
                        <li>
                          <span>3</span>
                          <div>
                            <strong>
                              Suggested an action and drafted a reply
                            </strong>
                            <p>
                              {actionCopy[result.action]?.description} The reply
                              is shown above.
                            </p>
                          </div>
                          <CheckCircle2 size={18} />
                        </li>
                      </ol>
                    </div>
                    <div className="guide-cost-nudge">
                      <div>
                        <span>Processing used</span>
                        <strong>
                          {num(result.points)} billing points{" "}
                          <small>
                            · {result.model_calls} model call
                            {result.model_calls === 1 ? "" : "s"}
                          </small>
                        </strong>
                        <p>
                          Points are the assignment’s cost measure, not a dollar
                          charge.
                        </p>
                      </div>
                      <button onClick={() => changeTab("compare")}>
                        See how the cost was reduced <ArrowRight size={16} />
                      </button>
                    </div>
                    <details className="guide-technical">
                      <summary>
                        Technical details for reviewers{" "}
                        <ChevronDown size={15} />
                      </summary>
                      <dl>
                        <div>
                          <dt>Input tokens (text sent)</dt>
                          <dd>{num(result.input_tokens)}</dd>
                        </div>
                        <div>
                          <dt>Output tokens (text returned)</dt>
                          <dd>{num(result.output_tokens)}</dd>
                        </div>
                        <div>
                          <dt>Model calls</dt>
                          <dd>{result.model_calls}</dd>
                        </div>
                        <div>
                          <dt>Reference check</dt>
                          <dd>
                            {result.correct
                              ? "Action and policy match"
                              : "Reference mismatch"}
                          </dd>
                        </div>
                        <div>
                          <dt>Engine</dt>
                          <dd>Provided local simulator</dd>
                        </div>
                        <div>
                          <dt>Configured model label</dt>
                          <dd>{result.configured_model}</dd>
                        </div>
                        <div>
                          <dt>Sample ticket</dt>
                          <dd>{result.ticket_id}</dd>
                        </div>
                      </dl>
                      {result.stages.length ? (
                        <div className="guide-stage-details">
                          {result.stages.map((s) => (
                            <div key={s.name}>
                              <strong>{human(s.name)}</strong>
                              <span>
                                {s.kind === "llm"
                                  ? "Model call"
                                  : "Python, no model call"}{" "}
                                · {num(s.points)} points
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <a href="/workspace?view=Pipeline">
                        Open detailed execution data <ArrowRight size={14} />
                      </a>
                    </details>
                  </>
                ) : tab === "compare" && original && improved ? (
                  <>
                    <div className="guide-compare-result">
                      <span className="guide-result-label">
                        <CheckCircle2 size={17} />
                        Both versions finished
                      </span>
                      <h2>
                        {original.action === improved.action &&
                        original.kb_article === improved.kb_article
                          ? "Same answer. Less processing."
                          : "The two versions returned different results."}
                      </h2>
                      <p>
                        Both ran on the customer request above. These numbers
                        were measured in this comparison.
                      </p>
                      <div className="guide-compare-pair">
                        {[
                          {
                            run: original,
                            label: "Original workflow",
                            caption: "The starting version",
                          },
                          {
                            run: improved,
                            label: "Improved workflow",
                            caption: "The optimized version",
                          },
                        ].map(({ run, label, caption }) => (
                          <section key={label}>
                            <span>{caption}</span>
                            <h3>{label}</h3>
                            <strong>
                              {num(run.points)}
                              <small>billing points</small>
                            </strong>
                            <dl>
                              <div>
                                <dt>Model calls</dt>
                                <dd>{run.model_calls}</dd>
                              </div>
                              <div>
                                <dt>Recommendation</dt>
                                <dd>
                                  {actionCopy[run.action]?.title ||
                                    human(run.action)}
                                </dd>
                              </div>
                              <div>
                                <dt>Supporting policy</dt>
                                <dd>{human(run.kb_article)}</dd>
                              </div>
                            </dl>
                          </section>
                        ))}
                      </div>
                      <div className="guide-savings">
                        <strong>
                          {(
                            (1 - improved.points / original.points) *
                            100
                          ).toFixed(1)}
                          % less cost
                        </strong>
                        <p>
                          {original.model_calls > improved.model_calls
                            ? `${original.model_calls - improved.model_calls} fewer model calls, and shorter input and output.`
                            : "The same number of calls, with shorter input and output."}{" "}
                          Both decisions{" "}
                          {original.correct && improved.correct
                            ? "match"
                            : "were checked against"}{" "}
                          the supplied reference.
                        </p>
                      </div>
                      <p className="guide-points-note">
                        Billing points measure the amount of model processing in
                        this exercise. They are not dollars. Original trace IDs
                        can cause small variations between runs.
                      </p>
                    </div>
                    <details className="guide-technical">
                      <summary>
                        What exactly was reduced? <ChevronDown size={15} />
                      </summary>
                      <dl>
                        <div>
                          <dt>Input tokens saved</dt>
                          <dd>
                            {num(original.input_tokens - improved.input_tokens)}
                          </dd>
                        </div>
                        <div>
                          <dt>Output tokens saved</dt>
                          <dd>
                            {num(
                              original.output_tokens - improved.output_tokens,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>Model calls avoided</dt>
                          <dd>{original.model_calls - improved.model_calls}</dd>
                        </div>
                      </dl>
                      <p>
                        A token is a small chunk of text. Removing unnecessary
                        text and calls lowers the processing cost.
                      </p>
                      <a href="/compare?details=1">
                        Inspect the actual prompts and full traces{" "}
                        <ArrowRight size={14} />
                      </a>
                    </details>
                  </>
                ) : (
                  <div className="guide-empty-result">
                    <span className="guide-number">3</span>
                    <div>
                      <h2>
                        {tab === "try"
                          ? "The answer will appear here"
                          : "Your comparison will appear here"}
                      </h2>
                      <p>
                        {tab === "try"
                          ? "Choose a sample above and click “Help this customer”. You will see the recommendation, the reply, and the policy behind it."
                          : "Click “Compare both versions” above to see whether they reach the same answer and how their costs differ."}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="guide-learn">
              <h2>From a customer problem to a clear recommendation</h2>
              <p>
                You are seeing a support decision being made—not a real refund
                or shipment.
              </p>
              <div className="guide-learn-steps">
                {[
                  {
                    icon: MessageCircle,
                    title: "Read the request",
                    body: "A customer asks for help. ShopAssist reads their message and checks the order facts, such as delivery age and whether the product was personalized.",
                  },
                  {
                    icon: BookOpen,
                    title: "Check the policy",
                    body: "It looks at the company’s support rules. For example, the damaged-item policy covers standard items reported damaged within seven days.",
                  },
                  {
                    icon: Sparkles,
                    title: "Recommend a response",
                    body: "It recommends a refund, replacement, policy explanation, or human review, and drafts the reply it would send.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Measure the work",
                    body: "The demo counts the text processed and model calls made. The comparison shows how the improved version keeps the decision while reducing that processing.",
                  },
                ].map((s, i) => (
                  <div key={s.title}>
                    <span>{i + 1}</span>
                    <s.icon size={23} />
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                ))}
              </div>
              <div className="guide-learn-callout">
                <h3>What is real, and what is simulated?</h3>
                <p>
                  The tickets, policies, Python executions, and measured costs
                  are real assignment data and code. The model is the
                  assignment’s local simulator. It does not call a hosted GPT
                  service or connect to a real store.
                </p>
                <p>
                  The original workflow is deliberately wasteful. The improved
                  workflow removes unnecessary text and model calls. The
                  “Compare the cost” tab lets you see this on the same customer
                  problem.
                </p>
              </div>
              <button
                className="guide-primary"
                onClick={() => changeTab("try")}
              >
                Try a customer problem <ArrowRight size={17} />
              </button>
            </div>
          )}
        </section>
        <footer className="guide-footer">
          <p>
            <span className="live-dot" />
            Assignment demo · local simulator · no real refunds or shipments
          </p>
          <a
            href="https://github.com/neha1422/llm-cost-optimization-agent"
            target="_blank"
            rel="noreferrer"
          >
            View project source <ArrowRight size={13} />
          </a>
        </footer>
      </main>
    </div>
  );
}
