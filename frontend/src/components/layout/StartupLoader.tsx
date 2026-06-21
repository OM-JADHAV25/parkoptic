"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StartupLoaderProps {
  onComplete: () => void;
}

const bootLogs = [
  "Initializing ParkOptic v4.2.1-stable...",
  "Establishing secure connection to Bengaluru Command Center...",
  "Querying edge-camera grid telemetry [Zone A, Zone B, Zone C]...",
  "Initializing CatBoost v3 Predictive Congestion models...",
  "Caching active patrol squad status databases...",
  "AI Models online. Syncing city grids...",
  "ParkOptic Operations Kernel loaded successfully."
];

export function StartupLoader({ onComplete }: StartupLoaderProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (phase < bootLogs.length) {
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, bootLogs[phase]]);
        setPhase((prev) => prev + 1);
      }, phase === 0 ? 100 : phase === 1 ? 400 : phase === 2 ? 300 : 250);
      return () => clearTimeout(timer);
    } else {
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(completeTimer);
    }
  }, [phase, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#05070f",
        color: "#10b981",
        fontFamily: "'Courier New', Courier, monospace",
        padding: "48px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "800px" }}>
        <div style={{ color: "#3b82f6", fontWeight: "bold", fontSize: "1.2rem", marginBottom: "16px" }}>
          PARKOPTIC // SYSTEM INIT CORE
        </div>
        
        {logs.map((log, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            style={{ fontSize: "0.9rem", lineHeight: 1.6 }}
          >
            <span style={{ color: "#475569", marginRight: "12px" }}>[{new Date().toLocaleTimeString()}]</span>
            <span style={{ color: index === bootLogs.length - 1 ? "#10b981" : "#94a3b8" }}>
              {index === bootLogs.length - 1 ? "✓ " : "> "}
              {log}
            </span>
          </motion.div>
        ))}
        
        {phase < bootLogs.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{
              display: "inline-block",
              width: "8px",
              height: "15px",
              backgroundColor: "#10b981",
              marginLeft: "4px",
              verticalAlign: "middle"
            }}
          />
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#475569", fontSize: "0.8rem" }}>
        <span>BENGALURU MUNICIPAL SECURITY KERNEL</span>
        <span>LOAD FACTOR: {Math.min(Math.round((phase / bootLogs.length) * 100), 100)}%</span>
      </div>
    </motion.div>
  );
}
