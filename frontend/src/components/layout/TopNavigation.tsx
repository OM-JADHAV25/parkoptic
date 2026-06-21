"use client";

import React, { useEffect, useState } from "react";
import { useNotifications } from "../providers";
import { NotificationDrawer } from "./NotificationDrawer";
import { Bell, CloudSun, Menu } from "lucide-react";
import { Button } from "../ui";

interface TopNavigationProps {
  onToggleSidebar?: () => void;
}

export function TopNavigation({ onToggleSidebar }: TopNavigationProps) {
  const { notifications } = useNotifications();
  
  const [showDrawer, setShowDrawer] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    // Defer clock initialization to next event loop to avoid cascading render warning
    const deferTimer = setTimeout(() => {
      setDateTime(new Date());
    }, 0);

    const clockTimer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => {
      clearTimeout(deferTimer);
      clearInterval(clockTimer);
    };
  }, []);

  return (
    <header
      style={{
        height: "72px",
        backgroundColor: "rgba(2, 6, 23, 0.92)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 100,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.03)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      
      {/* Left section: Mobile menu (if present) & Weather status (on desktop) */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer lg:hidden mr-2"
            style={{ border: "1px solid transparent" }}
            aria-label="Toggle navigation"
          >
            <Menu size={18} />
          </button>
        )}
        
        {/* Bengaluru Weather Widget - aligned to left on desktop */}
        <div className="flex items-center gap-2 max-md:hidden text-slate-300" style={{ fontSize: "12px" }}>
          <CloudSun size={15} style={{ color: "rgba(245, 158, 11, 0.8)" }} />
          <span style={{ fontWeight: 600, letterSpacing: "0.02em", color: "#cbd5e1" }}>Bengaluru: 24°C</span>
          <span style={{ color: "#334155" }}>|</span>
          <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 500 }}>Scattered Clouds</span>
        </div>
      </div>

      {/* Right section: Date/Time, Notifications drawer, User profile avatar */}
      <div className="flex items-center gap-6">
        {/* Ticking Date/Time */}
        {dateTime && (
          <div className="flex flex-col items-end max-md:hidden" style={{ lineHeight: 1 }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.02em" }}>
              {dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
            <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", marginTop: "4px", textTransform: "uppercase" }}>
              {dateTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: '2-digit' })}
            </span>
          </div>
        )}

        <span className="max-md:hidden" style={{ color: "#334155" }}>|</span>

        {/* Alert Logs center bell */}
        <div style={{ position: "relative" }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDrawer(true)}
            className="relative p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl cursor-pointer"
            style={{ border: "1px solid transparent" }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: "4px", right: "4px", display: "flex", width: "8px", height: "8px" }}>
                <span className="animate-ping" style={{ position: "absolute", display: "inline-flex", width: "100%", height: "100%", borderRadius: "9999px", backgroundColor: "#fb7185", opacity: 0.75 }}></span>
                <span style={{ position: "relative", display: "inline-flex", borderRadius: "9999px", width: "8px", height: "8px", backgroundColor: "#f43f5e" }}></span>
              </span>
            )}
          </Button>
        </div>

        {/* User avatar profile */}
        <div className="flex items-center gap-3">
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#0891b2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              color: "#ffffff",
              border: "1px solid rgba(6,182,212,0.25)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 0 10px rgba(6,182,212,0.2)",
            }}
            className="hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105"
          >
            BC
          </div>
        </div>
      </div>

      {/* Right side drawer popup portal */}
      <NotificationDrawer isOpen={showDrawer} onClose={() => setShowDrawer(false)} />
    </header>
  );
}
