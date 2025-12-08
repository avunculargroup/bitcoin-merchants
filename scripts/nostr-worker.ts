import { logger } from "@/lib/logger";
import { startNostrWorker } from "@/lib/queues/nostrQueue";

async function main() {
  const worker = startNostrWorker();

  if (!worker) {
    logger.warn("Nostr worker not started (disabled or missing config)");
    return;
  }

  const shutdown = async (signal: string) => {
    logger.info("Shutting down nostr worker", { signal });
    await worker.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  logger.info("Nostr worker is running. Press Ctrl+C to stop.");
}

main().catch((error) => {
  logger.error("Failed to start nostr worker", { error });
  process.exit(1);
});
