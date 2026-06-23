"use client";

import React, { useState } from "react";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, Badge, Button, Skeleton } from "@/components/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { usePatrolUnits, useMapIntelligence, usePatrolRecommendations, useDashboardSummary, useSimulationData } from "@/hooks/useIntelligence";
import { adaptPatrolOptimizations } from "@/services/adapters";
import { Shield, Sparkles, Map, AlertTriangle, ArrowRight, Activity, Layers, Focus, Navigation, Target, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { getSeverityDescription } from "@/utils/severity";

export default function PatrolsPage() {
  const { data: squads = [], isLoading: loadingSquads } = usePatrolUnits();
  const { data: cells = [] } = useMapIntelligence("12:00");
  const { data: recommendations = [], isLoading: loadingRecs } = usePatrolRecommendations();
  const { data: dashboardSummary, isLoading: loadingDashboard } = useDashboardSummary("12:00");
  const { data: simData } = useSimulationData("12:00");

  const [selectedBriefing, setSelectedBriefing] = useState<any | null>(null);

  const INITIAL_ALLOCATIONS: Record<string, number> = {
    "89618924b93ffff": 1,
    "89618921ab7ffff": 1,
    "89601458377ffff": 1,
    "896189255b7ffff": 1,
  };

  const allocations: Record<string, number> = {};
  squads.forEach(s => {
    if (s.assignedCell && s.status !== "off-duty") {
      allocations[s.assignedCell] = (allocations[s.assignedCell] || 0) + 1;
    }
  });

  const isSimulationActive = squads.length > 0 && (
    Object.keys(allocations).length !== Object.keys(INITIAL_ALLOCATIONS).length ||
    Object.entries(INITIAL_ALLOCATIONS).some(([cell, count]) => allocations[cell] !== count)
  );

  // Algorithmic patrol optimization assignments from the Patrol Optimizer engine
  const activeRecommendations = (isSimulationActive && simData?.simulated) 
    ? simData.simulated 
    : recommendations;
    
  const optimizations = adaptPatrolOptimizations(activeRecommendations, squads);

  const coverageIndex = dashboardSummary?.coverageIndex ?? 78;

  const priorityZonesCount = activeRecommendations.filter(
    (r: any) => r.deployment_priority === "IMMEDIATE" || r.deployment_priority === "HIGH"
  ).length;

  const activeSquads = squads.filter(s => s.status !== "off-duty");
  const deployedSquads = activeSquads.filter(s => s.assignedCell !== undefined);
  const squadDeploymentRate = activeSquads.length > 0
    ? Math.round((deployedSquads.length / activeSquads.length) * 100)
    : 0;

  let currentCoverage = coverageIndex;
  let projectedCoverage = coverageIndex;

  if (simData?.baseline && simData?.simulated) {
    const baselineVg = simData.baseline.reduce((acc: number, c: any) => acc + (c.visibility_gap_index || 0), 0) / (simData.baseline.length || 1);
    const simulatedVg = simData.simulated.reduce((acc: number, c: any) => acc + (c.visibility_gap_index || 0), 0) / (simData.simulated.length || 1);
    currentCoverage = Math.round(100 - baselineVg);
    projectedCoverage = Math.round(100 - simulatedVg);
  }

  // Find best alternative
  const getBestAlternative = (currentOpt: any) => {
    if (!currentOpt || !recommendations) return null;
    const candidates = recommendations.filter(r => 
      r.h3_index !== currentOpt.recommend && 
      (r.visibility_gap_index || 0) > currentOpt.visibilityGapIndex &&
      (r.deployment_score || 0) < currentOpt.score
    );
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (b.deployment_score || 0) - (a.deployment_score || 0));
    return candidates[0];
  };

  const bestAlternative = selectedBriefing ? getBestAlternative(selectedBriefing) : null;

  const renderExplainabilityDrawer = () => {
    if (!selectedBriefing) return null;
    const sq = squads.find(s => s.id === selectedBriefing.id);
    const recCell = cells.find(c => c.h3Index === selectedBriefing.recommend);
    const sectorName = recCell ? recCell.name : `Sector ${selectedBriefing.recommend?.substring(0, 8)}`;
    const altCellName = bestAlternative ? (cells.find(c => c.h3Index === bestAlternative.h3_index)?.name || `Sector ${bestAlternative.h3_index?.substring(0, 8)}`) : "";

    return (
      <Sheet open={!!selectedBriefing} onOpenChange={(open) => !open && setSelectedBriefing(null)}>
        <SheetContent side="right" showCloseButton={true} style={{ width: "500px", maxWidth: "90vw", padding: "0", overflowY: "hidden", display: "flex", flexDirection: "column" }}>
          
          {/* Header area with gradient background */}
          <div style={{ padding: "24px", background: "linear-gradient(to bottom, rgba(34, 211, 238, 0.1), rgba(11, 17, 33, 0))", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingRight: "24px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Sparkles size={14} style={{ color: "var(--color-brand)" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    AI Dispatch Briefing
                  </span>
                </div>
                <SheetTitle style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                  Deploy {sq?.name}
                </SheetTitle>
                <SheetDescription style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "4px" }}>
                  Targeting Sector: <strong style={{ color: "#e2e8f0" }}>{sectorName}</strong>
                </SheetDescription>
              </div>
              <Badge variant={selectedBriefing.priority === "IMMEDIATE" ? "critical" : selectedBriefing.priority === "HIGH" ? "warning" : selectedBriefing.priority === "MEDIUM" ? "info" : "neutral"} style={{ padding: "6px 10px", fontSize: "0.75rem", fontWeight: 700 }}>
                {selectedBriefing.priority} Priority
              </Badge>
            </div>
          </div>

          {/* Scrollable content area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* 2. Executive Summary - Premium Glass Panel */}
            <div style={{ position: "relative", padding: "16px", borderRadius: "12px", background: "rgba(34, 211, 238, 0.03)", border: "1px solid rgba(34, 211, 238, 0.1)", boxShadow: "inset 0 0 20px rgba(34, 211, 238, 0.02)" }}>
              <div style={{ position: "absolute", left: 0, top: "10%", bottom: "10%", width: "3px", background: "var(--color-brand)", borderRadius: "0 4px 4px 0" }}></div>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "#cbd5e1", margin: 0, paddingLeft: "8px" }}>
                This sector has been prioritized because it combines elevated TDPI (<strong style={{ color: "#f1f5f9" }}>{selectedBriefing.tdpiScore}%</strong>), strong forecasted parking demand (<strong style={{ color: "#f1f5f9" }}>{Math.round(selectedBriefing.predictedViolations)} violations/week</strong>), and <strong style={{ color: "#f1f5f9" }}>{selectedBriefing.hotspotTier.replace('_', ' ')}</strong> classification. 
                {bestAlternative ? ` Although nearby sectors (such as ${altCellName}) exhibit slightly higher Visibility Gaps, this location produces the highest overall Deployment Score and therefore the greatest projected operational benefit.` : ` This location produces the highest overall Deployment Score in its cluster, offering maximum operational benefit.`}
              </p>
            </div>

            {/* 3 & 4. Why This Location & Inputs */}
            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Focus size={16} style={{ color: "var(--color-info)" }} /> Operational Context
              </h4>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "16px" }}>
                {selectedBriefing.reason} The area expects <strong style={{ color: "#e2e8f0" }}>{Math.round(selectedBriefing.predictedViolations)} active violations</strong> this week, compounded by a <strong style={{ color: "#e2e8f0" }}>{selectedBriefing.visibilityGapIndex}% visibility blind spot</strong> that requires direct patrol intervention.
              </p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedBriefing.inputs.map((inp: string, i: number) => (
                  <div key={i} style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "#cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                  }}>
                    <span style={{ color: "var(--color-success)" }}>✓</span> {inp}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Deployment Score & City Rank - Premium Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--color-success)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Deployment Score</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-success)", margin: "4px 0", textShadow: "0 2px 10px rgba(16, 185, 129, 0.2)" }}>{selectedBriefing.score}</div>
                <div style={{ fontSize: "0.75rem", color: "#e2e8f0", fontWeight: 500, background: "rgba(0,0,0,0.2)", padding: "4px 10px", borderRadius: "12px" }}>{getSeverityDescription(selectedBriefing.hotspotTier, selectedBriefing.tdpiPercentile)}</div>
              </div>
              <div style={{ background: "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Priority Rank</div>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#f1f5f9", margin: "4px 0", textShadow: "0 2px 10px rgba(255, 255, 255, 0.1)" }}>#{selectedBriefing.deploymentRank}</div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500, background: "rgba(0,0,0,0.2)", padding: "4px 10px", borderRadius: "12px" }}>Out of all sectors</div>
              </div>
            </div>

            {/* Replaced broken Card with a sleek Info Box */}
            <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "16px" }}>
              <div style={{ flexShrink: 0 }}>
                <Shield size={20} style={{ color: "var(--color-text-muted)" }} />
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>How is this score calculated?</div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.5 }}>
                  The Patrol Optimizer evaluates multiple operational signals including TDPI, Forecasted Violations, Visibility Gap, Spatial Criticality, and Hotspot Tier. These factors are weighted and combined into a Deployment Score. The optimizer ranks every monitored H3 sector and recommends deployment to the highest priority locations.
                </div>
              </div>
            </div>

            {/* 6. Deployment Score Composition */}
            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Layers size={16} style={{ color: "var(--color-brand)" }} /> Score Composition
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { label: "TDPI Load", value: `${selectedBriefing.tdpiScore}%`, weight: "30%", color: "var(--color-critical)" },
                  { label: "Forecasted Demand", value: `${Math.round(selectedBriefing.predictedViolations)}/wk`, weight: "25%", color: "var(--color-warning)" },
                  { label: "Visibility Gap", value: `${selectedBriefing.visibilityGapIndex}%`, weight: "25%", color: "var(--color-info)" },
                  { label: "Spatial Criticality", value: selectedBriefing.spatialCriticality > 0 ? "Elevated" : "Normal", weight: "10%", color: "#94a3b8" },
                  { label: "Hotspot Tier", value: selectedBriefing.hotspotTier.replace('_', ' '), weight: "10%", color: "var(--color-brand)" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: item.color }}></div>
                      <span style={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: 500 }}>{item.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9" }}>{item.value}</span>
                      <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>{item.weight} wgt</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Comparison with Best Alternative */}
            {bestAlternative && (
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Activity size={16} style={{ color: "var(--color-warning)" }} /> Best Alternative Comparison
                </h4>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: 1.5, marginBottom: "16px", padding: "12px", background: "rgba(245, 158, 11, 0.05)", borderLeft: "2px solid rgba(245, 158, 11, 0.5)", borderRadius: "0 6px 6px 0" }}>
                  If not selected, <strong style={{ color: "#f1f5f9" }}>{altCellName}</strong> was the next best candidate. Although the alternative has a higher Visibility Gap, this location has higher TDPI and Forecasted Demand, resulting in a stronger overall Deployment Score.
                </div>
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", overflow: "hidden", background: "rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", background: "rgba(255,255,255,0.03)", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Metric</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-brand)", textTransform: "uppercase", textAlign: "right" }}>Selected</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>Alternative</div>
                  </div>
                  {[
                    { label: "Deployment Score", v1: selectedBriefing.score, v2: bestAlternative.deployment_score, highlight: true },
                    { label: "TDPI", v1: `${selectedBriefing.tdpiScore}%`, v2: `${bestAlternative.tdpi_score}%` },
                    { label: "Forecasted (cases/wk)", v1: Math.round(selectedBriefing.predictedViolations), v2: Math.round(bestAlternative.predicted_violations) },
                    { label: "Visibility Gap", v1: `${selectedBriefing.visibilityGapIndex}%`, v2: `${bestAlternative.visibility_gap_index}%`, highlightAlt: true },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "12px 16px", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.02)" : "none", background: row.highlight ? "rgba(34, 211, 238, 0.05)" : "transparent" }}>
                      <div style={{ fontSize: "0.75rem", color: row.highlight ? "var(--color-brand)" : "#cbd5e1", fontWeight: row.highlight ? 600 : 500 }}>{row.label}</div>
                      <div style={{ fontSize: "0.8rem", color: row.highlight ? "var(--color-brand)" : "#f1f5f9", fontWeight: 700, textAlign: "right" }}>{row.v1}</div>
                      <div style={{ fontSize: "0.8rem", color: row.highlightAlt ? "var(--color-warning)" : "#94a3b8", fontWeight: row.highlightAlt ? 700 : 500, textAlign: "right" }}>{row.v2}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. AI Decision Trace - Vertical Pipeline */}
            <div>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Navigation size={16} style={{ color: "var(--color-success)" }} /> AI Decision Pipeline
              </h4>
              <div style={{ position: "relative", paddingLeft: "8px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Forecast Intelligence", desc: "Predicts active violations using CatBoost", icon: <Activity size={12} /> },
                  { label: "TDPI Analysis", desc: "Calculates temporal congestion load", icon: <Layers size={12} /> },
                  { label: "Visibility Assessment", desc: "Measures current patrol blind spots", icon: <Focus size={12} /> },
                  { label: "Contextual Risk", desc: "Evaluates spatial criticality & tier", icon: <AlertTriangle size={12} /> },
                  { label: "Deployment Score", desc: "Weighted algorithmic synthesis", icon: <Target size={12} /> },
                  { label: "Recommended Deployment", desc: "Final dispatch authorization", icon: <Navigation size={12} />, highlight: true }
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "16px", alignItems: "stretch", position: "relative", zIndex: 1, paddingBottom: i < 5 ? "0px" : "0px" }}>
                    
                    {/* Node Column */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "22px", flexShrink: 0, position: "relative" }}>
                      
                      {/* Timeline Node with Checkmark */}
                      <div style={{ 
                        width: "22px", 
                        height: "22px", 
                        borderRadius: "50%", 
                        background: step.highlight ? "var(--color-brand)" : "rgba(11, 17, 33, 1)", 
                        border: step.highlight ? "2px solid #fff" : "2px solid var(--color-brand)",
                        marginTop: "10px",
                        boxShadow: step.highlight ? "0 0 15px var(--color-brand)" : "0 0 10px rgba(34, 211, 238, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 3
                      }}>
                        <Check size={12} style={{ color: step.highlight ? "#0f172a" : "var(--color-brand)", strokeWidth: 4 }} />
                      </div>
                      
                      {/* Continuous Connecting Line (only between nodes) */}
                      {i < 5 && (
                        <div style={{ 
                          position: "absolute", 
                          top: "32px", // Starts below the circle (10px margin + 22px height)
                          bottom: "-16px", // Reaches the top of the next circle (gap is 16px)
                          width: "2px", 
                          background: "linear-gradient(to bottom, rgba(34, 211, 238, 0.6), rgba(34, 211, 238, 0.6))", 
                          left: "10px", // Centered inside 22px column (22/2 - 2/2)
                          zIndex: 1
                        }} />
                      )}

                      {/* Continuous Chevron Down Arrow overlay (only between nodes) */}
                      {i < 5 && (
                        <ChevronDown 
                          size={14} 
                          style={{ 
                            position: "absolute", 
                            bottom: "-10px", // Positioned in the middle of the vertical gap
                            left: "4px", // Centered inside 22px column (22/2 - 14/2)
                            color: "rgba(34, 211, 238, 1)", 
                            zIndex: 2,
                            filter: "drop-shadow(0 0 3px rgba(34, 211, 238, 0.8))"
                          }} 
                        />
                      )}
                    </div>
                    
                    {/* Timeline Card */}
                    <div style={{ 
                      flex: 1, 
                      background: step.highlight ? "linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(34, 211, 238, 0.02))" : "rgba(255,255,255,0.02)", 
                      border: step.highlight ? "1px solid rgba(34, 211, 238, 0.3)" : "1px solid rgba(255,255,255,0.05)", 
                      padding: "12px 16px", 
                      borderRadius: "8px",
                      boxShadow: step.highlight ? "0 4px 20px rgba(34, 211, 238, 0.15)" : "0 2px 8px rgba(0,0,0,0.2)",
                      marginBottom: i < 5 ? "16px" : "0"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ color: step.highlight ? "var(--color-brand)" : "#94a3b8" }}>{step.icon}</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: step.highlight ? "var(--color-brand)" : "#f1f5f9", textTransform: "uppercase", letterSpacing: "0.05em" }}>{step.label}</span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", lineHeight: 1.4 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 9. Operational Consequences */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "linear-gradient(to bottom right, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.02))", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "16px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-critical)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-critical)" }}></div>
                  If Ignored
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.75rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "8px", lineHeight: 1.5 }}>
                  <li>Forecasted demand of <strong style={{ color: "#f1f5f9" }}>{Math.round(selectedBriefing.predictedViolations)} violations/wk</strong> remains unaddressed.</li>
                  <li>Visibility Gap of <strong style={{ color: "#f1f5f9" }}>{selectedBriefing.visibilityGapIndex}%</strong> remains unmonitored.</li>
                  <li>Enforcement coverage remains suboptimal.</li>
                </ul>
              </div>
              <div style={{ background: "linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "16px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--color-success)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-success)" }}></div>
                  If Deployed
                </div>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.75rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "8px", lineHeight: 1.5 }}>
                  <li>Patrol visibility improves immediately.</li>
                  <li>Enforcement coverage increases across sector.</li>
                  <li>Operational risk decreases by <strong style={{ color: "#f1f5f9" }}>{selectedBriefing.estimatedOperationalRiskReduction}%</strong>.</li>
                </ul>
              </div>
            </div>

            {/* 10. Expected Operational Benefits */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "20px" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Target size={16} style={{ color: "var(--color-brand)" }} /> Expected Operational Benefits
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Immediate Benefits</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.8rem", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "6px", lineHeight: 1.5 }}>
                    <li>Patrol visibility improves in blind spots</li>
                    <li>Enforcement coverage increases instantly</li>
                    <li>High-priority monitoring begins directly</li>
                  </ul>
                </div>
                <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }}></div>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e2e8f0", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Long-Term Benefits</div>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.8rem", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "6px", lineHeight: 1.5 }}>
                    <li>Reduced operational risk ({selectedBriefing.estimatedOperationalRiskReduction}% projected reduction)</li>
                    <li>Better sustained enforcement ({selectedBriefing.historicalEnforcementRate}% historical baseline)</li>
                    <li>Improved hotspot monitoring continuity</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div style={{ paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", paddingBottom: "24px" }}>
              <span style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Operational Intelligence Sources<br/>
                <span style={{ color: "#94a3b8", marginTop: "4px", display: "inline-block" }}>Forecast Intelligence • TDPI Analysis • Visibility Gap Assessment • Patrol Optimization Engine</span>
              </span>
            </div>

          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <PageWrapper
      title="Patrol Route Optimizer"
      description="Inspect current allocations, preview automated dispatch paths, and deploy optimized squad routing schedules."
    >
      {renderExplainabilityDrawer()}
      {/* Operational KPI summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <Card variant="elevated">
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Active Squads</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", marginTop: "4px" }}>
              {loadingSquads ? <Skeleton height={24} width={40} /> : `${activeSquads.length} / ${squads.length}`}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Squads active on duty</div>
          </div>
        </Card>

        <Card variant="elevated">
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Coverage Index</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-success)", marginTop: "4px" }}>
              {loadingDashboard ? <Skeleton height={24} width={40} /> : `${coverageIndex}%`}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Current operational coverage</div>
          </div>
        </Card>

        <Card variant="elevated">
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Priority Zones</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-warning)", marginTop: "4px" }}>
              {loadingRecs ? <Skeleton height={24} width={40} /> : priorityZonesCount}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Immediate / High priority H3 sectors</div>
          </div>
        </Card>

        <Card variant="elevated">
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Squad Deployment Rate</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-info)", marginTop: "4px" }}>
              {loadingSquads ? <Skeleton height={24} width={40} /> : `${squadDeploymentRate}%`}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Active squads deployed in sectors</div>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "24px" }}>
        
        {/* Left Column: Active Patrol Units & Optimizations */}
        <Card variant="glass">
          <CardHeader
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={16} style={{ color: "var(--color-brand)" }} />
                <span>Patrol Squad Allocations</span>
              </div>
            }
            subtitle="Active police patrol units reporting telemetry indicators"
          />
          <CardBody style={{ marginTop: "12px" }}>
            {loadingSquads ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Skeleton height={68} />
                <Skeleton height={68} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {squads.map((sq) => {
                  const currentCell = cells.find(c => c.h3Index === sq.assignedCell);
                  const opt = optimizations.find(o => o.id === sq.id);
                  const recCell = cells.find(c => c.h3Index === opt?.recommend);

                  const statusBadges: Record<string, { variant: "success" | "info" | "warning" | "critical", label: string }> = {
                    active: { variant: "success", label: "Active" },
                    patrolling: { variant: "info", label: "Patrolling" },
                    dispatched: { variant: "warning", label: "En Route" },
                    "off-duty": { variant: "critical", label: "Off-Duty" },
                  };
                  const statusInfo = statusBadges[sq.status] || { variant: "neutral", label: sq.status };

                  return (
                    <div
                      key={sq.id}
                      style={{
                        padding: "20px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9" }}>{sq.name}</span>
                          <Badge variant={statusInfo.variant} pulse={sq.status === "active" || sq.status === "patrolling"}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          Officers: <strong>{sq.officerCount}</strong> • Coverage: <strong>{sq.coverageRadius}m</strong>
                        </div>
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                        Current Location Sector: <strong style={{ color: "#e2e8f0" }}>{currentCell ? currentCell.name : "Unassigned"}</strong>
                      </div>

                      {opt && recCell && (
                        <div style={{
                          borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                          paddingTop: "12px",
                          marginTop: "4px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-brand)" }}>
                              AI Recommended Assignment
                            </span>
                            <Badge variant={opt.priority === "IMMEDIATE" ? "critical" : opt.priority === "HIGH" ? "warning" : opt.priority === "MEDIUM" ? "info" : "neutral"}>
                              {opt.priority} Priority
                            </Badge>
                          </div>

                          <div style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                            Target Sector: <strong style={{ color: "#22d3ee" }}>{recCell.name}</strong>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem", color: "#94a3b8", backgroundColor: "rgba(0,0,0,0.1)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.02)" }}>
                            <div>
                              <span style={{ fontWeight: 600, color: "var(--color-text-secondary)", display: "block", fontSize: "9px", textTransform: "uppercase" }}>Deployment Score & Priority</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                                <span style={{ color: "var(--color-success)", fontWeight: 700, fontSize: "0.85rem" }}>{opt.score}</span>
                                <span style={{ color: "#94a3b8" }}>•</span>
                                <span style={{ color: "#e2e8f0" }}>#{opt.deploymentRank} Citywide</span>
                              </div>
                            </div>
                            <div style={{ marginTop: "4px" }}>
                              <span style={{ fontWeight: 600, color: "var(--color-text-secondary)", display: "block", fontSize: "9px", textTransform: "uppercase" }}>Expected Operational Benefit</span>
                              <span style={{ color: "var(--color-success)" }}>• {opt.benefit}</span>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", gap: "8px" }}>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "32px", fontSize: "12px", backgroundColor: "rgba(34, 211, 238, 0.1)", color: "var(--color-brand)", border: "1px solid rgba(34, 211, 238, 0.2)" }}
                              onClick={() => setSelectedBriefing(opt)}
                            >
                              <Activity size={13} /> Explain Recommendation
                            </Button>
                            <Link href={`/map?focus=${sq.id}`} style={{ flex: 1 }}>
                              <Button variant="secondary" size="sm" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "32px", fontSize: "12px" }}>
                                <Map size={13} /> Focus on Map
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right Column: Optimizer Summary Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <Card variant="default">
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={16} style={{ color: "var(--color-brand)" }} />
                  <span>Optimizer Summary</span>
                </div>
              }
              subtitle="Algorithmic dispatch analytics feed"
            />
            <CardBody style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ backgroundColor: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  GLOBAL ENFORCEMENT COVERAGE INDEX
                </div>
                {!isSimulationActive ? (
                  <>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-success)", marginTop: "8px" }}>
                      {currentCoverage}%
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                      Current Operational Coverage
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "10px", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Current</span>
                        <span style={{ fontSize: "20px", fontWeight: 800, color: "#cbd5e1" }}>{currentCoverage}%</span>
                      </div>
                      <span style={{ fontSize: "20px", color: "var(--color-info)", fontWeight: 300, marginTop: "12px" }}>→</span>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "10px", color: "var(--color-success)", textTransform: "uppercase" }}>Projected</span>
                        <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-success)" }}>{projectedCoverage}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginTop: "6px" }}>
                      Projected operational simulation active
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  AI Operational Briefings
                </span>
                
                {optimizations.map((opt, idx) => {
                  const sq = squads.find(s => s.id === opt.id);
                  const recCell = cells.find(c => c.h3Index === opt.recommend);
                  const sectorName = recCell ? recCell.name : `Sector ${opt.recommend?.substring(0, 8)}`;

                  return (
                    <div key={idx} style={{
                      backgroundColor: "rgba(255, 255, 255, 0.01)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                      borderRadius: "10px",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#cbd5e1" }}>
                          {sq?.name} Dispatch
                        </span>
                        <Badge variant={opt.priority === "IMMEDIATE" ? "critical" : opt.priority === "HIGH" ? "warning" : opt.priority === "MEDIUM" ? "info" : "neutral"}>
                          {opt.priority} Priority
                        </Badge>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem" }}>
                        <div>
                          <span style={{ fontWeight: 600, color: "var(--color-text-secondary)", display: "block", fontSize: "8px", textTransform: "uppercase" }}>Recommended Action</span>
                          <span style={{ color: "#e2e8f0" }}>Deploy <strong>{sq?.name}</strong> to <strong>{sectorName}</strong>.</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: "var(--color-text-secondary)", display: "block", fontSize: "8px", textTransform: "uppercase" }}>Operational Intelligence Sources</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                            {opt.inputs.map((inp: string, i: number) => (
                              <span key={i} style={{
                                backgroundColor: "rgba(34, 211, 238, 0.06)",
                                border: "1px solid rgba(34, 211, 238, 0.15)",
                                borderRadius: "4px",
                                padding: "2px 6px",
                                fontSize: "9px",
                                color: "#22d3ee",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px"
                              }}>
                                ✓ {inp}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "8px" }}>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            style={{ height: "24px", fontSize: "10px", padding: "0 8px" }}
                            onClick={() => setSelectedBriefing(opt)}
                          >
                            Explain Intelligence
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Quick Info Box */}
          <Card variant="glass" style={{ borderLeft: "4px solid var(--color-warning)" }}>
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#f1f5f9" }}>
                  <AlertTriangle size={15} style={{ color: "var(--color-warning)" }} />
                  <span>Manual Override Warning</span>
                </div>
              }
            />
            <CardBody>
              <p style={{ fontSize: "0.75rem", lineHeight: 1.45, color: "#94a3b8" }}>
                Manually re-deploying squad units on the Digital Twin map overrides the patrol optimizer dispatch logic. Recalculations will execute continuously.
              </p>
            </CardBody>
          </Card>

        </div>
      </div>
    </PageWrapper>
  );
}
