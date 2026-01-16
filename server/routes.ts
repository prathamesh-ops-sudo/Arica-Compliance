import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculateAIScore } from "./services/ai-scoring";
import {
  uploadSystemDataRequestSchema,
  submitQuestionnaireRequestSchema,
  unlockAuditRequestSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Health check endpoint for App Runner
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.post("/api/audit/create", async (req, res) => {
    try {
      const audit = await storage.createAudit();
      res.json({
        auditId: audit.id,
        status: audit.status,
        message: "Audit created successfully. Use this ID to upload system data.",
      });
    } catch (error) {
      console.error("Error creating audit:", error);
      res.status(500).json({ error: "Failed to create audit" });
    }
  });

  app.get("/api/audit/list", async (req, res) => {
    try {
      const audits = await storage.getAllAudits();
      res.json(audits);
    } catch (error) {
      console.error("Error listing audits:", error);
      res.status(500).json({ error: "Failed to list audits" });
    }
  });

  app.get("/api/audit/status/:auditId", async (req, res) => {
    try {
      const { auditId } = req.params;
      
      if (auditId.length < 8) {
        return res.status(400).json({ 
          error: "Invalid Audit ID",
          message: "Audit ID must be at least 8 characters."
        });
      }
      
      const searchId = auditId.toLowerCase();
      
      let audit = await storage.getAudit(auditId);
      
      if (!audit) {
        const allAudits = await storage.getAllAudits();
        audit = allAudits.find(a => {
          const storedId = a.id.toLowerCase();
          return storedId === searchId || 
                 storedId.startsWith(searchId) ||
                 storedId.slice(0, 8) === searchId.slice(0, 8);
        });
      }

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      res.json({
        auditId: audit.id,
        status: audit.status,
        createdAt: audit.createdAt,
        updatedAt: audit.updatedAt,
        hasSystemData: !!audit.systemData,
        hasQuestionnaire: !!audit.questionnaire,
        isUnlocked: !!audit.unlockedAt,
      });
    } catch (error) {
      console.error("Error getting audit status:", error);
      res.status(500).json({ error: "Failed to get audit status" });
    }
  });

  app.get("/api/audit/report/:auditId", async (req, res) => {
    try {
      const { auditId } = req.params;
      const audit = await storage.getAudit(auditId);

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      if (audit.status === "LOCKED" || audit.status === "CREATED") {
        return res.status(403).json({ 
          error: "Report is locked",
          message: "This audit report is locked. Please complete payment to access." 
        });
      }

      res.json(audit);
    } catch (error) {
      console.error("Error getting audit report:", error);
      res.status(500).json({ error: "Failed to get audit report" });
    }
  });

  app.post("/api/audit/upload-system-data", async (req, res) => {
    try {
      const parsed = uploadSystemDataRequestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: parsed.error.errors 
        });
      }

      const { auditId, systemData } = parsed.data;
      const audit = await storage.uploadSystemData(auditId, systemData);

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      res.json({
        auditId: audit.id,
        status: audit.status,
        message: "System data uploaded successfully. Audit is now locked pending payment.",
      });
    } catch (error) {
      console.error("Error uploading system data:", error);
      res.status(500).json({ error: "Failed to upload system data" });
    }
  });

  app.post("/api/audit/submit-questionnaire", async (req, res) => {
    try {
      const parsed = submitQuestionnaireRequestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: parsed.error.errors 
        });
      }

      const { auditId, questionnaire } = parsed.data;
      const audit = await storage.submitQuestionnaire(auditId, questionnaire);

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      res.json({
        auditId: audit.id,
        status: audit.status,
        message: "Questionnaire submitted successfully.",
        answersReceived: questionnaire.answers.length,
      });
    } catch (error) {
      console.error("Error submitting questionnaire:", error);
      res.status(500).json({ error: "Failed to submit questionnaire" });
    }
  });

  app.post("/api/audit/unlock", async (req, res) => {
    try {
      const parsed = unlockAuditRequestSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: parsed.error.errors 
        });
      }

      const { auditId, paymentReference, paidAmount } = parsed.data;
      const result = await storage.unlockAudit(auditId, paymentReference, paidAmount);

      if (result.error) {
        const statusCode = result.error.includes("not found") ? 404 : 409;
        return res.status(statusCode).json({ error: result.error });
      }

      if (!result.audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      res.json({
        auditId: result.audit.id,
        status: result.audit.status,
        message: "Audit unlocked successfully. You can now run AI scoring.",
        unlockedAt: result.audit.unlockedAt,
      });
    } catch (error) {
      console.error("Error unlocking audit:", error);
      res.status(500).json({ error: "Failed to unlock audit" });
    }
  });

  app.post("/api/audit/run-ai-score", async (req, res) => {
    try {
      const { auditId } = req.body;

      if (!auditId) {
        return res.status(400).json({ error: "auditId is required" });
      }

      const audit = await storage.getAudit(auditId);

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      if (audit.status === "CREATED") {
        return res.status(400).json({ 
          error: "Cannot run AI scoring",
          message: "Audit has no system data. Please upload system data first."
        });
      }

      if (audit.status === "LOCKED") {
        return res.status(400).json({ 
          error: "Audit is locked",
          message: "Please unlock the audit (complete payment) before running AI scoring."
        });
      }

      if (audit.status === "REPORT_READY") {
        return res.json({
          auditId: audit.id,
          status: audit.status,
          complianceScore: audit.aiScore?.complianceScore,
          riskLevel: audit.aiScore?.riskLevel,
          auditReadiness: audit.aiScore?.auditReadiness,
          message: "Report is already ready.",
        });
      }

      await storage.updateAuditStatus(auditId, "AI_PROCESSED");

      const aiScore = calculateAIScore(audit);
      const updatedAudit = await storage.setAIScore(auditId, aiScore);

      res.json({
        auditId: updatedAudit?.id,
        status: updatedAudit?.status,
        complianceScore: aiScore.complianceScore,
        riskLevel: aiScore.riskLevel,
        auditReadiness: aiScore.auditReadiness,
        message: "AI scoring completed successfully.",
      });
    } catch (error) {
      console.error("Error running AI score:", error);
      res.status(500).json({ error: "Failed to run AI scoring" });
    }
  });

  app.get("/api/audit/export/pdf/:auditId", async (req, res) => {
    try {
      const { auditId } = req.params;
      const audit = await storage.getAudit(auditId);

      if (!audit) {
        return res.status(404).json({ error: "Audit not found" });
      }

      if (audit.status !== "REPORT_READY") {
        return res.status(403).json({ 
          error: "Report not ready",
          message: "AI scoring must be completed before exporting PDF." 
        });
      }

      const categoryLabels: Record<string, string> = {
        ACCESS_CONTROL: "Access Control",
        ASSET_MANAGEMENT: "Asset Management",
        RISK_MANAGEMENT: "Risk Management",
        INCIDENT_RESPONSE: "Incident Response",
        BUSINESS_CONTINUITY: "Business Continuity",
      };

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Compliance Report - ${audit.id.slice(0, 8).toUpperCase()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, sans-serif; 
      background: #0f172a; 
      color: #e2e8f0; 
      line-height: 1.6;
      padding: 40px;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .header { 
      text-align: center; 
      padding: 40px 0; 
      border-bottom: 1px solid #334155;
      margin-bottom: 40px;
    }
    .logo { 
      font-size: 32px; 
      font-weight: 700; 
      color: #3b82f6;
      margin-bottom: 8px;
    }
    .subtitle { color: #94a3b8; font-size: 14px; }
    .audit-id { 
      font-family: monospace; 
      font-size: 18px; 
      color: #f1f5f9;
      background: #1e293b;
      padding: 8px 16px;
      border-radius: 8px;
      display: inline-block;
      margin-top: 16px;
    }
    .score-section { 
      text-align: center; 
      padding: 40px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 16px;
      border: 1px solid #334155;
      margin-bottom: 32px;
    }
    .score { 
      font-size: 72px; 
      font-weight: 700; 
      color: ${audit.aiScore!.complianceScore >= 80 ? '#22c55e' : audit.aiScore!.complianceScore >= 60 ? '#06b6d4' : audit.aiScore!.complianceScore >= 40 ? '#f59e0b' : '#ef4444'};
    }
    .score-label { color: #94a3b8; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .badges { display: flex; justify-content: center; gap: 16px; margin-top: 24px; flex-wrap: wrap; }
    .badge { 
      padding: 8px 16px; 
      border-radius: 20px; 
      font-size: 13px;
      font-weight: 500;
    }
    .badge-risk { background: ${audit.aiScore!.riskLevel === 'LOW' ? '#22c55e20' : audit.aiScore!.riskLevel === 'MEDIUM' ? '#f59e0b20' : '#ef444420'}; color: ${audit.aiScore!.riskLevel === 'LOW' ? '#22c55e' : audit.aiScore!.riskLevel === 'MEDIUM' ? '#f59e0b' : '#ef4444'}; }
    .badge-readiness { background: ${audit.aiScore!.auditReadiness === 'READY' ? '#22c55e20' : audit.aiScore!.auditReadiness === 'NEEDS_IMPROVEMENT' ? '#f59e0b20' : '#ef444420'}; color: ${audit.aiScore!.auditReadiness === 'READY' ? '#22c55e' : audit.aiScore!.auditReadiness === 'NEEDS_IMPROVEMENT' ? '#f59e0b' : '#ef4444'}; }
    .section { 
      background: #1e293b; 
      border-radius: 12px; 
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #334155;
    }
    .section-title { 
      font-size: 18px; 
      font-weight: 600; 
      color: #f1f5f9;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #334155;
    }
    .summary { color: #cbd5e1; }
    .category-scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; }
    .category-item { 
      background: #0f172a; 
      padding: 16px; 
      border-radius: 8px;
      text-align: center;
    }
    .category-score { font-size: 28px; font-weight: 700; color: #3b82f6; }
    .category-name { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .gap-item { 
      background: #0f172a; 
      padding: 16px; 
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 3px solid;
    }
    .gap-critical { border-left-color: #ef4444; }
    .gap-high { border-left-color: #f59e0b; }
    .gap-medium { border-left-color: #3b82f6; }
    .gap-low { border-left-color: #22c55e; }
    .gap-title { font-weight: 600; color: #f1f5f9; margin-bottom: 4px; }
    .gap-desc { font-size: 14px; color: #94a3b8; margin-bottom: 8px; }
    .gap-rec { font-size: 13px; color: #06b6d4; }
    .rec-item { 
      display: flex; 
      align-items: flex-start; 
      gap: 12px;
      padding: 12px;
      background: #0f172a;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .rec-num { 
      width: 24px; 
      height: 24px; 
      background: #3b82f6; 
      color: white; 
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .rec-text { color: #cbd5e1; font-size: 14px; }
    .footer { 
      text-align: center; 
      padding-top: 40px; 
      border-top: 1px solid #334155;
      margin-top: 40px;
      color: #64748b;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Project Sentinel</div>
      <div class="subtitle">AI-Powered Compliance & Audit Report</div>
      <div class="audit-id">Audit ID: ${audit.id.slice(0, 8).toUpperCase()}</div>
    </div>

    <div class="score-section">
      <div class="score-label">Overall Compliance Score</div>
      <div class="score">${audit.aiScore!.complianceScore}</div>
      <div class="badges">
        <span class="badge badge-risk">${audit.aiScore!.riskLevel} Risk</span>
        <span class="badge badge-readiness">${audit.aiScore!.auditReadiness.replace('_', ' ')}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Executive Summary</div>
      <p class="summary">${audit.aiScore!.summary}</p>
    </div>

    <div class="section">
      <div class="section-title">Category Scores</div>
      <div class="category-scores">
        ${Object.entries(audit.aiScore!.categoryScores).map(([cat, score]) => `
          <div class="category-item">
            <div class="category-score">${score}</div>
            <div class="category-name">${categoryLabels[cat]}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Control Gaps Identified</div>
      ${audit.aiScore!.controlGaps.map(gap => `
        <div class="gap-item gap-${gap.severity.toLowerCase()}">
          <div class="gap-title">${gap.controlName}</div>
          <div class="gap-desc">${gap.description}</div>
          <div class="gap-rec">Recommendation: ${gap.recommendation}</div>
        </div>
      `).join('')}
    </div>

    ${audit.aiScore!.isoCompliance ? `
    <div class="section">
      <div class="section-title">ISO 27001:2022 Compliance Assessment</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
        <div class="category-item">
          <div class="category-score" style="color: ${audit.aiScore!.isoCompliance.overallScore >= 80 ? '#22c55e' : audit.aiScore!.isoCompliance.overallScore >= 60 ? '#f59e0b' : '#ef4444'};">${audit.aiScore!.isoCompliance.overallScore}%</div>
          <div class="category-name">Overall ISO Score</div>
        </div>
        <div class="category-item">
          <div style="font-size: 18px; font-weight: 600; color: #f1f5f9;">${audit.aiScore!.isoCompliance.maturityLevel}</div>
          <div class="category-name">Maturity Level</div>
        </div>
        <div class="category-item">
          <div style="font-size: 18px; font-weight: 600; color: ${audit.aiScore!.isoCompliance.certificationReadiness === 'READY' ? '#22c55e' : audit.aiScore!.isoCompliance.certificationReadiness === 'NEAR_READY' ? '#06b6d4' : '#f59e0b'};">
            ${audit.aiScore!.isoCompliance.certificationReadiness.replace('_', ' ')}
          </div>
          <div class="category-name">Certification Readiness</div>
        </div>
        <div class="category-item">
          <div style="font-size: 18px; font-weight: 600; color: #f1f5f9;">${audit.aiScore!.isoCompliance.totalControls}</div>
          <div class="category-name">Controls Evaluated</div>
        </div>
      </div>
      <div style="margin-bottom: 24px;">
        <h4 style="color: #f1f5f9; margin-bottom: 12px; font-size: 14px;">Theme Compliance</h4>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
          ${Object.entries(audit.aiScore!.isoCompliance.themeScores).map(([theme, score]) => {
            const themeLabels: Record<string, string> = {
              ORGANIZATIONAL: 'A.5 Organizational',
              PEOPLE: 'A.6 People',
              PHYSICAL: 'A.7 Physical',
              TECHNOLOGICAL: 'A.8 Technological'
            };
            return `
              <div class="category-item">
                <div class="category-score" style="font-size: 24px; color: ${score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'};">${score}%</div>
                <div class="category-name">${themeLabels[theme]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px;">
        <div style="background: #22c55e20; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #22c55e;">${audit.aiScore!.isoCompliance.compliantControls}</div>
          <div style="font-size: 11px; color: #22c55e;">Compliant</div>
        </div>
        <div style="background: #f59e0b20; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${audit.aiScore!.isoCompliance.partialControls}</div>
          <div style="font-size: 11px; color: #f59e0b;">Partial</div>
        </div>
        <div style="background: #ef444420; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${audit.aiScore!.isoCompliance.nonCompliantControls}</div>
          <div style="font-size: 11px; color: #ef4444;">Non-Compliant</div>
        </div>
        <div style="background: #64748b20; padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #64748b;">${audit.aiScore!.isoCompliance.notApplicableControls}</div>
          <div style="font-size: 11px; color: #64748b;">N/A</div>
        </div>
      </div>
      <p class="summary">${audit.aiScore!.isoCompliance.summary}</p>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">AI Recommendations</div>
      ${audit.aiScore!.recommendations.map((rec, i) => `
        <div class="rec-item">
          <span class="rec-num">${i + 1}</span>
          <span class="rec-text">${rec}</span>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Generated by Project Sentinel on ${new Date().toLocaleDateString()}</p>
      <p>This report is confidential and intended for authorized recipients only.</p>
    </div>
  </div>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="audit-report-${audit.id.slice(0, 8)}.html"`);
      res.send(htmlContent);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      res.status(500).json({ error: "Failed to export PDF" });
    }
  });

  return httpServer;
}
