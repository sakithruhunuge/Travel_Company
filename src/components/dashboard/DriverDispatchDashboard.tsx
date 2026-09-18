"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTenant } from "@/context/TenantBrandingContext";
import { useLocale } from "next-intl";
import {
  CarOutlined,
  CompassOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  TeamOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CameraOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "./EmptyState";
import GuestNotesCard from "./GuestNotesCard";

interface TourItem {
  _id: string;
  tourId?: string;
  packageName: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  numberOfTravelers: number;
  preferredStartDate: string;
  specialRequests?: string;
  status: string;
  driver?: { name: string; phone?: string; email?: string };
  tourGuide?: { name: string; phone?: string; email?: string };
  assignedVehicle?: { category: string; plateNumber: string; model: string };
  inTourExpenses?: any[];
}

export default function DriverDispatchDashboard() {
  const { data: session } = useSession();
  const tenant = useTenant();
  const locale = useLocale();
  const primaryColor = tenant?.branding?.primaryColor || "#0B7C8A";

  const [identifier, setIdentifier] = useState("");
  const [crewList, setCrewList] = useState<any[]>([]);
  const [crewProfile, setCrewProfile] = useState<any>(null);
  const [isManagement, setIsManagement] = useState(false);
  const [tours, setTours] = useState<TourItem[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "upcoming" | "history">("active");

  // Status updating state
  const [currentStatus, setCurrentStatus] = useState<"available" | "on_tour" | "off_duty">("available");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Expense Logger Modal
  const [selectedTourForExpense, setSelectedTourForExpense] = useState<TourItem | null>(null);
  const [expCategory, setExpCategory] = useState("ticket");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expReceipt, setExpReceipt] = useState("");
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSubmittingExp, setIsSubmittingExp] = useState(false);
  const [expSuccessMsg, setExpSuccessMsg] = useState("");
  const [expErrorMsg, setExpErrorMsg] = useState("");

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
        if (data.crewMember) {
          setCrewProfile(data.crewMember);
          if (data.crewMember.status) {
            setCurrentStatus(data.crewMember.status);
          }
        }
        if (data.allCrew) setCrewList(data.allCrew);
        if (data.isManagement !== undefined) setIsManagement(data.isManagement);
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

  const handleUpdateAvailability = async (newStatus: "available" | "on_tour" | "off_duty") => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch("/api/driver-guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crewProfile?._id,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        if (crewProfile) {
          setCrewProfile({ ...crewProfile, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const activeTourList = tours.filter((t) =>
    ["allocated", "proforma_issued", "active_tour", "confirmed"].includes(t.status)
  );
  const upcomingTourList = tours.filter((t) => ["allocated", "confirmed"].includes(t.status));
  const historyTourList = tours.filter((t) => ["completed", "reconciling"].includes(t.status));

  const displayedTours =
    activeTab === "active"
      ? activeTourList
      : activeTab === "upcoming"
      ? upcomingTourList
      : historyTourList;

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
    setExpErrorMsg("");
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

      setExpSuccessMsg(`Successfully recorded $${expAmount} for ${expDesc}!`);
      setTimeout(() => {
        setSelectedTourForExpense(null);
        setExpDesc("");
        setExpAmount(0);
        setExpReceipt("");
        setExpSuccessMsg("");
        loadDriverTours();
      }, 1500);
    } catch (err: any) {
      setExpErrorMsg(err?.message || "Failed to record expense");
    } finally {
      setIsSubmittingExp(false);
    }
  };

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Header Banner - Matching Dashboard Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-md border border-white/30 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700 border border-teal-500/20 shadow-sm">
              <CarOutlined /> Fleet & Dispatch Desk
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-200">
              License: {crewProfile?.licenseNumber || "Verified Chauffeur"}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mt-2 flex items-center gap-2.5">
            <span>{crewProfile?.name || session?.user?.name || "Dispatch Portal"}</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
              {crewProfile?.role === "both" ? "Driver & Guide" : crewProfile?.role === "tour_guide" ? "Tour Guide" : "Official Chauffeur"}
            </span>
          </h2>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Vehicle: <strong className="text-slate-800">{crewProfile?.vehicleDetails?.model || "Standard Fleet"}</strong> ({crewProfile?.vehicleDetails?.plateNumber || "Plate Assigned"}) • Rating: ★ {crewProfile?.rating ? crewProfile.rating.toFixed(1) : "5.0"}
          </p>
        </div>

        {/* Action & Availability Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Availability Status Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <span className="text-[11px] text-slate-500 font-bold px-2">Status:</span>
            <button
              onClick={() => handleUpdateAvailability("available")}
              disabled={isUpdatingStatus}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                currentStatus === "available"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              Available
            </button>

            <button
              onClick={() => handleUpdateAvailability("on_tour")}
              disabled={isUpdatingStatus}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                currentStatus === "on_tour"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-200" />
              On Tour
            </button>

            <button
              onClick={() => handleUpdateAvailability("off_duty")}
              disabled={isUpdatingStatus}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                currentStatus === "off_duty"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              Off Duty
            </button>
          </div>

          {/* Admin / Management Driver Switcher */}
          {isManagement && crewList.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-semibold">Switch Crew:</span>
              <select
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
              >
                {crewList.map((c) => (
                  <option key={c._id || c.name} value={c.name}>
                    {c.name} ({c.role === "both" ? "Driver & Guide" : c.role === "driver" ? "Driver" : "Guide"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={loadDriverTours}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            title="Refresh manifest"
          >
            <ReloadOutlined className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row - Matching Dashboard Style */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Active Manifests</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-teal-600">{stats.active}</span>
            <span className="text-[11px] text-teal-600/80 font-medium">In Progress</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Upcoming Departures</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-500">{stats.upcoming}</span>
            <span className="text-[11px] text-amber-600/80 font-medium">Scheduled</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Completed Tours</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{stats.completed}</span>
            <span className="text-[11px] text-slate-500 font-medium">Delivered</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Service Rating</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-500">
              ★ {crewProfile?.rating ? crewProfile.rating.toFixed(1) : "5.0"}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Guest Feedback</span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === "active"
              ? "bg-teal-600 text-white shadow"
              : "text-slate-600 hover:bg-white/60"
          }`}
        >
          <CompassOutlined />
          <span>Active Manifest ({activeTourList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("upcoming")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === "upcoming"
              ? "bg-teal-600 text-white shadow"
              : "text-slate-600 hover:bg-white/60"
          }`}
        >
          <CalendarOutlined />
          <span>Upcoming Departures ({upcomingTourList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === "history"
              ? "bg-teal-600 text-white shadow"
              : "text-slate-600 hover:bg-white/60"
          }`}
        >
          <FileTextOutlined />
          <span>Completed History ({historyTourList.length})</span>
        </button>
      </div>

      {/* Manifest Content */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading tour schedule and manifest...</div>
      ) : displayedTours.length === 0 ? (
        <div className="py-16 text-center bg-white/40 rounded-3xl border border-white/50">
          <EmptyState
            title={`No ${activeTab} tours assigned`}
            description={
              activeTab === "active"
                ? "You currently have no active tours in progress. Keep your status 'Available' to receive dispatch alerts."
                : "No tours found in this category."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {displayedTours.map((tour) => {
            const expenses = tour.inTourExpenses || [];
            const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

            return (
              <motion.div
                key={tour._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                {/* Header Row: Tour title, ID & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-teal-700 tracking-wider">
                      Tour ID: {tour.tourId || tour._id.substring(tour._id.length - 8).toUpperCase()}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">{tour.packageName}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full capitalize bg-teal-50 text-teal-700 border border-teal-200">
                      <CheckCircleOutlined />
                      {tour.status.replace("_", " ")}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedTourForExpense(tour);
                        setExpSuccessMsg("");
                        setExpErrorMsg("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition"
                    >
                      <DollarOutlined />
                      <span>Log Field Expense</span>
                    </button>
                  </div>
                </div>

                {/* Info Grid: Passenger, Dates, Vehicle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Passenger */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl space-y-1">
                    <span className="text-slate-400 block text-[11px] font-semibold">Primary Traveler</span>
                    <p className="font-bold text-slate-800 text-sm">{tour.userName}</p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <MailOutlined className="text-slate-400" /> {tour.userEmail}
                    </p>
                    {tour.userPhone && (
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <PhoneOutlined className="text-slate-400" /> {tour.userPhone}
                      </p>
                    )}
                  </div>

                  {/* Date & Pax */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl space-y-1">
                    <span className="text-slate-400 block text-[11px] font-semibold">Schedule & Party Size</span>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CalendarOutlined className="text-teal-600" />
                      {new Date(tour.preferredStartDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <TeamOutlined className="text-slate-400" />
                      Party of <strong>{tour.numberOfTravelers} Guests</strong>
                    </p>
                  </div>

                  {/* Vehicle */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl space-y-1">
                    <span className="text-slate-400 block text-[11px] font-semibold">Assigned Fleet</span>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CarOutlined className="text-teal-600" />
                      {tour.assignedVehicle?.model || crewProfile?.vehicleDetails?.model || "Toyota KDH Executive"}
                    </p>
                    <p className="text-slate-600 font-mono font-bold uppercase">
                      Plate: {tour.assignedVehicle?.plateNumber || crewProfile?.vehicleDetails?.plateNumber || "WP-CAB-4421"}
                    </p>
                  </div>
                </div>

                {/* Special Requests / Guest Notes */}
                <GuestNotesCard
                  rawNotes={tour.specialRequests}
                  title="Special Requests / Guest Notes"
                />

                {/* In-Tour Expenses List */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Logged Field Expenses ({expenses.length})
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      Total: ${totalExp.toFixed(2)}
                    </span>
                  </div>

                  {expenses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No in-tour expenses logged yet for this trip.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {expenses.map((exp: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block truncate max-w-[150px]">
                              {exp.description}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">{exp.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-emerald-600 block">${Number(exp.amount).toFixed(2)}</span>
                            {exp.receiptUrl && (
                              <a
                                href={exp.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-teal-600 hover:underline"
                              >
                                View Receipt
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Field Expense Modal - Consistent Dashboard Design */}
      {selectedTourForExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Log In-Tour Field Expense</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{selectedTourForExpense.packageName}</p>
              </div>
              <button
                onClick={() => setSelectedTourForExpense(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {expSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                <CheckCircleOutlined />
                <span>{expSuccessMsg}</span>
              </div>
            )}

            {expErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {expErrorMsg}
              </div>
            )}

            <form onSubmit={handleLogFieldExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                >
                  <option value="ticket">Attraction / Site Tickets</option>
                  <option value="toll">Highway Toll / Parking Fees</option>
                  <option value="fuel">Fuel / Gas</option>
                  <option value="meal">Driver / Guide Meal Allowance</option>
                  <option value="activity">Unplanned Excursion / Activity</option>
                  <option value="repair">Emergency Maintenance / Repair</option>
                  <option value="other">Other Operational Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g. Sigiriya Rock Fortress entrance for 2 guests"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (USD) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={expAmount || ""}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    placeholder="0.00"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receipt Photo (Smartphone Camera / Upload)
                </label>
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/60 transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-1">
                    <CameraOutlined className="text-xl text-teal-600" />
                    <p className="text-xs font-medium text-slate-600">
                      {isUploadingReceipt
                        ? "Uploading photo..."
                        : expReceipt
                        ? "Receipt Attached ✓ (Click to change)"
                        : "Take photo or choose receipt image"}
                    </p>
                    <p className="text-[10px] text-slate-400">JPG, PNG, or WEBP supported</p>
                  </div>
                </div>

                {expReceipt && (
                  <div className="mt-2 text-center">
                    <a
                      href={expReceipt}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-teal-600 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>Preview Uploaded Receipt</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTourForExpense(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingExp}
                  className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow transition disabled:opacity-50"
                >
                  {isSubmittingExp ? "Saving Expense..." : "Submit Field Expense"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
