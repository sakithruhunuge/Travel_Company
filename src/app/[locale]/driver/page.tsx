"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CarOutlined,
  CompassOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined,
  PlusCircleOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  CameraOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
} from "@ant-design/icons";

interface TourItem {
  _id: string;
  tourId?: string;
  packageName: string;
  userName: string;
  userEmail: string;
  numberOfTravelers: number;
  preferredStartDate: string;
  specialRequests?: string;
  status: string;
  driver?: { name: string; phone?: string; email?: string };
  tourGuide?: { name: string; phone?: string; email?: string };
  assignedVehicle?: { category: string; plateNumber: string; model: string };
  inTourExpenses?: any[];
}

export default function DriverPortalPage() {
  const [identifier, setIdentifier] = useState("");
  const [crewList, setCrewList] = useState<any[]>([]);
  const [crewProfile, setCrewProfile] = useState<any>(null);
  const [tours, setTours] = useState<TourItem[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "history">("active");

  // Expense Logger Modal
  const [selectedTourForExpense, setSelectedTourForExpense] = useState<TourItem | null>(null);
  const [expCategory, setExpCategory] = useState("ticket");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expReceipt, setExpReceipt] = useState("");
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSubmittingExp, setIsSubmittingExp] = useState(false);
  const [expSuccessMsg, setExpSuccessMsg] = useState("");

  const loadDriverTours = async () => {
    setLoading(true);
    try {
      const url = identifier
        ? `/api/driver/tours?identifier=${encodeURIComponent(identifier)}`
        : "/api/driver/tours";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTours(data.tours || []);
        setStats(data.stats || { total: 0, active: 0, completed: 0, upcoming: 0 });
        if (data.crewMember) setCrewProfile(data.crewMember);
        if (data.allCrew) setCrewList(data.allCrew);
        if (!identifier && data.selectedIdentifier) {
          setIdentifier(data.selectedIdentifier);
        }
      }
    } catch (err) {
      console.error("Failed to load driver tours:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverTours();
  }, [identifier]);

  const activeTourList = tours.filter((t) =>
    ["allocated", "proforma_issued", "active_tour", "confirmed"].includes(t.status)
  );
  const historyTourList = tours.filter((t) => ["completed", "reconciling"].includes(t.status));

  const handleReceiptFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingReceipt(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setExpReceipt(data.url);
      } else {
        alert(data.error || "Receipt upload failed");
      }
    } catch (err: any) {
      alert("Failed to upload receipt: " + err.message);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleLogFieldExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTourForExpense || !expDesc || !expAmount) return;

    setIsSubmittingExp(true);
    setExpSuccessMsg("");
    try {
      const res = await fetch("/api/intour/expense-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedTourForExpense._id,
          category: expCategory,
          description: expDesc,
          amount: Number(expAmount),
          receiptUrl: expReceipt || "",
          reportedBy: crewProfile?.role === "tour_guide" ? "tour_guide" : "driver",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit field expense");

      setExpSuccessMsg(`Successfully logged $${expAmount} for ${expDesc}!`);
      setTimeout(() => {
        setSelectedTourForExpense(null);
        setExpDesc("");
        setExpAmount(0);
        setExpReceipt("");
        setExpSuccessMsg("");
        loadDriverTours();
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingExp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 font-sans">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#0B7C8A] flex items-center justify-center text-white text-lg font-bold shadow-md shadow-teal-500/20">
            <CarOutlined />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight">Crew Dispatch Portal</h1>
            <p className="text-[10px] text-teal-400 font-semibold">Chauffeur & Tour Guide Mobile View</p>
          </div>
        </div>

        {/* Dynamic Driver Profile Switcher */}
        {crewList.length > 0 && (
          <select
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-teal-500 font-medium max-w-[180px] truncate"
          >
            {crewList.map((c) => (
              <option key={c._id || c.name} value={c.name}>
                {c.name} ({c.role === "both" ? "Driver & Guide" : c.role === "driver" ? "Driver" : "Guide"})
              </option>
            ))}
          </select>
        )}
      </header>

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Driver Badge Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-850 border border-slate-700/80 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">{identifier || "Field Crew"}</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {crewProfile?.role === "both" ? "Driver & Guide" : crewProfile?.role === "tour_guide" ? "Tour Guide" : "Official Chauffeur"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                License: {crewProfile?.licenseNumber || "Verified Field Roster"} • Rating: ★ {crewProfile?.rating ? crewProfile.rating.toFixed(1) : "5.0"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-amber-400">
                {crewProfile?.vehicleDetails?.model || (crewProfile?.role === "tour_guide" ? "Guide Escort" : "Assigned Fleet")}
              </span>
              <div className="text-[10px] font-mono text-slate-400">
                {crewProfile?.vehicleDetails?.plateNumber || (crewProfile?.role === "tour_guide" ? "Certified Guide" : "Plate Pending")}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-center">
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Active Tours</span>
              <span className="text-base font-black text-teal-400">{stats.active}</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Upcoming</span>
              <span className="text-base font-black text-amber-400">{stats.upcoming}</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Completed</span>
              <span className="text-base font-black text-emerald-400">{stats.completed}</span>
            </div>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "active" ? "bg-[#0B7C8A] text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Active Tour Manifest ({activeTourList.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "history" ? "bg-[#0B7C8A] text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            Tour History ({historyTourList.length})
          </button>
        </div>

        {/* Tours List */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading crew schedule...</div>
        ) : activeTab === "active" && activeTourList.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No active tours assigned currently. Check back soon for upcoming dispatch notices.
          </div>
        ) : activeTab === "active" ? (
          activeTourList.map((tour) => {
            const startDate = new Date(tour.preferredStartDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });

            const guestPhone = (tour as any).pricingInputs?.phone || (tour as any).pricingInputs?.contactNumber || (tour as any).userPhone;
            const mapsDestination = encodeURIComponent(
              tour.specialRequests?.includes("Destination:")
                ? tour.specialRequests
                : `${tour.packageName}, Sri Lanka`
            );

            return (
              <div
                key={tour._id}
                className="p-4 rounded-2xl bg-slate-850 border border-slate-700 shadow-lg space-y-3"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold text-xs border border-teal-500/30">
                      {tour.tourId || `REF-${tour._id.substring(tour._id.length - 6).toUpperCase()}`}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{tour.packageName}</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded capitalize bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {tour.status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Guest Profile & Phone Call / Email */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TeamOutlined className="text-teal-400" />
                      {tour.userName} ({tour.numberOfTravelers} Guests)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{tour.userEmail}</div>
                  </div>
                  {guestPhone ? (
                    <a
                      href={`tel:${guestPhone}`}
                      className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition flex items-center justify-center text-sm"
                      title={`Call Guest: ${guestPhone}`}
                    >
                      <PhoneOutlined />
                    </a>
                  ) : (
                    <a
                      href={`mailto:${tour.userEmail}?subject=Tour%20Coordination%20-%20${encodeURIComponent(tour.packageName)}`}
                      className="p-2.5 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 hover:bg-teal-600 hover:text-white transition flex items-center justify-center text-sm"
                      title={`Email Guest: ${tour.userEmail}`}
                    >
                      <PhoneOutlined />
                    </a>
                  )}
                </div>

                {/* Tour Start Date & Pickup details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Start Date</span>
                    <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
                      <CalendarOutlined className="text-teal-400" /> {startDate}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Assigned Vehicle</span>
                    <span className="font-semibold text-amber-300 mt-0.5 block truncate">
                      {tour.assignedVehicle?.plateNumber || tour.assignedVehicle?.model || "Assigned on Dispatch"}
                    </span>
                  </div>
                </div>

                {/* Route navigation */}
                {tour.specialRequests && (
                  <div className="text-[11px] text-slate-300 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Tour Notes & Route:</span>
                    {tour.specialRequests}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-700/60">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${mapsDestination}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-650 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <EnvironmentOutlined className="text-teal-400" />
                    <span>Google Maps</span>
                  </a>

                  <button
                    onClick={() => setSelectedTourForExpense(tour)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0B7C8A] hover:bg-[#0B7C8A]/90 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition"
                  >
                    <PlusCircleOutlined />
                    <span>+ Log Field Expense</span>
                  </button>
                </div>

                {/* Logged in-tour expenses list */}
                {tour.inTourExpenses && tour.inTourExpenses.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <span>Logged Field Additions:</span>
                      <span className="text-teal-400">
                        Total: $
                        {tour.inTourExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0)}
                      </span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {tour.inTourExpenses.map((e: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>
                            • {e.description} ({e.category})
                          </span>
                          <span className="font-bold text-emerald-400">+${e.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          historyTourList.map((tour) => (
            <div
              key={tour._id}
              className="p-4 rounded-2xl bg-slate-850/60 border border-slate-800 text-xs space-y-1.5 text-slate-400"
            >
              <div className="flex justify-between">
                <span className="font-bold text-slate-200">{tour.packageName}</span>
                <span className="text-emerald-400 font-bold">COMPLETED</span>
              </div>
              <div>
                Tour ID: {tour.tourId || tour._id} • Guest: {tour.userName}
              </div>
              <div>Date: {new Date(tour.preferredStartDate).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </div>

      {/* Field Expense Logging Drawer / Modal */}
      <AnimatePresence>
        {selectedTourForExpense && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-md bg-slate-850 rounded-t-3xl sm:rounded-2xl border border-slate-700 shadow-2xl p-5 text-slate-100"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-white">Log Mid-Tour Field Expense</h3>
                  <p className="text-[11px] text-teal-400">
                    Tour: {selectedTourForExpense.tourId || selectedTourForExpense.packageName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTourForExpense(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {expSuccessMsg ? (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircleOutlined className="text-base" />
                  {expSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleLogFieldExpense} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Expense Category *</label>
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-teal-500"
                    >
                      <option value="ticket">Attraction / Activity Ticket</option>
                      <option value="extra_mileage">Extra KM / Route Detour</option>
                      <option value="hotel_upgrade">Hotel Room Upgrade</option>
                      <option value="meals">Meal / Refreshments</option>
                      <option value="other">Safari / Boat / Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Description *</label>
                    <input
                      type="text"
                      placeholder="e.g. 2x Whale Watching tickets at Mirissa Harbour"
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Amount ($ USD) *</label>
                    <input
                      type="number"
                      placeholder="85"
                      min="1"
                      step="any"
                      value={expAmount || ""}
                      onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-teal-500 font-bold"
                    />
                  </div>

                  {/* Photo Receipt Upload */}
                  <div>
                    <label className="block text-slate-400 mb-1">Receipt Photo (Camera/File)</label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-slate-900 border border-dashed border-slate-700 hover:border-teal-500 rounded-xl cursor-pointer text-slate-400 hover:text-white transition">
                        <CameraOutlined />
                        <span>
                          {isUploadingReceipt
                            ? "Uploading photo..."
                            : expReceipt
                            ? "Receipt Photo Attached ✓"
                            : "Snap / Upload Receipt Photo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={isUploadingReceipt}
                          onChange={handleReceiptFileUpload}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingExp}
                      className="w-full py-3 rounded-xl bg-[#0B7C8A] hover:bg-[#0B7C8A]/90 text-white font-bold text-xs shadow-lg shadow-teal-500/20 disabled:opacity-50 transition"
                    >
                      {isSubmittingExp ? "Submitting to Ledger..." : "Submit to Active Tour Ledger"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
