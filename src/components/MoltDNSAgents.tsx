'use client';

import { useState, useEffect } from 'react';
import { cn, formatNumber, getTrustColor, getTrustBgColor, getTrustLabel, formatDate } from '@/lib/utils';
import { Check, Star, Shield, Zap } from 'lucide-react';

interface MoltAgent {
  id?: string;
  name: string;
  platform?: string;
  trustScore?: number;
  trust_score?: number;
  verified?: boolean;
  category?: string;
  description?: string;
  avatar?: string;
  avatar_url?: string;
  createdAt?: string;
  created_at?: string;
  [key: string]: any;
}

interface AgentsResponse {
  success: boolean;
  data: MoltAgent[] | { agents?: MoltAgent[] };
  source?: string;
  warning?: string;
  timestamp: string;
}

interface MoltDNSAgentsProps {
  search?: string;
  category?: string;
  platform?: string;
  minTrust?: number;
  verified?: boolean;
  sort?: string;
}

export function MoltDNSAgents({
  search,
  category,
  platform,
  minTrust,
  verified,
  sort,
}: MoltDNSAgentsProps) {
  const [agents, setAgents] = useState<MoltAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        console.log('[v0] Fetching Molt DNS agents with params:', { search, category, platform, minTrust, verified, sort });
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category) params.set('category', category);
        if (platform) params.set('platform', platform);
        if (minTrust) params.set('minTrust', String(minTrust));
        if (verified !== undefined) params.set('verified', String(verified));
        if (sort) params.set('sort', sort);

        const response = await fetch(`/api/molt/agents?${params.toString()}`);
        const result: AgentsResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch agents');
        }

        let agentsData = result.data;
        if (!Array.isArray(agentsData) && agentsData.agents) {
          agentsData = agentsData.agents;
        }

        console.log('[v0] Agents fetched successfully:', agentsData?.length || 0, 'items, source:', result.source);
        setAgents(Array.isArray(agentsData) ? agentsData : []);
        setSource(result.source || 'unknown');

        if (result.warning) {
          console.log('[v0] API Warning:', result.warning);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('[v0] Error fetching agents:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [search, category, platform, minTrust, verified, sort]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mb-4" />
          <p className="text-[#888]">discovering molt dns agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-red-500/30 bg-red-500/5">
        <p className="text-red-400 font-medium mb-2">Error loading agents</p>
        <p className="text-sm text-[#888]">{error}</p>
      </div>
    );
  }

  if (!agents.length) {
    return (
      <div className="text-center py-12">
        <p className="text-[#888]">no agents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 mb-6">
        <div>
          <p className="text-sm text-[#888]">
            Found {agents.length} agent{agents.length === 1 ? '' : 's'}
          </p>
          {source && (
            <p className="text-xs text-[#666] mt-1">
              Source: <span className="text-orange-400">{source}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {agents.map((agent, idx) => {
          const trustScore = agent.trustScore ?? agent.trust_score ?? 0;
          const agentId = agent.id || `agent-${idx}`;
          const isVerified = agent.verified || false;
          const agentCategory = agent.category || 'General';
          const avatar = agent.avatar || agent.avatar_url;

          return (
            <div
              key={agentId}
              className="group relative p-4 rounded-xl border border-[#222] hover:border-[#333] transition-all duration-300 hover:bg-[#111]/50"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={agent.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(agent.name)}`;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-orange-500/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-orange-400" />
                    </div>
                  )}
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0a0a0a] border border-[#222]">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
                      {agent.name}
                    </h3>
                    {isVerified && (
                      <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {agentCategory}
                    </span>
                    {agent.platform && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {agent.platform}
                      </span>
                    )}
                  </div>

                  {agent.description && (
                    <p className="text-sm text-[#aaa] mb-3 line-clamp-2">
                      {agent.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Trust Score */}
                    {trustScore > 0 && (
                      <div
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
                          getTrustBgColor(trustScore)
                        )}
                      >
                        <Star className={cn('w-4 h-4', getTrustColor(trustScore))} />
                        <div className="flex flex-col">
                          <span className={cn('text-sm font-semibold', getTrustColor(trustScore))}>
                            {trustScore.toFixed(1)}
                          </span>
                          <span className="text-xs text-[#666]">{getTrustLabel(trustScore)}</span>
                        </div>
                      </div>
                    )}

                    {/* Verification Status */}
                    {isVerified && (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  {agent.createdAt || agent.created_at ? (
                    <div className="text-xs text-[#666]">
                      <p>{formatDate(agent.createdAt || agent.created_at)}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MoltDNSAgentsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, idx) => (
        <div key={idx} className="p-4 rounded-xl border border-[#222] animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#222]" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-[#222] rounded mb-2" />
              <div className="h-3 w-full bg-[#222] rounded mb-2" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-[#222] rounded" />
                <div className="h-6 w-20 bg-[#222] rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
