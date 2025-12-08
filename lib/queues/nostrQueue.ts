import { Queue, QueueScheduler, Worker } from "bullmq";
import IORedis from "ioredis";
import type { PublishTrigger } from "@prisma/client";

import { env } from "@/lib/env";
import { recordDeadLetter } from "@/lib/db/publish-log";
import { logger } from "@/lib/logger";
import { publishSubmission } from "@/services/nostrPublisher";
import type { NostrPublishJobData } from "@/types/nostr";

const QUEUE_NAME = "nostr.publish";
const HEARTBEAT_KEY = "nostr:worker:heartbeat";
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_BACKOFF_DELAY_MS = 30_000;

let connection: IORedis | null = null;
let queue: Queue<NostrPublishJobData> | null = null;
let scheduler: QueueScheduler | null = null;

function getRedisConnection() {
  if (!env.nostr.redisUrl) {
    return null;
  }

  if (!connection) {
    connection = new IORedis(env.nostr.redisUrl);
  }

  return connection;
}

function ensureQueue() {
  const redis = getRedisConnection();
  if (!redis) {
    throw new Error("Redis connection required for nostr.publish queue");
  }

  if (!queue) {
    queue = new Queue<NostrPublishJobData>(QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: DEFAULT_BACKOFF_DELAY_MS,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
  }

  if (!scheduler) {
    scheduler = new QueueScheduler(QUEUE_NAME, { connection: redis });
  }

  return queue;
}

async function touchHeartbeat() {
  if (!connection) {
    return;
  }

  await connection.set(HEARTBEAT_KEY, new Date().toISOString(), "EX", 60);
}

export async function enqueueNostrPublishJob(
  submissionId: string,
  trigger: PublishTrigger,
) {
  if (!env.nostr.publishEnabled) {
    logger.debug("Skipping nostr queue enqueue; feature disabled", {
      submissionId,
    });
    return;
  }

  const targetQueue = ensureQueue();
  await targetQueue.add(
    "publish",
    {
      submissionId,
      trigger,
    },
    {
      jobId: submissionId,
    },
  );

  logger.info("Enqueued nostr.publish job", {
    submissionId,
    trigger,
  });
}

export function startNostrWorker() {
  if (!env.nostr.publishEnabled) {
    logger.warn("Nostr worker not started; feature flag disabled");
    return null;
  }

  const redis = getRedisConnection();
  if (!redis) {
    throw new Error("Redis connection required to run nostr worker");
  }

  const worker = new Worker<NostrPublishJobData>(
    QUEUE_NAME,
    async (job) => {
      await touchHeartbeat();
      const result = await publishSubmission(
        job.data.submissionId,
        job.data.trigger,
        job.attemptsMade,
      );
      await touchHeartbeat();
      return result;
    },
    {
      connection: redis,
      concurrency: DEFAULT_CONCURRENCY,
    },
  );

  worker.on("completed", async (job) => {
    logger.info("nostr.publish job completed", {
      jobId: job.id,
      submissionId: job.data.submissionId,
    });
    await touchHeartbeat();
  });

  worker.on("failed", async (job, error) => {
    logger.error("nostr.publish job failed", {
      jobId: job?.id,
      submissionId: job?.data.submissionId,
      attempts: job?.attemptsMade,
      error,
    });

    if (
      job &&
      job.opts.attempts &&
      job.attemptsMade >= job.opts.attempts &&
      env.nostr.publishEnabled
    ) {
      await recordDeadLetter({
        submissionId: job.data.submissionId,
        jobId: job.id as string,
        payload: job.data,
        error: error?.message,
        retries: job.attemptsMade,
      });
    }
  });

  logger.info("Nostr worker started", { concurrency: DEFAULT_CONCURRENCY });
  return worker;
}
