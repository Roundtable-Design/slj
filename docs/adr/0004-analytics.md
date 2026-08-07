# ADR 0004 — Analytics (V1 minimal)

## Context
Need simple success metrics without heavy plumbing.

## Decision
No custom event pipeline in V1. Infer engagement from progress where needed.
**Exception (Aug 2026):** privacy-friendly **Vercel Web Analytics** pageviews + external uptime (Better Stack API) and **Sentry** errors — see [`Monitoring.md`](../Monitoring.md). No GA4 / cookie banner for this baseline.

## Consequences
Less granularity than a full product analytics stack; durable and agent-configurable.
