// Mock API Service Layer for ParkOptic

export interface Violation {
  id: string;
  location: string;
  category: "Double Parking" | "Obstructive Parking" | "No Parking Zone" | "Sidewalk Encroachment";
  severity: "low" | "warning" | "critical";
  timestamp: string;
  vehicleNo: string;
}

export interface PatrolSquad {
  id: string;
  name: string;
  zone: string;
  status: "active" | "patrolling" | "dispatched" | "off-duty";
  officerCount: number;
}

export interface Hotspot {
  id: string;
  location: string;
  congestionIndex: number; // 0 to 100
  activeViolationsCount: number;
  status: "normal" | "warning" | "critical";
}

// Simulate latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiService = {
  async getViolations(): Promise<Violation[]> {
    await delay(1200); // Simulated API latency
    return [
      {
        id: "viol-1",
        location: "Brigade Road Intersection",
        category: "Double Parking",
        severity: "critical",
        timestamp: "2 mins ago",
        vehicleNo: "KA-01-MJ-4021"
      },
      {
        id: "viol-2",
        location: "MG Road near Metro Station",
        category: "Obstructive Parking",
        severity: "warning",
        timestamp: "10 mins ago",
        vehicleNo: "KA-03-TR-9182"
      },
      {
        id: "viol-3",
        location: "Commercial Street",
        category: "Sidewalk Encroachment",
        severity: "critical",
        timestamp: "15 mins ago",
        vehicleNo: "KA-05-EX-3381"
      },
      {
        id: "viol-4",
        location: "Indiranagar 100ft Road",
        category: "No Parking Zone",
        severity: "low",
        timestamp: "32 mins ago",
        vehicleNo: "KA-51-AA-0988"
      }
    ];
  },

  async getPatrolSquads(): Promise<PatrolSquad[]> {
    await delay(800);
    return [
      { id: "patrol-1", name: "Squad Alpha", zone: "Brigade Rd", status: "dispatched", officerCount: 3 },
      { id: "patrol-2", name: "Squad Beta", zone: "Indiranagar Z1", status: "patrolling", officerCount: 2 },
      { id: "patrol-3", name: "Squad Gamma", zone: "Commercial St", status: "active", officerCount: 4 },
      { id: "patrol-4", name: "Squad Delta", zone: "MG Road", status: "off-duty", officerCount: 2 }
    ];
  },

  async getHotspots(): Promise<Hotspot[]> {
    await delay(1000);
    return [
      { id: "hot-1", location: "Brigade Road Junction", congestionIndex: 88, activeViolationsCount: 14, status: "critical" },
      { id: "hot-2", location: "MG Road Metro Station", congestionIndex: 72, activeViolationsCount: 8, status: "warning" },
      { id: "hot-3", location: "Commercial Street Corridor", congestionIndex: 91, activeViolationsCount: 19, status: "critical" },
      { id: "hot-4", location: "Indiranagar 100ft Road", congestionIndex: 45, activeViolationsCount: 3, status: "normal" }
    ];
  }
};
