## Feature Implementation Document — Nostr Integration via NDK

### 1. Purpose & Scope

**Objective:**
Enable automatic posting to Nostr when a user submits a form or an admin approves a submission. Posts should come from a fixed Nostr account (controlled via private key in `.env`). The system should be robust, reliable, and maintainable: caching to reduce unnecessary network/re-relay load; queue/retry logic for publishing; and error logging (visible to admins/ops, not end users).

**What’s covered by this doc:**

* Nostr client setup (NDK)
* Cache adapter selection & invalidation strategy
* Relay configuration via environment variables
* Event publishing flow (on submission/approval)
* Error handling, logging & retry/queue logic
* Integration constraints (privacy, security, configuration)
* Basic data flow overview

**Out of scope (for now):**

* User-driven signing (users will *not* sign; one fixed account will be used)
* Real-time subscriptions or reading Nostr data for UI (unless later required)
* Complex UIs for Nostr content (this is a backend/publishing integration)

---

### 2. NDK — What It Gives You & Why It’s a Fit

**Core advantages of NDK:**

* NDK is a full-featured toolkit for building Nostr-based applications: clients, relays, or mixed. It provides event creation & signing, relay pool management, subscriptions/queries, and support for major NIPs (protocol extensions). ([GitHub][1])
* It supports multiple cache adapters (in-memory, Redis, SQLite, etc.) via a pluggable architecture — which suits your backend in Next.js. ([GitHub][1])
* Publishing via NDK uses an “outbox model + relay pool + automatic failover/reconnection” — helpful to ensure reliability when relays are flaky or down. ([npm.io][2])
* Modular design: you only pull in what you need (core, cache adapter, signer via private key). ([GitHub][1])

**Conclusion:** NDK aligns well with your use case of server-side publishing from a fixed account with caching, simplify relay management, and reduce friction in building the integration.

---

### 3. Configuration: Environment + NDK Setup

**Environment Variables (`.env`):**
Define values that vary by deployment environment, secret credentials, or configuration. Example variables:

* `NOSTR_RELAYS` — A comma-separated list of relay WebSocket URLs (e.g. `"wss://relay1.example.com,wss://relay2.example.com"`).
* `NOSTR_PRIVATE_KEY` — The private key (nsec) or seed for your fixed account. This must remain server-side and never exposed to clients.
* `REDIS_URL` — If using Redis cache adapter, the Redis connection string (e.g. `redis://user:pass@host:port`).
* (Optional) `SQLITE_DB_PATH` — If using SQLite cache adapter, path/filename for the database.

**NDK Initialization (backend):**
Use NDK with the chosen cache adapter and signer. Rough setup (pseudocode / conceptual):

```ts
import { NDK, NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
// and whatever cache adapter you choose:
import { NDKRedisCacheAdapter } from '@nostr-dev-kit/ndk-cache-redis';   // or
import { NDKCacheAdapterSqliteWasm } from '@nostr-dev-kit/cache-sqlite-wasm';

const relayList = process.env.NOSTR_RELAYS.split(',');

let cacheAdapter;
if (USE_REDIS) {
  cacheAdapter = new NDKRedisCacheAdapter({ url: process.env.REDIS_URL });
} else {
  const sqliteAdapter = new NDKCacheAdapterSqliteWasm({ dbName: 'ndk-cache' });
  await sqliteAdapter.initialize();
  cacheAdapter = sqliteAdapter;
}

const ndk = new NDK({
  explicitRelayUrls: relayList,
  cacheAdapter,
});

const signer = new NDKPrivateKeySigner(process.env.NOSTR_PRIVATE_KEY);
ndk.setSigner(signer);

await ndk.connect();
```

This matches the modular design and cache-adapter options NDK provides. ([npm.io][2])

---

### 4. Cache Strategy & Invalidation

Because NDK allows different cache adapters, you need a strategy to avoid stale or inconsistent data, especially if you ever read from Nostr data (e.g. metadata, previous events). Here’s a recommended approach:

**Cache-aside with TTL + selective invalidation:**

* On read (if you implement reading), first check cache. If entry exists and not expired (within TTL), return cached data.
* If not in cache or expired, fetch from relay(s), store/update cache, return result.
* Use a moderate TTL (e.g. 5–15 minutes) to balance freshness vs. reducing redundant relay/network fetch.
* For data that changes (e.g. user profile updates, metadata) — when you publish an event that updates data, after successful publish, explicitly invalidate related cache entries (e.g. user profile cache) so subsequent reads fetch fresh data.

**Why this works for Nostr + NDK:**

* Nostr data is append-only or versioned: profile changes are published as new events — so invalidation after publishing ensures cache coherence.
* NDK’s cache-adapter abstraction (Redis or SQLite) allows storing events, metadata, profiles, relay status, etc. ([nostr-dev-kit.github.io][3])
* For your primary use-case (write-heavy publish on form submission), caching is less critical — but useful if later you want to fetch or display data.

**Caveats / Notes:**

* If you never need to read from Nostr in this integration (just write), caching gains are minimal; but keeping it provides flexibility for future features (e.g. display history, confirmation, moderation).
* Using Redis for cache is ideal in a server context (shared across instances, persistent), but the existing Redis adapter for NDK has somewhat basic cache-hit logic (only for queries with exact `kinds` + `authors` filters) per the adapter’s README. ([GitHub][4]) — this may affect cache effectiveness depending on how you query. That means cache hits might be less frequent unless queries are simple / consistent.

---

### 5. Relay Management & Publish Flow

Because NDK supports a **relay connection pool + automatic reconnection & failover**, using multiple relays improves reliability. ([npm.io][2])

**Design:**

* Store relay list in `.env` (as described).
* Initialize NDK with `explicitRelayUrls` (parsed from `.env`).
* On event publish, NDK will attempt to send to relays; if some fail or disconnect, pool/failover handles reconnection or alternative relays.

**Publishing Logic (on form submission or admin approval):**

1. Receive form data (user submission) (and/or admin approval).
2. Build appropriate Nostr event (e.g. kind = 1 for a “note”, or maybe custom kind depending on content). Use relevant tags if encoding metadata (e.g. location, submission ID, OSM reference, etc.).
3. Sign the event using private key signer from `.env`.
4. Publish via NDK: `event.publish()` (or equivalent).
5. On success: record event ID + relay(s) used + timestamp + link to internal submission record. Then trigger OSM update (if that’s part of your flow).
6. On failure (relay down, network error, rejection, etc): catch error, log details (relay URL, error message, submission ID, timestamp), enqueue a retry job.
7. In retry job: attempt publish again (possibly to other relays), with backoff or limited retry attempts; log success or repeated failure (for admin/ops attention).

This gives you reliability even if some relays are temporarily down.

---

### 6. Error Handling, Logging & Visibility

**Error Handling Strategy:**

* Do not show errors to end users (to avoid confusing or alarming them) — show generic success/failure ("Your submission is being reviewed", or "Thanks").
* Internally, log detailed error metadata: submission ID, user/admin triggering, event data (or summarised), relay URL(s), error message/stack, retry count, timestamps.

**Logging / Monitoring:**

* Use a logging system (e.g. console + file + structured logs, or external logging/observability service) to capture all publish attempts, success/failure, retries, OSM update results, etc.
* Provide an admin dashboard / report or periodic summary/reporting of failures (e.g. daily/weekly) so ops can monitor reliability.

**Retry / Queue Mechanism:**

* Use a job queue (e.g. Redis-based queue, or database table) to store “pending publishes”. When initial publish fails, enqueue the job.
* Periodic worker/cron job (or on app startup) that attempts to process pending jobs. Use retry limits, e.g. 3–5 attempts before flagging as “manual review required.”
* Ensure idempotency: e.g. store internal submission ID as a tag in the Nostr event; before retry, check if an event for this submission ID already exists (avoid duplicate posts).

---

### 7. Data Flow (High-level)

```
[User submits form] → backend receives data → (optionally admin approves) →  
   → Build Nostr event → Sign with private key → Publish via NDK →  
        if success → Trigger OSM update → Mark submission as “published + OSM-complete” → Log success  
        if failure → Log error + enqueue retry job → Mark submission “pending retry” / notify ops  
```

Optional: if your system ever needs to read from Nostr (e.g. display past posts, verify events, show metadata) — use cache-adapter + cache strategy described earlier to fetch & store data.

---

### 8. Security & Operational Considerations

* **Private Key Management:** The private key (nsec) must stay server-side, in `.env` (or other secure secret store). Never expose to client or public repo.
* **Data Sanitization & Validation:** Before publishing form data to Nostr (or sending to OSM), sanitize and validate inputs to avoid injecting malformed/malicious content, or leaking unwanted data.
* **Relay Selection:** Use multiple relays to avoid single point of failure. Periodically review relay health/availability. Optionally allow dynamic relay list updates (but ensure `.env` or config reflects that).
* **Duplicate Prevention / Idempotency:** Tag events with internal submission IDs or other unique identifiers to avoid duplicates on retry.
* **Logging & Auditing:** Keep detailed logs for auditing, debugging, and monitoring.
* **Fallback / Manual Review:** If retries exhaust without success, flag submission for manual review (or alternative processing), to avoid silently losing data.

---

### 9. Why This Design Works for Your Setup

Given you’re using Next.js (server-side capable) and need a clean integration — this design:

* Keeps private key secure on server
* Uses NDK’s flexible cache & relay capabilities for robustness
* Separates concerns: form handling, Nostr publishing, OSM integration, logging/retries — making each piece maintainable
* Provides future flexibility: if later you want to read/display Nostr data (e.g. list of published posts), caching and subscriptions are available via NDK
* Avoids exposing complexity or potential failures to end users

---

## 📌 Summary of Key Decisions & Defaults

| Subject              | Recommended/default configuration                                                            |
| -------------------- | -------------------------------------------------------------------------------------------- |
| NDK usage            | Use @nostr-dev-kit/ndk (core) + cache adapter (Redis or SQLite) + NDKPrivateKeySigner        |
| Cache adapter        | Prefer Redis (shared, persistent) in production; SQLite acceptable for simple or small scale |
| Relay list config    | Store as comma-separated string in `.env` (e.g. `NOSTR_RELAYS`)                              |
| Publish flow         | On form submit or admin approval → build → sign → publish → OSM update → log                 |
| Error handling       | Catch publish errors → log + enqueue retry → no error shown to end user                      |
| Retry mechanism      | Job queue + worker, with retry limit + idempotency checks                                    |
| Cache invalidation   | Cache-aside + TTL (5–15 min) + explicit invalidation when data changes                       |
| Security             | Private key only in backend; sanitize inputs; avoid exposing sensitive data                  |
| Logging & monitoring | Structured logs + optional dashboard / alerting for failures / retry stats                   |

---

## 📝 Next Steps (for Implementation)

1. Add `.env` config variables as described.
2. Install NDK and chosen cache adapter (`@nostr-dev-kit/ndk`, plus e.g. `@nostr-dev-kit/cache-redis` or `@nostr-dev-kit/cache-sqlite-wasm`).
3. Write the initialization code in your Next.js backend startup.
4. Implement the publish API/path: receive form data, optionally admin approval, build + sign + publish + handle success/failure + logging + OSM integration + retry queue.
5. Build or integrate a simple job queue / worker system for retries (e.g. using Redis, or a persistent DB + background worker).
6. Set up logging (structured) and monitoring / admin reporting of failures.
7. (Optional) If you want to read from Nostr later — build read APIs using NDK’s subscription/query + cache.

---

If you like — I can also attach a **sample skeleton structure** for your Next.js project directory (folders/modules + which files handle what: e.g. `ndk.ts`, `publishService.ts`, `retryWorker.ts`, `routes/api/submit.ts`, etc.) so that you have a ready-to-drop-in scaffold.

[1]: https://github.com/nostr-dev-kit/ndk?utm_source=chatgpt.com "nostr-dev-kit/ndk: Nostr Development Kit with outbox-model support - GitHub"
[2]: https://npm.io/package/%40nostr-dev-kit/ndk?utm_source=chatgpt.com "@nostr-dev-kit/ndk - npm.io"
[3]: https://nostr-dev-kit.github.io/ndk/cache/memory.html?utm_source=chatgpt.com "Memory Cache Adapter | NDK - nostr-dev-kit.github.io"
[4]: https://github.com/nostr-dev-kit/ndk-cache-redis?utm_source=chatgpt.com "nostr-dev-kit/ndk-cache-redis: NDK cache adapter using redis. - GitHub"
