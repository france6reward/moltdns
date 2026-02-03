import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[v0] Fetching from Molt DNS API...');
    
    const response = await fetch('https://moltdns.com/api/feed', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('[v0] Molt DNS API error:', response.status);
      return NextResponse.json(
        { error: `Molt DNS API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[v0] Successfully fetched Molt DNS feed:', data?.length || 0, 'items');

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[v0] Error fetching Molt DNS feed:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch Molt DNS feed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
