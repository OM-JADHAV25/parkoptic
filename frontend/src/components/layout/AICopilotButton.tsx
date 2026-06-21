"use client";

import React, { useState } from "react";
import { Sparkles, MessageSquareCode } from "lucide-react";

export function AICopilotButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[990]">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 bottom-16 bg-slate-900 border border-cyan-500/30 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap animate-fade-in-up font-medium tracking-wide">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-cyan-400" />
            <span>Launch ParkOptic AI Copilot</span>
          </div>
          <div className="absolute w-2 h-2 bg-slate-900 border-r border-b border-cyan-500/30 rotate-45 bottom-[-5px] right-[20px]" />
        </div>
      )}

      {/* Copilot Floating Button */}
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] border border-cyan-400/30 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        aria-label="AI Copilot"
      >
        <MessageSquareCode size={20} className="animate-pulse" />
      </button>
    </div>
  );
}
