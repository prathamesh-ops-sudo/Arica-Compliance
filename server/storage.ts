import { randomUUID } from "crypto";
import type {
  Audit,
  SystemData,
  QuestionnaireSubmission,
  AIScoreResult,
  AuditStatusType,
} from "@shared/schema";
import { AuditStatus } from "@shared/schema";

export interface UnlockResult {
  audit?: Audit;
  error?: string;
}

export interface IStorage {
  createAudit(): Promise<Audit>;
  getAudit(id: string): Promise<Audit | undefined>;
  getAllAudits(): Promise<Audit[]>;
  updateAuditStatus(id: string, status: AuditStatusType): Promise<Audit | undefined>;
  uploadSystemData(id: string, systemData: SystemData): Promise<Audit | undefined>;
  submitQuestionnaire(id: string, questionnaire: QuestionnaireSubmission): Promise<Audit | undefined>;
  unlockAudit(id: string, paymentReference?: string, paidAmount?: number): Promise<UnlockResult>;
  setAIScore(id: string, aiScore: AIScoreResult): Promise<Audit | undefined>;
}

export class MemStorage implements IStorage {
  private audits: Map<string, Audit>;

  constructor() {
    this.audits = new Map();
    this.seedDemoData();
  }

  private seedDemoData() {
    const demoAudits: Audit[] = [
      {
        id: "demo-001-abcd1234",
        status: AuditStatus.LOCKED,
        systemData: {
          osName: "Windows 11 Pro",
          osVersion: "22H2",
          osPlatform: "win32",
          firewallEnabled: true,
          firewallStatus: "Active",
          antivirusInstalled: true,
          antivirusName: "Windows Defender",
          antivirusStatus: "Real-time protection enabled",
          diskEncryptionEnabled: true,
          diskEncryptionMethod: "BitLocker",
          userAccounts: [
            { username: "admin", isAdmin: true, lastLogin: new Date(Date.now() - 86400000).toISOString() },
            { username: "jsmith", isAdmin: false, lastLogin: new Date(Date.now() - 172800000).toISOString() },
            { username: "mjones", isAdmin: false, lastLogin: new Date(Date.now() - 259200000).toISOString() },
          ],
          collectedAt: new Date(Date.now() - 604800000).toISOString(),
        },
        createdAt: new Date(Date.now() - 604800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "demo-002-efgh5678",
        status: AuditStatus.REPORT_READY,
        systemData: {
          osName: "macOS Sonoma",
          osVersion: "14.2",
          osPlatform: "darwin",
          firewallEnabled: true,
          firewallStatus: "Enabled",
          antivirusInstalled: true,
          antivirusName: "CrowdStrike Falcon",
          antivirusStatus: "Active",
          diskEncryptionEnabled: true,
          diskEncryptionMethod: "FileVault",
          userAccounts: [
            { username: "root", isAdmin: true, lastLogin: new Date(Date.now() - 3600000).toISOString() },
            { username: "developer", isAdmin: false, lastLogin: new Date(Date.now() - 7200000).toISOString() },
          ],
          collectedAt: new Date(Date.now() - 172800000).toISOString(),
        },
        questionnaire: {
          answers: [
            { questionId: "AC-001", category: "ACCESS_CONTROL", question: "Do you have a formal access control policy in place?", answer: "YES" },
            { questionId: "AC-002", category: "ACCESS_CONTROL", question: "Are user access rights reviewed at least quarterly?", answer: "PARTIAL", notes: "Semi-annual reviews" },
            { questionId: "AC-003", category: "ACCESS_CONTROL", question: "Is multi-factor authentication enforced for all privileged accounts?", answer: "YES" },
            { questionId: "RM-001", category: "RISK_MANAGEMENT", question: "Do you conduct formal risk assessments at least annually?", answer: "YES" },
            { questionId: "IR-001", category: "INCIDENT_RESPONSE", question: "Do you have a documented incident response plan?", answer: "YES" },
            { questionId: "BC-001", category: "BUSINESS_CONTINUITY", question: "Do you have a documented business continuity plan?", answer: "PARTIAL" },
          ],
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        aiScore: {
          complianceScore: 78,
          riskLevel: "MEDIUM",
          auditReadiness: "NEEDS_IMPROVEMENT",
          categoryScores: {
            ACCESS_CONTROL: 85,
            ASSET_MANAGEMENT: 70,
            RISK_MANAGEMENT: 80,
            INCIDENT_RESPONSE: 75,
            BUSINESS_CONTINUITY: 72,
          },
          controlGaps: [
            {
              category: "ACCESS_CONTROL",
              controlName: "Quarterly Access Reviews",
              severity: "MEDIUM",
              description: "User access rights are reviewed semi-annually instead of quarterly",
              recommendation: "Implement quarterly access review process with automated reminders",
            },
            {
              category: "BUSINESS_CONTINUITY",
              controlName: "BCP Documentation",
              severity: "MEDIUM",
              description: "Business continuity plan exists but is incomplete",
              recommendation: "Complete BCP documentation including recovery procedures and contact lists",
            },
            {
              category: "ASSET_MANAGEMENT",
              controlName: "Asset Inventory",
              severity: "LOW",
              description: "Asset inventory exists but lacks automated discovery",
              recommendation: "Implement automated asset discovery and inventory management tools",
            },
          ],
          recommendations: [
            "Increase access review frequency from semi-annual to quarterly to meet compliance requirements",
            "Complete and formalize business continuity documentation with specific recovery time objectives",
            "Implement automated asset discovery tools to maintain accurate inventory",
            "Consider third-party penetration testing to validate security controls",
            "Document incident response runbooks for common security scenarios",
          ],
          summary: "The organization demonstrates a solid security foundation with room for improvement in access management and business continuity planning. Key strengths include MFA enforcement and active endpoint protection. Priority should be given to increasing access review frequency and completing business continuity documentation.",
          scoredAt: new Date(Date.now() - 43200000).toISOString(),
        },
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
        unlockedAt: new Date(Date.now() - 129600000).toISOString(),
        paidAmount: 499,
        paymentReference: "PAY-2024-00123",
      },
      {
        id: "demo-003-ijkl9012",
        status: AuditStatus.PAID,
        systemData: {
          osName: "Windows 10 Pro",
          osVersion: "21H2",
          osPlatform: "win32",
          firewallEnabled: true,
          firewallStatus: "Active",
          antivirusInstalled: true,
          antivirusName: "Symantec Endpoint",
          antivirusStatus: "Active",
          diskEncryptionEnabled: false,
          userAccounts: [
            { username: "admin", isAdmin: true },
            { username: "service_acct", isAdmin: false },
          ],
          collectedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        unlockedAt: new Date().toISOString(),
        paidAmount: 299,
        paymentReference: "PAY-2024-00456",
      },
      {
        id: "demo-004-mnop3456",
        status: AuditStatus.REPORT_READY,
        systemData: {
          osName: "Ubuntu Server",
          osVersion: "22.04 LTS",
          osPlatform: "linux",
          firewallEnabled: false,
          firewallStatus: "Disabled",
          antivirusInstalled: false,
          antivirusStatus: "Not installed",
          diskEncryptionEnabled: false,
          userAccounts: [
            { username: "root", isAdmin: true },
            { username: "app_user", isAdmin: false },
          ],
          collectedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        aiScore: {
          complianceScore: 42,
          riskLevel: "HIGH",
          auditReadiness: "NOT_READY",
          categoryScores: {
            ACCESS_CONTROL: 50,
            ASSET_MANAGEMENT: 40,
            RISK_MANAGEMENT: 35,
            INCIDENT_RESPONSE: 45,
            BUSINESS_CONTINUITY: 40,
          },
          controlGaps: [
            {
              category: "ACCESS_CONTROL",
              controlName: "Firewall Protection",
              severity: "CRITICAL",
              description: "Host firewall is disabled leaving system exposed",
              recommendation: "Enable and configure host-based firewall immediately",
            },
            {
              category: "ASSET_MANAGEMENT",
              controlName: "Disk Encryption",
              severity: "HIGH",
              description: "No disk encryption configured for data at rest",
              recommendation: "Implement full disk encryption using LUKS or similar",
            },
            {
              category: "ACCESS_CONTROL",
              controlName: "Antivirus Protection",
              severity: "HIGH",
              description: "No antivirus or endpoint protection installed",
              recommendation: "Deploy endpoint protection solution immediately",
            },
          ],
          recommendations: [
            "URGENT: Enable host-based firewall and configure appropriate rules",
            "URGENT: Install and configure endpoint protection software",
            "Implement full disk encryption for all storage volumes",
            "Establish formal security policies and procedures",
            "Conduct security awareness training for all users",
          ],
          summary: "Critical security gaps identified. The system lacks basic security controls including firewall protection, antivirus software, and disk encryption. Immediate remediation is required before this environment can be considered for production use or compliance certification.",
          scoredAt: new Date(Date.now() - 21600000).toISOString(),
        },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 21600000).toISOString(),
      },
    ];

    for (const audit of demoAudits) {
      this.audits.set(audit.id, audit);
    }
  }

  async createAudit(): Promise<Audit> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const audit: Audit = {
      id,
      status: AuditStatus.CREATED,
      createdAt: now,
      updatedAt: now,
    };
    this.audits.set(id, audit);
    return audit;
  }

  async getAudit(id: string): Promise<Audit | undefined> {
    return this.audits.get(id);
  }

  async getAllAudits(): Promise<Audit[]> {
    return Array.from(this.audits.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateAuditStatus(id: string, status: AuditStatusType): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit) return undefined;

    audit.status = status;
    audit.updatedAt = new Date().toISOString();
    this.audits.set(id, audit);
    return audit;
  }

  async uploadSystemData(id: string, systemData: SystemData): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit) return undefined;

    audit.systemData = systemData;
    audit.status = AuditStatus.LOCKED;
    audit.updatedAt = new Date().toISOString();
    this.audits.set(id, audit);
    return audit;
  }

  async submitQuestionnaire(id: string, questionnaire: QuestionnaireSubmission): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit) return undefined;

    audit.questionnaire = questionnaire;
    audit.updatedAt = new Date().toISOString();
    this.audits.set(id, audit);
    return audit;
  }

  async unlockAudit(id: string, paymentReference?: string, paidAmount?: number): Promise<UnlockResult> {
    const audit = this.audits.get(id);
    if (!audit) return { error: "Audit not found" };

    if (audit.status !== AuditStatus.LOCKED) {
      return { error: `Cannot unlock audit in ${audit.status} status. Audit must be in LOCKED status.` };
    }

    audit.status = AuditStatus.PAID;
    audit.unlockedAt = new Date().toISOString();
    audit.paymentReference = paymentReference;
    audit.paidAmount = paidAmount;
    audit.updatedAt = new Date().toISOString();
    this.audits.set(id, audit);
    return { audit };
  }

  async setAIScore(id: string, aiScore: AIScoreResult): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit) return undefined;

    if (audit.status !== AuditStatus.PAID && audit.status !== AuditStatus.AI_PROCESSED && audit.status !== AuditStatus.REPORT_READY) {
      return undefined;
    }

    audit.aiScore = aiScore;
    audit.status = AuditStatus.REPORT_READY;
    audit.updatedAt = new Date().toISOString();
    this.audits.set(id, audit);
    return audit;
  }
}

export const storage = new MemStorage();
