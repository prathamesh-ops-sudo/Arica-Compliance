import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Shield,
  Sparkles,
  FileText,
  Lock,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  Users,
} from "lucide-react";
import { Header } from "@/components/header";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative">
        <section className="container py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">AI-Powered Compliance</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Enterprise Compliance,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Simplified
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Project Sentinel uses advanced AI to audit your systems, assess compliance gaps, and deliver executive-ready reports in minutes—not months.
              </p>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link href="/status">
                  <Button size="lg" className="h-14 px-8 text-lg" data-testid="button-check-status">
                    Check Audit Status
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg" data-testid="button-admin">
                    Admin Dashboard
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="container py-20 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Automated System Audit",
                description: "Deploy our lightweight agent to scan OS settings, firewall rules, encryption status, and user access controls.",
                delay: 0,
              },
              {
                icon: Sparkles,
                title: "AI Compliance Scoring",
                description: "Our AI analyzes your data against ISO-27001, SOC2, and industry frameworks to generate actionable insights.",
                delay: 0.1,
              },
              {
                icon: FileText,
                title: "Executive Reports",
                description: "Get professional PDF reports with compliance scores, risk analysis, and prioritized recommendations.",
                delay: 0.2,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: feature.delay + 0.4 }}
              >
                <GlassCard hover className="h-full">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/20 mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container py-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get from audit to insights in four simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Run Agent",
                description: "Download and run our desktop agent on your system",
                icon: Zap,
              },
              {
                step: "02",
                title: "Complete Survey",
                description: "Answer compliance questions about your policies",
                icon: CheckCircle,
              },
              {
                step: "03",
                title: "AI Analysis",
                description: "Our AI processes your data and calculates scores",
                icon: Sparkles,
              },
              {
                step: "04",
                title: "Get Report",
                description: "Download your executive compliance report",
                icon: FileText,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="relative"
              >
                <GlassCard className="text-center h-full">
                  <div className="text-4xl font-bold text-primary/30 mb-4">
                    {item.step}
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20 mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </GlassCard>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-primary/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        <section className="container py-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <GlassCard glow="primary" className="text-center py-16 px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Get Compliant?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Join hundreds of organizations using Project Sentinel to streamline their compliance journey.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link href="/status">
                  <Button size="lg" className="h-12" data-testid="button-get-started">
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-8 mt-10 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  <span className="text-sm">Global Coverage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm">SOC2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">500+ Companies</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container px-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-semibold text-foreground">Project Sentinel</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 Project Sentinel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
