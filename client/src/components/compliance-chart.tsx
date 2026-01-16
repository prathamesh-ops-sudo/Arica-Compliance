import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "./glass-card";
import type { QuestionnaireCategoryType } from "@shared/schema";

interface CategoryScore {
  category: QuestionnaireCategoryType;
  score: number;
  fullMark: number;
}

interface ComplianceRadarChartProps {
  data: CategoryScore[];
  className?: string;
}

const categoryLabels: Record<QuestionnaireCategoryType, string> = {
  ACCESS_CONTROL: "Access Control",
  ASSET_MANAGEMENT: "Asset Mgmt",
  RISK_MANAGEMENT: "Risk Mgmt",
  INCIDENT_RESPONSE: "Incident Response",
  BUSINESS_CONTINUITY: "Business Continuity",
};

export function ComplianceRadarChart({ data, className }: ComplianceRadarChartProps) {
  const chartData = data.map((d) => ({
    subject: categoryLabels[d.category],
    score: d.score,
    fullMark: 100,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Compliance by Category</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="hsl(217, 33%, 25%)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="hsl(217, 91%, 60%)"
                fill="hsl(217, 91%, 60%)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}

interface ComplianceBarChartProps {
  data: CategoryScore[];
  className?: string;
}

export function ComplianceBarChart({ data, className }: ComplianceBarChartProps) {
  const chartData = data.map((d) => ({
    name: categoryLabels[d.category],
    score: d.score,
  }));

  const getBarColor = (score: number) => {
    if (score >= 80) return "hsl(142, 71%, 45%)";
    if (score >= 60) return "hsl(189, 94%, 43%)";
    if (score >= 40) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg px-3 py-2 text-sm">
          <p className="text-foreground font-medium">{label}</p>
          <p className="text-primary">{`Score: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={className}
    >
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Category Scores</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 20%, 65%)" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCardContent>
      </GlassCard>
    </motion.div>
  );
}
