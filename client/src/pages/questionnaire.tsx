import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClipboardList, CheckCircle, ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { QuestionnaireForm } from "@/components/questionnaire-form";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { QuestionnaireAnswer } from "@shared/schema";

export default function Questionnaire() {
  const [, params] = useRoute("/questionnaire/:auditId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const auditId = params?.auditId || "";

  const submitMutation = useMutation({
    mutationFn: async (answers: QuestionnaireAnswer[]) => {
      return apiRequest("POST", "/api/audit/submit-questionnaire", {
        auditId,
        questionnaire: {
          answers,
          submittedAt: new Date().toISOString(),
        },
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Questionnaire Submitted",
        description: "Your responses have been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  if (!auditId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 px-6">
          <GlassCard className="max-w-lg mx-auto text-center py-12">
            <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Audit ID</h2>
            <p className="text-muted-foreground mb-6">
              Please provide a valid Audit ID to access the questionnaire.
            </p>
            <Button onClick={() => navigate("/status")}>
              Check Audit Status
            </Button>
          </GlassCard>
        </main>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto"
          >
            <GlassCard glow="success" className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Questionnaire Submitted!
              </h2>
              <p className="text-muted-foreground mb-2">
                Your responses have been recorded for Audit ID:
              </p>
              <p className="text-lg font-mono font-bold text-primary mb-6">
                {auditId.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Our team will process your audit and notify you when the report is ready.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={() => navigate("/status")}>
                  Check Status
                </Button>
                <Button onClick={() => navigate("/")}>
                  Return Home
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Compliance Questionnaire
              </h1>
              <p className="text-muted-foreground">
                Audit ID: <span className="font-mono font-bold">{auditId.slice(0, 8).toUpperCase()}</span>
              </p>
            </div>
          </div>
        </motion.div>

        <QuestionnaireForm
          auditId={auditId}
          onSubmit={(answers) => submitMutation.mutate(answers)}
          isSubmitting={submitMutation.isPending}
        />
      </main>
    </div>
  );
}
