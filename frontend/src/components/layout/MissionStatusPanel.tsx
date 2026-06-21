"use client";

import React, { useEffect, useState } from "react";
import styles from "./MissionStatusPanel.module.css";
import { Radio } from "lucide-react";

export function MissionStatusPanel() {
  const [latency, setLatency] = useState(24);
  const patrolStatus = "Optimal";

  useEffect(() => {
    // Simulate slight fluctuations in system telemetry
    const interval = setInterval(() => {
      setLatency((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newLat = prev + change;
        return newLat > 12 && newLat < 45 ? newLat : prev;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.panel}>
      <h4 className={styles.title}>
        <span>System Telemetry</span>
        <Radio size={14} className={styles.connected} style={{ color: "var(--color-success)" }} />
      </h4>
      
      <div className={styles.row}>
        <span>Bengaluru HQ</span>
        <span className={styles.value}>
          <span className={`${styles.indicator} ${styles.connected}`} />
          Connected
        </span>
      </div>

      <div className={styles.row}>
        <span>API Latency</span>
        <span className={styles.value}>{latency}ms</span>
      </div>

      <div className={styles.row}>
        <span>Patrol Mode</span>
        <span className={styles.value} style={{ color: "var(--color-success)" }}>
          {patrolStatus}
        </span>
      </div>

      <div className={styles.row}>
        <span>Active Zones</span>
        <span className={styles.value}>8 / 12</span>
      </div>
    </div>
  );
}
