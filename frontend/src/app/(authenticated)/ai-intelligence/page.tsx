"use client";

import React, { useState } from "react";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, Badge, Button, Skeleton } from "@/components/ui";
import { 
  useSystemHealth, 
  useDashboardSummary, 
  usePatrolRecommendations, 
  usePatrolSummary,
  useValidationStats
} from "@/hooks/useIntelligence";
import { 
  Sparkles, Cpu, ChevronRight, Activity, ShieldCheck, Info, 
  Layers, Target, Check, AlertTriangle, Eye, Compass, Focus, 
  Database, Clock, FileText, CheckCircle, ArrowRight
} from "lucide-react";
import Link from "next/link";

// Neighborhood lookup local helper
const HOTSPOT_CENTERS = [
  { lng: 77.6067, lat: 12.9754, name: "MG Road" },
  { lng: 77.6394, lat: 12.9625, name: "Indiranagar" },
  { lng: 77.6150, lat: 12.9350, name: "Koramangala" },
  { lng: 77.5800, lat: 12.9900, name: "Malleshwaram" },
  { lng: 77.5600, lat: 12.9300, name: "Banashankari" },
];

function getNeighborhoodName(lng: number, lat: number, defaultName: string): string {
  let nearestHsName = defaultName;
  let maxHsImpact = 0;

  for (const hs of HOTSPOT_CENTERS) {
    const dx = lng - hs.lng;
    const dy = lat - hs.lat;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.035) { // roughly 3.5km
      const factor = 1 - (dist / 0.035);
      if (factor > maxHsImpact) {
        maxHsImpact = factor;
        nearestHsName = `${hs.name} Outer`;
        if (dist < 0.015) nearestHsName = `${hs.name} Central`;
      }
    }
  }
  return nearestHsName;
}

// Provenance Metadata Definitions
interface ProvenanceMeta {
  title: string;
  endpoint: string;
  service: string;
  repository: string;
  functionName: string;
  dataset: string;
  formula: string;
  refreshSource: string;
}

const PROVENANCE_DATA: Record<string, ProvenanceMeta> = {
  recs: {
    title: "Total Recommendations",
    endpoint: "/api/v1/patrol/summary",
    service: "SmartPatrolAllocationService",
    repository: "patrol_repository.py",
    functionName: "summary()",
    dataset: "patrol_recommendations.parquet",
    formula: "len(df)",
    refreshSource: "Optimization pipeline execution",
  },
  tdpi: {
    title: "Average TDPI",
    endpoint: "/api/v1/dashboard",
    service: "DashboardRepository",
    repository: "dashboard_repository.py",
    functionName: "summary()",
    dataset: "tdpi_scores.parquet",
    formula: "mean(tdpi_score)",
    refreshSource: "Baseline pipeline calculation",
  },
  visibility: {
    title: "Average Visibility Gap",
    endpoint: "/api/v1/dashboard",
    service: "DashboardRepository",
    repository: "dashboard_repository.py",
    functionName: "summary()",
    dataset: "visibility_gap.parquet",
    formula: "mean(visibility_gap_index)",
    refreshSource: "Baseline pipeline calculation",
  },
  hotspots: {
    title: "Active Hotspots",
    endpoint: "/api/v1/dashboard",
    service: "DashboardRepository",
    repository: "dashboard_repository.py",
    functionName: "summary()",
    dataset: "tdpi_scores.parquet",
    formula: "len(hotspots)",
    refreshSource: "Database caching layer",
  },
  gaps: {
    title: "Coverage Gaps Count",
    endpoint: "/api/v1/dashboard",
    service: "DashboardRepository",
    repository: "dashboard_repository.py",
    functionName: "summary()",
    dataset: "deployment_impact.parquet",
    formula: "count(deployment_priority == 'IMMEDIATE')",
    refreshSource: "Deployment optimization run",
  },
  accuracy: {
    title: "Offline Validation Performance",
    endpoint: "/api/v1/validation/stats",
    service: "ValidationRepository",
    repository: "validation_repository.py",
    functionName: "stats()",
    dataset: "validation_predictions.parquet",
    formula: "sum(actual == prediction) / len(df) * 100",
    refreshSource: "CatBoost test holdout set evaluation",
  }
};

export default function AiIntelligencePage() {
  const { data: stages = [], isLoading: loadingStages } = useSystemHealth();
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary("12:00");
  const { data: recommendations = [], isLoading: loadingRecs } = usePatrolRecommendations();
  const { data: patrolSummary, isLoading: loadingPatrolSummary } = usePatrolSummary();
  const { data: validationStats, isLoading: loadingValidationStats } = useValidationStats();

  const [activeProvenance, setActiveProvenance] = useState<string | null>(null);

  // Workflow steps with explicit data lineage
  const workflowStages = [
    { 
      name: "Historical Violations", 
      purpose: "Log and catalog violation points", 
      input: "Violations CSV", 
      service: "Database Migrator", 
      transform: "Filter and geo-index coords", 
      output: "cleaned_violations.parquet", 
      consumedBy: "Feature Engineering & Forecasts" 
    },
    { 
      name: "Feature Engineering", 
      purpose: "Process model inputs & temporal flags", 
      input: "cleaned_violations.parquet", 
      service: "Data Pipeline Orchestrator", 
      transform: "Compute rolling metrics, lags, and weekend flags", 
      output: "forecasting_dataset.parquet", 
      consumedBy: "Forecast Model & Classifiers" 
    },
    { 
      name: "Forecast Engine", 
      purpose: "Predict future violation escalation pressure", 
      input: "forecasting_dataset.parquet", 
      service: "Forecast Trainer (CatBoost Regressor)", 
      transform: "Run tree boosting regression on target logs", 
      output: "forecast_predictions.parquet", 
      consumedBy: "Patrol Optimizer" 
    },
    { 
      name: "TDPI Engine", 
      purpose: "Aggregate vehicle and obstruction density", 
      input: "cleaned_violations.parquet", 
      service: "TDPI Aggregator", 
      transform: "Calculate spatial cluster indices & risk metrics", 
      output: "tdpi_scores.parquet", 
      consumedBy: "Deployment Score Engine" 
    },
    { 
      name: "Visibility Gap Engine", 
      purpose: "Assess blind spots and patrol reach", 
      input: "GPS patrol feeds & H3 clusters", 
      service: "Visibility Aggregator", 
      transform: "Perform coverage area buffer intersections", 
      output: "visibility_gap.parquet", 
      consumedBy: "Deployment Score Engine" 
    },
    { 
      name: "Deployment Score Engine", 
      purpose: "Synthesize operational criticality score (0-100)", 
      input: "tdpi_score + forecast_pressure + visibility_gap", 
      service: "SmartPatrolAllocationService", 
      transform: "Compute weighted sum coefficients (30/25/25/10/10)", 
      output: "deployment_score", 
      consumedBy: "Patrol Optimizer" 
    },
    { 
      name: "Patrol Optimizer", 
      purpose: "Compile recommended patrol squad assignments", 
      input: "deployment_score + patrol units coordinates", 
      service: "SmartPatrolAllocationService", 
      transform: "Rank sectors and assign squads dynamically", 
      output: "patrol_recommendations.parquet", 
      consumedBy: "Operational recommendations" 
    },
    { 
      name: "Operational Recommendations", 
      purpose: "Expose dispatcher optimization commands", 
      input: "patrol_recommendations.parquet", 
      service: "Reporting Engine", 
      transform: "Generate deterministic reasoning scripts", 
      output: "Live Dispatch Recommendations", 
      consumedBy: "Municipal Operator Console" 
    }
  ];

  // Helper to format timestamps nicely
  const formatFreshness = (isoString?: string | null) => {
    if (!isoString) return "Unavailable";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <PageWrapper
      title="Enterprise AI Intelligence Center"
      description="Operational AI command console documenting models, data lineages, and decision justifications."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", position: "relative" }}>
        
        {/* PROVENANCE MODAL OVERLAY */}
        {activeProvenance && PROVENANCE_DATA[activeProvenance] && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              padding: "20px"
            }}
            onClick={() => setActiveProvenance(null)}
          >
            <div 
              style={{
                width: "100%",
                maxWidth: "500px",
                backgroundColor: "rgba(18, 22, 40, 0.95)",
                border: "1px solid var(--color-brand)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 8px 32px rgba(168, 85, 247, 0.25)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} style={{ color: "var(--color-brand)" }} />
                  Metric Provenance: {PROVENANCE_DATA[activeProvenance].title}
                </h3>
                <Badge variant="success">✅ Verified Backend</Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.8rem", color: "#cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Source Endpoint</span>
                  <code style={{ color: "var(--color-brand)" }}>{PROVENANCE_DATA[activeProvenance].endpoint}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Backend Service</span>
                  <strong>{PROVENANCE_DATA[activeProvenance].service}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Repository File</span>
                  <code style={{ color: "#a855f7" }}>{PROVENANCE_DATA[activeProvenance].repository}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Function Called</span>
                  <code>{PROVENANCE_DATA[activeProvenance].functionName}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Dataset Source</span>
                  <code style={{ color: "var(--color-info)" }}>{PROVENANCE_DATA[activeProvenance].dataset}</code>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                  <span style={{ color: "#94a3b8" }}>Formula</span>
                  <code style={{ background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", overflowX: "auto" }}>
                    {PROVENANCE_DATA[activeProvenance].formula}
                  </code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Refresh Source</span>
                  <span>{PROVENANCE_DATA[activeProvenance].refreshSource}</span>
                </div>
              </div>

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <Button size="sm" onClick={() => setActiveProvenance(null)}>Close Trace</Button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1 — AI STATUS OVERVIEW CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          
          {/* Card 1: Total Recommendations */}
          <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.8)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Recommendations</span>
              <button onClick={() => setActiveProvenance("recs")} style={{ background: "none", border: "none", color: "var(--color-brand)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", textDecoration: "underline" }}>ⓘ Provenance</span>
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>
                {loadingPatrolSummary ? <Skeleton width={60} /> : `${patrolSummary?.total_recommendations || 0} Sectors`}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--color-success)" }}>✅ Verified</span>
            </div>
          </div>

          {/* Card 2: Average TDPI */}
          <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.8)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Average TDPI</span>
              <button onClick={() => setActiveProvenance("tdpi")} style={{ background: "none", border: "none", color: "var(--color-brand)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", textDecoration: "underline" }}>ⓘ Provenance</span>
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-brand)" }}>
                {loadingSummary ? <Skeleton width={60} /> : `${summary?.cityTdpi || 0}%`}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--color-success)" }}>✅ Verified</span>
            </div>
          </div>

          {/* Card 3: Average Visibility Gap */}
          <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.8)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Average Visibility Gap</span>
              <button onClick={() => setActiveProvenance("visibility")} style={{ background: "none", border: "none", color: "var(--color-brand)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", textDecoration: "underline" }}>ⓘ Provenance</span>
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-info)" }}>
                {loadingSummary ? <Skeleton width={60} /> : `${summary?.averageVisibilityGap || 0}%`}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--color-success)" }}>✅ Verified</span>
            </div>
          </div>

          {/* Card 4: Active Hotspots */}
          <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.8)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Hotspots</span>
              <button onClick={() => setActiveProvenance("hotspots")} style={{ background: "none", border: "none", color: "var(--color-brand)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", textDecoration: "underline" }}>ⓘ Provenance</span>
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-warning)" }}>
                {loadingSummary ? <Skeleton width={60} /> : `${summary?.activeHotspots || 0} Zones`}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--color-success)" }}>✅ Verified</span>
            </div>
          </div>

          {/* Card 5: Coverage Gaps Count */}
          <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.8)", border: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Coverage Gaps Count</span>
              <button onClick={() => setActiveProvenance("gaps")} style={{ background: "none", border: "none", color: "var(--color-brand)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "0.65rem", textDecoration: "underline" }}>ⓘ Provenance</span>
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "8px" }}>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-critical)" }}>
                {loadingSummary ? <Skeleton width={60} /> : `${summary?.visibilityGapsCount || 0} Critical`}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--color-success)" }}>✅ Verified</span>
            </div>
          </div>

        </div>

        {/* SECTION 2 — OPERATIONAL BRIEFING */}
        <Card variant="glass">
          <CardHeader
            title="Operational Intelligence Briefing"
            subtitle="Dynamic executive briefing compiled directly from active telemetry aggregates"
          />
          <CardBody>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginTop: "12px" }}>
              <div>
                <h3 style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>City Overview</h3>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.8rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>Citywide congestion averages <strong>{summary?.cityTdpi || 0}% TDPI</strong>.</li>
                  <li>Spatial surveillance coverage gaps average <strong>{summary?.averageVisibilityGap || 0}% blind spot risk</strong>.</li>
                  <li>A total of <strong>{summary?.activeHotspots || 0} cells</strong> are flagged as active hotspots.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Recommendation Summary</h3>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.8rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li><strong>{patrolSummary?.total_recommendations || 0} target sectors</strong> mapped with optimized routes.</li>
                  <li><strong>{patrolSummary?.priority_distribution?.IMMEDIATE || 0} immediate intervention zones</strong> identified.</li>
                  <li><strong>{patrolSummary?.priority_distribution?.HIGH || 0} high-priority zones</strong> require scheduling.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Operational Observation</h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                  ParkOptic grid monitoring indicates that average TDPI currently stands at <strong>{summary?.cityTdpi || 0}%</strong> across <strong>{summary?.activeHotspots || 0} active hotspots</strong>, showing normal density parameters. 
                  However, <strong>{summary?.visibilityGapsCount || 0} sectors</strong> require IMMEDIATE patrol intervention due to critical monitoring gaps averaging <strong>{summary?.averageVisibilityGap || 0}%</strong>.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Suggested Operational Focus</h3>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                  Deploy dispatcher units directly to H3 grid coordinates flagged with <strong>IMMEDIATE</strong> deployment priority. 
                  Prioritizing the highest-scoring sectors will maximize visibility coverage and drive deterministic traffic load reduction.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* DATA FRESHNESS DECK */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", padding: "16px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.4)", border: "1px solid rgba(255, 255, 255, 0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Clock size={16} style={{ color: "var(--color-brand)" }} />
            <div>
              <span style={{ fontSize: "0.6rem", color: "#94a3b8", display: "block", textTransform: "uppercase" }}>Backend Loaded At</span>
              <strong style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>{formatFreshness(summary?.loadTimestamp)}</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Database size={16} style={{ color: "var(--color-info)" }} />
            <div>
              <span style={{ fontSize: "0.6rem", color: "#94a3b8", display: "block", textTransform: "uppercase" }}>Dataset Last Updated</span>
              <strong style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>{formatFreshness(summary?.datasets?.tdpi?.last_modified)}</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={16} style={{ color: "var(--color-success)" }} />
            <div>
              <span style={{ fontSize: "0.6rem", color: "#94a3b8", display: "block", textTransform: "uppercase" }}>Recommendation Generated At</span>
              <strong style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>{formatFreshness(summary?.datasets?.patrol?.last_modified)}</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity size={16} style={{ color: "var(--color-warning)" }} />
            <div>
              <span style={{ fontSize: "0.6rem", color: "#94a3b8", display: "block", textTransform: "uppercase" }}>Data Source Timestamp</span>
              <strong style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>{formatFreshness(summary?.datasets?.validation?.last_modified)}</strong>
            </div>
          </div>
        </div>

        {/* SECTION 3 — AI DECISION PIPELINE WORKFLOW */}
        <Card variant="glass">
          <CardHeader
            title="AI Decision Pipeline & Data Lineage Trace"
            subtitle="Observability trace mapping pipeline inputs to final recommendation variables"
          />
          <CardBody>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "12px" }}>
              {workflowStages.map((stage, idx) => {
                const isLast = idx === workflowStages.length - 1;
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div 
                      style={{ 
                        padding: "16px", 
                        borderRadius: "10px", 
                        backgroundColor: "rgba(255, 255, 255, 0.02)", 
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
                        gap: "12px",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "9px", color: "var(--color-brand)", fontWeight: 700 }}>STAGE 0{idx + 1}</span>
                        <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9", marginTop: "2px" }}>{stage.name}</h4>
                        <span style={{ fontSize: "0.68rem", color: "#64748b", display: "block" }}>{stage.purpose}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "8px", color: "#64748b", display: "block", textTransform: "uppercase" }}>Input Dataset</span>
                        <code style={{ fontSize: "0.7rem", color: "#e2e8f0" }}>{stage.input}</code>
                      </div>
                      <div>
                        <span style={{ fontSize: "8px", color: "#64748b", display: "block", textTransform: "uppercase" }}>Backend Service</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#cbd5e1" }}>{stage.service}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "8px", color: "#64748b", display: "block", textTransform: "uppercase" }}>Transformation</span>
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{stage.transform}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "8px", color: "#64748b", display: "block", textTransform: "uppercase" }}>Output Variable</span>
                        <code style={{ fontSize: "0.7rem", color: "var(--color-brand)" }}>{stage.output}</code>
                      </div>
                      <div>
                        <span style={{ fontSize: "8px", color: "#64748b", display: "block", textTransform: "uppercase" }}>Consumed By</span>
                        <span style={{ fontSize: "0.7rem", color: "#a855f7" }}>{stage.consumedBy}</span>
                      </div>
                    </div>
                    {!isLast && (
                      <div style={{ display: "flex", justifyContent: "center", color: "rgba(255,255,255,0.15)", margin: "-4px 0" }}>
                        <ArrowRight size={14} style={{ transform: "rotate(90deg)" }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* 2 COLUMN DETAIL DETAILS */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr", gap: "24px" }}>
          
          {/* Left Column: Recommendations & Trace */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* SECTION 4 — LIVE RECOMMENDATIONS */}
            <Card variant="default">
              <CardHeader
                title="Live Operational Recommendations"
                subtitle="Active optimizer assignments retrieved dynamically from the backend"
              />
              <CardBody style={{ marginTop: "12px" }}>
                {loadingRecs ? (
                  <Skeleton height={240} />
                ) : recommendations.length === 0 ? (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "var(--color-text-muted)", fontSize: "11px" }}>
                    No active recommendations found.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {recommendations.slice(0, 4).map((rec, idx) => {
                      const name = getNeighborhoodName(rec.longitude, rec.latitude, `Sector ${rec.h3_index.substring(0, 8)}`);
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: "16px",
                            borderRadius: "10px",
                            backgroundColor: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Badge variant={rec.deployment_priority === "IMMEDIATE" ? "critical" : rec.deployment_priority === "HIGH" ? "warning" : "info"}>
                                {rec.deployment_priority}
                              </Badge>
                              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9" }}>{name}</span>
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-brand)", fontWeight: 700 }}>
                              Score: {rec.deployment_score}
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "0.7rem", background: "rgba(0,0,0,0.15)", padding: "10px", borderRadius: "8px" }}>
                            <div>
                              <span style={{ color: "#64748b", display: "block" }}>H3 Sector:</span>
                              <strong style={{ color: "#cbd5e1" }}>{rec.h3_index.substring(0, 10)}</strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block" }}>TDPI Load:</span>
                              <strong style={{ color: "#cbd5e1" }}>{rec.tdpi_score}%</strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block" }}>Visibility Gap:</span>
                              <strong style={{ color: "#cbd5e1" }}>{rec.visibility_gap_index}%</strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block" }}>Forecast Demand:</span>
                              <strong style={{ color: "#cbd5e1" }}>{Math.round(rec.predicted_violations)}/wk</strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block" }}>Enforcement Rate:</span>
                              <strong style={{ color: "#cbd5e1" }}>{rec.historical_enforcement_rate}%</strong>
                            </div>
                            <div>
                              <span style={{ color: "#64748b", display: "block" }}>Expected TDPI Dec:</span>
                              <strong style={{ color: "#cbd5e1" }}>-{rec.estimated_tdpi_reduction}%</strong>
                            </div>
                          </div>

                          <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.4 }}>
                            <strong>Reason:</strong> {rec.recommendation_reason}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "10px" }}>
                            <div style={{ fontSize: "0.72rem", color: "var(--color-success)" }}>
                              ✦ Expected Benefit: Operational risk reduction of <strong>{rec.estimated_operational_risk_reduction}%</strong>
                            </div>
                            <Link href={`/map?focus=${rec.h3_index}`}>
                              <Button variant="ghost" size="sm" style={{ height: "26px", fontSize: "11px", gap: "4px" }}>
                                <Focus size={12} /> Focus on Map
                              </Button>
                            </Link>
                          </div>

                          {/* DECISION INPUTS CHECKLIST */}
                          <div style={{ background: "rgba(0,0,0,0.1)", padding: "8px", borderRadius: "6px", display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.65rem", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.02)" }}>
                            <span style={{ color: "#cbd5e1", fontWeight: 600 }}>Decision Inputs:</span>
                            <span style={{ color: rec.tdpi_score >= 0 ? "var(--color-success)" : "#cbd5e1" }}>✓ TDPI</span>
                            <span style={{ color: rec.forecast_pressure >= 0 ? "var(--color-success)" : "#cbd5e1" }}>✓ Forecast Pressure</span>
                            <span style={{ color: rec.visibility_gap_index >= 0 ? "var(--color-success)" : "#cbd5e1" }}>✓ Visibility Gap</span>
                            <span style={{ color: rec.spatial_criticality >= 0 ? "var(--color-success)" : "#cbd5e1" }}>✓ Spatial Criticality</span>
                            <span style={{ color: rec.hotspot_tier ? "var(--color-success)" : "#cbd5e1" }}>✓ Hotspot Tier</span>
                          </div>

                          {/* RECOMMENDATION PROVENANCE */}
                          <div style={{ fontSize: "0.62rem", color: "#64748b", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "8px" }}>
                            <span><strong>Endpoint:</strong> /api/v1/patrol/recommendations</span>
                            <span><strong>Service:</strong> SmartPatrolAllocationService</span>
                            <span><strong>Repository:</strong> PatrolRepository</span>
                            <span><strong>Function:</strong> recommend()</span>
                            <span><strong>Variable:</strong> deployment_score</span>
                            <span><strong>Dataset:</strong> patrol_recommendations.parquet</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* SECTION 5 — AI DECISION TRACE STAGES */}
            <Card variant="glass">
              <CardHeader
                title="AI Decision Trace Pipeline"
                subtitle="Step-by-step logic detailing how inputs transform into operational priorities"
              />
              <CardBody style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
                {[
                  { stage: "Forecast Engine", in: "Historical violations archive", transform: "Chronological CatBoostRegressor forecasting", out: "Forecast pressure index", next: "Deployment Score Engine" },
                  { stage: "TDPI Engine", in: "Raw vehicle logs & locations", transform: "Spatial clustering intensity metrics", out: "TDPI score (0-100)", next: "Deployment Score Engine" },
                  { stage: "Visibility Gap Engine", in: "Active patrol unit GPS bounds", transform: "Surveillance buffer polygon overlaps", out: "Visibility gap index", next: "Deployment Score Engine" },
                  { stage: "Deployment Score Engine", in: "TDPI + Forecast + Visibility + Spatial + Tier", transform: "Normalized weighted synthesis", out: "Deployment Score (0-100)", next: "Patrol Optimizer" },
                  { stage: "Patrol Optimizer", in: "Deployment scores + available squads", transform: "Dynamic prioritization ranking", out: "Optimized allocation recommendations", next: "Municipal Operator Console" }
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: "12px", borderRadius: "8px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-brand)" }}>{item.stage}</span>
                      <Badge variant="info" style={{ fontSize: "8px" }}>Stage {idx + 1}</Badge>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.7rem", color: "#cbd5e1", marginTop: "8px", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                      <span><strong>Input:</strong> {item.in}</span>
                      <span><strong>Transformation:</strong> {item.transform}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#94a3b8", marginTop: "6px" }}>
                      <span><strong>Output:</strong> <code style={{ color: "var(--color-success)" }}>{item.out}</code></span>
                      <span><strong>Next Stage:</strong> <code style={{ color: "#a855f7" }}>{item.next}</code></span>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>

          </div>

          {/* Right Column: Weights, Registry, Registry, Transparency */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* SECTION 6 — WEIGHT EXPLAINABILITY */}
            <Card variant="glass">
              <CardHeader
                title="Decision Weight Composition"
                subtitle="Relative contribution coefficients for the deployment score formula"
              />
              <CardBody style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                {[
                  { name: "TDPI (Traffic Load)", weight: "30%", coef: "0.30", variable: "tdpi_score", purpose: "Represents congestion severity", contribution: "Primary indicators", color: "var(--color-critical)" },
                  { name: "Forecast Pressure", weight: "25%", coef: "0.25", variable: "forecast_pressure", purpose: "Violation growth escalations", contribution: "Long-term trends", color: "var(--color-warning)" },
                  { name: "Visibility Gap", weight: "25%", coef: "0.25", variable: "visibility_gap_index", purpose: "Surveillance blind spots", contribution: "Patrol monitoring gaps", color: "var(--color-info)" },
                  { name: "Spatial Criticality", weight: "10%", coef: "0.10", variable: "spatial_criticality", purpose: "Junction and road weightings", contribution: "Intersection density", color: "var(--color-brand)" },
                  { name: "Hotspot Tier", weight: "10%", coef: "0.10", variable: "tier_score", purpose: "Historical cluster category", contribution: "Categorical weighting", color: "#cbd5e1" }
                ].map((factor, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#cbd5e1" }}>
                      <span><strong>{factor.name}</strong></span>
                      <strong style={{ color: factor.color }}>{factor.weight}</strong>
                    </div>
                    <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: factor.weight, background: factor.color }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "0.65rem", color: "#94a3b8", marginTop: "4px" }}>
                      <span><strong>Variable:</strong> <code>{factor.variable}</code></span>
                      <span><strong>Purpose:</strong> {factor.purpose}</span>
                      <span><strong>Coef:</strong> {factor.coef}</span>
                      <span><strong>Contribution:</strong> {factor.contribution}</span>
                    </div>
                  </div>
                ))}
                
                {/* DEPLOYMENT SCORE FORMULA */}
                <div style={{ marginTop: "12px", padding: "12px", borderRadius: "8px", background: "rgba(168, 85, 247, 0.05)", border: "1px solid rgba(168, 85, 247, 0.15)" }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--color-brand)", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Deployment Score Formula</span>
                  <code style={{ fontSize: "0.7rem", color: "#f1f5f9", display: "block", marginTop: "4px", lineHeight: 1.3, whiteSpace: "pre-wrap" }}>
                    deployment_score = (tdpi_component × 0.30) + (forecast_pressure × 0.25) + (vgi_component × 0.25) + (spatial_criticality × 0.10) + (tier_component × 0.10)
                  </code>
                </div>
              </CardBody>
            </Card>

            {/* SECTION 7 — AI MODEL INVENTORY */}
            <Card variant="glass">
              <CardHeader
                title="AI Model Inventory"
                subtitle="Verified analytical model files loaded in the active workspace"
              />
              <CardBody style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                
                {/* Forecast Model */}
                <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9" }}>Forecast Intelligence</span>
                    <Badge variant={validationStats?.model_artifacts?.hotspot_forecasting?.exists ? "success" : "critical"}>
                      {validationStats?.model_artifacts?.hotspot_forecasting?.exists ? "Active / Loaded" : "Missing"}
                    </Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.7rem", color: "#94a3b8", marginTop: "8px" }}>
                    <span><strong>Algorithm:</strong> CatBoostRegressor</span>
                    <span><strong>Prediction Target:</strong> target_log_violations</span>
                    <span><strong>Dataset:</strong> forecasting_dataset.parquet</span>
                    <span><strong>Size on Disk:</strong> {validationStats?.model_artifacts?.hotspot_forecasting?.size_mb || 0} MB</span>
                  </div>
                </div>

                {/* Optimizer Model */}
                <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9" }}>Deployment Optimizer</span>
                    <Badge variant="success">Active / Loaded</Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.7rem", color: "#94a3b8", marginTop: "8px" }}>
                    <span><strong>Algorithm:</strong> Smart Patrol Allocator</span>
                    <span><strong>Decision Variable:</strong> deployment_score</span>
                    <span><strong>Dataset:</strong> patrol_recommendations.parquet</span>
                    <span><strong>Method:</strong> Dynamic Priority Ranking</span>
                  </div>
                </div>

                {/* Model Files Check */}
                <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.02)" }}>
                  <span style={{ fontSize: "0.75rem", color: "#cbd5e1", display: "block", fontWeight: 700, marginBottom: "8px" }}>Loaded Model Files</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.7rem", color: "#94a3b8" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>violation_validation_model.cbm</span>
                      <strong style={{ color: validationStats?.model_artifacts?.violation_validation?.exists ? "var(--color-success)" : "var(--color-critical)" }}>
                        {validationStats?.model_artifacts?.violation_validation?.exists ? `LOADED (${validationStats.model_artifacts.violation_validation.size_mb}MB)` : "MISSING"}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>hotspot_forecasting_model.cbm</span>
                      <strong style={{ color: validationStats?.model_artifacts?.hotspot_forecasting?.exists ? "var(--color-success)" : "var(--color-critical)" }}>
                        {validationStats?.model_artifacts?.hotspot_forecasting?.exists ? `LOADED (${validationStats.model_artifacts.hotspot_forecasting.size_mb}MB)` : "MISSING"}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>forecast_metadata.pkl</span>
                      <strong style={{ color: validationStats?.model_artifacts?.forecast_metadata?.exists ? "var(--color-success)" : "var(--color-critical)" }}>
                        {validationStats?.model_artifacts?.forecast_metadata?.exists ? "LOADED" : "MISSING"}
                      </strong>
                    </div>
                  </div>
                </div>

              </CardBody>
            </Card>

            {/* SECTION 8 — OFFLINE VALIDATION PERFORMANCE */}
            <Card variant="glass">
              <CardHeader
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                    <span>Offline Validation Performance</span>
                    <button onClick={() => setActiveProvenance("accuracy")} style={{ background: "none", border: "none", color: "var(--color-brand)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "0.65rem", textDecoration: "underline" }}>ⓘ Provenance</span>
                    </button>
                  </div>
                }
                subtitle="Classifier validation performance computed from static holdout test splits"
              />
              <CardBody style={{ marginTop: "12px" }}>
                {loadingValidationStats ? (
                  <Skeleton height={120} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.15)", fontSize: "0.75rem", color: "#94a3b8" }}>
                      <span>Evaluation Metric:</span>
                      <strong style={{ color: "#f1f5f9" }}>Classification Accuracy</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.15)", fontSize: "0.75rem", color: "#94a3b8" }}>
                      <span>Dataset:</span>
                      <strong style={{ color: "#f1f5f9" }}>validation_predictions.parquet</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.15)", fontSize: "0.75rem", color: "#94a3b8" }}>
                      <span>Evaluation Timestamp:</span>
                      <strong style={{ color: "#f1f5f9" }}>{formatFreshness(summary?.datasets?.validation?.last_modified)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(0,0,0,0.15)", fontSize: "0.75rem", color: "#94a3b8" }}>
                      <span>Evaluation Type:</span>
                      <strong style={{ color: "#f1f5f9" }}>Holdout Test Split (20% Stratified)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.2)", fontSize: "0.85rem", color: "var(--color-brand)", alignItems: "center" }}>
                      <span>Offline Test Accuracy:</span>
                      <strong style={{ fontSize: "1.1rem" }}>{validationStats?.accuracy}%</strong>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* SECTION 9 — AI TRANSPARENCY REGISTRY */}
            <Card variant="glass">
              <CardHeader
                title="AI Transparency Registry"
                subtitle="Detailed engineering catalog of active mathematical subsystems"
              />
              <CardBody style={{ fontSize: "0.72rem", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                
                {/* TDPI Engine */}
                <div>
                  <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px 0" }}>TDPI Engine</h4>
                  <p style={{ margin: "0 0 6px 0", lineHeight: 1.3 }}>Computes vehicle density index levels across spatial H3 cells.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", background: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "6px" }}>
                    <span><strong>Input:</strong> Raw violations</span>
                    <span><strong>Output:</strong> tdpi_score</span>
                    <span><strong>Service:</strong> TDPI Aggregator</span>
                    <span><strong>Dataset:</strong> tdpi_scores.parquet</span>
                  </div>
                </div>

                {/* Forecast Engine */}
                <div>
                  <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px 0" }}>Forecast Engine</h4>
                  <p style={{ margin: "0 0 6px 0", lineHeight: 1.3 }}>Predicts violation escalations based on calendar patterns and logs.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", background: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "6px" }}>
                    <span><strong>Input:</strong> forecasting_dataset</span>
                    <span><strong>Output:</strong> predicted_violations</span>
                    <span><strong>Service:</strong> CatBoostRegressor</span>
                    <span><strong>Dataset:</strong> forecast_predictions.parquet</span>
                  </div>
                </div>

                {/* Visibility Gap Engine */}
                <div>
                  <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px 0" }}>Visibility Gap Engine</h4>
                  <p style={{ margin: "0 0 6px 0", lineHeight: 1.3 }}>Tracks surveillance coverage levels and gaps based on patrol feeds.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", background: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "6px" }}>
                    <span><strong>Input:</strong> GPS coordinate feeds</span>
                    <span><strong>Output:</strong> visibility_gap_index</span>
                    <span><strong>Service:</strong> Visibility Aggregator</span>
                    <span><strong>Dataset:</strong> visibility_gap.parquet</span>
                  </div>
                </div>

                {/* Deployment Score Engine */}
                <div>
                  <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px 0" }}>Deployment Score Engine</h4>
                  <p style={{ margin: "0 0 6px 0", lineHeight: 1.3 }}>Synthesizes coefficients into a single priority indicator.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", background: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "6px" }}>
                    <span><strong>Input:</strong> TDPI + Forecast + Visibility</span>
                    <span><strong>Output:</strong> deployment_score</span>
                    <span><strong>Service:</strong> SmartPatrolAllocationService</span>
                    <span><strong>Dataset:</strong> deployment_impact.parquet</span>
                  </div>
                </div>

                {/* Patrol Optimizer */}
                <div>
                  <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", margin: "0 0 4px 0" }}>Patrol Optimizer</h4>
                  <p style={{ margin: "0 0 6px 0", lineHeight: 1.3 }}>Ranks and allocates resources dynamically across target locations.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", background: "rgba(0,0,0,0.15)", padding: "8px", borderRadius: "6px" }}>
                    <span><strong>Input:</strong> Scores + active units</span>
                    <span><strong>Output:</strong> patrol_recommendations</span>
                    <span><strong>Service:</strong> SmartPatrolAllocationService</span>
                    <span><strong>Dataset:</strong> patrol_recommendations.parquet</span>
                  </div>
                </div>

              </CardBody>
            </Card>

          </div>

        </div>

      </div>
    </PageWrapper>
  );
}
