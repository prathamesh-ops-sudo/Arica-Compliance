import { cn } from "@/lib/utils";
import type { Sentiment } from "@/lib/mockData";

interface SentimentBadgeProps {
  sentiment: Sentiment;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sentimentConfig = {
  positive: {
    label: 'Positive',
    bgClass: 'bg-positive/10',
    textClass: 'text-positive',
    dotClass: 'bg-positive',
  },
  negative: {
    label: 'Negative',
    bgClass: 'bg-negative/10',
    textClass: 'text-negative',
    dotClass: 'bg-negative',
  },
  neutral: {
    label: 'Neutral',
    bgClass: 'bg-neutral/10',
    textClass: 'text-neutral-foreground',
    dotClass: 'bg-neutral',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function SentimentBadge({ sentiment, score, size = 'md', className }: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
        config.bgClass,
        config.textClass,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
      {config.label}
      {score !== undefined && (
        <span className="opacity-70">({Math.round(score * 100)}%)</span>
      )}
    </span>
  );
}
