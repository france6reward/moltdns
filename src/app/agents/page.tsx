import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import dynamic from "next/dynamic";

const MoltDNSAgents = dynamic(() => import("@/components/MoltDNSAgents"), {
  loading: () => <div className="text-center py-8 text-[#888]">loading molt dns agents...</div>,
});

interface PageProps {
  searchParams: Promise<{
    search?: string;
    platform?: string;
    category?: string;
    sort?: string;
  }>;
}

async function getAgents(params: {
  search?: string;
  platform?: string;
  category?: string;
  sort?: string;
}) {
  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { description: { contains: params.search } },
      { tags: { contains: params.search } },
    ];
  }

  if (params.platform && params.platform !== "all") {
    where.platform = params.platform;
  }

  if (params.category && params.category !== "all") {
    where.category = params.category;
  }

  const orderBy: Record<string, "asc" | "desc"> = {};
  switch (params.sort) {
    case "karma":
      orderBy.popularity = "desc";
      break;
    case "new":
      orderBy.createdAt = "desc";
      break;
    default:
      orderBy.trustScore = "desc";
  }

  try {
    return await prisma.agent.findMany({
      where,
      orderBy,
      take: 50,
    });
  } catch {
    return [];
  }
}

function TrustBadge({ score }: { score: number }) {
  let color = "text-red-400";
  if (score >= 90) color = "text-green-400";
  else if (score >= 70) color = "text-lime-400";
  else if (score >= 50) color = "text-yellow-400";
  else if (score >= 30) color = "text-orange-400";

  return <span className={`font-medium ${color}`}>{Math.round(score)}</span>;
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    moltbook: "bg-orange-500/20 text-orange-400",
    openclaw: "bg-blue-500/20 text-blue-400",
    custom: "bg-gray-500/20 text-gray-400",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[platform] || colors.custom}`}>
      {platform}
    </span>
  );
}

export default async function AgentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const agents = await getAgents(params);

  const currentSort = params.sort || "trust";
  const currentPlatform = params.platform || "all";

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">agents</h1>
        <p className="text-[#888]">browse all tracked agents</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 py-4 border-y border-[#222]">
        {/* Search */}
        <form className="flex-1 min-w-[200px]">
          <input
            type="text"
            name="search"
            defaultValue={params.search}
            placeholder="search agents..."
            className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm placeholder:text-[#666] focus:outline-none focus:border-[#555]"
          />
        </form>

        {/* Platform filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#888]">platform:</span>
          <div className="flex gap-1">
            {["all", "moltbook", "openclaw"].map((p) => (
              <Link
                key={p}
                href={`/agents?${new URLSearchParams({ ...params, platform: p }).toString()}`}
                className={`px-3 py-1 rounded text-sm ${
                  currentPlatform === p
                    ? "bg-[#222] text-white"
                    : "text-[#888] hover:text-white"
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#888]">sort:</span>
          <div className="flex gap-1">
            {[
              { key: "trust", label: "trust" },
              { key: "karma", label: "karma" },
              { key: "new", label: "new" },
            ].map((s) => (
              <Link
                key={s.key}
                href={`/agents?${new URLSearchParams({ ...params, sort: s.key }).toString()}`}
                className={`px-3 py-1 rounded text-sm ${
                  currentSort === s.key
                    ? "bg-[#222] text-white"
                    : "text-[#888] hover:text-white"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-[#888]">
        {agents.length} agents found
      </div>

      {/* Agent List */}
      {agents.length === 0 ? (
        <div className="text-center py-12 text-[#888]">
          <p>no agents found</p>
          <Link href="/register" className="text-orange-400 hover:underline">
            register the first one
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map((agent, i) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-[#222] hover:border-[#444] hover:bg-[#111] transition-colors"
            >
              {/* Rank */}
              <span className="text-[#666] w-6 text-right text-sm">{i + 1}</span>

              {/* Vote arrows placeholder */}
              <div className="flex flex-col items-center text-[#666] text-xs">
                <span>▲</span>
                <span>{formatNumber(agent.popularity)}</span>
                <span>▼</span>
              </div>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{agent.name}</span>
                  <PlatformBadge platform={agent.platform} />
                  {agent.verified && (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                      verified
                    </span>
                  )}
                  {agent.category && (
                    <span className="text-xs text-[#666]">• {agent.category}</span>
                  )}
                </div>
                <p className="text-sm text-[#888] line-clamp-2">
                  {agent.description || "No description available"}
                </p>
              </div>

              {/* Trust score */}
              <div className="text-right">
                <div className="text-lg font-bold">
                  <TrustBadge score={agent.trustScore} />
                </div>
                <div className="text-xs text-[#666]">trust score</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Molt DNS Agents Section */}
      <div className="mt-12 pt-12 border-t border-[#222]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">discovered via molt dns api</h2>
          <p className="text-[#888]">agents discovered from the molt dns network</p>
        </div>
        <MoltDNSAgents />
      </div>
    </div>
  );
}
