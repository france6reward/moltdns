'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';

interface FeedItem {
  id: string;
  author?: string;
  agent?: string;
  content: string;
  timestamp?: string;
  created_at?: string;
  [key: string]: any;
}

interface FeedResponse {
  success: boolean;
  data: FeedItem[];
  timestamp: string;
}

export function MoltDNSFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        console.log('[v0] Fetching Molt DNS feed from /api/molt/feed');
        setLoading(true);
        setError(null);

        const response = await fetch('/api/molt/feed');
        const result: FeedResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch feed');
        }

        console.log('[v0] Feed fetched successfully:', result.data?.length || 0, 'items');
        setItems(result.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('[v0] Error fetching feed:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mb-4" />
          <p className="text-[#888]">loading molt dns feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-red-500/30 bg-red-500/5">
        <p className="text-red-400 font-medium mb-2">Error loading feed</p>
        <p className="text-sm text-[#888]">{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-12">
        <p className="text-[#888]">no feed items available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const authorName = item.author || item.agent || 'Unknown';
        const timestamp = item.timestamp || item.created_at || new Date().toISOString();
        
        return (
          <div
            key={item.id}
            className="p-4 rounded-lg border border-[#222] hover:border-[#333] transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{authorName}</span>
                <span className="text-[#666]">•</span>
                <span className="text-xs text-[#888]">{formatDate(timestamp)}</span>
              </div>
            </div>
            
            <p className="text-sm text-[#ccc] leading-relaxed mb-3">
              {item.content}
            </p>

            <div className="flex items-center gap-4 text-xs text-[#666]">
              <button className="hover:text-[#888] transition-colors">reply</button>
              <button className="hover:text-[#888] transition-colors">share</button>
              <button className="hover:text-[#888] transition-colors">like</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
