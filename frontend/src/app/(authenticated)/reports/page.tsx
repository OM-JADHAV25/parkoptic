"use client";

import React, { useState } from "react";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, Badge, Button, Skeleton } from "@/components/ui";
import { useCategorizedReports } from "@/hooks/useIntelligence";
import { FileText, Download, Eye, Sparkles, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState<"executive" | "forecast" | "patrol" | "impact">("executive");
  const { data: reports = [], isLoading } = useCategorizedReports(selectedCategory);
  
  // States for download simulation
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(-1);

  const triggerDownloadSimulation = (id: string) => {
    setSelectedReportId(id);
    setDownloadProgress(0);
    
    // Simulate incremental download percentages
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setDownloadProgress(-1), 1500); // clear overlay after success
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  return (
    <PageWrapper
      title="Performance Reports"
      description="Inspect weekly generated AI summary digests, forecast charts, and deployment assessment documents."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        
        {/* Left Column: Categories List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Card variant="glass" style={{ padding: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                Report Category
              </span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(["executive", "forecast", "patrol", "impact"] as const).map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        textAlign: "left",
                        border: "none",
                        backgroundColor: isActive ? "rgba(59, 130, 246, 0.15)" : "transparent",
                        color: isActive ? "#f1f5f9" : "var(--color-text-secondary)",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        textTransform: "capitalize",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      {cat} Reports
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* PDF Download overlay notice */}
          {downloadProgress >= 0 && (
            <Card variant="default" style={{ border: "1px solid var(--color-brand)", backgroundColor: "rgba(59, 130, 246, 0.05)" }}>
              <CardBody style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                {downloadProgress < 100 ? (
                  <>
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-brand)" }} />
                    <span style={{ fontSize: "11px", color: "#f1f5f9", fontWeight: 600 }}>
                      Compiling PDF Report: {downloadProgress}%
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={24} style={{ color: "var(--color-success)" }} />
                    <span style={{ fontSize: "11px", color: "var(--color-success)", fontWeight: 700 }}>
                      Download Completed
                    </span>
                  </>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column: Selected Category Documents & Previews */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {isLoading ? (
            <Skeleton height={200} />
          ) : reports.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
              No reports found.
            </div>
          ) : (
            reports.map((report) => (
              <Card key={report.id} variant="default">
                <CardHeader
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={16} style={{ color: "var(--color-brand)" }} />
                      <span>{report.title}</span>
                    </div>
                  }
                  subtitle={`Generated on: ${report.date}`}
                />
                <CardBody style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <p style={{ fontSize: "0.82rem", lineHeight: 1.5, color: "#cbd5e1" }}>
                    {report.description}
                  </p>

                  {/* Summary & metrics panel */}
                  <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <Sparkles size={12} style={{ color: "var(--color-brand)" }} />
                      <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-text-secondary)" }}>EXECUTIVE METRICS SNAPSHOT</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.4 }}>
                      {report.summary}
                    </p>
                    
                    {/* Small metrics row */}
                    <div style={{ display: "flex", gap: "24px", marginTop: "12px", fontSize: "10px" }}>
                      <div>
                        <span style={{ color: "var(--color-text-muted)" }}>Avg TDPI:</span>{" "}
                        <strong style={{ color: "var(--color-warning)" }}>{report.tdpi}%</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--color-text-muted)" }}>Visibility Gap:</span>{" "}
                        <strong style={{ color: "#22d3ee" }}>{report.visibilityGap}%</strong>
                      </div>
                      <div>
                        <span style={{ color: "var(--color-text-muted)" }}>Risk Reduction:</span>{" "}
                        <strong style={{ color: "var(--color-success)" }}>↓ {report.expectedReduction}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Action items */}
                  <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "14px", marginTop: "4px" }}>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => triggerDownloadSimulation(report.id)}
                      style={{ gap: "6px", fontSize: "11px", height: "30px" }}
                    >
                      <Download size={12} /> Download PDF
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>

      </div>
    </PageWrapper>
  );
}
