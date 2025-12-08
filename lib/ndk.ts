import NDK, { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import type { NDKCacheAdapter } from "@nostr-dev-kit/ndk";
import RedisCacheAdapter from "@nostr-dev-kit/ndk-cache-redis";
import { NDKCacheAdapterSqliteWasm } from "@nostr-dev-kit/cache-sqlite-wasm";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

let ndkPromise: Promise<NDK> | null = null;

async function createCacheAdapter(): Promise<NDKCacheAdapter | undefined> {
  if (env.nostr.redisUrl) {
    return new RedisCacheAdapter({
      path: env.nostr.redisUrl,
    });
  }

  if (env.nostr.sqliteDbPath) {
    return new NDKCacheAdapterSqliteWasm({
      dbName: env.nostr.sqliteDbPath,
    });
  }

  return undefined;
}

async function bootstrapNdk(): Promise<NDK> {
  if (!env.nostr.publishEnabled) {
    throw new Error("Nostr publishing is disabled.");
  }

  const cacheAdapter = await createCacheAdapter();
  const ndk = new NDK({
    explicitRelayUrls: env.nostr.relays,
    cacheAdapter,
  });

  if (cacheAdapter instanceof NDKCacheAdapterSqliteWasm) {
    try {
      await cacheAdapter.initializeAsync(ndk);
    } catch (error) {
      logger.warn("Failed to initialize SQLite cache adapter", { error });
    }
  }

  ndk.signer = new NDKPrivateKeySigner(env.nostr.privateKey);

  await ndk.connect(10_000);
  logger.info("NDK client connected", {
    relayCount: env.nostr.relays.length,
  });

  return ndk;
}

export async function getNdk(): Promise<NDK> {
  if (!ndkPromise) {
    ndkPromise = bootstrapNdk();
  }

  return ndkPromise;
}

export async function assertNostrReady(): Promise<NDK> {
  if (!env.nostr.publishEnabled) {
    throw new Error("Nostr publishing is disabled.");
  }

  const ndk = await getNdk();
  const connectedRelays = ndk.pool.connectedRelays();

  if (connectedRelays.length === 0) {
    await ndk.connect(10_000);
  }

  return ndk;
}
