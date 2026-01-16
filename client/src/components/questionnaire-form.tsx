import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "./glass-card";
import { questionnaireQuestions, type QuestionnaireCategoryType, type QuestionnaireAnswer } from "@shared/schema";

interface QuestionnaireFormProps {
  auditId: string;
  onSubmit: (answers: QuestionnaireAnswer[]) => void;
  isSubmitting?: boolean;
}

const categoryLabels: Record<string, string> = {
  ACCESS_CONTROL: "Access Control",
  ASSET_MANAGEMENT: "Asset Management",
  RISK_MANAGEMENT: "Risk Management",
  INCIDENT_RESPONSE: "Incident Response",
  BUSINESS_CONTINUITY: "Business Continuity",
};

const categoryDescriptions: Record<string, string> = {
  ACCESS_CONTROL: "Evaluate your organization's user access and authentication controls",
  ASSET_MANAGEMENT: "Assess how your organization manages and tracks IT assets",
  RISK_MANAGEMENT: "Review your risk assessment and treatment processes",
  INCIDENT_RESPONSE: "Evaluate your security incident detection and response capabilities",
  BUSINESS_CONTINUITY: "Assess your disaster recovery and business continuity planning",
};

export function QuestionnaireForm({ auditId, onSubmit, isSubmitting }: QuestionnaireFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; notes: string }>>({});

  const currentQuestion = questionnaireQuestions[currentIndex];
  const progress = ((currentIndex + 1) / questionnaireQuestions.length) * 100;
  const isLastQuestion = currentIndex === questionnaireQuestions.length - 1;
  const canGoNext = answers[currentQuestion.id]?.answer;

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        answer,
      },
    }));
  };

  const handleNotes = (notes: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        notes,
      },
    }));
  };

  const handleNext = () => {
    if (currentIndex < questionnaireQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const formattedAnswers: QuestionnaireAnswer[] = questionnaireQuestions
      .filter((q) => answers[q.id]?.answer)
      .map((q) => ({
        questionId: q.id,
        category: q.category as QuestionnaireCategoryType,
        question: q.question,
        answer: answers[q.id].answer as "YES" | "NO" | "PARTIAL" | "NA",
        notes: answers[q.id].notes || undefined,
      }));

    onSubmit(formattedAnswers);
  };

  const answeredCount = Object.values(answers).filter((a) => a.answer).length;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questionnaireQuestions.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              {answeredCount} answered
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </motion.div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard className="mb-6">
          <GlassCardHeader>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                {categoryLabels[currentQuestion.category]}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentQuestion.id}
              </span>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-xl text-foreground font-medium mb-8 leading-relaxed">
              {currentQuestion.question}
            </p>

            <div className="space-y-6">
              <RadioGroup
                value={answers[currentQuestion.id]?.answer || ""}
                onValueChange={handleAnswer}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {[
                  { value: "YES", label: "Yes", color: "bg-green-500/20 border-green-500/50 data-[state=checked]:bg-green-500/30" },
                  { value: "NO", label: "No", color: "bg-red-500/20 border-red-500/50 data-[state=checked]:bg-red-500/30" },
                  { value: "PARTIAL", label: "Partial", color: "bg-amber-500/20 border-amber-500/50 data-[state=checked]:bg-amber-500/30" },
                  { value: "NA", label: "N/A", color: "bg-slate-500/20 border-slate-500/50 data-[state=checked]:bg-slate-500/30" },
                ].map((option) => (
                  <div key={option.value} className="relative">
                    <RadioGroupItem
                      value={option.value}
                      id={`${currentQuestion.id}-${option.value}`}
                      className="peer sr-only"
                      data-testid={`radio-${option.value.toLowerCase()}`}
                    />
                    <Label
                      htmlFor={`${currentQuestion.id}-${option.value}`}
                      className={`flex items-center justify-center h-14 rounded-lg border-2 cursor-pointer transition-all ${option.color} peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary`}
                    >
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div>
                <Label htmlFor="notes" className="text-sm text-muted-foreground mb-2 block">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant context or details..."
                  value={answers[currentQuestion.id]?.notes || ""}
                  onChange={(e) => handleNotes(e.target.value)}
                  className="bg-background/50 resize-none"
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          data-testid="button-prev"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {questionnaireQuestions.slice(Math.max(0, currentIndex - 2), Math.min(questionnaireQuestions.length, currentIndex + 3)).map((q, i) => {
            const actualIndex = Math.max(0, currentIndex - 2) + i;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(actualIndex)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  actualIndex === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[q.id]?.answer
                    ? "bg-green-500/20 text-green-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {actualIndex + 1}
              </button>
            );
          })}
        </div>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={answeredCount < questionnaireQuestions.length * 0.5 || isSubmitting}
            data-testid="button-submit"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                Submit
                <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canGoNext}
            data-testid="button-next"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
