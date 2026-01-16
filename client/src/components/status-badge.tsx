import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Lock, Loader2, CheckCircle, AlertCircle, Clock, Sparkles } from "lucide-react";
import type { AuditStatusType } from "@shared/schema";

interface StatusBadgeProps {
  status: AuditStatusType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  AuditStatusType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode; className: string }
> = {
  CREATED: {
    label: "Created",
    variant: "secondary",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  LOCKED: {
    label: "Locked",
    variant: "secondary",
    icon: <Lock className="w-3.5 h-3.5" />,
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  PAID: {
    label: "Paid",
    variant: "default",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  AI_PROCESSED: {
    label: "AI Processed",
    variant: "default",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  REPORT_READY: {
    label: "Report Ready",
    variant: "default",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
};

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}

interface RiskBadgeProps {
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  className?: string;
}

const riskConfig = {
  LOW: {
    label: "Low Risk",
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  MEDIUM: {
    label: "Medium Risk",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  HIGH: {
    label: "High Risk",
    className: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  CRITICAL: {
    label: "Critical Risk",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskConfig[level];

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        config.className,
        className
      )}
    >
      <AlertCircle className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
}

interface ReadinessBadgeProps {
  readiness: "READY" | "NEEDS_IMPROVEMENT" | "NOT_READY";
  className?: string;
}

const readinessConfig = {
  READY: {
    label: "Audit Ready",
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  NEEDS_IMPROVEMENT: {
    label: "Needs Improvement",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  NOT_READY: {
    label: "Not Ready",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

export function ReadinessBadge({ readiness, className }: ReadinessBadgeProps) {
  const config = readinessConfig[readiness];

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
