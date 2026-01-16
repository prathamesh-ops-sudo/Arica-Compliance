import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Eye, Unlock, Sparkles, FileDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { GlassCard } from "./glass-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Audit } from "@shared/schema";

interface AuditTableProps {
  audits: Audit[];
  onView: (audit: Audit) => void;
  onUnlock: (audit: Audit) => void;
  onRunAI: (audit: Audit) => void;
  onExportPDF: (audit: Audit) => void;
  isLoading?: boolean;
}

export function AuditTable({
  audits,
  onView,
  onUnlock,
  onRunAI,
  onExportPDF,
  isLoading,
}: AuditTableProps) {
  if (isLoading) {
    return (
      <GlassCard className="overflow-hidden">
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 animate-spin border-2 border-primary border-t-transparent" />
            <span className="text-muted-foreground text-sm">Loading audits...</span>
          </div>
        </div>
      </GlassCard>
    );
  }

  if (audits.length === 0) {
    return (
      <GlassCard className="overflow-hidden">
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            <FileDown className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No audits found</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                Audit ID
              </th>
              <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                Status
              </th>
              <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                Score
              </th>
              <th className="text-left text-sm font-medium text-muted-foreground px-6 py-4">
                Created
              </th>
              <th className="text-right text-sm font-medium text-muted-foreground px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {audits.map((audit, index) => (
              <motion.tr
                key={audit.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/30 last:border-b-0 hover-elevate"
                data-testid={`row-audit-${audit.id}`}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-foreground font-medium">
                      {audit.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {audit.systemData ? "System data received" : "Awaiting data"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={audit.status} size="sm" />
                </td>
                <td className="px-6 py-4">
                  {audit.aiScore ? (
                    <span className="text-2xl font-bold text-primary">
                      {audit.aiScore.complianceScore}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(audit)}
                      data-testid={`button-view-${audit.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-actions-${audit.id}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass">
                        <DropdownMenuItem
                          onClick={() => onView(audit)}
                          data-testid={`action-view-${audit.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {audit.status === "LOCKED" && (
                          <DropdownMenuItem
                            onClick={() => onUnlock(audit)}
                            data-testid={`action-unlock-${audit.id}`}
                          >
                            <Unlock className="mr-2 h-4 w-4" />
                            Unlock Audit
                          </DropdownMenuItem>
                        )}
                        {(audit.status === "PAID" || audit.status === "LOCKED") && (
                          <DropdownMenuItem
                            onClick={() => onRunAI(audit)}
                            data-testid={`action-ai-${audit.id}`}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Run AI Scoring
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {audit.status === "REPORT_READY" && (
                          <DropdownMenuItem
                            onClick={() => onExportPDF(audit)}
                            data-testid={`action-export-${audit.id}`}
                          >
                            <FileDown className="mr-2 h-4 w-4" />
                            Export PDF
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
