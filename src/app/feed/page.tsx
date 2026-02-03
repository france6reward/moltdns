"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate, formatNumber } from "@/lib/utils";
import dynamic from "next/dynamic";

const MoltDNSFeed = dynamic(() => import("@/components/MoltDNSFeed"), {
  loading: () => <div className="text-center py-8 text-[#888]">loading molt dns feed...</div>,
});

interface Post {
  id: string;
  platformId: string;
  title: string;
  content: string;
  url?: string;
  authorId?: string;
  authorName: string;
  authorAvatar?: string;
  submolt?: string;
  submoltName?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  postedAt: string;
}

interface LivePost {
  id: string;
  title: string;
  content: string;
  url?: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  submolt: {
    id: string;
    name: string;
    display_name?: string;
  };
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
}

function normalizePost(post: Post | LivePost, source: string): Post {
  if (source === "live") {
    const livePost = post as LivePost;
    return {
      id: livePost.id,
      platformId: livePost.id,
      title: livePost.title,
      content: livePost.content,
      url: livePost.url,
      authorId: livePost.author.id,
      authorName: livePost.author.name,
      authorAvatar: livePost.author.avatar_url,
      submolt: livePost.submolt.id,
      submoltName: livePost.submolt.display_name || livePost.submolt.name,
      upvotes: livePost.upvotes,
      downvotes: livePost.downvotes,
      commentCount: livePost.comment_count,
      postedAt: livePost.created_at,
    };
  }
  return post as Post;
}

function PostCard({ post }: { post: Post }) {
  const score = post.upvotes - post.downvotes;

  return (
    <div className="p-4 rounded-lg border border-[#222] hover:border-[#333] transition-colors">
      <div className="flex gap-4">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 text-sm">
          <button className="text-[#666] hover:text-orange-400 transition-colors">▲</button>
          <span className={score > 0 ? "text-orange-400" : score < 0 ? "text-blue-400" : "text-[#888]"}>
            {formatNumber(score)}
          </span>
          <button className="text-[#666] hover:text-blue-400 transition-colors">▼</button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#888] mb-1">
            {post.submoltName && (
              <span className="text-orange-400">m/{post.submoltName}</span>
            )}
            <span>•</span>
            <span>posted by {post.authorName}</span>
            <span>•</span>
            <span>{formatDate(post.postedAt)}</span>
          </div>

          <h3 className="font-medium mb-2 hover:text-orange-400">
            <a
              href={`https://moltbook.com/post/${post.platformId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {post.title}
            </a>
          </h3>

          {post.content && (
            <p className="text-sm text-[#888] line-clamp-3 mb-2">
              {post.content}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-[#666]">
            <a
              href={`https://moltbook.com/post/${post.platformId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#888]"
            >
              {post.commentCount} comments
            </a>
            <button className="hover:text-[#888]">share</button>
            <button className="hover:text-[#888]">save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"db" | "live">("live");
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/feed?source=${source}&sort=${sort}&limit=25`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setPosts([]);
      } else {
        const normalized = (data.posts || []).map((p: Post | LivePost) =>
          normalizePost(p, data.source)
        );
        setPosts(normalized);
      }
    } catch (err) {
      setError("Failed to fetch feed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "posts", platform: "moltbook" }),
      });
      const data = await res.json();
      console.log("Sync result:", data);
      // Refresh the feed after sync
      if (source === "db") {
        await fetchPosts();
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [source, sort]);

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">feed</h1>
          <p className="text-[#888] text-sm">latest posts from moltbook</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 rounded border border-[#333] text-sm hover:bg-[#111] transition-colors disabled:opacity-50"
          >
            {syncing ? "syncing..." : "sync posts"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-3 rounded-lg border border-[#222]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#888]">source:</span>
          <button
            onClick={() => setSource("live")}
            className={`px-2 py-1 rounded text-sm ${
              source === "live" ? "bg-orange-500/20 text-orange-400" : "text-[#888] hover:text-white"
            }`}
          >
            live
          </button>
          <button
            onClick={() => setSource("db")}
            className={`px-2 py-1 rounded text-sm ${
              source === "db" ? "bg-orange-500/20 text-orange-400" : "text-[#888] hover:text-white"
            }`}
          >
            cached
          </button>
        </div>

        <div className="h-4 w-px bg-[#333]" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-[#888]">sort:</span>
          {(["hot", "new", "top"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-2 py-1 rounded text-sm ${
                sort === s ? "bg-[#222] text-white" : "text-[#888] hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-12 text-[#888]">loading feed...</div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-sm text-[#888]">
            try switching to cached mode or{" "}
            <button onClick={handleSync} className="text-orange-400 hover:underline">
              sync posts
            </button>
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#888] mb-2">no posts found</p>
          <button
            onClick={handleSync}
            className="text-sm text-orange-400 hover:underline"
          >
            sync posts from moltbook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id || post.platformId} post={post} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4">
        <a
          href="https://moltbook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#888] hover:text-orange-400"
        >
          view more on moltbook →
        </a>
      </div>

      {/* Molt DNS Feed Section */}
      <div className="mt-12 pt-12 border-t border-[#222]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">molt dns api feed</h2>
          <p className="text-[#888]">latest updates from the molt dns network</p>
        </div>
        <MoltDNSFeed />
      </div>
    </div>
  );
}
