# Nostr Integration Build Plan

## 1. Objectives & Constraints
- Automatically publish approved submissions to Nostr from a single managed account.
- Keep keys, relay configuration, and cache settings server-side via environment variables.
- Ensure reliability (retry/queue, logging, monitoring) without impacting end-user UX.
- Align with the architecture and decisions in `NOSTR_IMPLEMENTATION.md`.

## 2. Success Criteria
- ✅ Publishing succeeds to at least 2 relays for ≥99% of approved submissions.
- ✅ Failures are retried automatically up to the configured limit, with manual escalation on exhaustion.
- ✅ Admins can see publish status per submission (success, pending retry, failed) inside the existing tooling.
- ✅ Secrets stay in secure config (.env or secret manager); no leakage to client bundles or logs.
- ✅ All code paths covered by automated tests (unit + integration) for happy/failed publish scenarios.

## 3. High-Level Architecture Recap
- **NDK Client Module (`lib/ndk.ts`)**: Initializes NDK with cache adapter (Redis prod, SQLite dev) and signer from `.env`.
- **Publish Service (`services/nostrPublisher.ts`)**: Builds events, signs, publishes, records outcomes.
- **Retry Queue (`lib/queues/nostrQueue.ts`)**: Redis-backed queue processing unpublished events with exponential backoff and idempotency guard.
- **API Hooks:**
  - `app/api/submit/route.ts`: enqueue publish job after submission is stored.
  - `app/api/admin/submissions/[id]/approve/route.ts`: trigger publish on approval if not already posted.
- **Observability:** structured logging + `AdminPublishLog` prisma table (submissionId, nostrEventId, relays, status, retries, error).

## 4. Work Breakdown Structure

### Phase 1 — Foundations
1. **Config scaffolding**
   - Add new `.env` entries: `NOSTR_RELAYS`, `NOSTR_PRIVATE_KEY`, `REDIS_URL`, optional `SQLITE_DB_PATH`.
   - Update `lib/env.ts` to type-check and expose these variables.
   - Acceptance: `pnpm lint` passes; missing vars cause build-time error.

2. **Dependencies & typings**
   - Install `@nostr-dev-kit/ndk`, chosen cache adapter(s), and `bullmq` (or preferred queue lib).
   - Update `tsconfig` paths/types if needed.
   - Acceptance: `pnpm install` modifies `package.json`/`pnpm-lock.yaml`; type-check clean.

### Phase 2 — Core Services
3. **NDK client factory**
   - Create `lib/ndk.ts` exporting a singleton NDK instance configured per env.
   - Handle Redis vs SQLite selection + graceful connect/disconnect.
   - Acceptance: unit test ensures relays parsed, signer set, connect invoked once.

4. **Event builder**
   - Add helper `buildNostrEvent(submission)` returning `NDKEvent` with kind, content template, tags (`submissionId`, `geo`, etc.).
   - Acceptance: tests verify tags/content formatting and sanitization.

5. **Publisher service**
   - Implement `publishSubmission(submissionId)` that fetches submission, builds event, publishes via NDK, stores result in `AdminPublishLog`.
   - Acceptance: integration test stubs NDK publish and validates DB writes + idempotency (skip if already published).

### Phase 3 — Queue & Retry
6. **Queue wiring**
   - Configure BullMQ queue + worker for `nostr.publish` jobs.
   - Job payload: `{ submissionId, trigger }`; worker calls `publishSubmission`.
   - Configure retries (e.g., 5 attempts, exponential backoff) and DLQ table/queue.
   - Acceptance: tests confirm failures enqueue retry and mark status pending.

7. **API integration**
   - On submission creation and admin approval, enqueue queue job instead of direct publish.
   - Ensure transactional safety: only enqueue after DB commit.
   - Acceptance: e2e test verifies submission -> job -> publish success path.

### Phase 4 — Observability & UX
8. **Admin visibility**
   - Extend admin UI or API to show publish status/logs per submission.
   - Include event ID + relays for successful posts; failure reasons + retry count.
   - Acceptance: UI snapshot test + manual QA script.

9. **Logging and alerts**
   - Structured logs (JSON) for publish attempts, successes, failures.
   - Optional integration with alerting (e.g., Webhook/Slack) when DLQ receives items.
   - Acceptance: log statements verified in dev; alert hook documented.

### Phase 5 — Hardening
10. **Security review**
    - Ensure private key access limited to server runtime; add secret-rotation checklist.
    - Pen-test input sanitization for event content.
    - Acceptance: security checklist completed, peer-review sign-off.

11. **Load & chaos testing**
    - Simulate burst submissions and relay outages (mock NDK to throw) to verify retries and monitoring.
    - Acceptance: documented test results; any discovered issues resolved.

## 5. Testing Strategy
- **Unit tests:** event builder, env parsing, retry backoff util.
- **Integration tests:** publisher service with mocked NDK, queue-worker flow.
- **E2E tests:** submission + approval flows confirm publish job lifecycle (NDK mocked).
- **Manual smoke:** connect to staging relays, post test submission, confirm receipt via external Nostr client.

## 6. Deployment & Rollout Plan
1. Deploy infrastructure updates (Redis, secret manager entries).
2. Feature-flag queue consumer; run in shadow mode logging only.
3. After confidence, flip feature flag to actually publish.
4. Monitor logs/alerts for 48h; prepare rollback (disable flag + drain queue) if issues.

## 7. Operational Checklist
- Rotation procedure for `NOSTR_PRIVATE_KEY` documented and tested.
- Cron/worker health checks in place (e.g., heartbeat key in Redis).
- DLQ review schedule (daily) with runbook for manual publishing if required.
- Metrics captured: publish latency, success rate, retries per submission.

## 8. Risks & Mitigations
- **Relay instability:** Mitigate with ≥3 relays + periodic health checks.
- **Duplicate posts:** Use submissionId tag + DB flag; publisher checks before posting.
- **Queue backlog:** Autoscale workers or throttle submission intake; expose queue depth metric.
- **Secret leakage:** Limit log content, mask keys, restrict env access, add automated checks pre-commit.

---
This plan provides the actionable steps and acceptance criteria needed to implement the Nostr integration described in `NOSTR_IMPLEMENTATION.md`.
