"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageWrapper } from "@/components/layout";
import { Card, CardHeader, CardBody, CardFooter, Button, Badge, Skeleton } from "@/components/ui";
import { useDashboardSummary, useActivityFeed } from "@/hooks/useIntelligence";
import { useNotifications, useAI } from "@/components/providers";
import {
  Sparkles,
  Info,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Clock,
  Cpu,
  AlertCircle
} from "lucide-react";

// Premium Typewriter Animation for the AI Brief
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, 15); // Speed of character rendering
    return () => clearInterval(interval);
  }, [text]);

  return <span style={{ transition: "all 0.1s ease" }}>{displayedText}</span>;
}

// Custom SVG sparkline generator for KPI cards
function Sparkline({ points, color = "#06b6d4" }: { points: number[]; color?: string }) {
  const width = 70;
  const height = 20;
  if (!points || points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const pathData = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2; // leave margin padding
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
    </svg>
  );
}

// Simple Counter Up Animation Component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    
    // Animate over 800ms
    const duration = 800;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}{suffix}</span>;
}

export default function WelcomeCanvas() {
  const [selectedHour] = useState<string>("12:00");
  
  // Queries
  const { data: summary, isLoading: loadingSummary, isError, error, refetch } = useDashboardSummary(selectedHour);
  const { data: activityFeed = [], isLoading: loadingFeed } = useActivityFeed();
  
  const { addNotification } = useNotifications();
  const { activeSummary, clearSummary } = useAI();

  // Dispatch a simulated live alert
  const triggerSimulatedAlert = () => {
    const alerts = [
      { title: "Gridlock Hazard", message: "Sidewalk parking blockage near Commercial Street Junction.", type: "critical" as const },
      { title: "Patrol Dispatched", message: "Squad Gamma dispatched to Indiranagar Z1 congestion spot.", type: "success" as const },
      { title: "Heavy Loading Notice", message: "Commercial delivery trucks parked on Brigade double lanes.", type: "warning" as const }
    ];
    const alert = alerts[Math.floor(Math.random() * alerts.length)];
    addNotification(alert.title, alert.message, alert.type);
  };

  return (
    <PageWrapper
      title="Bengaluru Traffic Control Room"
      description="Operational command panel for city parking intelligence, violations monitoring, and patrol management."
      actions={
        <div style={{ display: "flex", gap: "8px" }}>
          <Button variant="secondary" onClick={triggerSimulatedAlert}>
            Simulate Alert
          </Button>
          <Button variant="default" onClick={() => refetch()}>
            <RefreshCw size={16} style={{ marginRight: "4px" }} />
            Refresh Summary
          </Button>
        </div>
      }
    >
      {/* AI Intelligence Summary Banner if active */}
      {activeSummary && (
        <Card variant="glass" style={{ borderLeft: "4px solid var(--color-info)", marginBottom: "16px" }}>
          <CardHeader
            title={
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-info)" }}>
                <Sparkles size={18} />
                <span>AI Operational Insight</span>
              </div>
            }
          />
          <CardBody>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--color-text-primary)" }}>
              {activeSummary}
            </p>
          </CardBody>
          <CardFooter>
            <Button variant="ghost" size="sm" onClick={clearSummary}>Dismiss Insight</Button>
          </CardFooter>
        </Card>
      )}

      {isError ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
          <Card variant="glass" style={{ maxWidth: "500px", borderLeft: "4px solid var(--color-critical)" }}>
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-critical)" }}>
                  <AlertCircle size={20} />
                  <span>Dashboard Load Error</span>
                </div>
              }
            />
            <CardBody>
              <p style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                Failed to connect to the control room analytics database. Ensure the backend engine is running.
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
        <>
          {/* CatBoost Model Validation Header Status */}
          {(loadingSummary || summary?.catboost) && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <Cpu size={18} style={{ color: "#3b82f6" }} />
                <div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase" }}>CatBoost Model</div>
                  {loadingSummary ? (
                    <Skeleton height={14} width={120} />
                  ) : (
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9" }}>{summary?.catboost.modelName}</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <ShieldCheck size={18} style={{ color: "var(--color-success)" }} />
                <div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase" }}>Validation Conf</div>
                  {loadingSummary ? (
                    <Skeleton height={14} width={60} />
                  ) : (
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9" }}>{summary?.catboost.validationConfidence}%</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <Clock size={18} style={{ color: "var(--color-info)" }} />
                <div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase" }}>Inference Latency</div>
                  {loadingSummary ? (
                    <Skeleton height={14} width={60} />
                  ) : (
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9" }}>{summary?.catboost.inferenceLatency} ms</div>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderRadius: "12px", backgroundColor: "rgba(12, 15, 29, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <Terminal size={18} style={{ color: "#a855f7" }} />
                <div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-secondary)", fontWeight: 500, textTransform: "uppercase" }}>Pipeline State</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9" }}>Active / Synchronized</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Operational Briefing (Hero Widget with Typewriter) */}
          <Card variant="glass" style={{ marginBottom: "24px", padding: "20px 24px", borderLeft: "4px solid var(--color-brand)" }}>
            <CardHeader
              title={
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={16} style={{ color: "var(--color-brand)" }} />
                  <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>AI Executive Pipeline Briefing</span>
                </div>
              }
            />
            <CardBody style={{ marginTop: "8px" }}>
              {loadingSummary ? (
                <Skeleton height={40} />
              ) : (
                <p style={{ fontSize: "0.92rem", lineHeight: 1.6, color: "var(--color-text-primary)", minHeight: "45px" }}>
                  <TypewriterText text={summary?.aiBriefing || ""} />
                </p>
              )}
            </CardBody>
          </Card>

          {/* Grid: KPI Statistics with Sparklines */}
          {loadingSummary ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
              <Skeleton height={110} />
              <Skeleton height={110} />
              <Skeleton height={110} />
              <Skeleton height={110} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
              <Card variant="elevated" interactive>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px 0 20px" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Validated Violations</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#f1f5f9", marginTop: "4px" }}>
                      <AnimatedCounter value={summary?.catboost.validatedCount || 0} />
                    </div>
                  </div>
                  <Sparkline points={[35, 42, 47, 51, 48, 55, 62]} color="var(--color-success)" />
                </div>
                <CardBody style={{ padding: "0 20px 16px 20px", marginTop: "6px" }}>
                  <Badge variant="success">↑ 4.2% cases</Badge>
                </CardBody>
              </Card>

              <Card variant="elevated" interactive>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px 0 20px" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Average TDPI</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: (summary?.cityTdpi || 0) > 65 ? "var(--color-critical)" : "var(--color-warning)", marginTop: "4px" }}>
                      <AnimatedCounter value={summary?.cityTdpi || 0} suffix="%" />
                    </div>
                  </div>
                  <Sparkline points={[68, 72, 70, 64, 58, 62, 58]} color="var(--color-warning)" />
                </div>
                <CardBody style={{ padding: "0 20px 16px 20px", marginTop: "6px" }}>
                  <Badge variant={(summary?.cityTdpi || 0) > 65 ? "critical" : "warning"}>↓ 8% density</Badge>
                </CardBody>
              </Card>

              <Card variant="elevated" interactive>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px 0 20px" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Active Hotspots</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-info)", marginTop: "4px" }}>
                      <AnimatedCounter value={summary?.activeHotspots || 0} />
                    </div>
                  </div>
                  <Sparkline points={[6, 5, 8, 4, 3, 2, 2]} color="var(--color-info)" />
                </div>
                <CardBody style={{ padding: "0 20px 16px 20px", marginTop: "6px" }}>
                  <Badge variant="success">↓ 2 zones</Badge>
                </CardBody>
              </Card>

              <Card variant="elevated" interactive>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px 0 20px" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Visibility Gaps</div>
                    <div style={{ fontSize: "1.75rem", fontWeight: 800, color: (summary?.visibilityGapsCount || 0) > 0 ? "var(--color-critical)" : "var(--color-success)", marginTop: "4px" }}>
                      <AnimatedCounter value={summary?.visibilityGapsCount || 0} />
                    </div>
                  </div>
                  <Sparkline points={[12, 10, 8, 7, 5, 4, 3]} color="var(--color-critical)" />
                </div>
                <CardBody style={{ padding: "0 20px 16px 20px", marginTop: "6px" }}>
                  <Badge variant="success">↓ 4 slots</Badge>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Columns: Main Monitoring Content */}
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "28px", marginTop: "24px" }}>
            {/* Left Side: AI Deployment Recommendations */}
            <Card variant="glass" style={{ padding: "24px 28px" }}>
              <CardHeader
                title="AI Smart Patrol Dispatch Optimizations"
                subtitle="Deployment recommendations based on TDPI hotspots and Visibility Gap priorities"
              />
              <CardBody style={{ marginTop: "12px" }}>
                {loadingSummary ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <Skeleton height={78} />
                    <Skeleton height={78} />
                  </div>
                ) : summary?.operationalRecommendations.length === 0 ? (
                  <div style={{ padding: "24px", color: "var(--color-text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
                    No active patrol dispatch recommendations at this time.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {summary?.operationalRecommendations.map((rec) => (
                      <div
                        key={rec.id}
                        style={{
                          padding: "16px 20px",
                          borderRadius: "14px",
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Badge variant={rec.priority}>{rec.priority}</Badge>
                            <strong style={{ fontSize: "0.9rem", color: "#f1f5f9" }}>{rec.title}</strong>
                          </div>
                          <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.4 }}>
                            {rec.reasoning}
                          </p>
                          <span style={{ fontSize: "0.75rem", color: "#22d3ee", fontWeight: 500 }}>
                            Action: {rec.action}
                          </span>
                        </div>

                        <Link href={`/map?cell=${rec.cellIndex}`} style={{ flexShrink: 0 }}>
                          <Button variant="ghost" size="sm" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            Focus Map <ArrowRight size={12} />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Right Side: AI Operational Activity Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <Card variant="elevated" style={{ padding: "22px 24px" }}>
                <CardHeader 
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Terminal size={15} style={{ color: "var(--color-brand)" }} />
                      <span>AI Operational Activity Feed</span>
                    </div>
                  } 
                  subtitle="Live pipeline step execution telemetry log" 
                />
                <CardBody style={{ marginTop: "12px" }}>
                  {loadingFeed ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <Skeleton height={38} />
                      <Skeleton height={38} />
                    </div>
                  ) : activityFeed.length === 0 ? (
                    <div style={{ padding: "16px", color: "var(--color-text-muted)", fontSize: "0.75rem", textAlign: "center" }}>
                      No activity feed messages.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {activityFeed.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(0, 0, 0, 0.15)",
                            border: "1px solid rgba(255, 255, 255, 0.03)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "0.75rem",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, color: "var(--color-brand)" }}>{item.stage}</span>
                            <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{item.timestamp}</span>
                          </div>
                          <div style={{ color: "#cbd5e1" }}>{item.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Quick Hub Navigation Call */}
              <Card variant="glass" style={{ padding: "22px 24px" }}>
                <CardHeader
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9" }}>
                      <Info size={16} style={{ color: "#06b6d4" }} />
                      <span>Geospatial Operations</span>
                    </div>
                  }
                />
                <CardBody>
                  <p style={{ fontSize: "0.8rem", lineHeight: 1.55, color: "#94a3b8" }}>
                    To simulate re-allocations, observe visibility gaps, and explain model confidence scores geographically, access the central Bengaluru Digital Twin.
                  </p>
                </CardBody>
                <CardFooter>
                  <Link href="/map" style={{ width: "100%" }}>
                    <Button variant="default" style={{ width: "100%" }}>
                      Open Bengaluru Digital Twin
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  );
}
