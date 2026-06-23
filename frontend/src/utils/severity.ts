import React from "react";
import { ShieldAlert, AlertTriangle, AlertCircle, Activity } from "lucide-react";

// --- Color Palette Definitions ---
const COLORS = {
  tier1: [127, 29, 29] as const,      // Deep Red
  tier2: [239, 68, 68] as const,      // Red
  tier3: [249, 115, 22] as const,     // Orange
  green: [34, 197, 94] as const,      // Green
  yellow: [234, 179, 8] as const,     // Yellow
  amber: [245, 158, 11] as const,     // Amber
  fallback: [148, 163, 184] as const, // Slate/Fallback
};

/**
 * Interpolates between two colors [R, G, B] based on factor t in [0, 1].
 */
function lerp(a: readonly [number, number, number], b: readonly [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * Gets the RGB color array [R, G, B] for a hotspot based on its tier and percentile.
 */
export function getSeverityRGB(hotspotTier?: string, tdpiPercentile?: number): [number, number, number] {
  const tier = hotspotTier?.toUpperCase();

  if (tier === "TIER_1") return [...COLORS.tier1];
  if (tier === "TIER_2") return [...COLORS.tier2];
  if (tier === "TIER_3") return [...COLORS.tier3];
  
  if (tier === "NORMAL" || !hotspotTier) {
    if (tdpiPercentile === undefined || tdpiPercentile === null) {
      return [...COLORS.green];
    }
    // Interpolate continuously within the NORMAL tier (0 to 90 percentile)
    if (tdpiPercentile <= 45) {
      return lerp(COLORS.green, COLORS.yellow, tdpiPercentile / 45);
    } else {
      return lerp(COLORS.yellow, COLORS.amber, Math.min(1, (tdpiPercentile - 45) / 45));
    }
  }

  return [...COLORS.fallback];
}

/**
 * Gets the CSS color string (e.g. "rgb(r,g,b)") for a hotspot.
 */
export function getSeverityCSS(hotspotTier?: string, tdpiPercentile?: number): string {
  const [r, g, b] = getSeverityRGB(hotspotTier, tdpiPercentile);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Gets a CSS premium background gradient style for cards.
 */
export function getSeverityGradient(hotspotTier?: string, tdpiPercentile?: number): string {
  const [r, g, b] = getSeverityRGB(hotspotTier, tdpiPercentile);
  return `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.15), rgba(${r}, ${g}, ${b}, 0.02))`;
}

/**
 * Gets the short human-readable severity label for a tier.
 */
export function getSeverityLabel(hotspotTier?: string): string {
  const tier = hotspotTier?.toUpperCase();
  if (tier === "TIER_1") return "Tier-1 Priority";
  if (tier === "TIER_2") return "Tier-2 Priority";
  if (tier === "TIER_3") return "Tier-3 Priority";
  if (tier === "NORMAL") return "Normal";
  return "Nominal";
}

/**
 * Gets a premium operational description string for the hotspot.
 */
export function getSeverityDescription(hotspotTier?: string, tdpiPercentile?: number): string {
  const tier = hotspotTier?.toUpperCase();
  if (tier === "TIER_1") return "Highest Operational Priority";
  if (tier === "TIER_2") return "Critical Operational Hotspot";
  if (tier === "TIER_3") return "High Operational Hotspot";
  
  if (tdpiPercentile !== undefined && tdpiPercentile !== null) {
    const topPct = 100 - tdpiPercentile;
    return `Top ${topPct.toFixed(1)}% Operational Hotspot`;
  }
  
  return "Routine Monitoring Sector";
}

/**
 * Gets Tailwind styling classes for rendering a Badge.
 */
export function getSeverityBadgeClass(hotspotTier?: string): string {
  const tier = hotspotTier?.toUpperCase();
  if (tier === "TIER_1") {
    return "bg-red-950/40 text-red-500 border border-red-500/30";
  }
  if (tier === "TIER_2") {
    return "bg-red-500/10 text-red-400 border border-red-500/20";
  }
  if (tier === "TIER_3") {
    return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
  }
  return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
}

/**
 * Gets the Lucide Icon component for the operational tier.
 */
export function getSeverityIcon(hotspotTier?: string): React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> {
  const tier = hotspotTier?.toUpperCase();
  if (tier === "TIER_1") return ShieldAlert;
  if (tier === "TIER_2") return AlertTriangle;
  if (tier === "TIER_3") return AlertCircle;
  return Activity;
}

/**
 * Returns true if a hotspot tier matches the given filter selection.
 */
export function isSeverityMatch(hotspotTier?: string, filterType?: string): boolean {
  if (!filterType || filterType === "all") return true;
  const tier = hotspotTier?.toUpperCase();
  
  if (filterType === "critical") {
    return tier === "TIER_1" || tier === "TIER_2";
  }
  if (filterType === "warning") {
    return tier === "TIER_3";
  }
  if (filterType === "normal") {
    return tier === "NORMAL" || !tier;
  }
  return true;
}
