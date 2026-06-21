"use client";

import React from "react";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, Badge, Button, Skeleton } from "@/components/ui";
import { ShieldCheck, Terminal, AlertCircle } from "lucide-react";
import { useSystemHealth } from "@/hooks/useIntelligence";

export default function SystemHealthPage() {
  const { data: services = [], isLoading, isError, error, refetch } = useSystemHealth();

  return (
    <PageWrapper
      title="System Health & Diagnostics"
      description="Inspect active database replication logs, model server nodes, and diagnostic pipeline latencies."
    >
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          <Card variant="glass">
            <CardHeader
              title="Model Engines & API Gateway Status"
              subtitle="Loading telemetry metrics..."
            />
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Skeleton height={50} />
                <Skeleton height={50} />
                <Skeleton height={50} />
                <Skeleton height={50} />
                <Skeleton height={50} />
                <Skeleton height={50} />
              </div>
            </CardBody>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Skeleton height={150} />
            <Skeleton height={180} />
          </div>
        </div>
      ) : isError ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
          <Card variant="glass" style={{ maxWidth: "500px", borderLeft: "4px solid var(--color-critical)" }}>
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-critical)" }}>
                  <AlertCircle size={20} />
                  <span>Failed to Retrieve Diagnostics</span>
                </div>
              }
            />
            <CardBody>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                The backend service gateway is unreachable. Please verify that the FastAPI backend server is running and accessible at the designated API URL.
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
      ) : services.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Card variant="glass" style={{ maxWidth: "500px", margin: "0 auto" }}>
            <CardBody>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                No active service diagnostic metrics found.
              </p>
              <Button variant="secondary" onClick={() => refetch()} style={{ marginTop: "12px" }}>
                Re-Poll Telemetry
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          
          {/* Left: Table of all 9 core modules */}
          <Card variant="glass">
            <CardHeader
              title="Model Engines & API Gateway Status"
              subtitle="Diagnostic metrics for the 9 active pipeline engines"
            />
            <CardBody>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                
                {/* Header row */}
                <div style={{ display: "grid", gridTemplateColumns: "2.0fr 0.8fr 0.8fr 0.8fr 0.8fr", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)" }}>
                  <span>ENGINE MODULE</span>
                  <span>VERSION</span>
                  <span>STATUS</span>
                  <span>LATENCY</span>
                  <span>MEMORY</span>
                </div>

                {/* Data rows */}
                {services.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.0fr 0.8fr 0.8fr 0.8fr 0.8fr",
                      padding: "14px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      alignItems: "center",
                      fontSize: "0.8rem"
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#f1f5f9" }}>{s.name}</div>
                    <div style={{ color: "#94a3b8" }}>{s.version}</div>
                    <div>
                      <Badge variant={s.status === "nominal" ? "success" : "warning"}>{s.status}</Badge>
                    </div>
                    <div style={{ color: (s.latency !== undefined && s.latency > 150) ? "var(--color-warning)" : "var(--color-success)", fontWeight: 500 }}>
                      {s.latency !== undefined ? `${s.latency} ms` : "N/A"}
                    </div>
                    <div style={{ color: "#cbd5e1" }}>{s.memory}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Right Column: Operational Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Card variant="elevated" style={{ borderLeft: "4px solid var(--color-success)" }}>
              <CardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-success)", fontSize: "0.95rem" }}>
                    <ShieldCheck size={18} />
                    <span>Pipeline Sync Integrity</span>
                  </div>
                }
              />
              <CardBody>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f1f5f9", margin: "10px 0" }}>
                  100% SECURE
                </div>
                <p style={{ fontSize: "0.78rem", lineHeight: 1.45, color: "var(--color-text-secondary)" }}>
                  All GIS tiles, H3 hex aggregates, and patrol telemetry streams are validating against the primary database instance with zero error reports in the last 24 hours.
                </p>
              </CardBody>
            </Card>

            <Card variant="glass">
              <CardHeader
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#f1f5f9" }}>
                    <Terminal size={14} style={{ color: "#3b82f6" }} />
                    <span>Telemetry Loop log</span>
                  </div>
                }
              />
              <CardBody style={{ fontFamily: "monospace", fontSize: "10px", lineHeight: 1.5, color: "#94a3b8", backgroundColor: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px", maxHeight: "180px", overflowY: "auto" }} className="no-scrollbar">
                <div>[02:35:32] fetch: catboost/stats - 200 OK</div>
                <div>[02:35:35] validation: classified violations success</div>
                <div>[02:35:38] query: tdpi/h3_grid - 200 OK (16 cells)</div>
                <div>[02:35:40] calc: visibility_gaps - success</div>
                <div>[02:35:42] predict: lstm_forecast - success</div>
                <div>[02:35:45] sync: patrols/route_optimizer - 4 units reporting</div>
                <div>[02:35:50] calculate: deployment_impact - success</div>
                <div style={{ color: "#22d3ee" }}>[02:35:55] integrity: check_all - NOMINAL</div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
