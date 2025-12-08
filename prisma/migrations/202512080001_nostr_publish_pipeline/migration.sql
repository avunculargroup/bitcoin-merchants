CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "PublishStatus" AS ENUM (
  'pending',
  'retrying',
  'success',
  'failed',
  'skipped'
);

CREATE TYPE "PublishTrigger" AS ENUM (
  'submission',
  'approval',
  'manual'
);

CREATE TABLE "admin_publish_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "submission_id" TEXT NOT NULL,
  "status" "PublishStatus" NOT NULL DEFAULT 'pending',
  "trigger" "PublishTrigger" NOT NULL DEFAULT 'submission',
  "nostr_event_id" TEXT,
  "relays" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "relay_statuses" JSONB,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "published_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "admin_publish_logs_submission_id_idx"
  ON "admin_publish_logs" ("submission_id");

ALTER TABLE "admin_publish_logs"
  ADD CONSTRAINT "admin_publish_logs_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "submissions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "nostr_dead_letter" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "submission_id" TEXT,
  "job_id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "error" TEXT,
  "retries" INTEGER NOT NULL DEFAULT 0,
  "resolved" BOOLEAN NOT NULL DEFAULT FALSE,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "nostr_dead_letter_job_id_idx"
  ON "nostr_dead_letter" ("job_id");

CREATE INDEX "nostr_dead_letter_submission_id_idx"
  ON "nostr_dead_letter" ("submission_id");

ALTER TABLE "nostr_dead_letter"
  ADD CONSTRAINT "nostr_dead_letter_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "submissions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
