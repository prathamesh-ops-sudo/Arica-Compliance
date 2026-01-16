import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  FileText, Download, Eye, Calendar, Clock, ChevronRight, 
  Loader2, BarChart3, TrendingUp 
} from "lucide-react";
import { useForm } from "react-hook-form";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
import { Doughnut, Line } from 'react-chartjs-2';
import { AppLayout } from "@/components/AppLayout";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { SentimentBadge } from "@/components/SentimentBadge";
import { reportsApi, analyticsApi, mentionsApi, keywordsApi } from "@/lib/api";

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

interface ReportFormData {
  reportName: string;
  period: string;
  keywords: string;
}

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

interface AnalyticsSummary {
  totalMentions: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  totalReach: number;
  avgEngagement: number;
}

interface ReportHistory {
  id: string;
  name: string;
  date: string;
  format: string;
  status: string;
  size: string;
}

interface Keyword {
  id: string;
  keyword: string;
  isActive: boolean;
}

const sections = [
  'Executive Summary',
  'Sentiment Analysis', 
  'Top Mentions',
  'Source Breakdown',
  'Trend Charts',
];

const chartColors = {
  primary: '#0056D2',
  positive: '#28A745',
  negative: '#DC3545',
  neutral: '#FFC107',
};

export default function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>(sections);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [reportData, setReportData] = useState<{
    summary: AnalyticsSummary;
    mentions: Mention[];
    mentionsOverTime: Array<{ date: string; count: number }>;
  } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch user's keywords
  const { data: keywordsData } = useQuery<{ keywords: Keyword[] }>({
    queryKey: ['keywords'],
    queryFn: () => keywordsApi.getAll(),
  });

  // Fetch report history
  const { data: reportHistoryData } = useQuery<{ reports: ReportHistory[] }>({
    queryKey: ['reportHistory'],
    queryFn: () => reportsApi.getHistory(),
  });

  const userKeywords = keywordsData?.keywords?.map(k => k.keyword) || [];
  const reportHistory = reportHistoryData?.reports || [];

  const { register, watch, formState: { errors } } = useForm<ReportFormData>({
    defaultValues: {
      reportName: 'Weekly Brand Report',
      period: '7d',
      keywords: '',
    }
  });

  const reportName = watch('reportName');
  const period = watch('period');

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Fetch real data for the report
      const [analyticsResponse, mentionsResponse] = await Promise.all([
        analyticsApi.getOverview({ range: period, keywords: selectedKeywords.join(',') }),
        mentionsApi.getAll({ pageSize: 10, sentiment: undefined }),
      ]);

      setReportData({
        summary: analyticsResponse.summary || {
          totalMentions: 0,
          positivePercentage: 0,
          negativePercentage: 0,
          neutralPercentage: 0,
          totalReach: 0,
          avgEngagement: 0,
        },
        mentions: mentionsResponse.mentions || [],
        mentionsOverTime: analyticsResponse.mentionsOverTime || [],
      });

      setShowPreview(true);
      toast.success("Report generated successfully!");
    } catch (error) {
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSectionToggle = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const getPeriodDates = () => {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case '7d': start.setDate(end.getDate() - 7); break;
      case '30d': start.setDate(end.getDate() - 30); break;
      case '90d': start.setDate(end.getDate() - 90); break;
      default: start.setDate(end.getDate() - 7);
    }
    return {
      start: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      end: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  const exportToPDF = async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    toast.info("Generating PDF report...");

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header
      pdf.setFillColor(0, 86, 210);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text('AricaInsights', margin, 16);
      pdf.setFontSize(10);
      pdf.text('Media Intelligence Report', pageWidth - margin - 50, 16);

      // Report metadata
      let yPosition = 35;
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text(reportName || 'Weekly Brand Report', margin, yPosition);
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      const dates = getPeriodDates();
      pdf.text(`Report Period: ${dates.start} - ${dates.end}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      })}`, margin, yPosition);
      yPosition += 15;

      // Add the preview image
      let heightLeft = imgHeight;
      let position = yPosition;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position - margin);

      // Multi-page support
      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);

        // Add footer to each page
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          `Page ${pdf.getNumberOfPages()}`, 
          pageWidth / 2, 
          pageHeight - 10, 
          { align: 'center' }
        );
      }

      // Add footer to first page
      pdf.setPage(1);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        'Page 1 | Confidential - AricaInsights', 
        pageWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );

      const fileName = `AricaInsights_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

    const exportToCSV = () => {
      if (!reportData) {
        toast.error("Please generate a report first");
        return;
      }

      const summary = reportData.summary;
      const mentions = reportData.mentions;

      const csvData = [
        ['AricaInsights Report'],
        ['Generated:', new Date().toLocaleDateString()],
        [''],
        ['Summary Statistics'],
        ['Metric', 'Value'],
        ['Total Mentions', summary.totalMentions.toString()],
        ['Positive Sentiment', `${summary.positivePercentage}%`],
        ['Negative Sentiment', `${summary.negativePercentage}%`],
        ['Neutral Sentiment', `${summary.neutralPercentage}%`],
        ['Total Reach', summary.totalReach.toLocaleString()],
        [''],
        ['Top Mentions'],
        ['Title', 'Source', 'Sentiment', 'Reach', 'Date'],
        ...mentions.slice(0, 10).map(m => [
          m.title,
          m.source,
          m.sentiment,
          m.reach.toString(),
          new Date(m.date).toLocaleDateString(),
        ]),
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `AricaInsights_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success("CSV exported successfully!");
    };

    // Chart data for preview - uses real data from reportData
    const summary = reportData?.summary || {
      totalMentions: 0,
      positivePercentage: 0,
      negativePercentage: 0,
      neutralPercentage: 0,
      totalReach: 0,
      avgEngagement: 0,
    };

    const sentimentDoughnutData = {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [{
        data: [summary.positivePercentage, summary.negativePercentage, summary.neutralPercentage],
        backgroundColor: [chartColors.positive, chartColors.negative, chartColors.neutral],
        borderWidth: 0,
        cutout: '65%',
      }],
    };

    const mentionsOverTime = reportData?.mentionsOverTime || [];
    const mentionsLineData = {
      labels: mentionsOverTime.length > 0 
        ? mentionsOverTime.slice(0, 7).map(d => d.date) 
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Mentions',
        data: mentionsOverTime.length > 0 
          ? mentionsOverTime.slice(0, 7).map(d => d.count) 
          : [0, 0, 0, 0, 0, 0, 0],
        borderColor: chartColors.primary,
        backgroundColor: 'rgba(0, 86, 210, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      }],
    };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  return (
    <AppLayout>
      <PageTransition>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-foreground">Reports</h1>
              <p className="text-muted-foreground mt-1">
                Generate executive-level reports with insights and visualizations
              </p>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Report Configuration */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Configure Report
                    </CardTitle>
                    <CardDescription>
                      Set parameters for your custom report
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="reportName">Report Name</Label>
                      <Input
                        data-testid="report-name-input"
                        id="reportName"
                        placeholder="e.g., Weekly Brand Analysis"
                        {...register('reportName', { required: 'Report name is required' })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period">Time Period</Label>
                      <Select defaultValue="7d" {...register('period')}>
                        <SelectTrigger id="period">
                          <Calendar className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Last 7 days</SelectItem>
                          <SelectItem value="30d">Last 30 days</SelectItem>
                          <SelectItem value="90d">Last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                                        <div className="space-y-3">
                                          <Label>Keywords</Label>
                                          <div className="flex flex-wrap gap-2">
                                            {userKeywords.length > 0 ? (
                                              userKeywords.slice(0, 8).map((keyword) => (
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

                    <div className="space-y-3">
                      <Label>Include Sections</Label>
                      <div className="space-y-2">
                        {sections.map((section) => (
                          <div key={section} className="flex items-center gap-2">
                            <Checkbox 
                              id={section} 
                              checked={selectedSections.includes(section)}
                              onCheckedChange={() => handleSectionToggle(section)}
                            />
                            <Label htmlFor={section} className="text-sm font-normal cursor-pointer">
                              {section}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      data-testid="generate-report"
                      className="w-full gradient-primary text-white"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          Generate Report
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                                {/* Report History */}
                                <Card className="mt-6">
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                      <Clock className="w-5 h-5 text-primary" />
                                      Recent Reports
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-3">
                                      {reportHistory.length > 0 ? (
                                        reportHistory.map((report, index) => (
                                          <motion.div
                                            key={report.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="p-2 rounded-lg bg-background">
                                                <FileText className="w-4 h-4 text-primary" />
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">{report.name}</p>
                                                <p className="text-xs text-muted-foreground">{report.date} • {report.size}</p>
                                              </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Download className="w-4 h-4" />
                                            </Button>
                                          </motion.div>
                                        ))
                                      ) : (
                                        <div className="text-center py-6 text-muted-foreground">
                                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                          <p className="text-sm">No reports generated yet</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
              </motion.div>

              {/* Preview Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="xl:col-span-2"
              >
                <Card className={showPreview ? 'border-primary/30' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        Report Preview
                      </CardTitle>
                      {showPreview && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            className="gradient-primary text-white" 
                            onClick={exportToPDF}
                            disabled={isExporting}
                          >
                            {isExporting ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Export PDF
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={exportToCSV}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            CSV
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showPreview ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        ref={previewRef}
                        className="space-y-6 p-6 bg-background rounded-lg border border-border"
                      >
                        {/* Report Header */}
                        <div className="border-b border-border pb-4">
                          <h2 className="text-2xl font-bold text-foreground">{reportName || 'Weekly Brand Report'}</h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {getPeriodDates().start} – {getPeriodDates().end}
                          </p>
                        </div>

                                                {/* Summary Stats */}
                                                {selectedSections.includes('Executive Summary') && (
                                                  <div className="grid grid-cols-4 gap-4">
                                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                      <p className="text-xs text-muted-foreground mb-1">Total Mentions</p>
                                                      <p className="text-2xl font-bold text-primary">{summary.totalMentions.toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-positive/5 border border-positive/10">
                                                      <p className="text-xs text-muted-foreground mb-1">Positive Sentiment</p>
                                                      <p className="text-2xl font-bold text-positive">{summary.positivePercentage}%</p>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-muted border border-border">
                                                      <p className="text-xs text-muted-foreground mb-1">Total Reach</p>
                                                      <p className="text-2xl font-bold text-foreground">{summary.totalReach > 1000000 ? `${(summary.totalReach / 1000000).toFixed(1)}M` : summary.totalReach.toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-muted border border-border">
                                                      <p className="text-xs text-muted-foreground mb-1">Avg Engagement</p>
                                                      <p className="text-lg font-bold text-foreground">{summary.avgEngagement}%</p>
                                                    </div>
                                                  </div>
                                                )}

                        {/* Charts Row */}
                        {selectedSections.includes('Sentiment Analysis') && (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-muted/30 border border-border">
                              <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold text-sm">Sentiment Distribution</h3>
                              </div>
                              <div className="h-[180px]">
                                <Doughnut data={sentimentDoughnutData} options={{
                                  ...miniChartOptions,
                                  plugins: {
                                    legend: {
                                      display: true,
                                      position: 'bottom',
                                      labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                                    }
                                  }
                                }} />
                              </div>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/30 border border-border">
                              <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold text-sm">Mention Trends</h3>
                              </div>
                              <div className="h-[180px]">
                                <Line data={mentionsLineData} options={miniChartOptions} />
                              </div>
                            </div>
                          </div>
                        )}

                                                {/* Top Mentions Table */}
                                                {selectedSections.includes('Top Mentions') && (
                                                  <div>
                                                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                                      <FileText className="w-4 h-4 text-primary" />
                                                      Top 10 Mentions
                                                    </h3>
                                                    <div className="rounded-lg border border-border overflow-hidden">
                                                      <Table>
                                                        <TableHeader>
                                                          <TableRow className="bg-muted/50">
                                                            <TableHead className="text-xs font-semibold">Title</TableHead>
                                                            <TableHead className="text-xs font-semibold">Source</TableHead>
                                                            <TableHead className="text-xs font-semibold">Sentiment</TableHead>
                                                            <TableHead className="text-xs font-semibold text-right">Reach</TableHead>
                                                            <TableHead className="text-xs font-semibold">Date</TableHead>
                                                          </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                          {reportData?.mentions && reportData.mentions.length > 0 ? (
                                                            reportData.mentions.slice(0, 10).map((mention) => (
                                                              <TableRow key={mention.id} className="hover:bg-muted/30">
                                                                <TableCell className="text-sm font-medium max-w-[200px] truncate">
                                                                  {mention.title}
                                                                </TableCell>
                                                                <TableCell>
                                                                  <Badge variant="outline" className="text-xs capitalize">
                                                                    {mention.source}
                                                                  </Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                  <SentimentBadge sentiment={mention.sentiment} />
                                                                </TableCell>
                                                                <TableCell className="text-sm text-right">
                                                                  {mention.reach.toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground">
                                                                  {new Date(mention.date).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                  })}
                                                                </TableCell>
                                                              </TableRow>
                                                            ))
                                                          ) : (
                                                            <TableRow>
                                                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                                No mentions data available
                                                              </TableCell>
                                                            </TableRow>
                                                          )}
                                                        </TableBody>
                                                      </Table>
                                                    </div>
                                                  </div>
                                                )}

                        {/* Keywords */}
                        <div className="pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Keywords tracked:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedKeywords.map(keyword => (
                              <Badge key={keyword} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="py-20 text-center text-muted-foreground">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium mb-2">No preview available</p>
                        <p className="text-sm">Configure your report settings and click "Generate Report"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppLayout>
  );
}
