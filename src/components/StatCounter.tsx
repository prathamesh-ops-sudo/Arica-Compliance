import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
  delay?: number;
  compact?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function StatCounter({
  value,
  label,
  prefix = '',
  suffix = '',
  trend,
  trendValue,
  icon,
  className,
  delay = 0,
  compact = false,
}: StatCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const increment = value / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setDisplayValue(value);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    neutral: <Minus className="w-4 h-4" />,
  };

  const trendColor = {
    up: 'text-positive',
    down: 'text-negative',
    neutral: 'text-muted-foreground',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'relative rounded-xl bg-card border border-border hover-lift',
        compact ? 'p-4' : 'p-6',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={compact ? "space-y-1" : "space-y-2"}>
          <p className={cn("font-medium text-muted-foreground", compact ? "text-xs" : "text-sm")}>{label}</p>
          <div className="flex items-baseline gap-1">
            <span className={cn("font-bold text-foreground", compact ? "text-xl" : "text-3xl")}>
              {prefix}{formatNumber(displayValue)}{suffix}
            </span>
          </div>
          {trend && trendValue && !compact && (
            <div className={cn('flex items-center gap-1 text-sm', trendColor[trend])}>
              {trendIcon[trend]}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("rounded-lg bg-primary/10 text-primary", compact ? "p-2" : "p-3")}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
