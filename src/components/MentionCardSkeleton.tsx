import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MentionCardSkeletonProps {
  compact?: boolean;
}

export function MentionCardSkeleton({ compact = false }: MentionCardSkeletonProps) {
  return (
    <Card className="overflow-hidden border border-border bg-card">
      <CardHeader className={compact ? "pb-2 p-3" : "pb-3"}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className={cn("rounded-lg", compact ? "w-7 h-7" : "w-10 h-10")} />
            <div className="space-y-2">
              <Skeleton className={cn(compact ? "h-3 w-20" : "h-4 w-24")} />
              <Skeleton className={cn(compact ? "h-2 w-12" : "h-3 w-16")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className={cn("rounded-full", compact ? "h-4 w-12" : "h-5 w-16")} />
            <Skeleton className={cn(compact ? "h-2 w-8" : "h-3 w-12")} />
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("pt-0", compact ? "p-3 pt-0 space-y-2" : "space-y-4")}>
        <div className="space-y-2">
          <Skeleton className={cn(compact ? "h-4 w-2/3" : "h-5 w-3/4")} />
          <Skeleton className={cn(compact ? "h-3 w-full" : "h-4 w-full")} />
          {!compact && <Skeleton className="h-4 w-2/3" />}
        </div>
        
        <div className="flex gap-1.5">
          <Skeleton className={cn("rounded-md", compact ? "h-4 w-12" : "h-5 w-16")} />
          <Skeleton className={cn("rounded-md", compact ? "h-4 w-14" : "h-5 w-20")} />
          {!compact && <Skeleton className="h-5 w-14 rounded-md" />}
        </div>
        
        <div className={cn("flex items-center justify-between pt-2 border-t border-border", compact && "pt-1")}>
          <div className="flex items-center gap-4">
            <Skeleton className={cn(compact ? "h-2 w-14" : "h-3 w-20")} />
            <Skeleton className={cn(compact ? "h-2 w-16" : "h-3 w-24")} />
          </div>
          <Skeleton className={cn("rounded-md", compact ? "h-6 w-6" : "h-8 w-8")} />
        </div>
      </CardContent>
    </Card>
  );
}
