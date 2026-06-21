import { useMemo } from "react";
import { 
  useDashboardSummary, 
  usePatrolRecommendations, 
  useCategorizedReports,
  useMapIntelligence
} from "@/hooks/useIntelligence";
import { 
  UnifiedSearchItem, 
  STATIC_COMMAND_ITEMS 
} from "@/config/command-registry";
import { TriangleAlert, Shield, MapPin, FileBarChart, BrainCircuit } from "lucide-react";

export function useCommandPaletteData(searchQuery: string) {
  // Use existing query caches. Will not trigger new fetches if data is fresh.
  const { data: dashboard } = useDashboardSummary("12:00");
  const { data: patrolRecs } = usePatrolRecommendations();
  const { data: reports } = useCategorizedReports();
  const { data: mapData } = useMapIntelligence("12:00", "observe");

  const allItems = useMemo(() => {
    const items: UnifiedSearchItem[] = [...STATIC_COMMAND_ITEMS];

    // Map Hotspots
    if (dashboard?.topHotspots) {
      dashboard.topHotspots.forEach((hs: any) => {
        items.push({
          id: `hotspot-${hs.h3Index}`,
          type: "hotspot",
          category: "Hotspots",
          title: hs.name || "Critical Hotspot",
          subtitle: `Traffic Density Pressure Index: ${hs.tdpi || 0}%`,
          description: `Visibility Gap: ${hs.visibilityGap || 0}% | Deployment Score: ${hs.deploymentScore?.toFixed(1) || 0}`,
          keywords: ["hotspot", "critical", "risk", "tdpi", hs.name, hs.h3Index],
          icon: TriangleAlert,
          badge: {
            text: hs.deploymentScore > 75 ? "Critical" : "High",
            variant: hs.deploymentScore > 75 ? "critical" : "warning",
          },
          route: `/hotspots?focus=${hs.h3Index}`,
          metadata: hs,
        });
      });
    }

    // Map H3 Grid Sectors
    if (mapData) {
      mapData.forEach((cell: any) => {
        items.push({
          id: `sector-${cell.h3Index}`,
          type: "sector",
          category: "H3 Sectors",
          title: cell.name || `Sector ${cell.h3Index}`,
          subtitle: `TDPI: ${cell.tdpi}%`,
          description: `Visibility Gap: ${cell.visibilityGap}%`,
          keywords: ["sector", "h3", "grid", "hexagon", cell.h3Index, cell.name],
          icon: MapPin,
          route: `/map?focus=${cell.h3Index}`,
          metadata: cell,
        });
      });
    }

    // Map Patrol Recommendations
    if (patrolRecs) {
      patrolRecs.forEach((rec: any) => {
        items.push({
          id: `patrol-${rec.h3_index}`,
          type: "patrol",
          category: "Patrol Recommendations",
          title: rec.neighborhood || `Sector ${rec.h3_index}`,
          subtitle: `Deployment Score: ${(rec.deployment_score * 100).toFixed(1)}`,
          description: `Forecast Demand | ${rec.recommended_action}`,
          keywords: ["patrol", "recommendation", "deployment", "squad", rec.h3_index, rec.neighborhood],
          icon: Shield,
          badge: {
            text: rec.priority_level,
            variant: rec.priority_level === "IMMEDIATE" ? "critical" : "info",
          },
          route: `/patrols?focus=${rec.h3_index}`,
          metadata: rec,
        });
      });
    }

    // Map Reports
    if (reports) {
      reports.forEach((report: any) => {
        items.push({
          id: `report-${report.id}`,
          type: "report",
          category: "Reports",
          title: report.title,
          subtitle: `Generated Today • ${report.category.charAt(0).toUpperCase() + report.category.slice(1)}`,
          description: report.summary,
          keywords: ["report", report.category, ...(report.tags || [])],
          icon: FileBarChart,
          route: `/reports?id=${report.id}`,
          metadata: report,
        });
      });
    }

    // AI Intelligence (Extract top insights from dashboard if available)
    if (dashboard?.cityTdpi !== undefined) {
      items.push({
        id: "ai-insight-tdpi",
        type: "ai",
        category: "AI Intelligence",
        title: "Citywide TDPI Average",
        subtitle: `${dashboard.cityTdpi.toFixed(1)}%`,
        description: "Aggregate risk pressure across the city.",
        keywords: ["ai", "insight", "tdpi", "average", "pressure", "risk"],
        icon: BrainCircuit,
        route: "/ai-intelligence",
      });
    }

    return items;
  }, [dashboard, patrolRecs, reports, mapData]);

  // Filter and Rank
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }
    const query = searchQuery.toLowerCase().trim();

    return allItems
      .map((item) => {
        let score = 0;
        const titleMatch = item.title.toLowerCase();
        const descMatch = item.description?.toLowerCase() || "";
        const subtitleMatch = item.subtitle?.toLowerCase() || "";
        const keywords = item.keywords.map((k) => k.toLowerCase());

        // 1. Exact Match
        if (titleMatch === query) score += 100;
        // 2. Starts With
        else if (titleMatch.startsWith(query)) score += 50;
        // 3. Contains
        else if (titleMatch.includes(query)) score += 30;

        // 4. Keyword Match
        if (keywords.some((k) => k === query)) score += 40;
        else if (keywords.some((k) => k.includes(query))) score += 20;

        // 5. Description Match
        if (descMatch.includes(query) || subtitleMatch.includes(query)) score += 10;

        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => {
        // Sort by score (desc), then by priority (desc)
        if (b.score !== a.score) return b.score - a.score;
        return (b.item.priority || 0) - (a.item.priority || 0);
      })
      .map((res) => res.item);
  }, [allItems, searchQuery]);

  return {
    allItems,
    filteredItems,
    isSearching: searchQuery.trim().length > 0
  };
}
