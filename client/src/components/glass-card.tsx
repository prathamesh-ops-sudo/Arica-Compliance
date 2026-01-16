import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "primary" | "accent" | "success" | "warning" | "destructive";
  animate?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow,
  animate = false,
}: GlassCardProps) {
  const glowClasses = {
    primary: "glow-primary",
    accent: "glow-accent",
    success: "glow-success",
    warning: "glow-warning",
    destructive: "glow-destructive",
  };

  const Component = animate ? motion.div : "div";
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: "easeOut" },
      }
    : {};

  return (
    <Component
      className={cn(
        "glass rounded-xl p-6",
        hover && "hover-elevate cursor-pointer transition-all duration-300",
        glow && glowClasses[glow],
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function GlassCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-4", className)}>
      {children}
    </div>
  );
}

export function GlassCardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-foreground", className)}>
      {children}
    </h3>
  );
}

export function GlassCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("", className)}>{children}</div>;
}
