import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScoreGauge({
  score,
  size = "md",
  showLabel = true,
  className,
}: ScoreGaugeProps) {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-36 h-36",
    lg: "w-48 h-48",
  };

  const textSizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  const labelSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const strokeWidths = {
    sm: 6,
    md: 8,
    lg: 10,
  };

  const getColor = (score: number) => {
    if (score >= 80) return { stroke: "hsl(142, 71%, 45%)", glow: "glow-success" };
    if (score >= 60) return { stroke: "hsl(189, 94%, 43%)", glow: "glow-accent" };
    if (score >= 40) return { stroke: "hsl(38, 92%, 50%)", glow: "glow-warning" };
    return { stroke: "hsl(0, 84%, 60%)", glow: "glow-destructive" };
  };

  const { stroke, glow } = getColor(score);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      <svg
        className="transform -rotate-90 w-full h-full"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="hsl(217, 33%, 17%)"
          strokeWidth={strokeWidths[size]}
        />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidths[size]}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="filter drop-shadow-lg"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={cn("font-bold text-foreground", textSizes[size])}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        {showLabel && (
          <span className={cn("text-muted-foreground", labelSizes[size])}>
            Compliance
          </span>
        )}
      </div>
    </div>
  );
}

interface MiniScoreProps {
  score: number;
  label?: string;
  className?: string;
}

export function MiniScore({ score, label, className }: MiniScoreProps) {
  const getColorClass = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-cyan-500";
    if (score >= 40) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("text-2xl font-bold", getColorClass(score))}>{score}</span>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
