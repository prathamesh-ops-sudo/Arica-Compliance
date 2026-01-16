import { motion } from "framer-motion";
import { ExternalLink, Twitter, Newspaper, BookOpen, MessageCircle, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SentimentBadge } from "./SentimentBadge";
import type { Mention } from "@/lib/mockData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MentionCardProps {
  mention: Mention;
  index?: number;
  compact?: boolean;
  expanded?: boolean;
}

const sourceIcons = {
  twitter: Twitter,
  news: Newspaper,
  blog: BookOpen,
  reddit: MessageCircle,
  linkedin: Linkedin,
};

const sourceColors = {
  twitter: 'text-[#1DA1F2]',
  news: 'text-primary',
  blog: 'text-chart-5',
  reddit: 'text-[#FF4500]',
  linkedin: 'text-[#0A66C2]',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function MentionCard({ mention, index = 0, compact = false, expanded = false }: MentionCardProps) {
  const SourceIcon = sourceIcons[mention.source];

  return (
    <motion.div
      data-testid="mention-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      whileHover={{ scale: compact ? 1.01 : 1.015, y: -2 }}
      className="group"
    >
      <Card className={cn(
        "overflow-hidden border border-border bg-card transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/5 group-hover:border-primary/20",
        expanded && "p-2"
      )}>
        <CardHeader className={compact ? "pb-2 p-3" : "pb-3"}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-lg bg-muted', sourceColors[mention.source], compact ? "p-1.5" : "p-2")}>
                <SourceIcon className={compact ? "w-3 h-3" : "w-4 h-4"} />
              </div>
              <div>
                <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>{mention.author}</p>
                <p className={cn("text-muted-foreground capitalize", compact ? "text-[10px]" : "text-xs")}>{mention.source}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SentimentBadge sentiment={mention.sentiment} size="sm" />
              <span className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>{formatDate(mention.date)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className={cn("pt-0", compact ? "p-3 pt-0 space-y-2" : expanded ? "space-y-6" : "space-y-4")}>
          <div>
            <h3 className={cn("font-semibold text-foreground mb-2", compact ? "text-sm line-clamp-1" : expanded ? "text-lg" : "line-clamp-1")}>{mention.title}</h3>
            <p className={cn("text-muted-foreground", compact ? "text-xs line-clamp-1" : expanded ? "text-base" : "text-sm line-clamp-2")}>{mention.content}</p>
          </div>
          
          <div className={cn("flex flex-wrap", compact ? "gap-1" : "gap-1.5")}>
            {mention.keywords.slice(0, compact ? 2 : 3).map((keyword) => (
              <span
                key={keyword}
                className={cn("rounded-md bg-accent text-accent-foreground", compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs")}
              >
                {keyword}
              </span>
            ))}
          </div>
          
          <div className={cn("flex items-center justify-between pt-2 border-t border-border", compact && "pt-1")}>
            <div className={cn("flex items-center gap-4 text-muted-foreground", compact ? "text-[10px] gap-2" : "text-xs")}>
              <span>Reach: <strong className="text-foreground">{formatNumber(mention.reach)}</strong></span>
              <span>Engagement: <strong className="text-foreground">{formatNumber(mention.engagement)}</strong></span>
            </div>
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-primary", compact ? "p-1" : "p-1.5")}
            >
              <ExternalLink className={compact ? "w-3 h-3" : "w-4 h-4"} />
            </a>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
