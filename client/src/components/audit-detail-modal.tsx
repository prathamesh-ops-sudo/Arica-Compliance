import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Unlock, Sparkles, FileDown, Monitor, ClipboardList, BarChart3, Lightbulb, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Minus } from "lucide-react";
import { StatusBadge, RiskBadge, ReadinessBadge } from "./status-badge";
import { ScoreGauge } from "./score-gauge";
import { ComplianceRadarChart, ComplianceBarChart } from "./compliance-chart";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "./glass-card";
import type { Audit, QuestionnaireCategoryType, ISOControlFinding, ISOControlThemeType } from "@shared/schema";
import { QuestionnaireCategory, ISOControlTheme, ControlStatus } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

interface AuditDetailModalProps {
  audit: Audit | null;
  open: boolean;
  onClose: () => void;
  onUnlock: (audit: Audit) => void;
  onRunAI: (audit: Audit) => void;
  onExportPDF: (audit: Audit) => void;
}

export function AuditDetailModal({
  audit,
  open,
  onClose,
  onUnlock,
  onRunAI,
  onExportPDF,
}: AuditDetailModalProps) {
  if (!audit) return null;

  const categoryData = audit.aiScore?.categoryScores
    ? Object.entries(audit.aiScore.categoryScores).map(([category, score]) => ({
        category: category as QuestionnaireCategoryType,
        score: score as number,
        fullMark: 100,
      }))
    : [];

  const categoryLabels: Record<string, string> = {
    ACCESS_CONTROL: "Access Control",
    ASSET_MANAGEMENT: "Asset Management",
    RISK_MANAGEMENT: "Risk Management",
    INCIDENT_RESPONSE: "Incident Response",
    BUSINESS_CONTINUITY: "Business Continuity",
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl glass max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-xl font-bold">
                Audit {audit.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
              <StatusBadge status={audit.status} />
            </div>
            <div className="flex items-center gap-2">
              {audit.status === "LOCKED" && (
                <Button
                  size="sm"
                  onClick={() => onUnlock(audit)}
                  data-testid="button-modal-unlock"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock
                </Button>
              )}
              {(audit.status === "PAID" || audit.status === "LOCKED") && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onRunAI(audit)}
                  data-testid="button-modal-ai"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run AI
                </Button>
              )}
              {audit.status === "REPORT_READY" && (
                <Button
                  size="sm"
                  onClick={() => onExportPDF(audit)}
                  data-testid="button-modal-export"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="iso" data-testid="tab-iso">
                <ShieldCheck className="w-4 h-4 mr-2" />
                ISO 27001
              </TabsTrigger>
              <TabsTrigger value="system" data-testid="tab-system">
                <Monitor className="w-4 h-4 mr-2" />
                System
              </TabsTrigger>
              <TabsTrigger value="questionnaire" data-testid="tab-questionnaire">
                <ClipboardList className="w-4 h-4 mr-2" />
                Questionnaire
              </TabsTrigger>
              <TabsTrigger value="recommendations" data-testid="tab-recommendations">
                <Lightbulb className="w-4 h-4 mr-2" />
                Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {audit.aiScore ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <GlassCard className="flex flex-col items-center justify-center">
                      <ScoreGauge score={audit.aiScore.complianceScore} size="lg" />
                    </GlassCard>
                    <GlassCard className="md:col-span-2">
                      <GlassCardHeader>
                        <GlassCardTitle>Assessment Summary</GlassCardTitle>
                      </GlassCardHeader>
                      <GlassCardContent className="space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <RiskBadge level={audit.aiScore.riskLevel} />
                          <ReadinessBadge readiness={audit.aiScore.auditReadiness} />
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {audit.aiScore.summary}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                          <span>
                            Created: {format(new Date(audit.createdAt), "PPP")}
                          </span>
                          <span>
                            Scored: {format(new Date(audit.aiScore.scoredAt), "PPP")}
                          </span>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ComplianceRadarChart data={categoryData} />
                    <ComplianceBarChart data={categoryData} />
                  </div>

                  {audit.aiScore.controlGaps.length > 0 && (
                    <GlassCard>
                      <GlassCardHeader>
                        <GlassCardTitle>Control Gaps</GlassCardTitle>
                      </GlassCardHeader>
                      <GlassCardContent>
                        <div className="space-y-3">
                          {audit.aiScore.controlGaps.map((gap, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-lg bg-background/50 border border-border/50"
                            >
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <span className="font-medium text-foreground">
                                    {gap.controlName}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {categoryLabels[gap.category]}
                                  </span>
                                </div>
                                <RiskBadge level={gap.severity} />
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {gap.description}
                              </p>
                              <p className="text-sm text-primary">
                                Recommendation: {gap.recommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  )}
                </>
              ) : (
                <GlassCard className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    No Score Available
                  </p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Run AI scoring to generate the compliance report
                  </p>
                  <Button onClick={() => onRunAI(audit)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run AI Scoring
                  </Button>
                </GlassCard>
              )}
            </TabsContent>

            <TabsContent value="iso" className="space-y-6">
              {audit.aiScore?.isoCompliance ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <GlassCard className="p-4 text-center">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {audit.aiScore.isoCompliance.overallScore}%
                      </div>
                      <div className="text-xs text-muted-foreground">Overall ISO Score</div>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                      <div className="text-xl font-bold text-foreground mb-1">
                        {audit.aiScore.isoCompliance.maturityLevel}
                      </div>
                      <div className="text-xs text-muted-foreground">Maturity Level</div>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                      <CertificationBadge readiness={audit.aiScore.isoCompliance.certificationReadiness} />
                      <div className="text-xs text-muted-foreground mt-1">Certification</div>
                    </GlassCard>
                    <GlassCard className="p-4 text-center">
                      <div className="text-xl font-bold text-foreground mb-1">
                        {audit.aiScore.isoCompliance.totalControls}
                      </div>
                      <div className="text-xs text-muted-foreground">Controls Evaluated</div>
                    </GlassCard>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard>
                      <GlassCardHeader>
                        <GlassCardTitle>Theme Scores</GlassCardTitle>
                      </GlassCardHeader>
                      <GlassCardContent className="space-y-4">
                        {Object.entries(audit.aiScore.isoCompliance.themeScores).map(([theme, score]) => (
                          <div key={theme}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-foreground">{isoThemeLabels[theme as ISOControlThemeType]}</span>
                              <span className="text-sm font-medium text-primary">{score}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-background overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </GlassCardContent>
                    </GlassCard>

                    <GlassCard>
                      <GlassCardHeader>
                        <GlassCardTitle>Control Status Summary</GlassCardTitle>
                      </GlassCardHeader>
                      <GlassCardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-green-400">Compliant</span>
                            </div>
                            <div className="text-2xl font-bold text-green-400">
                              {audit.aiScore.isoCompliance.compliantControls}
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              <span className="text-sm text-amber-400">Partial</span>
                            </div>
                            <div className="text-2xl font-bold text-amber-400">
                              {audit.aiScore.isoCompliance.partialControls}
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="w-4 h-4 text-red-400" />
                              <span className="text-sm text-red-400">Non-Compliant</span>
                            </div>
                            <div className="text-2xl font-bold text-red-400">
                              {audit.aiScore.isoCompliance.nonCompliantControls}
                            </div>
                          </div>
                          <div className="p-4 rounded-lg bg-slate-500/10 border border-slate-500/20">
                            <div className="flex items-center gap-2 mb-1">
                              <Minus className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-400">N/A</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-400">
                              {audit.aiScore.isoCompliance.notApplicableControls}
                            </div>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  </div>

                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle>ISO 27001:2022 Control Findings ({audit.aiScore.isoCompliance.controlFindings.filter(f => f.status !== ControlStatus.NOT_APPLICABLE).length})</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {audit.aiScore.isoCompliance.controlFindings
                          .filter(f => f.status !== ControlStatus.NOT_APPLICABLE)
                          .map((finding, index) => (
                            <ISOControlRow key={index} finding={finding} />
                          ))}
                      </div>
                    </GlassCardContent>
                  </GlassCard>

                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle>ISO Summary</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {audit.aiScore.isoCompliance.summary}
                      </p>
                    </GlassCardContent>
                  </GlassCard>
                </>
              ) : (
                <GlassCard className="text-center py-12">
                  <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    No ISO Compliance Data
                  </p>
                  <p className="text-muted-foreground text-sm mb-4">
                    Run AI scoring to evaluate ISO 27001/27002 compliance
                  </p>
                  <Button onClick={() => onRunAI(audit)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run AI Scoring
                  </Button>
                </GlassCard>
              )}
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              {audit.systemData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle>Operating System</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-2">
                      <InfoRow label="OS Name" value={audit.systemData.osName} />
                      <InfoRow label="Version" value={audit.systemData.osVersion} />
                      <InfoRow label="Platform" value={audit.systemData.osPlatform} />
                    </GlassCardContent>
                  </GlassCard>

                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle>Security Status</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-2">
                      <InfoRow
                        label="Firewall"
                        value={audit.systemData.firewallEnabled ? "Enabled" : "Disabled"}
                        status={audit.systemData.firewallEnabled}
                      />
                      <InfoRow
                        label="Antivirus"
                        value={audit.systemData.antivirusInstalled ? audit.systemData.antivirusName || "Installed" : "Not Installed"}
                        status={audit.systemData.antivirusInstalled}
                      />
                      <InfoRow
                        label="Disk Encryption"
                        value={audit.systemData.diskEncryptionEnabled ? audit.systemData.diskEncryptionMethod || "Enabled" : "Disabled"}
                        status={audit.systemData.diskEncryptionEnabled}
                      />
                    </GlassCardContent>
                  </GlassCard>

                  <GlassCard className="md:col-span-2">
                    <GlassCardHeader>
                      <GlassCardTitle>User Accounts ({audit.systemData.userAccounts.length})</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {audit.systemData.userAccounts.map((user, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg bg-background/50 border border-border/50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{user.username}</span>
                              {user.isAdmin && (
                                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                  Admin
                                </span>
                              )}
                            </div>
                            {user.lastLogin && (
                              <span className="text-xs text-muted-foreground">
                                Last login: {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </div>
              ) : (
                <GlassCard className="text-center py-12">
                  <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    No System Data
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Waiting for the desktop agent to submit system data
                  </p>
                </GlassCard>
              )}
            </TabsContent>

            <TabsContent value="questionnaire" className="space-y-6">
              {audit.questionnaire ? (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle>
                      Questionnaire Responses ({audit.questionnaire.answers.length})
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-4">
                      {Object.values(QuestionnaireCategory).map((category) => {
                        const categoryAnswers = audit.questionnaire?.answers.filter(
                          (a) => a.category === category
                        );
                        if (!categoryAnswers?.length) return null;

                        return (
                          <div key={category} className="space-y-2">
                            <h4 className="font-medium text-foreground">
                              {categoryLabels[category]}
                            </h4>
                            <div className="space-y-2">
                              {categoryAnswers.map((answer, index) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg bg-background/50 border border-border/50"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm text-foreground">{answer.question}</p>
                                    <AnswerBadge answer={answer.answer} />
                                  </div>
                                  {answer.notes && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Notes: {answer.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ) : (
                <GlassCard className="text-center py-12">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    No Questionnaire Data
                  </p>
                  <p className="text-muted-foreground text-sm">
                    The questionnaire has not been submitted yet
                  </p>
                </GlassCard>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              {audit.aiScore?.recommendations.length ? (
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle>AI Recommendations</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-3">
                      {audit.aiScore.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border/50"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary shrink-0">
                            <span className="text-sm font-bold">{index + 1}</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ) : (
                <GlassCard className="text-center py-12">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    No Recommendations Available
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Run AI scoring to generate recommendations
                  </p>
                </GlassCard>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${status !== undefined ? (status ? "text-green-400" : "text-red-400") : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function AnswerBadge({ answer }: { answer: "YES" | "NO" | "PARTIAL" | "NA" }) {
  const config = {
    YES: "bg-green-500/20 text-green-300 border-green-500/30",
    NO: "bg-red-500/20 text-red-300 border-red-500/30",
    PARTIAL: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    NA: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${config[answer]}`}>
      {answer}
    </span>
  );
}

const isoThemeLabels: Record<ISOControlThemeType, string> = {
  ORGANIZATIONAL: "Organizational Controls (A.5)",
  PEOPLE: "People Controls (A.6)",
  PHYSICAL: "Physical Controls (A.7)",
  TECHNOLOGICAL: "Technological Controls (A.8)",
};

function CertificationBadge({ readiness }: { readiness: "READY" | "NEAR_READY" | "NEEDS_WORK" | "NOT_READY" }) {
  const config = {
    READY: { label: "Ready", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    NEAR_READY: { label: "Near Ready", className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    NEEDS_WORK: { label: "Needs Work", className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    NOT_READY: { label: "Not Ready", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  const { label, className } = config[readiness];
  return (
    <span className={`text-sm font-medium px-3 py-1 rounded border ${className}`}>
      {label}
    </span>
  );
}

function ISOControlRow({ finding }: { finding: ISOControlFinding }) {
  const statusConfig = {
    COMPLIANT: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
    PARTIAL: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    NON_COMPLIANT: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
    NOT_APPLICABLE: { icon: Minus, color: "text-slate-400", bg: "bg-slate-500/10" },
  };

  const { icon: Icon, color, bg } = statusConfig[finding.status];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${bg} border border-border/30`}>
      <Icon className={`w-4 h-4 ${color} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-primary">{finding.controlId}</span>
          <span className="text-sm text-foreground truncate">{finding.controlName}</span>
        </div>
        {finding.recommendation && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{finding.recommendation}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{isoThemeLabels[finding.theme].split(' ')[0]}</span>
    </div>
  );
}
