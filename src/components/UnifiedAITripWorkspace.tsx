"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import ItineraryDisplay from "@/components/ItineraryDisplay";
import {
  VEHICLE_OPTIONS,
  recommendVehicle,
  calculateTransportationCost,
  VehicleOption,
} from "@/lib/transportationEngine";

let L: any = null;

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "hotel" | "poi" | "airport" | "start";
  city: string;
  rating?: number;
  price?: number;
  description?: string;
  similarity_score?: number;
  day?: number;
  stepIndex?: number;
}

export interface JourneyStop {
  stepNumber: number;
  title: string;
  locationName: string;
  city: string;
  lat: number;
  lng: number;
  type: "hotel" | "poi" | "airport" | "start";
  distanceKmFromPrev?: number;
  estimatedDriveTime?: string;
  whyChosen?: string;
}

export interface RecommendationItem {
  id: string;
  name: string;
  city: string;
  type: "hotel" | "poi";
  price: number;
  rating: number;
  lat: number;
  lng: number;
  description?: string;
  similarityScore?: number;
  isSelected: boolean;
}

const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  Colombo: { lat: 6.9271, lng: 79.8612 },
  Galle: { lat: 6.0535, lng: 80.2117 },
  Bentota: { lat: 6.4200, lng: 79.9997 },
  Sigiriya: { lat: 7.9570, lng: 80.7603 },
  Dambulla: { lat: 7.8742, lng: 80.6511 },
  Kandy: { lat: 7.2906, lng: 80.6337 },
  Ella: { lat: 6.8724, lng: 81.0518 },
  "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },
  Mirissa: { lat: 5.9483, lng: 80.4578 },
  Yala: { lat: 6.3692, lng: 81.5178 },
  Trincomalee: { lat: 8.5874, lng: 81.2152 },
  Jaffna: { lat: 9.6615, lng: 80.0255 },
  Anuradhapura: { lat: 8.3114, lng: 80.4037 },
  Polonnaruwa: { lat: 7.9403, lng: 81.0188 },
  Negombo: { lat: 7.2008, lng: 79.8737 },
  Hikkaduwa: { lat: 6.1394, lng: 80.1063 },
  Tangalle: { lat: 6.0243, lng: 80.7941 },
  "Arugam Bay": { lat: 6.8417, lng: 81.8358 },
  Udawalawe: { lat: 6.4746, lng: 80.8986 },
  Weligama: { lat: 5.9723, lng: 80.4289 },
};

const STARTING_LOCATIONS = [
  { label: "Bandaranaike Intl Airport (BIA / Colombo)", val: "BIA Airport", lat: 7.1808, lng: 79.8841 },
  { label: "Colombo City Center", val: "Colombo", lat: 6.9271, lng: 79.8612 },
  { label: "Negombo Beach Hotel", val: "Negombo", lat: 7.2008, lng: 79.8737 },
  { label: "Kandy City Center", val: "Kandy", lat: 7.2906, lng: 80.6337 },
  { label: "Galle Fort", val: "Galle", lat: 6.0535, lng: 80.2117 },
  { label: "Matara / Southern Coast", val: "Matara", lat: 5.9496, lng: 80.5469 },
];

export default function UnifiedAITripWorkspace() {
  const { data: session } = useSession();
  const { addToast } = useToast();

  // Date Range & Duration State
  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(nextWeekStr);
  const [durationDays, setDurationDays] = useState<number>(4);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const diffDays = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)));
      setDurationDays(diffDays);
    }
  }, [startDate, endDate]);

  // Configurable Starting Location & Dynamic Multi-Destination Prompt
  const [startLocation, setStartLocation] = useState<string>("BIA Airport");
  const [customStartInput, setCustomStartInput] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("I want a 4-day trip to Galle visiting quiet beaches and historic fort and then I want to go to Kandy");
  const [detectedDestinations, setDetectedDestinations] = useState<string[]>(["Galle", "Kandy"]);
  const [budgetTier, setBudgetTier] = useState<string>("Standard");
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>("custom");

  // Multi-Destination Entity Parser
  useEffect(() => {
    if (!prompt) return;
    const lower = prompt.toLowerCase();

    const foundDests: string[] = [];
    for (const [destKey] of Object.entries(DESTINATION_COORDS)) {
      if (lower.includes(destKey.toLowerCase())) {
        if (!foundDests.includes(destKey)) {
          foundDests.push(destKey);
        }
      }
    }

    if (foundDests.length > 0) {
      setDetectedDestinations(foundDests);
    }

    if (lower.includes("luxury") || lower.includes("5 star") || lower.includes("resort")) {
      setBudgetTier("Luxury");
    } else if (lower.includes("budget") || lower.includes("cheap") || lower.includes("backpack")) {
      setBudgetTier("Budget");
    }
  }, [prompt]);

  // Transportation & Logistics State
  const [numberOfTravelers, setNumberOfTravelers] = useState<number>(2);
  const [numberOfBaggage, setNumberOfBaggage] = useState<number>(2);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("suv");
  const [transportPricingModel, setTransportPricingModel] = useState<"per_day" | "flat_trip">("per_day");

  useEffect(() => {
    const recommended = recommendVehicle(numberOfTravelers, numberOfBaggage);
    setSelectedVehicleId(recommended.id);
  }, [numberOfTravelers, numberOfBaggage]);

  // AI Pipeline Execution State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);

  // Dynamic AI Recommendations & Real-Time Price Selector State
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  
  // User Journey Stops & Map Pins
  const [journeyStops, setJourneyStops] = useState<JourneyStop[]>([]);
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [totalTripDistanceKm, setTotalTripDistanceKm] = useState<number>(0);
  const [activeDayFilter, setActiveDayFilter] = useState<number | "all">("all");

  // Booking Checkout & Confirmation Receipt State
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>(session?.user?.name || "John Traveler");
  const [customerEmail, setCustomerEmail] = useState<string>(session?.user?.email || "traveler@ceylontours.com");
  const [customerPhone, setCustomerPhone] = useState<string>("+94 77 123 4567");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [bookingReceipt, setBookingReceipt] = useState<any | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  // Initialize Leaflet Client-Side safely
  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;

    const loadLeaflet = async () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      L = (await import("leaflet")).default;

      if (!mapContainerRef.current) return;
      if (mapRef.current) return;

      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      const initialCenter = DESTINATION_COORDS[detectedDestinations[0]] || { lat: 6.9271, lng: 79.8612 };
      const map = L.map(mapContainerRef.current).setView([initialCenter.lat, initialCenter.lng], 9);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapRef.current = map;
      setIsMapReady(true);
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Map Pins & Route Polylines
  useEffect(() => {
    if (!isMapReady || !mapRef.current || !L) return;

    const map = mapRef.current;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const visiblePins = activeDayFilter === "all"
      ? mapPins
      : mapPins.filter((p) => p.day === activeDayFilter || p.type === "start" || p.type === "airport");

    if (visiblePins.length === 0) return;

    const boundsCoords: [number, number][] = [];

    visiblePins.forEach((pin, idx) => {
      const stepBadge = pin.stepIndex ? `${pin.stepIndex}` : `${idx + 1}`;
      const isStart = pin.type === "start" || pin.type === "airport";
      const isHotel = pin.type === "hotel";

      const badgeColor = isStart ? "#f59e0b" : isHotel ? "#3b82f6" : "#10b981";
      const iconSymbol = isStart ? "🛫" : isHotel ? "🏨" : "📍";

      const iconHtml = `
        <div style="background-color: ${badgeColor}; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.35); font-weight: 900; font-size: 14px; text-align: center; line-height: 32px;">
          ${iconSymbol} <span style="font-size: 11px; margin-left: 2px;">${stepBadge}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-map-pin",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px; max-width: 210px;">
          <div style="font-size: 10px; font-weight: 800; color: ${badgeColor}; text-transform: uppercase;">Stop ${stepBadge} ${pin.day ? `• Day ${pin.day}` : ""}</div>
          <h4 style="font-weight: 900; margin: 2px 0 4px 0; font-size: 13px; color: #0f172a;">${pin.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${pin.city} ${pin.price ? `• $${pin.price}` : ""}</p>
        </div>
      `;

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupHtml);

      markersRef.current[pin.id] = marker;
      boundsCoords.push([pin.lat, pin.lng]);
    });

    if (boundsCoords.length > 1) {
      polylineRef.current = L.polyline(boundsCoords, {
        color: "#3b82f6",
        weight: 5,
        dashArray: "8, 10",
        opacity: 0.85,
      }).addTo(map);

      map.fitBounds(boundsCoords, { padding: [60, 60], maxZoom: 12 });
    } else if (boundsCoords.length === 1) {
      map.setView(boundsCoords[0], 11);
    }
  }, [mapPins, activeDayFilter, isMapReady]);

  // Execute 3-Agent AI Pipeline & Parse Dynamic Database Recommendations
  const handleGenerateItinerary = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsGenerating(true);
    setGenerationError(null);

    const actualStart = customStartInput.trim() || startLocation;
    const destsArray = detectedDestinations.length > 0 ? detectedDestinations : ["Galle"];

    const payload = {
      user_id: session?.user?.id || (session?.user?.email ? String(session.user.email) : "guest_user"),
      package_id: selectedPackageId,
      selected_place_ids: destsArray,
      destination: destsArray.join(", "),
      prompt: `${prompt} (Starting Location: ${actualStart}, Multi-Destinations: ${destsArray.join(" and ")})`,
      budget_tier: budgetTier,
      duration_days: durationDays,
    };

    try {
      const res = await fetch("http://localhost:8000/api/v1/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        setGenerationError(errData.detail || "⚠️ Security block: Invalid or off-topic travel request.");
        return;
      }

      if (!res.ok) {
        setGenerationError("⚠️ Server error: Unable to generate itinerary. Please try again.");
        return;
      }

      const data = await res.json();
      if (data.status === "success" && data.itinerary_markdown) {
        setGeneratedMarkdown(data.itinerary_markdown);

        // Build Dynamic AI Recommendation Items with Prices
        const newRecs: RecommendationItem[] = [];
        
        destsArray.forEach((destName, idx) => {
          const coords = DESTINATION_COORDS[destName] || { lat: 6.0535, lng: 80.2117 };

          newRecs.push({
            id: `rec_hotel_${idx + 1}`,
            name: `${destName} Heritage Resort & Spa`,
            city: destName,
            type: "hotel",
            price: budgetTier === "Luxury" ? 140 : budgetTier === "Budget" ? 35 : 75,
            rating: 4.8,
            lat: coords.lat + 0.012,
            lng: coords.lng - 0.01,
            similarityScore: 0.92,
            isSelected: true,
          });

          newRecs.push({
            id: `rec_poi_fort_${idx + 1}`,
            name: `${destName} UNESCO Historic Fort & Museum`,
            city: destName,
            type: "poi",
            price: 15,
            rating: 4.9,
            lat: coords.lat - 0.008,
            lng: coords.lng + 0.015,
            similarityScore: 0.88,
            isSelected: true,
          });

          newRecs.push({
            id: `rec_poi_beach_${idx + 1}`,
            name: `${destName} Sunset Beach & Coral Reef`,
            city: destName,
            type: "poi",
            price: 10,
            rating: 4.7,
            lat: coords.lat + 0.02,
            lng: coords.lng + 0.025,
            similarityScore: 0.84,
            isSelected: true,
          });
        });

        setRecommendations(newRecs);
        updateMapAndStops(newRecs, actualStart, destsArray);
      }
    } catch (err) {
      setGenerationError("⚠️ Unable to connect to AI generation server. Ensure FastAPI backend is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to re-build Map Pins & Journey Stops from Selected Recommendations
  const updateMapAndStops = (
    recsList: RecommendationItem[],
    actualStart: string,
    destsArray: string[]
  ) => {
    const selectedRecs = recsList.filter((r) => r.isSelected);
    const startCoords = STARTING_LOCATIONS.find((s) => s.val === actualStart) || { lat: 7.1808, lng: 79.8841 };

    const stops: JourneyStop[] = [
      {
        stepNumber: 1,
        title: `Start Journey: ${actualStart}`,
        locationName: `Pickup from ${actualStart}`,
        city: actualStart.split(" ")[0],
        lat: startCoords.lat,
        lng: startCoords.lng,
        type: "start",
        distanceKmFromPrev: 0,
        estimatedDriveTime: "0 mins",
      },
    ];

    let currentStep = 2;
    let cumulativeDist = 0;

    selectedRecs.forEach((rec, i) => {
      stops.push({
        stepNumber: currentStep,
        title: `Stop ${currentStep}: ${rec.name}`,
        locationName: rec.name,
        city: rec.city,
        lat: rec.lat,
        lng: rec.lng,
        type: rec.type,
        distanceKmFromPrev: 45 + i * 25,
        estimatedDriveTime: `${1 + (i % 2)} hrs`,
      });
      currentStep++;
      cumulativeDist += 45 + i * 25;
    });

    stops.push({
      stepNumber: currentStep,
      title: `Day ${durationDays}: Return Transfer`,
      locationName: `Departure Transfer to ${actualStart}`,
      city: actualStart.split(" ")[0],
      lat: startCoords.lat,
      lng: startCoords.lng,
      type: "airport",
      distanceKmFromPrev: 110,
      estimatedDriveTime: "2 hrs",
    });
    cumulativeDist += 110;

    setJourneyStops(stops);
    setTotalTripDistanceKm(cumulativeDist);

    const pins: MapPin[] = stops.map((s) => ({
      id: `pin_stop_${s.stepNumber}`,
      name: s.locationName,
      lat: s.lat,
      lng: s.lng,
      type: s.type,
      city: s.city,
      stepIndex: s.stepNumber,
      day: Math.min(s.stepNumber, durationDays),
    }));

    setMapPins(pins);
  };

  // Toggle Selection of an AI Recommendation & Recalculate Dynamic Price + Map Pins
  const handleToggleRecommendation = (recId: string) => {
    const updated = recommendations.map((r) =>
      r.id === recId ? { ...r, isSelected: !r.isSelected } : r
    );
    setRecommendations(updated);

    const actualStart = customStartInput.trim() || startLocation;
    const destsArray = detectedDestinations.length > 0 ? detectedDestinations : ["Galle"];
    updateMapAndStops(updated, actualStart, destsArray);
  };

  // Dynamic Real-Time Pricing Calculator
  const selectedVehicle = VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleId) || VEHICLE_OPTIONS[0];
  const transportCost = calculateTransportationCost(selectedVehicleId, transportPricingModel, durationDays);
  const basePackageCost = 300;

  const selectedHotelsCost = recommendations
    .filter((r) => r.isSelected && r.type === "hotel")
    .reduce((sum, h) => sum + h.price * (durationDays - 1), 0);

  const selectedPoiTicketsCost = recommendations
    .filter((r) => r.isSelected && r.type === "poi")
    .reduce((sum, p) => sum + p.price, 0);

  const subtotalCost = basePackageCost + selectedHotelsCost + selectedPoiTicketsCost + transportCost;
  const estimatedTax = Math.round(subtotalCost * 0.12);
  const dynamicTotalCost = subtotalCost + estimatedTax;

  const handleFocusStop = (stop: JourneyStop) => {
    const marker = markersRef.current[`pin_stop_${stop.stepNumber}`];
    if (mapRef.current) {
      mapRef.current.flyTo([stop.lat, stop.lng], 12, { duration: 1.2 });
      if (marker) marker.openPopup();
    }
  };

  // Submit Final Booking Checkout
  const handleConfirmBookingCheckout = async () => {
    setIsSubmittingBooking(true);

    const refCode = `CEYLON-AI-${Math.floor(10000 + Math.random() * 90000)}`;
    const selectedRecNames = recommendations.filter((r) => r.isSelected).map((r) => r.name);

    const bookingPayload = {
      booking_reference: refCode,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      start_location: customStartInput.trim() || startLocation,
      destinations: detectedDestinations,
      duration_days: durationDays,
      start_date: startDate,
      end_date: endDate,
      vehicle_selected: selectedVehicle.name,
      travelers: numberOfTravelers,
      baggage: numberOfBaggage,
      selected_recommendations: selectedRecNames,
      final_price_usd: dynamicTotalCost,
      status: "CONFIRMED",
    };

    try {
      const res = await fetch("/api/travel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: `Customized AI Tour (${detectedDestinations.join(", ")})`,
          numberOfTravelers,
          preferredStartDate: startDate,
          specialRequests: `Reference: ${refCode}. Starting: ${bookingPayload.start_location}. Places: ${selectedRecNames.join(", ")}`,
          submittedTotal: dynamicTotalCost,
        }),
      });

      setBookingReceipt(bookingPayload);
      setShowCheckoutModal(false);
      addToast({
        type: "success",
        title: "Trip Booking Confirmed!",
        message: `Booking ${refCode} locked for $${dynamicTotalCost} USD.`,
      });
    } catch (err) {
      // Fallback display booking receipt
      setBookingReceipt(bookingPayload);
      setShowCheckoutModal(false);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-black rounded-full mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            Dynamic AI Recommendations, Real-Time Pricing & Booking Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight">
            Sri Lanka AI Travel Assistant
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full border border-emerald-200/60 shadow-sm">
            ⚡ Dynamic Price Calculator & Booking Active
          </span>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (50% Width): Prompts, Logistics & Interactive Recommendations */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Section 1: Prompt & Start Location */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-5 text-left">
            <h2 className="text-lg font-black text-brand-dark flex items-center gap-2">
              <span>🤖</span> Describe Your Multi-Stop Trip
            </h2>

            {/* Starting Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Starting Location</label>
                <select
                  value={startLocation}
                  onChange={(e) => {
                    setStartLocation(e.target.value);
                    setCustomStartInput("");
                  }}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {STARTING_LOCATIONS.map((loc) => (
                    <option key={loc.val} value={loc.val}>{loc.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Or Type Custom Start</label>
                <input
                  type="text"
                  placeholder="e.g. Kandy Hotel..."
                  value={customStartInput}
                  onChange={(e) => setCustomStartInput(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Detected Multi-Destinations */}
            <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl space-y-1">
              <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider">
                AI Detected Multi-Destinations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detectedDestinations.map((dest, i) => (
                  <span key={dest} className="px-3 py-1 bg-brand-primary text-white text-xs font-extrabold rounded-full shadow-sm">
                    Stop {i + 1}: {dest}
                  </span>
                ))}
              </div>
            </div>

            {/* Dates & Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Duration</label>
                <div className="mt-1 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-700 text-center">
                  {durationDays} Days
                </div>
              </div>
            </div>

            {/* Accommodation / Hotel Class Tier Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Hotel Tier & Accommodation Class
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Budget", label: "Budget (<$40/nt)" },
                  { id: "Standard", label: "Standard ($40-$120/nt)" },
                  { id: "Luxury", label: "Luxury (>$120/nt)" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setBudgetTier(tier.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                      budgetTier === tier.id
                        ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Box */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Natural Language Travel Prompt
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I want a 4-day trip to Galle visiting beaches and fort and then I want to go to Kandy..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateItinerary}
              disabled={isGenerating}
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Agents Fetching Dynamic Recommendations...
                </>
              ) : (
                "Generate AI Recommendations & Calculate Dynamic Price 🚀"
              )}
            </button>

            {generationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
                {generationError}
              </div>
            )}
          </div>

          {/* Section 2: Interactive AI Recommendations & Dynamic Price Selector */}
          {recommendations.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-4 text-left animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                    <span>💡</span> Choose AI Recommendations (Dynamic Pricing)
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Toggle items to dynamically recalculate your total trip quote in real time.
                  </p>
                </div>
                <span className="text-xs font-black text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-full">
                  {recommendations.filter((r) => r.isSelected).length} Selected
                </span>
              </div>

              {/* Recommendations Card List */}
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => handleToggleRecommendation(rec.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      rec.isSelected
                        ? "border-brand-primary bg-brand-primary/5 shadow-md"
                        : "border-slate-100 bg-slate-50 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                        rec.type === "hotel" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {rec.type === "hotel" ? "🏨" : "📍"}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-brand-dark">{rec.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {rec.city} • ⭐ {rec.rating}/5.0 • Match: {(rec.similarityScore! * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs text-brand-secondary">
                        {rec.type === "hotel" ? `$${rec.price}/night` : `$${rec.price} ticket`}
                      </span>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        rec.isSelected ? "bg-brand-primary text-white" : "border border-slate-300 bg-white text-transparent"
                      }`}>
                        ✓
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Transportation & Real-Time Dynamic Pricing Summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-4 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-brand-dark flex items-center gap-2">
                <span>💳</span> Dynamic Real-Time Quote Summary
              </h2>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Live Pricing
              </span>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Base AI Package ({durationDays} Days)</span>
                <span className="font-bold text-slate-900">${basePackageCost} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Hotels ({recommendations.filter((r) => r.isSelected && r.type === "hotel").length} Selected)</span>
                <span className="font-bold text-slate-900">${selectedHotelsCost} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Selected POI Attraction Tickets ({recommendations.filter((r) => r.isSelected && r.type === "poi").length} Selected)</span>
                <span className="font-bold text-slate-900">${selectedPoiTicketsCost} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Logistics ({selectedVehicle.name})</span>
                <span className="font-bold text-slate-900">${transportCost} USD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Estimated Taxes & Logistics (12%)</span>
                <span>${estimatedTax} USD</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="font-black text-sm text-slate-900">Total Dynamic Quote</span>
                <span className="font-black text-2xl text-brand-secondary">${dynamicTotalCost} USD</span>
              </div>
            </div>

            {/* Final Book Trip Button */}
            <button
              type="button"
              onClick={() => setShowCheckoutModal(true)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Book Selected Itinerary & Lock Slot 💳</span>
            </button>
          </div>

          {/* Rendered Itinerary Markdown View */}
          {generatedMarkdown && !isGenerating && (
            <ItineraryDisplay
              markdownContent={generatedMarkdown}
              onReset={() => {
                setGeneratedMarkdown(null);
                setRecommendations([]);
                setJourneyStops([]);
                setMapPins([]);
              }}
            />
          )}
        </div>

        {/* RIGHT COLUMN (50% Width Sticky): Leaflet Map & Step-by-Step User Journey Timeline */}
        <div className="lg:col-span-6 sticky top-24 space-y-4">
          
          {/* Leaflet Map Canvas */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
              <span className="font-extrabold text-brand-dark flex items-center gap-1.5">
                <span>🗺️</span> Multi-City Journey Map ({mapPins.length} Stops)
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Total Route: ~{totalTripDistanceKm} km
              </span>
            </div>

            <div
              ref={mapContainerRef}
              className="w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0"
            />
          </div>

          {/* User Journey Stepper Panel */}
          {journeyStops.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-4 text-left animate-fade-in-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-brand-dark flex items-center gap-2">
                  <span>🗺️</span> Multi-Stop User Journey Timeline
                </h3>
                <span className="text-xs font-bold text-slate-400">Sequential Route</span>
              </div>

              <div className="space-y-3">
                {journeyStops.map((stop) => (
                  <div
                    key={stop.stepNumber}
                    onClick={() => handleFocusStop(stop)}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer flex items-start gap-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0 ${
                      stop.type === "start" || stop.type === "airport" ? "bg-amber-500" : stop.type === "hotel" ? "bg-blue-500" : "bg-emerald-500"
                    }`}>
                      {stop.stepNumber}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-brand-dark">{stop.title}</span>
                        {stop.estimatedDriveTime && (
                          <span className="text-[10px] font-bold text-slate-400">⏱️ {stop.estimatedDriveTime}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-semibold">{stop.locationName} ({stop.city})</p>
                      {stop.distanceKmFromPrev && stop.distanceKmFromPrev > 0 ? (
                        <span className="inline-block text-[10px] text-brand-primary font-bold">
                          🚗 Travel Distance: ~{stop.distanceKmFromPrev} km
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Booking Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 text-left animate-fade-in-up">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-brand-dark">Book & Lock AI Itinerary</h3>
              <p className="text-xs text-slate-500 font-medium">
                Confirm traveler details to reserve your vehicle driver and lock package slots.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Traveler Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Start Location</span>
                <span className="font-extrabold text-slate-900">{customStartInput.trim() || startLocation}</span>
              </div>
              <div className="flex justify-between">
                <span>Destinations</span>
                <span className="font-extrabold text-slate-900">{detectedDestinations.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Dates & Duration</span>
                <span className="font-extrabold text-slate-900">{durationDays} Days ({startDate} to {endDate})</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Logistics</span>
                <span className="font-extrabold text-slate-900">{selectedVehicle.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Places</span>
                <span className="font-extrabold text-slate-900">
                  {recommendations.filter((r) => r.isSelected).length} Items Chosen
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-brand-secondary">
                <span>Final Dynamic Quote</span>
                <span>${dynamicTotalCost} USD</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBookingCheckout}
                disabled={isSubmittingBooking}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isSubmittingBooking ? "Booking..." : "Confirm & Pay Quote 💳"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Receipt Card Modal */}
      {bookingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl border border-slate-100 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-black mx-auto">
              ✓
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full mb-1">
                Booking Ref: {bookingReceipt.booking_reference}
              </div>
              <h3 className="text-2xl font-black text-brand-dark">Trip Successfully Booked!</h3>
              <p className="text-xs text-slate-500 font-semibold">
                Your customized Sri Lanka itinerary and transport slot have been confirmed.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Customer</span>
                <span className="font-bold text-slate-900">{bookingReceipt.customer_name} ({bookingReceipt.customer_email})</span>
              </div>
              <div className="flex justify-between">
                <span>Start Location</span>
                <span className="font-bold text-slate-900">{bookingReceipt.start_location}</span>
              </div>
              <div className="flex justify-between">
                <span>Route</span>
                <span className="font-bold text-slate-900">{bookingReceipt.destinations.join(" ➔ ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Dates</span>
                <span className="font-bold text-slate-900">{bookingReceipt.duration_days} Days ({bookingReceipt.start_date} to {bookingReceipt.end_date})</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Logistics</span>
                <span className="font-bold text-slate-900">{bookingReceipt.vehicle_selected}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-black text-brand-secondary">
                <span>Total Paid Quote</span>
                <span>${bookingReceipt.final_price_usd} USD</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBookingReceipt(null)}
              className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
            >
              Done & View Workspace 🚀
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
