export interface NavigationItem {
  route: string;
  title: string;
  description: string;
  iconName: string; // Used to map to Lucide icons dynamically
  shortcut?: string;
  badgeText?: string;
  notificationCount?: number;
}

export const navigationConfig: NavigationItem[] = [
  {
    route: "/dashboard",
    title: "Dashboard",
    description: "Monitor the city in real time",
    iconName: "LayoutDashboard",
    shortcut: "⌥D"
  },
  {
    route: "/ai-intelligence",
    title: "AI Intelligence",
    description: "AI-generated operational insights",
    iconName: "Sparkles",
    shortcut: "⌥I",
    badgeText: "AI Active"
  },
  {
    route: "/map",
    title: "Bengaluru Map",
    description: "Interactive surveillance grid",
    iconName: "Map",
    shortcut: "⌥M"
  },
  {
    route: "/hotspots",
    title: "Hotspots",
    description: "Critical congestion zones",
    iconName: "AlertTriangle",
    shortcut: "⌥H",
    notificationCount: 4
  },
  {
    route: "/patrols",
    title: "Patrol Optimizer",
    description: "Route optimization engines",
    iconName: "Shield",
    shortcut: "⌥P"
  },
  {
    route: "/deployment-planning",
    title: "Deployment Planning",
    description: "Test hypothetical policy models",
    iconName: "FileText",
    shortcut: "⌥S"
  },
  {
    route: "/reports",
    title: "Reports",
    description: "Review weekly violation logs",
    iconName: "BarChart3",
    shortcut: "⌥R"
  },
  {
    route: "/explainability",
    title: "AI Explainability",
    description: "Understand model predictions",
    iconName: "Eye",
    shortcut: "⌥E"
  },
  {
    route: "/system-health",
    title: "System Health",
    description: "Verify engine connections",
    iconName: "Activity",
    shortcut: "⌥Y"
  },
  {
    route: "/settings",
    title: "Settings",
    description: "Configure command defaults",
    iconName: "Settings",
    shortcut: "⌥,"
  }
];
