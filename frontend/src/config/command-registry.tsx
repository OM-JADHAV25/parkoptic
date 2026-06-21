import {
  LayoutDashboard,
  Map,
  Shield,
  Target,
  BrainCircuit,
  Settings,
  Activity,
  FileBarChart,
  TriangleAlert,
  Radar,
  GitBranch
} from "lucide-react";

export type SearchCategory = 
  | "Pages"
  | "Hotspots"
  | "Patrol Recommendations"
  | "H3 Sectors"
  | "Reports"
  | "AI Intelligence"
  | "System Pages";

export interface UnifiedSearchItem {
  id: string;
  type: string; // 'page', 'hotspot', 'patrol', 'sector', 'report', 'ai'
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  keywords: string[];
  icon: any; // Lucide icon
  badge?: {
    text: string;
    variant: "success" | "warning" | "critical" | "info" | "neutral";
  };
  priority?: number; // For ranking
  route: string;
  metadata?: any;
}

export const STATIC_COMMAND_ITEMS: UnifiedSearchItem[] = [
  {
    id: "page-dashboard",
    type: "page",
    category: "Pages",
    title: "Dashboard",
    subtitle: "Executive Operational Overview",
    description: "City-wide metrics and top-level intelligence.",
    keywords: ["dashboard", "home", "metrics", "overview", "executive", "kpi"],
    icon: LayoutDashboard,
    route: "/dashboard",
    priority: 100,
  },
  {
    id: "page-ai-intelligence",
    type: "page",
    category: "Pages",
    title: "AI Intelligence",
    subtitle: "Enterprise Observability",
    description: "Explainable AI metrics and provenance.",
    keywords: ["ai", "intelligence", "models", "metrics", "provenance", "explainability"],
    icon: BrainCircuit,
    route: "/ai-intelligence",
    priority: 95,
  },
  {
    id: "page-map",
    type: "page",
    category: "Pages",
    title: "City Operations Digital Twin Map",
    subtitle: "Live Geospatial Simulation",
    description: "Observe, predict, plan, and simulate operational deployments.",
    keywords: ["map", "digital twin", "live", "geospatial", "simulation", "plan", "observe"],
    icon: Map,
    route: "/map",
    priority: 90,
  },
  {
    id: "page-hotspots",
    type: "page",
    category: "Pages",
    title: "Hotspots",
    subtitle: "Active Operational Sectors",
    description: "High-risk zones requiring immediate attention.",
    keywords: ["hotspots", "risk", "critical", "zones", "tdpi", "congestion", "traffic"],
    icon: TriangleAlert,
    route: "/hotspots",
    priority: 85,
  },
  {
    id: "page-patrol-optimizer",
    type: "page",
    category: "Pages",
    title: "Patrol Optimizer",
    subtitle: "Smart Deployment Allocations",
    description: "AI-driven patrol recommendations.",
    keywords: ["patrol", "optimizer", "deployment", "squads", "allocation", "recommendations", "parking"],
    icon: Shield,
    route: "/patrols",
    priority: 80,
  },
  {
    id: "page-deployment-planning",
    type: "page",
    category: "Pages",
    title: "Deployment Planning",
    subtitle: "Scenario Configuration",
    description: "Configure and evaluate patrol deployments.",
    keywords: ["deployment", "planning", "scenario", "configuration", "evaluate"],
    icon: Target,
    route: "/deployment-planning",
    priority: 75,
  },
  {
    id: "page-scenario-planner",
    type: "page",
    category: "Pages",
    title: "Deployment Simulator",
    subtitle: "Impact Assessment",
    description: "Simulate and compare deployment strategies.",
    keywords: ["simulator", "simulation", "impact", "assessment", "compare", "strategy"],
    icon: Radar,
    route: "/scenario-planner",
    priority: 70,
  },
  {
    id: "page-reports",
    type: "page",
    category: "Pages",
    title: "Reports",
    subtitle: "Categorized Briefings",
    description: "Executive summaries and historical logs.",
    keywords: ["reports", "logs", "historical", "briefings", "executive"],
    icon: FileBarChart,
    route: "/reports",
    priority: 65,
  },
  {
    id: "page-explainability",
    type: "page",
    category: "Pages",
    title: "AI Explainability",
    subtitle: "Decision Traceability",
    description: "Deep dive into model reasoning and metrics.",
    keywords: ["explainability", "traceability", "reasoning", "model", "decision"],
    icon: GitBranch,
    route: "/explainability",
    priority: 60,
  },
  {
    id: "page-system-health",
    type: "system",
    category: "System Pages",
    title: "System Health",
    subtitle: "Infrastructure Status",
    description: "Monitor backend pipelines and services.",
    keywords: ["system", "health", "infrastructure", "status", "pipeline", "service"],
    icon: Activity,
    route: "/system-health",
    priority: 50,
  },
  {
    id: "page-settings",
    type: "system",
    category: "System Pages",
    title: "Settings",
    subtitle: "Platform Configuration",
    description: "Manage system preferences and configurations.",
    keywords: ["settings", "configuration", "preferences", "manage"],
    icon: Settings,
    route: "/settings",
    priority: 45,
  }
];
