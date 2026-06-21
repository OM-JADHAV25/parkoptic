"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface AIInsight {
  id: string;
  source: string;
  category: "hotspot" | "patrol" | "simulation" | "general";
  message: string;
  confidence: number; // 0 to 1
  actionText?: string;
}

interface AIContextType {
  isAnalyzing: boolean;
  insights: AIInsight[];
  activeSummary: string | null;
  triggerAIAnalysis: (module: string) => Promise<void>;
  clearSummary: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSummary, setActiveSummary] = useState<string | null>(null);
  const [insights] = useState<AIInsight[]>([
    {
      id: "insight-1",
      source: "Predictive Congestion Model",
      category: "hotspot",
      message: "High risk of gridlock on MG Road near Metro Station between 17:30 and 19:00 based on traffic trends.",
      confidence: 0.92,
      actionText: "Review Hotspots",
    },
    {
      id: "insight-2",
      source: "Patrol Optimizer AI",
      category: "patrol",
      message: "Reallocating Squad 4 to Indiranagar 100ft Rd could reduce double parking occurrences by 35%.",
      confidence: 0.87,
      actionText: "Optimize Deployment",
    }
  ]);

  const triggerAIAnalysis = useCallback(async (module: string) => {
    setIsAnalyzing(true);
    setActiveSummary(null);
    
    // Simulate API delay for AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsAnalyzing(false);
    if (module === "patrol") {
      setActiveSummary(
        "AI Summary: Based on real-time cameras, Indiranagar shows a 45% increase in illegal commercial double-parking. Re-routing Patrol 2 is highly advised."
      );
    } else {
      setActiveSummary(
        `AI Summary: Analysis for ${module} completed. Parking velocity is standard, with a slight build-up of violations in Zone C.`
      );
    }
  }, []);

  const clearSummary = useCallback(() => {
    setActiveSummary(null);
  }, []);

  return (
    <AIContext.Provider
      value={{
        isAnalyzing,
        insights,
        activeSummary,
        triggerAIAnalysis,
        clearSummary,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
}
