import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, Download, Filter, Loader2, TrendingUp, 
  MessageSquare, Target, BarChart3, RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { analyticsApi, keywordsApi } from "@/lib/api";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartColors = {
  primary: '#0056D2',
  positive: '#28A745',
  negative: '#DC3545',
  neutral: '#FFC107',
  purple: '#8B5CF6',
};

const sources = ['Twitter', 'News', 'LinkedIn', 'Reddit', 'Blogs'];

// Types for API responses
interface AnalyticsOverview {
  summary: {
    totalMentions: number;
    positivePercentage: number;
    negativePercentage: number;
    neutralPercentage: number;
    totalReach: number;
    avgEngagement: number;
  };
  sentimentOverTime: Array<{ date: string; positive: number; negative: number; neutral: number }>;
  mentionsOverTime: Array<{ date: string; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  topSources: Array<{ source: string; count: number }>;
}

interface Keyword {
  id: string;
  keyword: string;
  isActive: boolean;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState("7d");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(sources);

  // Fetch analytics data from API
  const { 
    data: analyticsData, 
    isLoading, 
    error: analyticsError,
    refetch: refetchAnalytics 
  } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics', dateRange, selectedKeywords],
    queryFn: async () => {
      const params: Record<string, string> = { range: dateRange };
      if (selectedKeywords.length > 0) {
        params.keywords = selectedKeywords.join(',');
      }
      return analyticsApi.getOverview(params);
    },
  });

  // Fetch user's keywords
  const { data: keywordsData } = useQuery<{ keywords: Keyword[] }>({
    queryKey: ['keywords'],
    queryFn: () => keywordsApi.getAll(),
  });

  const userKeywords = keywordsData?.keywords?.map(k => k.keyword) || [];

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    toast.info("Refreshing analytics...");
    await refetchAnalytics();
    toast.success("Analytics refreshed!");
  }, [refetchAnalytics]);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  // Extract data from API response with fallbacks
  const summary = analyticsData?.summary || {
    totalMentions: 0,
    positivePercentage: 0,
    negativePercentage: 0,
    neutralPercentage: 0,
    totalReach: 0,
    avgEngagement: 0,
  };

  const sentimentOverTime = analyticsData?.sentimentOverTime || [];
  const mentionsOverTime = analyticsData?.mentionsOverTime || [];
  const topTopics = analyticsData?.topTopics || [];

  // Sentiment Doughnut Chart Data
  const sentimentDoughnutData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [summary.positivePercentage, summary.negativePercentage, summary.neutralPercentage],
      backgroundColor: [chartColors.positive, chartColors.negative, chartColors.neutral],
      borderColor: 'transparent',
      borderWidth: 0,
      cutout: '70%',
    }],
  };

  // Mentions Over Time Line Chart with Area Fill
  const mentionsLineData = {
    labels: mentionsOverTime.length > 0 
      ? mentionsOverTime.map(d => d.date) 
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Mentions',
      data: mentionsOverTime.length > 0 
        ? mentionsOverTime.map(d => d.count) 
        : [0, 0, 0, 0, 0, 0, 0],
      borderColor: chartColors.primary,
      backgroundColor: 'rgba(0, 86, 210, 0.15)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: chartColors.primary,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  // Top Topics Horizontal Bar Chart
  const topicsBarData = {
    labels: topTopics.length > 0 
      ? topTopics.slice(0, 5).map(d => d.topic) 
      : ['No data'],
    datasets: [{
      label: 'Mentions',
      data: topTopics.length > 0 
        ? topTopics.slice(0, 5).map(d => d.count) 
        : [0],
      backgroundColor: [
        chartColors.primary,
        chartColors.positive,
        chartColors.purple,
        chartColors.neutral,
        chartColors.negative,
      ],
      borderRadius: 8,
      barThickness: 24,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#fff',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };

  const doughnutOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: 'Inter' },
        },
      },
    },
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter' } },
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 11, family: 'Inter' } },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { size: 11, family: 'Inter' } },
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 12, family: 'Inter' } },
      },
    },
  };

  // Get top topic from API data
  const topTopic = topTopics.length > 0 ? topTopics[0] : null;

  const heroCards = [
    {
      title: 'Total Mentions',
      value: summary.totalMentions.toLocaleString(),
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: summary.totalMentions > 0 ? 'Live data' : 'No data',
      trendUp: summary.totalMentions > 0,
    },
    {
      title: 'Sentiment Score',
      value: `${summary.positivePercentage}%`,
      icon: TrendingUp,
      color: 'text-positive',
      bgColor: 'bg-positive/10',
      trend: summary.positivePercentage > 50 ? 'Positive' : 'Needs attention',
      trendUp: summary.positivePercentage > 50,
      isGauge: true,
      gaugeValue: summary.positivePercentage,
    },
    {
      title: 'Top Topic',
      value: topTopic?.topic || 'No data',
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      subtitle: topTopic ? `${topTopic.count} mentions` : 'Add keywords to track',
    },
  ];

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                <p className="text-muted-foreground mt-1">
                  Executive-level insights into your media presence
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  data-testid="refresh-button"
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  aria-label="Refresh analytics data"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger data-testid="date-range-select" className="w-[140px]" aria-label="Select date range">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="gradient-primary text-white"
                  onClick={() => {
                    toast.success("Analytics data exported successfully!");
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </motion.div>

            {/* Hero Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {heroCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  data-testid="stat-card"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Card className="relative overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">{card.value}</span>
                            {card.trend && (
                              <Badge variant="secondary" className={card.trendUp ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10'}>
                                {card.trend}
                              </Badge>
                            )}
                          </div>
                          {card.subtitle && (
                            <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                          )}
                        </div>
                        <div className={`p-3 rounded-xl ${card.bgColor}`}>
                          <card.icon className={`w-6 h-6 ${card.color}`} />
                        </div>
                      </div>
                                            {card.isGauge && (
                                              <div className="mt-4">
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                  <motion.div 
                                                    className="h-full bg-gradient-to-r from-negative via-neutral to-positive"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${card.gaugeValue || 0}%` }}
                                                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                                                  />
                                                </div>
                                              </div>
                                            )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Filters Sidebar + Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filters Sidebar */}
              <motion.div
                data-testid="filter-sidebar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="sticky top-24">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Date Range */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Date Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                          <input 
                            type="date" 
                            id="start-date"
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
                            defaultValue="2024-01-08"
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                          <input 
                            type="date" 
                            id="end-date"
                            className="w-full mt-1 px-3 py-2 text-sm rounded-md border border-input bg-background"
                            defaultValue="2024-01-15"
                          />
                        </div>
                      </div>
                    </div>

                                        {/* Keywords Multi-select */}
                                        <div className="space-y-3">
                                          <Label className="text-sm font-semibold">Keywords</Label>
                                          <div className="flex flex-wrap gap-2">
                                            {userKeywords.length > 0 ? (
                                              userKeywords.slice(0, 6).map((keyword) => (
                                                <Badge
                                                  key={keyword}
                                                  variant={selectedKeywords.includes(keyword) ? "default" : "outline"}
                                                  className={`cursor-pointer transition-all ${
                                                    selectedKeywords.includes(keyword) 
                                                      ? 'bg-primary text-primary-foreground' 
                                                      : 'hover:bg-primary/10'
                                                  }`}
                                                  onClick={() => toggleKeyword(keyword)}
                                                >
                                                  {keyword}
                                                </Badge>
                                              ))
                                            ) : (
                                              <p className="text-sm text-muted-foreground">No keywords configured. Add keywords in Settings.</p>
                                            )}
                                          </div>
                                        </div>

                    {/* Source Checkboxes */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Sources</Label>
                      <div className="space-y-2">
                        {sources.map((source) => (
                          <div key={source} className="flex items-center gap-2">
                            <Checkbox 
                              id={source} 
                              checked={selectedSources.includes(source)}
                              onCheckedChange={() => toggleSource(source)}
                            />
                            <Label htmlFor={source} className="text-sm font-normal cursor-pointer">
                              {source}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                                        <Button 
                                          className="w-full gradient-primary text-white"
                                          onClick={async () => {
                                            toast.info("Applying filters...");
                                            await refetchAnalytics();
                                            toast.success("Filters applied successfully!");
                                          }}
                                          disabled={isLoading}
                                        >
                                          {isLoading ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              Loading...
                                            </>
                                          ) : (
                                            'Apply Filters'
                                          )}
                                        </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Charts Grid */}
              <div className="lg:col-span-3 space-y-6">
                <AnimatePresence>
                  {isLoading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-96"
                    >
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading analytics...</p>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Top Row - Doughnut + Topics Bar */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          <Card className="h-full">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" />
                                Sentiment Distribution
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[280px] flex items-center justify-center">
                                <Doughnut data={sentimentDoughnutData} options={doughnutOptions} />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          <Card className="h-full">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                Top 5 Topics
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[280px]">
                                <Bar data={topicsBarData} options={barOptions} />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Mentions Over Time - Full Width */}
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Mention Volume Over Time
                              </CardTitle>
                              <Badge variant="secondary" className="text-positive bg-positive/10">
                                +23% vs last period
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[320px]">
                              <Line data={mentionsLineData} options={lineOptions} />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
