import { Link } from "wouter";
import { motion } from "framer-motion";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-20 px-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <GlassCard className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Page Not Found
            </p>
            <p className="text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => window.history.back()} data-testid="button-go-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Link href="/">
                <Button data-testid="button-home">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  );
}
