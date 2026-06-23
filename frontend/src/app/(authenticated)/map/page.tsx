"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageWrapper } from "@/components/layout";
import { 
  useMapIntelligence, 
  usePatrolUnits, 
  useDashboardSummary, 
  useDigitalTwinState, 
  useSimulator,
  useDeploymentSimulation,
  usePatrolRecommendations,
  useSimulationData,
  DeploymentFeedback
} from "@/hooks/useIntelligence";
import { TIMELINE_HOURS } from "@/services/intelligence.service";
import { 
  TopOperationalHud, 
  LeftModesPanel, 
  RightIntelligencePanel, 
  ForecastTimelineSlider 
} from "@/components/map/MapControls";
import dynamic from "next/dynamic";
import { Maximize, Minimize } from "lucide-react";

const DigitalTwinMap = dynamic(() => import("@/components/map/DigitalTwinMap"), {
  ssr: false,
});
import "./map-layout.css";

function DigitalTwinPageInner() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [pendingDeploy, setPendingDeploy] = React.useState<{squadId: string, cellIndex: string} | null>(null);
  const {
    activeMode,
    setActiveMode,
    activeLayer,
    setActiveLayer,
    timelineHour,
    setTimelineHour,
    isPlaying,
    setIsPlaying,
    selectedCellIndex,
    setSelectedCellIndex,
    deploymentFeedback,
    showDeploymentFeedback,
    dismissDeploymentFeedback,
  } = useDigitalTwinState();

  const searchParams = useSearchParams();
  const cellParam = searchParams ? searchParams.get("cell") : null;
  const focusParam = searchParams ? searchParams.get("focus") : null;

  // Queries — mode-aware grid intelligence
  const { data: gridCells = [], isLoading: loadingGrid } = useMapIntelligence(timelineHour, activeMode);
  const { data: patrolUnits = [] } = usePatrolUnits();
  const { data: dashboardSummary } = useDashboardSummary(timelineHour);
  
  // Simulation assessment (comparative metrics) — always available for HUD and Simulate mode
  const { data: simulationResult } = useDeploymentSimulation(timelineHour);
  
  // Backend patrol recommendations
  const { data: patrolRecommendations = [] } = usePatrolRecommendations();

  // Sync URL search params
  useEffect(() => {
    if (cellParam) {
      setSelectedCellIndex(cellParam);
      setActiveMode("explain");
    } else if (focusParam && patrolUnits.length > 0) {
      const squad = patrolUnits.find(p => p.id === focusParam);
      if (squad && squad.assignedCell) {
        setSelectedCellIndex(squad.assignedCell);
        setActiveMode("explain");
      }
    }
  }, [cellParam, focusParam, patrolUnits, setSelectedCellIndex, setActiveMode]);

  // Determine if simulation is active (any patrol has an override)
  const isSimulationActive = React.useMemo(() => {
    return patrolUnits.some(p => p.assignedCell && p.status !== "off-duty");
  }, [patrolUnits]);

  // Mutation Simulator
  const { mutate: deployPatrol } = useSimulator(timelineHour);
  const { data: simData } = useSimulationData(timelineHour);

  // Calculate Scenario Deltas
  const scenarioDeltas = React.useMemo(() => {
    if (!isSimulationActive || !simData?.baseline || !simData?.simulated) return [];
    
    const deltas: any[] = [];
    const baselineMap = new Map(simData.baseline.map((c: any) => [c.h3_index, c]));
    
    simData.simulated.forEach((simCell: any) => {
      const baseCell: any = baselineMap.get(simCell.h3_index);
      if (baseCell) {
        const baseTdpi = baseCell.projected_tdpi ?? baseCell.tdpi_score ?? 0;
        const simTdpi = simCell.projected_tdpi ?? simCell.tdpi_score ?? 0;
        
        const baseVis = baseCell.visibility_gap_index ?? baseCell.visibility_gap?.visibility_gap_index ?? 0;
        const simVis = simCell.visibility_gap_index ?? simCell.visibility_gap?.visibility_gap_index ?? 0;
        
        const basePatrols = baseCell.recommended_patrol_units ?? 0;
        const simPatrols = simCell.recommended_patrol_units ?? 0;
        
        const baseViolations = baseCell.estimated_weekly_violations_addressed ?? 0;
        const simViolations = simCell.estimated_weekly_violations_addressed ?? 0;
        
        if (Math.abs(baseTdpi - simTdpi) > 0.01 || basePatrols !== simPatrols) {
          deltas.push({
            h3Index: simCell.h3_index,
            tdpiDelta: simTdpi - baseTdpi,
            visibilityDelta: simVis - baseVis,
            patrolDelta: simPatrols - basePatrols,
            violationsDelta: simViolations - baseViolations,
          });
        }
      }
    });
    return deltas;
  }, [isSimulationActive, simData]);

  const handleDeployPatrol = (squadId: string, cellIndex: string | null) => {
    if (cellIndex === null) {
      deployPatrol({ squadId, targetCellIndex: null });
      return;
    }
    const targetCell = gridCells.find(c => c.h3Index === cellIndex);
    const center = targetCell ? targetCell.center : undefined;
    deployPatrol({ squadId, targetCellIndex: cellIndex, center });
    setPendingDeploy({ squadId, cellIndex });
  };

  // Generate deployment feedback only after gridCells has updated with fresh simulation data
  const prevIsLoadingGrid = React.useRef(loadingGrid);
  useEffect(() => {
    // We check if loading just finished OR if the simulation data has already arrived (gridCells updated)
    if (pendingDeploy && prevIsLoadingGrid.current && !loadingGrid) {
      const squad = patrolUnits.find(p => p.id === pendingDeploy.squadId);
      const targetCell = gridCells.find(c => c.h3Index === pendingDeploy.cellIndex);
      
      const baselineCell = simData?.baseline?.find((c: any) => c.h3_index === pendingDeploy.cellIndex);
      const simulatedCell = simData?.simulated?.find((c: any) => c.h3_index === pendingDeploy.cellIndex);

      if (squad && targetCell) {
        const tdpiReduction = baselineCell && simulatedCell
          ? Math.round(Math.max(0, baselineCell.projected_tdpi - simulatedCell.projected_tdpi))
          : 0;
          
        const coverageGain = baselineCell && simulatedCell
          ? Math.round(Math.max(0, simulatedCell.coverage_score - baselineCell.coverage_score))
          : 0;

        const violations = simulatedCell 
          ? Math.round(simulatedCell.estimated_weekly_violations_addressed) 
          : 0;

        showDeploymentFeedback({
          squadName: squad.name,
          cellName: targetCell.name,
          expectedTdpiReduction: tdpiReduction,
          coverageGain,
          violationsAddressed: violations,
          confidence: Math.round(targetCell.forecastConfidence * 100),
          timestamp: Date.now(),
        });
        setPendingDeploy(null);
      }
    }
    prevIsLoadingGrid.current = loadingGrid;
  }, [loadingGrid, pendingDeploy, gridCells, patrolUnits, showDeploymentFeedback, simData]);

  const handleAutoAllocate = () => {
    // Auto-allocate patrols to top recommended cells
    const squads = patrolUnits.filter(p => p.status !== "off-duty");
    const topRecs = patrolRecommendations
      .sort((a: any, b: any) => (b.deployment_score || 0) - (a.deployment_score || 0))
      .slice(0, squads.length);
    
    topRecs.forEach((rec: any, idx: number) => {
      if (squads[idx] && rec.h3_index) {
        deployPatrol({ squadId: squads[idx].id, targetCellIndex: rec.h3_index });
      }
    });
  };

  const handleResetSimulation = () => {
    deployPatrol({ squadId: "squad-alpha", targetCellIndex: "89618924b93ffff" });
    deployPatrol({ squadId: "squad-beta", targetCellIndex: "89618921ab7ffff" });
    deployPatrol({ squadId: "squad-gamma", targetCellIndex: "89601458377ffff" });
    deployPatrol({ squadId: "squad-delta", targetCellIndex: "896189255b7ffff" });
  };

  const selectedCell = gridCells.find(c => c.h3Index === selectedCellIndex) || null;

  // Extract recommended H3 indices for map highlighting
  const recommendedCellIndices = React.useMemo(() => {
    if (activeMode !== "plan") return [];
    return patrolRecommendations
      .sort((a: any, b: any) => (b.deployment_score || 0) - (a.deployment_score || 0))
      .slice(0, 8)
      .map((r: any) => r.h3_index)
      .filter(Boolean);
  }, [patrolRecommendations, activeMode]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", margin: "-24px", position: "relative" }}>
      <div
        style={{
          position: isFullscreen ? "fixed" : "absolute",
          inset: 0,
          backgroundColor: "#070913",
          overflow: "hidden",
          zIndex: isFullscreen ? 9999 : 1,
        }}
      >
        {/* Real GIS Map Canvas Overlay (Always Mounted) */}
        <DigitalTwinMap
          mode={activeMode}
          layer={activeLayer}
          gridCells={gridCells}
          patrolUnits={patrolUnits}
          selectedCellIndex={selectedCellIndex}
          onSelectCell={setSelectedCellIndex}
          timelineHour={timelineHour}
          focusParam={focusParam}
          recommendedCellIndices={recommendedCellIndices}
          isSimulationActive={isSimulationActive}
          scenarioDeltas={scenarioDeltas}
        />

        {/* UI Overlay Layer (Responsive Grid) */}
        <div className={`map-ui-layer ${isFullscreen ? "map-ui-fullscreen" : ""}`}>
          
          {/* Top Row */}
          <div className="map-ui-top">
            <TopOperationalHud 
              summary={dashboardSummary} 
              isFullscreen={isFullscreen} 
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              simulationResult={simulationResult}
              isSimulationActive={isSimulationActive && (activeMode === "plan" || activeMode === "simulate")}
              activeMode={activeMode}
            />
          </div>

          {/* Left Column */}
          <div className="map-ui-left">
            <LeftModesPanel
              activeMode={activeMode}
              setActiveMode={setActiveMode}
              activeLayer={activeLayer}
              setActiveLayer={setActiveLayer}
              isFullscreen={isFullscreen}
            />
          </div>

          {/* Right Column */}
          <div className="map-ui-right">
            <RightIntelligencePanel
              activeMode={activeMode}
              selectedCell={selectedCell}
              patrolUnits={patrolUnits}
              onDeployPatrol={handleDeployPatrol}
              onResetSimulation={handleResetSimulation}
              simulationResult={simulationResult}
              isSimulationActive={isSimulationActive}
              patrolRecommendations={patrolRecommendations}
              onAutoAllocate={handleAutoAllocate}
              deploymentFeedback={deploymentFeedback}
              onDismissFeedback={dismissDeploymentFeedback}
              gridCells={gridCells}
              simData={simData}
              scenarioDeltas={scenarioDeltas}
            />
          </div>

          {/* Bottom Row */}
          <div className="map-ui-bottom">
            <ForecastTimelineSlider
              hours={TIMELINE_HOURS}
              activeHour={timelineHour}
              onChangeHour={setTimelineHour}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              activeMode={activeMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DigitalTwinPage() {
  return (
    <Suspense fallback={
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#070913", color: "var(--color-text-secondary)", margin: "-24px" }}>
          Loading GIS Engine...
        </div>
    }>
      <DigitalTwinPageInner />
    </Suspense>
  );
}
