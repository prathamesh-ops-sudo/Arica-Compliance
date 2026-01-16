import { z } from "zod";

// Audit Status Enum
export const AuditStatus = {
  CREATED: "CREATED",
  LOCKED: "LOCKED",
  PAID: "PAID",
  AI_PROCESSED: "AI_PROCESSED",
  REPORT_READY: "REPORT_READY",
} as const;

// Compliance Framework Enum
export const ComplianceFramework = {
  GENERIC: "GENERIC",
  ISO_27001: "ISO_27001",
  ISO_27002: "ISO_27002",
} as const;

export type ComplianceFrameworkType = (typeof ComplianceFramework)[keyof typeof ComplianceFramework];

// ISO 27001/27002 Control Themes (2022 version - 4 themes, 93 controls)
export const ISOControlTheme = {
  ORGANIZATIONAL: "ORGANIZATIONAL",  // A.5 - 37 controls
  PEOPLE: "PEOPLE",                  // A.6 - 8 controls
  PHYSICAL: "PHYSICAL",              // A.7 - 14 controls
  TECHNOLOGICAL: "TECHNOLOGICAL",    // A.8 - 34 controls
} as const;

export type ISOControlThemeType = (typeof ISOControlTheme)[keyof typeof ISOControlTheme];

// Control Compliance Status
export const ControlStatus = {
  COMPLIANT: "COMPLIANT",
  PARTIAL: "PARTIAL",
  NON_COMPLIANT: "NON_COMPLIANT",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export type ControlStatusType = (typeof ControlStatus)[keyof typeof ControlStatus];

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

// ISO Control Finding Schema
export const isoControlFindingSchema = z.object({
  controlId: z.string(),           // e.g., "A.5.1", "A.8.24"
  controlName: z.string(),
  theme: z.nativeEnum(ISOControlTheme),
  status: z.nativeEnum(ControlStatus),
  evidenceSource: z.enum(["SYSTEM_DATA", "QUESTIONNAIRE", "BOTH", "NONE"]),
  description: z.string(),
  recommendation: z.string().optional(),
  clauseReference: z.string().optional(),  // ISO clause reference
});

export type ISOControlFinding = z.infer<typeof isoControlFindingSchema>;

// ISO Compliance Result Schema
export const isoComplianceResultSchema = z.object({
  framework: z.nativeEnum(ComplianceFramework),
  overallScore: z.number().min(0).max(100),
  themeScores: z.object({
    ORGANIZATIONAL: z.number().min(0).max(100),
    PEOPLE: z.number().min(0).max(100),
    PHYSICAL: z.number().min(0).max(100),
    TECHNOLOGICAL: z.number().min(0).max(100),
  }),
  maturityLevel: z.enum(["INITIAL", "DEVELOPING", "DEFINED", "MANAGED", "OPTIMIZING"]),
  controlFindings: z.array(isoControlFindingSchema),
  compliantControls: z.number(),
  partialControls: z.number(),
  nonCompliantControls: z.number(),
  notApplicableControls: z.number(),
  totalControls: z.number(),
  certificationReadiness: z.enum(["READY", "NEAR_READY", "NEEDS_WORK", "NOT_READY"]),
  recommendations: z.array(z.string()),
  summary: z.string(),
});

export type ISOComplianceResult = z.infer<typeof isoComplianceResultSchema>;

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
  // ISO 27001/27002 Compliance Results
  isoCompliance: isoComplianceResultSchema.optional(),
});

export type AIScoreResult = z.infer<typeof aiScoreResultSchema>;

// Full Audit Schema
export const auditSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(AuditStatus),
  framework: z.nativeEnum(ComplianceFramework).optional().default("ISO_27001"),
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
  { id: "BC-001", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Do you have a documented business continuity plan?", isoControls: ["A.5.29", "A.5.30"] },
  { id: "BC-002", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Are critical systems backed up with defined RPO/RTO targets?", isoControls: ["A.8.13", "A.8.14"] },
  { id: "BC-003", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Do you test disaster recovery procedures at least annually?", isoControls: ["A.5.30"] },
  { id: "BC-004", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Is there an alternate processing site or cloud-based failover?", isoControls: ["A.8.14"] },
  { id: "BC-005", category: QuestionnaireCategory.BUSINESS_CONTINUITY, question: "Are business impact analyses conducted and updated regularly?", isoControls: ["A.5.29"] },
];

// ISO 27001:2022 / ISO 27002:2022 Controls Taxonomy
// Organized by 4 themes: Organizational (A.5), People (A.6), Physical (A.7), Technological (A.8)
export interface ISOControl {
  id: string;
  name: string;
  theme: ISOControlThemeType;
  description: string;
  evidenceType: "SYSTEM_DATA" | "QUESTIONNAIRE" | "BOTH" | "MANUAL";
  systemDataKey?: string;
  questionIds?: string[];
}

export const ISO_27001_CONTROLS: ISOControl[] = [
  // A.5 - ORGANIZATIONAL CONTROLS (Key controls - 37 total, showing key ones)
  { id: "A.5.1", name: "Policies for information security", theme: ISOControlTheme.ORGANIZATIONAL, description: "Information security policy and topic-specific policies", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-001", "RM-001"] },
  { id: "A.5.2", name: "Information security roles and responsibilities", theme: ISOControlTheme.ORGANIZATIONAL, description: "Define and allocate information security responsibilities", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-002"] },
  { id: "A.5.3", name: "Segregation of duties", theme: ISOControlTheme.ORGANIZATIONAL, description: "Conflicting duties and responsibilities shall be segregated", evidenceType: "BOTH", systemDataKey: "userAccounts", questionIds: ["AC-002"] },
  { id: "A.5.4", name: "Management responsibilities", theme: ISOControlTheme.ORGANIZATIONAL, description: "Management shall require personnel to apply security", evidenceType: "QUESTIONNAIRE", questionIds: ["RM-005"] },
  { id: "A.5.7", name: "Threat intelligence", theme: ISOControlTheme.ORGANIZATIONAL, description: "Collect and analyze threat intelligence", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-003", "IR-004"] },
  { id: "A.5.8", name: "Information security in project management", theme: ISOControlTheme.ORGANIZATIONAL, description: "Integrate security into project management", evidenceType: "QUESTIONNAIRE", questionIds: ["RM-003"] },
  { id: "A.5.9", name: "Inventory of information and assets", theme: ISOControlTheme.ORGANIZATIONAL, description: "Develop and maintain asset inventory", evidenceType: "QUESTIONNAIRE", questionIds: ["AM-001", "AM-002"] },
  { id: "A.5.10", name: "Acceptable use of information", theme: ISOControlTheme.ORGANIZATIONAL, description: "Rules for acceptable use of assets", evidenceType: "QUESTIONNAIRE", questionIds: ["AM-004"] },
  { id: "A.5.11", name: "Return of assets", theme: ISOControlTheme.ORGANIZATIONAL, description: "Return assets on termination", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-004", "AM-003"] },
  { id: "A.5.12", name: "Classification of information", theme: ISOControlTheme.ORGANIZATIONAL, description: "Classify information according to security needs", evidenceType: "QUESTIONNAIRE", questionIds: ["AM-002"] },
  { id: "A.5.15", name: "Access control", theme: ISOControlTheme.ORGANIZATIONAL, description: "Rules to control access based on requirements", evidenceType: "BOTH", systemDataKey: "userAccounts", questionIds: ["AC-001", "AC-002"] },
  { id: "A.5.16", name: "Identity management", theme: ISOControlTheme.ORGANIZATIONAL, description: "Manage full lifecycle of identities", evidenceType: "BOTH", systemDataKey: "userAccounts", questionIds: ["AC-004"] },
  { id: "A.5.17", name: "Authentication information", theme: ISOControlTheme.ORGANIZATIONAL, description: "Manage authentication information allocation", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-003", "AC-005"] },
  { id: "A.5.18", name: "Access rights", theme: ISOControlTheme.ORGANIZATIONAL, description: "Provision and revoke access rights", evidenceType: "BOTH", systemDataKey: "userAccounts", questionIds: ["AC-002", "AC-004"] },
  { id: "A.5.19", name: "Information security in supplier relationships", theme: ISOControlTheme.ORGANIZATIONAL, description: "Manage supplier security risks", evidenceType: "QUESTIONNAIRE", questionIds: ["RM-004"] },
  { id: "A.5.23", name: "Information security for cloud services", theme: ISOControlTheme.ORGANIZATIONAL, description: "Manage security of cloud service use", evidenceType: "QUESTIONNAIRE", questionIds: ["BC-004"] },
  { id: "A.5.24", name: "Incident management planning", theme: ISOControlTheme.ORGANIZATIONAL, description: "Plan and prepare for incident management", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-001", "IR-002"] },
  { id: "A.5.25", name: "Assessment of information security events", theme: ISOControlTheme.ORGANIZATIONAL, description: "Assess and decide on security events", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-004"] },
  { id: "A.5.26", name: "Response to information security incidents", theme: ISOControlTheme.ORGANIZATIONAL, description: "Respond to incidents per procedures", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-001", "IR-002"] },
  { id: "A.5.27", name: "Learning from incidents", theme: ISOControlTheme.ORGANIZATIONAL, description: "Use incident knowledge to reduce likelihood", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-004"] },
  { id: "A.5.28", name: "Collection of evidence", theme: ISOControlTheme.ORGANIZATIONAL, description: "Procedures for evidence collection", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-004", "IR-005"] },
  { id: "A.5.29", name: "Information security during disruption", theme: ISOControlTheme.ORGANIZATIONAL, description: "Maintain security during disruptions", evidenceType: "QUESTIONNAIRE", questionIds: ["BC-001", "BC-005"] },
  { id: "A.5.30", name: "ICT readiness for business continuity", theme: ISOControlTheme.ORGANIZATIONAL, description: "Ensure ICT readiness for continuity", evidenceType: "QUESTIONNAIRE", questionIds: ["BC-001", "BC-002", "BC-003"] },
  { id: "A.5.31", name: "Legal and regulatory requirements", theme: ISOControlTheme.ORGANIZATIONAL, description: "Identify and document legal requirements", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-005"] },
  { id: "A.5.36", name: "Compliance with security policies", theme: ISOControlTheme.ORGANIZATIONAL, description: "Regularly review compliance with policies", evidenceType: "QUESTIONNAIRE", questionIds: ["RM-001", "RM-002"] },
  
  // A.6 - PEOPLE CONTROLS (8 controls)
  { id: "A.6.1", name: "Screening", theme: ISOControlTheme.PEOPLE, description: "Background verification checks", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-002"] },
  { id: "A.6.2", name: "Terms and conditions of employment", theme: ISOControlTheme.PEOPLE, description: "Employment agreements with security responsibilities", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-001"] },
  { id: "A.6.3", name: "Information security awareness and training", theme: ISOControlTheme.PEOPLE, description: "Security awareness training program", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-002"] },
  { id: "A.6.4", name: "Disciplinary process", theme: ISOControlTheme.PEOPLE, description: "Process for security policy violations", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-001"] },
  { id: "A.6.5", name: "Responsibilities after termination", theme: ISOControlTheme.PEOPLE, description: "Security responsibilities after termination", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-004"] },
  { id: "A.6.6", name: "Confidentiality agreements", theme: ISOControlTheme.PEOPLE, description: "NDAs and confidentiality requirements", evidenceType: "QUESTIONNAIRE", questionIds: ["RM-004"] },
  { id: "A.6.7", name: "Remote working", theme: ISOControlTheme.PEOPLE, description: "Security measures for remote working", evidenceType: "BOTH", systemDataKey: "networkInfo", questionIds: ["AM-004"] },
  { id: "A.6.8", name: "Information security event reporting", theme: ISOControlTheme.PEOPLE, description: "Mechanisms for reporting security events", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-001", "IR-005"] },
  
  // A.7 - PHYSICAL CONTROLS (14 controls - key ones)
  { id: "A.7.1", name: "Physical security perimeters", theme: ISOControlTheme.PHYSICAL, description: "Define and protect physical security perimeters", evidenceType: "QUESTIONNAIRE", questionIds: ["AM-001"] },
  { id: "A.7.2", name: "Physical entry", theme: ISOControlTheme.PHYSICAL, description: "Secure areas protected by entry controls", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-001"] },
  { id: "A.7.4", name: "Physical security monitoring", theme: ISOControlTheme.PHYSICAL, description: "Premises monitored for unauthorized access", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-003"] },
  { id: "A.7.8", name: "Equipment siting and protection", theme: ISOControlTheme.PHYSICAL, description: "Equipment sited to reduce risks", evidenceType: "QUESTIONNAIRE", questionIds: ["AM-001"] },
  { id: "A.7.9", name: "Security of assets off-premises", theme: ISOControlTheme.PHYSICAL, description: "Protect off-site assets", evidenceType: "QUESTIONNAIRE", questionIds: ["AM-004"] },
  { id: "A.7.10", name: "Storage media", theme: ISOControlTheme.PHYSICAL, description: "Manage storage media throughout lifecycle", evidenceType: "QUESTIONNAIRE", questionIds: ["AM-003", "AM-004"] },
  { id: "A.7.14", name: "Secure disposal or re-use of equipment", theme: ISOControlTheme.PHYSICAL, description: "Securely dispose or reuse equipment", evidenceType: "QUESTIONNAIRE", questionIds: ["AM-003"] },
  
  // A.8 - TECHNOLOGICAL CONTROLS (34 controls - key ones with system data mapping)
  { id: "A.8.1", name: "User endpoint devices", theme: ISOControlTheme.TECHNOLOGICAL, description: "Protect information on endpoint devices", evidenceType: "BOTH", systemDataKey: "diskEncryptionEnabled", questionIds: ["AM-004"] },
  { id: "A.8.2", name: "Privileged access rights", theme: ISOControlTheme.TECHNOLOGICAL, description: "Restrict and manage privileged access", evidenceType: "SYSTEM_DATA", systemDataKey: "userAccounts" },
  { id: "A.8.3", name: "Information access restriction", theme: ISOControlTheme.TECHNOLOGICAL, description: "Restrict access per access control policy", evidenceType: "BOTH", systemDataKey: "userAccounts", questionIds: ["AC-001", "AC-002"] },
  { id: "A.8.5", name: "Secure authentication", theme: ISOControlTheme.TECHNOLOGICAL, description: "Implement secure authentication technologies", evidenceType: "QUESTIONNAIRE", questionIds: ["AC-003", "AC-005"] },
  { id: "A.8.7", name: "Protection against malware", theme: ISOControlTheme.TECHNOLOGICAL, description: "Implement malware protection", evidenceType: "SYSTEM_DATA", systemDataKey: "antivirusInstalled" },
  { id: "A.8.8", name: "Management of technical vulnerabilities", theme: ISOControlTheme.TECHNOLOGICAL, description: "Obtain information about vulnerabilities and take action", evidenceType: "BOTH", systemDataKey: "installedSoftware", questionIds: ["AM-005"] },
  { id: "A.8.9", name: "Configuration management", theme: ISOControlTheme.TECHNOLOGICAL, description: "Manage configurations including security", evidenceType: "SYSTEM_DATA", systemDataKey: "osPlatform" },
  { id: "A.8.13", name: "Information backup", theme: ISOControlTheme.TECHNOLOGICAL, description: "Maintain and test backup copies", evidenceType: "QUESTIONNAIRE", questionIds: ["BC-002"] },
  { id: "A.8.14", name: "Redundancy of information processing facilities", theme: ISOControlTheme.TECHNOLOGICAL, description: "Implement redundancy for availability", evidenceType: "QUESTIONNAIRE", questionIds: ["BC-003", "BC-004"] },
  { id: "A.8.15", name: "Logging", theme: ISOControlTheme.TECHNOLOGICAL, description: "Produce and protect logs of activities", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-003", "IR-004"] },
  { id: "A.8.16", name: "Monitoring activities", theme: ISOControlTheme.TECHNOLOGICAL, description: "Monitor networks and systems for anomalous behavior", evidenceType: "QUESTIONNAIRE", questionIds: ["IR-003"] },
  { id: "A.8.20", name: "Networks security", theme: ISOControlTheme.TECHNOLOGICAL, description: "Secure and control networks", evidenceType: "SYSTEM_DATA", systemDataKey: "firewallEnabled" },
  { id: "A.8.21", name: "Security of network services", theme: ISOControlTheme.TECHNOLOGICAL, description: "Identify and implement security mechanisms for network services", evidenceType: "BOTH", systemDataKey: "firewallEnabled", questionIds: ["AC-001"] },
  { id: "A.8.24", name: "Use of cryptography", theme: ISOControlTheme.TECHNOLOGICAL, description: "Define and implement rules for cryptography", evidenceType: "BOTH", systemDataKey: "diskEncryptionEnabled", questionIds: ["AM-004"] },
  { id: "A.8.32", name: "Change management", theme: ISOControlTheme.TECHNOLOGICAL, description: "Subject changes to change management procedures", evidenceType: "QUESTIONNAIRE", questionIds: ["RM-003"] },
  { id: "A.8.34", name: "Protection of information systems during audit testing", theme: ISOControlTheme.TECHNOLOGICAL, description: "Plan and agree audit tests", evidenceType: "QUESTIONNAIRE", questionIds: ["RM-001"] },
];
