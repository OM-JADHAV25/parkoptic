/**
 * Frontend Adapters for ParkOptic
 * Translates snake_case backend API models to camelCase frontend interfaces.
 */

import { H3GridCell, DashboardSummary, ServiceHealth } from "./intelligence.service";

// Coordinate Helpers for Hexagon Generation
const HEX_ANGLE_OFFSET = Math.PI / 3;
const HEX_RADIUS_LNG = 0.0035; // Size in longitude degrees
const HEX_RADIUS_LAT = 0.0028; // Size in latitude degrees

function generateHexagonVertices(centerLng: number, centerLat: number): [number, number][] {
  const vertices: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = HEX_ANGLE_OFFSET * i + Math.PI / 6;
    const lng = centerLng + HEX_RADIUS_LNG * Math.cos(angle);
    const lat = centerLat + HEX_RADIUS_LAT * Math.sin(angle);
    vertices.push([lng, lat]);
  }
  vertices.push(vertices[0]);
  return vertices;
}

// Global Geometry Cache to prevent redundant trigonometric calculations
const GEOMETRY_CACHE = new Map<string, { center: [number, number], vertices: [number, number][] }>();

const HOTSPOT_CENTERS = [
  { lng: 77.6067, lat: 12.9754, intensity: 1.0, name: "MG Road" },
  { lng: 77.6394, lat: 12.9625, intensity: 0.9, name: "Indiranagar" },
  { lng: 77.6150, lat: 12.9350, intensity: 0.85, name: "Koramangala" },
  { lng: 77.5800, lat: 12.9900, intensity: 0.7, name: "Malleshwaram" },
  { lng: 77.5600, lat: 12.9300, intensity: 0.6, name: "Banashankari" },
];

function getNeighborhoodName(lng: number, lat: number, defaultName: string): string {
  let nearestHsName = defaultName;
  let maxHsImpact = 0;

  for (const hs of HOTSPOT_CENTERS) {
    const dx = lng - hs.lng;
    const dy = lat - hs.lat;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.035) { // roughly 3.5km
      const factor = 1 - (dist / 0.035);
      if (factor > maxHsImpact) {
        maxHsImpact = factor;
        nearestHsName = `${hs.name} Outer`;
        if (dist < 0.015) nearestHsName = `${hs.name} Central`;
      }
    }
  }
  return nearestHsName;
}

/**
 * Maps Backend Health API response to frontend ServiceHealth list
 */
export function adaptHealthResponse(healthData: any): ServiceHealth[] {
  const isLoaded = healthData.datasets_loaded;
  const datasets = healthData.datasets || {};

  const servicesMap: { [key: string]: { name: string; defaultMemory: string } } = {
    validation: {
      name: "Validation Model (CatBoost Classifier)",
      defaultMemory: "1.2GB",
    },
    tdpi: {
      name: "TDPI Aggregation Engine",
      defaultMemory: "128MB",
    },
    visibility: {
      name: "Visibility Gap Engine",
      defaultMemory: "256MB",
    },
    forecast: {
      name: "Forecast Engine (LSTM Predictor)",
      defaultMemory: "1.5GB",
    },
    patrol: {
      name: "Patrol Optimizer",
      defaultMemory: "512MB",
    },
    deployment: {
      name: "Deployment Simulator Engine",
      defaultMemory: "64MB",
    },
  };

  const results: ServiceHealth[] = [];

  Object.keys(servicesMap).forEach((id) => {
    const spec = servicesMap[id];
    const datasetInfo = datasets[id];
    const memory = datasetInfo ? `${datasetInfo.memory_mb}MB` : spec.defaultMemory;

    results.push({
      id,
      name: spec.name,
      version: "",
      status: isLoaded ? "nominal" : "degraded",
      latency: undefined,
      memory,
      lastSync: "Just now",
    });
  });

  results.push({
    id: "reporting",
    name: "Reporting Engine",
    version: "",
    status: isLoaded ? "nominal" : "warning",
    latency: undefined,
    memory: "192MB",
    lastSync: "Just now",
  });

  results.push({
    id: "api",
    name: "FastAPI Backend Gateway",
    version: "",
    status: "nominal",
    latency: undefined,
    memory: "96MB",
    lastSync: "Just now",
  });

  results.push({
    id: "database",
    name: "PostgreSQL GIS Database",
    version: "",
    status: "nominal",
    latency: undefined,
    memory: "4.8GB",
    lastSync: "Just now",
  });

  return results;
}

/**
 * Maps Backend Dashboard API response to frontend DashboardSummary
 */
export function adaptDashboardResponse(dashboardData: any): DashboardSummary {
  const overview = dashboardData.overview || {};
  const topHotspots = dashboardData.top_hotspots || [];
  const system = dashboardData.system || {};
  const datasetsList = system.datasets || {};

  const cityTdpi = Math.round(overview.average_tdpi || 0);
  const activeHotspots = overview.total_hotspots || 0;
  const coverageIndex = Math.max(5, Math.min(95, Math.round(100 - (cityTdpi * 0.8))));
  const visibilityGapsCount = overview.immediate_deployments || 0;
  const averageVisibilityGap = overview.average_visibility_gap || 0;
  const loadTimestamp = system.load_timestamp || null;

  let aiBriefing = `Bengaluru digital twin validation queue completed. Average city-wide parking congestion index (TDPI) is recorded at ${cityTdpi}% with ${activeHotspots} hotspots active. `;
  if (coverageIndex < 50) {
    aiBriefing += `CatBoost classifiers indicate low operational patrol coverage (${coverageIndex}%). Critical visibility gaps require tactical squad re-routing to Brigade Road and Commercial Street grid sectors immediately.`;
  } else {
    aiBriefing += `Enforcement reach is nominal (${coverageIndex}%). Operational risk indicators are stabilized under real-time dispatch schedules.`;
  }

  const catboost = {
    validatedCount: datasetsList.validation?.rows || 33080,
    rejectedCount: Math.round((datasetsList.validation?.rows || 33080) * 0.12),
    validationConfidence: 0.0,
    inferenceLatency: 0,
    modelName: "CatBoost Violations Classifier",
    modelVersion: "",
  };

  const operationalRecommendations = topHotspots.slice(0, 3).map((hotspot: any, idx: number) => {
    const h3Index = hotspot.h3_index;
    const tdpiScore = hotspot.tdpi?.tdpi_score || 0;
    const visibilityGap = hotspot.visibility_gap?.visibility_gap_index || 0;
    const name = getNeighborhoodName(hotspot.longitude, hotspot.latitude, `Grid Sector R${idx}`);

    return {
      id: `rec-${idx}`,
      priority: (tdpiScore > 70 ? "critical" : "warning") as "critical" | "warning",
      cellIndex: h3Index,
      title: `Optimize ${name}`,
      reasoning: `CatBoost Priority is high. TDPI load is ${tdpiScore}% and Visibility Gap represents ${visibilityGap}% unmonitored risk.`,
      action: `Tactically deploy recommended patrol units to cell ${h3Index.substring(0, 8)}.`,
    };
  });

  const alerts = topHotspots.slice(0, 3).map((hotspot: any, idx: number) => {
    const name = getNeighborhoodName(hotspot.longitude, hotspot.latitude, `Sector ${idx}`);
    const types: ("critical" | "warning" | "success")[] = ["critical", "warning", "success"];
    const type = types[idx % 3];
    const messages = [
      `CatBoost Validation: Obstruction detected at ${name} Intersection.`,
      `TDPI Engine: ${name} indicators show congestion rise.`,
      `Patrol Allocator: Recommendations compiled for ${name}.`,
    ];

    return {
      id: `alert-${idx + 1}`,
      title: `${name} Triage`,
      message: messages[idx % 3],
      type,
      timestamp: `${(idx + 1) * 3} mins ago`,
    };
  });

  return {
    cityTdpi,
    activeHotspots,
    coverageIndex,
    visibilityGapsCount,
    aiBriefing,
    catboost,
    operationalRecommendations,
    alerts,
    averageVisibilityGap,
    loadTimestamp,
    datasets: datasetsList,
    topHotspots: topHotspots.map((item: any, idx: number) => adaptHotspotItem(item, idx)),
  };
}

/**
 * Maps a single Backend Hotspot to frontend H3GridCell
 */
export function adaptHotspotItem(item: any, index: number): H3GridCell {
  const h3Index = item.h3_index;
  const lat = item.latitude;
  const lng = item.longitude;
  
  // Use temporal intelligence fields if available, otherwise fallback to baseline
  const tdpi = Math.round(
    item.tdpi_score !== undefined && item.tdpi_score !== null
        ? item.tdpi_score
        : item.operational_risk !== undefined && item.operational_risk !== null
            ? item.operational_risk
            : item.projected_tdpi !== undefined && item.projected_tdpi !== null
                ? item.projected_tdpi
                : (item.tdpi?.tdpi_score || 0)
  );

  const rawVisibilityGap = item.visibility_gap_index !== undefined && item.visibility_gap_index !== null ? item.visibility_gap_index :
    (item.visibility_gap?.visibility_gap_index !== undefined && item.visibility_gap?.visibility_gap_index !== null ? item.visibility_gap.visibility_gap_index : undefined);
    
  const visibilityGap = rawVisibilityGap !== undefined ? Math.round(rawVisibilityGap) : undefined;
  
  const rawCoverageScore = item.coverage_score !== undefined && item.coverage_score !== null ? item.coverage_score :
    (item.visibility_gap?.coverage_score !== undefined && item.visibility_gap?.coverage_score !== null ? item.visibility_gap.coverage_score : undefined);

  const coverageScore = rawCoverageScore !== undefined ? Math.round(rawCoverageScore) : undefined;

  const deploymentScore = Math.round(
    item.deployment_score !== undefined && item.deployment_score !== null ? item.deployment_score :
    item.deployment?.deployment_score !== undefined && item.deployment?.deployment_score !== null ? item.deployment.deployment_score :
    (tdpi * 0.7 + (visibilityGap !== undefined ? visibilityGap : 0) * 0.3)
  );
  
  const predictedRisk = item.tdpi_score !== undefined && item.tdpi_score !== null ? item.tdpi_score : 
    item.hourly_estimate !== undefined && item.hourly_estimate !== null ? item.hourly_estimate : 
    item.projected_tdpi !== undefined && item.projected_tdpi !== null ? item.projected_tdpi
    : (item.tdpi?.tdpi_score || 0);

  const name = getNeighborhoodName(lng, lat, `Grid Sector R${index}`);
  const forecastConfidence = parseFloat(
    Math.min(0.99, Math.max(0.6, 0.95 - (visibilityGap !== undefined ? visibilityGap : 0) / 300)).toFixed(2)
  );

  let explanation = item.executive_summary || item.deployment?.executive_summary || item.deployment?.recommendation_reason || "";
  if (!explanation) {
    if (tdpi > 75) {
      explanation = `AI Priority is CRITICAL due to extreme parking density levels (${tdpi}%) causing local corridor blockages. `;
    } else if (tdpi > 50) {
      explanation = `AI Priority is HIGH due to moderate vehicle density spikes (${tdpi}%) encroaching active lanes. `;
    } else {
      explanation = `AI Priority is STABLE. Traffic congestion levels are low (${tdpi}%). `;
    }

    if (visibilityGap !== undefined) {
      if (visibilityGap > 70) {
        explanation += `Risk is compounded by severe operational Visibility Gaps (${visibilityGap}%). Mapped zones are currently out of coverage, representing critical patrol priority.`;
      } else if (visibilityGap > 40) {
        explanation += `Visibility gaps are moderate (${visibilityGap}%). Recommended patrol routing covers spillover areas.`;
      } else {
        explanation += `Visibility indicators are healthy. Region is securely monitored by nearby active patrols.`;
      }
    } else {
      explanation += `Visibility indicators are currently unavailable for this sector.`;
    }
  }

  let geom = GEOMETRY_CACHE.get(h3Index);
  if (!geom) {
    geom = {
      center: [lng, lat],
      vertices: generateHexagonVertices(lng, lat)
    };
    GEOMETRY_CACHE.set(h3Index, geom);
  }

  return {
    h3Index,
    center: geom.center,
    vertices: geom.vertices,
    name,
    // Projected TDPI. Used ONLY in Simulation Mode.
    tdpi,
    visibilityGap,
    historicalViolations: item.total_violations !== undefined ? Math.round(item.total_violations) : Math.floor(10 + tdpi * 2.5),
    forecastConfidence,
    deploymentScore,
    predictedRisk,
    explanation,
    assignedPatrols: [],
    // Historical TDPI. Used in Observe and Plan modes.
    baselineTdpi: Math.round(item.tdpi_score !== undefined ? item.tdpi_score : (item.tdpi?.tdpi_score || 0)),
    violationsAddressed: Math.round(
      item.estimated_weekly_violations_addressed !== undefined ? item.estimated_weekly_violations_addressed :
      item.deployment?.estimated_weekly_violations_addressed !== undefined ? item.deployment.estimated_weekly_violations_addressed :
      0
    ),
    coverageScore: Math.round(
      item.coverage_score !== undefined ? item.coverage_score :
      item.deployment?.coverage_score !== undefined ? item.deployment.coverage_score :
      0
    ),
    // Forecast demand. Used ONLY in Predict Mode.
    forecastedDemand: Math.round(
      item.predicted_violations !== undefined ? item.predicted_violations :
      item.forecast?.predicted_violations !== undefined ? item.forecast.predicted_violations :
      0
    ),
    // Backend AI recommendation. Never calculate on frontend.
    recommendedPatrolUnits: Math.round(
      item.recommended_patrol_units !== undefined ? item.recommended_patrol_units :
      item.deployment?.recommended_patrol_units !== undefined ? item.deployment.recommended_patrol_units :
      1
    ),
    hotspotTier: item.hotspot_tier !== undefined ? item.hotspot_tier : (item.tdpi?.hotspot_tier !== undefined ? item.tdpi.hotspot_tier : undefined),
    tdpiPercentile: item.tdpi_percentile !== undefined ? item.tdpi_percentile : (item.tdpi?.tdpi_percentile !== undefined ? item.tdpi.tdpi_percentile : undefined),
  };
}

/**
 * Maps Backend Hotspots list to frontend H3GridCell[]
 */
export function adaptHotspotsList(hotspots: any[]): H3GridCell[] {
  return hotspots.map((item, idx) => adaptHotspotItem(item, idx));
}

/**
 * Maps Backend Simulation Comparison Summary to frontend format
 */
export function adaptSimulationSummary(backendSimData: any): any {
  const summary = backendSimData.summary || {};
  const baseline = backendSimData.baseline || [];
  const simulated = backendSimData.simulated || [];

  const hotspotsBefore = baseline.filter((c: any) => (c.tdpi_score || 0) > 65).length;
  const hotspotsAfter = simulated.filter((c: any) => (c.projected_tdpi || c.tdpi_score || 0) > 65).length;

  const currentVisibilityGap = Math.round(baseline.reduce((acc: number, c: any) => acc + (c.visibility_gap_index !== undefined ? c.visibility_gap_index : (c.visibility_gap?.visibility_gap_index || 0)), 0) / (baseline.length || 1));
  const projectedVisibilityGap = Math.round(simulated.reduce((acc: number, c: any) => acc + (c.visibility_gap_index !== undefined ? c.visibility_gap_index : (c.visibility_gap?.visibility_gap_index || 0)), 0) / (simulated.length || 1));
  const gapDiff = currentVisibilityGap - projectedVisibilityGap;
  const operationalRiskReduction = currentVisibilityGap > 0 ? Math.round((gapDiff / currentVisibilityGap) * 100) : 0;

  const congestionReduction = Math.max(0, Math.round(summary.simulated_avg_improvement_percent || 0));
  
  // Base the 100-point score on the backend's simulated operational improvement and patrol ROI
  const improvementScore = Math.round(summary.simulated_avg_improvement_percent || 0) * 1.5;
  const roiScore = Math.round(summary.simulated_avg_patrol_roi || 0) * 15;
  const deploymentBenefitScore = Math.min(100, Math.max(0, Math.round(improvementScore + roiScore)));

  return {
    currentTdpi: Math.round(baseline.reduce((sum:number,c:any)=>sum+(c.tdpi_score||0),0)/(baseline.length||1)),
    projectedTdpi: Math.round(summary.simulated_avg_projected_tdpi || 0),
    currentVisibilityGap,
    projectedVisibilityGap,
    congestionReduction,
    operationalRiskReduction: Math.max(0, operationalRiskReduction),
    deploymentBenefitScore,
    hotspotsBefore,
    hotspotsAfter
  };
}

/**
 * Maps Backend Patrol Recommendations to frontend Optimization UI Insights
 */
export function adaptPatrolOptimizations(recommendations: any[], squads: any[]): any[] {
  if (!recommendations || !squads) return [];
  
  // Sort recommendations by highest priority (deployment_score)
  const sorted = [...recommendations].sort((a, b) => (b.deployment_score || 0) - (a.deployment_score || 0));
  
  return squads.map((sq, idx) => {
    const rec = sorted[idx];
    if (!rec) return null;
    
    const inputs: string[] = [];
    if (rec.tdpi_score >= 50) inputs.push("Elevated TDPI load");
    if (rec.visibility_gap_index >= 20) inputs.push("Elevated Visibility Gap");
    if (rec.forecast_pressure >= 50) inputs.push("High Forecasted Demand");
    if (rec.spatial_criticality >= 50 || rec.hotspot_tier === "TIER_1") {
      inputs.push("Priority Enforcement Zone");
    }
    if (inputs.length === 0) {
      inputs.push("Routine Monitoring Sector");
    }

    const riskReduction = rec.estimated_operational_risk_reduction || 0;
    const benefitText = riskReduction > 0
      ? `Projected operational risk reduction: ${riskReduction}%`
      : "Enforcement visibility coverage stabilization";

    const percentileRank = Math.max(1, Math.round(((sorted.length - 1 - idx) / Math.max(1, sorted.length - 1)) * 100));

    return {
      id: sq.id,
      recommend: rec.h3_index,
      priority: rec.deployment_priority || "ROUTINE",
      score: rec.deployment_score || 0,
      reason: rec.recommendation_reason || "Routine monitoring requirements.",
      benefit: benefitText,
      inputs: inputs,
      trust: "Generated from: Forecast Intelligence, TDPI Analysis, Visibility Gap Assessment, Patrol Optimization Engine",
      // Extended fields for XAI Drawer
      tdpiScore: rec.tdpi_score || 0,
      visibilityGapIndex: rec.visibility_gap_index || 0,
      predictedViolations: rec.predicted_violations || 0,
      forecastPressure: rec.forecast_pressure || 0,
      spatialCriticality: rec.spatial_criticality || 0,
      hotspotTier: rec.hotspot_tier || "NORMAL",
      deploymentRank: rec.deployment_rank || (idx + 1),
      tdpiPercentile: rec.tdpi_percentile !== undefined ? rec.tdpi_percentile : undefined,
      recommendedPatrolUnits: rec.recommended_patrol_units || 1,
      historicalEnforcementRate: rec.historical_enforcement_rate || 0,
      estimatedTdpiReduction: rec.estimated_tdpi_reduction || 0,
      estimatedOperationalRiskReduction: riskReduction,
      approvedViolations: rec.approved_violations || 0,
      totalViolations: rec.total_violations || 0,
      junctions: rec.junctions || 0,
      policeStations: rec.police_stations || 0,
      rawRecommendation: rec
    };
  }).filter(Boolean);
}

/**
 * Maps Backend Dashboard Alerts to frontend Activity Feed
 */
export function adaptActivityFeed(dashboardData: any): any[] {
  const alerts = dashboardData.alerts || [];
  return alerts.map((a: any, idx: number) => ({
    id: `feed-${idx}`,
    message: a.message,
    timestamp: a.timestamp || "Just now",
    stage: a.title || "System Log",
    type: a.type === "critical" ? "warning" : a.type === "warning" ? "info" : "success"
  }));
}

/**
 * Generates frontend Categorized Reports dynamically from backend summaries
 */
export function adaptCategorizedReports(
  category: "executive" | "forecast" | "patrol" | "impact" | undefined,
  dashboardStats: any,
  forecastStats: any,
  patrolStats: any,
  deploymentStats: any
): any[] {
  const reports: any[] = [];
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (!category || category === "executive") {
    reports.push({
      id: "rep-exec-live",
      category: "executive",
      title: "Bengaluru Executive Operations Report",
      description: "Live summary of validation counts, average TDPI scores, and dispatch effectiveness.",
      date: dateStr,
      tdpi: Math.round(dashboardStats.overview?.average_tdpi || 0),
      visibilityGap: Math.round(dashboardStats.overview?.immediate_deployments || 0), // approximated mapping
      expectedReduction: 25, // executive default approximation
      summary: `System running nominally. Current city-wide average TDPI is ${Math.round(dashboardStats.overview?.average_tdpi || 0)}%.`
    });
  }

  if (!category || category === "forecast") {
    reports.push({
      id: "rep-fore-live",
      category: "forecast",
      title: "City Congestion Forecast Projection",
      description: "Temporal operational intelligence derived from historical parking violation patterns.",
      date: dateStr,
      tdpi: 74, // placeholder mapping
      visibilityGap: 38,
      expectedReduction: 18,
      summary: `Forecast engine shows ${Math.round((forecastStats.average_forecast_confidence || 0) * 100)}% confidence across ${forecastStats.total_forecasts || 0} active models. Trend is ${forecastStats.expected_violations_trend || 'stable'}.`
    });
  }

  if (!category || category === "patrol") {
    reports.push({
      id: "rep-pat-live",
      category: "patrol",
      title: "Patrol Allocation & Coverage Report",
      description: "Evaluates enforcement reach and squad deployment parameters across central corridors.",
      date: dateStr,
      tdpi: 52,
      visibilityGap: 14,
      expectedReduction: 26,
      summary: `Patrol optimizer produced ${patrolStats.total_recommendations || 0} allocations. Average deployment score is ${Math.round(patrolStats.average_deployment_score || 0)}. Expected to address ${Math.round(patrolStats.total_expected_violations_addressed || 0)} violations.`
    });
  }

  if (!category || category === "impact") {
    reports.push({
      id: "rep-imp-live",
      category: "impact",
      title: "Deployment Impact Assessment Summary",
      description: "Simulates traffic load reduction and risk mitigation outcomes on resource re-allocation.",
      date: dateStr,
      tdpi: Math.round(deploymentStats.average_projected_tdpi || 0),
      visibilityGap: 18,
      expectedReduction: Math.round(deploymentStats.average_operational_improvement_percent || 0),
      summary: `Simulation models project a ${Math.round(deploymentStats.average_operational_improvement_percent || 0)}% operational improvement and an ROI of ${Math.round(deploymentStats.average_patrol_roi || 0)}.`
    });
  }

  return reports;
}
