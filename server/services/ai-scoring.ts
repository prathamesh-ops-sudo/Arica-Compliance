import type {
  Audit,
  AIScoreResult,
  ControlGap,
  RiskLevelType,
  QuestionnaireCategoryType,
} from "@shared/schema";
import { RiskLevel, QuestionnaireCategory } from "@shared/schema";

interface ScoringWeights {
  systemData: {
    firewall: number;
    antivirus: number;
    encryption: number;
    userAccess: number;
  };
  questionnaire: {
    [key in QuestionnaireCategoryType]: number;
  };
}

const SCORING_WEIGHTS: ScoringWeights = {
  systemData: {
    firewall: 15,
    antivirus: 15,
    encryption: 10,
    userAccess: 10,
  },
  questionnaire: {
    ACCESS_CONTROL: 15,
    ASSET_MANAGEMENT: 10,
    RISK_MANAGEMENT: 10,
    INCIDENT_RESPONSE: 8,
    BUSINESS_CONTINUITY: 7,
  },
};

function calculateSystemDataScore(audit: Audit): {
  score: number;
  gaps: ControlGap[];
} {
  const gaps: ControlGap[] = [];
  let score = 0;
  let maxScore = 0;

  if (!audit.systemData) {
    return { score: 0, gaps: [] };
  }

  const sd = audit.systemData;

  maxScore += SCORING_WEIGHTS.systemData.firewall;
  if (sd.firewallEnabled) {
    score += SCORING_WEIGHTS.systemData.firewall;
  } else {
    gaps.push({
      category: QuestionnaireCategory.ACCESS_CONTROL,
      controlName: "Firewall Protection",
      severity: RiskLevel.CRITICAL,
      description: "Host firewall is disabled or not configured",
      recommendation: "Enable and configure host-based firewall with appropriate ingress/egress rules",
    });
  }

  maxScore += SCORING_WEIGHTS.systemData.antivirus;
  if (sd.antivirusInstalled) {
    score += SCORING_WEIGHTS.systemData.antivirus;
  } else {
    gaps.push({
      category: QuestionnaireCategory.ACCESS_CONTROL,
      controlName: "Endpoint Protection",
      severity: RiskLevel.HIGH,
      description: "No antivirus or endpoint protection software detected",
      recommendation: "Deploy enterprise-grade endpoint protection solution",
    });
  }

  maxScore += SCORING_WEIGHTS.systemData.encryption;
  if (sd.diskEncryptionEnabled) {
    score += SCORING_WEIGHTS.systemData.encryption;
  } else {
    gaps.push({
      category: QuestionnaireCategory.ASSET_MANAGEMENT,
      controlName: "Data At Rest Encryption",
      severity: RiskLevel.HIGH,
      description: "Disk encryption is not enabled for data at rest protection",
      recommendation: "Implement full disk encryption using BitLocker, FileVault, or LUKS",
    });
  }

  maxScore += SCORING_WEIGHTS.systemData.userAccess;
  const adminCount = sd.userAccounts.filter(u => u.isAdmin).length;
  const totalUsers = sd.userAccounts.length;
  const adminRatio = totalUsers > 0 ? adminCount / totalUsers : 0;

  if (adminRatio <= 0.2) {
    score += SCORING_WEIGHTS.systemData.userAccess;
  } else if (adminRatio <= 0.4) {
    score += SCORING_WEIGHTS.systemData.userAccess * 0.6;
    gaps.push({
      category: QuestionnaireCategory.ACCESS_CONTROL,
      controlName: "Privileged Access Management",
      severity: RiskLevel.MEDIUM,
      description: `${Math.round(adminRatio * 100)}% of accounts have administrative privileges`,
      recommendation: "Review and reduce the number of administrative accounts following least privilege principle",
    });
  } else {
    score += SCORING_WEIGHTS.systemData.userAccess * 0.3;
    gaps.push({
      category: QuestionnaireCategory.ACCESS_CONTROL,
      controlName: "Privileged Access Management",
      severity: RiskLevel.HIGH,
      description: `Excessive administrative accounts: ${Math.round(adminRatio * 100)}% of users have admin privileges`,
      recommendation: "Immediately audit and reduce administrative accounts. Implement role-based access control.",
    });
  }

  return {
    score: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    gaps,
  };
}

function calculateQuestionnaireScore(audit: Audit): {
  categoryScores: Record<QuestionnaireCategoryType, number>;
  gaps: ControlGap[];
} {
  const categoryScores: Record<QuestionnaireCategoryType, number> = {
    ACCESS_CONTROL: 0,
    ASSET_MANAGEMENT: 0,
    RISK_MANAGEMENT: 0,
    INCIDENT_RESPONSE: 0,
    BUSINESS_CONTINUITY: 0,
  };

  const gaps: ControlGap[] = [];

  if (!audit.questionnaire?.answers.length) {
    Object.keys(categoryScores).forEach((key) => {
      categoryScores[key as QuestionnaireCategoryType] = 50;
    });
    return { categoryScores, gaps };
  }

  const categoryCounts: Record<string, { yes: number; partial: number; no: number; total: number }> = {};

  for (const answer of audit.questionnaire.answers) {
    if (!categoryCounts[answer.category]) {
      categoryCounts[answer.category] = { yes: 0, partial: 0, no: 0, total: 0 };
    }
    categoryCounts[answer.category].total++;

    switch (answer.answer) {
      case "YES":
        categoryCounts[answer.category].yes++;
        break;
      case "PARTIAL":
        categoryCounts[answer.category].partial++;
        break;
      case "NO":
        categoryCounts[answer.category].no++;
        gaps.push({
          category: answer.category,
          controlName: answer.questionId,
          severity: RiskLevel.MEDIUM,
          description: `Control not implemented: ${answer.question}`,
          recommendation: `Implement controls to address: ${answer.question}`,
        });
        break;
    }
  }

  for (const [category, counts] of Object.entries(categoryCounts)) {
    if (counts.total > 0) {
      const score = Math.round(
        ((counts.yes * 1 + counts.partial * 0.5) / counts.total) * 100
      );
      categoryScores[category as QuestionnaireCategoryType] = score;
    }
  }

  for (const category of Object.keys(categoryScores) as QuestionnaireCategoryType[]) {
    if (!categoryCounts[category]) {
      categoryScores[category] = 50;
    }
  }

  return { categoryScores, gaps };
}

function calculateOverallScore(
  systemScore: number,
  categoryScores: Record<QuestionnaireCategoryType, number>
): number {
  const systemWeight = 0.5;
  const questionnaireWeight = 0.5;

  const questionnaireAvg =
    Object.values(categoryScores).reduce((a, b) => a + b, 0) /
    Object.values(categoryScores).length;

  return Math.round(systemScore * systemWeight + questionnaireAvg * questionnaireWeight);
}

function determineRiskLevel(score: number): RiskLevelType {
  if (score >= 80) return RiskLevel.LOW;
  if (score >= 60) return RiskLevel.MEDIUM;
  if (score >= 40) return RiskLevel.HIGH;
  return RiskLevel.CRITICAL;
}

function determineAuditReadiness(score: number): "READY" | "NEEDS_IMPROVEMENT" | "NOT_READY" {
  if (score >= 80) return "READY";
  if (score >= 50) return "NEEDS_IMPROVEMENT";
  return "NOT_READY";
}

function generateRecommendations(
  gaps: ControlGap[],
  score: number,
  categoryScores: Record<QuestionnaireCategoryType, number>
): string[] {
  const recommendations: string[] = [];

  const criticalGaps = gaps.filter((g) => g.severity === RiskLevel.CRITICAL);
  const highGaps = gaps.filter((g) => g.severity === RiskLevel.HIGH);

  for (const gap of criticalGaps.slice(0, 3)) {
    recommendations.push(`CRITICAL: ${gap.recommendation}`);
  }

  for (const gap of highGaps.slice(0, 2)) {
    recommendations.push(`HIGH PRIORITY: ${gap.recommendation}`);
  }

  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2);

  const categoryLabels: Record<string, string> = {
    ACCESS_CONTROL: "access control policies",
    ASSET_MANAGEMENT: "asset management practices",
    RISK_MANAGEMENT: "risk management framework",
    INCIDENT_RESPONSE: "incident response capabilities",
    BUSINESS_CONTINUITY: "business continuity planning",
  };

  for (const [category, catScore] of sortedCategories) {
    if (catScore < 70) {
      recommendations.push(
        `Focus on improving ${categoryLabels[category]} (current score: ${catScore}%)`
      );
    }
  }

  if (score < 60) {
    recommendations.push(
      "Consider engaging a security consultant for comprehensive remediation planning"
    );
  }

  if (score >= 70 && score < 80) {
    recommendations.push(
      "Schedule a follow-up audit in 6 months to track improvement progress"
    );
  }

  return recommendations.slice(0, 7);
}

function generateSummary(
  score: number,
  riskLevel: RiskLevelType,
  gaps: ControlGap[],
  categoryScores: Record<QuestionnaireCategoryType, number>
): string {
  const criticalCount = gaps.filter((g) => g.severity === RiskLevel.CRITICAL).length;
  const highCount = gaps.filter((g) => g.severity === RiskLevel.HIGH).length;

  const topCategory = Object.entries(categoryScores).sort(([, a], [, b]) => b - a)[0];
  const bottomCategory = Object.entries(categoryScores).sort(([, a], [, b]) => a - b)[0];

  const categoryLabels: Record<string, string> = {
    ACCESS_CONTROL: "Access Control",
    ASSET_MANAGEMENT: "Asset Management",
    RISK_MANAGEMENT: "Risk Management",
    INCIDENT_RESPONSE: "Incident Response",
    BUSINESS_CONTINUITY: "Business Continuity",
  };

  if (score >= 80) {
    return `The organization demonstrates strong security posture with a compliance score of ${score}%. ${topCategory ? `${categoryLabels[topCategory[0]]} is the strongest area at ${topCategory[1]}%.` : ""} Minor improvements can further strengthen the security framework. The organization appears ready for formal compliance certification.`;
  }

  if (score >= 60) {
    return `The organization shows moderate security maturity with a compliance score of ${score}%. ${criticalCount > 0 ? `${criticalCount} critical gap(s) require immediate attention.` : ""} ${bottomCategory ? `Priority should be given to ${categoryLabels[bottomCategory[0]]} (${bottomCategory[1]}%).` : ""} With focused remediation, the organization can achieve certification readiness within 3-6 months.`;
  }

  if (score >= 40) {
    return `Significant security gaps identified with a compliance score of ${score}%. ${criticalCount} critical and ${highCount} high-severity issues require immediate remediation. The organization should prioritize addressing fundamental security controls before pursuing compliance certification. A comprehensive security improvement program is recommended.`;
  }

  return `Critical security deficiencies identified with a compliance score of ${score}%. The organization lacks fundamental security controls and is at significant risk. Immediate action is required to address ${criticalCount} critical gaps. A complete security overhaul is recommended before this environment is used for production workloads or compliance activities.`;
}

export function calculateAIScore(audit: Audit): AIScoreResult {
  const systemResult = calculateSystemDataScore(audit);
  const questionnaireResult = calculateQuestionnaireScore(audit);

  const allGaps = [...systemResult.gaps, ...questionnaireResult.gaps]
    .sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 10);

  const complianceScore = calculateOverallScore(
    systemResult.score,
    questionnaireResult.categoryScores
  );

  const riskLevel = determineRiskLevel(complianceScore);
  const auditReadiness = determineAuditReadiness(complianceScore);
  const recommendations = generateRecommendations(
    allGaps,
    complianceScore,
    questionnaireResult.categoryScores
  );
  const summary = generateSummary(
    complianceScore,
    riskLevel,
    allGaps,
    questionnaireResult.categoryScores
  );

  return {
    complianceScore,
    riskLevel,
    auditReadiness,
    categoryScores: questionnaireResult.categoryScores,
    controlGaps: allGaps,
    recommendations,
    summary,
    scoredAt: new Date().toISOString(),
  };
}
