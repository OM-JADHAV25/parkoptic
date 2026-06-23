"use client";

import React, { useState } from "react";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, Badge, Button, Skeleton } from "@/components/ui";
import { useMapIntelligence } from "@/hooks/useIntelligence";
import { Map, SlidersHorizontal, AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getSeverityCSS, getSeverityLabel, getSeverityBadgeClass, getSeverityIcon, isSeverityMatch } from "@/utils/severity";

export default function HotspotsPage() {
  const { data: cells = [], isLoading, isError, error, refetch } = useMapIntelligence("12:00");
  const [filterType, setFilterType] = useState<"all" | "critical" | "warning">("all");
  const [sortBy, setSortBy] = useState<"tdpi" | "risk" | "gap">("tdpi");

  // Filter cells based on status using shared severity match
  const hotspotsList = cells.filter(c => {
    if (filterType !== "all") {
      return isSeverityMatch(c.hotspotTier, filterType);
    }
    const tdpiVal = c.baselineTdpi ?? c.tdpi;
    return tdpiVal > 30; // only show active hot spots
  });

  // Sort
  const sortedHotspots = [...hotspotsList].sort((a, b) => {
    if (sortBy === "risk") return b.predictedRisk - a.predictedRisk;
    if (sortBy === "gap") return (b.visibilityGap ?? 0) - (a.visibilityGap ?? 0);
    return (b.baselineTdpi ?? b.tdpi) - (a.baselineTdpi ?? a.tdpi);
  });

  return (
    <PageWrapper
      title="Critical Hotspots"
      description="Inspect active traffic hotspots, track predicted congestion levels, and re-deploy patrol coverage directly."
    >
      {isError ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
          <Card variant="glass" style={{ maxWidth: "500px", borderLeft: "4px solid var(--color-critical)" }}>
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-critical)" }}>
                  <AlertCircle size={20} />
                  <span>Failed to Retrieve Hotspots</span>
                </div>
              }
            />
            <CardBody>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                An error occurred while connecting to the geospatial hotspots analytics node. Make sure the backend server is reachable.
              </p>
              {error && (
                <div style={{ padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px", color: "#f87171", marginBottom: "16px" }}>
                  {error.message}
                </div>
              )}
              <Button variant="default" onClick={() => refetch()} style={{ width: "100%" }}>
                Retry Sync Connection
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          
          {/* Sorting and Filter controls */}
          <div
            style={{
              padding: "12px 20px",
              borderRadius: "12px",
              backgroundColor: "rgba(12, 15, 29, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SlidersHorizontal size={14} style={{ color: "var(--color-brand)" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)" }}>FILTER AND SORT CONTROLS</span>
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {/* Filter */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>SEVERITY:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#cbd5e1",
                    fontSize: "10px",
                    outline: "none"
                  }}
                >
                  <option value="all">All active</option>
                  <option value="critical">Critical Only</option>
                  <option value="warning">Warning Only</option>
                </select>
              </div>

              {/* Sort */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>SORT BY:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#cbd5e1",
                    fontSize: "10px",
                    outline: "none"
                  }}
                >
                  <option value="tdpi">TDPI Congestion</option>
                  <option value="risk">Predicted Risk</option>
                  <option value="gap">Visibility Gap</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hotspots list table */}
          <Card variant="glass">
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={16} style={{ color: "var(--color-critical)" }} />
                  <span>Geospatial Hotspots Register</span>
                </div>
              }
              subtitle="Active congestion hotspots mapped in the central Bengaluru grid"
            />
            <CardBody style={{ marginTop: "12px" }}>
              {isLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                </div>
              ) : sortedHotspots.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>
                  No active hotspots matching the selected filters.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  
                  {/* Column Headers */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr", padding: "10px 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)" }}>
                    <span>LOCATION / H3 CELL</span>
                    <span>TDPI</span>
                    <span>VISIBILITY GAP</span>
                    <span>FORECAST CONFIDENCE</span>
                    <span>HISTORICAL CASE COUNT</span>
                    <span>ACTIONS</span>
                  </div>

                  {/* Data rows */}
                  {sortedHotspots.map((cell) => {
                    const cellTdpi = cell.baselineTdpi ?? cell.tdpi;
                    const severityColor = getSeverityCSS(cell.hotspotTier, cell.tdpiPercentile);
                    return (
                      <div
                        key={cell.h3Index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.4fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr",
                          padding: "14px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(255,255,255,0.01)",
                          border: "1px solid rgba(255,255,255,0.04)",
                          alignItems: "center",
                          fontSize: "0.8rem"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{cell.name}</div>
                            <span 
                              className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getSeverityBadgeClass(cell.hotspotTier)}`}
                            >
                              {getSeverityLabel(cell.hotspotTier)}
                            </span>
                          </div>
                          <div style={{ fontSize: "9px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px" }}>
                            {cell.h3Index}
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, color: severityColor, display: "flex", alignItems: "center", gap: "6px" }}>
                          {React.createElement(getSeverityIcon(cell.hotspotTier), { size: 12 })}
                          <span>{cellTdpi}%</span>
                        </div>

                        <div style={{ color: "#cbd5e1" }}>
                          {cell.visibilityGap}%
                        </div>

                        <div style={{ color: "var(--color-success)" }}>
                          {Math.round(cell.forecastConfidence * 100)}%
                        </div>

                        <div style={{ color: "#cbd5e1" }}>
                          {cell.historicalViolations} cases
                        </div>

                        <div>
                          <Link href={`/map?cell=${cell.h3Index}`}>
                            <Button variant="ghost" size="sm" style={{ height: "26px", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Map size={11} /> Trace Twin
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </PageWrapper>
  );
}
