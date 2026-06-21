"use client";

import React, { useEffect, useState } from "react";
import { Database, Cpu, Wifi } from "lucide-react";

export function MissionStatusCard() {
  const [latency, setLatency] = useState(118);
  const [syncSeconds, setSyncSeconds] = useState(3);

  useEffect(() => {
    // Fluctuate Latency +/- 4ms
    const latencyInterval = setInterval(() => {
      setLatency((prev) => {
        const delta = Math.floor(Math.random() * 9) - 4;
        const newLat = prev + delta;
        return newLat >= 110 && newLat <= 126 ? newLat : prev;
      });
    }, 3000);

    // Dynamic sync timer incrementing every second, resetting every 15s
    const syncInterval = setInterval(() => {
      setSyncSeconds((prev) => {
        if (prev >= 14) {
          return 0; // Simulated active fetch reset
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(latencyInterval);
      clearInterval(syncInterval);
    };
  }, []);

  const items = [
    {
      title: "AI Core",
      state: "Healthy",
      desc: "CatBoost v3 Ready",
      icon: <Cpu size={14} className="text-emerald-500" />,
      pulseColor: "bg-emerald-500"
    },
    {
      title: "Backend",
      state: "Online",
      desc: `Latency ${latency}ms`,
      icon: <Wifi size={14} className="text-emerald-500" />,
      pulseColor: "bg-emerald-500"
    },
    {
      title: "Synchronization",
      state: "Live",
      desc: syncSeconds === 0 ? "Updating..." : `Updated ${syncSeconds}s ago`,
      icon: <Database size={14} className="text-cyan-500" />,
      pulseColor: "bg-cyan-500"
    }
  ];

  return (
    <div 
      style={{
        padding: "10px 12px",
        backgroundColor: "rgba(2, 6, 23, 0.45)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "10px",
        margin: "0 12px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.2)"
      }}
    >
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          borderBottom: "1px solid rgba(255,255,255,0.05)", 
          paddingBottom: "4px" 
        }}
      >
        <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.05em", color: "#64748b", textTransform: "uppercase" }}>
          OPERATIONAL HEARTBEAT
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span style={{ fontSize: "9px", fontWeight: 600, color: "#34d399" }}>ACTIVE</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {items.map((item) => (
          <div key={item.title} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div 
              style={{ 
                padding: "3px", 
                backgroundColor: "rgba(255, 255, 255, 0.04)", 
                borderRadius: "4px", 
                border: "1px solid rgba(255, 255, 255, 0.04)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#cbd5e1" }}>{item.title}</span>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", display: "flex", alignItems: "center", gap: "3px" }}>
                  <span className={`h-1 w-1 rounded-full ${item.pulseColor} animate-pulse`} />
                  {item.state}
                </span>
              </div>
              <p style={{ fontSize: "9px", color: "#64748b", marginTop: "1px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
