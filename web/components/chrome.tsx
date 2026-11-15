"use client";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme";
export function Wordmark() {
  return (
    <a className="wordmark" href="/">
      <span className="logo-glyph">
        <span />
        <span />
        <span />
      </span>
      shopassist<span className="wordmark-ai">ai</span>
    </a>
  );
}
export function Navigation({ active = "" }: { active?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Wordmark />
        <button
          className="mobile-menu"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav
          className={`site-links ${open ? "is-open" : ""}`}
          aria-label="Product navigation"
        >
          <a href="/" aria-current={active === "home" ? "page" : undefined}>
            Overview
          </a>
          <a href="/workspace">Workspace</a>
          <a
            href="/compare"
            aria-current={active === "compare" ? "page" : undefined}
          >
            Inside the optimization
          </a>
          <a href="/lab" aria-current={active === "lab" ? "page" : undefined}>
            The lab <span className="tiny-orange">↗</span>
          </a>
        </nav>
        <ThemeToggle />
        <a className="black-button nav-cta" href="/workspace">
          Explore live demo <ArrowUpRight size={14} />
        </a>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Wordmark />
        <p>
          Thoughtful engineering.
          <br />
          Every token accounted for.
        </p>
      </div>
      <div className="footer-links">
        <a href="/compare">
          Inside the optimization <ArrowUpRight size={13} />
        </a>
        <a href="/lab">
          Optimization lab <ArrowUpRight size={13} />
        </a>
        <a href="/api/docs" target="_blank" rel="noreferrer">
          API documentation <ArrowUpRight size={13} />
        </a>
        <a
          href="https://github.com/neha1422/llm-cost-optimization-agent"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub <ArrowUpRight size={13} />
        </a>
      </div>
      <span className="footer-disclosure">
        An independent engineering case study.
        <br />
        Powered by the assignment’s local simulator.
      </span>
    </footer>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="editorial-label">
      <span />
      {children}
    </span>
  );
}
export function Loading({
  text = "Reading measured results",
}: {
  text?: string;
}) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-orbit" />
      <span>
        {text}
        <span className="loading-dots">…</span>
      </span>
    </div>
  );
}
export function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-notice" role="alert">
      <span>{message}</span>
      {retry ? (
        <button onClick={retry}>
          Try again <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
  );
}
export function UnderHood({ calls }: { calls?: number }) {
  return (
    <section className="under-hood">
      <div>
        <Eyebrow>Under the hood</Eyebrow>
        <h2>
          A model label.
          <br />A transparent engine.
        </h2>
        <p>
          The configured model is <code>gpt-4.1-mini</code>. Actual execution
          uses the supplied local Python simulator. No hosted GPT API is called.
        </p>
      </div>
      <dl>
        <div>
          <dt>Execution provider</dt>
          <dd>
            Local Python simulator <span className="live-dot" />
          </dd>
        </div>
        <div>
          <dt>Model calls</dt>
          <dd>
            {calls === undefined
              ? "Q1: 1 · Q2: 1 optimized"
              : `${calls} in this execution`}
          </dd>
        </div>
        <div>
          <dt>Retrieval</dt>
          <dd>Fact-aware lexical policy selection</dd>
        </div>
        <div>
          <dt>Validation</dt>
          <dd>Schema, citation + policy compatibility</dd>
        </div>
        <div>
          <dt>Caching</dt>
          <dd>0 discounted tokens claimed</dd>
        </div>
        <div>
          <dt>Billing methodology</dt>
          <dd className="mono">Input × 3 + cached × 0.3 + output × 15</dd>
        </div>
      </dl>
    </section>
  );
}

/** Presentation-only tween whose target always comes from a measured value. */
export function NumberCount({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / 650, 1);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <>
      {new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(shown)}
    </>
  );
}
