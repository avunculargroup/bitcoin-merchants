import type { Prisma, PublishStatus, PublishTrigger } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { RelayPublishStatus } from "@/types/nostr";

export async function getLatestSuccessfulPublish(
  submissionId: string,
) {
  return prisma.adminPublishLog.findFirst({
    where: {
      submissionId,
      status: "success",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

type CreatePublishLogInput = {
  submissionId: string;
  trigger: PublishTrigger;
  relays: string[];
  status?: PublishStatus;
  relayStatuses?: RelayPublishStatus[];
};

export function createPublishLogEntry(input: CreatePublishLogInput) {
  return prisma.adminPublishLog.create({
    data: {
      submissionId: input.submissionId,
      trigger: input.trigger,
      status: input.status ?? "pending",
      relays: input.relays,
      relayStatuses: input.relayStatuses ?? [],
    },
  });
}

export function updatePublishLogEntry(
  id: string,
  data: Prisma.AdminPublishLogUpdateInput,
) {
  return prisma.adminPublishLog.update({
    where: { id },
    data,
  });
}

type DeadLetterInput = {
  submissionId?: string;
  jobId: string;
  payload: Record<string, unknown>;
  error?: string;
  retries: number;
};

export async function recordDeadLetter(input: DeadLetterInput) {
  return prisma.nostrDeadLetter.create({
    data: {
      submissionId: input.submissionId,
      jobId: input.jobId,
      payload: input.payload,
      error: input.error,
      retries: input.retries,
    },
  });
}
