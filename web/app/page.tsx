"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileText,
  Play,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import {
  ErrorNotice,
  Eyebrow,
  Footer,
  Loading,
  Navigation,
  NumberCount,
  UnderHood,
} from "../components/chrome";
import {
  API,
  Execution,
  human,
  num,
  Report,
  request,
  Ticket,
} from "../lib/api";
const stages = [
  [
    "01",
    "Understand",
    "A customer. A real issue.",
    "Read the customer thread alongside the relevant order facts. The context starts with evidence, not assumptions.",
  ],
  [
    "02",
    "Retrieve",
    "The policy that matters.",
    "Fact-aware lexical retrieval selects relevant source articles, keeping exceptions and the general returns fallback.",
  ],
  [
    "03",
    "Decide",
    "One focused model call.",
    "A concise prompt produces the action, policy citation, and customer reply. Python validates the structured result.",
  ],
  [
    "04",
    "Analyze",
    "Make every saving visible.",
    "Compare decisions, tokens, calls, and billing points against the original implementation. No estimated savings.",
  ],
];
export default function Home() {
  const [report, setReport] = useState<Report | null>(null),
    [ticket, setTicket] = useState<Ticket | null>(null),
    [result, setResult] = useState<Execution | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [stage, setStage] = useState(0);
  const storyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([
      request<Report>("/benchmarks/results"),
      request<Ticket>("/tickets/T-1004"),
    ])
      .then(([r, t]) => {
        if (alive) {
          setReport(r);
          setTicket(t);
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
    const nodes = storyRef.current?.querySelectorAll("[data-story]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setStage(Number((entry.target as HTMLElement).dataset.story));
        }),
      { rootMargin: "-25% 0px -40% 0px", threshold: 0.1 },
    );
    nodes?.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  const row = report?.rows.find(
    (r) => r.mode === "q2" && r.ticket_id === "T-1004",
  );
  const retrievedPolicies =
    (row?.optimized.stages?.find((s) => s.name === "retrieve")?.result
      .articles as string[] | undefined) || [];
  const q2 = report?.rows.filter((r) => r.mode === "q2") || [];
  const base = q2.reduce((s, r) => s + r.baseline.points, 0),
    opt = q2.reduce((s, r) => s + r.optimized.points, 0);
  const inputSaved = row
    ? row.baseline.calls.reduce(
        (s, c) => s + c.input_tokens + c.output_tokens,
        0,
      ) -
      row.optimized.calls.reduce(
        (s, c) => s + c.input_tokens + c.output_tokens,
        0,
      )
    : 0;
  async function run() {
    setBusy(true);
    setError("");
    try {
      const r = await request<{ executions: Execution[] }>(
        "/explain/experiments",
        { ticket_id: "T-1004", configurations: ["q2"] },
      );
      setResult(r.executions[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not run sample");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="product-site">
      <Navigation active="home" />
      <main className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <Eyebrow>AI-powered customer support / cost optimization</Eyebrow>
            <h1>
              Same intelligence.
              <br />
              <span>
                A fraction
                <br className="desktop-break" /> of the cost.
              </span>
            </h1>
            <p>
              An explainable AI customer-support system engineered to preserve
              decision accuracy while dramatically reducing LLM inference costs.
            </p>
            <div className="hero-actions">
              <a className="black-button" href="/workspace">
                Explore live demo <ArrowUpRight size={17} />
              </a>
              <a className="quiet-link" href="/compare">
                See the optimization <ArrowRight size={17} />
              </a>
            </div>
            <div className="hero-proof">
              <span className="live-dot" /> Real executions. Measured savings.
              Fully inspectable.
            </div>
          </div>
          <div className="hero-product">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="product-window">
              <div className="window-bar">
                <span className="mini-mark">s</span>
                <strong>ShopAssist</strong>
                <span className="window-subtitle">Support intelligence</span>
                <span className="live-dot" />
              </div>
              <div className="conversation-top">
                <span className="mono">T-1004 / FULFILLMENT</span>
                <span className="subtle-tag">Local simulator</span>
              </div>
              <div className="hero-customer">
                <span className="person-circle">J</span>
                <div>
                  <small>Customer</small>
                  <p>
                    {ticket?.ticket.messages[0].text ||
                      "Loading the sample customer ticket…"}
                  </p>
                </div>
              </div>
              <div className="hero-agent">
                <span className="orange-spark">
                  <Sparkles size={18} />
                </span>
                <div>
                  <small>ShopAssist AI</small>
                  {result ? (
                    <>
                      <p>{result.customer_reply}</p>
                      <div className="decision-stamp">
                        <Check size={12} />
                        {human(result.action)}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="awaiting">
                        The order facts are ready.
                        <br />
                        Run the agent to see its decision.
                      </p>
                      <button
                        className="inline-run"
                        disabled={busy || !ticket}
                        onClick={run}
                      >
                        {busy ? "Running Python…" : "Run this sample"}
                        <Play size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="window-bottom">
                <span className="mono">
                  {result
                    ? "1 MODEL CALL · VALIDATED JSON"
                    : "Q2 PIPELINE · READY TO EXECUTE"}
                </span>
                <ShieldCheck size={15} />
              </div>
            </div>
            <div className="floating-policy">
              <FileText size={18} />
              <div>
                <small>{result ? "CITED POLICY" : "SAMPLE POLICY"}</small>
                <strong>Damage replacement · 7 days</strong>
                <span>
                  {result
                    ? result.kb_article
                    : "Source: repository help center"}
                </span>
              </div>
              <Check size={15} />
            </div>
            <div className="floating-cost">
              <div className="cost-card-top">
                <span>Recorded benchmark · T-1004</span>
                <span className="tiny-orange">↘</span>
              </div>
              {row ? (
                <>
                  <div className="cost-pair">
                    <div>
                      <small>Original Q2</small>
                      <strong>
                        <NumberCount value={row.baseline.points} />
                        <em>pts</em>
                      </strong>
                    </div>
                    <ArrowRight size={18} />
                    <div>
                      <small>Optimized Q2</small>
                      <strong>
                        <NumberCount value={row.optimized.points} />
                        <em>pts</em>
                      </strong>
                    </div>
                  </div>
                  <div className="cost-bottom">
                    <span>{num(inputSaved)} total tokens saved</span>
                    <span>
                      <Check size={11} />
                      Same action + policy
                    </span>
                  </div>
                </>
              ) : (
                <Loading />
              )}
            </div>
          </div>
        </section>
        {error ? <ErrorNotice message={error} retry={run} /> : null}
        <div className="landing-disclosure">
          <span className="mono">
            ENGINEERING CASE STUDY / INDUS EURO LABS ASSIGNMENT
          </span>
          <p>
            Provided local simulator · configured model label{" "}
            <code>gpt-4.1-mini</code> · no hosted API calls
          </p>
        </div>
        <section className="manifesto">
          <Eyebrow>Efficiency, without the guesswork</Eyebrow>
          <h2>
            Better support doesn’t need
            <br />
            more tokens.
            <br />
            <span>It needs better engineering.</span>
          </h2>
          <div className="editorial-metrics">
            <div>
              <strong>
                {base ? (
                  <>
                    <NumberCount value={(1 - opt / base) * 100} decimals={1} />%
                  </>
                ) : (
                  "—"
                )}
              </strong>
              <span>Lower Q2 billing cost</span>
              <small>Across five measured sample tickets</small>
            </div>
            <div>
              <strong>
                {q2.length
                  ? `${q2.filter((r) => r.optimized.correct).length}/${q2.length}`
                  : "—"}
              </strong>
              <span>Decisions preserved</span>
              <small>Action and policy reference match</small>
            </div>
            <div>
              <strong>4 → 1</strong>
              <span>Q2 model calls</span>
              <small>Four logical stages, one billed call</small>
            </div>
          </div>
        </section>
        <section className="story-section" id="how-it-works">
          <div className="section-intro">
            <Eyebrow>Understand → retrieve → decide → analyze</Eyebrow>
            <h2>
              Follow the thinking.
              <br />
              <span>Then inspect the evidence.</span>
            </h2>
          </div>
          <div className="story-layout" ref={storyRef}>
            <div className="story-sticky">
              <div className="story-mockup" key={stage}>
                <div className="mockup-top">
                  <span className="mini-mark">s</span>
                  <span>Execution inspector</span>
                  <span className="mono">0{stage + 1} / 04</span>
                </div>
                {stage === 0 ? (
                  <>
                    <div className="mockup-label">ORDER SNAPSHOT</div>
                    <div className="receipt-icon">
                      <Workflow size={34} />
                    </div>
                    <h3>{String(ticket?.order.title || "Sample order")}</h3>
                    <dl className="mockup-facts">
                      {[
                        "product_type",
                        "delivered_days_ago",
                        "damage_reported",
                        "customized",
                      ].map((k) => (
                        <div key={k}>
                          <dt>{human(k)}</dt>
                          <dd>{String(ticket?.order[k] ?? "…")}</dd>
                        </div>
                      ))}
                    </dl>
                    <span className="mockup-foot">
                      Read from the actual T-1004 order
                    </span>
                  </>
                ) : stage === 1 ? (
                  <>
                    <div className="mockup-label">POLICY RETRIEVAL</div>
                    <div className="policy-stack actual-policy-stack">
                      {retrievedPolicies.map((id) => (
                        <div key={id}>
                          <FileText size={16} />
                          <span>{id}</span>
                          <Check size={12} />
                        </div>
                      ))}
                    </div>
                    <div className="context-stripe">
                      <span>
                        Original model input ·{" "}
                        {row
                          ? num(
                              row.baseline.calls.reduce(
                                (s, c) => s + c.input_tokens,
                                0,
                              ),
                            )
                          : "…"}{" "}
                        tokens
                      </span>
                      <i />
                    </div>
                    <div className="context-stripe selected">
                      <span>
                        Optimized model input ·{" "}
                        {row
                          ? num(
                              row.optimized.calls.reduce(
                                (s, c) => s + c.input_tokens,
                                0,
                              ),
                            )
                          : "…"}{" "}
                        tokens
                      </span>
                      <i
                        style={{
                          width: row
                            ? `${(row.optimized.calls.reduce((s, c) => s + c.input_tokens, 0) / row.baseline.calls.reduce((s, c) => s + c.input_tokens, 0)) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="mockup-foot">
                      Actual T-1004 candidate policies and input measurements
                      from the recorded benchmark. Selected evidence can include
                      multiple policy exceptions.
                    </span>
                  </>
                ) : stage === 2 ? (
                  <>
                    <div className="mockup-label">STRUCTURED RESOLUTION</div>
                    <div className="json-display">
                      <span>{"{"}</span>
                      <br />
                      <span>&nbsp; &quot;action&quot;: </span>
                      <b>
                        {result
                          ? `"${result.action}"`
                          : '"Run sample to inspect"'}
                      </b>
                      ,<br />
                      <span>&nbsp; &quot;kb_article&quot;:</span>
                      <br />
                      <b>
                        &nbsp;{" "}
                        {result
                          ? `"${result.kb_article}"`
                          : '"Awaiting execution"'}
                      </b>
                      <br />
                      <span>{"}"}</span>
                    </div>
                    <div className="validation-line">
                      <ShieldCheck size={16} />
                      Schema · action · citation · policy compatibility
                    </div>
                    <a className="quiet-link" href="/workspace">
                      Inspect a real execution <ArrowUpRight size={14} />
                    </a>
                  </>
                ) : (
                  <>
                    <div className="mockup-label">
                      MEASUREMENT, NOT ESTIMATION
                    </div>
                    <div className="analysis-big">
                      {row ? row.savings_percent : "—"}
                      <span>%</span>
                    </div>
                    <p>Q2 cost reduction · T-1004</p>
                    <div className="mini-comparison">
                      <span>Original</span>
                      <i style={{ width: "100%" }} />
                      <span>Optimized</span>
                      <i
                        className="orange-bar"
                        style={{
                          width: row
                            ? `${(row.optimized.points / row.baseline.points) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <a className="quiet-link" href="/compare">
                      Inspect the difference <ArrowUpRight size={14} />
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="story-steps">
              {stages.map(([index, title, heading, body], i) => (
                <div
                  className={`story-step ${stage === i ? "is-active" : ""}`}
                  data-story={i}
                  key={title}
                >
                  <button
                    onClick={() => {
                      setStage(i);
                      storyRef.current
                        ?.querySelector(`[data-story="${i}"]`)
                        ?.scrollIntoView({
                          behavior: matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                          block: "center",
                        });
                    }}
                    aria-pressed={stage === i}
                  >
                    <span className="step-index">{index}</span>
                    <span>{title}</span>
                    <ArrowUpRight size={18} />
                  </button>
                  <h3>{heading}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="signature-section">
          <Eyebrow>Open the black box</Eyebrow>
          <div className="signature-heading">
            <h2>
              Don’t take our word for it.
              <br />
              <span>Run the comparison.</span>
            </h2>
            <a className="black-button" href="/compare">
              Inside the optimization <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="signature-grid">
            <a href="/compare" className="feature-tile">
              <div className="tile-visual bars-visual">
                <i />
                <i />
                <span className="mono">ORIGINAL → OPTIMIZED</span>
              </div>
              <span className="tile-index">01 / LIVE COMPARISON</span>
              <h3>Same ticket. Two strategies.</h3>
              <p>
                Execute the original and optimized code. Compare decisions,
                calls, tokens, and measured billing.
              </p>
              <span className="quiet-link">
                See the difference <ArrowUpRight size={16} />
              </span>
            </a>
            <a href="/compare#prompt-xray" className="feature-tile">
              <div className="tile-visual xray-visual">
                <span>− Repeated context</span>
                <span>− Verbose reasoning</span>
                <span>+ Focused instructions</span>
              </div>
              <span className="tile-index">02 / PROMPT X-RAY</span>
              <h3>See what stopped sending.</h3>
              <p>
                Inspect actual model prompts, context, and completions captured
                by read-only instrumentation.
              </p>
              <span className="quiet-link">
                Inspect the prompts <ArrowUpRight size={16} />
              </span>
            </a>
            <a href="/lab" className="feature-tile">
              <div className="tile-visual lab-visual">
                <span>Original</span>
                <span>Optimized Q1</span>
                <span>Optimized Q2</span>
              </div>
              <span className="tile-index">03 / OPTIMIZATION LAB</span>
              <h3>Experiment with evidence.</h3>
              <p>
                Compare genuine executable configurations. Every displayed
                result comes from the Python engine.
              </p>
              <span className="quiet-link">
                Enter the lab <ArrowUpRight size={16} />
              </span>
            </a>
          </div>
        </section>
        <UnderHood />
        <section className="faq-section">
          <div>
            <Eyebrow>A few useful answers</Eyebrow>
            <h2>
              Clarity comes
              <br />
              with the product.
            </h2>
          </div>
          <div>
            {[
              [
                "Is this using a hosted AI model?",
                "No. This project uses the assignment’s local Python LLM simulator. gpt-4.1-mini is its configured model label, not a live hosted API.",
              ],
              [
                "Are the savings real?",
                "Yes, in assignment billing points. The original and optimized implementations execute with the unchanged tokenizer and billing formula. Results are simulator measurements, not currency.",
              ],
              [
                "Does a correct demo mean perfect real-world accuracy?",
                "No. Correctness is measured against the five supplied evaluation tickets and additional automated edge-case tests. A hosted model requires its own evaluation.",
              ],
              [
                "What changed in this redesign?",
                "The presentation and read-only execution visibility. Q1, Q2, their policies, retrieval, prompts, token counting and billing remain unchanged.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown size={16} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing-cta">
          <div className="cta-kicker">BUILT TO BE INSPECTED</div>
          <h2>
            Less inference.
            <br />
            <span>More confidence.</span>
          </h2>
          <a className="black-button" href="/workspace">
            Put the agents to work <ArrowUpRight size={18} />
          </a>
          <p>Real tickets. Real Python. Every token visible.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
