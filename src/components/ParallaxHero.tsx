import { Parallax } from "react-parallax";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ParallaxHeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ParallaxHero({
  title,
  subtitle,
  children,
  className,
}: ParallaxHeroProps) {
  return (
    <div className={cn("relative min-h-[45vh] overflow-hidden", className)}>
      {/* Parallax Background with Gradient */}
      <Parallax
        bgClassName="!absolute inset-0"
        strength={300}
        renderLayer={(percentage) => (
          <div className="absolute inset-0">
            {/* Base Gradient */}
            <div className="absolute inset-0 gradient-primary" />
            
            {/* Animated Orbs with Parallax Effect */}
            <motion.div
              style={{
                transform: `translate(${(percentage - 0.5) * 50}px, ${(percentage - 0.5) * -30}px)`,
              }}
              className="absolute top-10 left-[10%] w-80 h-80 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              style={{
                transform: `translate(${(percentage - 0.5) * -40}px, ${(percentage - 0.5) * 40}px)`,
              }}
              className="absolute bottom-10 right-[5%] w-96 h-96 bg-white/5 rounded-full blur-3xl"
            />
            <motion.div
              style={{
                transform: `scale(${0.9 + percentage * 0.2})`,
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/5 rounded-full blur-3xl"
            />
            
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
                transform: `translateY(${(percentage - 0.5) * 20}px)`,
              }}
            />
            
            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -15, 0],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
              />
            ))}
          </div>
        )}
      >
        {/* Content with faster parallax effect */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[45vh] px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              {title}
            </motion.h1>
            
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8"
              >
                {subtitle}
              </motion.p>
            )}
            
            {children && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {children}
              </motion.div>
            )}
          </motion.div>
        </div>
      </Parallax>
    </div>
  );
}
