"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useCurrency } from "@/context/CurrencyContext";
import {
  calculateTripPricing,
  PricingInputs,
} from "@/lib/pricingEngine";
import { useToast } from "@/context/ToastContext";
import {
  CheckOutlined,
  CalendarOutlined,
  TeamOutlined,
  CompassOutlined,
  InfoCircleOutlined,
  CoffeeOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  img: string;
  desc: string;
}

const LOCATIONS: MapLocation[] = [
  { id: "Colombo", name: "Colombo", lat: 6.9271, lng: 79.8612, img: "/images/colombo.png", desc: "Capital city, shopping, and coastal walk." },
  { id: "Bentota", name: "Bentota", lat: 6.4200, lng: 79.9997, img: "/images/bentota.png", desc: "Golden beaches, water sports, and river safaris." },
  { id: "Galle", name: "Galle Fort", lat: 6.0535, lng: 80.2117, img: "/images/galle.png", desc: "UNESCO colonial fort and boutique shops." },
  { id: "Yala", name: "Yala National Park", lat: 6.3692, lng: 81.5178, img: "/images/yala.png", desc: "Leopard safaris and dry-zone forests." },
  { id: "Ella", name: "Ella", lat: 6.8724, lng: 81.0518, img: "/images/nine_arch.png", desc: "Nine Arch Bridge, tea plantations & hikes." },
  { id: "Nuwara Eliya", name: "Nuwara Eliya", lat: 6.9497, lng: 80.7891, img: "/images/tea.png", desc: "Cool misty hills and tea estate valleys." },
  { id: "Kandy", name: "Kandy", lat: 7.2906, lng: 80.6337, img: "/images/kandy.png", desc: "Sacred Temple of the Tooth Relic." },
  { id: "Sigiriya", name: "Sigiriya", lat: 7.9570, lng: 80.7603, img: "/images/sigiriya.png", desc: "Ancient 5th-century rock fortress." },
  { id: "Dambulla", name: "Dambulla", lat: 7.8742, lng: 80.6511, img: "/images/dambulla.png", desc: "Stunning gold rock cave temples." },
];

const BASE_TOURS = [
  {
    id: "cultural-triangle",
    nameKey: "cultural",
    descKey: "culturalDesc",
    duration: 5,
    destinations: ["Colombo", "Dambulla", "Sigiriya", "Kandy"],
  },
  {
    id: "southern-beach",
    nameKey: "southern",
    descKey: "southernDesc",
    duration: 6,
    destinations: ["Colombo", "Bentota", "Galle", "Yala"],
  },
  {
    id: "hill-country",
    nameKey: "hill",
    descKey: "hillDesc",
    duration: 6,
    destinations: ["Kandy", "Nuwara Eliya", "Ella", "Galle"],
  },
  {
    id: "custom",
    nameKey: "custom",
    descKey: "customDesc",
    duration: 7,
    destinations: ["Colombo"],
  },
];

export default function InteractiveTourCustomizer() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("CustomizeTour");
  const { formatPrice, currency } = useCurrency();
  const { addToast } = useToast();

  // Inputs state
  const [selectedTour, setSelectedTour] = useState<string>("custom");
  const [inputs, setInputs] = useState<PricingInputs>({
    duration: 7,
    numberOfTravelers: 2,
    destinations: ["Colombo"],
    hotelClass: "standard",
    transportMode: "private-driver",
    season: "shoulder",
    activities: [],
    extraNights: 0,
    addOns: ["breakfast"],
  });

  const [preferredStartDate, setPreferredStartDate] = useState<string>("");
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [hoveredLocation, setHoveredLocation] = useState<MapLocation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        desc.className = "text-[10px] text-slate-500 leading-snug font-medium";
        desc.innerText = loc.desc;

        const btn = document.createElement("button");
        btn.className = "mt-2 py-1.5 w-full bg-slate-900 text-white rounded-lg font-bold text-[10px] uppercase text-center hover:bg-slate-800 transition select-none cursor-pointer";
        btn.innerText = t("addToRoute");

        popupContent.appendChild(imgContainer);
        popupContent.appendChild(title);
        popupContent.appendChild(desc);
        popupContent.appendChild(btn);

        const marker = L.marker([loc.lat, loc.lng])
          .addTo(map)
          .bindPopup(popupContent);

        marker.on("mouseover", () => {
          setHoveredLocation(loc);
        });

        markers[loc.id] = marker;
      });
      markersRef.current = markers;

      const polyline = L.polyline([], {
        color: "#FF8B50",
        weight: 4,
        dashArray: "5, 10",
      }).addTo(map);
      polylineRef.current = polyline;

      setMapLoaded(true);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        polylineRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // Sync React state changes to Leaflet layers dynamically
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

  // Submit customized booking
  const handleSubmitBooking = async () => {
    if (!validateForm()) {
      addToast("error", t("correctErrors"));
      return;
    }

    if (sessionStatus !== "authenticated") {
      try {
        sessionStorage.setItem(
          "tour_customizer_draft",
          JSON.stringify({ inputs, preferredStartDate, specialRequests, selectedTour })
        );
      } catch (e) {
        console.warn("Failed to store customizer state draft:", e);
      }

      addToast("info", t("redirectLogin"));
      router.push(`/${locale}/login?callbackUrl=/${locale}/customize-tour`);
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedBaseTour = BASE_TOURS.find((t) => t.id === selectedTour);
      const packageName = selectedBaseTour
        ? `Customized ${t(`baseTours.${selectedBaseTour.nameKey}` as any)}`
        : t("baseTours.custom");

      const payload = {
        packageId: selectedTour === "custom" ? "" : selectedTour,
        packageName,
        numberOfTravelers: inputs.numberOfTravelers,
        preferredStartDate,
        specialRequests,
        pricingInputs: inputs,
        submittedTotal: pricing.totalPrice,
      };

      const res = await fetch("/api/travel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to submit customized request.");
      }

      setSubmitSuccess(true);
      addToast("success", t("customizedTourSaved"));
      sessionStorage.removeItem("tour_customizer_draft");
    } catch (err) {
      console.error(err);
      addToast("error", err instanceof Error ? err.message : "Submission error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xl space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500/30 text-emerald-500 flex items-center justify-center text-3xl">
            <CheckOutlined />
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">{t("itinerarySaved")}</h2>
          <p className="text-slate-550 text-sm leading-relaxed">
            {t("savedDesc")}
          </p>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <button
              onClick={() => router.push(`/${locale}/dashboard/my-requests`)}
              className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all"
            >
              {t("viewDashboardRequests")}
            </button>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="py-3 px-6 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all"
            >
              {t("configureAnother")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedLocs = inputs.destinations
    .map((destId) => LOCATIONS.find((loc) => loc.id === destId))
    .filter((loc): loc is MapLocation => !!loc);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-sky-50/20 to-indigo-50/30 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10 text-left">
        
        {/* Title Block */}
        <div className="space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-brand-primary">
            {t("subtitle")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none animate-fade-in-up">
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm max-w-xl font-semibold animate-fade-in-up">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
          
          {/* Configurator Controls */}
          <div className="space-y-8">
            
            {/* Base Tour Selection */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <CompassOutlined className="text-brand-secondary" />
                <span>{t("step1")}</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {BASE_TOURS.map((tour) => {
                  const isSelected = selectedTour === tour.id;
                  return (
                    <button
                      key={tour.id}
                      onClick={() => handleBaseTourChange(tour.id)}
                      className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 transition-all ${
                        isSelected
                          ? "border-brand-secondary bg-sky-50/35"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="block text-sm font-extrabold text-slate-900">{t(`baseTours.${tour.nameKey}` as any)}</span>
                      <span className="block text-[11px] text-slate-500 mt-1 font-medium leading-normal">{t(`baseTours.${tour.descKey}` as any)}</span>
                      {tour.id !== "custom" && (
                        <span className="inline-block mt-3 text-[10px] font-black text-brand-secondary bg-sky-100/50 px-2 py-0.5 rounded-md uppercase">
                          {t("baseDays", { duration: tour.duration })}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Leaflet Live Map Integration */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-baseline">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <EnvironmentOutlined className="text-brand-secondary" />
                    <span>{t("step2")}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{t("mapInstruction")}</p>
                </div>
                <span className="text-xs font-black text-slate-400 uppercase">{t("citiesSelected", { count: inputs.destinations.length })}</span>
              </div>

              <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
                
                <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-sky-50/30">
                  <div id="sri-lanka-map" className="w-full h-full z-10" />
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 h-48 flex flex-col justify-between relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {hoveredLocation ? (
                        <motion.div
                          key={hoveredLocation.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="h-full flex flex-col justify-between"
                        >
                          <div className="flex gap-3">
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                              <Image
                                src={hoveredLocation.img}
                                alt={hoveredLocation.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">{hoveredLocation.name}</h4>
                              <p className="text-[10px] text-slate-500 font-semibold leading-snug mt-1">{hoveredLocation.desc}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest mt-2">
                            {t("clickPinEdit")}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="h-full flex flex-col justify-center items-center text-center text-slate-400 space-y-2 p-4"
                        >
                          <EnvironmentOutlined className="text-xl" />
                          <p className="text-xs font-semibold leading-normal">{t("hoverPin")}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t("activeRoute")}</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                      {selectedLocs.map((loc, idx) => (
                        <div
                          key={loc.id}
                          className="flex items-center bg-sky-50 border border-sky-100 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                        >
                          <span className="text-brand-secondary text-[10px] font-bold mr-1.5">{idx + 1}</span>
                          <span>{loc.name}</span>
                          <button
                            onClick={() => handleToggleLocation(loc.id)}
                            className="ml-1.5 text-slate-400 hover:text-slate-650"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Sliders for Travelers & Extra Nights */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <TeamOutlined className="text-brand-secondary" />
                <span>{t("step3")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
                
                {/* Travelers Headcount */}
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">{t("travelersCount")}</label>
                    <span className="text-base font-black text-brand-primary">{t("guests", { count: inputs.numberOfTravelers })}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={inputs.numberOfTravelers}
                    onChange={(e) => setInputs((prev) => ({ ...prev, numberOfTravelers: parseInt(e.target.value) || 1 }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>{t("guest")}</span>
                    <span>{t("guests", { count: 10 })}</span>
                    <span>{t("guests", { count: 20 })}</span>
                  </div>
                </div>

                {/* Extra Nights */}
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">{t("extraNights")}</label>
                    <span className="text-base font-black text-brand-primary">{t("nights", { count: inputs.extraNights })}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={14}
                    value={inputs.extraNights}
                    onChange={(e) => setInputs((prev) => ({ ...prev, extraNights: parseInt(e.target.value) || 0 }))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                    <span>{t("zeroNights")}</span>
                    <span>{t("nights", { count: 7 })}</span>
                    <span>{t("nights", { count: 14 })}</span>
                  </div>
                </div>

              </div>
            </section>

            {/* Hotel Class */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CompassOutlined className="text-brand-secondary" />
                <span>{t("step4")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["budget", "standard", "luxury", "premium-boutique"] as const).map((tier) => {
                  const isSelected = inputs.hotelClass === tier;
                  const tierKey = tier === "premium-boutique" ? "premiumBoutique" : tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setInputs((prev) => ({ ...prev, hotelClass: tier }))}
                      className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 transition-all ${
                        isSelected
                          ? "border-brand-secondary bg-sky-50/30"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="block text-xs font-black text-slate-800 uppercase tracking-wider capitalize">{tier.replace("-", " ")}</span>
                      <span className="block text-[10px] font-black text-brand-secondary uppercase mt-0.5">{t(`hotelTiers.${tierKey}` as any)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Transportation */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CompassOutlined className="text-brand-secondary" />
                <span>{t("step5")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["self-drive", "private-driver", "first-class-train", "charter-flight"] as const).map((mode) => {
                  const isSelected = inputs.transportMode === mode;
                  const modeKey = mode === "self-drive" ? "selfDrive" : mode === "private-driver" ? "privateDriver" : mode === "first-class-train" ? "firstClassTrain" : "charterFlight";
                  return (
                    <button
                      key={mode}
                      onClick={() => setInputs((prev) => ({ ...prev, transportMode: mode }))}
                      className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 transition-all ${
                        isSelected
                          ? "border-brand-secondary bg-sky-50/30"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="block text-xs font-black text-slate-800 uppercase tracking-wider capitalize">{mode.replace("-", " ")}</span>
                      <span className="block text-[10px] font-black text-brand-secondary uppercase mt-0.5">{t(`transportModes.${modeKey}` as any)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Inclusions & Meal Add-ons Checklist */}
            <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CoffeeOutlined className="text-brand-secondary" />
                <span>{t("step6")}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["breakfast", "dinner"] as const).map((addon) => {
                  const isSelected = inputs.addOns.includes(addon);
                  return (
                    <button
                      key={addon}
                      onClick={() => handleToggleAddOn(addon)}
                      className={`p-4 rounded-2xl border text-left hover:bg-slate-50/50 relative flex items-center justify-between transition ${
                        isSelected
                          ? "border-brand-secondary bg-sky-50/30"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div>
                        <span className="block text-xs font-black text-slate-800 uppercase capitalize">{addon}</span>
                        <span className="block text-[10px] text-slate-400 font-bold mt-0.5">{t(`addOnLabels.${addon}` as any)}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border transition ${
                          isSelected
                            ? "bg-brand-secondary text-white border-brand-secondary"
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

          {/* Checkout & Costs Summary Panel */}
          <div className="sticky top-24 space-y-6">
            <section className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand-primary" />

              <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">
                {t("summaryTitle")}
              </h3>

              {/* Selection Summary details */}
              <div className="space-y-4 pt-2">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs font-semibold space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase text-[9px] font-bold">{t("baseSelected")}</span>
                    <span className="text-slate-850 font-black">
                      {(() => {
                        const tour = BASE_TOURS.find((t) => t.id === selectedTour);
                        return tour ? t(`baseTours.${tour.nameKey}` as any) : t("baseTours.custom");
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase text-[9px] font-bold">{t("totalNights")}</span>
                    <span className="text-slate-850 font-black">{inputs.duration + inputs.extraNights} Nights</span>
                  </div>
                </div>
              </div>

              {/* Dynamic cost list */}
              <div className="mt-6 border-t border-slate-100 pt-6 space-y-3 text-xs font-semibold text-slate-550">
                <div className="flex justify-between">
                  <span>{t("baseCost", { duration: inputs.duration })}</span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.baseCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("hotelSurcharges", { nights: inputs.duration + inputs.extraNights })}</span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.accommodationCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("transportLogistics")}</span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.transportCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("destinationTickets", { count: inputs.destinations.length })}</span>
                  <span className="text-slate-800 font-bold">{formatPrice(pricing.destinationSurcharges)}</span>
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
                  <span className="text-2xl font-black text-brand-secondary">{formatPrice(pricing.totalPrice)}</span>
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-secondary text-xs font-semibold cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-secondary text-xs font-semibold resize-none"
                  />
                </div>

                {sessionStatus !== "authenticated" && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-2 text-amber-700 text-left text-[11px] leading-normal">
                    <InfoCircleOutlined className="text-sm mt-0.5" />
                    <span>{t("planningAsGuest")}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-xl text-white font-black text-xs transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    sessionStatus !== "authenticated"
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
