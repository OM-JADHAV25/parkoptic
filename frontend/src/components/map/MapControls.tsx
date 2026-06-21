"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Play, 
  Pause, 
  Layers, 
  Compass, 
  ShieldAlert, 
  Sliders, 
  HelpCircle, 
  Sparkles, 
  Eye, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  RotateCcw,
  Zap,
  CheckCircle,
  Target,
  ArrowDown,
  X,
  Activity
} from "lucide-react";
import { Card, CardHeader, CardBody, Button, Badge } from "@/components/ui";
import { H3GridCell, PatrolUnit, DashboardSummary, SimulationResult } from "@/services/intelligence.service";
import { Maximize, Minimize } from "lucide-react";
import { OperationalMode, MapLayer, DeploymentFeedback } from "@/hooks/useIntelligence";


// Helper component for visual progress bars
function MetricBar({ label, value, max = 100, unit = "%", color = "var(--color-brand)", tooltip }: { label: string, value: number | string, max?: number, unit?: string, color?: string, tooltip?: string }) {
  const numValue = typeof value === "number" ? value : parseFloat(value);
  const percentage = Math.min(100, Math.max(0, (numValue / max) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }} title={tooltip}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
        <span style={{ color: "var(--color-text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
          {label} {tooltip && <HelpCircle size={10} style={{ color: "var(--color-text-muted)" }} />}
        </span>
        <span style={{ fontWeight: 800, color: "var(--color-text-primary)" }}>{value}{unit}</span>
      </div>
      <div style={{ width: "100%", height: "5px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: color, transition: "width 0.8s cubic-bezier(0.25, 1, 0.5, 1)", borderRadius: "3px" }} />
      </div>
    </div>
  );
}

// Comparative metric display for HUD
function HudMetricComparative({ label, before, after, unit = "%", improvementColor = "var(--color-success)", lowerIsBetter = true }: { label: string; before: number; after: number; unit?: string; improvementColor?: string; lowerIsBetter?: boolean }) {
  const delta = before - after;
  const improved = lowerIsBetter ? delta > 0 : delta < 0;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "4px", marginTop: "2px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textDecoration: "line-through", opacity: 0.6 }}>{before}{unit}</span>
        <ArrowDown size={10} style={{ color: improved ? improvementColor : "var(--color-critical)", transform: lowerIsBetter ? (improved ? "rotate(0deg)" : "rotate(180deg)") : (improved ? "rotate(180deg)" : "rotate(0deg)"), transition: "transform 0.3s" }} />
        <span style={{ fontSize: "16px", fontWeight: 800, color: improved ? improvementColor : "var(--color-critical)" }}>{after}{unit}</span>
      </div>
    </div>
  );
}

// Single metric display for Forecasts
function HudMetricForecast({ label, value, unit = "", tooltip = "" }: { label: string; value: number | string; unit?: string; tooltip?: string }) {
  return (
    <div style={{ textAlign: "center" }} title={tooltip}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
        <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</div>
        <HelpCircle size={10} style={{ color: "var(--color-text-muted)" }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "4px", marginTop: "2px" }}>
        <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{value}{unit}</span>
      </div>
    </div>
  );
}

// Component for rendering local operational delta inside the Intelligence Panel
function ProjectedOperationalImpact({ delta, baseline, simulated, patrolRecommendations = [], gridCells = [] }: { delta: any, baseline: any, simulated: any, patrolRecommendations?: any[], gridCells?: H3GridCell[] }) {
  const isOptimal = delta.patrolDelta > 0 && Math.abs(delta.tdpiDelta) < 0.01 && Math.abs(delta.visibilityDelta) < 0.01;

  const baseCapacity = (baseline.recommended_patrol_units ?? 0) * 12;
  const simCapacity = (simulated.recommended_patrol_units ?? 0) * 12;
  const baseUtilization = baseCapacity > 0 ? Math.round(((baseline.estimated_weekly_violations_addressed ?? 0) / baseCapacity) * 100) : 0;
  const simUtilization = simCapacity > 0 ? Math.round(((simulated.estimated_weekly_violations_addressed ?? 0) / simCapacity) * 100) : 0;

  const alternative = isOptimal ? patrolRecommendations
    .filter((r: any) => r.h3_index !== simulated.h3_index)
    .sort((a: any, b: any) => (b.deployment_score || 0) - (a.deployment_score || 0))[0] : null;

  const alternativeCell = alternative ? gridCells.find((c: any) => c.h3Index === alternative.h3_index) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "12px", borderRadius: "10px", backgroundColor: "rgba(34, 211, 238, 0.04)", border: "1px solid rgba(34, 211, 238, 0.2)", marginTop: "12px", animation: "fadeSlideIn 0.3s ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", marginBottom: "4px" }}>
        <Activity size={14} style={{ color: "#22d3ee" }} />
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#22d3ee", textTransform: "uppercase", letterSpacing: "0.05em" }}>Projected Operational Impact</span>
      </div>
      
      {/* Operational Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
        <HudMetricComparative label="TDPI" before={baseline.projected_tdpi ?? baseline.tdpi_score} after={simulated.projected_tdpi ?? simulated.tdpi_score} />
        <HudMetricComparative label="Visibility Gap" before={baseline.visibility_gap_index ?? baseline.visibility_gap?.visibility_gap_index ?? 0} after={simulated.visibility_gap_index ?? simulated.visibility_gap?.visibility_gap_index ?? 0} />
        <HudMetricComparative label="Patrol Allocation" before={baseline.recommended_patrol_units ?? 0} after={simulated.recommended_patrol_units ?? 0} unit="" lowerIsBetter={false} />
        
        {/* Customized Capacity Utilization with tooltip */}
        <div style={{ textAlign: "center" }} title="Represents how efficiently deployed patrol capacity is being used relative to forecasted operational demand. Decreases indicate excess capacity.">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Capacity Utilization</div>
            <HelpCircle size={10} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "4px", marginTop: "2px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)", textDecoration: "line-through", opacity: 0.6 }}>{baseUtilization}%</span>
            <ArrowDown size={10} style={{ color: "var(--color-info)", transform: baseUtilization > simUtilization ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.3s" }} />
            <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-info)" }}>{simUtilization}%</span>
          </div>
          <div style={{ fontSize: "8px", color: "var(--color-text-muted)", marginTop: "2px" }}>
            {simCapacity} units capacity vs {Math.round(simulated.predicted_violations ?? 0)} demand
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", marginTop: "4px", marginBottom: "4px" }}>
        <TrendingUp size={14} style={{ color: "#a855f7" }} />
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#a855f7", textTransform: "uppercase", letterSpacing: "0.05em" }}>Forecast Intelligence</span>
      </div>

      {/* Forecast Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
        <HudMetricForecast 
          label="Forecasted Demand" 
          value={Math.round(baseline.predicted_violations ?? 0)} 
          tooltip="Generated by the CatBoost forecasting model. Represents predicted demand. Unchanged by simulations." 
        />
        <HudMetricForecast 
          label="Forecast Source" 
          value="CatBoost" 
          tooltip="The AI model that produced this baseline prediction." 
        />
      </div>

      {/* AI Assessment */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", marginTop: "2px" }}>
         <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)" }}>AI OPERATIONAL ASSESSMENT</span>
         {isOptimal ? (
           <ul style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "16px", margin: 0 }}>
             <li style={{ color: "var(--color-warning)" }}>Patrol coverage has reached the operational requirement for this sector.</li>
             <li style={{ color: "var(--color-warning)" }}>Forecasted Weekly Violations remain unchanged because this metric represents predicted demand, which is already fully covered by existing units.</li>
             <li style={{ color: "var(--color-warning)" }}>Current patrol allocation exceeds projected operational demand. Additional patrols are unlikely to improve this location further.</li>
             <li style={{ color: "var(--color-brand)" }}>Consider reallocating available patrol units to higher-priority neighboring H3 cells.</li>
           </ul>
         ) : (
           <ul style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px", paddingLeft: "16px", margin: 0 }}>
             {Math.abs(delta.tdpiDelta) > 0.01 && (
               <li style={{ color: delta.tdpiDelta < 0 ? "var(--color-success)" : "var(--color-critical)" }}>
                 Projected TDPI {delta.tdpiDelta < 0 ? "reduced" : "increased"} by {Math.abs(delta.tdpiDelta).toFixed(2)}%.
               </li>
             )}
             {Math.abs(delta.visibilityDelta) > 0.01 && (
               <li style={{ color: delta.visibilityDelta < 0 ? "var(--color-success)" : "var(--color-critical)" }}>
                 Visibility Gap {delta.visibilityDelta < 0 ? "reduced" : "increased"} by {Math.abs(delta.visibilityDelta).toFixed(2)}%.
               </li>
             )}
             {delta.patrolDelta > 0 && (
               <li style={{ color: "var(--color-success)" }}>Additional patrol coverage improves operational enforcement effectiveness.</li>
             )}
             {delta.patrolDelta < 0 && (
               <li style={{ color: "var(--color-warning)" }}>⚠ Patrol coverage reduced in this neighboring cell due to strategic reallocation.</li>
             )}
             <li style={{ color: "var(--color-info)" }}>Forecasted Weekly Violations remain unchanged because this metric represents predicted demand generated by the CatBoost model.</li>
           </ul>
         )}
      </div>

      {/* Suggested Alternative Deployment */}
      {isOptimal && alternative && alternativeCell && (
        <div style={{ marginTop: "12px", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <Target size={12} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" }}>Suggested Alternative Deployment</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>Target Zone</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>{alternativeCell.name}</div>
            </div>
            <div>
              <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>Expected Improvement</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success)", marginTop: "2px" }}>{alternative.operational_improvement_percent}% TDPI Drop</div>
            </div>
            <div>
              <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>Additional Violations</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "2px" }}>{alternative.estimated_weekly_violations_addressed} addressed</div>
            </div>
            <div>
              <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>AI Confidence</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-info)", marginTop: "2px" }}>{alternative.decision_confidence}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 1. TOP OPERATIONAL HUD ---
interface TopHudProps {
  summary?: DashboardSummary;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  simulationResult?: SimulationResult;
  isSimulationActive: boolean;
  activeMode: OperationalMode;
}
export const TopOperationalHud = React.memo(function TopOperationalHud({ summary, isFullscreen, onToggleFullscreen, simulationResult, isSimulationActive, activeMode }: TopHudProps) {
  if (!summary) return null;

  const showComparative = isSimulationActive && simulationResult;

  return (
    <div className="panel-base hud-panel" style={{ transition: "all 0.2s ease" }}>
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: showComparative ? "#f59e0b" : "#06b6d4", boxShadow: showComparative ? "0 0 10px #f59e0b" : "0 0 10px #06b6d4", transition: "all 0.3s" }} className="animate-pulse" />
          <span style={{ fontSize: "11px", fontWeight: 700, color: showComparative ? "#f59e0b" : "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", transition: "color 0.3s" }}>
            {showComparative ? "● SCENARIO RUNNING" : "Twin Stream"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "24px", transition: "all 0.3s ease" }}>
          {showComparative ? (
            /* Comparative simulation metrics */
            <>
              <HudMetricComparative label="City TDPI" before={simulationResult.currentTdpi} after={simulationResult.projectedTdpi} />
              <HudMetricComparative label="Hotspots" before={simulationResult.hotspotsBefore} after={simulationResult.hotspotsAfter} unit="" />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Congestion Drop</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-success)", marginTop: "2px" }}>
                  ↓{simulationResult.congestionReduction}%
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Deployment ROI</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#a855f7", marginTop: "2px" }}>
                  {simulationResult.deploymentBenefitScore}/100
                </div>
              </div>
            </>
          ) : (
            /* Baseline operational metrics */
            <>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>City TDPI</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: summary.cityTdpi > 70 ? "var(--color-critical)" : "var(--color-text-primary)" }}>
                  {summary.cityTdpi}%
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Active Hotspots</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: summary.activeHotspots > 0 ? "var(--color-warning)" : "var(--color-success)" }}>
                  {summary.activeHotspots}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Enforcement Reach</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-info)" }}>
                  {summary.coverageIndex}%
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Visibility Gaps</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: summary.visibilityGapsCount > 0 ? "var(--color-critical)" : "var(--color-success)" }}>
                  {summary.visibilityGapsCount}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>AI Confidence</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-success)" }}>
                  {summary.catboost?.validationConfidence || 96.4}%
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Backend</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand)" }}>
                  Nominal
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={onToggleFullscreen}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
});

// --- Map Legend Component ---
function MapLegend({ mode, layer }: { mode: OperationalMode; layer: MapLayer }) {
  const [expanded, setExpanded] = useState(false);

  const legendItems = useMemo(() => {
    if (mode === "predict") {
      return [
        { color: "rgb(255, 55, 95)", label: "High Forecast Risk" },
        { color: "rgb(140, 40, 75)", label: "Moderate Risk" },
        { color: "rgb(20, 30, 60)", label: "Low Risk" },
      ];
    }
    if (layer === "visibility") {
      return [
        { color: "rgb(175, 82, 222)", label: "Critical Gap (>70%)" },
        { color: "rgb(90, 200, 250)", label: "Moderate Gap" },
        { color: "rgb(40, 50, 70)", label: "Monitored" },
      ];
    }
    return [
      { color: "rgb(255, 59, 48)", label: "Critical TDPI (>70%)" },
      { color: "rgb(255, 149, 0)", label: "High TDPI (40-70%)" },
      { color: "rgb(52, 199, 89)", label: "Moderate TDPI" },
      { color: "rgb(30, 40, 60)", label: "Low TDPI (<15%)" },
    ];
  }, [mode, layer]);

  return (
    <div style={{ marginTop: "auto", paddingTop: "12px" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: expanded ? "10px 14px" : "8px 12px",
          borderRadius: "10px",
          backgroundColor: "rgba(12, 15, 29, 0.4)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "var(--color-text-secondary)",
          cursor: "pointer",
          fontSize: "10px",
          fontWeight: 700,
          display: "flex",
          flexDirection: "column",
          gap: expanded ? "8px" : "0px",
          transition: "all 0.2s ease",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "linear-gradient(135deg, #ff3b30, #34c759)", flexShrink: 0 }} />
          {expanded ? "MAP LEGEND" : "MAP LEGEND"}
        </span>
        
        {expanded && (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "4px" }}>
            {legendItems.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "2px", backgroundColor: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{item.label}</span>
              </div>
            ))}
            {/* Symbols */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "5px", marginTop: "2px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgb(59, 130, 246)", flexShrink: 0 }} />
              <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>Patrol Unit</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", border: "2px solid rgba(59, 130, 246, 0.5)", flexShrink: 0 }} />
              <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>Coverage Radius</span>
            </div>
            {mode === "plan" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "2px", border: "1.5px solid rgb(245, 158, 11)", flexShrink: 0 }} />
                <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>AI Recommended</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "12px", height: "4px", display: "flex", alignItems: "center" }}>
                <span style={{ width: "100%", height: "2px", backgroundColor: "white", borderRadius: "1px", opacity: 0.6 }} />
              </span>
              <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>3D Height = Severity</span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

// --- 2. LEFT MODE SELECTOR PANEL ---
interface LeftModesPanelProps {
  activeMode: OperationalMode;
  setActiveMode: (mode: OperationalMode) => void;
  activeLayer: MapLayer;
  setActiveLayer: (layer: MapLayer) => void;
  isFullscreen?: boolean;
}
export const LeftModesPanel = React.memo(function LeftModesPanel({ activeMode, setActiveMode, activeLayer, setActiveLayer, isFullscreen }: LeftModesPanelProps) {
  const modesList = [
    { id: "observe" as const, label: "Observe", desc: "Situation awareness", icon: Eye },
    { id: "predict" as const, label: "Predict", desc: "Forecast outlook", icon: TrendingUp },
    { id: "plan" as const, label: "Plan", desc: "Patrol allocation", icon: Shield },
    { id: "simulate" as const, label: "Simulate", desc: "Impact assessment", icon: Sliders },
    { id: "explain" as const, label: "Explain", desc: "AI reasoning", icon: HelpCircle },
  ];

  return (
    <div className={`panel-base modes-panel ${isFullscreen ? "modes-panel-compact" : ""}`} style={{ transition: "all 0.2s ease" }}>
      {/* Modes Selection */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <Compass size={16} style={{ color: "var(--color-brand)" }} />
          <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>OPERATIONAL MODE</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {modesList.map((m) => {
            const isSelected = activeMode === m.id;
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: isSelected ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  borderLeft: isSelected ? "3px solid var(--color-brand)" : "3px solid transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon size={16} style={{ color: isSelected ? "var(--color-brand)" : "var(--color-text-secondary)" }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: isSelected ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-muted)", marginTop: "2px" }}>{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Layer Toggles (Only available in Observe mode) */}
        {activeMode === "observe" && (
          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "12px", transition: "opacity 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Layers size={14} style={{ color: "#06b6d4" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)" }}>GRID INTELLIGENCE LAYER</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Button
                variant={activeLayer === "tdpi" ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveLayer("tdpi")}
                style={{ justifyContent: "flex-start", fontSize: "11px", height: "30px" }}
              >
                TDPI Congestion Heat
              </Button>
              <Button
                variant={activeLayer === "visibility" ? "default" : "secondary"}
                size="sm"
                onClick={() => setActiveLayer("visibility")}
                style={{ justifyContent: "flex-start", fontSize: "11px", height: "30px" }}
              >
                Visibility Gap Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Mode-specific context labels */}
        {activeMode === "predict" && (
          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "12px", transition: "opacity 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <TrendingUp size={14} style={{ color: "#f472b6" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)" }}>FORECAST MODE</span>
            </div>
            <p style={{ fontSize: "10px", lineHeight: 1.4, color: "var(--color-text-muted)" }}>
              Viewing projected operational intensity. Use the timeline to explore temporal patterns. Colors indicate forecasted risk severity.
            </p>
          </div>
        )}

        {activeMode === "plan" && (
          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "12px", transition: "opacity 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <Target size={14} style={{ color: "#f59e0b" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)" }}>PLANNING MODE</span>
            </div>
            <p style={{ fontSize: "10px", lineHeight: 1.4, color: "var(--color-text-muted)" }}>
              Gold-highlighted cells are AI-recommended deployment targets. Select a cell and assign patrol squads from the right panel.
            </p>
          </div>
        )}

        {activeMode === "simulate" && (
          <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "12px", transition: "opacity 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <Activity size={14} style={{ color: "#22d3ee" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)" }}>SIMULATION MODE</span>
            </div>
            <p style={{ fontSize: "10px", lineHeight: 1.4, color: "var(--color-text-muted)" }}>
              Map shows projected operational state with current patrol allocations applied. Review assessment metrics in the right panel.
            </p>
          </div>
        )}
        
        {/* Render MapLegend cleanly inside the Operational Mode box */}
        <MapLegend mode={activeMode} layer={activeLayer} />
      </div>
    </div>
  );
});

// --- 3. RIGHT PANEL: AI EXPLAINABILITY & SIMULATION DECK ---
interface RightPanelProps {
  activeMode: OperationalMode;
  selectedCell: H3GridCell | null;
  patrolUnits?: PatrolUnit[];
  onDeployPatrol: (squadId: string, cellIndex: string | null) => void;
  onResetSimulation: () => void;
  simulationResult?: SimulationResult;
  isSimulationActive: boolean;
  patrolRecommendations?: any[];
  onAutoAllocate?: () => void;
  deploymentFeedback?: DeploymentFeedback | null;
  onDismissFeedback?: () => void;
  gridCells?: H3GridCell[];
  simData?: any;
  scenarioDeltas?: any[];
}
export const RightIntelligencePanel = React.memo(function RightIntelligencePanel({
  activeMode,
  selectedCell,
  patrolUnits = [],
  onDeployPatrol,
  onResetSimulation,
  simulationResult,
  isSimulationActive,
  patrolRecommendations = [],
  onAutoAllocate,
  deploymentFeedback,
  onDismissFeedback,
  gridCells = [],
  simData,
  scenarioDeltas = []
}: RightPanelProps) {

  const isCompact = !selectedCell && activeMode !== "plan" && activeMode !== "simulate";

  // --- SIMULATE MODE: Assessment Dashboard ---
  if (activeMode === "simulate") {
    return (
      <div className="panel-base intelligence-panel no-scrollbar" style={{ transition: "all 0.2s ease" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Header */}
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={16} style={{ color: "#22d3ee" }} />
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>SIMULATION ASSESSMENT</h2>
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              Projected outcomes based on current patrol allocations
            </div>
          </div>

          {/* Deployment Feedback Toast (Component 4) */}
          {deploymentFeedback && (
            <DeploymentFeedbackCard feedback={deploymentFeedback} onDismiss={onDismissFeedback} />
          )}

          {simulationResult ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Comparative TDPI */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>Baseline TDPI</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-warning)", marginTop: "4px" }}>{simulationResult.currentTdpi}%</div>
                </div>
                <div style={{ backgroundColor: "rgba(16, 185, 129, 0.04)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.12)" }}>
                  <div style={{ fontSize: "9px", color: "var(--color-success)" }}>Projected TDPI</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-success)", marginTop: "4px" }}>{simulationResult.projectedTdpi}%</div>
                </div>
              </div>

              {/* Key Deltas */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Congestion Reduction</span>
                  <strong style={{ color: "var(--color-success)" }}>↓ {simulationResult.congestionReduction}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Visibility Gap Reduction</span>
                  <strong style={{ color: "var(--color-success)" }}>↓ {simulationResult.operationalRiskReduction}%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "8px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Hotspots Before → After</span>
                  <strong style={{ color: "var(--color-text-primary)" }}>{simulationResult.hotspotsBefore} → {simulationResult.hotspotsAfter}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Deployment Benefit Score</span>
                  <strong style={{ color: "#a855f7" }}>{simulationResult.deploymentBenefitScore}/100</strong>
                </div>
              </div>

              {/* Reset Action */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
                <Button variant="secondary" size="sm" onClick={onResetSimulation} style={{ width: "100%", fontSize: "10px", height: "30px", gap: "4px" }}>
                  <RotateCcw size={12} /> Reset Patrol Allocations
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center" }}>
                Deploy patrols in Plan mode to see simulation assessment.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- PLAN MODE: Recommendations + Squad Allocation ---
  if (activeMode === "plan") {
    return (
      <div className="panel-base intelligence-panel no-scrollbar" style={{ transition: "all 0.2s ease" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Header */}
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={16} style={{ color: "#f59e0b" }} />
              <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>DEPLOYMENT PLANNING</h2>
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {selectedCell ? `Target: ${selectedCell.name}` : "Select a cell to assign patrols"}
            </div>
          </div>

          {/* Deployment Feedback Toast (Component 4) */}
          {deploymentFeedback && (
            <DeploymentFeedbackCard feedback={deploymentFeedback} onDismiss={onDismissFeedback} />
          )}

          {/* AI Recommendations Deck */}
          {patrolRecommendations.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Target size={12} style={{ color: "#f59e0b" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)" }}>AI RECOMMENDATIONS</span>
                </div>
                {onAutoAllocate && (
                  <button
                    onClick={onAutoAllocate}
                    style={{
                      fontSize: "9px", fontWeight: 700, color: "#f59e0b",
                      backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)",
                      borderRadius: "6px", padding: "4px 8px", cursor: "pointer", transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.2)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.1)"}
                  >
                    Auto Allocate
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "100px", overflowY: "auto" }}>
                {patrolRecommendations
                  .sort((a: any, b: any) => (b.deployment_score || 0) - (a.deployment_score || 0))
                  .slice(0, 4)
                  .map((rec: any, idx: number) => {
                    const cellName = gridCells.find(c => c.h3Index === rec.h3_index)?.name || rec.h3_index?.substring(0, 10);
                    return (
                      <div key={idx} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "6px 8px", borderRadius: "6px", backgroundColor: "rgba(245, 158, 11, 0.04)",
                        border: "1px solid rgba(245, 158, 11, 0.08)", fontSize: "10px"
                      }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>{cellName}</span>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>Score: {Math.round(rec.deployment_score || 0)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Selected Zone Summary */}
          {selectedCell && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>TDPI Congestion</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: selectedCell.tdpi > 70 ? "var(--color-critical)" : "var(--color-text-primary)", marginTop: "2px" }}>
                  {selectedCell.tdpi}%
                </div>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>Visibility Gap</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: selectedCell.visibilityGap > 70 ? "var(--color-critical)" : "var(--color-text-primary)", marginTop: "2px" }}>
                  {selectedCell.visibilityGap}%
                </div>
              </div>
            </div>
          )}

          {/* PHASE 21: Projected Operational Impact (Plan Mode) */}
          {isSimulationActive && selectedCell && scenarioDeltas.find(d => d.h3Index === selectedCell.h3Index) && (
            <ProjectedOperationalImpact
              delta={scenarioDeltas.find(d => d.h3Index === selectedCell.h3Index)}
              baseline={simData?.baseline?.find((c: any) => c.h3_index === selectedCell.h3Index)}
              simulated={simData?.simulated?.find((c: any) => c.h3_index === selectedCell.h3Index)}
              patrolRecommendations={patrolRecommendations}
              gridCells={gridCells}
            />
          )}

          {/* Squad Allocation */}
          {selectedCell && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)" }}>PATROL ALLOCATIONS</span>
                <Button variant="ghost" size="sm" onClick={onResetSimulation} style={{ height: "24px", fontSize: "10px", color: "var(--color-text-muted)" }}>
                  <RotateCcw size={10} style={{ marginRight: "4px" }} /> Reset
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {patrolUnits?.map((patrol) => {
                  const isAssignedHere = patrol.assignedCell === selectedCell.h3Index;
                  return (
                    <div
                      key={patrol.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        border: isAssignedHere ? "1px solid var(--color-brand)" : "1px solid rgba(255,255,255,0.04)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)" }}>{patrol.name}</div>
                        <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>
                          Officers: {patrol.officerCount} • {patrol.status}
                        </div>
                      </div>

                      {isAssignedHere ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onDeployPatrol(patrol.id, null)}
                          style={{ height: "26px", fontSize: "10px", color: "var(--color-critical)" }}
                        >
                          Recall
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onDeployPatrol(patrol.id, selectedCell.h3Index)}
                          style={{ height: "26px", fontSize: "10px" }}
                        >
                          Deploy
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!selectedCell && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center" }}>
                Select a hotspot cell on the map to assign patrol squads.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- OBSERVE / PREDICT / EXPLAIN MODES: Explainability Panel ---
  return (
    <div className={`panel-base intelligence-panel no-scrollbar ${isCompact ? "compact" : ""}`} style={{ transition: "all 0.2s ease" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} style={{ color: "#06b6d4" }} />
            <h2 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>AI EXPLAINABILITY</h2>
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {selectedCell ? `Selected Zone: ${selectedCell.name}` : "Select a cell on the map grid"}
          </div>
        </div>

        {/* Selected Zone Summary */}
        {selectedCell ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* KPI grid for selected zone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>TDPI Congestion</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: selectedCell.tdpi > 70 ? "var(--color-critical)" : "var(--color-text-primary)", marginTop: "2px" }}>
                  {selectedCell.tdpi}%
                </div>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>Visibility Gap</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: selectedCell.visibilityGap > 70 ? "var(--color-critical)" : "var(--color-text-primary)", marginTop: "2px" }}>
                  {selectedCell.visibilityGap}%
                </div>
              </div>
            </div>

            {/* Metric Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>PIPELINE INTELLIGENCE:</div>
              <MetricBar label="Hourly Operational Intensity" value={selectedCell.predictedRisk} color={selectedCell.predictedRisk > 70 ? "var(--color-critical)" : "var(--color-brand)"} tooltip="Calculated by weighting the baseline CatBoost prediction against historical hourly collection rates." />
              <MetricBar label="Historical Violations" value={selectedCell.historicalViolations} max={200} unit=" cases" color="var(--color-warning)" />
              <MetricBar label="Forecast Confidence" value={Math.round(selectedCell.forecastConfidence * 100)} color="var(--color-success)" />
              <MetricBar label="AI Deployment Score" value={selectedCell.deploymentScore} color="#a855f7" />
            </div>

            {/* AI Reasoning */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Zap size={14} style={{ color: "#eab308" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)" }}>AI Operational Reasoning</span>
              </div>
              <p style={{ fontSize: "11px", lineHeight: 1.5, color: "var(--color-text-secondary)" }}>
                {selectedCell.explanation}
              </p>

              {/* Simulation-aware addendum for Explain mode */}
              {activeMode === "explain" && isSimulationActive && (
                <div style={{ marginTop: "8px", padding: "8px", borderRadius: "8px", backgroundColor: "rgba(34, 211, 238, 0.04)", border: "1px solid rgba(34, 211, 238, 0.1)" }}>
                  <p style={{ fontSize: "10px", lineHeight: 1.4, color: "#22d3ee" }}>
                    Scenario Running: Projected operational impact visualized on map overlay.
                    {simulationResult && ` City-wide TDPI projected to shift from ${simulationResult.currentTdpi}% to ${simulationResult.projectedTdpi}%.`}
                  </p>
                </div>
              )}
            </div>

            {/* PHASE 21: Projected Operational Impact (Explain Mode) */}
            {isSimulationActive && scenarioDeltas.find(d => d.h3Index === selectedCell.h3Index) && (
              <ProjectedOperationalImpact
                delta={scenarioDeltas.find(d => d.h3Index === selectedCell.h3Index)}
                baseline={simData?.baseline?.find((c: any) => c.h3_index === selectedCell.h3Index)}
                simulated={simData?.simulated?.find((c: any) => c.h3_index === selectedCell.h3Index)}
                patrolRecommendations={patrolRecommendations}
                gridCells={gridCells}
              />
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center" }}>
              Click any H3 Hexagon cell or Hotspot marker on the map to query intelligence details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

// --- DEPLOYMENT FEEDBACK CARD (Component 4) ---
function DeploymentFeedbackCard({ feedback, onDismiss }: { feedback: DeploymentFeedback; onDismiss?: () => void }) {
  return (
    <div style={{
      padding: "12px", borderRadius: "10px",
      backgroundColor: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.15)",
      display: "flex", flexDirection: "column", gap: "8px",
      animation: "fadeSlideIn 0.2s ease-out",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success)" }}>
            {feedback.squadName} Deployed
          </span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "2px" }}>
            <X size={12} />
          </button>
        )}
      </div>
      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
        Target: {feedback.cellName}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "10px" }}>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>TDPI Reduction: </span>
          <strong style={{ color: "var(--color-success)" }}>−{feedback.expectedTdpiReduction}%</strong>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Coverage: </span>
          <strong style={{ color: "var(--color-success)" }}>+{feedback.coverageGain}%</strong>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Violations: </span>
          <strong style={{ color: "var(--color-text-primary)" }}>{feedback.violationsAddressed}</strong>
        </div>
        <div>
          <span style={{ color: "var(--color-text-muted)" }}>Confidence: </span>
          <strong style={{ color: "var(--color-info)" }}>{feedback.confidence}%</strong>
        </div>
      </div>
    </div>
  );
}


// --- 4. BOTTOM FORECAST TIMELINE PLAYER ---
interface TimelineProps {
  hours: string[];
  activeHour: string;
  onChangeHour: (hour: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  activeMode?: OperationalMode;
}
export const ForecastTimelineSlider = React.memo(function ForecastTimelineSlider({ hours, activeHour, onChangeHour, isPlaying, onTogglePlay, activeMode }: TimelineProps) {
  const [playbackSpeed, setPlaybackSpeed] = React.useState<1 | 2 | 4>(1);
  const currentIndex = hours.indexOf(activeHour);

  // Auto animation playback hook
  useEffect(() => {
    if (!isPlaying) return;
    
    // Use a clean timeout sequence that correctly references the activeHour without leaking closures
    const timeoutId = setTimeout(() => {
      const idx = hours.indexOf(activeHour);
      const nextIdx = idx >= hours.length - 1 ? 0 : idx + 1;
      onChangeHour(hours[nextIdx]);
    }, 2400 / playbackSpeed); // Slower base speed (2.4s) makes 1x and 2x much more readable
    
    return () => clearTimeout(timeoutId);
  }, [isPlaying, hours, activeHour, onChangeHour, playbackSpeed]);

  const isPredictMode = activeMode === "predict";

  return (
    <div className="panel-base timeline-panel" style={{ transition: "all 0.2s ease" }}>
      {/* Play/Pause Button */}
      <button
        onClick={onTogglePlay}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: isPlaying ? "rgba(239, 68, 68, 0.15)" : isPredictMode ? "rgba(244, 114, 182, 0.15)" : "rgba(59, 130, 246, 0.15)",
          border: isPlaying ? "1px solid var(--color-critical)" : isPredictMode ? "1px solid #f472b6" : "1px solid var(--color-brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: isPlaying ? "var(--color-critical)" : isPredictMode ? "#f472b6" : "var(--color-brand)",
          transition: "all 0.2s ease",
          outline: "none",
        }}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: "2px" }} />}
      </button>

      {/* Hour Info */}
      <div style={{ width: "140px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "10px", color: isPredictMode ? "#f472b6" : "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "4px", transition: "color 0.2s" }} title="Displays hourly operational intensity by distributing the weekly AI forecast using historical parking violation patterns. The underlying AI forecast remains unchanged.">
          {isPredictMode ? "FORECAST TIMELINE" : "OPERATIONAL INTELLIGENCE TIMELINE"} <HelpCircle size={10} style={{ color: "var(--color-text-muted)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{activeHour}</div>
          <button 
            onClick={() => setPlaybackSpeed(prev => prev === 1 ? 2 : prev === 2 ? 4 : 1)}
            style={{ 
              fontSize: "10px", 
              fontWeight: 700, 
              color: "var(--color-brand)", 
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "4px",
              padding: "2px 6px",
              cursor: "pointer",
            }}
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* Slider */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <input
          type="range"
          min="0"
          max={hours.length - 1}
          value={currentIndex}
          onChange={(e) => onChangeHour(hours[parseInt(e.target.value)])}
          style={{
            width: "100%",
            accentColor: isPredictMode ? "#f472b6" : "var(--color-brand)",
            height: "4px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "2px",
            outline: "none",
            cursor: "pointer",
          }}
        />

        {/* Labels */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--color-text-muted)" }}>
          <span>08:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>22:00</span>
        </div>
      </div>
    </div>
  );
});
