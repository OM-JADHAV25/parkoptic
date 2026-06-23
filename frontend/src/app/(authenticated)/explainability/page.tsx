"use client";

import React, { useState } from "react";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, CardFooter, Badge, Button, Skeleton } from "@/components/ui";
import { useMapIntelligence } from "@/hooks/useIntelligence";
import { Eye, HelpCircle, Activity, Sparkles, ShieldAlert, Award } from "lucide-react";
import Link from "next/link";

// Custom SVG Circular Gauge Component for premium aesthetics
function CircularGauge({ value, label, color = "#3b82f6" }: { value?: number; label: string; color?: string }) {
  const radius = 35;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const validValue = value !== undefined ? value : 0;
  const strokeDashoffset = circumference - (validValue / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "10px" }}>
      <div style={{ position: "relative", width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
          {/* Background Track circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Main filled circle */}
          <circle
            stroke={value !== undefined ? color : "transparent"}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 0.8s ease" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: value !== undefined ? "#f1f5f9" : "var(--color-text-secondary)" }}>
          {value !== undefined ? `${value}%` : "N/A"}
        </div>
      </div>
      <span style={{ fontSize: "9px", color: "var(--color-text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
    </div>
  );
}

// Custom Horizontal Feature Contribution Progress Bar
function FeatureContributionBar({ label, value, color = "#06b6d4" }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-text-secondary)" }}>
        <span>{label}</span>
        <strong style={{ color: "#f1f5f9" }}>{value}%</strong>
      </div>
      <div style={{ width: "100%", height: "5px", backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "4px", overflow: "hidden" }}>
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: "4px",
            boxShadow: `0 0 8px ${color}`,
            transition: "width 0.8s ease"
          }}
        />
      </div>
    </div>
  );
}

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function ExplainabilityPageInner() {
  const searchParams = useSearchParams();
  const cellParam = searchParams ? searchParams.get("cell") : null;
  const [selectedCellIndex, setSelectedCellIndex] = useState<string>("8861892604fffff"); // Default to MG Road Metro
  
  const { data: cells = [], isLoading: loadingCells } = useMapIntelligence("12:00", "explain");
  
  useEffect(() => {
    if (cellParam) {
      setSelectedCellIndex(cellParam);
    }
  }, [cellParam]);
  
  const info = cells.find(c => c.h3Index === selectedCellIndex);
  const loadingInfo = loadingCells;

  const handleSelectCell = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCellIndex(e.target.value);
  };

  return (
    <PageWrapper
      title="AI Explainability Interface"
      description="Inspect validation criteria, trace CatBoost priority features, and read natural-language explainability summaries."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr", gap: "24px" }}>
        
        {/* Left Column: Select Region & Metrics list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card variant="glass">
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Eye size={16} style={{ color: "var(--color-brand)" }} />
                  <span>Grid Target Selector</span>
                </div>
              }
              subtitle="Choose a spatial H3 cell to query model priorities"
            />
            <CardBody style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: 700 }}>CHOOSE BENGALURU H3 CELL</label>
                {loadingCells ? (
                  <Skeleton height={36} />
                ) : (
                  <select
                    value={selectedCellIndex}
                    onChange={handleSelectCell}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(12, 15, 29, 0.9)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#f1f5f9",
                      fontSize: "0.82rem",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    {cells.map(c => (
                      <option key={c.h3Index} value={c.h3Index}>{c.name} ({c.h3Index.substring(0,8)})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Dynamic metrics */}
              {info && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Index Reference:</span>
                    <span style={{ fontFamily: "monospace", color: "#f1f5f9" }}>{info.h3Index}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Historical Violations Weight:</span>
                    <strong style={{ color: "var(--color-warning)" }}>{info.historicalViolations} cases</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Forecast Confidence Interval:</span>
                    <strong style={{ color: "var(--color-success)" }}>{Math.round(info.forecastConfidence * 100)}%</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Recommended Squad Units:</span>
                    <strong style={{ color: "var(--color-info)" }}>{info.recommendedPatrolUnits} Squads</strong>
                  </div>
                </div>
              )}
            </CardBody>
            {info && (
              <CardFooter>
                <Link href={`/map?cell=${info.h3Index}`} style={{ width: "100%" }}>
                  <Button variant="default" style={{ width: "100%", gap: "6px" }}>
                    Show in Bengaluru Digital Twin
                  </Button>
                </Link>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Right Column: Visual Dials & Gauges */}
        <Card variant="default">
          <CardHeader
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} style={{ color: "#06b6d4" }} />
                <span>Model Prioritization Gauges & Features</span>
              </div>
            }
            subtitle="Gauges showing classification weights and contributions"
          />
          <CardBody style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {loadingInfo ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Skeleton height={100} />
                <Skeleton height={100} />
              </div>
            ) : info ? (
              <>
                {/* Circular Dials row */}
                <div style={{ display: "flex", justifyContent: "space-around", backgroundColor: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <CircularGauge value={info.baselineTdpi ?? info.tdpi} label="TDPI Index" color="var(--color-warning)" />
                  <CircularGauge value={info.visibilityGap} label="Visibility Gap" color="var(--color-critical)" />
                  <CircularGauge value={info.deploymentScore} label="Priority Score" color="#a855f7" />
                </div>

                {/* Feature Contribution bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Feature Importance Weights</span>
                  <FeatureContributionBar label="Historical Violations Load Contribution" value={72} color="var(--color-warning)" />
                  <FeatureContributionBar label="Patrol Visibility Gap Contribution" value={54} color="var(--color-critical)" />
                  <FeatureContributionBar label="Road Network Hub Centrality" value={38} color="var(--color-info)" />
                </div>

                {/* Natural language Explanation summary block */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <HelpCircle size={14} style={{ color: "#a855f7" }} />
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase" }}>AI Explanation Summary</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", lineHeight: 1.55, color: "var(--color-text-secondary)" }}>
                    {info.explanation}
                  </p>
                </div>
              </>
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                Select an H3 cell on the left.
              </div>
            )}
          </CardBody>
        </Card>

      </div>
    </PageWrapper>
  );
}

export default function ExplainabilityPage() {
  return (
    <Suspense fallback={
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#070913", color: "var(--color-text-secondary)", minHeight: "80vh" }}>
        Loading AI Explainability Interface...
      </div>
    }>
      <ExplainabilityPageInner />
    </Suspense>
  );
}
