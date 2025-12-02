## gpt-oss-20b: Cross‑App Integration Brainstorm (RenoTimeline • CalcReno • RenoScout)

### Objective
- Use an on‑prem/open-weight agent (`gpt-oss-20b`) as a shared “Agent Gateway” across the ecosystem to reason over Supabase data, call tools (MCP, Edge Functions, action executors), and deliver safe, explainable automations with human-in-the-loop where needed.

### Platform Spine (shared across apps)
- Agent Gateway service (OpenAI-compatible) fronting `gpt-oss-20b` with tool/function calling.
- Event-driven: subscribe to Supabase Realtime (projects, tasks, workflows, notifications); route enriched events to the agent.
- Retrieval layer: pgvector indexes over `ai_docs/`, workflow templates, notification types, and per-project history. Agent cites sources and deep-links to UI.
- Human-in-the-loop: per-project “autopilot level,” approval rules by action type/priority.
- Observability/evals: log prompts, tool calls, decisions; offline eval sets from real events; regression before raising autonomy.

### RenoScout (discovery → analysis → outreach)
- Multi-agent listing pipeline: Normalize → Deduplicate → Summarize → Score. Fill missing fields, highlight risks (legal, capex, district trends).
- Deal Analyst: Compose CalcReno-ready scope-of-work hypotheses and request an estimate. Generate investor-grade one-pagers with uncertainty markers.
- Auto-Outreach: Draft seller emails, schedule viewings, propose negotiation talking points; track states as leads in Supabase.
- Contrarian radar: Detect price/m² outliers and time-sensitive flips in microdistricts; notify with rationale.

### CalcReno (estimation, procurement, change control)
- Scope-to-BOM composer: From notes/photos/listings, produce structured scope, trades, and line items; ask clarifying questions when confidence is low.
- Estimate explainer: “What drives cost?” narratives, volatility flags, and cheaper alternates with links.
- Change-order arbiter: On RenoTimeline delays/moves, compute deltas; draft client-ready change orders with acceptance criteria.
- Procurement co‑pilot: RFQs to vendors, quote comparison, “buy now” suggestions; track supplier interactions.

### RenoTimeline (AI PM, risk, reporting)
- Delay Mitigator: On `task_moved`/`timeline_delay`, simulate critical path impact, propose mitigations (split/parallelize/reassign), and—within policy—execute via action executors.
- Workflow-from-prompt: Convert NL prompts to structured triggers/conditions/actions; store into `workflow_definitions`.
- Daily standups and status briefs: Summarize progress, risks, dependencies; generate client/internal variants.
- Quality gates: Enforce definitions of done; request missing artifacts; auto-add review tasks.

### Cross‑App Portfolio Brain
- Next Best Action Engine: One prioritized, high-ROI action per user/day with expected impact and 1-click execution.
- Portfolio CFO: Weekly rollups (RenoScout → CalcReno → RenoTimeline). Cashflow timing, resource bottlenecks, and risk forecasts.
- Closed-loop learning: Post-renovation outcomes feed back into RenoScout scoring and CalcReno priors.

### Architecture & Ops
- Serving: vLLM/TGI for GPU serving; Ollama for local dev; llama.cpp/GGUF as CPU fallback for batch.
- Routing: Small router model for classification; escalate hard cases to 20B for reasoning/tool planning.
- Memory: Short-term conversation memory + long-term per-project memory in Supabase.
- Guardrails: JSON schema outputs, tool allowlists, approval thresholds, RLS boundaries.
- Latency/cost: Quantization, caching of tool results, async jobs for long tasks, streaming for UI.

### Monetization/GTM
- Pro tiers: “Private On‑Prem AI,” metered AI Actions, Portfolio CFO, Auto‑Outreach.
- Enterprise: Data residency, audit logs, model pinning, white‑label Agent Gateway.

### Risks & Mitigations
- Throughput/cost: Quantize + route + batch; async background execution.
- Quality drift: Evals, canaries, progressive autonomy.
- Data boundaries: Strict RLS + tool scoping by `project_id`/`user_id`.

### Fast Pilot (2–3 weeks)
- RenoTimeline: Delay Mitigator with approval gate; KPI: overdue tasks ↓ and accepted suggestions >30%.
- CalcReno: Estimate Explainer; KPI: support deflection and time‑to‑approval.
- RenoScout: Lead Triage Top‑10 daily with rationale; KPI: click‑through to CalcReno and project creation.


