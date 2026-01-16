import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/header";
import { StatCard } from "@/components/stat-card";
import { AuditTable } from "@/components/audit-table";
import { AuditDetailModal } from "@/components/audit-detail-modal";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Audit } from "@shared/schema";

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const { toast } = useToast();

  const { data: audits = [], isLoading, refetch } = useQuery<Audit[]>({
    queryKey: ["/api/audit/list"],
    refetchInterval: 5000,
  });

  const unlockMutation = useMutation({
    mutationFn: async (auditId: string) => {
      return apiRequest("POST", "/api/audit/unlock", { auditId });
    },
    onSuccess: () => {
      toast({
        title: "Audit Unlocked",
        description: "The audit has been unlocked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/audit/list"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unlock the audit.",
        variant: "destructive",
      });
    },
  });

  const aiScoreMutation = useMutation({
    mutationFn: async (auditId: string) => {
      return apiRequest("POST", "/api/audit/run-ai-score", { auditId });
    },
    onSuccess: () => {
      toast({
        title: "AI Scoring Complete",
        description: "The compliance score has been calculated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/audit/list"] });
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to run AI scoring.";
      if (message.includes("locked") || message.includes("Locked")) {
        toast({
          title: "Audit Locked",
          description: "Please unlock the audit before running AI scoring.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    },
  });

  const exportPDFMutation = useMutation({
    mutationFn: async (auditId: string) => {
      const response = await fetch(`/api/audit/export/pdf/${auditId}`);
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-report-${auditId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "PDF Exported",
        description: "Your report has been downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export PDF.",
        variant: "destructive",
      });
    },
  });

  const filteredAudits = audits.filter((audit) =>
    audit.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: audits.length,
    locked: audits.filter((a) => a.status === "LOCKED").length,
    ready: audits.filter((a) => a.status === "REPORT_READY").length,
    critical: audits.filter((a) => a.aiScore?.riskLevel === "HIGH" || a.aiScore?.riskLevel === "CRITICAL").length,
  };

  const handleView = (audit: Audit) => {
    setSelectedAudit(audit);
  };

  const handleUnlock = (audit: Audit) => {
    unlockMutation.mutate(audit.id);
  };

  const handleRunAI = (audit: Audit) => {
    aiScoreMutation.mutate(audit.id);
  };

  const handleExportPDF = (audit: Audit) => {
    exportPDFMutation.mutate(audit.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAdmin onLogout={() => {}} />
      
      <main className="container py-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage audits, unlock reports, and monitor compliance status
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Audits"
            value={stats.total}
            icon={FileText}
            glow="primary"
            delay={0}
          />
          <StatCard
            title="Locked Audits"
            value={stats.locked}
            icon={Clock}
            glow="warning"
            delay={0.1}
          />
          <StatCard
            title="Reports Ready"
            value={stats.ready}
            icon={CheckCircle}
            glow="success"
            delay={0.2}
          />
          <StatCard
            title="High Risk"
            value={stats.critical}
            icon={AlertTriangle}
            glow="destructive"
            delay={0.3}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <GlassCard className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Audit ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                  data-testid="input-search-audit"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AuditTable
            audits={filteredAudits}
            onView={handleView}
            onUnlock={handleUnlock}
            onRunAI={handleRunAI}
            onExportPDF={handleExportPDF}
            isLoading={isLoading}
          />
        </motion.div>
      </main>

      <AuditDetailModal
        audit={selectedAudit}
        open={!!selectedAudit}
        onClose={() => setSelectedAudit(null)}
        onUnlock={handleUnlock}
        onRunAI={handleRunAI}
        onExportPDF={handleExportPDF}
      />
    </div>
  );
}
