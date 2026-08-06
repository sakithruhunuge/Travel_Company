"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";
import {
  CompassOutlined,
  DollarOutlined,
  CarOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  UsergroupAddOutlined,
  AppstoreAddOutlined,
  CoffeeOutlined,
  StarFilled,
  RobotOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  PictureOutlined,
} from "@ant-design/icons";

import { useToast } from "@/context/ToastContext";
import {
  calculateTripPricing,
  PricingInputs,
  HOTEL_LABELS,
  TRANSPORT_LABELS,
  SEASON_LABELS,
  ACTIVITY_RATES,
  ACTIVITY_LABELS,
  ADDON_LABELS,
  DESTINATION_SURCHARGES,
} from "@/lib/pricingEngine";

// Extended 24 Sri Lanka Locations Dataset with Real Coordinates
export interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  img: string;
  description: string;
}

export const LOCATIONS: MapLocation[] = [
  { id: "Colombo", name: "Colombo", lat: 6.9271, lng: 79.8612, img: "/images/colombo.png", description: "Vibrant capital, colonial charm, and luxury oceanfront dining." },
  { id: "Galle", name: "Galle", lat: 6.0535, lng: 80.221, img: "/images/galle.png", description: "17th century Dutch Fort, cobblestone alleys, and boutique cafes." },
  { id: "Bentota", name: "Bentota", lat: 6.423, lng: 79.9984, img: "/images/bentota.png", description: "Golden sand beaches, luxury water sports, and tranquil river safaris." },
  { id: "Dambulla", name: "Dambulla", lat: 7.8742, lng: 80.6511, img: "/images/dambulla.png", description: "Ancient Cave Temple complex and UNESCO sacred rock art." },
  { id: "Kandy", name: "Kandy", lat: 7.2906, lng: 80.6337, img: "/images/kandy.png", description: "Sacred Temple of the Tooth, mist-covered lake, and royal gardens." },
  { id: "Ella", name: "Ella", lat: 6.8667, lng: 81.0466, img: "/images/nine_arch.png", description: "Nine Arch Bridge, iconic mountain hikes, and lush tea trails." },
  { id: "Sigiriya", name: "Sigiriya", lat: 7.957, lng: 80.76, img: "/images/sigiriya.png", description: "5th-century Lion Rock citadel surrounded by royal water gardens." },
  { id: "Mirissa", name: "Mirissa", lat: 5.9483, lng: 80.4716, img: "/images/bentota.png", description: "Whale watching center, palm coconut hills, and lively surf bays." },
  { id: "Trincomalee", name: "Trincomalee", lat: 8.5874, lng: 81.2152, img: "/images/galle.png", description: "Pristine eastern white beaches, Koneswaram temple, and pigeon island." },
  { id: "Nuwara Eliya", name: "Nuwara Eliya", lat: 6.9497, lng: 80.7891, img: "/images/tea.png", description: "Little England, rolling tea plantations, and cool mountain air." },
  { id: "Jaffna", name: "Jaffna", lat: 9.6615, lng: 80.0255, img: "/images/colombo.png", description: "Northern cultural peninsula, Nallur Kovil, and vibrant Tamil heritage." },
  { id: "Yala", name: "Yala", lat: 6.3725, lng: 81.516, img: "/images/yala.png", description: "World famous national park with highest density of wild leopards." },
  { id: "Arugam Bay", name: "Arugam Bay", lat: 6.8415, lng: 81.8358, img: "/images/bentota.png", description: "World-class point break surf haven and relaxed beach vibes." },
  { id: "Negombo", name: "Negombo", lat: 7.2008, lng: 79.8737, img: "/images/colombo.png", description: "Coastal town near airport, famous for fish markets and Dutch canals." },
  { id: "Hikkaduwa", name: "Hikkaduwa", lat: 6.1392, lng: 80.1011, img: "/images/galle.png", description: "Coral reef sanctuaries, sea turtle feeding, and beachside night spots." },
  { id: "Anuradhapura", name: "Anuradhapura", lat: 8.3114, lng: 80.4037, img: "/images/dambulla.png", description: "Ancient sacred capital with towering stupas and sacred Jaya Sri Maha Bodhi." },
  { id: "Polonnaruwa", name: "Polonnaruwa", lat: 7.9403, lng: 81.0188, img: "/images/sigiriya.png", description: "Medieval royal kingdom, stone carved Gal Vihara Buddha statues." },
  { id: "Tangalle", name: "Tangalle", lat: 6.0244, lng: 80.7941, img: "/images/galle.png", description: "Quiet secluded southern bays, luxury hideaways, and turtle nesting." },
  { id: "Udawalawe", name: "Udawalawe", lat: 6.4746, lng: 80.8986, img: "/images/yala.png", description: "Guaranteed wild elephant sightings and open reservoir safaris." },
  { id: "Pasikuda", name: "Pasikuda", lat: 7.9228, lng: 81.5647, img: "/images/bentota.png", description: "Shallow glass-clear bay perfect for relaxing luxury beach stays." },
  { id: "Wilpattu", name: "Wilpattu", lat: 8.4526, lng: 80.0545, img: "/images/yala.png", description: "Sri Lanka's largest national park famous for natural lakes and sloth bears." },
  { id: "Weligama", name: "Weligama", lat: 5.9722, lng: 80.4289, img: "/images/bentota.png", description: "Beginner surf paradise, stilt fishermen, and modern beach resorts." },
  { id: "Unawatuna", name: "Unawatuna", lat: 6.0094, lng: 80.2486, img: "/images/galle.png", description: "Horseshoe bay, Japanese Peace Pagoda, and bustling beach restaurants." },
  { id: "Matara", name: "Matara", lat: 5.9496, lng: 80.5469, img: "/images/galle.png", description: "Historic southern hub with Pigeon Island shrine and Dutch ramparts." },
];

export const BASE_TOURS = [
  {
    id: "cultural",
    nameKey: "cultural",
    descKey: "culturalDesc",
    destinations: ["Colombo", "Dambulla", "Sigiriya", "Kandy"],
    duration: 5,
  },
  {
    id: "southern",
    nameKey: "southern",
    descKey: "southernDesc",
    destinations: ["Bentota", "Galle", "Mirissa", "Yala"],
    duration: 6,
  },
  {
    id: "hill",
    nameKey: "hill",
    descKey: "hillDesc",
    destinations: ["Kandy", "Nuwara Eliya", "Ella"],
    duration: 6,
  },
  {
    id: "custom",
    nameKey: "custom",
    descKey: "customDesc",
    destinations: ["Colombo", "Kandy"],
    duration: 4,
  },
];

const QUICK_CHIPS = ["beach", "ancient", "wildlife", "hill country", "quiet", "food"];

const getPlainText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getPlainText).join("");
  if (node.props && node.props.children) return getPlainText(node.props.children);
  return "";
};

export default function InteractiveTourCustomizer() {
  const t = useTranslations("CustomizeTour");
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { addToast } = useToast();

  const currency = "USD";
  const formatPrice = (val: number) => `$${val.toLocaleString()}`;

  // Selection states
  const [selectedTour, setSelectedTour] = useState<string>("ai-suggested");
  const [inputs, setInputs] = useState<PricingInputs>({
    duration: 5,
    numberOfTravelers: 2,
    destinations: ["Colombo", "Dambulla", "Sigiriya", "Kandy"],
    hotelClass: "standard",
    transportMode: "private-driver",
    season: "shoulder",
    activities: ["sigiriya-hike"],
    extraNights: 0,
    addOns: ["breakfast"],
    baggageCount: 2,
    pricingMode: "per-day",
    selectedRealPrices: {},
  });

  const [preferredStartDate, setPreferredStartDate] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [hoveredLocation, setHoveredLocation] = useState<MapLocation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI Suggest Sub-form state
  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0];
  const [aiStartDate, setAiStartDate] = useState<string>(todayStr);
  const [aiEndDate, setAiEndDate] = useState<string>(nextWeekStr);
  const [aiDuration, setAiDuration] = useState<number>(5);
  const [aiKeywords, setAiKeywords] = useState<string>("ancient rock fort, quiet beaches, wildlife safari");
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiItinerary, setAiItinerary] = useState<string | null>(null);

  // Selectable AI Suggested Places state
  const [suggestedPlacesByDestination, setSuggestedPlacesByDestination] = useState<Record<string, { hotels: any[]; poi: any[] }>>({});
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [failedPoiImages, setFailedPoiImages] = useState<Record<string, boolean>>({});

  // Re-derive AI duration on date change
  useEffect(() => {
    if (aiStartDate && aiEndDate) {
      const start = new Date(aiStartDate).getTime();
      const end = new Date(aiEndDate).getTime();
      const diff = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)));
      setAiDuration(diff);
    }
  }, [aiStartDate, aiEndDate]);

  // Leaflet references
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load draft from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("tour_customizer_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.inputs) setInputs(parsed.inputs);
        if (parsed.preferredStartDate) setPreferredStartDate(parsed.preferredStartDate);
        if (parsed.specialRequests) setSpecialRequests(parsed.specialRequests);
        if (parsed.selectedTour) setSelectedTour(parsed.selectedTour);
        if (parsed.aiItinerary) setAiItinerary(parsed.aiItinerary);
        if (parsed.suggestedPlacesByDestination) setSuggestedPlacesByDestination(parsed.suggestedPlacesByDestination);
        if (parsed.selectedPlaceIds) setSelectedPlaceIds(parsed.selectedPlaceIds);
        sessionStorage.removeItem("tour_customizer_draft");
        addToast("success", t("customizedTourSaved"));
      }
    } catch (e) {
      console.warn("Failed to load tour customizer draft:", e);
    }
  }, [addToast, t]);

  // Toggle location selection
  const handleToggleLocation = (locId: string) => {
    setInputs((prev) => {
      const isSelected = prev.destinations.includes(locId);
      let nextDests = [];
      if (isSelected) {
        if (prev.destinations.length > 1) {
          nextDests = prev.destinations.filter((d) => d !== locId);
        } else {
          nextDests = [...prev.destinations];
          addToast("info", "Please keep at least one destination selected.");
        }
      } else {
        nextDests = [...prev.destinations, locId];
      }
      return { ...prev, destinations: nextDests };
    });
  };

  // Toggle suggested place card & dynamically update real prices & route map
  const handleToggleSuggestedPlace = (item: any, city: string, isHotel: boolean) => {
    const itemId = String(item.id);
    const isSelected = selectedPlaceIds.includes(itemId);

    let nextSelectedIds: string[] = [];
    if (isSelected) {
      nextSelectedIds = selectedPlaceIds.filter((id) => id !== itemId);
    } else {
      nextSelectedIds = [...selectedPlaceIds, itemId];
    }
    setSelectedPlaceIds(nextSelectedIds);

    setInputs((prev) => {
      // Auto-add destination to route map if not already present
      let nextDests = [...prev.destinations];
      if (!isSelected && !nextDests.includes(city)) {
        nextDests.push(city);
      }

      // Re-build selectedRealPrices map
      const hotelNightlyRateByDestination: Record<string, number> = { ...(prev.selectedRealPrices?.hotelNightlyRateByDestination || {}) };
      const poiCostsUsd: number[] = [];

      Object.entries(suggestedPlacesByDestination).forEach(([destName, data]) => {
        (data.hotels || []).forEach((h) => {
          if (nextSelectedIds.includes(String(h.id))) {
            hotelNightlyRateByDestination[destName] = h.avg_nightly_usd;
          }
        });
        (data.poi || []).forEach((p) => {
          if (nextSelectedIds.includes(String(p.id))) {
            if (p.ticket_price_usd > 0) poiCostsUsd.push(p.ticket_price_usd);
          }
        });
      });

      // Clear hotel rate if deselecting
      if (isSelected && isHotel) {
        const remainingCityHotels = (suggestedPlacesByDestination[city]?.hotels || []).filter((h) =>
          nextSelectedIds.includes(String(h.id))
        );
        if (remainingCityHotels.length === 0) {
          delete hotelNightlyRateByDestination[city];
        }
      }

      return {
        ...prev,
        destinations: nextDests,
        selectedRealPrices: {
          hotelNightlyRateByDestination,
          poiCostsUsd,
        },
      };
    });

    if (!isSelected) {
      addToast("success", `Added ${item.name} (${city}) to your itinerary!`);
    }
  };

  // Toggle meal add-ons & extras
  const handleToggleAddOn = (addonId: string) => {
    setInputs((prev) => {
      const exists = prev.addOns.includes(addonId);
      const nextAddons = exists
        ? prev.addOns.filter((a) => a !== addonId)
        : [...prev.addOns, addonId];
      return { ...prev, addOns: nextAddons };
    });
  };

  // Calculate dynamic costs
  const pricing = calculateTripPricing(inputs);

  // SSR-Safe Client-side Leaflet Initialization
  useEffect(() => {
    let L: any;
    const initMap = async () => {
      L = await import("leaflet");
      // @ts-ignore
      await import("leaflet/dist/leaflet.css");

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      if (mapRef.current) return;

      const container = document.getElementById("sri-lanka-map");
      if (!container) return;

      const map = L.map("sri-lanka-map", {
        center: [7.8731, 80.7718],
        zoom: 7.5,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const markers: Record<string, any> = {};
      LOCATIONS.forEach((loc) => {
        const popupContent = document.createElement("div");
        popupContent.style.width = "180px";
        popupContent.className = "flex flex-col gap-2 p-1 text-slate-800 text-left font-sans";

        const imgContainer = document.createElement("div");
        imgContainer.className = "relative w-full h-[90px] rounded-lg overflow-hidden border border-slate-200";

        const img = document.createElement("img");
        img.src = loc.img;
        img.alt = loc.name;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        imgContainer.appendChild(img);

        const title = document.createElement("h4");
        title.className = "font-black text-sm text-slate-900";
        title.innerText = loc.name;

        const desc = document.createElement("p");
        desc.className = "text-[11px] text-slate-500 font-medium leading-tight";
        desc.innerText = loc.description;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.id = `popup-btn-${loc.id}`;

        popupContent.appendChild(imgContainer);
        popupContent.appendChild(title);
        popupContent.appendChild(desc);
        popupContent.appendChild(btn);

        const marker = L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(popupContent);
        markers[loc.id] = marker;
      });

      markersRef.current = markers;

      const polyline = L.polyline([], {
        color: "#0284c7",
        weight: 3,
        dashArray: "6, 8",
      }).addTo(map);
      polylineRef.current = polyline;

      setMapLoaded(true);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map polyline & popup button states when selected destinations change
  useEffect(() => {
    if (!mapLoaded) return;

    LOCATIONS.forEach((loc) => {
      const marker = markersRef.current[loc.id];
      if (!marker) return;

      const isSelected = inputs.destinations.includes(loc.id);

      const popup = marker.getPopup();
      if (popup) {
        const content = popup.getContent() as HTMLElement;
        if (content) {
          const btn = content.querySelector("button");
          if (btn) {
            btn.innerText = isSelected ? t("removeFromRoute") : t("addToRoute");
            btn.className = isSelected
              ? "mt-2 py-1.5 w-full bg-rose-600 text-white rounded-lg font-bold text-[10px] uppercase text-center hover:bg-rose-500 transition select-none cursor-pointer"
              : "mt-2 py-1.5 w-full bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase text-center hover:bg-slate-800 transition select-none cursor-pointer";

            btn.onclick = () => {
              handleToggleLocation(loc.id);
            };
          }
        }
      }
    });

    if (polylineRef.current && mapRef.current) {
      const selectedCoords = inputs.destinations
        .map((id) => LOCATIONS.find((loc) => loc.id === id))
        .filter((loc): loc is MapLocation => !!loc)
        .map((loc) => [loc.lat, loc.lng] as [number, number]);

      polylineRef.current.setLatLngs(selectedCoords);
    }
  }, [inputs.destinations, mapLoaded, t]);

  // Handle base tour template click
  const handleBaseTourChange = (tourId: string) => {
    setSelectedTour(tourId);
    const tour = BASE_TOURS.find((t) => t.id === tourId);
    if (tour) {
      setInputs((prev) => ({
        ...prev,
        duration: tour.duration,
        destinations: [...tour.destinations],
      }));
    }
  };

  // AI Package Generation Handler
  const handleGenerateAIPackage = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    const payload = {
      prompt: aiKeywords,
      duration_days: aiDuration,
      preferred_attributes: aiKeywords.split(",").map((s) => s.trim()).filter(Boolean),
      selected_place_ids: selectedPlaceIds,
      date_range: { start: aiStartDate, end: aiEndDate },
    };

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "AI suggestions are temporarily unavailable.");
      }

      const data = await res.json();
      if (data.status === "success" && data.itinerary_markdown) {
        setAiItinerary(data.itinerary_markdown);
        setSelectedTour("ai-suggested");

        if (data.suggested_places_by_destination) {
          setSuggestedPlacesByDestination(data.suggested_places_by_destination);
        }

        // Parse returned ordered destinations & match against LOCATIONS
        const returnedCities: string[] = data.destinations || [];
        if (returnedCities.length === 0 && data.search_results_by_destination) {
          Object.keys(data.search_results_by_destination).forEach((c) => {
            if (!returnedCities.includes(c)) returnedCities.push(c);
          });
        }

        // Intersect with known LOCATIONS
        const validMappedDests = returnedCities.filter((c) =>
          LOCATIONS.some((loc) => loc.id === c)
        );

        if (returnedCities.length > validMappedDests.length) {
          addToast("info", "Some AI picks aren't on the interactive map yet, but are included in your itinerary text.");
        }

        const finalDests = validMappedDests.length > 0 ? validMappedDests : ["Colombo", "Kandy"];

        // Map budget tier to hotelClass
        const budgetTier = data.intake_params?.budget_tier || "Standard";
        const mappedHotelClass =
          budgetTier === "Luxury" ? "luxury" : budgetTier === "Budget" ? "budget" : "standard";

        setInputs((prev) => ({
          ...prev,
          duration: data.intake_params?.duration_days || aiDuration,
          destinations: finalDests,
          hotelClass: mappedHotelClass,
        }));

        if (aiStartDate) setPreferredStartDate(aiStartDate);
        addToast("success", "AI Package generated! Review your itinerary and suggested places below.");
      } else {
        throw new Error(data.error || "Failed to generate AI package.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "AI suggestions are temporarily unavailable.");
      addToast("error", err.message || "AI suggestions are temporarily unavailable.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    if (!preferredStartDate) {
      tempErrors.preferredStartDate = t("selectStartDate");
    } else {
      const today = new Date().toISOString().split("T")[0];
      if (preferredStartDate < today) {
        tempErrors.preferredStartDate = t("futureDate");
      }
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmitBooking = async () => {
    if (!validateForm()) {
      addToast("error", t("correctErrors"));
      return;
    }

    if (sessionStatus !== "authenticated") {
      const draft = {
        inputs,
        preferredStartDate,
        specialRequests,
        selectedTour,
        aiItinerary,
        suggestedPlacesByDestination,
        selectedPlaceIds,
      };
      sessionStorage.setItem("tour_customizer_draft", JSON.stringify(draft));
      addToast("info", t("redirectLogin"));
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        packageId: selectedTour === "ai-suggested" ? "custom" : selectedTour,
        packageName: selectedTour === "ai-suggested" ? "AI-Suggested Ceylon Experience" : `Custom Tour - ${inputs.destinations.join(", ")}`,
        pricingInputs: inputs,
        submittedTotal: pricing.totalPrice,
        aiItineraryMarkdown: aiItinerary,
        aiVibeQuery: aiKeywords,
        source: selectedTour === "ai-suggested" ? "ai-suggested" : "manual",
        startDate: preferredStartDate,
        specialRequests,
        travelers: inputs.numberOfTravelers,
      };

      const res = await fetch("/api/travel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit custom travel request");
      }

      setSubmitSuccess(true);
      addToast("success", "Custom travel request submitted successfully!");
    } catch (err: any) {
      console.error(err);
      addToast("error", err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl shadow-lg text-center space-y-6 animate-fade-in-up">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
          <CheckOutlined />
        </div>
        <h2 className="text-2xl font-black text-slate-900">{t("requestSubmittedTitle")}</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          {t("requestSubmittedDesc")}
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={() => router.push("/dashboard/my-requests")}
            className="px-6 py-3 bg-brand-primary text-white font-bold rounded-xl shadow-md hover:bg-brand-primary/90 transition"
          >
            {t("viewRequestsBtn")}
          </button>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
          >
            {t("customizeAnotherBtn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Title Banner - Clean & Professional */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-orange-100/50 shadow-sm p-6 sm:p-8">
          {/* Base Clean Gradient: White left, subtle Orange right */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white to-orange-50" />
          
          {/* Extremely subtle, elegant orbs (No gray/dark shading) */}
          <div className="absolute -right-20 -top-20 w-[25rem] h-[25rem] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute right-1/4 -bottom-20 w-[15rem] h-[15rem] bg-sky-300/15 rounded-full blur-[60px] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-primary/5 border border-brand-primary/20 rounded-full text-[11px] font-bold text-brand-primary uppercase tracking-widest">
              <CompassOutlined /> {t("tagline")}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 leading-snug">
              {t("title")}
            </h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Customizer Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-8">

            {/* Step 1: Base Package vs AI Suggest Card Choice */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <AppstoreAddOutlined className="text-brand-primary" />
                <span>{t("step1")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* AI Suggest My Trip Option Card */}
                <button
                  type="button"
                  onClick={() => setSelectedTour("ai-suggested")}
                  className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 transition-all col-span-1 sm:col-span-2 ${selectedTour === "ai-suggested"
                      ? "border-brand-primary bg-brand-primary/5 shadow-md"
                      : "border-brand-primary/40 bg-white"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="block text-sm font-extrabold text-brand-primary flex items-center gap-2">
                      <RobotOutlined className="text-lg" />
                      <span>{t("aiSuggestTitle")}</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-brand-primary text-white text-[10px] font-black rounded-full uppercase">
                      ⚡ 3-Agent AI Engine
                    </span>
                  </div>
                  <span className="block text-[11px] text-slate-600 mt-1 font-medium leading-normal">
                    {t("aiSuggestDesc")}
                  </span>
                </button>

                {/* Pre-built Base Tours */}
                {BASE_TOURS.map((tour) => {
                  const isSelected = selectedTour === tour.id;
                  return (
                    <button
                      key={tour.id}
                      type="button"
                      onClick={() => handleBaseTourChange(tour.id)}
                      className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 transition-all ${isSelected
                          ? "border-brand-primary bg-orange-50/40"
                          : "border-slate-200 bg-white"
                        }`}
                    >
                      <span className="block text-sm font-extrabold text-slate-900">{t(`baseTours.${tour.nameKey}` as any)}</span>
                      <span className="block text-[11px] text-slate-500 mt-1 font-medium leading-normal">{t(`baseTours.${tour.descKey}` as any)}</span>
                      {tour.id !== "custom" && (
                        <span className="inline-block mt-3 text-[10px] font-black text-brand-primary bg-orange-100/70 px-2 py-0.5 rounded-md uppercase">
                          {t("baseDays", { duration: tour.duration })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Inline AI Sub-form when AI Suggest is Selected (Active by default) */}
              {selectedTour === "ai-suggested" && (
                <div className="mt-4 p-6 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 text-slate-900 rounded-3xl border border-brand-primary/30 shadow-md space-y-5 animate-fade-in-up">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-brand-primary flex items-center justify-center text-base font-bold border border-orange-200">
                        <ThunderboltOutlined />
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-wide text-slate-900">
                          Configure Your AI Trip Preferences
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Specify your travel dates and desired vibes to generate a tailored Sri Lanka itinerary
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-brand-primary border border-orange-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                      ● AI Assistant Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">{t("dateRangeStart")}</label>
                      <input
                        type="date"
                        value={aiStartDate}
                        onChange={(e) => setAiStartDate(e.target.value)}
                        className="w-full mt-1.5 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">{t("dateRangeEnd")}</label>
                      <input
                        type="date"
                        value={aiEndDate}
                        onChange={(e) => setAiEndDate(e.target.value)}
                        className="w-full mt-1.5 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Trip Duration</label>
                      <div className="mt-1.5 px-3.5 py-2.5 bg-orange-100/70 border border-orange-200 rounded-xl text-xs font-black text-brand-primary text-center flex items-center justify-center gap-1.5 shadow-sm">
                        <CalendarOutlined /> {aiDuration} Days ({aiDuration - 1} Nights)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                      {t("keywordsLabel")}
                    </label>
                    <textarea
                      rows={2}
                      value={aiKeywords}
                      onChange={(e) => setAiKeywords(e.target.value)}
                      placeholder={t("keywordsPlaceholder")}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none transition shadow-sm"
                    />

                    {/* Quick Pick Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick vibes:</span>
                      {QUICK_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            if (!aiKeywords.toLowerCase().includes(chip)) {
                              setAiKeywords((prev) => (prev ? `${prev}, ${chip}` : chip));
                            }
                          }}
                          className="px-3 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-brand-primary text-[10px] font-bold rounded-full transition cursor-pointer shadow-2xs"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleGenerateAIPackage}
                      disabled={isGeneratingAI}
                      className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-orange-500 hover:from-brand-primary/95 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wide"
                    >
                      {isGeneratingAI ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          {t("generatingPackage")}
                        </>
                      ) : (
                        <>
                          <span>⚡</span> {t("generatePackage")}
                        </>
                      )}
                    </button>
                  </div>

                  {aiError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex justify-between items-center">
                      <span>⚠️ {aiError}</span>
                      <button
                        type="button"
                        onClick={handleGenerateAIPackage}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* AI-Suggested Itinerary & Explainable AI Callout Blocks */}
            {aiItinerary && (
              <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 animate-fade-in-up">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <RobotOutlined className="text-brand-primary" />
                    <span>{t("aiItineraryReview")}</span>
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Explainable AI (XAI)
                  </span>
                </div>

                <div className="prose prose-slate max-w-none text-xs font-medium text-slate-700 leading-relaxed space-y-3">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      ul: ({ children }) => <ul className="pl-0 space-y-2.5 my-2.5">{children}</ul>,
                      ol: ({ children }) => <ol className="pl-0 space-y-2.5 my-2.5">{children}</ol>,
                      p: ({ node, children, ...props }) => {
                        const text = getPlainText(children);
                        
                        if (text.includes("Target Route:")) {
                          const parts = text.split("|").map(p => p.trim());
                          const route = parts.find(p => p.startsWith("Target Route:"))?.replace("Target Route:", "")?.trim();
                          const budget = parts.find(p => p.startsWith("Budget Tier:"))?.replace("Budget Tier:", "")?.trim();
                          const duration = parts.find(p => p.startsWith("Duration:"))?.replace("Duration:", "")?.trim();
                          
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/60 border border-slate-200/50 rounded-xl mb-5 text-[11px] font-semibold text-slate-700 shadow-inner">
                              {route && (
                                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs">
                                  <span className="text-teal-500 text-sm"><CompassOutlined /></span>
                                  <div>
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Route Sequence</span>
                                    <span className="text-slate-805 font-bold">{route}</span>
                                  </div>
                                </div>
                              )}
                              {budget && (
                                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs">
                                  <span className="text-emerald-500 text-sm"><DollarOutlined /></span>
                                  <div>
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Budget Tier</span>
                                    <span className="text-slate-805 font-bold">{budget}</span>
                                  </div>
                                </div>
                              )}
                              {duration && (
                                <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-100 shadow-xs">
                                  <span className="text-blue-500 text-sm"><CalendarOutlined /></span>
                                  <div>
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Tour Duration</span>
                                    <span className="text-slate-855 font-bold">{duration}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        if (text.includes("Vibe & Intent:")) {
                          const vibe = text.replace("Vibe & Intent:", "").trim().replace(/^"(.*)"$/, '$1');
                          return (
                            <div className="p-3.5 bg-teal-50/20 border border-teal-100/50 rounded-xl mb-4 text-[11px]">
                              <span className="block text-[8px] font-black text-teal-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <ThunderboltOutlined className="text-teal-500" /> Express Vibe & Intent
                              </span>
                              <span className="italic text-teal-950 font-serif leading-relaxed">"{vibe}"</span>
                            </div>
                          );
                        }

                        if (text.includes("💡 Why This Was Chosen:") || text.includes("Why This Was Chosen:")) {
                          const cleanText = text.replace(/^(💡\s*)?(Why This Was Chosen:\s*)?/i, "").trim();
                          return (
                            <div className="my-3 p-3.5 bg-gradient-to-r from-amber-50/60 to-amber-100/30 border-l-4 border-amber-500 rounded-r-xl text-amber-955 font-medium shadow-xs flex items-start gap-2.5 animate-pulse-subtle">
                              <span className="text-sm mt-0.5 select-none">💡</span>
                              <div>
                                <span className="block text-[9px] font-black text-amber-800 uppercase tracking-wider mb-0.5">XAI Decision Rationale</span>
                                <p className="text-[11px] text-amber-950 leading-relaxed font-semibold">{cleanText}</p>
                              </div>
                            </div>
                          );
                        }

                        if (text.includes("Inter-city transfers across")) {
                          return (
                            <div className="p-4 bg-teal-50/10 border border-teal-100 rounded-2xl shadow-xs flex items-start gap-3 mt-5">
                              <span className="text-lg">🚗</span>
                              <div>
                                <span className="block text-[8px] font-black text-teal-700 uppercase tracking-wider mb-0.5">Transportation & Logistics</span>
                                <p className="text-xs text-teal-900 font-semibold leading-relaxed">{text}</p>
                              </div>
                            </div>
                          );
                        }

                        return <p className="mb-2 text-slate-700 font-medium leading-relaxed" {...props}>{children}</p>;
                      },
                      h1: ({ children }) => {
                        const text = getPlainText(children);
                        if (text.includes("🌴")) {
                          return (
                            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-6 rounded-2xl shadow-sm mb-6 border border-emerald-500/20">
                              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 text-9xl font-black select-none pointer-events-none">🌴</div>
                              <h2 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2 mb-1.5 text-white">
                                {children}
                              </h2>
                              <p className="text-[11px] font-medium m-0 flex items-center gap-1.5">
                                <RobotOutlined className="text-emerald-300" />
                                <span>Tailored using Explainable AI (XAI) for Sri Lankan Eco-tourism</span>
                              </p>
                            </div>
                          );
                        }
                        if (text.includes("📍")) {
                          const cleanText = text.replace(/^(📍\s*)?(Destination:\s*)?/i, "").trim();
                          return (
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5 mt-8 mb-4">
                              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 text-teal-600 text-base shadow-sm border border-teal-100">
                                📍
                              </span>
                              <div>
                                <h3 className="text-sm font-black text-slate-800 leading-tight m-0">
                                  {cleanText}
                                </h3>
                                <span className="text-[9px] font-black text-teal-600 bg-teal-50/50 px-2 py-0.5 rounded tracking-wider uppercase">
                                  Route Destination
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return <h1 className="text-base font-black text-slate-900 border-b border-slate-100 pb-1.5 mt-5 mb-3">{children}</h1>;
                      },
                      h2: ({ children }) => {
                        const text = getPlainText(children);
                        let icon = <CompassOutlined className="text-brand-primary" />;
                        if (text.includes("🏨")) icon = <span>🏨</span>;
                        else if (text.includes("🗓️")) icon = <span>🗓️</span>;
                        else if (text.includes("🚗")) icon = <span>🚗</span>;

                        const cleanText = text.replace(/^(🏨|🗓️|🚗)\s*/, "").trim();

                        return (
                          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mt-6 mb-3 border-b border-slate-100/80 pb-2">
                            {icon}
                            <span>{cleanText}</span>
                          </h3>
                        );
                      },
                      h3: ({ children }) => {
                        const text = getPlainText(children);
                        return (
                          <h4 className="text-xs font-black text-slate-900 mt-5 mb-2 bg-gradient-to-r from-slate-100/60 to-transparent px-3 py-1.5 rounded-lg border-l-4 border-slate-800">
                            {text}
                          </h4>
                        );
                      },
                      h4: ({ children }) => {
                        const text = getPlainText(children);
                        return (
                          <div className="text-xs font-black text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50 inline-flex items-center gap-1.5 mt-5 mb-2 shadow-xs">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {text}
                          </div>
                        );
                      },
                      li: ({ children, ...props }) => {
                        const text = getPlainText(children);

                        if (text.includes("Why This Was Chosen:")) {
                          const cleanText = text.replace(/^(💡\s*)?(Why This Was Chosen:\s*)?/i, "").trim();
                          return (
                            <li className="list-none ml-0 my-2.5">
                              <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-950 font-medium shadow-xs flex items-start gap-2.5">
                                <span className="text-sm mt-0.5 select-none">💡</span>
                                <div>
                                  <span className="block text-[9px] font-black text-amber-800 uppercase tracking-wider mb-0.5">XAI Decision Rationale</span>
                                  <p className="text-[11px] text-amber-955 font-semibold leading-relaxed m-0">{cleanText}</p>
                                </div>
                              </div>
                            </li>
                          );
                        }

                        if (text.startsWith("Rating:")) {
                          const ratingStr = text.replace("Rating:", "").trim();
                          return (
                            <li className="list-none ml-0 my-1 flex items-center gap-1.5 text-xs text-slate-605 font-semibold">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rating</span>
                              <span className="flex items-center gap-1 bg-amber-50/50 px-2 py-0.5 rounded text-amber-700 border border-amber-100">
                                <StarFilled className="text-amber-500 text-[10px]" />
                                {ratingStr}
                              </span>
                            </li>
                          );
                        }

                        if (text.startsWith("Estimated Rate:")) {
                          const priceStr = text.replace("Estimated Rate:", "").trim();
                          return (
                            <li className="list-none ml-0 my-1 flex items-center gap-1.5 text-xs text-slate-605 font-semibold">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Est. Cost</span>
                              <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                {priceStr}
                              </span>
                            </li>
                          );
                        }

                        if (text.startsWith("Overview:") || text.startsWith("Details:")) {
                          const cleanText = text.replace(/^(Overview:|Details:)/, "").trim();
                          return (
                            <li className="list-none ml-0 my-1.5 text-xs text-slate-600 font-medium leading-relaxed">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                                {text.startsWith("Overview:") ? "Overview & Features" : "Description"}
                              </span>
                              <p className="bg-slate-50/30 p-2.5 rounded-lg border border-slate-200/50 text-slate-700 font-medium m-0">{cleanText}</p>
                            </li>
                          );
                        }

                        if (text.startsWith("Visit:")) {
                          const cleanText = text.replace("Visit:", "").trim();
                          return (
                            <li className="list-none ml-0 mt-4 mb-2 text-sm font-black text-slate-900 flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-50 text-teal-600 text-xs shadow-sm border border-teal-100 select-none">
                                🌴
                              </span>
                              <span>{cleanText}</span>
                            </li>
                          );
                        }

                        return <li className="ml-4 list-disc text-slate-600 my-0.5" {...props}>{children}</li>;
                      }
                    }}
                  >
                    {aiItinerary}
                  </ReactMarkdown>
                </div>
              </section>
            )}

            {/* Selectable AI Suggested Places with Real Scraped Pricing */}
            {Object.keys(suggestedPlacesByDestination).length > 0 && (
              <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-in-up">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <SafetyCertificateOutlined className="text-brand-primary" />
                    <span>{t("suggestedPlacesTitle")}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {t("suggestedPlacesDesc")}
                  </p>
                </div>

                {Object.entries(suggestedPlacesByDestination).map(([city, data]) => {
                  const cityHotels = data.hotels || [];
                  const cityPois = data.poi || [];
                  if (cityHotels.length === 0 && cityPois.length === 0) return null;

                  return (
                    <div key={city} className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                          <EnvironmentOutlined className="text-brand-primary" />
                          <span>{city} Recommendations</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                          {cityHotels.length} Hotels & {cityPois.length} Attractions
                        </span>
                      </div>

                      {/* Hotels List */}
                      {cityHotels.length > 0 && (
                        <div className="space-y-2">
                          <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            🏨 AI-Selected Hotels
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cityHotels.map((hotel) => {
                              const isSelected = selectedPlaceIds.includes(String(hotel.id));
                              const defaultCityImg = LOCATIONS.find((l) => l.id === city)?.img || "/images/colombo.png";
                              const displayImg = (hotel.primary_image && !hotel.primary_image.includes("photos.app.goo.gl"))
                                ? hotel.primary_image
                                : defaultCityImg;
                              return (
                                <div
                                  key={hotel.id}
                                  onClick={() => handleToggleSuggestedPlace(hotel, city, true)}
                                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${isSelected
                                      ? "border-brand-primary bg-sky-50/70 shadow-sm"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                  <div>
                                    <div className="w-full h-28 relative rounded-lg overflow-hidden mb-2.5 bg-slate-100 border border-slate-200/50">
                                      <img
                                        src={displayImg}
                                        alt={hotel.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = defaultCityImg;
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className="text-xs font-extrabold text-slate-900 leading-tight">
                                        {hotel.name}
                                      </h5>
                                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                                        ${hotel.avg_nightly_usd}/night
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-amber-600 font-bold block mt-1">
                                      <StarFilled className="mr-1" />
                                      {hotel.rating}/5.0 • {hotel.price_tier}
                                    </span>
                                    {hotel.description && (
                                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 font-medium">
                                        {hotel.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                                    <span className="text-[10px] font-bold text-slate-400">Real Scraped Rate</span>
                                    <span
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${isSelected
                                          ? "bg-brand-primary text-white"
                                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                    >
                                      {isSelected ? t("selectedPlace") : t("selectPlace")}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* POIs List */}
                      {cityPois.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            🏛️ Key Attractions
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cityPois.map((poi) => {
                              const isSelected = selectedPlaceIds.includes(String(poi.id));
                              const defaultCityImg = LOCATIONS.find((l) => l.id === city)?.img || "/images/colombo.png";
                              const isPoiImgFailed = failedPoiImages[String(poi.id)];
                              const displayImg = (poi.primary_image && !poi.primary_image.includes("photos.app.goo.gl") && !isPoiImgFailed)
                                ? poi.primary_image
                                : defaultCityImg;
                              return (
                                <div
                                  key={poi.id}
                                  onClick={() => handleToggleSuggestedPlace(poi, city, false)}
                                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${isSelected
                                      ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                                      : "border-slate-200 bg-white hover:border-slate-300"
                                    }`}
                                >
                                  <div>
                                    <div className="w-full h-28 relative rounded-lg overflow-hidden mb-2.5 bg-slate-100 border border-slate-200/50">
                                      <img
                                        src={displayImg}
                                        alt={poi.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = defaultCityImg;
                                          setFailedPoiImages((prev) => ({ ...prev, [String(poi.id)]: true }));
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                      <h5 className="text-xs font-extrabold text-slate-900 leading-tight">
                                        {poi.name}
                                      </h5>
                                      <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                        {poi.ticket_price_usd > 0 ? `$${poi.ticket_price_usd}` : "Free"}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-amber-600 font-bold block mt-1">
                                      <StarFilled className="mr-1" />
                                      {poi.rating}/5.0
                                    </span>
                                    {poi.description && (
                                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 font-medium">
                                        {poi.description}
                                      </p>
                                    )}
                                    {poi.street_view_url && (
                                      <div className="mt-1">
                                        <a
                                          href={poi.street_view_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:underline"
                                        >
                                          <span>View street view on Mapillary</span> ↗
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                                    <span className="text-[10px] font-bold text-slate-400">Entry Ticket</span>
                                    <span
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${isSelected
                                          ? "bg-emerald-600 text-white"
                                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        }`}
                                    >
                                      {isSelected ? t("selectedPlace") : t("selectPlace")}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* Step 2: Duration & Group Setup */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalendarOutlined className="text-brand-primary" />
                <span>{t("step2")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase">{t("tripDuration")}</label>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, duration: Math.max(1, prev.duration - 1) }))}
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 font-black text-lg flex items-center justify-center hover:bg-slate-200 text-slate-800"
                    >
                      -
                    </button>
                    <span className="text-base font-black text-slate-900 w-16 text-center">
                      {inputs.duration} Days
                    </span>
                    <button
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, duration: prev.duration + 1 }))}
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 font-black text-lg flex items-center justify-center hover:bg-slate-200 text-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase flex items-center gap-1">
                    <UsergroupAddOutlined /> {t("travelersCount")}
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, numberOfTravelers: Math.max(1, prev.numberOfTravelers - 1) }))}
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 font-black text-lg flex items-center justify-center hover:bg-slate-200 text-slate-800"
                    >
                      -
                    </button>
                    <span className="text-base font-black text-slate-900 w-16 text-center">
                      {inputs.numberOfTravelers}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, numberOfTravelers: prev.numberOfTravelers + 1 }))}
                      className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 font-black text-lg flex items-center justify-center hover:bg-slate-200 text-slate-800"
                    >
                      +
                    </button>
                  </div>
                  {inputs.numberOfTravelers >= 4 && (
                    <span className="inline-block mt-2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                      🎉 10% Group Discount Applied
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Step 3: Interactive Route Map & Pins */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <EnvironmentOutlined className="text-brand-primary" />
                  <span>{t("step3")}</span>
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  {t("destinationsSelected", { count: inputs.destinations.length })}
                </span>
              </div>

              <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 z-0">
                <div id="sri-lanka-map" className="w-full h-full" />
              </div>

              {/* Destination Chip List */}
              <div className="flex flex-wrap gap-2 pt-2">
                {LOCATIONS.map((loc) => {
                  const isSelected = inputs.destinations.includes(loc.id);
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleToggleLocation(loc.id)}
                      onMouseEnter={() => setHoveredLocation(loc)}
                      onMouseLeave={() => setHoveredLocation(null)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${isSelected
                          ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <span>{loc.name}</span>
                      {isSelected && <CheckOutlined className="text-[10px]" />}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 4: Accommodation Class */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CoffeeOutlined className="text-brand-primary" />
                <span>{t("step4")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["budget", "standard", "luxury", "premium-boutique"] as const).map((tier) => {
                  const isSelected = inputs.hotelClass === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, hotelClass: tier }))}
                      className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 transition ${isSelected
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-slate-200 bg-white"
                        }`}
                    >
                      <span className="block text-xs font-black text-slate-900 uppercase">
                        {t(`hotelTiers.${tier === "premium-boutique" ? "premiumBoutique" : tier}` as any)}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-bold mt-1">
                        {HOTEL_LABELS[tier]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 5: Logistics & Transport Options */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CarOutlined className="text-brand-primary" />
                <span>{t("step5")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["self-drive", "private-driver", "first-class-train", "charter-flight"] as const).map((mode) => {
                  const isSelected = inputs.transportMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, transportMode: mode }))}
                      className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 transition ${isSelected
                          ? "border-brand-primary bg-orange-50/40"
                          : "border-slate-200 bg-white"
                        }`}
                    >
                      <span className="block text-xs font-black text-slate-900 uppercase">
                        {t(`transportModes.${mode === "self-drive" ? "selfDrive" : mode === "private-driver" ? "privateDriver" : mode === "first-class-train" ? "firstClassTrain" : "charterFlight"}` as any)}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-bold mt-1">
                        {TRANSPORT_LABELS[mode]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Baggage Count Stepper & Pricing Mode Toggle */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase">{t("baggageCount")}</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, baggageCount: Math.max(0, (prev.baggageCount || 0) - 1) }))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-black text-sm flex items-center justify-center hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-slate-900">{t("bags", { count: inputs.baggageCount || 0 })}</span>
                    <button
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, baggageCount: (prev.baggageCount || 0) + 1 }))}
                      className="w-8 h-8 rounded-lg bg-white border border-slate-300 font-black text-sm flex items-center justify-center hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="block text-[10px] text-slate-400 font-medium mt-1">1 bag free per traveler</span>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase">{t("pricingModeLabel")}</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, pricingMode: "per-day" }))}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold text-center transition ${inputs.pricingMode === "per-day"
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "bg-white text-slate-700 border-slate-200"
                        }`}
                    >
                      {t("perDay")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputs((prev) => ({ ...prev, pricingMode: "per-trip" }))}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold text-center transition ${inputs.pricingMode === "per-trip"
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "bg-white text-slate-700 border-slate-200"
                        }`}
                    >
                      {t("perTrip")}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 6: Inclusions & Meal Add-ons Checklist */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CoffeeOutlined className="text-brand-primary" />
                <span>{t("step6")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["breakfast", "dinner"] as const).map((addon) => {
                  const isSelected = inputs.addOns.includes(addon);
                  return (
                    <button
                      key={addon}
                      type="button"
                      onClick={() => handleToggleAddOn(addon)}
                      className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 relative flex items-center justify-between transition ${isSelected
                          ? "border-brand-primary bg-orange-50/30"
                          : "border-slate-200 bg-white"
                        }`}
                    >
                      <div>
                        <span className="block text-xs font-black text-slate-800 uppercase capitalize">{addon}</span>
                        <span className="block text-[10px] text-slate-400 font-bold mt-0.5">{t(`addOnLabels.${addon}` as any)}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border transition ${isSelected
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-white text-transparent border-slate-300"
                          }`}
                      >
                        <CheckOutlined />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

          </div>

          {/* Right Column: Sticky Real-time Pricing Summary (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">

            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest block">
                    {t("liveEstimate")}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{t("tripSummary")}</h3>
                </div>
                <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm">
                  <DollarOutlined />
                </div>
              </div>

              {/* Summary Items list */}
              <div className="mt-4 space-y-3 text-xs font-bold text-slate-700">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 uppercase text-[9px] font-bold">{t("route")}</span>
                  <span className="text-slate-900 font-black text-right max-w-[200px] truncate">
                    {inputs.destinations.join(" → ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
                    <span className="text-slate-400 uppercase text-[9px] font-bold">{t("travelers")}</span>
                    <span className="text-slate-850 font-black">{inputs.numberOfTravelers}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
                    <span className="text-slate-400 uppercase text-[9px] font-bold">{t("totalNights")}</span>
                    <span className="text-slate-850 font-black">{inputs.duration + inputs.extraNights} Nights</span>
                  </div>
                </div>
              </div>

              {/* Dynamic cost breakdown list */}
              <div className="mt-6 border-t border-slate-100 pt-6 space-y-3 text-xs font-semibold text-slate-550">
                <div className="flex justify-between">
                  <span>{t("baseCost", { duration: inputs.duration })}</span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.baseCost)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span>{t("hotelSurcharges", { nights: inputs.duration + inputs.extraNights })}</span>
                    {pricing.hasRealHotelRates && (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {t("aiMatchedRate")}
                      </span>
                    )}
                  </span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.accommodationCost)}</span>
                </div>

                <div className="flex justify-between">
                  <span>{t("transportLogistics")}</span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.transportCost)}</span>
                </div>

                {pricing.baggageSurcharge > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>{t("baggageSurcharge")}</span>
                    <span className="font-bold">+{formatPrice(pricing.baggageSurcharge)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span>{t("destinationTickets", { count: inputs.destinations.length })}</span>
                    {pricing.hasRealPoiCosts && (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {t("aiMatchedRate")}
                      </span>
                    )}
                  </span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.destinationSurcharges + (pricing.hasRealPoiCosts ? pricing.activityCost : 0))}</span>
                </div>

                {pricing.addOnsCost > 0 && (
                  <div className="flex justify-between">
                    <span>{t("mealAddOns")}</span>
                    <span className="text-slate-800 font-bold">{formatPrice(pricing.addOnsCost)}</span>
                  </div>
                )}

                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>{t("groupDiscount", { rate: (pricing.discountRate * 100).toFixed(0) })}</span>
                    <span>-{formatPrice(pricing.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>{t("taxesFees")}</span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.taxes)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="mt-6 border-t border-slate-100 pt-6 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900">{t("totalQuote")}</span>
                <div className="text-right">
                  <span className="text-2xl font-black text-brand-primary">{formatPrice(pricing.totalPrice)}</span>
                  <span className="text-xs text-slate-400 font-bold uppercase ml-1.5">{currency}</span>
                </div>
              </div>

              {/* Checkout Form */}
              <div className="mt-8 border-t border-slate-100 pt-6 space-y-4">

                {/* Preferred Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase flex items-center gap-1.5">
                    <CalendarOutlined /> {t("departureDate")}
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={preferredStartDate}
                    onChange={(e) => setPreferredStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary text-xs font-semibold cursor-pointer"
                  />
                  {errors.preferredStartDate && (
                    <span className="text-red-500 text-xs font-black">{errors.preferredStartDate}</span>
                  )}
                </div>

                {/* Traveler Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase">
                    {t("travelerPreferences")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t("placeholderPreferences")}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-primary text-xs font-semibold resize-none"
                  />
                </div>

                {sessionStatus !== "authenticated" && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-2 text-amber-700 text-left text-[11px] leading-normal">
                    <InfoCircleOutlined className="text-sm mt-0.5" />
                    <span>{t("planningAsGuest")}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-xl text-white font-black text-xs transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${sessionStatus !== "authenticated"
                      ? "bg-amber-600 hover:bg-amber-500"
                      : "bg-slate-900 hover:bg-slate-800"
                    }`}
                >
                  {isSubmitting
                    ? t("savingQuote")
                    : sessionStatus !== "authenticated"
                      ? t("signInSubmit")
                      : t("submitCustom")}
                </button>
              </div>

            </section>
          </div>

        </div>

      </div>
    </div>
  );
}

// Added premium micro-interactions and map routing logic
