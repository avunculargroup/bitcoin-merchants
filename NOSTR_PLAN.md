# Nostr Integration Build Plan

_Last updated: 2025-12-08. Keep this file in sync with `NOSTR_IMPLEMENTATION.md`._

## 0. TL;DR
- Build a backend-only Nostr publisher that turns approved submissions into signed events via NDK, with Redis-backed queue + retries, admin visibility, and strong logging/observability.
- Foundations first (env, deps, data model), then core publisher + queue, then UX/ops polish, then scale/hardening.
- Ship behind a feature flag, run shadow mode, then activate once metrics look good.

## 1. Objectives & Constraints
- Automatically publish approved submissions (and optionally auto-approved submissions) to Nostr from a single managed account.
- Keep keys, relay configuration, cache settings, and queue credentials server-side via env/secret manager; never expose them to the browser bundle.
- Ensure reliability (retry/queue, logging, monitoring) without impacting end-user UX, even when relays misbehave.
- Meet architectural decisions in `NOSTR_IMPLEMENTATION.md` and stay idiomatic to the existing Next.js + Prisma stack.
- **Non-goals:** user-specific signing, building a Nostr timeline UI, or consuming/reading Nostr data beyond verifying successful publishes.

## 2. Success Criteria
| Area | Target | Measurement |
| --- | --- | --- |
| Relay publish reliability | ≥99% of approved submissions successfully published to ≥2 relays within 5 min | Worker metrics + `AdminPublishLog` |
| Retry robustness | Automatic retries (5 attempts, exponential backoff) with manual alert on exhaustion | Queue metrics, DLQ alerts |
| Admin visibility | Admin portal shows status per submission (success/pending/failed) plus event IDs & relay list | UI screenshot + QA script |
| Security | Private key never logged, transmitted, or stored outside secure config | Security review checklist |
| Test coverage | Unit + integration + e2e written for happy/failure paths; CI green | Vitest/Jest + Playwright outputs |

## 3. Architecture Recap (Informed by Implementation Doc)
- **NDK client module (`lib/ndk.ts`)**: singleton init with cache adapter (Redis prod, SQLite dev) and signer from `.env`. Responsible for connection lifecycle and providing ready-to-use NDK instance to downstream services.
- **Event builder (`lib/nostr/event-builder.ts`)**: deterministic helper that maps a submission (and approval metadata) into an event payload, tags (`submissionId`, `city`, `geo`, `approvalActor`), and recommended kind (default 1). Sanitizes/escapes data before signing.
- **Publisher service (`services/nostrPublisher.ts`)**: fetches submission, builds event, handles signing/publishing, records statuses in `AdminPublishLog`, and emits structured logs.
- **Queue (`lib/queues/nostrQueue.ts`)**: BullMQ (Redis) queue + worker processing `nostr.publish` jobs with exponential backoff, concurrency limit, heartbeat, and DLQ.
- **API touchpoints**:
  - `app/api/submit/route.ts`: after persistence, enqueue `nostr.publish` job (`trigger=submission`).
  - `app/api/admin/submissions/[id]/approve/route.ts`: on approval, enqueue job if not already published (`trigger=approval`).
  - `app/api/admin/submissions/[id]/status/route.ts` (new): surfaces publish log/status to admin UI.
- **Observability**: structured logging, metrics (publish latency, relay success count), and Prisma table `AdminPublishLog` storing `submissionId`, `nostrEventId`, `relayStatuses`, `status`, `retryCount`, `lastError`.

## 4. Dependencies & Prerequisites
- **Packages**: `@nostr-dev-kit/ndk`, `@nostr-dev-kit/ndk-cache-redis`, `@nostr-dev-kit/cache-sqlite-wasm`, `bullmq`, `ioredis` (if not already installed).
- **Infrastructure**: Redis instance reachable from API/worker runtime, secret storage (Vercel env vars, Doppler, etc.), optional SQLite file for local dev cache.
- **Schema changes**: new Prisma models/tables (`AdminPublishLog`, optional `NostrDeadLetter`) plus migrations.
- **Feature flag**: `NOSTR_PUBLISH_ENABLED` (boolean) stored in env or remote config to gate worker execution.
- **Access**: create/manage Nostr account, obtain private key, confirm at least three relays accept posts from that key.

## 5. Work Breakdown Structure

### Phase 1 — Foundations (1 sprint)
1. **Config scaffolding**
   - Add `.env` entries: `NOSTR_RELAYS`, `NOSTR_PRIVATE_KEY`, `NOSTR_PUBLISH_ENABLED`, `REDIS_URL`, optional `SQLITE_DB_PATH`.
   - Update `env.example` + `lib/env.ts` with validation (zod) + strong typing; fail fast when missing.
   - Acceptance: `pnpm lint` & `pnpm test` pass; running app without variables throws descriptive error.

2. **Dependencies & typing**
   - Install packages listed above; ensure `tsconfig.json` resolves new paths; add type definitions if libs lack them.
   - Document install steps in `README.md` (Dev Setup → Nostr section).

3. **Data model + migrations**
   - Extend Prisma schema with `AdminPublishLog` and optional `NostrDeadLetter`.
   - Add migration, seed script (if needed), and repository helpers (`lib/db/publishLog.ts`).
   - Acceptance: `pnpm prisma migrate dev` succeeds; tables visible in local DB.

### Phase 2 — Core Services (1-1.5 sprints)
4. **NDK client factory**
   - Create `lib/ndk.ts` exporting singleton; handles relay parsing, cache selection, connect/disconnect per serverless runtime constraints.
   - Include health utility `assertNostrReady()` to be used by queue worker before consuming jobs.
   - Tests: ensure relays parsed, signer derived, connect invoked once.

5. **Event builder**
   - Implement deterministic builder with templates + sanitization (escape HTML, enforce char limit ~500).
   - Support dynamic tags: region, categories, `submissionId`, `approvedBy`.
   - Unit tests for formatting, escaping, deterministic outputs.

6. **Publisher service**
   - Function `publishSubmission(submissionId: string, trigger: 'submission' | 'approval')`.
   - Steps: fetch submission, skip if already `published` or log indicates success, build event, sign/publish, capture per-relay status, persist log, emit metrics.
   - Integration tests stubbing NDK publish, verifying DB writes + idempotency.

### Phase 3 — Queue & Retry (1 sprint)
7. **Queue wiring**
   - Configure BullMQ queue `nostr.publish` w/ concurrency=3 (tunable), attempts=5, exponential backoff (2^n * 30s), DLQ.
   - Worker lives in `app/workers/nostrPublisher.ts` (or `scripts/worker.ts` for deployment). Includes heartbeat key + liveness metric.
   - Tests confirm retry scheduling, DLQ insertion, idempotent handling when job replays.

8. **API integration**
   - Update submission + approval routes to enqueue job post-transaction.
   - Ensure race-safe: job enqueued only after DB commit; pass `submissionId`, `trigger`, `attempt`.
   - E2E/integration tests covering `submit -> queue -> worker -> log`.

### Phase 4 — Observability, UX & Docs (0.5 sprint)
9. **Admin visibility**
   - Extend admin UI table or detail view to display publish log summary + drill-down.
   - Add API route returning log entries and aggregated status.
   - UI tests (Playwright or React Testing Library) for status chips + empty states.

10. **Logging, metrics, alerts**
    - Use structured logger (pino/winston) to emit `nostr.publish` events with correlation IDs.
    - Emit metrics (Prometheus/OpenTelemetry) for latency, success rate, retries, queue depth.
    - Optional Slack/webhook integration when DLQ receives job.

11. **Developer documentation**
    - Update `README.md`, `IMPLEMENTATION_STATUS.md`, `NOSTR_IMPLEMENTATION.md` citations, `.env.example`, and runbooks describing: how to rotate keys, start worker locally, test plan.

### Phase 5 — Hardening & Launch (0.5-1 sprint)
12. **Security review**
    - Threat model secrets, review logging for sensitive data, ensure private key restricted to server runtime.
    - Document rotation + break-glass procedures.

13. **Load & chaos testing**
    - Use script to enqueue ~200 fake submissions, simulate relay outages by forcing NDK errors, validate retries and alerts.
    - Document results + fix issues.

14. **Launch readiness**
    - Feature-flag worker; run in shadow mode (log-only).
    - Run smoke tests with staging relays + confirm event visibility via Nostr client.

## 6. Acceptance Matrix
| Deliverable | Owner | Dependencies | Exit Criteria | Artifacts |
| --- | --- | --- | --- | --- |
| Env scaffolding | Backend | None | App fails fast w/out vars | `lib/env.ts`, `.env.example` |
| Prisma log tables | Backend | Env scaffolding | Migration applied | `prisma/schema.prisma`, migration SQL |
| NDK client | Backend | Deps installed | Unit tests pass | `lib/ndk.ts`, tests |
| Publisher service | Backend | NDK client, Prisma | Integration tests pass | `services/nostrPublisher.ts`, tests |
| Queue worker | Platform | Redis, publisher | Jobs retry, DLQ | `lib/queues/nostrQueue.ts`, worker script |
| Admin UI | Frontend | Publish log API | UI snapshot + QA | `app/admin/...` |
| Observability | Platform | Queue worker | Metrics visible, alerts verified | Runbook, dashboards |

## 7. Detailed Technical Notes
- **Event schema**: default to kind 1, tags include: `["t","business-onboarded"]`, `["submissionId", "<uuid>"]`, `["geo", "<lat>,<lng>"]`, optional categories (bitcoin, atm, merchant). Content template pulled from `app/content/NOSTR_TEMPLATE.md` (new file) to keep copy editable.
- **Idempotency**: `AdminPublishLog` stores `status`. `publishSubmission` first checks for `status === 'success'` before re-publishing; queue job uses `jobId = submissionId`.
- **Caching**: use Redis adapter in prod; fallback to SQLite for local dev. Implement best-effort health check `ndk.assertCacheReady()` logging warnings if cache unavailable but continue publishing.
- **Error taxonomy**: classify as `TRANSIENT` (network, relay), `PERMANENT` (validation, rejection). Queue retries only transient; permanent failures go straight to DLQ + admin notification.
- **Secrets**: prefer referencing private key via secret manager; allow `.env` only for local dev. Add check ensuring key uses `nsec` or hex and warn otherwise.
- **Serverless considerations**: worker should run in long-lived process (Edge/cron). Api routes remain serverless but delegate to queue to avoid blocking requests.

## 8. Testing Strategy
- **Unit tests**: env parsing, event builder (content + tags), retry util, relay parser.
- **Service/integration tests**: publisher service (NDK mocked), queue worker (BullMQ test mode), Prisma log writes.
- **E2E tests**: 
  - Submission happy path: create submission → job processed → log success.
  - Failure path: mock NDK failure 4x -> ensures retries + DLQ entry.
  - Admin UI view: ensures statuses reflected.
- **Manual smoke**: run staging worker, post sample submission, verify via external Nostr client (e.g., Iris, Coracle).
- **Chaos**: script toggles relay availability to ensure failover logs expected metrics.

Testing matrix:
| Scenario | Test Type | Coverage |
| --- | --- | --- |
| Relay success | Unit + integration + e2e | ensures event persists + logs |
| Relay partial failure | Integration + chaos | ensures per-relay status tracked |
| Duplicate submissions | Integration | ensures idempotent skip |
| Missing env | Unit | ensures startup crash with message |
| Queue DLQ | Integration + manual | ensures alert triggered |

## 9. Deployment & Rollout Plan
1. **Infra prep**: provision Redis, secrets, worker runtime; add monitoring dashboards.
2. **Deploy code** with feature flag off; run migrations.
3. **Shadow mode**: worker consumes queue but short-circuits before publish, logging what would have been sent; validate payloads.
4. **Pilot**: enable flag for internal test submissions only; confirm events visible on relays.
5. **Full rollout**: enable flag for all submissions; monitor metrics/logs for 48h.
6. **Rollback plan**: disable flag, pause queue, purge pending jobs, revert DB status fields if required.

## 10. Operational Checklist
- Key rotation documented + tested quarterly.
- Worker heartbeat (Redis key `nostr:worker:heartbeat`) monitored; alert if stale (>60s).
- DLQ reviewed daily; manual publish playbook defined.
- Metrics: publish latency p95, success rate, retries/job, queue depth, DLQ count.
- Runbooks: `runbooks/nostr.md` covering restart, scaling, incident response.

## 11. Risks & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Relay instability/outage | Missed publishes | Maintain ≥3 relays, monitor health, auto-retry w/ exponential backoff |
| Duplicate posts | Spam / inconsistent data | submissionId tag + DB flag + queue jobId = submissionId |
| Queue backlog | Slow publish SLA breach | Autoscale workers, alert on depth, throttle submissions if needed |
| Secret leakage | Account compromise | Mask logs, restrict env access, automated static checks, rotate keys |
| Schema drift | Logs unusable | Prisma migration review + contract tests |
| Serverless cold start | Slow queue processing | Run dedicated worker, keep connection warm, pre-connect NDK |

## 12. Timeline & Milestones (estimates)
- **Week 1**: Env + deps + schema + docs.
- **Week 2**: NDK client + event builder + publisher service + initial tests.
- **Week 3**: Queue wiring + API integration + end-to-end tests.
- **Week 4**: Admin UI, observability, doc polish.
- **Week 5**: Load/chaos testing, security review, shadow mode.
- **Week 6**: Pilot + full rollout + post-launch review.

## 13. Open Questions / Follow-ups
1. Are there compliance requirements (e.g., GDPR) influencing what data can be published to Nostr? Define allowed fields before launch.
2. Should admin be able to re-trigger publish manually from UI? (Likely yes—needs UX design.)
3. Which relays are approved/blocked? Need final list + SLA expectations.
4. Will we ever need to edit/delete published events? If yes, design retraction workflow (Nostr deletions).
5. Where should runbooks live (`docs/runbooks/nostr.md` vs Notion)? Decide before GA.

---
This plan provides the actionable steps, sequencing, and acceptance criteria required to deliver the Nostr integration described in `NOSTR_IMPLEMENTATION.md`. Update this doc whenever scope, timeline, or architecture changes.
