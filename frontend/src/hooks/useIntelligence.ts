"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  intelligenceService, 
  H3GridCell, 
  PatrolUnit, 
  DashboardSummary, 
  PipelineStage, 
  ActivityFeedItem, 
  CategorizedReport,
  SimulationResult,
  ServiceHealth
} from "@/services/intelligence.service";
import { apiClient } from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { 
  adaptHealthResponse, 
  adaptDashboardResponse, 
  adaptHotspotsList,
  adaptSimulationSummary,
  adaptActivityFeed,
  adaptCategorizedReports
} from "@/services/adapters";

// Hook to query the system health diagnostics
export function useSystemHealth() {
  return useQuery<ServiceHealth[], Error>({
    queryKey: ["systemHealth"],
    queryFn: async () => {
      const data = await apiClient.get<any>(API_ENDPOINTS.HEALTH);
      return adaptHealthResponse(data);
    },
    refetchInterval: 10000, // Sync health every 10s
  });
}

// Hook to query the consolidated dashboard summary
export function useDashboardSummary(hour: string) {
  return useQuery<any, Error, DashboardSummary>({
    queryKey: ["dashboardRaw"],
    queryFn: async () => {
      return await apiClient.get<any>(API_ENDPOINTS.DASHBOARD);
    },
    select: (data) => adaptDashboardResponse(data),
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

export function useSimulationData(hour: string) {
  return useQuery({
    queryKey: ["simulationData", hour],
    queryFn: async () => {
      // Get patrols without establishing a React dependency, avoiding refetches on patrol changes
      const patrols = await intelligenceService.getPatrolUnits();
      const allocations: Record<string, number> = {};
      if (patrols) {
        patrols.forEach(p => {
          if (p.assignedCell && p.status !== "off-duty") {
            allocations[p.assignedCell] = (allocations[p.assignedCell] || 0) + 1;
          }
        });
      }

      const numericHour = (hour && hour !== "Now" && hour.includes(":")) ? parseInt(hour.split(":")[0], 10) : null;
      const hourQuery = numericHour !== null ? `?hour=${numericHour}` : "";

      const data = await apiClient.post<any>(`${API_ENDPOINTS.SIMULATE}${hourQuery}`, { 
        allocations: Object.keys(allocations).length > 0 ? allocations : { "dummy": 0 } 
      });
      return data; // { baseline, simulated, summary }
    },
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}

// Hook to query the complete city grid cells intelligence (Hotspots list)
// Now mode-aware: Observe/Predict always show baseline unless a simulation override is active.
export function useMapIntelligence(hour: string, activeMode: OperationalMode = "observe") {
  const { data: patrols } = usePatrolUnits();
  const { data: simData, isLoading, isError, error, refetch } = useSimulationData(hour);
  
  const hasOverrides = patrols?.some(p => p.assignedCell && p.status !== "off-duty");
  const shouldSimulate = (activeMode === "plan" || activeMode === "simulate" || hasOverrides);

  const gridCells = useMemo(() => {
    if (!simData) return undefined;
    // PHASE 21 UPDATE: ALWAYS return baseline grid cells. The map's color scale represents the true Current Operational State.
    // The visual simulation layer will be handled separately via scenario overlays.
    return adaptHotspotsList(simData.baseline);
  }, [simData]);

  return { data: gridCells, isLoading, isError, error, refetch };
}

// Hook to query patrol squads status (uses local frontend state for active units)
export function usePatrolUnits() {
  return useQuery<PatrolUnit[], Error>({
    queryKey: ["patrolUnits"],
    queryFn: () => intelligenceService.getPatrolUnits(),
  });
}

// Hook to query algorithmic patrol recommendations from the backend
export function usePatrolRecommendations() {
  return useQuery<any[], Error>({
    queryKey: ["patrolRecommendations"],
    queryFn: async () => {
      const data = await apiClient.get<any[]>(API_ENDPOINTS.PATROL_RECOMMENDATIONS);
      return data;
    },
    staleTime: 60000,
  });
}

// Hook to query patrol summary statistics from the backend
export function usePatrolSummary() {
  return useQuery<any, Error>({
    queryKey: ["patrolSummary"],
    queryFn: async () => {
      const data = await apiClient.get<any>("/api/v1/patrol/summary");
      return data;
    },
    staleTime: 60000,
  });
}

// Hook to query validation model statistics from the backend
export function useValidationStats() {
  return useQuery<any, Error>({
    queryKey: ["validationStats"],
    queryFn: async () => {
      const data = await apiClient.get<any>("/api/v1/validation/stats");
      return data;
    },
  });
}

// Hook to query the categorized reports
export function useCategorizedReports(category?: "executive" | "forecast" | "patrol" | "impact") {
  const queryClient = useQueryClient();
  return useQuery<any[], Error>({
    queryKey: ["categorizedReports", category],
    queryFn: async () => {
      // Fetch all required backend summaries concurrently
      const [dashRes, forecastRes, patrolRes, deployRes] = await Promise.all([
        queryClient.fetchQuery({ queryKey: ["dashboardRaw"], queryFn: () => apiClient.get<any>(API_ENDPOINTS.DASHBOARD), staleTime: 10000 }),
        apiClient.get<any>("/api/v1/forecast/summary"),
        apiClient.get<any>("/api/v1/patrol/summary"),
        apiClient.get<any>("/api/v1/deployment/summary")
      ]);
      return adaptCategorizedReports(category, dashRes, forecastRes, patrolRes, deployRes);
    },
    staleTime: 60000,
  });
}

// Hook to fetch recent system activity feed
export function useActivityFeed() {
  return useQuery<any, Error, any[]>({
    queryKey: ["dashboardRaw"],
    queryFn: async () => {
      return await apiClient.get<any>(API_ENDPOINTS.DASHBOARD);
    },
    select: (data) => adaptActivityFeed(data),
    staleTime: 10000,
  });
}

// Hook to query Deployment Impact Assessment comparative simulation results
export function useDeploymentSimulation(hour: string) {
  const { data: simData, isLoading } = useSimulationData(hour);

  const simulationResult = useMemo(() => {
    if (!simData) return undefined;
    return adaptSimulationSummary(simData);
  }, [simData]);

  return { data: simulationResult, isLoading };
}

// Global hook to manage play states, timeline sliders, selected cells and active GIS layers
export type OperationalMode = "observe" | "predict" | "plan" | "simulate" | "explain";
export type MapLayer = "tdpi" | "visibility" | "risk" | "none";

// Deployment feedback state
export interface DeploymentFeedback {
  squadName: string;
  cellName: string;
  expectedTdpiReduction: number;
  coverageGain: number;
  violationsAddressed: number;
  confidence: number;
  timestamp: number;
}

export function useDigitalTwinState() {
  const [activeMode, setActiveMode] = useState<OperationalMode>("observe");
  const [activeLayer, setActiveLayer] = useState<MapLayer>("tdpi");
  const [timelineHour, setTimelineHour] = useState<string>("12:00");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedCellIndex, setSelectedCellIndex] = useState<string | null>(null);
  const [deploymentFeedback, setDeploymentFeedback] = useState<DeploymentFeedback | null>(null);

  // Sync mode with layer mapping
  useEffect(() => {
    if (activeMode === "observe") {
      if (activeLayer !== "tdpi" && activeLayer !== "visibility") {
        setActiveLayer("tdpi");
      }
    } else if (activeMode === "predict") {
      setActiveLayer("risk");
    } else if (activeMode === "simulate" || activeMode === "plan") {
      setActiveLayer("tdpi");
    } else if (activeMode === "explain") {
      setSelectedCellIndex(prev => prev || "89618924b93ffff");
    }
  }, [activeMode, activeLayer]);

  // Auto-dismiss deployment feedback after 5s
  useEffect(() => {
    if (!deploymentFeedback) return;
    const timer = setTimeout(() => setDeploymentFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [deploymentFeedback]);

  const showDeploymentFeedback = useCallback((feedback: DeploymentFeedback) => {
    setDeploymentFeedback(feedback);
  }, []);

  const dismissDeploymentFeedback = useCallback(() => {
    setDeploymentFeedback(null);
  }, []);

  return {
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
  };
}

// Simulation dispatch mutation hook
export function useSimulator(hour: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ squadId, targetCellIndex, center }: { squadId: string; targetCellIndex: string | null; center?: [number, number] }) => {
      // 1. Update local frontend state of patrol squads first
      const { patrolUnits } = intelligenceService.simulatePatrolChange(squadId, targetCellIndex, center);
      
      // 2. Build deployment allocations
      const allocations: Record<string, number> = {};
      patrolUnits.forEach(p => {
        if (p.assignedCell && p.status !== "off-duty") {
          allocations[p.assignedCell] = (allocations[p.assignedCell] || 0) + 1;
        }
      });

      // 3. Immediately fetch the updated operational metrics from the backend
      const numericHour = (hour && hour !== "Now" && hour.includes(":")) ? parseInt(hour.split(":")[0], 10) : null;
      const hourQuery = numericHour !== null ? `?hour=${numericHour}` : "";

      const simulationPayload = await apiClient.post<any>(`${API_ENDPOINTS.SIMULATE}${hourQuery}`, { 
        allocations: Object.keys(allocations).length > 0 ? allocations : { "dummy": 0 } 
      });

      return { patrolUnits, simulationPayload };
    },
    onSuccess: ({ patrolUnits, simulationPayload }) => {
      // 4. Synchronize immediately! Inject payload straight into caches for a 0ms perceived update latency.
      queryClient.setQueryData(["patrolUnits"], patrolUnits);
      queryClient.setQueryData(["simulationData", hour], simulationPayload);
      
      // 5. Trigger optional background validation to ensure remaining elements are perfectly aligned
      queryClient.invalidateQueries({ queryKey: ["patrolUnits"] });
      queryClient.invalidateQueries({ queryKey: ["simulationData", hour] });
      queryClient.invalidateQueries({ queryKey: ["dashboardSummary", hour] });
    }
  });
}
