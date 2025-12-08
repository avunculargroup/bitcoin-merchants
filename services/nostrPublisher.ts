import { NDKEvent } from "@nostr-dev-kit/ndk";
import type { PublishTrigger } from "@prisma/client";
import { PublishStatus } from "@prisma/client";

import { env } from "@/lib/env";
import {
  createPublishLogEntry,
  getLatestSuccessfulPublish,
  updatePublishLogEntry,
} from "@/lib/db/publish-log";
import { logger } from "@/lib/logger";
import { assertNostrReady } from "@/lib/ndk";
import { prisma } from "@/lib/prisma";
import { buildNostrEvent } from "@/lib/nostr/event-builder";
import type { RelayPublishStatus } from "@/types/nostr";

type PublishResult =
  | {
      status: PublishStatus.success | PublishStatus.skipped;
      eventId?: string;
    }
  | {
      status: PublishStatus.failed | PublishStatus.retrying;
      error: Error;
    };

function buildFailedRelayStatuses(message: string): RelayPublishStatus[] {
  return env.nostr.relays.map((relay) => ({
    relay,
    status: "failed",
    error: message,
  }));
}

export async function publishSubmission(
  submissionId: string,
  trigger: PublishTrigger,
  attempt = 0,
): Promise<PublishResult> {
  if (!env.nostr.publishEnabled) {
    logger.info("Nostr publishing disabled; skipping publish", { submissionId });
    return { status: PublishStatus.skipped };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  const existing = await getLatestSuccessfulPublish(submissionId);
  if (existing) {
    logger.info("Submission already published; skipping", {
      submissionId,
      eventId: existing.nostrEventId,
    });
    return { status: PublishStatus.skipped, eventId: existing.nostrEventId ?? undefined };
  }

  const logEntry = await createPublishLogEntry({
    submissionId,
    trigger,
    relays: env.nostr.relays,
    relayStatuses: [],
  });

  try {
    const ndk = await assertNostrReady();
    const builtEvent = buildNostrEvent({ submission, trigger });
    const event = new NDKEvent(ndk, builtEvent);

    await event.sign();

    const publishedRelays = await event.publish(undefined, 15_000, 2);
    const successRelays = Array.from(publishedRelays.values()).map(
      (relay) => relay.url,
    );

    const relayStatuses: RelayPublishStatus[] = env.nostr.relays.map(
      (relayUrl) =>
        successRelays.includes(relayUrl)
          ? { relay: relayUrl, status: "success" as const }
          : { relay: relayUrl, status: "pending" as const },
    );

    await updatePublishLogEntry(logEntry.id, {
      status: PublishStatus.success,
      nostrEventId: event.id,
      relayStatuses,
      retryCount: attempt,
      publishedAt: new Date(),
    });

    logger.info("Published submission to Nostr", {
      submissionId,
      eventId: event.id,
      relays: successRelays,
    });

    return { status: PublishStatus.success, eventId: event.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown publish error";
    const isRetry = attempt < 4;
    await updatePublishLogEntry(logEntry.id, {
      status: isRetry ? PublishStatus.retrying : PublishStatus.failed,
      lastError: message,
      retryCount: attempt,
      relayStatuses: buildFailedRelayStatuses(message),
    });

    logger.error("Failed to publish submission to Nostr", {
      submissionId,
      attempt,
      error,
    });

    return {
      status: isRetry ? PublishStatus.retrying : PublishStatus.failed,
      error: error instanceof Error ? error : new Error(message),
    };
  }
}
