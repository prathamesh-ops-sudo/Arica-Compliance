import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, Users, MessageCircle, Target, Loader2, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { ParallaxHero } from "@/components/ParallaxHero";
import { StatCounter } from "@/components/StatCounter";
import { MentionCard } from "@/components/MentionCard";
import { MentionCardSkeleton } from "@/components/MentionCardSkeleton";
import { SentimentBadge } from "@/components/SentimentBadge";
import { KeywordManager } from "@/components/KeywordManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { mentionsApi, analyticsApi } from "@/lib/api";

// Types for API responses
interface Mention {
  id: string;
  title: string;
  content: string;
  source: string;
  author: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  reach: number;
  engagement: number;
  date: string;
  url: string;
  keywords: string[];
}

interface DashboardStats {
  totalMentions: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  totalReach: number;
  avgEngagement: number;
}

type Sentiment = 'positive' | 'negative' | 'neutral';

// Memoized MentionCard for performance
const MemoizedMentionCard = memo(MentionCard);

type FilterType = 'all' | Sentiment;

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { dashboardLayout } = useSettings();

  // Fetch mentions from API
  const { 
    data: mentionsData, 
    isLoading: mentionsLoading, 
    error: mentionsError,
    refetch: refetchMentions 
  } = useQuery({
    queryKey: ['mentions', page, activeFilter, searchQuery],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        pageSize: 10,
      };
      if (activeFilter !== 'all') {
        params.sentiment = activeFilter;
      }
      if (searchQuery) {
        params.keyword = searchQuery;
      }
      return mentionsApi.getAll(params);
    },
  });

  // Fetch stats from API
  const { 
    data: statsData, 
    isLoading: statsLoading,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['mentionStats'],
    queryFn: () => mentionsApi.getStats(),
  });

  // Fetch analytics overview for additional stats
  const { data: analyticsData } = useQuery({
    queryKey: ['analyticsOverview'],
    queryFn: () => analyticsApi.getOverview({ range: '7d' }),
  });

  // Layout-specific classes
  const getLayoutClasses = () => {
    switch (dashboardLayout) {
      case 'compact':
        return {
          statsGrid: 'grid-cols-2 sm:grid-cols-4 gap-2',
          mentionsGrid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
          sectionPadding: 'px-4 py-6',
          cardSize: 'compact',
        };
      case 'expanded':
        return {
          statsGrid: 'grid-cols-1 sm:grid-cols-2 gap-6',
          mentionsGrid: 'grid-cols-1 gap-6',
          sectionPadding: 'px-8 py-16',
          cardSize: 'expanded',
        };
      default:
        return {
          statsGrid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
          mentionsGrid: 'grid-cols-1 md:grid-cols-2 gap-4',
          sectionPadding: 'px-6 py-12',
          cardSize: 'default',
        };
    }
  };

    const layoutClasses = getLayoutClasses();

    // Transform API mentions to component format
    const mentions: Mention[] = mentionsData?.mentions || [];
    const totalMentions = mentionsData?.total || 0;
    const hasMore = mentions.length < totalMentions;

    // Get stats with fallbacks
    const stats: DashboardStats = {
      totalMentions: statsData?.total || analyticsData?.summary?.totalMentions || 0,
      positivePercentage: statsData?.sentimentBreakdown?.positive || analyticsData?.summary?.positivePercentage || 0,
      negativePercentage: statsData?.sentimentBreakdown?.negative || analyticsData?.summary?.negativePercentage || 0,
      neutralPercentage: statsData?.sentimentBreakdown?.neutral || analyticsData?.summary?.neutralPercentage || 0,
      totalReach: analyticsData?.summary?.totalReach || 0,
      avgEngagement: analyticsData?.summary?.avgEngagement || 0,
    };

    const loadMore = useCallback(() => {
      if (!hasMore || mentionsLoading) return;
      setPage((prev) => prev + 1);
    }, [hasMore, mentionsLoading]);

    // Infinite scroll observer
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !mentionsLoading) {
            loadMore();
          }
        },
        { threshold: 0.1 }
      );

      if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current);
      }

      return () => observer.disconnect();
    }, [loadMore, hasMore, mentionsLoading]);

    // Reset page when filter changes
    useEffect(() => {
      setPage(1);
    }, [activeFilter, searchQuery]);

    const handleRefresh = async () => {
      toast.info("Refreshing data...");
      await Promise.all([refetchMentions(), refetchStats()]);
      toast.success("Data refreshed!");
    };

    const isInitialLoading = mentionsLoading && page === 1;

  return (
    <AppLayout>
      <PageTransition>
        {/* Hero Section */}
        <ParallaxHero
          title="AricaInsights"
          subtitle="Media Intelligence Platform — Track, analyze, and understand your brand mentions across the web in real-time"
        >
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <Input
                  data-testid="hero-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mentions..."
                  className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                  aria-label="Search mentions"
                />
            </div>
            <Button 
              className="h-12 px-6 bg-white text-primary hover:bg-white/90 font-semibold"
              onClick={() => {
                if (searchQuery.trim()) {
                  toast.success(`Searching for "${searchQuery}"...`);
                } else {
                  toast.info("Enter a search term to find mentions");
                }
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </ParallaxHero>

                {/* Stats Section */}
                <section className={cn(layoutClasses.sectionPadding, "-mt-8 relative z-10")} aria-label="Statistics">
                  <div className="max-w-7xl mx-auto">
                    <div className={cn("grid", layoutClasses.statsGrid)}>
                      {statsLoading ? (
                        <>
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                          ))}
                        </>
                      ) : (
                        <>
                          <StatCounter
                            data-testid="stat-mentions"
                            value={stats.totalMentions}
                            label="Total Mentions"
                            icon={<MessageCircle className={dashboardLayout === 'compact' ? "w-5 h-5" : "w-6 h-6"} />}
                            trend="up"
                            trendValue={stats.totalMentions > 0 ? "Live data" : "No data yet"}
                            delay={0}
                            compact={dashboardLayout === 'compact'}
                          />
                          <StatCounter
                            data-testid="stat-reach"
                            value={stats.totalReach}
                            label="Total Reach"
                            icon={<Users className={dashboardLayout === 'compact' ? "w-5 h-5" : "w-6 h-6"} />}
                            trend="up"
                            trendValue={stats.totalReach > 0 ? "Estimated" : "No data yet"}
                            delay={0.1}
                            compact={dashboardLayout === 'compact'}
                          />
                          <StatCounter
                            data-testid="stat-sentiment"
                            value={stats.positivePercentage}
                            label="Positive Sentiment"
                            suffix="%"
                            icon={<TrendingUp className={dashboardLayout === 'compact' ? "w-5 h-5" : "w-6 h-6"} />}
                            trend={stats.positivePercentage > 50 ? "up" : "neutral"}
                            trendValue={stats.positivePercentage > 0 ? "AI analyzed" : "No data yet"}
                            delay={0.2}
                            compact={dashboardLayout === 'compact'}
                          />
                          <StatCounter
                            data-testid="stat-engagement"
                            value={stats.avgEngagement}
                            label="Avg. Engagement Rate"
                            suffix="%"
                            icon={<Target className={dashboardLayout === 'compact' ? "w-5 h-5" : "w-6 h-6"} />}
                            trend="neutral"
                            trendValue={stats.avgEngagement > 0 ? "Calculated" : "No data yet"}
                            delay={0.3}
                            compact={dashboardLayout === 'compact'}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </section>

        {/* Keyword Manager */}
        <section className={cn(dashboardLayout === 'compact' ? "px-4 pb-4" : dashboardLayout === 'expanded' ? "px-8 pb-12" : "px-6 pb-8")} aria-label="Keyword management">
          <div className="max-w-7xl mx-auto">
            <KeywordManager compact={dashboardLayout === 'compact'} />
          </div>
        </section>

        {/* Mentions Feed */}
        <section className={cn(dashboardLayout === 'compact' ? "px-4 pb-6" : dashboardLayout === 'expanded' ? "px-8 pb-16" : "px-6 pb-12")} aria-label="Mention feed">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
            >
                            <div className="flex items-center gap-3">
                              <h2 className="text-xl font-semibold text-foreground">Recent Mentions</h2>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={mentionsLoading}
                              >
                                <RefreshCw className={cn("w-4 h-4", mentionsLoading && "animate-spin")} />
                              </Button>
                            </div>
              
                            {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by sentiment">
                {(['all', 'positive', 'negative', 'neutral'] as FilterType[]).map(
                  (filter) => (
                    <Button
                      key={filter}
                      data-testid={`sentiment-filter-${filter}`}
                      variant={activeFilter === filter ? "default" : "outline"}
                      size="sm"
                                            onClick={() => {
                                              setActiveFilter(filter);
                                              setPage(1);
                                            }}
                      className="capitalize"
                      aria-pressed={activeFilter === filter}
                    >
                      {filter === 'all' ? (
                        'All'
                      ) : (
                        <SentimentBadge sentiment={filter} size="sm" />
                      )}
                    </Button>
                  )
                )}
              </div>
            </motion.div>

                        {/* Error State */}
                        {mentionsError && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 bg-destructive/10 rounded-lg border border-destructive/20"
                          >
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-destructive/50" />
                            <p className="text-destructive font-medium mb-2">Failed to load mentions</p>
                            <p className="text-muted-foreground text-sm mb-4">Please check your connection and try again</p>
                            <Button variant="outline" onClick={() => refetchMentions()}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Retry
                            </Button>
                          </motion.div>
                        )}

                        {/* Mentions Grid */}
                        {!mentionsError && (
                          <div className={cn("grid", layoutClasses.mentionsGrid)} role="feed" aria-label="Mentions" data-testid="mention-feed">
                            {isInitialLoading ? (
                              // Loading skeletons
                              <>
                                {[...Array(dashboardLayout === 'compact' ? 6 : 4)].map((_, i) => (
                                  <MentionCardSkeleton key={i} compact={dashboardLayout === 'compact'} />
                                ))}
                              </>
                            ) : mentions.length > 0 ? (
                              mentions.map((mention, index) => (
                                <MemoizedMentionCard 
                                  key={mention.id} 
                                  mention={mention} 
                                  index={index} 
                                  compact={dashboardLayout === 'compact'}
                                  expanded={dashboardLayout === 'expanded'}
                                />
                              ))
                            ) : null}
                          </div>
                        )}

                        {/* Infinite Scroll Trigger */}
                        {hasMore && !isInitialLoading && !mentionsError && (
                          <div ref={loadMoreRef} className="flex justify-center mt-8 py-4" data-testid="load-more-section">
                            {mentionsLoading ? (
                              <div className="flex items-center gap-2 text-muted-foreground" data-testid="loading-spinner">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading more mentions...</span>
                              </div>
                            ) : (
                              <Button
                                data-testid="load-more"
                                variant="outline"
                                size="lg"
                                onClick={loadMore}
                                className="group hover:border-primary/50 transition-colors"
                              >
                                Load More Mentions
                                <motion.span
                                  animate={{ y: [0, 3, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="ml-2"
                                >
                                  ↓
                                </motion.span>
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Empty State */}
                        {!isInitialLoading && !mentionsError && mentions.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                          >
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-muted-foreground font-medium mb-2">
                              No mentions found
                            </p>
                            <p className="text-muted-foreground/70 text-sm">
                              {searchQuery 
                                ? `No results for "${searchQuery}". Try a different search term.`
                                : "Add keywords above to start tracking mentions across the web."
                              }
                            </p>
                          </motion.div>
                        )}
          </div>
        </section>
      </PageTransition>
    </AppLayout>
  );
}
