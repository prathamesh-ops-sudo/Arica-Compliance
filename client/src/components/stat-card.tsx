import { motion } from "framer-motion";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  glow?: "primary" | "accent" | "success" | "warning" | "destructive";
  className?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  glow,
  className,
  delay = 0,
}: StatCardProps) {
  const iconColorClasses = {
    primary: "text-primary bg-primary/20",
    accent: "text-accent bg-accent/20",
    success: "text-green-500 bg-green-500/20",
    warning: "text-amber-500 bg-amber-500/20",
    destructive: "text-red-500 bg-red-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <GlassCard hover glow={glow} className={cn("", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-3xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
              >
                {value}
              </motion.span>
              {trend && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend.isPositive ? "text-green-500" : "text-red-500"
                  )}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg",
              glow ? iconColorClasses[glow] : iconColorClasses.primary
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
