"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  FilePdfOutlined,
  SaveOutlined,
  TagsOutlined,
  BankOutlined,
  CompassOutlined,
} from "@ant-design/icons";

import { useTenant } from "@/context/TenantBrandingContext";

interface LeadIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadSaved?: (lead: any) => void;
  onProceedToEstimate?: (leadData: any) => void;
  onProceedToQuotation?: (leadData: any) => void;
}

const INFLOW_CHANNELS = [
  { id: "phone", label: "Phone Call", icon: "📞" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
  { id: "walkin", label: "Walk-In Guest", icon: "🚶" },
  { id: "email", label: "Direct Email", icon: "✉️" },
  { id: "social", label: "Social Media", icon: "📱" },
  { id: "b2b", label: "B2B Partner", icon: "🤝" },
];

const INTEREST_TAGS = [
  "Cultural Heritage & Sigiriya",
  "Wildlife Safari & Yala",
  "Scenic Hill Country & Tea",
  "South Coast Beaches & Surf",
  "Luxury Wellness & Spa",
  "Honeymoon & Couples",
  "Adventure & Nature Hikes",
];

export default function LeadIntakeModal({
  isOpen,
  onClose,
  onLeadSaved,
  onProceedToEstimate,
  onProceedToQuotation,
}: LeadIntakeModalProps) {
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

  // Guest Details
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCountry, setCustomerCountry] = useState("United States");
  const [channel, setChannel] = useState("phone");

  // Trip Specs
  const [packageName, setPackageName] = useState("Tailor-Made Sri Lanka Tour");
  const [preferredStartDate, setPreferredStartDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [durationDays, setDurationDays] = useState(7);
  const [numberOfTravelers, setNumberOfTravelers] = useState(2);
  const [hotelTier, setHotelTier] = useState("4-Star Premium");
  const [vehicleType, setVehicleType] = useState("Van");
  const [budgetRange, setBudgetRange] = useState("$1,500 - $3,000");

  // Interests & Notes
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Cultural Heritage & Sigiriya",
    "Scenic Hill Country & Tea",
  ]);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const getLeadPayload = () => ({
    customerName,
    customerEmail,
    customerPhone,
    customerCountry,
    channel,
    packageName,
    preferredStartDate,
    duration: `${durationDays} Days / ${Math.max(1, durationDays - 1)} Nights`,
    durationDays,
    numberOfTravelers,
    hotelTier,
    vehicleType,
    budgetRange,
    interests: selectedInterests,
    notes,
  });

  const handleSaveLead = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!customerName || !customerEmail || !preferredStartDate) {
      setErrorMsg("Please fill in customer name, email, and preferred start date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = getLeadPayload();
      const res = await fetch("/api/quotations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          numberOfTravelers: payload.numberOfTravelers,
          packageName: payload.packageName,
          preferredStartDate: payload.preferredStartDate,
          duration: payload.duration,
          destinations: payload.interests.join(", "),
          hotelTier: payload.hotelTier,
          transportMode: `Private ${payload.vehicleType}`,
          notes: `[Channel: ${payload.channel}] [Country: ${payload.customerCountry}] [Budget: ${payload.budgetRange}]. ${payload.notes}`,
          saveAsLead: true,
          downloadPdf: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save lead");

      setSuccessMsg("Inquiry successfully logged into the live sales pipeline!");
      if (onLeadSaved) onLeadSaved(data);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record lead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEstimateClick = () => {
    if (!customerName || !customerEmail) {
      setErrorMsg("Please provide customer name and email first.");
      return;
    }
    if (onProceedToEstimate) {
      onProceedToEstimate(getLeadPayload());
    }
    onClose();
  };

  const handleQuotationClick = () => {
    if (!customerName || !customerEmail) {
      setErrorMsg("Please provide customer name and email first.");
      return;
    }
    if (onProceedToQuotation) {
      onProceedToQuotation(getLeadPayload());
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
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-200 text-left"
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
                <UserOutlined />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 leading-tight">Lead Intake Terminal</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Record new prospective traveler inquiry and link to pipeline
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

          <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto text-slate-800">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircleOutlined className="text-base text-emerald-600" />
                {successMsg}
              </div>
            )}

            {/* Inflow Channel Selector */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
                Lead Acquisition Channel
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {INFLOW_CHANNELS.map((ch) => {
                  const isSelected = channel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setChannel(ch.id)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm font-bold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-650 font-medium"
                      }`}
                    >
                      <span className="text-lg">{ch.icon}</span>
                      <span className="text-[11px] leading-tight font-semibold">{ch.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guest Details */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Guest Contact Details
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Customer Name *
                  </label>
                  <div className="relative">
                    <UserOutlined className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. David Miller"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <MailOutlined className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. david@travelers.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <PhoneOutlined className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 349-2810"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Country of Residence
                  </label>
                  <div className="relative">
                    <GlobalOutlined className="absolute left-3 top-2.5 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={customerCountry}
                      onChange={(e) => setCustomerCountry(e.target.value)}
                      placeholder="United Kingdom, Germany, France..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Travel Specs */}
            <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-800" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Journey Requirements
                </h3>
              </div>

              <div className="grid sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Target Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredStartDate}
                    onChange={(e) => setPreferredStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Travelers (Pax)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={numberOfTravelers}
                    onChange={(e) => setNumberOfTravelers(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Hotel Classification
                  </label>
                  <select
                    value={hotelTier}
                    onChange={(e) => setHotelTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                  >
                    <option value="3-Star Standard">3-Star Standard</option>
                    <option value="4-Star Premium">4-Star Premium</option>
                    <option value="5-Star Luxury">5-Star Luxury</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Transport Vehicle
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                  >
                    <option value="Sedan Car">Sedan Car (1-2 Pax)</option>
                    <option value="Van">Van (3-6 Pax)</option>
                    <option value="Luxury SUV">Luxury SUV</option>
                    <option value="Mini Coach">Mini Coach (7-15 Pax)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Target Budget
                  </label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    placeholder="e.g. $2,000 - $3,500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Travel Themes */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                Travel Style & Themes
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-100 text-slate-650 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Officer Notes */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Special Requests & Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific dietary needs, flight arrival times, child car seat required..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* 1. Quick Ballpark Estimator */}
                <button
                  type="button"
                  onClick={handleEstimateClick}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition"
                >
                  <ThunderboltOutlined className="text-amber-600" />
                  Quick Ballpark
                </button>

                {/* 2. Build Quotation PDF */}
                <button
                  type="button"
                  onClick={handleQuotationClick}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300 font-bold text-xs transition"
                >
                  <FilePdfOutlined className="text-orange-600" />
                  Custom Quotation
                </button>

                {/* 3. Direct Save as Lead */}
                <button
                  type="button"
                  onClick={handleSaveLead}
                  disabled={isSubmitting}
                  style={{ backgroundColor: primaryColor }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md hover:brightness-105 transition disabled:opacity-50"
                >
                  <SaveOutlined />
                  {isSubmitting ? "Saving Lead..." : "Save to Pipeline"}
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
