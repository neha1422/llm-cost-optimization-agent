export const API = process.env.NEXT_PUBLIC_API_URL || "/api";
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(API + path, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(
      `Execution could not complete (${response.status}). Please retry.`,
    );
  return response.json();
}
export const num = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
export const human = (value: string) =>
  value.replaceAll("_", " ").replaceAll("-", " ");
export type Call = {
  label: string;
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  points: number;
  prompt: string;
  completion: string;
  duration_ms: number;
};
export type Stage = {
  name: string;
  kind: string;
  result: Record<string, unknown>;
  input?: unknown;
  output?: unknown;
  model_calls?: number;
  input_tokens: number;
  output_tokens: number;
  points: number;
  duration_ms: number;
};
export type Execution = {
  configuration: string;
  ticket_id: string;
  action: string;
  kb_article: string;
  customer_reply: string;
  correct: boolean;
  points: number;
  calls: Call[];
  stages: Stage[];
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens: number;
  model_calls: number;
  duration_ms: number;
  setup_ms: number;
  setup_note: string;
  engine: string;
  configured_model: string;
  provider: string;
};
export type Experiment = {
  ticket_id: string;
  executions: Execution[];
  measurement: string;
};
export type Report = {
  generated_at: string;
  rows: {
    mode: string;
    ticket_id: string;
    target: number;
    target_met: boolean;
    savings_percent: number;
    baseline: {
      points: number;
      calls: Call[];
      action: string;
      kb_article: string;
      correct: boolean;
    };
    optimized: {
      stages?: Stage[];
      points: number;
      calls: Call[];
      action: string;
      kb_article: string;
      correct: boolean;
    };
  }[];
};
export type Ticket = {
  ticket: { ticket_id: string; messages: { from: string; text: string }[] };
  order: Record<string, unknown>;
};
export const sampleTickets = ["T-1001", "T-1002", "T-1003", "T-1004", "T-1091"];
export const configNames: Record<string, string> = {
  baseline_q1: "Original Q1",
  baseline_q2: "Original Q2",
  q1: "Optimized Q1",
  q2: "Optimized Q2",
};
