"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseOutlined,
  CheckCircleOutlined,
  UserSwitchOutlined,
  FileProtectOutlined,
  PlusCircleOutlined,
  AuditOutlined,
  FilePdfOutlined,
  CarOutlined,
  SendOutlined,
  DollarCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

interface TourLifecycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onBookingUpdated?: () => void;
}

export default function TourLifecycleModal({
  isOpen,
  onClose,
  booking,
  onBookingUpdated,
}: TourLifecycleModalProps) {
  const [activeTab, setActiveTab] = useState<
    "confirm" | "allocate" | "proforma" | "intour" | "actual"
  >("confirm");

  // Crew Roster
  const [crewList, setCrewList] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState("Van");

  // Proforma state
  const [hotelCharges, setHotelCharges] = useState(720);
  const [vehicleCharges, setVehicleCharges] = useState(650);
  const [driverGuideCharges, setDriverGuideCharges] = useState(250);
  const [excursionCharges, setExcursionCharges] = useState(190);
  const [forexBufferPercent, setForexBufferPercent] = useState(2.5);
  const [depositPercent, setDepositPercent] = useState(30);

  // In-Tour Expense state
  const [expCategory, setExpCategory] = useState("ticket");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expReceipt, setExpReceipt] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);

  // Actual Invoice state
  const [deductionsTotal, setDeductionsTotal] = useState(0);
  const [actualNotes, setActualNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load crew and existing booking state
  useEffect(() => {
    if (booking) {
      if (booking.driver) setSelectedDriver(booking.driver);
      if (booking.tourGuide) setSelectedGuide(booking.tourGuide);
      if (booking.assignedVehicle) {
        setVehiclePlate(booking.assignedVehicle.plateNumber || "");
        setVehicleModel(booking.assignedVehicle.model || "");
        setVehicleCategory(booking.assignedVehicle.category || "Van");
      }
      if (booking.inTourExpenses) {
        setExpenses(booking.inTourExpenses);
      }
      if (booking.status === "allocated") setActiveTab("proforma");
      else if (booking.status === "proforma_issued") setActiveTab("intour");
      else if (booking.status === "active_tour" || booking.status === "completed") setActiveTab("actual");
      else if (booking.status === "confirmed") setActiveTab("allocate");
    }
  }, [booking]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/driver-guide")
        .then((res) => res.json())
        .then((data) => {
          if (data.crew) setCrewList(data.crew);
        })
        .catch((err) => console.warn("Could not load crew:", err));
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  // 1. Confirm Tour
  const handleConfirmTour = async () => {
    setLoading(true);
    setErrorMsg("");
    setMsg("");
    try {
      const res = await fetch("/api/tours/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed");
      setMsg(`Tour Confirmed! System Tour ID: ${data.tourId}`);
      if (onBookingUpdated) onBookingUpdated();
      setActiveTab("allocate");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Allocate Crew & Vehicle
  const handleAssignCrew = async () => {
    setLoading(true);
    setErrorMsg("");
    setMsg("");
    try {
      const res = await fetch("/api/allocation/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          driver: selectedDriver,
          tourGuide: selectedGuide,
          assignedVehicle: {
            category: vehicleCategory,
            plateNumber: vehiclePlate,
            model: vehicleModel,
            capacity: 8,
          },
          notifyCrew: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Allocation failed");
      setMsg("Driver, Guide, and Vehicle allocated! Dispatch notices sent.");
      if (onBookingUpdated) onBookingUpdated();
      setActiveTab("proforma");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Issue Proforma Invoice
  const handleIssueProforma = async (downloadPdf = false, sendToCustomer = false) => {
    setLoading(true);
    setErrorMsg("");
    setMsg("");
    try {
      if (downloadPdf) {
        const res = await fetch("/api/invoices/proforma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking._id,
            hotelCharges,
            vehicleCharges,
            driverGuideCharges,
            excursionCharges,
            forexBufferPercent,
            depositPercent,
            downloadPdf: true,
          }),
        });
        if (!res.ok) throw new Error("Failed to download proforma PDF");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Proforma-${booking.tourId || booking._id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setMsg("Proforma Invoice PDF downloaded!");
      } else {
        const res = await fetch("/api/invoices/proforma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking._id,
            hotelCharges,
            vehicleCharges,
            driverGuideCharges,
            excursionCharges,
            forexBufferPercent,
            depositPercent,
            downloadPdf: false,
            sendToCustomer,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate proforma");
        setMsg(`Proforma Invoice #${data.proforma.invoiceNumber} issued!`);
        if (onBookingUpdated) onBookingUpdated();
        setActiveTab("intour");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Log In-Tour Expense
  const handleLogExpense = async () => {
    if (!expDesc || !expAmount) {
      setErrorMsg("Please enter expense description and amount.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setMsg("");
    try {
      const res = await fetch("/api/intour/expense-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          category: expCategory,
          description: expDesc,
          amount: expAmount,
          receiptUrl: expReceipt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log in-tour addition");
      setExpenses(data.inTourExpenses);
      setExpDesc("");
      setExpAmount(0);
      setExpReceipt("");
      setMsg(`Added: $${expAmount} for ${expCategory}. Total In-Tour: $${data.totalAdditions}`);
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Generate Actual Invoice
  const handleGenerateActual = async (downloadPdf = false, sendToCustomer = false) => {
    setLoading(true);
    setErrorMsg("");
    setMsg("");
    try {
      if (downloadPdf) {
        const res = await fetch("/api/invoices/actual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking._id,
            deductionsTotal,
            notes: actualNotes,
            downloadPdf: true,
          }),
        });
        if (!res.ok) throw new Error("Failed to download actual invoice PDF");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ActualInvoice-${booking.tourId || booking._id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setMsg("Actual Invoice PDF downloaded!");
      } else {
        const res = await fetch("/api/invoices/actual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking._id,
            deductionsTotal,
            notes: actualNotes,
            downloadPdf: false,
            sendToCustomer,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate actual invoice");
        setMsg(data.message || "Actual Invoice generated and reconciled!");
        if (onBookingUpdated) onBookingUpdated();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculations for preview
  const proformaSubtotal = hotelCharges + vehicleCharges + driverGuideCharges + excursionCharges;
  const proformaForex = (proformaSubtotal * forexBufferPercent) / 100;
  const proformaTotal = Math.round(proformaSubtotal + proformaForex);
  const advanceDepositDue = Math.round((proformaTotal * depositPercent) / 100);

  const totalInTourAdditions = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const baseForActual = booking.proforma?.totalAmount || booking.submittedTotal || proformaTotal;
  const advancePaidSoFar = booking.proforma?.advancePaid || booking.submittedTotal || advanceDepositDue;
  const netActualTotal = Math.round(baseForActual + totalInTourAdditions - deductionsTotal);
  const balanceDue = Math.max(0, netActualTotal - advancePaidSoFar);
  const refundDue = Math.max(0, advancePaidSoFar - netActualTotal);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200"
        >
          {/* Modal Header */}
          <div className="bg-[#0B7C8A] px-6 py-4 text-white flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Tour ID: {booking.tourId || "UNCONFIRMED"}
                </span>
                <span className="text-xs font-semibold capitalize bg-amber-400 text-slate-900 px-2 py-0.5 rounded">
                  Status: {booking.status?.replace(/_/g, " ")}
                </span>
              </div>
              <h2 className="text-lg font-bold">
                {booking.packageName} • {booking.userName} ({booking.numberOfTravelers} Pax)
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Stepper Tabs */}
          <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex flex-wrap gap-2 text-xs font-semibold">
            {[
              { id: "confirm", label: "1. Confirm & Tour ID", icon: CheckCircleOutlined },
              { id: "allocate", label: "2. Assign Driver/Guide", icon: UserSwitchOutlined },
              { id: "proforma", label: "3. Proforma Invoice", icon: FileProtectOutlined },
              { id: "intour", label: "4. Mid-Tour Additions", icon: PlusCircleOutlined },
              { id: "actual", label: "5. Actual Invoice & Settle", icon: AuditOutlined },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? "bg-[#0B7C8A] text-white shadow"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Feedback Messages */}
          <div className="px-6 pt-3">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}
            {msg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5">
                <CheckCircleOutlined /> {msg}
              </div>
            )}
          </div>

          {/* Modal Tab Body */}
          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4 text-slate-800 text-xs">
            {/* TAB 1: CONFIRMATION */}
            {activeTab === "confirm" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h3 className="font-bold text-sm text-slate-800 mb-2">Tour Confirmation Engine</h3>
                  <p className="text-slate-600 mb-3">
                    Confirming locks this travel inquiry into an active, trackable tour booking and generates an immutable System Tour ID.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-slate-700 mb-4">
                    <div>
                      <span className="text-slate-400">Guest Name:</span> <strong>{booking.userName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span> <strong>{booking.userEmail}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Preferred Start:</span>{" "}
                      <strong>{new Date(booking.preferredStartDate).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Current Status:</span>{" "}
                      <strong className="capitalize">{booking.status}</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmTour}
                    disabled={loading || booking.status === "confirmed"}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all shadow"
                  >
                    <CheckCircleOutlined />{" "}
                    {booking.tourId ? `Already Confirmed (${booking.tourId})` : "Confirm Tour & Generate Tour ID"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: RESOURCE ALLOCATION */}
            {activeTab === "allocate" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Driver Selection */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <CarOutlined /> Assign Chauffeur / Driver
                    </h4>
                    <label className="block text-[11px] text-slate-500 mb-1">Select from Roster:</label>
                    <select
                      onChange={(e) => {
                        const m = crewList.find((c) => c.name === e.target.value);
                        if (m) {
                          setSelectedDriver({ name: m.name, email: m.email, phone: m.phone });
                          if (m.vehicleDetails) {
                            setVehiclePlate(m.vehicleDetails.plateNumber || "");
                            setVehicleModel(m.vehicleDetails.model || "");
                            setVehicleCategory(m.vehicleDetails.category || "Van");
                          }
                        }
                      }}
                      className="w-full text-xs p-2 border rounded-lg bg-white mb-2"
                    >
                      <option value="">-- Choose Driver --</option>
                      {crewList
                        .filter((c) => c.role === "driver" || c.role === "both")
                        .map((c) => (
                          <option key={c._id || c.name} value={c.name}>
                            {c.name} ({c.languages?.join(", ")}) - {c.rating}★
                          </option>
                        ))}
                    </select>

                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        Name:{" "}
                        <input
                          type="text"
                          value={selectedDriver?.name || ""}
                          onChange={(e) =>
                            setSelectedDriver({ ...selectedDriver, name: e.target.value })
                          }
                          className="w-full p-1 border rounded"
                        />
                      </div>
                      <div>
                        Phone:{" "}
                        <input
                          type="text"
                          value={selectedDriver?.phone || ""}
                          onChange={(e) =>
                            setSelectedDriver({ ...selectedDriver, phone: e.target.value })
                          }
                          className="w-full p-1 border rounded"
                        />
                      </div>
                      <div>
                        Email:{" "}
                        <input
                          type="text"
                          value={selectedDriver?.email || ""}
                          onChange={(e) =>
                            setSelectedDriver({ ...selectedDriver, email: e.target.value })
                          }
                          className="w-full p-1 border rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guide Selection */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <UserSwitchOutlined /> Assign Tour Guide
                    </h4>
                    <label className="block text-[11px] text-slate-500 mb-1">Select from Roster:</label>
                    <select
                      onChange={(e) => {
                        const m = crewList.find((c) => c.name === e.target.value);
                        if (m) {
                          setSelectedGuide({ name: m.name, email: m.email, phone: m.phone });
                        }
                      }}
                      className="w-full text-xs p-2 border rounded-lg bg-white mb-2"
                    >
                      <option value="">-- Choose Tour Guide --</option>
                      {crewList
                        .filter((c) => c.role === "tour_guide" || c.role === "both")
                        .map((c) => (
                          <option key={c._id || c.name} value={c.name}>
                            {c.name} ({c.languages?.join(", ")}) - {c.rating}★
                          </option>
                        ))}
                    </select>

                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        Name:{" "}
                        <input
                          type="text"
                          value={selectedGuide?.name || ""}
                          onChange={(e) =>
                            setSelectedGuide({ ...selectedGuide, name: e.target.value })
                          }
                          className="w-full p-1 border rounded"
                        />
                      </div>
                      <div>
                        Phone:{" "}
                        <input
                          type="text"
                          value={selectedGuide?.phone || ""}
                          onChange={(e) =>
                            setSelectedGuide({ ...selectedGuide, phone: e.target.value })
                          }
                          className="w-full p-1 border rounded"
                        />
                      </div>
                      <div>
                        Email:{" "}
                        <input
                          type="text"
                          value={selectedGuide?.email || ""}
                          onChange={(e) =>
                            setSelectedGuide({ ...selectedGuide, email: e.target.value })
                          }
                          className="w-full p-1 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-700 mb-2">Dedicated Vehicle Information</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Plate Number</label>
                      <input
                        type="text"
                        placeholder="e.g. WP-CAB-4421"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Model</label>
                      <input
                        type="text"
                        placeholder="e.g. Toyota KDH Commuter"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Category</label>
                      <select
                        value={vehicleCategory}
                        onChange={(e) => setVehicleCategory(e.target.value)}
                        className="w-full p-1.5 border rounded text-xs"
                      >
                        <option>Sedan</option>
                        <option>Van</option>
                        <option>SUV</option>
                        <option>Mini Coach</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAssignCrew}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow"
                >
                  <SendOutlined /> Save Allocation & Dispatch Crew Notifications
                </button>
              </div>
            )}

            {/* TAB 3: PROFORMA INVOICE */}
            {activeTab === "proforma" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <label className="text-[10px] text-slate-500 block">Hotel Accommodations ($)</label>
                    <input
                      type="number"
                      value={hotelCharges}
                      onChange={(e) => setHotelCharges(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-bold p-1 border rounded mt-1"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <label className="text-[10px] text-slate-500 block">Vehicle & Transit ($)</label>
                    <input
                      type="number"
                      value={vehicleCharges}
                      onChange={(e) => setVehicleCharges(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-bold p-1 border rounded mt-1"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <label className="text-[10px] text-slate-500 block">Driver & Guide Allowance ($)</label>
                    <input
                      type="number"
                      value={driverGuideCharges}
                      onChange={(e) => setDriverGuideCharges(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-bold p-1 border rounded mt-1"
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <label className="text-[10px] text-slate-500 block">Excursion Permits/Passes ($)</label>
                    <input
                      type="number"
                      value={excursionCharges}
                      onChange={(e) => setExcursionCharges(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-bold p-1 border rounded mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                  <div>
                    <label className="font-semibold text-amber-900 block mb-1">
                      Currency Volatility Hedge (Forex Buffer %):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={forexBufferPercent}
                      onChange={(e) => setForexBufferPercent(parseFloat(e.target.value) || 0)}
                      className="w-24 p-1 border rounded text-xs"
                    />{" "}
                    <span className="text-[11px] text-amber-800">
                      (Adds ${proformaForex.toFixed(2)} to absorb currency swings)
                    </span>
                  </div>
                  <div>
                    <label className="font-semibold text-amber-900 block mb-1">Advance Deposit Required (%):</label>
                    <input
                      type="number"
                      value={depositPercent}
                      onChange={(e) => setDepositPercent(parseInt(e.target.value) || 30)}
                      className="w-24 p-1 border rounded text-xs"
                    />{" "}
                    <span className="text-[11px] text-amber-800 font-bold">
                      = ${advanceDepositDue} Due in Advance
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-white/70 uppercase tracking-wider">Total Proforma Amount</span>
                    <div className="text-xl font-black text-amber-400">${proformaTotal} USD</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/70 uppercase tracking-wider">Advance Deposit (30%)</span>
                    <div className="text-lg font-bold text-emerald-400">${advanceDepositDue} USD</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleIssueProforma(false, false)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-[#0B7C8A] text-white font-bold hover:bg-[#0B7C8A]/90 shadow"
                  >
                    Issue Proforma Invoice
                  </button>
                  <button
                    onClick={() => handleIssueProforma(true, false)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-900 inline-flex items-center gap-1.5"
                  >
                    <FilePdfOutlined /> Download Proforma PDF
                  </button>
                  <button
                    onClick={() => handleIssueProforma(false, true)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 inline-flex items-center gap-1.5"
                  >
                    <SendOutlined /> Email to Guest
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: IN-TOUR EXPENSES */}
            {activeTab === "intour" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border rounded-xl">
                  <h4 className="font-bold text-slate-800 mb-2">Log Field Dynamic Addition (Driver / Guest Entry)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] text-slate-500">Category</label>
                      <select
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        className="w-full p-1.5 border rounded text-xs"
                      >
                        <option value="ticket">Attraction Ticket</option>
                        <option value="extra_mileage">Extra KM / Detour</option>
                        <option value="hotel_upgrade">Hotel Upgrade</option>
                        <option value="meals">Meal / Refreshment</option>
                        <option value="other">Other Activity</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] text-slate-500">Item Description</label>
                      <input
                        type="text"
                        placeholder="e.g. 2x Whale Watching tickets at Mirissa"
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Amount ($)</label>
                      <input
                        type="number"
                        placeholder="80"
                        value={expAmount || ""}
                        onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                        className="w-full p-1.5 border rounded text-xs"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleLogExpense}
                    disabled={loading}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-purple-700 text-white font-bold hover:bg-purple-800"
                  >
                    <PlusCircleOutlined /> Add to Tour Ledger
                  </button>
                </div>

                {/* Ledger Listing */}
                <div className="border rounded-xl p-3 bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">Active In-Tour Ledger:</span>
                    <span className="font-bold text-purple-700">Total Additions: +${totalInTourAdditions}</span>
                  </div>
                  {expenses.length > 0 ? (
                    <div className="space-y-1.5">
                      {expenses.map((e, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-2 rounded bg-slate-50 border text-slate-700"
                        >
                          <div>
                            <span className="font-semibold">{e.description}</span>{" "}
                            <span className="text-[10px] text-slate-400">({e.category})</span>
                          </div>
                          <div className="font-bold text-emerald-600">+${e.amount} USD</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No field additions logged yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: ACTUAL INVOICE & FINAL SETTLEMENT */}
            {activeTab === "actual" && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3">Final Financial Reconciliation</h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-slate-600">Proforma Invoice Base:</span>
                      <span className="font-bold">${baseForActual.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b text-emerald-700">
                      <span>Total Mid-Tour Additions:</span>
                      <span className="font-bold">+${totalInTourAdditions.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b items-center text-rose-700">
                      <span>Deductions (Early checkout / unused tickets):</span>
                      <div className="flex items-center gap-1">
                        -$
                        <input
                          type="number"
                          value={deductionsTotal}
                          onChange={(e) => setDeductionsTotal(parseFloat(e.target.value) || 0)}
                          className="w-20 p-1 border rounded text-right text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between py-1 border-b text-slate-800 font-bold">
                      <span>Net Final Actual Tour Cost:</span>
                      <span>${netActualTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b text-emerald-700">
                      <span>Advance Deposit Already Paid:</span>
                      <span className="font-bold">-${advancePaidSoFar.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Net Payable or Refund Callout */}
                  <div
                    className={`p-4 rounded-xl border-2 flex justify-between items-center ${
                      refundDue > 0
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-rose-50 border-rose-300 text-rose-900"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">
                        {refundDue > 0 ? "Credit Refund Due to Guest:" : "Final Balance Payable by Guest:"}
                      </div>
                      <div className="text-[11px] opacity-80">
                        {refundDue > 0
                          ? "Guest ended tour early or skipped services."
                          : "Guest added extra excursions / mileage during trip."}
                      </div>
                    </div>
                    <div className="text-2xl font-black">
                      ${refundDue > 0 ? refundDue.toFixed(2) : balanceDue.toFixed(2)} USD
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateActual(false, false)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-[#059669] text-white font-bold hover:bg-[#059669]/90 shadow"
                  >
                    Generate & Close Actual Invoice
                  </button>
                  <button
                    onClick={() => handleGenerateActual(true, false)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-900 inline-flex items-center gap-1.5"
                  >
                    <FilePdfOutlined /> Download Actual Tax Invoice PDF
                  </button>
                  <button
                    onClick={() => handleGenerateActual(false, true)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 inline-flex items-center gap-1.5"
                  >
                    <SendOutlined /> Email Tax Invoice to Guest
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center">
            <span className="text-[11px] text-slate-500">
              System Tour ID: {booking.tourId || "Generated on confirmation"}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
