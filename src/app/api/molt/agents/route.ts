import { NextRequest, NextResponse } from 'next/server';
import { readCache, writeCache } from '@/lib/cache';

export const revalidate = 1800; // Revalidate every 30 minutes

/**
 * Constructs the Molt DNS API URL with query parameters
 */
function buildMoltDNSUrl(searchParams: URLSearchParams): string {
  const baseUrl = 'https://moltdns.com/api/agents';
  const params = new URLSearchParams();

  // Forward supported query parameters
  const supportedParams = ['search', 'category', 'platform', 'minTrust', 'verified', 'sort', 'limit', 'offset'];

  for (const param of supportedParams) {
    const value = searchParams.get(param);
    if (value) {
      params.set(param, value);
    }
  }

  return `${baseUrl}?${params.toString()}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    console.log('[v0] Agents request - Search params:', {
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      platform: searchParams.get('platform'),
      minTrust: searchParams.get('minTrust'),
      verified: searchParams.get('verified'),
      sort: searchParams.get('sort'),
    });

    // Try to read from cache first
    let agents = await readCache();

    if (agents) {
      console.log('[v0] Returning cached agents');
      return NextResponse.json({
        success: true,
        data: agents,
        source: 'cache',
        timestamp: new Date().toISOString(),
      });
    }

    // Cache miss or stale - fetch from Molt DNS API
    console.log('[v0] Cache miss or stale, fetching from Molt DNS API');

    const moltDNSUrl = buildMoltDNSUrl(searchParams);
    console.log('[v0] Fetching from Molt DNS:', moltDNSUrl);

    const response = await fetch(moltDNSUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MoltDNS-Agent-Discovery/1.0',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[v0] Molt DNS API error:', response.status);

      // Try to return stale cache as fallback
      const staleCached = await readCache();
      if (staleCached) {
        console.log('[v0] Returning stale cache as fallback due to API error');
        return NextResponse.json({
          success: true,
          data: staleCached,
          source: 'stale-cache',
          warning: 'Using stale cache due to API unavailability',
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json(
        {
          error: `Molt DNS API returned ${response.status}`,
          message: 'Failed to fetch agents from Molt DNS',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[v0] Molt DNS API returned:', data?.length || 0, 'agents');

    // Cache the fresh data
    if (data && (Array.isArray(data) || data.agents)) {
      const agentsData = Array.isArray(data) ? data : data.agents;
      await writeCache(agentsData);
    }

    return NextResponse.json({
      success: true,
      data: data,
      source: 'molt-dns-api',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[v0] Error in /api/molt/agents:', error);

    // Try to return cached data as fallback on errors
    try {
      const cachedData = await readCache();
      if (cachedData) {
        console.log('[v0] Returning cached data as fallback due to error');
        return NextResponse.json(
          {
            success: true,
            data: cachedData,
            source: 'cache-fallback',
            warning: 'Using cached data due to error',
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }
    } catch (cacheError) {
      console.error('[v0] Error reading fallback cache:', cacheError);
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch agents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
