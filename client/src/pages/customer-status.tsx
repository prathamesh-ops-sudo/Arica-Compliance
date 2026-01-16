import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Shield,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { Header } from "@/components/header";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { ScoreGauge } from "@/components/score-gauge";
import type { AuditStatusResponse, AuditStatusType } from "@shared/schema";

export default function CustomerStatus() {
  const [auditId, setAuditId] = useState("");
  const [searchedId, setSearchedId] = useState("");

  const { data: auditStatus, isLoading, isError, error } = useQuery<AuditStatusResponse>({
    queryKey: [`/api/audit/status/${searchedId}`],
    enabled: !!searchedId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (auditId.trim()) {
      setSearchedId(auditId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 glow-primary mx-auto mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Check Your Audit Status
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Enter your unique Audit ID to view the status of your compliance assessment
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto mb-12"
        >
          <form onSubmit={handleSearch}>
            <GlassCard className="p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter your Audit ID (e.g., ABC12345)"
                    value={auditId}
                    onChange={(e) => setAuditId(e.target.value.toUpperCase())}
                    className="pl-11 h-12 text-lg font-mono bg-background/50"
                    data-testid="input-audit-id"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!auditId.trim() || isLoading}
                  data-testid="button-check-status"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Check Status"
                  )}
                </Button>
              </div>
            </GlassCard>
          </form>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading && searchedId && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <GlassCard className="text-center py-16">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                <p className="text-lg text-foreground">Looking up your audit...</p>
              </GlassCard>
            </motion.div>
          )}

          {isError && searchedId && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <GlassCard className="text-center py-16" glow="destructive">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Audit Not Found
                </h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't find an audit with ID: <span className="font-mono font-bold text-foreground">{searchedId}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your Audit ID and try again. Contact support if you need assistance.
                </p>
              </GlassCard>
            </motion.div>
          )}

          {auditStatus && !isLoading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto"
            >
              <StatusResultCard status={auditStatus} />
            </motion.div>
          )}
        </AnimatePresence>

        {!searchedId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto mt-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard hover className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/20 mx-auto mb-4">
                  <Lock className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Locked</h3>
                <p className="text-sm text-muted-foreground">
                  Audit data received. Awaiting payment to unlock the full report.
                </p>
              </GlassCard>
              <GlassCard hover className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/20 mx-auto mb-4">
                  <Loader2 className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Processing</h3>
                <p className="text-sm text-muted-foreground">
                  AI is analyzing your compliance data and generating the report.
                </p>
              </GlassCard>
              <GlassCard hover className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/20 mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Ready</h3>
                <p className="text-sm text-muted-foreground">
                  Your compliance report is ready for download.
                </p>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function StatusResultCard({ status }: { status: AuditStatusResponse }) {
  const isLocked = status.status === "LOCKED" || status.status === "CREATED";
  const isProcessing = status.status === "PAID" || status.status === "AI_PROCESSED";
  const isReady = status.status === "REPORT_READY";

  return (
    <GlassCard
      glow={isLocked ? "warning" : isReady ? "success" : "primary"}
      className="overflow-hidden"
    >
      <div className="p-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Audit ID</p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {status.auditId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <StatusBadge status={status.status} size="lg" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Created</p>
            <p className="text-foreground font-medium">
              {new Date(status.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
            <p className="text-foreground font-medium">
              {new Date(status.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">System Data</p>
            <p className={`font-medium ${status.hasSystemData ? "text-green-400" : "text-muted-foreground"}`}>
              {status.hasSystemData ? "Received" : "Pending"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Questionnaire</p>
            <p className={`font-medium ${status.hasQuestionnaire ? "text-green-400" : "text-muted-foreground"}`}>
              {status.hasQuestionnaire ? "Completed" : "Pending"}
            </p>
          </div>
        </div>

        {isLocked && (
          <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/20 shrink-0">
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Report Locked
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your audit data has been received. To view your full compliance report and AI-generated recommendations, please complete the payment.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" size="sm" data-testid="button-contact-email">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Sales
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-contact-phone">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/20 shrink-0">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Processing Your Audit
                </h3>
                <p className="text-muted-foreground">
                  Our AI is analyzing your compliance data and generating a comprehensive report. This typically takes a few minutes. Please check back soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {isReady && (
          <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/20 shrink-0">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Report Ready
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your compliance report is ready! Contact your account manager to receive your detailed PDF report with AI-powered recommendations.
                </p>
                <Button data-testid="button-download-report">
                  <FileText className="w-4 h-4 mr-2" />
                  Request Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-8 py-4 bg-background/30 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at <span className="text-primary">support@aricatoucan.com</span>
          </p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Last checked: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
