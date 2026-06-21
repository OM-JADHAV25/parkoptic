"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Map from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import DeckGL from "@deck.gl/react";
import { PolygonLayer, ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import { H3GridCell, PatrolUnit } from "@/services/intelligence.service";
import { OperationalMode, MapLayer } from "@/hooks/useIntelligence";
import "maplibre-gl/dist/maplibre-gl.css";

interface DigitalTwinMapProps {
  mode: OperationalMode;
  layer: MapLayer;
  gridCells: H3GridCell[];
  patrolUnits: PatrolUnit[];
  selectedCellIndex: string | null;
  onSelectCell: (h3Index: string | null) => void;
  timelineHour: string;
  focusParam?: string | null;
  recommendedCellIndices?: string[];
  isSimulationActive?: boolean;
  scenarioDeltas?: any[];
}

// Map configuration
const INITIAL_VIEW_STATE = {
  latitude: 12.9716,
  longitude: 77.5946,
  zoom: 13.5,
  pitch: 45,
  bearing: -10,
};

const MAP_STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// --- Color Palette ---
// Curated operational colors with proper perceptual hierarchy
const COLORS = {
  // TDPI threat levels
  tdpiCritical:   [255, 59, 48] as const,    // Vivid red — immediate danger
  tdpiHigh:       [255, 149, 0] as const,    // Amber — elevated risk
  tdpiModerate:   [52, 199, 89] as const,    // Green — stable
  tdpiLow:        [30, 40, 60] as const,     // Near-invisible dark slate

  // Visibility gap levels
  visCritical:    [175, 82, 222] as const,   // Ultraviolet — severe gap
  visModerate:    [90, 200, 250] as const,   // Soft cyan — moderate gap
  visLow:         [40, 50, 70] as const,     // Ghost slate — no concern

  // Predict mode gradient endpoints
  predictLow:     [20, 30, 60] as const,     // Deep navy
  predictHigh:    [255, 55, 95] as const,    // Hot magenta

  // Hotspot glow
  hotspotFill:    [255, 59, 48] as const,
  hotspotStroke:  [255, 100, 80] as const,

  // Patrol
  patrolFill:     [59, 130, 246] as const,
  patrolStroke:   [255, 255, 255] as const,
  patrolCoverage: [59, 130, 246] as const,

  // Selection
  selectedStroke: [255, 255, 255] as const,

  // Grid line (very subtle)
  gridLine:       [255, 255, 255] as const,

  // Recommendation highlight
  recommendGold:  [245, 158, 11] as const,

  // Assignment line
  assignmentLine: [59, 130, 246] as const,
};

// Opacity thresholds — the key to visual hierarchy
const OPACITY = {
  // Unselected cell fill based on risk
  cellGhost: 12,          // Low-risk cells: barely visible
  cellSubtle: 35,         // Moderate cells: present but subdued
  cellProminent: 70,      // High-risk cells: clearly visible
  cellCritical: 110,      // Critical cells: demands attention

  // Selected cell
  selectedFill: 160,      // Selected cell stands out clearly
  
  // Dimming when a cell is selected
  dimmedMultiplier: 0.45, // Non-selected cells dim to ~45% when a selection is active

  // Grid lines
  gridLineDefault: 15,    // Nearly invisible grid lines
  gridLineSelected: 90,   // Bright grid line on selected cell
};

/**
 * Compute the operational severity (0.0 – 1.0) for a cell based on the active layer.
 * This single scalar drives opacity, elevation, and emphasis.
 */
function getSeverity(cell: H3GridCell, mode: OperationalMode, activeLayer: MapLayer): number {
  if (mode === "predict") {
    return Math.min(1, Math.max(0, cell.predictedRisk / 100));
  }
  if (activeLayer === "visibility") {
    return Math.min(1, Math.max(0, cell.visibilityGap / 100));
  }
  // Default: TDPI
  return Math.min(1, Math.max(0, cell.tdpi / 100));
}

/**
 * Interpolate between two RGB colors based on t ∈ [0, 1].
 */
function lerpColor(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}



const DigitalTwinMap = React.memo(function DigitalTwinMap({
  mode,
  layer,
  gridCells,
  patrolUnits,
  selectedCellIndex,
  onSelectCell,
  timelineHour,
  focusParam,
  recommendedCellIndices = [],
  isSimulationActive = false,
  scenarioDeltas = [],
}: DigitalTwinMapProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [pulseFactor, setPulseFactor] = useState(1.0);
  const [flashActive, setFlashActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Breathing/pulse animation for focused patrol unit coverage radius
  useEffect(() => {
    if (!focusParam) {
      setPulseFactor(1.0);
      return;
    }
    const interval = setInterval(() => {
      setPulseFactor((p) => (p === 1.0 ? 1.12 : 1.0));
    }, 800);
    return () => clearInterval(interval);
  }, [focusParam]);

  // Briefly flash/emphasize selected operational zone outline
  useEffect(() => {
    if (selectedCellIndex) {
      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [selectedCellIndex]);

  // Auto-center map on selected H3 cell
  useEffect(() => {
    if (selectedCellIndex) {
      const selected = gridCells.find((c) => c.h3Index === selectedCellIndex);
      if (selected) {
        setViewState((prev) => ({
          ...prev,
          longitude: selected.center[0],
          latitude: selected.center[1],
          zoom: 14.5,
          transitionDuration: 1000,
        }));
      }
    }
  }, [selectedCellIndex, gridCells]);

  // Auto-center map on focused patrol squad
  useEffect(() => {
    if (focusParam) {
      const squad = patrolUnits.find((p) => p.id === focusParam);
      if (squad) {
        setViewState((prev) => ({
          ...prev,
          longitude: squad.position[0],
          latitude: squad.position[1],
          zoom: 14.8,
          transitionDuration: 1000,
        }));
        if (squad.assignedCell) {
          onSelectCell(squad.assignedCell);
        }
      }
    }
  }, [focusParam, patrolUnits, onSelectCell]);

  // --- Memoized color accessor ---
  const getCellFillColor = useMemo(() => {
    const hasSelection = !!selectedCellIndex;

    return (cell: H3GridCell): [number, number, number, number] => {
      const isSelected = cell.h3Index === selectedCellIndex;
      const severity = getSeverity(cell, mode, layer);

      // Determine base color from severity and active layer
      let baseColor: [number, number, number];

      if (mode === "predict") {
        baseColor = lerpColor(COLORS.predictLow, COLORS.predictHigh, severity);
      } else if (layer === "visibility") {
        if (severity > 0.7) baseColor = [...COLORS.visCritical];
        else if (severity > 0.4) baseColor = lerpColor(COLORS.visLow, COLORS.visModerate, (severity - 0.4) / 0.3);
        else baseColor = [...COLORS.visLow];
      } else {
        // TDPI (default)
        if (severity > 0.7) baseColor = [...COLORS.tdpiCritical];
        else if (severity > 0.4) baseColor = lerpColor(COLORS.tdpiModerate, COLORS.tdpiHigh, (severity - 0.4) / 0.3);
        else if (severity > 0.15) baseColor = [...COLORS.tdpiModerate];
        else baseColor = [...COLORS.tdpiLow];
      }

      // Determine opacity — risk-proportional + selection-aware
      let alpha: number;
      if (isSelected) {
        alpha = OPACITY.selectedFill;
      } else {
        // Map severity to opacity with exponential curve for natural hierarchy
        if (severity > 0.7) alpha = OPACITY.cellCritical;
        else if (severity > 0.4) alpha = OPACITY.cellProminent;
        else if (severity > 0.15) alpha = OPACITY.cellSubtle;
        else alpha = OPACITY.cellGhost;

        // Dim non-selected cells when a selection is active
        if (hasSelection) {
          alpha = Math.round(alpha * OPACITY.dimmedMultiplier);
        }
      }

      return [baseColor[0], baseColor[1], baseColor[2], alpha];
    };
  }, [mode, layer, selectedCellIndex]);

  // --- Memoized line color accessor ---
  const getCellLineColor = useMemo(() => {
    const recSet = new Set(recommendedCellIndices);
    return (cell: H3GridCell): [number, number, number, number] => {
      const isSelected = cell.h3Index === selectedCellIndex;
      if (isSelected) {
        if (flashActive) {
          return [34, 211, 238, 240]; // Bright cyan flashing outline
        }
        return [COLORS.selectedStroke[0], COLORS.selectedStroke[1], COLORS.selectedStroke[2], OPACITY.gridLineSelected];
      }
      // Gold outline for recommended cells in plan mode
      if (recSet.has(cell.h3Index)) {
        return [COLORS.recommendGold[0], COLORS.recommendGold[1], COLORS.recommendGold[2], 160];
      }
      return [COLORS.gridLine[0], COLORS.gridLine[1], COLORS.gridLine[2], OPACITY.gridLineDefault];
    };
  }, [selectedCellIndex, recommendedCellIndices, flashActive]);

  // --- Memoized line width accessor ---
  const getCellLineWidth = useMemo(() => {
    const recSet = new Set(recommendedCellIndices);
    return (cell: H3GridCell): number => {
      if (cell.h3Index === selectedCellIndex) return 3;
      if (recSet.has(cell.h3Index)) return 2;
      return 1;
    };
  }, [selectedCellIndex, recommendedCellIndices]);

  // --- Memoized elevation accessor for selected cell depth effect ---
  const getCellElevation = useMemo(() => {
    return (cell: H3GridCell): number => {
      if (cell.h3Index === selectedCellIndex) return 60;
      const severity = getSeverity(cell, mode, layer);
      if (severity > 0.7) return 25;
      return 0;
    };
  }, [selectedCellIndex, mode, layer]);

  // --- Stable onClick handler ---
  const handleCellClick = useCallback(
    (info: any) => {
      if (info.object) {
        const clickedCell = info.object as H3GridCell;
        onSelectCell(clickedCell.h3Index);
      } else {
        onSelectCell(null);
      }
    },
    [onSelectCell]
  );

  const handleHotspotClick = useCallback(
    (info: any) => {
      if (info.object) {
        const clicked = info.object as H3GridCell;
        onSelectCell(clicked.h3Index);
      }
    },
    [onSelectCell]
  );

  // --- Build assignment line data for patrol → target cell ---
  const assignmentLines = useMemo(() => {
    return patrolUnits
      .filter(p => p.assignedCell && p.status !== "off-duty")
      .map(p => {
        const targetCell = gridCells.find(c => c.h3Index === p.assignedCell);
        if (!targetCell) return null;
        return {
          source: p.position,
          target: targetCell.center,
          id: p.id,
        };
      })
      .filter(Boolean) as { source: [number, number]; target: [number, number]; id: string }[];
  }, [patrolUnits, gridCells]);

  // --- DeckGL Layers ---
  const layers = useMemo(() => {
    // 1. H3 Intelligence Grid — the primary spatial layer
    const polygonLayer = new PolygonLayer({
      id: "h3-grid-layer",
      data: gridCells,
      pickable: true,
      stroked: true,
      filled: true,
      extruded: true,
      wireframe: false,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 25],
      getPolygon: (d: H3GridCell) => d.vertices,
      getFillColor: (d: H3GridCell) => getCellFillColor(d),
      getLineColor: (d: H3GridCell) => getCellLineColor(d),
      getLineWidth: (d: H3GridCell) => getCellLineWidth(d),
      getElevation: (d: H3GridCell) => getCellElevation(d),
      elevationScale: 1,
      lineWidthMinPixels: 1,
      lineWidthMaxPixels: 3,
      onClick: handleCellClick,
      updateTriggers: {
        getFillColor: [mode, layer, selectedCellIndex],
        getLineColor: [selectedCellIndex, recommendedCellIndices, flashActive],
        getLineWidth: [selectedCellIndex, recommendedCellIndices],
        getElevation: [selectedCellIndex, mode, layer],
      },
      transitions: {
        getFillColor: 500,
        getLineColor: 400,
        getElevation: 600,
      },
    });

    // 2. Critical Hotspot Glow — draws attention to the most critical zones
    const criticalCells = gridCells.filter((c) => c.tdpi > 72);
    const hotspotGlowLayer = new ScatterplotLayer({
      id: "hotspot-glow-layer",
      data: criticalCells,
      pickable: true,
      opacity: 0.6,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 8,
      radiusMaxPixels: 40,
      lineWidthMinPixels: 1.5,
      getPosition: (d: H3GridCell) => [d.center[0], d.center[1]],
      getRadius: (d: H3GridCell) => 80 + (d.tdpi - 72) * 6,
      getFillColor: (d: H3GridCell) => {
        const intensity = Math.min(1, (d.tdpi - 72) / 28);
        return [
          COLORS.hotspotFill[0],
          COLORS.hotspotFill[1],
          COLORS.hotspotFill[2],
          Math.round(20 + intensity * 35),
        ] as [number, number, number, number];
      },
      getLineColor: (d: H3GridCell) => {
        const intensity = Math.min(1, (d.tdpi - 72) / 28);
        return [
          COLORS.hotspotStroke[0],
          COLORS.hotspotStroke[1],
          COLORS.hotspotStroke[2],
          Math.round(80 + intensity * 175),
        ] as [number, number, number, number];
      },
      onClick: handleHotspotClick,
      updateTriggers: {
        getFillColor: [gridCells],
        getLineColor: [gridCells],
        getRadius: [gridCells],
      },
    });

    // 3. Recommendation highlight rings — subtle gold outlines for AI-recommended cells (Plan mode)
    const recommendedCells = gridCells.filter(c => recommendedCellIndices.includes(c.h3Index));
    const recommendationLayer = new ScatterplotLayer({
      id: "recommendation-highlight-layer",
      data: mode === "plan" ? recommendedCells : [],
      pickable: true,
      opacity: 0.7,
      stroked: true,
      filled: false,
      radiusScale: 6,
      radiusMinPixels: 12,
      radiusMaxPixels: 35,
      lineWidthMinPixels: 2,
      getPosition: (d: H3GridCell) => [d.center[0], d.center[1]],
      getRadius: (d: H3GridCell) => 120 + d.deploymentScore * 1.5,
      getLineColor: [COLORS.recommendGold[0], COLORS.recommendGold[1], COLORS.recommendGold[2], 180],
      onClick: handleHotspotClick,
      transitions: {
        getPosition: 600,
      },
    });

    // 4. Patrol Coverage Radius — subtle area-of-effect rings
    const activePatrols = patrolUnits.filter((p) => p.status !== "off-duty");
    const showCoverage = mode === "plan" || mode === "simulate" || layer === "visibility";
    const patrolCoverageLayer = new ScatterplotLayer({
      id: "patrol-coverage-layer",
      data: showCoverage ? activePatrols : [],
      opacity: 0.12,
      stroked: true,
      filled: true,
      radiusScale: 1,
      getPosition: (d: PatrolUnit) => d.position,
      getRadius: (d: PatrolUnit) => d.id === focusParam ? d.coverageRadius * pulseFactor : d.coverageRadius,
      getFillColor: [COLORS.patrolCoverage[0], COLORS.patrolCoverage[1], COLORS.patrolCoverage[2], 25],
      getLineColor: [COLORS.patrolCoverage[0], COLORS.patrolCoverage[1], COLORS.patrolCoverage[2], 120],
      lineWidthMinPixels: 1,
      updateTriggers: {
        getRadius: [focusParam, pulseFactor],
      },
      transitions: {
        getPosition: 1200,
        getRadius: 800,
      },
    });

    // 5. Assignment Lines — dashed lines from patrol to assigned cell (Component 5)
    const assignmentLineLayer = new LineLayer({
      id: "assignment-line-layer",
      data: (mode === "plan" || mode === "simulate") ? assignmentLines : [],
      getSourcePosition: (d: any) => d.source,
      getTargetPosition: (d: any) => d.target,
      getColor: [COLORS.assignmentLine[0], COLORS.assignmentLine[1], COLORS.assignmentLine[2], 100],
      getWidth: 2,
      widthMinPixels: 1,
      widthMaxPixels: 3,
      transitions: {
        getSourcePosition: 1200,
        getTargetPosition: 1200,
      },
    });

    // 6. Patrol Unit Markers — top-level operational units
    const patrolMarkersLayer = new ScatterplotLayer({
      id: "patrol-markers-layer",
      data: activePatrols,
      pickable: true,
      opacity: 0.95,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 5,
      radiusMaxPixels: 11,
      lineWidthMinPixels: 1.5,
      getPosition: (d: PatrolUnit) => d.position,
      getRadius: 90,
      getFillColor: [COLORS.patrolFill[0], COLORS.patrolFill[1], COLORS.patrolFill[2], 255],
      getLineColor: [COLORS.patrolStroke[0], COLORS.patrolStroke[1], COLORS.patrolStroke[2], 220],
      transitions: {
        getPosition: 1200,
      },
    });

    // 7. Patrol Outer Halo — subtle presence indicator
    const patrolHaloLayer = new ScatterplotLayer({
      id: "patrol-halo-layer",
      data: activePatrols,
      pickable: false,
      opacity: 0.35,
      stroked: true,
      filled: false,
      radiusScale: 6,
      radiusMinPixels: 10,
      radiusMaxPixels: 18,
      lineWidthMinPixels: 1,
      getPosition: (d: PatrolUnit) => d.position,
      getRadius: 130,
      getLineColor: [COLORS.patrolFill[0], COLORS.patrolFill[1], COLORS.patrolFill[2], 100],
      transitions: {
        getPosition: 1200,
      },
    });

    // 8. Scenario Visualization Layer — animated overlay for impacted cells
    const scenarioOverlayLayer = new PolygonLayer({
      id: "scenario-overlay-layer",
      data: scenarioDeltas || [],
      pickable: false,
      stroked: true,
      filled: false,
      wireframe: true,
      getPolygon: (d: any) => {
        const cell = gridCells.find(c => c.h3Index === d.h3Index);
        return cell ? cell.vertices : [];
      },
      getLineColor: (d: any) => {
        if (d.tdpiDelta < -0.1 || d.visibilityDelta < -0.1) {
          // Improvement (Cyan)
          return [34, 211, 238, 220] as [number, number, number, number];
        } else if (d.tdpiDelta > 0.1 || d.visibilityDelta > 0.1) {
          // Regression (Red)
          return [255, 59, 48, 220] as [number, number, number, number];
        } else {
          // Minor/Neutral (Blue)
          return [59, 130, 246, 180] as [number, number, number, number];
        }
      },
      getLineWidth: 6,
      lineWidthMinPixels: 3,
      transitions: {
        getLineColor: 300,
        getLineWidth: 300,
      },
      updateTriggers: {
        getLineColor: [scenarioDeltas],
      }
    });

    return [polygonLayer, hotspotGlowLayer, recommendationLayer, patrolCoverageLayer, assignmentLineLayer, patrolHaloLayer, patrolMarkersLayer, scenarioOverlayLayer];
  }, [gridCells, patrolUnits, mode, layer, selectedCellIndex, getCellFillColor, getCellLineColor, getCellLineWidth, getCellElevation, handleCellClick, handleHotspotClick, recommendedCellIndices, assignmentLines, scenarioDeltas, focusParam, pulseFactor]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: "16px" }}>
      {/* DeckGL WebGL Overlay Grid with interleaved Base GIS Tile Map */}
      {mounted && (
        <DeckGL
          viewState={viewState}
          onViewStateChange={(e: any) => setViewState(e.viewState)}
          controller={true}
          layers={layers}
          getCursor={({ isHovering }) => (isHovering ? "pointer" : "default")}
        >
          <Map
            id="digital-twin-map-canvas"
            mapLib={maplibregl as any}
            mapStyle={MAP_STYLE_URL}
          />
        </DeckGL>
      )}
    </div>
  );
});

export default DigitalTwinMap;
