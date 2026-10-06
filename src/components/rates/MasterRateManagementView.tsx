/* Master Rates UI Pass: Top 4 KPI Metrics & Segmented Pill Tabs */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CompassOutlined,
  CarOutlined,
  DollarOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  TagOutlined,
  CalculatorOutlined,
  CheckOutlined,
} from "@ant-design/icons";

interface MasterRateManagementViewProps {
  showBackButton?: boolean;
}

export default function MasterRateManagementView({
  showBackButton = false,
}: MasterRateManagementViewProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<
    "attractions" | "vehicles" | "currency" | "seasons"
  >("attractions");
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [data, setData] = useState<{
    attractions: any[];
    vehicles: any[];
    currencies: any[];
    seasons: any[];
    hotels: any[];
  }>({
    attractions: [],
    vehicles: [],
    currencies: [],
    seasons: [],
    hotels: [],
  });

  // Filter & Search states
  const [attractionSearch, setAttractionSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Modal states
  const [isAttractionModalOpen, setIsAttractionModalOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<any>(null);
  const [attractionForm, setAttractionForm] = useState({
    locationName: "",
    city: "",
    category: "Heritage",
    localLKR: 100,
    saarcLKR: 2000,
    foreignLKR: 3000,
    childDiscountPercent: 50,
    notes: "",
    isCustom: false,
  });

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleCategory: "Sedan",
    name: "",
    dailyRateLKR: 15000,
    dailyRateUSD: 50,
    includedKmPerDay: 100,
    excessRatePerKmLKR: 120,
    excessRatePerKmUSD: 0.4,
    driverDailyBataLKR: 3500,
    maxPassengers: 3,
    description: "",
  });

  // Currency form state
  const [currencySettings, setCurrencySettings] = useState({
    liveRate: 304.85,
    peggedRate: 305.0,
    usePegged: false,
    forexBufferPercent: 2.5,
  });
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  // Live Simulator state
  const [simUsdAmount, setSimUsdAmount] = useState<number>(1000);

  // Fetch all rates
  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/rates");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);

        // Pre-fill currency settings
        const usdLkr = json.data.currencies?.find(
          (c: any) => c.baseCurrency === "USD" && c.targetCurrency === "LKR"
        );
        if (usdLkr) {
          setCurrencySettings({
            liveRate: usdLkr.liveRate || 304.85,
            peggedRate: usdLkr.peggedRate || 305.0,
            usePegged: !!usdLkr.usePegged,
            forexBufferPercent: usdLkr.forexBufferPercent ?? 2.5,
          });
        }
      } else {
        showToast("error", json.error || "Failed to load master rates");
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Network error fetching master rates");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchRates();
    } else if (status === "unauthenticated") {
      router.push(`/${locale}/login`);
    }
  }, [status, locale]);

  // Handle Save Attraction
  const handleSaveAttraction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        _id: editingAttraction?._id,
        locationName: attractionForm.locationName,
        city: attractionForm.city,
        category: attractionForm.category,
        rates: {
          localLKR: Number(attractionForm.localLKR),
          saarcLKR: Number(attractionForm.saarcLKR),
          foreignLKR: Number(attractionForm.foreignLKR),
          childDiscountPercent: Number(attractionForm.childDiscountPercent) || 50,
        },
        notes: attractionForm.notes,
        isCustom: attractionForm.isCustom,
      };

      const res = await fetch("/api/admin/rates/attraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Attraction tariff saved successfully!");
        setIsAttractionModalOpen(false);
        fetchRates();
      } else {
        showToast("error", json.error || "Failed to save attraction tariff");
      }
    } catch (err) {
      showToast("error", "Error saving attraction tariff");
    }
  };

  // Open Attraction Modal
  const handleOpenAttractionModal = (attraction?: any) => {
    if (attraction) {
      setEditingAttraction(attraction);
      setAttractionForm({
        locationName: attraction.locationName || "",
        city: attraction.city || "",
        category: attraction.category || "Heritage",
        localLKR: attraction.rates?.localLKR ?? 100,
        saarcLKR: attraction.rates?.saarcLKR ?? 2000,
        foreignLKR: attraction.rates?.foreignLKR ?? 3000,
        childDiscountPercent: attraction.rates?.childDiscountPercent ?? 50,
        notes: attraction.notes || "",
        isCustom: !!attraction.isCustom,
      });
    } else {
      setEditingAttraction(null);
      setAttractionForm({
        locationName: "",
        city: "",
        category: "Heritage",
        localLKR: 100,
        saarcLKR: 2000,
        foreignLKR: 3000,
        childDiscountPercent: 50,
        notes: "",
        isCustom: false,
      });
    }
    setIsAttractionModalOpen(true);
  };

  // Handle Save Vehicle Package
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        _id: editingVehicle?._id,
        ...vehicleForm,
        dailyRateLKR: Number(vehicleForm.dailyRateLKR),
        dailyRateUSD: Number(vehicleForm.dailyRateUSD),
        includedKmPerDay: Number(vehicleForm.includedKmPerDay),
        excessRatePerKmLKR: Number(vehicleForm.excessRatePerKmLKR),
        excessRatePerKmUSD: Number(vehicleForm.excessRatePerKmUSD),
        driverDailyBataLKR: Number(vehicleForm.driverDailyBataLKR),
        maxPassengers: Number(vehicleForm.maxPassengers),
      };

      const res = await fetch("/api/admin/rates/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Vehicle pricing package saved successfully!");
        setIsVehicleModalOpen(false);
        fetchRates();
      } else {
        showToast("error", json.error || "Failed to save vehicle package");
      }
    } catch (err) {
      showToast("error", "Error saving vehicle package");
    }
  };

  // Open Vehicle Modal
  const handleOpenVehicleModal = (veh?: any) => {
    if (veh) {
      setEditingVehicle(veh);
      setVehicleForm({
        vehicleCategory: veh.vehicleCategory || "Sedan",
        name: veh.name || "",
        dailyRateLKR: veh.dailyRateLKR ?? 15000,
        dailyRateUSD: veh.dailyRateUSD ?? 50,
        includedKmPerDay: veh.includedKmPerDay ?? 100,
        excessRatePerKmLKR: veh.excessRatePerKmLKR ?? 120,
        excessRatePerKmUSD: veh.excessRatePerKmUSD ?? 0.4,
        driverDailyBataLKR: veh.driverDailyBataLKR ?? 3500,
        maxPassengers: veh.maxPassengers ?? 3,
        description: veh.description || "",
      });
    } else {
      setEditingVehicle(null);
      setVehicleForm({
        vehicleCategory: "Sedan",
        name: "",
        dailyRateLKR: 15000,
        dailyRateUSD: 50,
        includedKmPerDay: 100,
        excessRatePerKmLKR: 120,
        excessRatePerKmUSD: 0.4,
        driverDailyBataLKR: 3500,
        maxPassengers: 3,
        description: "",
      });
    }
    setIsVehicleModalOpen(true);
  };

  // Handle Save Currency
  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingCurrency(true);
      const res = await fetch("/api/admin/rates/currency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseCurrency: "USD",
          targetCurrency: "LKR",
          liveRate: Number(currencySettings.liveRate),
          peggedRate: Number(currencySettings.peggedRate),
          usePegged: currencySettings.usePegged,
          forexBufferPercent: Number(currencySettings.forexBufferPercent),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Forex settings & volatility buffer updated!");
        fetchRates();
      } else {
        showToast("error", json.error || "Failed to update currency settings");
      }
    } catch (err) {
      showToast("error", "Error saving currency settings");
    } finally {
      setIsSavingCurrency(false);
    }
  };

  // Filtered Attractions
  const filteredAttractions = useMemo(() => {
    return (data.attractions || []).filter((item) => {
      const matchSearch =
        item.locationName?.toLowerCase().includes(attractionSearch.toLowerCase()) ||
        item.city?.toLowerCase().includes(attractionSearch.toLowerCase());
      const matchCategory =
        selectedCategory === "all"
          ? true
          : selectedCategory === "custom"
          ? item.isCustom
          : item.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [data.attractions, attractionSearch, selectedCategory]);

  // Effective exchange rate calculations
  const effectiveBaseRate = currencySettings.usePegged
    ? currencySettings.peggedRate
    : currencySettings.liveRate;
  const effectiveQuotingRate =
    effectiveBaseRate * (1 + currencySettings.forexBufferPercent / 100);

  return (
    <div className="space-y-8 text-left pb-16 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-3 backdrop-blur-md ${
              feedbackMessage.type === "success"
                ? "bg-emerald-500/90 text-white border-emerald-400"
                : "bg-red-500/90 text-white border-red-400"
            }`}
          >
            <span>{feedbackMessage.type === "success" ? "✓" : "⚠️"}</span>
            <span>{feedbackMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Banner with Glassmorphism */}
      <section className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-md border border-white/40 text-slate-800 p-8 sm:p-10 shadow-sm">
        <div className="absolute top-0 right-0 h-[350px] w-[350px] rounded-full bg-gradient-to-br from-teal-200/35 to-emerald-300/0 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-[280px] w-[280px] rounded-full bg-gradient-to-tr from-blue-200/25 to-cyan-300/0 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {showBackButton && (
                <button
                  onClick={() => router.push(`/${locale}/dashboard`)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 hover:bg-slate-900/10 px-3 py-1 text-xs font-bold text-slate-700 transition"
                >
                  <ArrowLeftOutlined /> Back to Hub
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-700 border border-teal-200/60 shadow-sm">
                <SafetyCertificateOutlined /> Dynamic Rate & Forex Engine Active
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Master Rates & Pricing Center
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Maintain foundational rates for attraction monuments, vehicle packages, driver bata,
              and live CBSL currency volatility buffers. Booking quotes calculate instantly with{" "}
              <strong className="text-slate-900 font-bold">zero manual typing</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${locale}/pricing-calculator`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-white hover:border-slate-300 shadow-sm transition"
            >
              <CompassOutlined /> Test In Calculator
            </Link>
            <button
              onClick={fetchRates}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <ReloadOutlined className={loading ? "animate-spin" : ""} /> Refresh Rates
            </button>
          </div>
        </div>
      </section>

      {/* KPI Overview Metrics (4 Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Attractions Active
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-base border border-teal-100">
              <CompassOutlined />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {data.attractions?.length || 0}
            </span>
            <span className="text-xs font-bold text-emerald-600">Heritage & Nature</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            SAARC (~₨2,000) & Foreign (~₨3,000) tiered
          </p>
        </div>

        {/* Metric 2 */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fleet Packages
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base border border-blue-100">
              <CarOutlined />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {data.vehicles?.length || 0}
            </span>
            <span className="text-xs font-bold text-blue-600">Categories</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Base packages + excess km auto-calculated
          </p>
        </div>

        {/* Metric 3 */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Live CBSL Rate
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base border border-emerald-100">
              <DollarOutlined />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ₨ {currencySettings.liveRate.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-emerald-600">/ USD</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            +{currencySettings.forexBufferPercent}% risk buffer active
          </p>
        </div>

        {/* Metric 4 */}
        <div className="rounded-3xl bg-white/60 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Season Multiplier
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base border border-amber-100">
              <CalendarOutlined />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {data.seasons?.length || 4}
            </span>
            <span className="text-xs font-bold text-amber-600">Tiers Configured</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Peak (+25%) to Off-Peak (-15%)
          </p>
        </div>
      </section>

      {/* Custom Modern Pill Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-slate-200/70">
          <button
            onClick={() => setActiveTab("attractions")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "attractions"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <CompassOutlined />
            <span>Attractions & Monuments</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-black">
              {data.attractions?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("vehicles")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "vehicles"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <CarOutlined />
            <span>Fleet & KM Packages</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-black">
              {data.vehicles?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("currency")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "currency"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <DollarOutlined />
            <span>Forex Buffer & Currency</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-black">
              +{currencySettings.forexBufferPercent}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab("seasons")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "seasons"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            <CalendarOutlined />
            <span>Seasonal Brackets</span>
          </button>
        </div>

        {/* Action Button for Current Tab */}
        {activeTab === "attractions" && (
          <button
            onClick={() => handleOpenAttractionModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <PlusOutlined /> Add Attraction / Spot Tariff
          </button>
        )}
        {activeTab === "vehicles" && (
          <button
            onClick={() => handleOpenVehicleModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <PlusOutlined /> Add Fleet Pricing Package
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ATTRACTIONS & MONUMENTS                                  */}
      {/* ============================================================== */}
      {activeTab === "attractions" && (
        <section className="space-y-6">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <SearchOutlined className="absolute left-3.5 top-3 text-slate-400 text-sm" />
              <input
                type="text"
                value={attractionSearch}
                onChange={(e) => setAttractionSearch(e.target.value)}
                placeholder="Search Sigiriya, Maligawa, city..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 shadow-sm transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: "all", label: "All Tariffs" },
                { id: "heritage", label: "Heritage" },
                { id: "wildlife", label: "Wildlife" },
                { id: "cultural", label: "Cultural" },
                { id: "nature", label: "Nature" },
                { id: "custom", label: "Custom / Other" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCategory === cat.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white/80 hover:bg-white text-slate-600 border border-slate-200/60"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attraction Table */}
          <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600 mx-auto" />
                <p className="mt-3 text-xs font-bold text-slate-500">Loading master tariffs...</p>
              </div>
            ) : filteredAttractions.length === 0 ? (
              <div className="py-16 text-center">
                <CompassOutlined className="text-3xl text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">No matching attraction tariffs found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/70 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-4 px-6">Monument / Site</th>
                      <th className="py-4 px-4">Category</th>
                      <th className="py-4 px-4">SAARC & Thailand Rate</th>
                      <th className="py-4 px-4">General Foreign Rate</th>
                      <th className="py-4 px-4">Domestic (Local)</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredAttractions.map((item) => (
                      <tr key={item._id} className="hover:bg-teal-50/20 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {item.locationName}
                            </span>
                            {item.isCustom && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Spot / Custom
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                            📍 {item.city}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              item.category === "Heritage"
                                ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                                : item.category === "Wildlife"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                                : item.category === "Cultural"
                                ? "bg-purple-50 text-purple-800 border border-purple-200/60"
                                : "bg-cyan-50 text-cyan-800 border border-cyan-200/60"
                            }`}
                          >
                            {item.category || "Heritage"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-teal-700 text-sm">
                            ₨ {(item.rates?.saarcLKR || 0).toLocaleString()}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            Concession (~$6.60 USD)
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-blue-900 text-sm">
                            ₨ {(item.rates?.foreignLKR || 0).toLocaleString()}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            Standard (~$10.00 USD)
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-600">
                          ₨ {(item.rates?.localLKR || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenAttractionModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
                          >
                            <EditOutlined /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FLEET & KM PACKAGES                                      */}
      {/* ============================================================== */}
      {activeTab === "vehicles" && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data.vehicles || []).map((veh) => (
              <div
                key={veh._id}
                className="rounded-3xl bg-white/70 backdrop-blur-md border border-slate-200/80 p-6 shadow-sm hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
                      {veh.vehicleCategory}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Max {veh.maxPassengers} Pax
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-900 leading-snug">
                    {veh.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {veh.description || "Official contracted vehicle rate tier"}
                  </p>

                  <div className="mt-5 space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-500">Base Daily Rate:</span>
                      <div className="text-right">
                        <span className="text-base font-black text-slate-900">
                          ₨ {(veh.dailyRateLKR || 0).toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-slate-400 block">
                          ${veh.dailyRateUSD || Math.round((veh.dailyRateLKR || 0) / 305)} USD
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Included Distance:</span>
                      <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {veh.includedKmPerDay || 100} km / day
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Excess Mileage Rate:</span>
                      <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        ₨ {veh.excessRatePerKmLKR || 140} / km
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
                      <span className="font-bold text-slate-500">Driver Daily Bata:</span>
                      <span className="font-black text-slate-800">
                        ₨ {(veh.driverDailyBataLKR || 4000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleOpenVehicleModal(veh)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <EditOutlined /> Edit Package
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CURRENCY & FOREX VOLATILITY BUFFER                       */}
      {/* ============================================================== */}
      {activeTab === "currency" && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings Form Column */}
          <div className="lg:col-span-7 rounded-3xl bg-white/70 backdrop-blur-md border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  USD / LKR Exchange & Margin Protection
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Synchronize with Central Bank of Sri Lanka (CBSL) and protect quotes from currency
                  depreciation.
                </p>
              </div>
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-xl font-bold">
                💱
              </span>
            </div>

            <form onSubmit={handleSaveCurrency} className="mt-6 space-y-6">
              {/* Rate Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Exchange Rate Mode
                  </span>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {currencySettings.usePegged
                      ? "Currently using fixed internal pegged rate."
                      : "Currently pulling live spot rate from CBSL API."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCurrencySettings((prev) => ({ ...prev, usePegged: !prev.usePegged }))
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    currencySettings.usePegged
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-emerald-600 text-white shadow-sm"
                  }`}
                >
                  {currencySettings.usePegged ? "📌 Pegged Rate Active" : "🌐 Live CBSL Rate"}
                </button>
              </div>

              {/* Rates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Live CBSL Rate (₨ / USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currencySettings.liveRate}
                    onChange={(e) =>
                      setCurrencySettings((prev) => ({
                        ...prev,
                        liveRate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Synced automatically via ETL scraper
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Internal Pegged Rate (₨ / USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currencySettings.peggedRate}
                    onChange={(e) =>
                      setCurrencySettings((prev) => ({
                        ...prev,
                        peggedRate: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-800 transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Fixed rate for stable catalog quotes
                  </span>
                </div>
              </div>

              {/* Forex Buffer Slider & Input */}
              <div className="bg-teal-50/50 p-5 rounded-2xl border border-teal-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-teal-900 uppercase tracking-wider">
                      Forex Volatility Buffer (% Margin)
                    </span>
                    <p className="text-xs text-teal-700 font-medium mt-0.5">
                      Recommended 2.0% - 3.5% for customer proposals valid for 14 to 30 days.
                    </p>
                  </div>
                  <span className="text-xl font-black text-teal-700 bg-white px-3 py-1 rounded-xl border border-teal-200">
                    +{currencySettings.forexBufferPercent}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={currencySettings.forexBufferPercent}
                  onChange={(e) =>
                    setCurrencySettings((prev) => ({
                      ...prev,
                      forexBufferPercent: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full accent-teal-600 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] font-bold text-teal-700/70">
                  <span>0% (Raw Baseline)</span>
                  <span>2.5% (Recommended)</span>
                  <span>5.0%</span>
                  <span>10.0% (Max Safety)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingCurrency}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <CheckOutlined />{" "}
                {isSavingCurrency ? "Saving Settings..." : "Save Currency & Forex Settings"}
              </button>
            </form>
          </div>

          {/* Live Simulator Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider mb-4">
                <CalculatorOutlined /> Live Quoting Simulator
              </span>

              <h4 className="text-xl font-black text-white">Dynamic Margin Protection</h4>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                Test how a proposal priced in USD will be converted to local supplier expenses in
                LKR with complete margin safety.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                    Sample Quote Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={simUsdAmount}
                      onChange={(e) => setSimUsdAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-teal-400 transition"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/50 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Raw Baseline Exchange:</span>
                    <span className="font-mono text-slate-200">
                      ₨ {(simUsdAmount * effectiveBaseRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-teal-300">Effective Buffered Quote:</span>
                    <span className="font-mono font-bold text-teal-300">
                      ₨ {(simUsdAmount * effectiveQuotingRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-emerald-400">
                      Protected Risk Buffer:
                    </span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      +₨ {(simUsdAmount * (effectiveQuotingRate - effectiveBaseRate)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2 text-[11px] text-slate-400 leading-normal">
                <InfoCircleOutlined className="text-teal-400 mt-0.5" />
                <span>
                  If the Sri Lankan Rupee fluctuates before final traveler settlement, this buffer
                  guarantees your tour profits remain untouched.
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SEASONAL MULTIPLIERS                                    */}
      {/* ============================================================== */}
      {activeTab === "seasons" && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Peak Season",
                type: "peak",
                multiplier: 1.25,
                dates: "Dec 15 — Jan 31",
                bg: "bg-rose-50 border-rose-200/80 text-rose-900",
                badge: "bg-rose-500 text-white",
                desc: "Christmas, New Year & high winter tourist arrivals",
              },
              {
                name: "High Season",
                type: "high",
                multiplier: 1.15,
                dates: "Feb 01 — Apr 15",
                bg: "bg-amber-50 border-amber-200/80 text-amber-900",
                badge: "bg-amber-500 text-white",
                desc: "Dry winter months, hill country & southern beaches",
              },
              {
                name: "Shoulder Season",
                type: "shoulder",
                multiplier: 1.05,
                dates: "Jul 01 — Aug 31",
                bg: "bg-blue-50 border-blue-200/80 text-blue-900",
                badge: "bg-blue-500 text-white",
                desc: "Kandy Esala Perahera festival & east coast surf",
              },
              {
                name: "Off-Peak Season",
                type: "low",
                multiplier: 0.85,
                dates: "May 01 — Jun 30",
                bg: "bg-emerald-50 border-emerald-200/80 text-emerald-900",
                badge: "bg-emerald-500 text-white",
                desc: "South-West monsoon period with competitive rates",
              },
            ].map((season, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-6 border shadow-sm flex flex-col justify-between ${season.bg}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${season.badge}`}>
                      {season.type}
                    </span>
                    <span className="text-xs font-black">
                      {season.multiplier > 1.0
                        ? `+${Math.round((season.multiplier - 1) * 100)}% Markup`
                        : `${Math.round((season.multiplier - 1) * 100)}% Discount`}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black text-slate-900">{season.name}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">🗓️ {season.dates}</p>
                  <p className="mt-3 text-xs text-slate-600 font-medium leading-relaxed">
                    {season.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Multiplier factor:</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {season.multiplier}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD/EDIT ATTRACTION                                    */}
      {/* ============================================================== */}
      {isAttractionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingAttraction ? "Edit Attraction Tariff" : "Add Attraction / Spot Tariff"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Configure nationality-tiered entrance fees for automated tour quoting.
                </p>
              </div>
              <button
                onClick={() => setIsAttractionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAttraction} className="p-6 space-y-4 overflow-y-auto flex-grow text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Monument / Attraction Name
                </label>
                <input
                  type="text"
                  required
                  value={attractionForm.locationName}
                  onChange={(e) =>
                    setAttractionForm((prev) => ({ ...prev, locationName: e.target.value }))
                  }
                  placeholder="e.g. Sigiriya Rock Fortress or Ranweli Spice Garden"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    City / District
                  </label>
                  <input
                    type="text"
                    required
                    value={attractionForm.city}
                    onChange={(e) =>
                      setAttractionForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="e.g. Sigiriya, Kandy, Galle"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Category
                  </label>
                  <select
                    value={attractionForm.category}
                    onChange={(e) =>
                      setAttractionForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                  >
                    <option value="Heritage">Heritage</option>
                    <option value="Wildlife">Wildlife</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Nature">Nature</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-teal-800 uppercase mb-1.5">
                    SAARC & Thailand Rate (₨)
                  </label>
                  <input
                    type="number"
                    required
                    value={attractionForm.saarcLKR}
                    onChange={(e) =>
                      setAttractionForm((prev) => ({
                        ...prev,
                        saarcLKR: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="2000"
                    className="w-full bg-teal-50/40 border border-teal-200 rounded-xl px-4 py-2.5 text-sm text-teal-900 font-bold focus:outline-none focus:border-teal-700 transition"
                  />
                  <span className="text-[11px] text-teal-600 mt-1 block">
                    Concession tier (~₨2,000)
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase mb-1.5">
                    General Foreign Rate (₨)
                  </label>
                  <input
                    type="number"
                    required
                    value={attractionForm.foreignLKR}
                    onChange={(e) =>
                      setAttractionForm((prev) => ({
                        ...prev,
                        foreignLKR: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="3000"
                    className="w-full bg-blue-50/40 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-900 font-bold focus:outline-none focus:border-blue-700 transition"
                  />
                  <span className="text-[11px] text-blue-600 mt-1 block">
                    International tier (~₨3,000)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Domestic / Local Rate (₨)
                  </label>
                  <input
                    type="number"
                    required
                    value={attractionForm.localLKR}
                    onChange={(e) =>
                      setAttractionForm((prev) => ({
                        ...prev,
                        localLKR: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Child Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={attractionForm.childDiscountPercent}
                    onChange={(e) =>
                      setAttractionForm((prev) => ({
                        ...prev,
                        childDiscountPercent: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="customSite"
                  checked={attractionForm.isCustom}
                  onChange={(e) =>
                    setAttractionForm((prev) => ({ ...prev, isCustom: e.target.checked }))
                  }
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="customSite" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Custom / Spot-added Excursion (Unlisted Location)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Notes / Inclusions
                </label>
                <textarea
                  rows={2}
                  value={attractionForm.notes}
                  onChange={(e) =>
                    setAttractionForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="e.g. Includes museum entry, photography permit required."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAttractionModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Save Attraction Tariff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ADD/EDIT VEHICLE PACKAGE                               */}
      {/* ============================================================== */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingVehicle ? "Edit Vehicle Package" : "Add Vehicle Pricing Package"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Set daily base rates, included kilometers, and excess distance surcharges.
                </p>
              </div>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-6 space-y-4 overflow-y-auto flex-grow text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Vehicle Class
                  </label>
                  <select
                    value={vehicleForm.vehicleCategory}
                    onChange={(e) =>
                      setVehicleForm((prev) => ({ ...prev, vehicleCategory: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                  >
                    <option value="Sedan">Sedan (1-3 Pax)</option>
                    <option value="Minivan">Minivan (4-6 Pax)</option>
                    <option value="High-Roof Van">High-Roof Van (6-9 Pax)</option>
                    <option value="Mini Coach">Mini Coach (10-20 Pax)</option>
                    <option value="Large Coach">Large Coach (20+ Pax)</option>
                    <option value="Luxury SUV">Luxury SUV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Max Passengers
                  </label>
                  <input
                    type="number"
                    value={vehicleForm.maxPassengers}
                    onChange={(e) =>
                      setVehicleForm((prev) => ({
                        ...prev,
                        maxPassengers: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  value={vehicleForm.name}
                  onChange={(e) =>
                    setVehicleForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Standard Minivan Day Package"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Daily Base Rate (₨)
                  </label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.dailyRateLKR}
                    onChange={(e) =>
                      setVehicleForm((prev) => ({
                        ...prev,
                        dailyRateLKR: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Included Distance (km / day)
                  </label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.includedKmPerDay}
                    onChange={(e) =>
                      setVehicleForm((prev) => ({
                        ...prev,
                        includedKmPerDay: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-rose-700 uppercase mb-1.5">
                    Excess Mileage Rate (₨ / km)
                  </label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.excessRatePerKmLKR}
                    onChange={(e) =>
                      setVehicleForm((prev) => ({
                        ...prev,
                        excessRatePerKmLKR: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-rose-50/50 border border-rose-200 rounded-xl px-4 py-2.5 text-sm text-rose-900 font-bold focus:outline-none focus:border-rose-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Driver Daily Bata (₨)
                  </label>
                  <input
                    type="number"
                    required
                    value={vehicleForm.driverDailyBataLKR}
                    onChange={(e) =>
                      setVehicleForm((prev) => ({
                        ...prev,
                        driverDailyBataLKR: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:border-slate-800 transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Save Vehicle Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
