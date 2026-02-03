'use server';

import { promises as fs } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), 'data');
const CACHE_FILE = join(CACHE_DIR, 'molt-agents.json');
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CacheData {
  timestamp: number;
  data: any;
}

/**
 * Ensures the cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('[v0] Error creating cache directory:', error);
  }
}

/**
 * Gets the cache age in milliseconds
 */
async function getCacheAge(): Promise<number | null> {
  try {
    const stats = await fs.stat(CACHE_FILE);
    return Date.now() - stats.mtime.getTime();
  } catch {
    return null;
  }
}

/**
 * Checks if cache is fresh (less than 30 minutes old)
 */
async function isCacheFresh(): Promise<boolean> {
  const age = await getCacheAge();
  if (age === null) return false;
  return age < CACHE_TTL;
}

/**
 * Reads cached agent data
 */
export async function readCache(): Promise<any | null> {
  try {
    const isFresh = await isCacheFresh();
    if (!isFresh) {
      console.log('[v0] Cache is stale or does not exist');
      return null;
    }

    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    const cached: CacheData = JSON.parse(data);
    console.log('[v0] Loaded agents from cache, age:', Math.round((Date.now() - cached.timestamp) / 1000), 'seconds');
    return cached.data;
  } catch (error) {
    console.log('[v0] Error reading cache:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Writes agent data to cache
 */
export async function writeCache(data: any): Promise<void> {
  try {
    await ensureCacheDir();
    const cacheData: CacheData = {
      timestamp: Date.now(),
      data,
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
    console.log('[v0] Wrote agents to cache');
  } catch (error) {
    console.error('[v0] Error writing cache:', error);
  }
}

/**
 * Clears the cache file
 */
export async function clearCache(): Promise<void> {
  try {
    await fs.unlink(CACHE_FILE);
    console.log('[v0] Cache cleared');
  } catch (error) {
    console.log('[v0] Error clearing cache:', error instanceof Error ? error.message : error);
  }
}
