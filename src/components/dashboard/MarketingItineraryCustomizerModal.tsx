"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseOutlined,
  CompassOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  FilePdfOutlined,
  CarOutlined,
  ThunderboltOutlined,
  CoffeeOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import { useTenant } from "@/context/TenantBrandingContext";

interface ItineraryDay {
  dayNumber: number;
  destination: string;
  activities: string;
  hotelTier: string;
  mealPlan: string;
  estimatedCost: number;
}

interface MarketingItineraryCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onConvertToQuotation?: (itineraryData: any) => void;
}

const POPULAR_DESTINATIONS = [
  { name: "Sigiriya", image: "/images/sigiriya.png", desc: "Lion Rock Fortress & Dambulla Caves" },
  { name: "Kandy", image: "/images/kandy.png", desc: "Temple of the Tooth & Botanical Gardens" },
  { name: "Ella", image: "/images/nine_arch.png", desc: "Nine Arch Bridge & Little Adam's Peak" },
  { name: "Nuwara Eliya", image: "/images/tea.png", desc: "Tea Plantations & Misty Highlands" },
  { name: "Yala", image: "/images/yala.png", desc: "Leopard Safari & Glamping" },
  { name: "Mirissa", image: "/images/mirissa.png", desc: "Golden Coast & Whale Watching" },
  { name: "Galle", image: "/images/galle.png", desc: "UNESCO Dutch Fort & Ramparts" },
  { name: "Colombo", image: "/images/colombo.png", desc: "Capital City, Cuisine & Lotus Tower" },
];

export default function MarketingItineraryCustomizerModal({
  isOpen,
  onClose,
  initialData,
  onConvertToQuotation,
}: MarketingItineraryCustomizerModalProps) {
  const tenant = useTenant();
  const primaryColor = tenant?.branding?.primaryColor || "#FF8B50";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const [guestName, setGuestName] = useState(initialData?.customerName || "Valued Traveler");
  const [tourTitle, setTourTitle] = useState(initialData?.packageName || "Bespoke Sri Lanka Journey");
  const [vehicleType, setVehicleType] = useState(initialData?.vehicleType || "Private AC Luxury Van");
  const [travelers, setTravelers] = useState(initialData?.numberOfTravelers || 2);

  const [days, setDays] = useState<ItineraryDay[]>([
    {
      dayNumber: 1,
      destination: "Colombo / Negombo",
      activities: "Airport welcome, transfer to coastal hotel, lagoon boat ride & relaxation",
      hotelTier: "4-Star Beach Resort",
      mealPlan: "Bed & Breakfast",
      estimatedCost: 140,
    },
    {
      dayNumber: 2,
      destination: "Sigiriya",
      activities: "Climb UNESCO Sigiriya Rock Fortress, village bullock cart tour & Ayurvedic spa",
      hotelTier: "4-Star Eco Lodge",
      mealPlan: "Half Board (Breakfast + Dinner)",
      estimatedCost: 175,
    },
    {
      dayNumber: 3,
      destination: "Kandy",
      activities: "Dambulla Golden Cave Temple, spice garden tour, Temple of the Tooth ceremony",
      hotelTier: "4-Star Hillside Hotel",
      mealPlan: "Half Board",
      estimatedCost: 160,
    },
    {
      dayNumber: 4,
      destination: "Ella",
      activities: "Scenic highland train ride through misty tea hills, Nine Arch Bridge photography",
      hotelTier: "4-Star Mountain View Resort",
      mealPlan: "Bed & Breakfast",
      estimatedCost: 180,
    },
    {
      dayNumber: 5,
      destination: "Yala National Park",
      activities: "Dawn 4x4 wildlife safari tracking leopards, wild elephants, and sloth bears",
      hotelTier: "4-Star Safari Glamping",
      mealPlan: "Full Board",
      estimatedCost: 230,
    },
    {
      dayNumber: 6,
      destination: "Mirissa / Galle",
      activities: "Coastal sunset, Galle Dutch Fort ramparts walk, turtle conservation hatchery",
      hotelTier: "4-Star Oceanfront Boutique",
      mealPlan: "Bed & Breakfast",
      estimatedCost: 155,
    },
  ]);

  const handleAddDay = (destName?: string) => {
    const nextDayNum = days.length + 1;
    const dest = destName || "South Coast Beach";
    setDays([
      ...days,
      {
        dayNumber: nextDayNum,
        destination: dest,
        activities: `Tailored leisure and excursions in ${dest}`,
        hotelTier: "4-Star Premium",
        mealPlan: "Bed & Breakfast",
        estimatedCost: 150,
      },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) return;
    const updated = days
      .filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, dayNumber: i + 1 }));
    setDays(updated);
  };

  const handleUpdateDay = (index: number, field: keyof ItineraryDay, val: any) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: val };
    setDays(updated);
  };

  // Calculations
  const totalItineraryDays = days.length;
  const totalBaseCost = days.reduce((sum, d) => sum + (Number(d.estimatedCost) || 0), 0);
  const vehicleCost = totalItineraryDays * 85;
  const estimatedTourTotal = totalBaseCost + vehicleCost;

  const handleConvert = () => {
    const lineItems = days.map((d) => ({
      title: `Day ${d.dayNumber}: ${d.destination} Tour`,
      description: `${d.activities} (${d.hotelTier}, ${d.mealPlan})`,
      quantity: 1,
      unitPrice: d.estimatedCost,
    }));

    lineItems.unshift({
      title: `${vehicleType} & Chauffeur (${totalItineraryDays} Days)`,
      description: "Dedicated transport with fuel, highway tolls & driver daily allowance",
      quantity: 1,
      unitPrice: vehicleCost,
    });

    const itineraryPackage = {
      customerName: guestName,
      packageName: tourTitle,
      duration: `${totalItineraryDays} Days / ${Math.max(1, totalItineraryDays - 1)} Nights`,
      destinations: days.map((d) => d.destination).join(", "),
      numberOfTravelers: travelers,
      hotelTier: "4-Star Premium",
      transportMode: vehicleType,
      lineItems,
      notes: `Customized Day-by-Day itinerary configured for ${guestName}.`,
    };

    if (onConvertToQuotation) {
      onConvertToQuotation(itineraryPackage);
    }
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-200 text-left"
        >
          {/* Executive Header - Glass Shaded with Tenant Primary Color */}
          <div
            className="relative overflow-hidden px-7 py-5 flex justify-between items-center border-b border-white/60 backdrop-blur-2xl"
            style={{
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.6) 50%, ${primaryColor}18 100%)`,
            }}
          >
            {/* Ambient Radial Glow with primaryColor */}
            <div
              className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-2xl pointer-events-none opacity-30"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full blur-2xl pointer-events-none opacity-20"
              style={{ backgroundColor: primaryColor }}
            />

            <div className="flex items-center gap-3.5 relative z-10">
              <div
                className="h-10 w-10 rounded-xl border flex items-center justify-center text-lg font-bold shadow-sm"
                style={{
                  backgroundColor: `${primaryColor}18`,
                  borderColor: `${primaryColor}35`,
                  color: primaryColor,
                }}
              >
                <CompassOutlined />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">Itinerary Customization Terminal</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Design bespoke day-by-day routes and compute net tour costs
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-white/80 text-slate-400 hover:text-slate-800 flex items-center justify-center transition relative z-10 shadow-sm border border-slate-200/50"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6 max-h-[82vh] overflow-y-auto text-slate-800">
            {/* Top Config Controls */}
            <div className="grid sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Guest / Traveler Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tour Journey Title
                </label>
                <input
                  type="text"
                  value={tourTitle}
                  onChange={(e) => setTourTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Dedicated Transit
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                >
                  <option value="Private AC Sedan">Private AC Sedan</option>
                  <option value="Private AC Luxury Van">Private AC Luxury Van</option>
                  <option value="Luxury SUV 4x4">Luxury SUV 4x4</option>
                  <option value="Mini Coach 15-Seater">Mini Coach 15-Seater</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Guests (Pax)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={travelers}
                  onChange={(e) => setTravelers(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                />
              </div>
            </div>

            {/* Quick Destination Picker Palette */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Quick-Append Destinations
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  Click to add a day to the itinerary
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {POPULAR_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => handleAddDay(dest.name)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition flex flex-col items-center text-center group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden relative shadow-sm mb-1.5">
                      <Image
                        src={dest.image}
                        alt={dest.name}
                        fill
                        className="object-cover group-hover:scale-110 transition duration-300"
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
                      {dest.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Day-by-day Itinerary Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CalendarOutlined className="text-slate-700" />
                  Day-by-Day Journey Schedule ({days.length} Days / {Math.max(1, days.length - 1)} Nights)
                </h3>
                <button
                  type="button"
                  onClick={() => handleAddDay()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                >
                  <PlusOutlined /> Add Custom Day
                </button>
              </div>

              <div className="space-y-2.5">
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs">
                          {day.dayNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <EnvironmentOutlined className="text-slate-400 text-xs" />
                          <input
                            type="text"
                            value={day.destination}
                            onChange={(e) => handleUpdateDay(idx, "destination", e.target.value)}
                            className="text-xs font-black text-slate-900 border-b border-dashed border-slate-300 focus:border-slate-900 outline-none px-1"
                            placeholder="Destination"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400">Est. Net Cost:</span>
                          <span className="text-xs font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            value={day.estimatedCost}
                            onChange={(e) =>
                              handleUpdateDay(idx, "estimatedCost", Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs font-extrabold text-right focus:border-slate-900 outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDay(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition text-xs"
                          title="Remove Day"
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-[1.5fr_1fr_1fr] gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Key Excursions & Activities
                        </label>
                        <input
                          type="text"
                          value={day.activities}
                          onChange={(e) => handleUpdateDay(idx, "activities", e.target.value)}
                          placeholder="e.g. Visit Temple of the Tooth, stroll around lake..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Overnight Stay Tier
                        </label>
                        <input
                          type="text"
                          value={day.hotelTier}
                          onChange={(e) => handleUpdateDay(idx, "hotelTier", e.target.value)}
                          placeholder="4-Star Premium Hotel"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Meal Plan
                        </label>
                        <select
                          value={day.mealPlan}
                          onChange={(e) => handleUpdateDay(idx, "mealPlan", e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 outline-none"
                        >
                          <option value="Room Only">Room Only</option>
                          <option value="Bed & Breakfast">Bed & Breakfast</option>
                          <option value="Half Board (Breakfast + Dinner)">Half Board</option>
                          <option value="Full Board (All Meals)">Full Board</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculation & Action Dock */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Total Custom Tour Estimate
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-white">
                    ${estimatedTourTotal.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    (${Math.round(estimatedTourTotal / Math.max(1, travelers))}/person for {travelers} pax)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Includes {totalItineraryDays} days stays, activities, & dedicated {vehicleType}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleConvert}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs shadow-md transition"
                >
                  <FilePdfOutlined />
                  Build Quotation PDF &rarr;
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>,
  document.body
  );
}
