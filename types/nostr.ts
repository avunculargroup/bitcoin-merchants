import type { PublishTrigger } from "@prisma/client";

export type RelayPublishStatus =
  | {
      relay: string;
      status: "success";
      latencyMs?: number;
    }
  | {
      relay: string;
      status: "failed";
      error?: string;
    }
  | {
      relay: string;
      status: "pending";
    };

export type NostrPublishJobData = {
  submissionId: string;
  trigger: PublishTrigger;
};
