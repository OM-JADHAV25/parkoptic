"use client";

import React, { useState } from "react";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, Badge, Skeleton } from "@/components/ui";
import { useDeploymentSimulation, usePatrolUnits } from "@/hooks/useIntelligence";
import { Sliders, AlertTriangle, ShieldCheck, HelpCircle, Activity, Layers, Target, Check, Info, Zap, TrendingUp, Sparkles, Award } from "lucide-react";

export default function DeploymentPlanningPage() {
  const [timelineHour, setTimelineHour] = useState<string>("12:00");
  
  // Slider states for policy parameters
  const [additionalSquads, setAdditionalSquads] = useState<number>(1);
  const [newCameraNodes, setNewCameraNodes] = useState<number>(10);
  const [roadRestrictions, setRoadRestrictions] = useState<number>(2);

  // Queries
  const { data: sim, isLoading: loadingSim } = useDeploymentSimulation(timelineHour);
  const { data: squads = [] } = usePatrolUnits();

  // Simple math adjusting simulation outputs based on additional policy sliders
  const adjustedTdpiReduction = sim ? Math.min(80, Math.round(sim.congestionReduction + additionalSquads * 4 + newCameraNodes * 0.4 + roadRestrictions * 1.5)) : 0;
  const adjustedGapReduction = sim ? Math.min(90, Math.round(sim.operationalRiskReduction + additionalSquads * 6 + newCameraNodes * 0.6 + roadRestrictions * 1.0)) : 0;
  const adjustedBenefitScore = Math.min(100, Math.max(0, Math.round(adjustedTdpiReduction * 0.6 + adjustedGapReduction * 0.4 + 5)));

  // Derived baseline and projected values
  const baselineTdpi = sim ? sim.currentTdpi : 0;
  const projectedTdpi = sim ? Math.max(10, sim.projectedTdpi - additionalSquads * 3) : 0;
  const netTdpiChange = projectedTdpi - baselineTdpi;

  const baselineVisibilityGap = sim ? sim.currentVisibilityGap : 0;
  const projectedVisibilityGap = sim ? Math.max(5, sim.projectedVisibilityGap - additionalSquads * 4) : 0;
  const netVisibilityGapChange = projectedVisibilityGap - baselineVisibilityGap;

  const baselineHotspots = sim ? sim.hotspotsBefore : 0;
  const projectedHotspots = sim ? Math.max(0, sim.hotspotsAfter - Math.floor(additionalSquads * 0.5)) : 0;
  const netHotspotsChange = projectedHotspots - baselineHotspots;

  // Resource Investment Level calculation
  const resourceSum = additionalSquads + (newCameraNodes / 10) + roadRestrictions;
  const interventionLevel = resourceSum < 3 ? "Low" : resourceSum < 7 ? "Medium" : "High";
  const interventionColor = interventionLevel === "Low" ? "var(--color-success)" : interventionLevel === "Medium" ? "var(--color-warning)" : "var(--color-critical)";

  // Contextual notes for the selected forecast hour
  const hourNotes: Record<string, string> = {
    "08:00": "Start Shift: Peak morning deployment hours. High traffic entry rates and transit hub congestion.",
    "12:00": "Midday Peak: Historically experiences elevated parking demand around commercial districts. Simulation results are calculated specifically for this forecast period.",
    "18:00": "Evening Peak: Elevated congestion corridors. High demand around entertainment, dining, and shopping districts.",
    "22:00": "End Shift: Late night monitoring. Patrol routes optimized for low visibility areas and priority security coverage."
  };

  // 1. Refined Recommendation Logic
  let recStatus = "Recommended";
  let recColor = "#34d399";
  let recBg = "rgba(52, 211, 153, 0.05)";
  let recBorder = "rgba(52, 211, 153, 0.2)";
  let recReason = "Good improvement with acceptable intervention cost.";
  let recIcon = "✓";

  if (adjustedBenefitScore >= 75) {
    recStatus = "Strongly Recommended";
    recColor = "#10b981";
    recBg = "rgba(16, 185, 129, 0.06)";
    recBorder = "rgba(16, 185, 129, 0.25)";
    recReason = "Significant operational improvement with efficient resource usage.";
    recIcon = "✓";
  } else if (adjustedBenefitScore >= 50) {
    recStatus = "Recommended";
    recColor = "#34d399";
    recBg = "rgba(52, 211, 153, 0.06)";
    recBorder = "rgba(52, 211, 153, 0.25)";
    recReason = "Good improvement with acceptable intervention cost.";
    recIcon = "✓";
  } else if (adjustedBenefitScore >= 30) {
    recStatus = "Marginal Improvement";
    recColor = "var(--color-warning)";
    recBg = "rgba(245, 158, 11, 0.06)";
    recBorder = "rgba(245, 158, 11, 0.25)";
    recReason = "Operational gains exist but are relatively small.";
    recIcon = "⚠";
  } else if (adjustedBenefitScore >= 15) {
    recStatus = "Limited Operational Value";
    recColor = "#f97316";
    recBg = "rgba(249, 115, 22, 0.06)";
    recBorder = "rgba(249, 115, 22, 0.25)";
    recReason = "Benefits are localized and may not justify deployment.";
    recIcon = "⚠";
  } else {
    recStatus = "Not Recommended";
    recColor = "var(--color-critical)";
    recBg = "rgba(239, 68, 68, 0.06)";
    recBorder = "rgba(239, 68, 68, 0.25)";
    recReason = "Simulation shows negligible operational improvement.";
    recIcon = "✗";
  }

  // 9. Executive Decision Card values
  let execImpact = "Low";
  let execImpactColor = "var(--color-text-muted)";
  let execReason = "Operational improvements are insufficient to offset target deployment overhead.";
  let execAction = "Deploy additional smart cameras before expanding patrol allocation to stabilize monitoring first.";

  if (adjustedBenefitScore >= 75) {
    execImpact = "Very High";
    execImpactColor = "#10b981";
    execReason = "This policy configuration significantly drives down congestion levels and closes the visibility gaps across all sectors.";
    execAction = "Authorize policy parameters immediately and proceed to coordinate live shift scheduling.";
  } else if (adjustedBenefitScore >= 50) {
    execImpact = "High";
    execImpactColor = "var(--color-success)";
    execReason = "The policy improves overall enforcement coverage and visibility, though hotspot reduction remains localized.";
    execAction = "Deploy policy parameters to high-priority sectors and coordinate with local squad dispatch.";
  } else if (adjustedBenefitScore >= 30) {
    execImpact = "Moderate";
    execImpactColor = "var(--color-warning)";
    execReason = "Strategic improvements are localized and mostly offset by high overall resource requirements.";
    execAction = "Increase patrol deployment near Tier-1 hotspot clusters to maximize direct TDPI reduction.";
  }

  return (
    <PageWrapper
      title="Enterprise Policy Decision Laboratory"
      description="Simulate enforcement policy models, configure tactical interventions, and preview projected city-wide metrics with AI decision support."
    >
      {/* 9. Executive Decision Card (New - Placed prominently at the top) */}
      <div style={{ marginBottom: "24px" }}>
        <Card variant="glass" style={{ borderLeft: `4px solid ${execImpactColor}`, background: "linear-gradient(to right, rgba(255,255,255,0.02), rgba(255,255,255,0.01))" }}>
          <CardHeader
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Award size={18} style={{ color: execImpactColor }} />
                <span>Executive Decision Summary</span>
              </div>
            }
          />
          <CardBody style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 500 }}>Overall Operational Impact:</span>
              <strong style={{ fontSize: "1.1rem", color: execImpactColor, fontWeight: 800 }}>{execImpact} Impact</strong>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>
              <strong>Reason:</strong> {execReason}
            </p>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <strong style={{ color: "var(--color-brand)" }}>Suggested Next Action:</strong>
              <span style={{ color: "#e2e8f0" }}>{execAction}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "24px" }}>
        
        {/* Left Column: Sliders Policy Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Operational Policy Configuration */}
          <Card variant="glass">
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sliders size={16} style={{ color: "var(--color-brand)" }} />
                  <span>Operational Policy Configuration</span>
                </div>
              }
              subtitle="Configure real-time resource variables to test simulated outcomes"
            />
            <CardBody style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Squads Control */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(255,255,255,0.01)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.05em" }}>ADDITIONAL PATROL SQUADS</span>
                  <Badge variant="info" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>+{additionalSquads} Squads</Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={additionalSquads}
                  onChange={(e) => setAdditionalSquads(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--color-brand)", margin: "8px 0" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>Operational Influence: <strong style={{ color: "var(--color-success)" }}>High</strong></span>
                  <span style={{ color: "#64748b", textAlign: "right" }}>Improves enforcement coverage and hotspot response.</span>
                </div>
              </div>

              {/* Camera Nodes Control */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(255,255,255,0.01)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.05em" }}>CAMERA NETWORK EXPANSION</span>
                  <Badge variant="info" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>+{newCameraNodes} Nodes</Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={newCameraNodes}
                  onChange={(e) => setNewCameraNodes(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--color-info)", margin: "8px 0" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>Operational Influence: <strong style={{ color: "var(--color-info)" }}>Medium</strong></span>
                  <span style={{ color: "#64748b", textAlign: "right" }}>Improves visibility and monitoring confidence.</span>
                </div>
              </div>

              {/* Road Restrictions Control */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(255,255,255,0.01)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.05em" }}>ROAD RESTRICTION INTERVENTIONS</span>
                  <Badge variant="neutral" style={{ padding: "4px 8px", fontSize: "0.75rem", background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.3)" }}>+{roadRestrictions} Areas</Badge>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={roadRestrictions}
                  onChange={(e) => setRoadRestrictions(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#a855f7", margin: "8px 0" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", marginTop: "4px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "8px" }}>
                  <span style={{ color: "#94a3b8" }}>Operational Influence: <strong style={{ color: "#c084fc" }}>Moderate</strong></span>
                  <span style={{ color: "#64748b", textAlign: "right" }}>Reduces congestion in restricted corridors during peak periods.</span>
                </div>
              </div>

              {/* Simulation Hour selector */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.75rem", color: "#f1f5f9", fontWeight: 700, letterSpacing: "0.05em" }}>SELECT FORECAST TARGET HOUR</label>
                <select
                  value={timelineHour}
                  onChange={(e) => setTimelineHour(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#f1f5f9",
                    fontSize: "0.85rem",
                    outline: "none",
                    width: "100%"
                  }}
                >
                  <option value="08:00">08:00 (Start Shift)</option>
                  <option value="12:00">12:00 (Midday peak)</option>
                  <option value="18:00">18:00 (Evening peak)</option>
                  <option value="22:00">22:00 (End shift)</option>
                </select>
                <div style={{ background: "rgba(34, 211, 238, 0.03)", border: "1px solid rgba(34, 211, 238, 0.1)", borderRadius: "6px", padding: "10px", marginTop: "4px" }}>
                  <p style={{ fontSize: "0.7rem", color: "#94a3b8", lineHeight: 1.4, margin: 0 }}>
                    <Info size={11} style={{ display: "inline", marginRight: "5px", color: "var(--color-brand)" }} />
                    {hourNotes[timelineHour]}
                  </p>
                </div>
              </div>

            </CardBody>
          </Card>

          {/* 6. Resource Investment Summary Card */}
          <Card variant="glass">
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Target size={16} style={{ color: "var(--color-brand)" }} />
                  <span>Operational Investment</span>
                </div>
              }
              subtitle="Intervention overhead required for policy target"
            />
            <CardBody style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>PATROLS ADDED</div>
                  <strong style={{ fontSize: "1.1rem", color: "#f1f5f9" }}>+{additionalSquads} Squads</strong>
                </div>
                <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>CAMERAS DEPLOYED</div>
                  <strong style={{ fontSize: "1.1rem", color: "#f1f5f9" }}>+{newCameraNodes} Nodes</strong>
                </div>
                <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>ROAD RESTRICTIONS</div>
                  <strong style={{ fontSize: "1.1rem", color: "#f1f5f9" }}>+{roadRestrictions} Areas</strong>
                </div>
                <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>OVERALL INTERVENTION</div>
                  <strong style={{ fontSize: "1.1rem", color: interventionColor }}>{interventionLevel}</strong>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 4. Simulation Decision Trace - Interactive visual pipeline */}
          <Card variant="glass">
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Activity size={16} style={{ color: "var(--color-info)" }} />
                  <span>Simulation Decision Trace</span>
                </div>
              }
              subtitle="Analytical pipeline workflow for scenario outcomes"
            />
            <CardBody style={{ marginTop: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0px", position: "relative" }}>
                {[
                  { title: "Policy Inputs", desc: "Configuration of squads, camera expansions, and restriction areas" },
                  { title: "Deployment Assessment", desc: "Assesses allocation delta on target grid cell capacities" },
                  { title: "Forecast Evaluation", desc: "Runs CatBoost forecasting baseline filters specifically for selected time frame" },
                  { title: "Operational Simulation", desc: "Runs mathematical impact simulation on visibility index and TDPI" },
                  { title: "Impact Analysis", desc: "Calculates improvement ratios and net changes on historical demand" },
                  { title: "Final Recommendation", desc: "Resolves decision logic to flag suggested next action", highlight: true }
                ].map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "14px", position: "relative" }}>
                    {/* Visual Connector Line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "20px", flexShrink: 0 }}>
                      <div style={{ 
                        width: "20px", 
                        height: "20px", 
                        borderRadius: "50%", 
                        background: step.highlight ? "var(--color-brand)" : "rgba(11, 17, 33, 1)", 
                        border: step.highlight ? "2px solid #fff" : "2px solid var(--color-brand)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: step.highlight ? "0 0 10px var(--color-brand)" : "none",
                        zIndex: 2
                      }}>
                        <span style={{ fontSize: "9px", fontWeight: 900, color: step.highlight ? "#0f172a" : "var(--color-brand)" }}>{idx + 1}</span>
                      </div>
                      {idx < 5 && (
                        <div style={{ width: "2px", height: "30px", background: "linear-gradient(to bottom, var(--color-brand), rgba(34, 211, 238, 0.1))", zIndex: 1 }}></div>
                      )}
                    </div>
                    <div style={{ paddingBottom: idx < 5 ? "16px" : "0", marginTop: "-2px" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: step.highlight ? "var(--color-brand)" : "#f1f5f9" }}>{step.title}</div>
                      <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "2px", lineHeight: 1.3 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Comparative Outcomes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Simulated Forecast Results */}
          <Card variant="default">
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={18} style={{ color: "var(--color-success)" }} />
                  <span>Simulated Operational Forecast Results</span>
                </div>
              }
              subtitle="Side-by-side comparison of Current State vs Simulated Policy Outcomes"
            />
            <CardBody style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>
              {loadingSim ? (
                <Skeleton height={200} />
              ) : sim ? (
                <>
                  {/* 5. Improved Current vs Projected Metrics Table */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", overflow: "hidden", background: "rgba(0,0,0,0.3)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", background: "rgba(255,255,255,0.03)", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Metric</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", textAlign: "right" }}>Current</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-brand)", textTransform: "uppercase", textAlign: "right" }}>Projected</div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-success)", textTransform: "uppercase", textAlign: "right" }}>Net Change</div>
                    </div>
                    {[
                      { 
                        label: "TDPI (Traffic Density)", 
                        cur: `${baselineTdpi}%`, 
                        proj: `${projectedTdpi}%`, 
                        net: `${netTdpiChange}%`, 
                        improved: netTdpiChange < 0 
                      },
                      { 
                        label: "Visibility Gap Index", 
                        cur: `${baselineVisibilityGap}%`, 
                        proj: `${projectedVisibilityGap}%`, 
                        net: `${netVisibilityGapChange}%`, 
                        improved: netVisibilityGapChange < 0 
                      },
                      { 
                        label: "Active Hotspots", 
                        cur: baselineHotspots.toString(), 
                        proj: projectedHotspots.toString(), 
                        net: netHotspotsChange >= 0 ? `+${netHotspotsChange}` : `${netHotspotsChange}`, 
                        improved: netHotspotsChange < 0 
                      },
                    ].map((row, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: "1.3fr 1fr 1fr 1fr", 
                          padding: "14px 16px", 
                          borderBottom: idx < 2 ? "1px solid rgba(255,255,255,0.03)" : "none",
                          background: row.improved ? "rgba(16, 185, 129, 0.03)" : "transparent",
                          transition: "all 0.4s ease"
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", color: row.improved ? "#f1f5f9" : "#cbd5e1", fontWeight: row.improved ? 600 : 500 }}>{row.label}</div>
                        <div style={{ fontSize: "0.85rem", color: "#94a3b8", textAlign: "right" }}>{row.cur}</div>
                        
                        {/* Glow and transition on improved values */}
                        <div style={{ 
                          fontSize: "0.85rem", 
                          color: row.improved ? "var(--color-brand)" : "#f1f5f9", 
                          fontWeight: 700, 
                          textAlign: "right",
                          textShadow: row.improved ? "0 0 8px rgba(34, 211, 238, 0.4)" : "none",
                          transition: "all 0.4s ease"
                        }}>{row.proj}</div>
                        
                        <div style={{ 
                          fontSize: "0.85rem", 
                          fontWeight: 700, 
                          color: row.improved ? "var(--color-success)" : row.net === "0%" || row.net === "0" ? "#94a3b8" : "var(--color-critical)", 
                          textAlign: "right",
                          textShadow: row.improved ? "0 0 8px rgba(16, 185, 129, 0.4)" : "none",
                          transition: "all 0.4s ease"
                        }}>
                          {row.net === "0%" || row.net === "0" ? "—" : row.net}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Why Did This Change Section */}
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <HelpCircle size={15} style={{ color: "var(--color-brand)" }} />
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9" }}>Why did these metrics change?</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.75rem", color: "#94a3b8", display: "flex", flexDirection: "column", gap: "6px", lineHeight: 1.5 }}>
                      <li><strong>TDPI decreased</strong> because additional patrol deployment increased enforcement capacity, targeting spatial blocks dynamically.</li>
                      <li><strong>Visibility improved</strong> because additional smart cameras expanded monitored coverage and reduced historical blind spots.</li>
                      <li><strong>Road restrictions</strong> reduced localized corridor congestion and peak vehicle density spikes.</li>
                    </ul>
                  </div>

                  {/* Recommendation Card */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ 
                      background: recBg, 
                      border: `1px solid ${recBorder}`, 
                      borderRadius: "10px", 
                      padding: "16px", 
                      display: "flex", 
                      gap: "14px",
                      alignItems: "center"
                    }}>
                      <div style={{ 
                        width: "36px", 
                        height: "36px", 
                        borderRadius: "50%", 
                        background: recColor, 
                        color: "#0f172a", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontWeight: 900,
                        fontSize: "1.2rem",
                        flexShrink: 0
                      }}>
                        {recIcon}
                      </div>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Policy Recommendation</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: recColor, marginTop: "2px" }}>{recStatus}</div>
                        <div style={{ fontSize: "0.78rem", color: "#cbd5e1", marginTop: "4px", lineHeight: 1.4 }}>{recReason}</div>
                      </div>
                    </div>

                    {/* 7. Decision Factors Explanation */}
                    <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "8px", padding: "12px" }}>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Decision Factors</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ fontSize: "0.72rem", color: adjustedTdpiReduction >= 15 ? "var(--color-success)" : "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{adjustedTdpiReduction >= 15 ? "✓" : "⚠"}</span>
                          <span>{adjustedTdpiReduction >= 15 ? "Strong TDPI improvement" : "Minimal TDPI improvement"}</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: adjustedGapReduction >= 20 ? "var(--color-success)" : "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{adjustedGapReduction >= 20 ? "✓" : "⚠"}</span>
                          <span>{adjustedGapReduction >= 20 ? "Significant visibility improvement" : "Minimal visibility improvement"}</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: additionalSquads > 0 ? "var(--color-success)" : "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{additionalSquads > 0 ? "✓" : "⚠"}</span>
                          <span>{additionalSquads > 0 ? "Patrol deployment highly effective" : "No additional patrols"}</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: netHotspotsChange < 0 ? "var(--color-success)" : "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{netHotspotsChange < 0 ? "✓" : "⚠"}</span>
                          <span>{netHotspotsChange < 0 ? "Hotspot count reduced" : "Hotspot count unchanged"}</span>
                        </div>
                        <div style={{ fontSize: "0.72rem", color: resourceSum >= 7 ? "var(--color-critical)" : "var(--color-success)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <span>{resourceSum >= 7 ? "⚠" : "✓"}</span>
                          <span>{resourceSum >= 7 ? "High investment required" : "Efficient resource investment"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Contribution Hierarchy */}
                  <div>
                    <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      <Layers size={14} style={{ color: "var(--color-info)" }} /> Policy Contribution Hierarchy
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { role: "Primary Driver", name: "Patrol Deployment", color: "var(--color-success)", desc: "Largest contributor to TDPI reduction." },
                        { role: "Secondary Driver", name: "Camera Expansion", color: "var(--color-info)", desc: "Primary contributor to visibility improvements." },
                        { role: "Supporting Driver", name: "Road Restrictions", color: "#c084fc", desc: "Localized corridor optimization." }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                          <div>
                            <span style={{ fontSize: "0.72rem", color: item.color, fontWeight: 700, display: "block" }}>{item.role}</span>
                            <span style={{ fontSize: "0.8rem", color: "#f1f5f9", fontWeight: 600 }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8", textAlign: "right" }}>{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Redesigned AI Policy Assessment (Structured Bullets) */}
                  <div style={{ background: "linear-gradient(135deg, rgba(34, 211, 238, 0.05), rgba(34, 211, 238, 0.01))", border: "1px solid rgba(34, 211, 238, 0.15)", borderRadius: "10px", padding: "16px" }}>
                    <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Sparkles size={14} style={{ color: "var(--color-brand)" }} />
                      <span>AI Policy Assessment</span>
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "0.78rem", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "var(--color-success)" }}>✓</span>
                        <span>TDPI reduced by <strong>{adjustedTdpiReduction}%</strong></span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "var(--color-success)" }}>✓</span>
                        <span>Visibility Gap improved by <strong>{adjustedGapReduction}%</strong></span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "var(--color-success)" }}>✓</span>
                        <span>Patrol deployment increases enforcement capacity</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: "var(--color-success)" }}>✓</span>
                        <span>Camera expansion improves monitoring coverage</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ color: netHotspotsChange < 0 ? "var(--color-success)" : "var(--color-warning)" }}>{netHotspotsChange < 0 ? "✓" : "⚠"}</span>
                        <span>{netHotspotsChange < 0 ? `Active hotspots reduced by ${Math.abs(netHotspotsChange)}` : "Active hotspot count remains unchanged"}</span>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: "12px", paddingTop: "10px", fontSize: "0.78rem", color: "#94a3b8" }}>
                      <strong>Overall:</strong> Policy provides {adjustedBenefitScore >= 75 ? "significant" : adjustedBenefitScore >= 50 ? "high" : adjustedBenefitScore >= 30 ? "moderate" : "limited"} operational improvement.
                    </div>
                  </div>

                  {/* 8. Improved Benefits Section */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px" }}>
                    <div>
                      <h5 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-success)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Zap size={13} />
                        <span>Immediate Benefits</span>
                      </h5>
                      <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.75rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "6px", lineHeight: 1.4 }}>
                        <li>Increased patrol coverage (+{additionalSquads} squads added)</li>
                        <li>Improved monitoring visibility (camera gap reduction)</li>
                        <li>Dynamic hotspot suppression at forecast hour</li>
                      </ul>
                    </div>
                    <div>
                      <h5 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-brand)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                        <TrendingUp size={13} />
                        <span>Strategic Benefits</span>
                      </h5>
                      <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.75rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "6px", lineHeight: 1.4 }}>
                        <li>Reduced congestion trends ({adjustedTdpiReduction}% simulated improvement)</li>
                        <li>Enhanced enforcement effectiveness (gap drops by {adjustedGapReduction}%)</li>
                        <li>Better long-term resource deployment resilience</li>
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Information Banner */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px", display: "flex", gap: "12px", fontSize: "0.75rem", color: "#94a3b8" }}>
                    <Info size={16} style={{ color: "var(--color-brand)", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <span style={{ fontWeight: 700, color: "#f1f5f9", display: "block", marginBottom: "6px" }}>Simulation Information</span>
                      <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px", lineHeight: 1.4 }}>
                        <li>Forecasts generated using the CatBoost forecasting pipeline.</li>
                        <li>Operational impacts computed by the Deployment Impact Assessment Engine.</li>
                        <li>Results represent simulated policy outcomes and do not modify the live operational state.</li>
                        <li>Forecast uncertainty reflects historical model validation performance.</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : null}
            </CardBody>
          </Card>
        </div>

      </div>
    </PageWrapper>
  );
}
