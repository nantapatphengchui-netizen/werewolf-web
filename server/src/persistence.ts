import Redis from 'ioredis';
import type { PersistSnapshot } from './game/RoomManager';

// Redis is optional: without REDIS_URL the server runs purely in-memory (local dev).
const REDIS_URL = process.env.REDIS_URL ?? process.env.REDIS_PRIVATE_URL ?? '';
const KEY = 'ww:state';
const TTL_SECONDS = 60 * 60 * 6; // abandoned state self-expires after 6h

let redis: Redis | null = null;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    lazyConnect: false,
    connectTimeout: 8000,
    maxRetriesPerRequest: 2,
    // Cap reconnect backoff so a bad URL doesn't spin hot
    retryStrategy: (times) => Math.min(times * 500, 5000),
  });
  redis.on('error', (e) => console.error('[persist] redis error:', e.message));
  redis.on('connect', () => console.log('[persist] redis connected'));
}

export const persistenceEnabled = !!redis;

let lastJson = '';

export async function saveState(snapshot: PersistSnapshot): Promise<void> {
  if (!redis) return;
  const json = JSON.stringify(snapshot);
  if (json === lastJson) return; // nothing changed since the last flush
  try {
    await redis.set(KEY, json, 'EX', TTL_SECONDS);
    lastJson = json;
  } catch (e) {
    console.error('[persist] save failed:', (e as Error).message);
  }
}

export async function loadState(): Promise<PersistSnapshot | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(KEY);
    if (!raw) return null;
    lastJson = raw; // seed dedup so we don't immediately re-write identical state
    return JSON.parse(raw) as PersistSnapshot;
  } catch (e) {
    console.error('[persist] load failed:', (e as Error).message);
    return null;
  }
}
