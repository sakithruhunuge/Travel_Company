/**
 * Sri Lanka Distance Matrix & Route Planner
 * 
 * Provides accurate road distances, estimated driving times, and route breakdown
 * between all key travel destinations across Sri Lanka for driver dispatches and trip briefs.
 */

// Geographic coordinates for Sri Lanka destinations
export interface DestinationCoord {
  name: string;
  lat: number;
  lng: number;
  region: "West Coast" | "Central Highlands" | "Cultural Triangle" | "South Coast" | "East Coast" | "Northern" | "Wilderness";
}

export const SRI_LANKA_DESTINATIONS: Record<string, DestinationCoord> = {
  Colombo: { name: "Colombo", lat: 6.9271, lng: 79.8612, region: "West Coast" },
  Negombo: { name: "Negombo", lat: 7.2008, lng: 79.8737, region: "West Coast" },
  Kandy: { name: "Kandy", lat: 7.2906, lng: 80.6337, region: "Central Highlands" },
  Sigiriya: { name: "Sigiriya", lat: 7.9570, lng: 80.7603, region: "Cultural Triangle" },
  Dambulla: { name: "Dambulla", lat: 7.8731, lng: 80.6517, region: "Cultural Triangle" },
  "Nuwara Eliya": { name: "Nuwara Eliya", lat: 6.9497, lng: 80.7891, region: "Central Highlands" },
  Ella: { name: "Ella", lat: 6.8667, lng: 81.0466, region: "Central Highlands" },
  Galle: { name: "Galle", lat: 6.0535, lng: 80.2210, region: "South Coast" },
  Bentota: { name: "Bentota", lat: 6.4259, lng: 79.9958, region: "South Coast" },
  Mirissa: { name: "Mirissa", lat: 5.9483, lng: 80.4578, region: "South Coast" },
  Weligama: { name: "Weligama", lat: 5.9736, lng: 80.4289, region: "South Coast" },
  Hikkaduwa: { name: "Hikkaduwa", lat: 6.1395, lng: 80.1063, region: "South Coast" },
  Unawatuna: { name: "Unawatuna", lat: 6.0104, lng: 80.2486, region: "South Coast" },
  Tangalle: { name: "Tangalle", lat: 6.0243, lng: 80.7941, region: "South Coast" },
  Yala: { name: "Yala", lat: 6.3687, lng: 81.4725, region: "Wilderness" },
  Udawalawe: { name: "Udawalawe", lat: 6.4746, lng: 80.8987, region: "Wilderness" },
  Anuradhapura: { name: "Anuradhapura", lat: 8.3114, lng: 80.4037, region: "Cultural Triangle" },
  Polonnaruwa: { name: "Polonnaruwa", lat: 7.9403, lng: 81.0188, region: "Cultural Triangle" },
  Trincomalee: { name: "Trincomalee", lat: 8.5874, lng: 81.2152, region: "East Coast" },
  Pasikuda: { name: "Pasikuda", lat: 7.9250, lng: 81.5644, region: "East Coast" },
  "Arugam Bay": { name: "Arugam Bay", lat: 6.8415, lng: 81.8340, region: "East Coast" },
  Jaffna: { name: "Jaffna", lat: 9.6615, lng: 80.0255, region: "Northern" },
  Wilpattu: { name: "Wilpattu", lat: 8.4550, lng: 80.0450, region: "Wilderness" },
  Pinnawala: { name: "Pinnawala", lat: 7.3000, lng: 80.3800, region: "Central Highlands" },
  "Horton Plains": { name: "Horton Plains", lat: 6.8028, lng: 80.8044, region: "Central Highlands" },
  Kitulgala: { name: "Kitulgala", lat: 6.9934, lng: 80.4144, region: "Central Highlands" },
  Sinharaja: { name: "Sinharaja", lat: 6.4167, lng: 80.4667, region: "Wilderness" },
  Kalpitiya: { name: "Kalpitiya", lat: 8.2325, lng: 79.7645, region: "West Coast" },
  Matara: { name: "Matara", lat: 5.9549, lng: 80.5550, region: "South Coast" },
  Hambantota: { name: "Hambantota", lat: 6.1246, lng: 81.1185, region: "South Coast" },
  Badulla: { name: "Badulla", lat: 6.9934, lng: 81.0550, region: "Central Highlands" },
  Ratnapura: { name: "Ratnapura", lat: 6.6828, lng: 80.3992, region: "Central Highlands" },
};

// Direct Sri Lanka Road Distance lookup (in km) between major destination pairs
const DIRECT_ROAD_DISTANCES: Record<string, Record<string, number>> = {
  Colombo: {
    Negombo: 35,
    Kandy: 115,
    Sigiriya: 175,
    Dambulla: 148,
    "Nuwara Eliya": 170,
    Galle: 119, // via Southern Expressway
    Bentota: 65,
    Mirissa: 150,
    Weligama: 145,
    Hikkaduwa: 98,
    Unawatuna: 125,
    Tangalle: 195,
    Ella: 205,
    Yala: 260,
    Udawalawe: 165,
    Anuradhapura: 205,
    Polonnaruwa: 215,
    Trincomalee: 260,
    "Arugam Bay": 320,
    Jaffna: 395,
    Wilpattu: 180,
    Pinnawala: 85,
    Kitulgala: 90,
  },
  Negombo: {
    Kandy: 105,
    Sigiriya: 145,
    Dambulla: 130,
    "Nuwara Eliya": 165,
    Galle: 145,
    Bentota: 100,
    Anuradhapura: 175,
    Wilpattu: 150,
  },
  Kandy: {
    Sigiriya: 90,
    Dambulla: 72,
    "Nuwara Eliya": 75,
    Ella: 135,
    Galle: 220,
    Bentota: 175,
    Mirissa: 235,
    Yala: 215,
    Udawalawe: 180,
    Anuradhapura: 138,
    Polonnaruwa: 135,
    Trincomalee: 180,
    "Arugam Bay": 215,
    Pinnawala: 40,
    "Horton Plains": 105,
    Kitulgala: 65,
  },
  Sigiriya: {
    Dambulla: 20,
    Polonnaruwa: 55,
    Anuradhapura: 75,
    Trincomalee: 100,
    "Nuwara Eliya": 160,
    Ella: 210,
    Galle: 295,
    Yala: 270,
    Pasikuda: 125,
  },
  Dambulla: {
    Polonnaruwa: 68,
    Anuradhapura: 65,
    Trincomalee: 105,
    "Nuwara Eliya": 150,
    Ella: 195,
  },
  "Nuwara Eliya": {
    Ella: 55,
    Yala: 170,
    Udawalawe: 140,
    Galle: 230,
    Mirissa: 215,
    Bentota: 205,
    "Horton Plains": 32,
    Badulla: 55,
  },
  Ella: {
    Yala: 88,
    Udawalawe: 95,
    Mirissa: 145,
    Galle: 175,
    Bentota: 210,
    "Arugam Bay": 135,
    Tangalle: 125,
    Badulla: 25,
  },
  Galle: {
    Bentota: 55,
    Hikkaduwa: 20,
    Unawatuna: 6,
    Weligama: 28,
    Mirissa: 35,
    Tangalle: 75,
    Yala: 155,
    Udawalawe: 130,
    Sinharaja: 85,
  },
  Bentota: {
    Hikkaduwa: 35,
    Mirissa: 90,
    Tangalle: 130,
    Yala: 210,
  },
  Mirissa: {
    Weligama: 8,
    Tangalle: 48,
    Yala: 125,
    Udawalawe: 115,
  },
  Tangalle: {
    Yala: 85,
    Udawalawe: 75,
    Hambantota: 45,
  },
  Yala: {
    Udawalawe: 90,
    "Arugam Bay": 125,
    Hambantota: 40,
  },
  Anuradhapura: {
    Polonnaruwa: 100,
    Trincomalee: 110,
    Jaffna: 195,
    Wilpattu: 45,
  },
  Polonnaruwa: {
    Trincomalee: 115,
    Pasikuda: 70,
  },
  Trincomalee: {
    Pasikuda: 110,
  },
  Pasikuda: {
    "Arugam Bay": 140,
  },
};

/**
 * Normalizes user/system destination strings to canonical Sri Lanka destinations.
 * e.g., "Temple of the Tooth, Kandy" -> "Kandy"
 * "Ella Nine Arch Bridge" -> "Ella"
 * "Mirissa Beach" -> "Mirissa"
 */
export function normalizeDestinationName(rawName: string): string {
  if (!rawName) return "";
  const cleaned = rawName.trim();

  // Direct match check
  for (const canonical of Object.keys(SRI_LANKA_DESTINATIONS)) {
    if (canonical.toLowerCase() === cleaned.toLowerCase()) {
      return canonical;
    }
  }

  // Substring match check
  for (const canonical of Object.keys(SRI_LANKA_DESTINATIONS)) {
    const regex = new RegExp(`\\b${canonical}\\b`, "i");
    if (regex.test(cleaned)) {
      return canonical;
    }
  }

  // Common aliases
  const lower = cleaned.toLowerCase();
  if (lower.includes("airport") || lower.includes("katunayake") || lower.includes("bia")) return "Negombo";
  if (lower.includes("nine arch") || lower.includes("little adam")) return "Ella";
  if (lower.includes("tooth") || lower.includes("peradeniya") || lower.includes("kandy lake")) return "Kandy";
  if (lower.includes("lion rock") || lower.includes("pidurangala")) return "Sigiriya";
  if (lower.includes("cave temple") || lower.includes("golden temple")) return "Dambulla";
  if (lower.includes("tea factory") || lower.includes("gregory lake") || lower.includes("little england")) return "Nuwara Eliya";
  if (lower.includes("whale") || lower.includes("coconut tree")) return "Mirissa";
  if (lower.includes("fort") || lower.includes("light house") || lower.includes("lighthouse")) return "Galle";
  if (lower.includes("safari") || lower.includes("leopard")) return "Yala";
  if (lower.includes("elephant transit") || lower.includes("elephant safari")) return "Udawalawe";
  if (lower.includes("surfing") || lower.includes("arugambay")) return "Arugam Bay";

  return cleaned;
}

/**
 * Calculates Great-Circle distance using Haversine formula
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Gets the road distance between two destinations.
 * Uses exact road lookup when available, or haversine * winding multiplier fallback.
 */
export function getDistanceBetween(
  fromRaw: string,
  toRaw: string
): { distanceKm: number; estimatedMinutes: number; routeNote: string } {
  const from = normalizeDestinationName(fromRaw);
  const to = normalizeDestinationName(toRaw);

  if (from.toLowerCase() === to.toLowerCase()) {
    return { distanceKm: 15, estimatedMinutes: 30, routeNote: "Local City Transfer" };
  }

  // Check direct road matrix (symmetric)
  let directKm = DIRECT_ROAD_DISTANCES[from]?.[to] || DIRECT_ROAD_DISTANCES[to]?.[from];

  if (!directKm) {
    const c1 = SRI_LANKA_DESTINATIONS[from];
    const c2 = SRI_LANKA_DESTINATIONS[to];

    if (c1 && c2) {
      // Sri Lanka road network has a winding factor of ~1.35 to 1.45 due to terrain
      const isHillCountry =
        c1.region === "Central Highlands" || c2.region === "Central Highlands";
      const windingFactor = isHillCountry ? 1.45 : 1.35;
      const straightLine = haversineDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng);
      directKm = Math.round(straightLine * windingFactor);
    } else {
      directKm = 85; // safe fallback average
    }
  }

  // Calculate estimated drive time based on terrain and speed limits
  const cFrom = SRI_LANKA_DESTINATIONS[from];
  const cTo = SRI_LANKA_DESTINATIONS[to];
  const isHighland =
    cFrom?.region === "Central Highlands" || cTo?.region === "Central Highlands";
  const isExpressway =
    (from === "Colombo" && (to === "Galle" || to === "Mirissa" || to === "Bentota" || to === "Tangalle")) ||
    (to === "Colombo" && (from === "Galle" || from === "Mirissa" || from === "Bentota" || from === "Tangalle"));

  let avgSpeedKmh = 45; // Default Sri Lanka main A-road speed
  let routeNote = "Standard National Highway";

  if (isExpressway) {
    avgSpeedKmh = 75;
    routeNote = "Southern Expressway Route";
  } else if (isHighland) {
    avgSpeedKmh = 34; // Mountainous winding roads
    routeNote = "Mountainous & Winding Hill Country Route";
  }

  const estimatedMinutes = Math.round((directKm / avgSpeedKmh) * 60);

  return {
    distanceKm: directKm,
    estimatedMinutes,
    routeNote,
  };
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export interface RouteSegment {
  step: number;
  from: string;
  to: string;
  distanceKm: number;
  driveTimeFormatted: string;
  estimatedMinutes: number;
  routeNote: string;
}

export interface RoutePlan {
  origin: string;
  destinationStops: string[]; // places the driver must visit
  segments: RouteSegment[];
  totalDistanceKm: number;
  totalDriveTimeFormatted: string;
  totalMinutes: number;
}

/**
 * Takes raw destination inputs (array or comma-separated string) and builds a full
 * ordered route itinerary with predicted driving distances and times for the driver.
 */
export function buildDriverRoutePlan(
  rawDestinations: string[] | string | undefined,
  defaultOrigin: string = "Colombo"
): RoutePlan {
  let stopList: string[] = [];

  if (Array.isArray(rawDestinations)) {
    stopList = rawDestinations.map((s) => s.trim()).filter(Boolean);
  } else if (typeof rawDestinations === "string" && rawDestinations.trim().length > 0) {
    stopList = rawDestinations
      .split(/[,;\n\r|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Normalize stops
  const normalizedStops = stopList.map(normalizeDestinationName).filter(Boolean);

  // If no destinations are provided, provide default itinerary
  if (normalizedStops.length === 0) {
    return {
      origin: defaultOrigin,
      destinationStops: ["Tour Route As Directed by Customer"],
      segments: [],
      totalDistanceKm: 0,
      totalDriveTimeFormatted: "TBD",
      totalMinutes: 0,
    };
  }

  // Construct route sequence
  // If the first stop is not Colombo/Negombo and defaultOrigin is not already in the list,
  // we treat defaultOrigin as the pickup/dispatch origin.
  const routePoints: string[] = [];
  const firstStop = normalizedStops[0].toLowerCase();
  const startsAtOrigin = firstStop === "colombo" || firstStop === "negombo";

  if (!startsAtOrigin) {
    routePoints.push(`${defaultOrigin} (Pickup)`);
  }

  for (const stop of normalizedStops) {
    // Avoid immediate duplicate stops
    if (routePoints.length === 0 || routePoints[routePoints.length - 1].toLowerCase() !== stop.toLowerCase()) {
      routePoints.push(stop);
    }
  }

  // Build segments
  const segments: RouteSegment[] = [];
  let totalDistanceKm = 0;
  let totalMinutes = 0;

  for (let i = 0; i < routePoints.length - 1; i++) {
    const from = routePoints[i];
    const to = routePoints[i + 1];
    const { distanceKm, estimatedMinutes, routeNote } = getDistanceBetween(from, to);

    totalDistanceKm += distanceKm;
    totalMinutes += estimatedMinutes;

    segments.push({
      step: i + 1,
      from,
      to,
      distanceKm,
      driveTimeFormatted: formatMinutes(estimatedMinutes),
      estimatedMinutes,
      routeNote,
    });
  }

  return {
    origin: routePoints[0] || defaultOrigin,
    destinationStops: normalizedStops,
    segments,
    totalDistanceKm,
    totalDriveTimeFormatted: formatMinutes(totalMinutes),
    totalMinutes,
  };
}
