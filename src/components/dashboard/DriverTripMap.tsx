"use client";

import React, { useEffect, useRef, useState } from "react";
import type LType from "leaflet";
import {
  CompassOutlined,
  CarOutlined,
  ArrowRightOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  LOCATIONS,
  MapLocation,
  fetchRealRoadRoute,
  RealRoadLegResult,
} from "@/components/InteractiveTourCustomizer";
import {
  RoutePlan,
  SRI_LANKA_DESTINATIONS,
  getDistanceBetween,
  formatMinutes,
} from "@/lib/distanceMatrix";
import {
  generateGoogleMapsRouteUrl,
  generateGoogleMapsLegUrl,
} from "@/lib/googleMapsUrl";
import { getTourGuideDestination } from "@/constants/tourGuideDestinations";

interface DriverTripMapProps {
  tourId: string;
  tourName: string;
  destinations: string[];
  routePlan?: RoutePlan;
  className?: string;
  defaultExpanded?: boolean;
  primaryColor?: string;
}

export default function DriverTripMap({
  tourId,
  tourName,
  destinations = [],
  routePlan,
  className = "",
  defaultExpanded = true,
  primaryColor = "#0B7C8A",
}: DriverTripMapProps) {
  const mapContainerId = `driver-map-${tourId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const mapRef = useRef<LType.Map | null>(null);
  const leafletLibRef = useRef<typeof LType | null>(null);
  const polylineRef = useRef<LType.Polyline | null>(null);
  const markersRef = useRef<LType.Marker[]>([]);
  const segmentBadgesRef = useRef<LType.Marker[]>([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [realLegs, setRealLegs] = useState<RealRoadLegResult[]>([]);
  const [loadingRoads, setLoadingRoads] = useState(false);
  const [selectedLegIdx, setSelectedLegIdx] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedLink, setCopiedLink] = useState(false);

  // Normalize stops to MapLocation objects enriched with Tour Guide Destination knowledge
  const stopLocations = React.useMemo<MapLocation[]>(() => {
    return destinations
      .map((name, idx) => {
        const cleanName = name.replace(/\s*\(.*?\)\s*/g, "").trim();
        const guideInfo = getTourGuideDestination(cleanName);

        // 1. Try exact match in LOCATIONS
        const found = LOCATIONS.find(
          (loc) => loc.name.toLowerCase() === cleanName.toLowerCase() || loc.id.toLowerCase() === cleanName.toLowerCase()
        );
        if (found) {
          return {
            ...found,
            description: guideInfo.briefDescription || found.description,
            img: guideInfo.image || found.img,
          };
        }

        // 2. Try match in SRI_LANKA_DESTINATIONS
        const destCoord = SRI_LANKA_DESTINATIONS[cleanName] || SRI_LANKA_DESTINATIONS[name];
        if (destCoord) {
          return {
            id: `dest-${idx}-${cleanName}`,
            name: destCoord.name,
            lat: destCoord.lat,
            lng: destCoord.lng,
            img: guideInfo.image || "/images/colombo.png",
            description: guideInfo.briefDescription || `${destCoord.region} Destination`,
            category: "urban",
          } as MapLocation;
        }

        // 3. Fallback to Colombo with slight offset
        return {
          id: `dest-${idx}-${cleanName}`,
          name: cleanName,
          lat: 6.9271 + (idx * 0.1),
          lng: 79.8612 + (idx * 0.1),
          img: guideInfo.image || "/images/colombo.png",
          description: guideInfo.briefDescription || "Tour Itinerary Stop",
          category: "urban",
        } as MapLocation;
      })
      .filter(Boolean);
  }, [destinations]);

  // Google Maps Full Route URL
  const googleMapsRouteUrl = React.useMemo(() => {
    if (stopLocations.length === 0) return "https://www.google.com/maps";
    return generateGoogleMapsRouteUrl(
      stopLocations.map((loc) => ({
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
      }))
    );
  }, [stopLocations]);

  // Calculate totals from real legs or fallback routePlan
  const totalKm = React.useMemo(() => {
    if (realLegs.length > 0 && realLegs.length === stopLocations.length - 1) {
      return Math.round(realLegs.reduce((sum, leg) => sum + leg.distanceKm, 0) * 10) / 10;
    }
    return routePlan?.totalDistanceKm || 0;
  }, [realLegs, stopLocations.length, routePlan]);

  const totalDriveTime = React.useMemo(() => {
    if (realLegs.length > 0 && realLegs.length === stopLocations.length - 1) {
      const totalMinutes = realLegs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
      return formatMinutes(totalMinutes);
    }
    return routePlan?.totalDriveTimeFormatted || "Calculating...";
  }, [realLegs, stopLocations.length, routePlan]);

  // Fetch real road routes for consecutive stops
  useEffect(() => {
    let cancelled = false;
    if (stopLocations.length < 2) {
      setRealLegs([]);
      return;
    }

    const fetchRoads = async () => {
      setLoadingRoads(true);
      try {
        const promises: Promise<RealRoadLegResult>[] = [];
        for (let i = 0; i < stopLocations.length - 1; i++) {
          promises.push(fetchRealRoadRoute(stopLocations[i], stopLocations[i + 1]));
        }
        const results = await Promise.all(promises);
        if (!cancelled) {
          setRealLegs(results);
        }
      } catch (err) {
        console.warn("[DriverTripMap] Road route fetch error:", err);
      } finally {
        if (!cancelled) setLoadingRoads(false);
      }
    };

    fetchRoads();
    return () => {
      cancelled = true;
    };
  }, [stopLocations]);

  // Initialize Leaflet Map
  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      const L = await import("leaflet");
      // @ts-expect-error leaflet css import
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;
      leafletLibRef.current = L;

      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const container = document.getElementById(mapContainerId);
      if (!container) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerId, {
        center: [7.8731, 80.7718],
        zoom: 7.5,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      polylineRef.current = L.polyline([], {
        color: primaryColor,
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      setMapLoaded(true);
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapContainerId, primaryColor]);

  // Update Markers, Polyline, and Fit Bounds
  useEffect(() => {
    if (!mapLoaded) return;
    const L = leafletLibRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    segmentBadgesRef.current.forEach((b) => b.remove());
    segmentBadgesRef.current = [];

    if (stopLocations.length === 0) return;

    // Plot numbered pin markers matching website primary branding
    const newMarkers: LType.Marker[] = [];
    stopLocations.forEach((loc, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === stopLocations.length - 1;

      const markerHtml = `
        <div class="dtm-pin ${isStart ? "start" : isEnd ? "end" : "mid"}">
          <span>${idx + 1}</span>
          <i class="dtm-pulse"></i>
        </div>
      `;

      const icon = L.divIcon({
        className: "dtm-pin-wrap",
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -15],
      });

      const guideData = getTourGuideDestination(loc.name);
      const popup = L.popup({ className: "dtm-popup", maxWidth: 260 }).setContent(`
        <div style="font-family: 'Inter', sans-serif; padding: 4px; min-width: 180px;">
          <div style="font-size: 10px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; letter-spacing: 0.08em;">
            ${isStart ? "🚩 Origin / Pickup" : isEnd ? "🏁 Final Destination" : `📍 Stop ${idx + 1}`}
          </div>
          <div style="font-size: 14px; font-weight: 900; color: #0F172A; margin-top: 2px;">
            ${loc.name}
          </div>
          <div style="font-size: 10px; font-weight: 700; color: #64748B; margin-top: 1px;">
            ${guideData.tagline}
          </div>
          <div style="font-size: 11px; color: #334155; margin-top: 6px; line-height: 1.45; max-height: 85px; overflow-y: auto;">
            ${guideData.briefDescription}
          </div>
        </div>
      `);

      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map).bindPopup(popup);
      newMarkers.push(marker);
    });
    markersRef.current = newMarkers;

    // Build polyline coordinates: use real road coords if available, else direct lines
    const allRoadCoords: [number, number][] = realLegs.flatMap((leg) => leg.pathCoords);
    const directCoords: [number, number][] = stopLocations.map((loc) => [loc.lat, loc.lng]);

    if (polylineRef.current) {
      polylineRef.current.setStyle({ color: primaryColor, weight: 5, opacity: 0.95 });
      polylineRef.current.setLatLngs(allRoadCoords.length > 0 ? allRoadCoords : directCoords);
    }

    // Midpoint badges along real road legs with primary color accent
    if (realLegs.length > 0) {
      realLegs.forEach((leg, i) => {
        const path = leg.pathCoords;
        const midIdx = Math.floor(path.length / 2);
        const mid = path[midIdx] || [(leg.from.lat + leg.to.lat) / 2, (leg.from.lng + leg.to.lng) / 2];

        const badgeIcon = L.divIcon({
          className: "dtm-mid-badge",
          html: `
            <div style="background: rgba(255, 255, 255, 0.94); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); color: #0F172A; border: 1.5px solid ${primaryColor}; padding: 3px 9px; border-radius: 12px; font-size: 10px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 14px rgba(11, 124, 138, 0.2); font-family: 'Inter', sans-serif; white-space: nowrap;">
              <span style="color: ${primaryColor}; font-size: 11px;">${leg.direction.arrow}</span>
              <span>Leg ${i + 1}: ${leg.distanceKm} km</span>
            </div>
          `,
          iconSize: [110, 24],
          iconAnchor: [55, 12],
        });

        const badgeMarker = L.marker(mid as [number, number], { icon: badgeIcon, interactive: false }).addTo(map);
        segmentBadgesRef.current.push(badgeMarker);
      });
    }

    // Fit map bounds to encompass all stops
    if (directCoords.length > 0) {
      const bounds = L.latLngBounds(directCoords);
      map.fitBounds(bounds.pad(0.25));
    }
  }, [mapLoaded, stopLocations, realLegs, primaryColor]);

  // Handle focus on single leg
  const handleFocusLeg = (legIdx: number) => {
    setSelectedLegIdx(legIdx);
    const L = leafletLibRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (realLegs[legIdx]) {
      const coords = realLegs[legIdx].pathCoords;
      if (coords.length > 0) {
        map.flyToBounds(L.latLngBounds(coords).pad(0.3), { duration: 0.9 });
        return;
      }
    }

    const from = stopLocations[legIdx];
    const to = stopLocations[legIdx + 1];
    if (from && to) {
      map.flyToBounds(L.latLngBounds([[from.lat, from.lng], [to.lat, to.lng]]).pad(0.3), { duration: 0.9 });
    }
  };

  const handleCopyGoogleMapsLink = () => {
    navigator.clipboard.writeText(googleMapsRouteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div
      className={`dtm-wrapper rounded-3xl overflow-hidden backdrop-blur-xl border border-white/60 shadow-sm flex flex-col ${className}`}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.75)",
        boxShadow: "0 8px 32px 0 rgba(11, 124, 138, 0.08)",
      }}
    >
      {/* Map Header - Glassmorphic Header with Primary Color Shade Accent */}
      <div
        className="p-4 sm:p-5 backdrop-blur-xl border-b border-white/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}14 0%, rgba(255, 255, 255, 0.85) 50%, ${primaryColor}08 100%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-base shadow-xs shrink-0 backdrop-blur-md"
            style={{
              backgroundColor: `${primaryColor}18`,
              border: `1px solid ${primaryColor}30`,
              color: primaryColor,
            }}
          >
            <CompassOutlined />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-sm shadow-2xs"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}30`,
                }}
              >
                Driver Navigation & Itinerary
              </span>
              {loadingRoads && (
                <span className="text-[10px] font-semibold text-slate-400 animate-pulse">
                  • Syncing road distances...
                </span>
              )}
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-1 truncate max-w-md">
              {tourName || "Allocated Tour Route"}
            </h4>
          </div>
        </div>

        {/* Action Controls & Metrics */}
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          {/* Distance & Time Glass Pills */}
          <div
            className="flex items-center gap-2.5 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-2xs text-xs"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.80)",
              border: `1px solid ${primaryColor}25`,
            }}
          >
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              📍 <strong style={{ color: primaryColor }} className="font-black">{totalKm} km</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              ⏱️ <strong style={{ color: primaryColor }} className="font-black">{totalDriveTime}</strong>
            </span>
          </div>

          {/* Primary Action: Open in Google Maps */}
          <a
            href={googleMapsRouteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-extrabold text-xs shadow-md transition-all active:scale-95 hover:opacity-90"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 4px 14px ${primaryColor}35`,
            }}
            title="Launch full itinerary route in Google Maps app"
          >
            <svg
              className="w-3.5 h-3.5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span>Open in Google Maps</span>
          </a>

          {/* Secondary Action Icons */}
          <button
            onClick={handleCopyGoogleMapsLink}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white/70 hover:bg-white/95 backdrop-blur-md rounded-xl border border-white/80 transition text-xs shadow-2xs"
            title="Copy Google Maps Navigation Link"
          >
            {copiedLink ? <CheckCircleOutlined style={{ color: primaryColor }} /> : <ShareAltOutlined />}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white/70 hover:bg-white/95 backdrop-blur-md rounded-xl border border-white/80 transition text-xs shadow-2xs"
            title={isExpanded ? "Collapse Map" : "Expand Map"}
          >
            {isExpanded ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </button>
        </div>
      </div>

      {/* Ordered Destinations Stops Ribbon */}
      <div
        className="backdrop-blur-md border-b border-white/50 px-4 sm:px-5 py-3 flex items-center gap-2 overflow-x-auto text-xs"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.55)",
        }}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0">
          Stops ({stopLocations.length}):
        </span>
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {stopLocations.map((loc, i) => (
            <React.Fragment key={loc.id || i}>
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md font-bold text-slate-800 shadow-2xs"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  border: `1px solid ${primaryColor}25`,
                }}
              >
                <span
                  className="w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  {i + 1}
                </span>
                <span>{loc.name}</span>
              </span>
              {i < stopLocations.length - 1 && (
                <ArrowRightOutlined style={{ color: primaryColor }} className="text-[10px]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Leaflet Map Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            <div className="relative w-full h-[360px] bg-slate-100 z-0">
              <div id={mapContainerId} className="w-full h-full" />
              
              {/* Floating Glass Pill on Map */}
              <div
                className="absolute top-3 left-3 z-[400] backdrop-blur-xl border border-white/80 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 pointer-events-none"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.88)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: primaryColor }}
                />
                <span>Road Network Route • Sri Lanka</span>
              </div>
            </div>

            {/* Turn-by-Turn Leg Breakdown Cards with Glass Effects */}
            <div
              className="p-4 sm:p-5 backdrop-blur-md border-t border-white/60 space-y-3"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.50)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <CarOutlined style={{ color: primaryColor }} />
                  Turn-by-Turn Leg Breakdown & Kilometers
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Tap any leg to focus map or launch leg navigation
                </span>
              </div>

              {stopLocations.length > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {stopLocations.slice(0, -1).map((fromLoc, idx) => {
                    const toLoc = stopLocations[idx + 1];
                    const legInfo = realLegs[idx];
                    const fallbackInfo = getDistanceBetween(fromLoc.name, toLoc.name);
                    const km = legInfo ? legInfo.distanceKm : fallbackInfo.distanceKm;
                    const timeStr = legInfo ? legInfo.driveTimeLabel : formatMinutes(fallbackInfo.estimatedMinutes);
                    const legGoogleUrl = generateGoogleMapsLegUrl(fromLoc, toLoc);
                    const isSelected = selectedLegIdx === idx;

                    return (
                      <div
                        key={idx}
                        onClick={() => handleFocusLeg(idx)}
                        className={`p-3.5 rounded-2xl border transition text-xs cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                          isSelected
                            ? "shadow-sm"
                            : "bg-white/75 border-slate-200/80 hover:border-teal-400 hover:bg-white shadow-2xs"
                        }`}
                        style={{
                          backgroundColor: isSelected ? `${primaryColor}14` : undefined,
                          borderColor: isSelected ? primaryColor : undefined,
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                              style={{
                                backgroundColor: `${primaryColor}18`,
                                color: primaryColor,
                                border: `1px solid ${primaryColor}30`,
                              }}
                            >
                              Leg {idx + 1}
                            </span>
                            {legInfo && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${primaryColor}12`,
                                  color: primaryColor,
                                }}
                              >
                                {legInfo.direction.arrow} {legInfo.direction.code}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 font-bold text-slate-800 my-1">
                            <span className="truncate">{fromLoc.name}</span>
                            <span style={{ color: primaryColor }} className="font-bold shrink-0">➔</span>
                            <span className="truncate">{toLoc.name}</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                          <span style={{ color: primaryColor }} className="font-black">
                            📏 {km} km
                          </span>
                          <span className="text-slate-500 font-medium">
                            ⏱️ ~{timeStr}
                          </span>
                          <a
                            href={legGoogleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                            style={{
                              backgroundColor: `${primaryColor}14`,
                              color: primaryColor,
                              border: `1px solid ${primaryColor}25`,
                            }}
                            title="Navigate only this leg"
                          >
                            <span>Nav</span>
                            <span>↗</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 bg-white/70 backdrop-blur-md rounded-xl border border-slate-200/60">
                  Single destination tour. Click &quot;Open in Google Maps&quot; above to view location.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .dtm-pin-wrap {
          background: transparent;
          border: none;
        }
        .dtm-pin {
          position: relative;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          font-weight: 900;
          font-size: 11px;
          box-shadow: 0 4px 10px rgba(11, 124, 138, 0.35);
          border: 2px solid #ffffff;
          cursor: pointer;
        }
        .dtm-pin.start {
          background: linear-gradient(135deg, ${primaryColor}, #059669);
        }
        .dtm-pin.mid {
          background: linear-gradient(135deg, ${primaryColor}, #0D9488);
        }
        .dtm-pin.end {
          background: linear-gradient(135deg, #041A16, ${primaryColor});
        }
        .dtm-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid ${primaryColor};
          opacity: 0.5;
          animation: dtmPulse 2s infinite ease-out;
          pointer-events: none;
        }
        @keyframes dtmPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .dtm-popup .leaflet-popup-content-wrapper {
          border-radius: 14px;
          box-shadow: 0 14px 34px -10px rgba(0,0,0,0.15);
          border: 1px solid #E2E8F0;
        }
        .dtm-popup .leaflet-popup-tip {
          background: #ffffff;
        }
      `}</style>
    </div>
  );
}
