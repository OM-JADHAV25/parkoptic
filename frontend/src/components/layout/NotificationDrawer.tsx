"use client";

import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { useNotifications } from "../providers";
import { Badge } from "../ui";
import { Bell, Sparkles, AlertCircle, X, ShieldAlert, Cpu } from "lucide-react";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, markAllAsRead, markAsRead, clearNotification } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <ShieldAlert className="text-rose-500" size={16} />;
      case "warning":
        return <AlertCircle className="text-amber-500" size={16} />;
      case "success":
        return <Cpu className="text-emerald-500" size={16} />;
      default:
        return <Sparkles className="text-cyan-500" size={16} />;
    }
  };

  const getSeverityBadge = (type: string) => {
    switch (type) {
      case "critical":
        return <Badge variant="critical">CRITICAL</Badge>;
      case "warning":
        return <Badge variant="warning">WARNING</Badge>;
      case "success":
        return <Badge variant="success">OPTIMAL</Badge>;
      default:
        return <Badge variant="info">INFO</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="w-[400px] border-l border-white/5 bg-[#080b13]/95 backdrop-blur-md p-6 text-white overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div>
            <SheetTitle className="text-lg font-bold flex items-center gap-2 text-white">
              <Bell size={18} className="text-slate-400" />
              <span>System Alerts & Insights</span>
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500 mt-1">
              Real-time monitoring logs from Bengaluru Command Nodes
            </SheetDescription>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Clear All
            </button>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-3">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <Bell size={32} className="opacity-20" />
              <span>No active alerts registered</span>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex flex-col gap-2 ${
                  !notif.read
                    ? "bg-slate-900/35 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.02)]"
                    : "bg-slate-950/20 border-white/5 opacity-70 hover:opacity-100"
                }`}
              >
                {/* Clear Single Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notif.id);
                  }}
                  className="absolute top-3 right-3 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete alert"
                >
                  <X size={14} />
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/5 rounded-md border border-white/5 flex items-center justify-center">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {getSeverityBadge(notif.type)}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pr-4">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
