/**
 * Universal Google Maps Directions URL Generator
 * 
 * Generates turn-by-turn navigation and full journey overview URLs for drivers.
 * Uses the official Google Maps Universal Cross-Platform URL scheme:
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */

export interface LocationPoint {
  name: string;
  lat?: number;
  lng?: number;
}

/**
 * Formats a location point for Google Maps URL parameters.
 * Prefers "lat,lng" if valid coordinates are present, otherwise uses encoded name.
 */
function formatLocationParam(point: string | LocationPoint): string {
  if (typeof point === "string") {
    // If it's a known city or label in Sri Lanka, append Sri Lanka for accurate resolution
    const trimmed = point.replace(/\s*\(.*?\)\s*/g, "").trim();
    if (!trimmed.toLowerCase().includes("sri lanka")) {
      return `${trimmed}, Sri Lanka`;
    }
    return trimmed;
  }

  if (point.lat !== undefined && point.lng !== undefined && !isNaN(point.lat) && !isNaN(point.lng)) {
    return `${point.lat},${point.lng}`;
  }

  const nameTrimmed = (point.name || "").replace(/\s*\(.*?\)\s*/g, "").trim();
  if (!nameTrimmed.toLowerCase().includes("sri lanka")) {
    return `${nameTrimmed}, Sri Lanka`;
  }
  return nameTrimmed;
}

/**
 * Builds a Google Maps Directions URL for the complete multi-stop travel journey.
 * 
 * @param stops Ordered list of destination stops requested by the guest.
 *              The first stop is treated as Origin, the last as Final Destination,
 *              and any intermediate stops as Waypoints.
 * @returns Complete Google Maps navigation URL
 */
export function generateGoogleMapsRouteUrl(stops: (string | LocationPoint)[]): string {
  if (!stops || stops.length === 0) {
    return "https://www.google.com/maps";
  }

  if (stops.length === 1) {
    const singleLoc = formatLocationParam(stops[0]);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(singleLoc)}`;
  }

  const origin = formatLocationParam(stops[0]);
  const destination = formatLocationParam(stops[stops.length - 1]);

  const baseUrl = "https://www.google.com/maps/dir/?api=1";
  const params = new URLSearchParams();
  params.set("origin", origin);
  params.set("destination", destination);
  params.set("travelmode", "driving");
  params.set("dir_action", "navigate");

  // Intermediate waypoints
  if (stops.length > 2) {
    const waypoints = stops
      .slice(1, stops.length - 1)
      .map(formatLocationParam)
      .join("|");
    params.set("waypoints", waypoints);
  }

  return `${baseUrl}&${params.toString()}`;
}

/**
 * Generates a direct Google Maps Directions URL for an individual leg of the journey.
 */
export function generateGoogleMapsLegUrl(from: string | LocationPoint, to: string | LocationPoint): string {
  const origin = formatLocationParam(from);
  const destination = formatLocationParam(to);

  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("origin", origin);
  params.set("destination", destination);
  params.set("travelmode", "driving");
  params.set("dir_action", "navigate");

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
