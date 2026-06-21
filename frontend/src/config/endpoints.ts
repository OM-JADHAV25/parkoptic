/**
 * Centralized API Endpoint Configurations for ParkOptic
 */
export const API_ENDPOINTS = {
  HEALTH: "/api/v1/health",
  DASHBOARD: "/api/v1/dashboard",
  HOTSPOTS: "/api/v1/hotspots",
  HOTSPOT_DETAILS: (h3Index: string) => `/api/v1/hotspots/${h3Index}`,
  EXPLAINABILITY: (h3Index: string) => `/api/v1/explainability/${h3Index}`,
  SIMULATE: "/api/v1/patrol/simulate",
  PATROL_RECOMMENDATIONS: "/api/v1/patrol/recommendations",
  DEPLOYMENT_IMPACT: "/api/v1/deployment/impact",
  TEMPORAL: (hour: number) => `/api/v1/temporal?hour=${hour}`,
} as const;

export type ApiEndpoints = typeof API_ENDPOINTS;
