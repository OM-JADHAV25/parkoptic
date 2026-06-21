"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { navigationConfig } from "@/config/navigation";
import { MissionStatusCard } from "./MissionStatusCard";
import * as Icons from "lucide-react";

// Helper to resolve Lucide icons dynamically from config strings
function DynamicIcon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name];
  if (!IconComponent) return <Icons.HelpCircle size={size} className={className} />;
  return <IconComponent size={size} className={className} />;
}

export function Sidebar() {
  const pathname = usePathname();
  const [syncSeconds, setSyncSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncSeconds((prev) => (prev >= 14 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      style={{
        position: "fixed",
        left: "24px",
        top: "24px",
        bottom: "24px",
        width: "290px",
        backgroundColor: "rgba(2, 6, 23, 0.97)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        zIndex: 200,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      
      {/* 1. Branding Experience */}
      <div 
        style={{ 
          padding: "16px 16px 12px 16px", 
          display: "flex", 
          flexDirection: "column", 
          gap: "10px", 
          borderBottom: "1px solid rgba(255,255,255,0.05)" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #0891b2, #2563eb)",
              borderRadius: "8px",
              boxShadow: "0 0 15px rgba(6, 182, 212, 0.25)",
              border: "1px solid rgba(6, 182, 212, 0.2)",
              color: "#ffffff"
            }}
          >
            <Icons.Eye size={18} className="animate-pulse" />
          </div>
          <div>
            <h1 style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", margin: 0, lineHeight: 1.1 }}>
              ParkOptic
            </h1>
            <span
              style={{ display: "block", marginTop: "1px", fontSize: "8px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              Bengaluru Operations
            </span>
          </div>
        </div>
        
        <p style={{ fontSize: "10px", color: "#94a3b8", lineHeight: 1.3, fontWeight: 500, margin: 0 }}>
          AI Powered Parking Intelligence Platform
        </p>

        {/* Live status badge */}
        <div
          style={{
            padding: "8px 10px",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
            </span>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#22d3ee", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              ● Monitoring Bengaluru
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "8px", color: "#64748b", fontWeight: 500 }}>
            <span>Live Intelligence Active</span>
            <span>Sync {syncSeconds}s ago</span>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Navigation List */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
        className="no-scrollbar"
      >
        {navigationConfig.map((item) => {
          const isActive = pathname === item.route;
          return (
            <Link key={item.route} href={item.route} style={{ display: "block", position: "relative", textDecoration: "none", color: "inherit" }}>
              {/* Sliding Background Indicator with Shared Layout ID */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-glow"
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderLeft: "2px solid #06b6d4",
                    borderRadius: "10px",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}

              <div
                style={{
                  position: "relative",
                  padding: "12px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  borderRadius: "10px",
                  zIndex: 10,
                  transition: "all 0.2s ease",
                }}
                className="group hover:-translate-y-[1px]"
              >
                {/* Icon wrapper with glow on active */}
                <div
                  style={{
                    padding: "6px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    backgroundColor: isActive ? "rgba(6,182,212,0.1)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isActive ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.05)"}`,
                    color: isActive ? "#22d3ee" : "#94a3b8",
                    boxShadow: isActive ? "0 0 10px rgba(6,182,212,0.2)" : "none",
                  }}
                >
                  <DynamicIcon name={item.iconName} size={15} />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "0.02em",
                        transition: "color 0.2s ease",
                        color: isActive ? "#ffffff" : "#cbd5e1",
                      }}
                    >
                      {item.title}
                    </span>
                    {/* Badge */}
                    {item.badgeText && (
                      <span
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          backgroundColor: "rgba(6,182,212,0.2)",
                          color: "#22d3ee",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid rgba(6,182,212,0.3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          lineHeight: 1,
                          transform: "scale(0.9)",
                        }}
                      >
                        {item.badgeText}
                      </span>
                    )}
                    {/* Notification Alert Count */}
                    {item.notificationCount && !isActive && (
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          backgroundColor: "#f43f5e",
                          color: "#ffffff",
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid #020617",
                        }}
                      >
                        {item.notificationCount}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "10px",
                      marginTop: "2px",
                      transition: "color 0.2s ease",
                      color: isActive ? "#94a3b8" : "#64748b",
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Keyboard Shortcut hint */}
                {item.shortcut && (
                  <span
                    className="hidden group-hover:block"
                    style={{
                      fontSize: "9px",
                      fontFamily: "monospace",
                      color: "#475569",
                      backgroundColor: "rgba(2,6,23,0.3)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      marginLeft: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {item.shortcut}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* 3. Anchored Telemetry Card */}
      <MissionStatusCard />
    </aside>
  );
}
