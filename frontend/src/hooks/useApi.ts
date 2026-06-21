"use client";

import { useQuery } from "@tanstack/react-query";
import { apiService, Violation, PatrolSquad, Hotspot } from "../services/api";

export function useViolations() {
  return useQuery<Violation[], Error>({
    queryKey: ["violations"],
    queryFn: apiService.getViolations,
    refetchInterval: 15000, // Refetch every 15 seconds to simulate real-time updates
  });
}

export function usePatrolSquads() {
  return useQuery<PatrolSquad[], Error>({
    queryKey: ["patrolSquads"],
    queryFn: apiService.getPatrolSquads,
  });
}

export function useHotspots() {
  return useQuery<Hotspot[], Error>({
    queryKey: ["hotspots"],
    queryFn: apiService.getHotspots,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
