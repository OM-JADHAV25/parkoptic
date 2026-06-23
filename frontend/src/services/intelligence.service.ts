// Bengaluru Digital Twin Operations: Service Aggregator for ParkOptic Backend

export interface H3GridCell {
  h3Index: string;
  center: [number, number]; // [lng, lat]
  vertices: [number, number][]; // Hexagon coordinates [lng, lat][]
  name: string;
  tdpi: number; // Current TDPI (0-100)
  visibilityGap?: number; // Current Visibility Gap (0-100)
  historicalViolations: number;
  forecastConfidence: number; // (0.0 to 1.0)
  deploymentScore: number; // Priority score (0-100)
  predictedRisk: number; // Forecasted risk (0-100)
  explanation: string;
  assignedPatrols: string[]; // Patrol squad IDs active in this cell
  baselineTdpi?: number;
  violationsAddressed?: number;
  coverageScore?: number;
  forecastedDemand?: number;
  recommendedPatrolUnits?: number;
  hotspotTier?: string;
  tdpiPercentile?: number;
}

export interface PatrolUnit {
  id: string;
  name: string;
  position: [number, number]; // [lng, lat]
  status: "active" | "patrolling" | "dispatched" | "off-duty";
  coverageRadius: number; // in meters (operational range)
  officerCount: number;
  assignedCell?: string;
}

export interface CatBoostStats {
  validatedCount: number;
  rejectedCount: number;
  validationConfidence: number; // percentage
  inferenceLatency: number; // ms
  modelName: string;
  modelVersion: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: "nominal" | "running" | "degraded";
  latency: number; // ms
  version: string;
  lastExecution: string;
}

export interface ServiceHealth {
  id: string;
  name: string;
  version: string;
  status: "nominal" | "warning" | "degraded";
  latency?: number;
  memory: string;
  lastSync: string;
}


export interface ActivityFeedItem {
  id: string;
  message: string;
  timestamp: string;
  stage: string;
  type: "success" | "info" | "warning";
}

export interface CategorizedReport {
  id: string;
  category: "executive" | "forecast" | "patrol" | "impact";
  title: string;
  description: string;
  date: string;
  tdpi: number;
  visibilityGap: number;
  expectedReduction: number;
  summary: string;
}

export interface DashboardSummary {
  cityTdpi: number;
  activeHotspots: number;
  coverageIndex: number; // percentage coverage
  visibilityGapsCount: number; // number of high risk, low visibility cells
  aiBriefing: string;
  catboost: CatBoostStats;
  operationalRecommendations: {
    id: string;
    priority: "critical" | "warning" | "info";
    cellIndex: string;
    title: string;
    reasoning: string;
    action: string;
  }[];
  alerts: {
    id: string;
    title: string;
    message: string;
    type: "critical" | "warning" | "success" | "info";
    timestamp: string;
  }[];
  averageVisibilityGap?: number;
  loadTimestamp?: string | null;
  datasets?: any;
  topHotspots?: any[];
}

export interface SimulationResult {
  currentTdpi: number;
  projectedTdpi: number;
  currentVisibilityGap: number;
  projectedVisibilityGap: number;
  congestionReduction: number; // expected percentage reduction
  operationalRiskReduction: number;
  deploymentBenefitScore: number; // 0-100
  hotspotsBefore: number;
  hotspotsAfter: number;
}

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

// Center of Bengaluru Operational Grid
const CENTER_LAT = 12.9716;
const CENTER_LNG = 77.5946;

const HOTSPOT_CENTERS = [
  { lng: 77.6067, lat: 12.9754, intensity: 1.0, name: "MG Road" },
  { lng: 77.6394, lat: 12.9625, intensity: 0.9, name: "Indiranagar" },
  { lng: 77.6150, lat: 12.9350, intensity: 0.85, name: "Koramangala" },
  { lng: 77.5800, lat: 12.9900, intensity: 0.7, name: "Malleshwaram" },
  { lng: 77.5600, lat: 12.9300, intensity: 0.6, name: "Banashankari" },
];

const GRID_CELLS_DEFINITION: {row: number, col: number, name: string}[] = [];
const GRID_RADIUS = 10;

for (let row = -GRID_RADIUS; row <= GRID_RADIUS; row++) {
  for (let col = -GRID_RADIUS; col <= GRID_RADIUS; col++) {
    const xOffset = col * HEX_RADIUS_LNG * 1.5 + (Math.abs(row) % 2 === 1 ? (HEX_RADIUS_LNG * 1.5) / 2 : 0);
    const yOffset = row * HEX_RADIUS_LAT * 1.732;
    const distSq = (xOffset * xOffset) + (yOffset * yOffset);
    if (distSq < (GRID_RADIUS * HEX_RADIUS_LNG * 1.3) ** 2) {
      GRID_CELLS_DEFINITION.push({ row, col, name: `Grid Sector R${row}C${col}` });
    }
  }
}

export const BENGALURU_GRID_CELLS: H3GridCell[] = GRID_CELLS_DEFINITION.map((def, idx) => {
  const xOffset = def.col * HEX_RADIUS_LNG * 1.5 + (Math.abs(def.row) % 2 === 1 ? (HEX_RADIUS_LNG * 1.5) / 2 : 0);
  const yOffset = def.row * HEX_RADIUS_LAT * 1.732;
  const cellLng = CENTER_LNG + xOffset;
  const cellLat = CENTER_LAT + yOffset;

  let baseTdpi = 15;
  let baseVisibilityGap = 20;
  let nearestHsName = def.name;
  let maxHsImpact = 0;

  for (const hs of HOTSPOT_CENTERS) {
    const dx = cellLng - hs.lng;
    const dy = cellLat - hs.lat;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 0.035) { // roughly 3.5km
      const factor = 1 - (dist / 0.035);
      baseTdpi += factor * 75 * hs.intensity;
      baseVisibilityGap += factor * 60 * hs.intensity;
      if (factor > maxHsImpact) {
        maxHsImpact = factor;
        nearestHsName = `${hs.name} Outer`;
        if (dist < 0.015) nearestHsName = `${hs.name} Central`;
      }
    }
  }

  // Add deterministic noise
  const noise = (Math.sin(def.row * 13.3) + Math.cos(def.col * 7.7)) * 5;
  baseTdpi += noise;
  baseVisibilityGap += (noise * 1.5);

  const finalTdpi = Math.min(100, Math.max(5, Math.round(baseTdpi)));
  const finalVisibilityGap = Math.min(100, Math.max(5, Math.round(baseVisibilityGap)));

  const h3Index = `88618926${idx.toString(16).padStart(3, "0")}ffff`;
  return {
    h3Index,
    center: [cellLng, cellLat],
    vertices: generateHexagonVertices(cellLng, cellLat),
    name: nearestHsName !== def.name ? nearestHsName : def.name,
    tdpi: finalTdpi,
    visibilityGap: finalVisibilityGap,
    historicalViolations: Math.floor(10 + (finalTdpi * 2.5)),
    forecastConfidence: parseFloat(Math.min(0.99, Math.max(0.6, 0.95 - (finalVisibilityGap / 300))).toFixed(2)),
    deploymentScore: Math.round(finalTdpi * 0.7 + finalVisibilityGap * 0.3),
    predictedRisk: finalTdpi, // Base risk
    explanation: "",
    assignedPatrols: []
  };
});

export const TIMELINE_HOURS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
  "22:00"
];

// Initial mock patrol allocations
const INITIAL_PATROL_UNITS: PatrolUnit[] = [
  { id: "squad-alpha", name: "Squad Alpha", position: [77.6067, 12.9754], status: "patrolling", coverageRadius: 600, officerCount: 3, assignedCell: "89618924b93ffff" }, // MG Road Metro
  { id: "squad-beta", name: "Squad Beta", position: [77.6394, 12.9625], status: "active", coverageRadius: 800, officerCount: 4, assignedCell: "89618921ab7ffff" },  // Indiranagar 100ft
  { id: "squad-gamma", name: "Squad Gamma", position: [77.6050, 12.9818], status: "dispatched", coverageRadius: 500, officerCount: 3, assignedCell: "89601458377ffff" }, // Commercial St
  { id: "squad-delta", name: "Squad Delta", position: [77.6095, 12.9592], status: "active", coverageRadius: 700, officerCount: 2, assignedCell: "896189255b7ffff" }   // Richmond Town
];

let currentSimulationPatrols: PatrolUnit[] = [...INITIAL_PATROL_UNITS];



export const intelligenceService = {
  /**
   * Fetch current patrol squad states
   */
  async getPatrolUnits(): Promise<PatrolUnit[]> {
    return currentSimulationPatrols;
  },

  /**
   * Reset simulation to original database defaults
   */
  resetSimulation(): void {
    currentSimulationPatrols = [...INITIAL_PATROL_UNITS];
  },

  simulatePatrolChange(squadId: string, targetCellIndex: string | null, center?: [number, number]): { patrolUnits: PatrolUnit[] } {
    currentSimulationPatrols = currentSimulationPatrols.map(patrol => {
      if (patrol.id === squadId) {
        if (targetCellIndex === null) {
          return { ...patrol, assignedCell: undefined, status: "off-duty" };
        } else {
          const targetCell = BENGALURU_GRID_CELLS.find(c => c.h3Index === targetCellIndex);
          return { 
            ...patrol, 
            assignedCell: targetCellIndex, 
            status: "patrolling",
            position: center || (targetCell ? targetCell.center : patrol.position)
          };
        }
      }
      return patrol;
    });

    return { patrolUnits: currentSimulationPatrols };
  }
};


