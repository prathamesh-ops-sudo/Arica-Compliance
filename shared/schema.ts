import { z } from "zod";

// Audit Status Enum
export const AuditStatus = {
  CREATED: "CREATED",
  LOCKED: "LOCKED",
  PAID: "PAID",
  AI_PROCESSED: "AI_PROCESSED",
  REPORT_READY: "REPORT_READY",
} as const;

export type AuditStatusType = (typeof AuditStatus)[keyof typeof AuditStatus];

// Risk Level Enum
export const RiskLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

export type RiskLevelType = (typeof RiskLevel)[keyof typeof RiskLevel];

// Questionnaire Categories
export const QuestionnaireCategory = {
  ACCESS_CONTROL: "ACCESS_CONTROL",
  ASSET_MANAGEMENT: "ASSET_MANAGEMENT",
  RISK_MANAGEMENT: "RISK_MANAGEMENT",
  INCIDENT_RESPONSE: "INCIDENT_RESPONSE",
  BUSINESS_CONTINUITY: "BUSINESS_CONTINUITY",
} as const;

export type QuestionnaireCategoryType = (typeof QuestionnaireCategory)[keyof typeof QuestionnaireCategory];

// System Data Schema (collected by desktop agent)
export const systemDataSchema = z.object({
  osName: z.string(),
  osVersion: z.string(),
  osPlatform: z.string(),
  firewallEnabled: z.boolean(),
  firewallStatus: z.string(),
  antivirusInstalled: z.boolean(),
  antivirusName: z.string().optional(),
  antivirusStatus: z.string(),
  diskEncryptionEnabled: z.boolean(),
  diskEncryptionMethod: z.string().optional(),
  userAccounts: z.array(z.object({
    username: z.string(),
    isAdmin: z.boolean(),
    lastLogin: z.string().optional(),
  })),
  installedSoftware: z.array(z.object({
    name: z.string(),
    version: z.string().optional(),
  })).optional(),
  networkInfo: z.object({
    hostname: z.string(),
    ipAddresses: z.array(z.string()),
  }).optional(),
  collectedAt: z.string(),
});

export type SystemData = z.infer<typeof systemDataSchema>;

// Questionnaire Answer Schema
export const questionnaireAnswerSchema = z.object({
  questionId: z.string(),
  category: z.nativeEnum(QuestionnaireCategory),
  question: z.string(),
  answer: z.enum(["YES", "NO", "PARTIAL", "NA"]),
  notes: z.string().optional(),
});

export type QuestionnaireAnswer = z.infer<typeof questionnaireAnswerSchema>;

// Questionnaire Submission Schema
export const questionnaireSubmissionSchema = z.object({
  answers: z.array(questionnaireAnswerSchema),
  submittedAt: z.string(),
});

export type QuestionnaireSubmission = z.infer<typeof questionnaireSubmissionSchema>;

// Control Gap Schema
export const controlGapSchema = z.object({
  category: z.nativeEnum(QuestionnaireCategory),
  controlName: z.string(),
  severity: z.nativeEnum(RiskLevel),
  description: z.string(),
  recommendation: z.string(),
});

export type ControlGap = z.infer<typeof controlGapSchema>;

// AI Score Result Schema
export const aiScoreResultSchema = z.object({
  complianceScore: z.number().min(0).max(100),
  riskLevel: z.nativeEnum(RiskLevel),
  auditReadiness: z.enum(["READY", "NEEDS_IMPROVEMENT", "NOT_READY"]),
  categoryScores: z.record(z.nativeEnum(QuestionnaireCategory), z.number()),
  controlGaps: z.array(controlGapSchema),
  recommendations: z.array(z.string()),
  summary: z.string(),
  scoredAt: z.string(),
});

export type AIScoreResult = z.infer<typeof aiScoreResultSchema>;

// Full Audit Schema
export const auditSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(AuditStatus),
  systemData: systemDataSchema.optional(),
  questionnaire: questionnaireSubmissionSchema.optional(),
  aiScore: aiScoreResultSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  unlockedAt: z.string().optional(),
  paidAmount: z.number().optional(),
  paymentReference: z.string().optional(),
});

export type Audit = z.infer<typeof auditSchema>;

// API Request/Response Schemas
export const createAuditResponseSchema = z.object({
  auditId: z.string(),
  status: z.nativeEnum(AuditStatus),
  message: z.string(),
});

export type CreateAuditResponse = z.infer<typeof createAuditResponseSchema>;

export const uploadSystemDataRequestSchema = z.object({
  auditId: z.string(),
  systemData: systemDataSchema,
});

export type UploadSystemDataRequest = z.infer<typeof uploadSystemDataRequestSchema>;

export const submitQuestionnaireRequestSchema = z.object({
  auditId: z.string(),
  questionnaire: questionnaireSubmissionSchema,
});

export type SubmitQuestionnaireRequest = z.infer<typeof submitQuestionnaireRequestSchema>;

export const unlockAuditRequestSchema = z.object({
  auditId: z.string(),
  paymentReference: z.string().optional(),
  paidAmount: z.number().optional(),
});

export type UnlockAuditRequest = z.infer<typeof unlockAuditRequestSchema>;

export const auditStatusResponseSchema = z.object({
  auditId: z.string(),
  status: z.nativeEnum(AuditStatus),
  createdAt: z.string(),
  updatedAt: z.string(),
  hasSystemData: z.boolean(),
  hasQuestionnaire: z.boolean(),
  isUnlocked: z.boolean(),
});

export type AuditStatusResponse = z.infer<typeof auditStatusResponseSchema>;

// Admin User Schema
export const adminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
  createdAt: z.string(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

export const insertAdminUserSchema = adminUserSchema.omit({ id: true, createdAt: true });
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

// Legacy user exports for compatibility
export const users = {
  id: "string",
  username: "string",
  password: "string",
};

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };

// Questionnaire Questions Data
export const questionnaireQuestions = [
  // Access Control
  { id: "AC-001", category: QuestionnaireCategory.ACCESS_CONTROL, question: "Do you have a formal access control policy in place?" },
  { id: "AC-002", category: QuestionnaireCategory.ACCESS_CONTROL, question: "Are user access rights reviewed at least quarterly?" },
  { id: "AC-003", category: QuestionnaireCategory.ACCESS_CONTROL, question: "Is multi-factor authentication enforced for all privileged accounts?" },
  { id: "AC-004", category: QuestionnaireCategory.ACCESS_CONTROL, question: "Do you have a process for immediate access revocation upon employee termination?" },
  { id: "AC-005", category: QuestionnaireCategory.ACCESS_CONTROL, question: "Are password policies enforced with complexity requirements?" },
  
  // Asset Management
  { id: "AM-001", category: QuestionnaireCategory.ASSET_MANAGEMENT, question: "Do you maintain an up-to-date inventory of all IT assets?" },
  { id: "AM-002", category: QuestionnaireCategory.ASSET_MANAGEMENT, question: "Are all assets classified according to sensitivity levels?" },
  { id: "AM-003", category: QuestionnaireCategory.ASSET_MANAGEMENT, question: "Is there a formal process for asset disposal and data sanitization?" },
  { id: "AM-004", category: QuestionnaireCategory.ASSET_MANAGEMENT, question: "Are mobile devices and removable media controlled and encrypted?" },
  { id: "AM-005", category: QuestionnaireCategory.ASSET_MANAGEMENT, question: "Do you track software licenses and ensure compliance?" },
  
  // Risk Management
  { id: "RM-001", category: QuestionnaireCategory.RISK_MANAGEMENT, question: "Do you conduct formal risk assessments at least annually?" },
  { id: "RM-002", category: QuestionnaireCategory.RISK_MANAGEMENT, question: "Is there a risk register maintained and regularly updated?" },
  { id: "RM-003", category: QuestionnaireCategory.RISK_MANAGEMENT, question: "Are risk treatment plans documented and tracked?" },
  { id: "RM-004", category: QuestionnaireCategory.RISK_MANAGEMENT, question: "Do you have a vendor risk management program?" },
  { id: "RM-005", category: QuestionnaireCategory.RISK_MANAGEMENT, question: "Are security metrics reported to executive management?" },
  
  // Incident Response
  { id: "IR-001", category: QuestionnaireCategory.INCIDENT_RESPONSE, question: "Do you have a documented incident response plan?" },
  { id: "IR-002", category: QuestionnaireCategory.INCIDENT_RESPONSE, question: "Is the incident response team trained and tested regularly?" },
  { id: "IR-003", category: QuestionnaireCategory.INCIDENT_RESPONSE, question: "Do you have 24/7 security monitoring capabilities?" },
  { id: "IR-004", category: QuestionnaireCategory.INCIDENT_RESPONSE, question: "Are security incidents logged and analyzed for trends?" },
  { id: "IR-005", category: QuestionnaireCategory.INCIDENT_RESPONSE, question: "Do you have breach notification procedures in place?" },
  
  // Business Continuity
  { id: "BC-001", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Do you have a documented business continuity plan?" },
  { id: "BC-002", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Are critical systems backed up with defined RPO/RTO targets?" },
  { id: "BC-003", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Do you test disaster recovery procedures at least annually?" },
  { id: "BC-004", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Is there an alternate processing site or cloud-based failover?" },
  { id: "BC-005", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Are business impact analyses conducted and updated regularly?" },
];
