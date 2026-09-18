"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CarOutlined,
  CompassOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  LockOutlined,
  IdcardOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useTenant } from "@/context/TenantBrandingContext";

const AVAILABLE_LANGUAGES = [
  "English",
  "German",
  "French",
  "Mandarin",
  "Russian",
  "Italian",
  "Spanish",
  "Arabic",
  "Sinhala",
  "Tamil",
];

const VEHICLE_CATEGORIES = [
  { label: "Sedan (1-3 Guests)", value: "Sedan" },
  { label: "Van / Commuter (4-10 Guests)", value: "Van" },
  { label: "Luxury SUV (1-5 Guests)", value: "SUV" },
  { label: "Mini Coach (10-20 Guests)", value: "Mini Coach" },
];

export default function FreelanceCrewJoinPage() {
  const router = useRouter();
  const tenant = useTenant();
  const brandName = tenant?.name || "Travel Partner";
  const primaryColor = tenant?.branding?.primaryColor || "#0B7C8A";

  const [role, setRole] = useState<"driver" | "tour_guide" | "both">("driver");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  
  // Vehicle info (if role includes driver)
  const [vehicleCategory, setVehicleCategory] = useState("Van");
  const [vehicleModel, setVehicleModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState(6);

  // Security & Notes
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notes, setNotes] = useState("");

  // States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Full name is required");
    if (!email.trim() || !email.includes("@")) return setError("A valid email address is required");
    if (!phone.trim()) return setError("Contact phone number is required");
    if (!licenseNumber.trim()) return setError("License / Registration accreditation number is required");
    if (selectedLanguages.length === 0) return setError("Please select at least one language");
    if (password.length < 6) return setError("Password must be at least 6 characters long");
    if (password !== confirmPassword) return setError("Passwords do not match");

    if (role === "driver" || role === "both") {
      if (!plateNumber.trim()) return setError("Vehicle plate number is required");
      if (!vehicleModel.trim()) return setError("Vehicle model is required");
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        role,
        licenseNumber: licenseNumber.trim(),
        languages: selectedLanguages,
        password,
        notes: notes.trim(),
      };

      if (role === "driver" || role === "both") {
        payload.vehicleDetails = {
          category: vehicleCategory,
          model: vehicleModel.trim(),
          plateNumber: plateNumber.trim().toUpperCase(),
          capacity: Number(capacity),
        };
      }

      const res = await fetch("/api/driver-guide/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Application submission failed");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to submit application. Please check connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg font-black text-xl"
              style={{ backgroundColor: primaryColor }}
            >
              <CarOutlined />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-teal-300 transition">
              {brandName} <span className="text-teal-400 font-normal">Partner Network</span>
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Join as a Freelance Chauffeur or Tour Guide
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Partner with {brandName}. Receive premium tour assignments, fair compensation, and manage your trips seamlessly from your mobile device.
          </p>
        </div>

        {/* Success Confirmation Card */}
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/90 border border-teal-500/40 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl"
          >
            <div className="w-20 h-20 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto text-4xl mb-6 border border-teal-500/30">
              <CheckCircleOutlined />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Application Submitted!</h2>
            <p className="text-slate-300 max-w-md mx-auto text-sm sm:text-base mb-6">
              Thank you for applying, <span className="text-white font-semibold">{name}</span>. Your application has been logged and forwarded to our <strong className="text-teal-300">Marketing & Operations Management team</strong> for review.
            </p>
            
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 max-w-md mx-auto text-left mb-8 space-y-2 text-xs sm:text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Application Role:</span>
                <span className="font-semibold text-white capitalize">{role.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Email:</span>
                <span className="font-semibold text-white">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Review Status:</span>
                <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Pending Admin Approval</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              You will receive an activation email once your credentials and license are approved. You can then log in to the Driver & Guide mobile portal.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-teal-500/20"
              >
                Go to Sign In
              </Link>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition border border-slate-700"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Application Form Card */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl"
          >
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
                <InfoCircleOutlined className="text-rose-400 text-base" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Role Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">
                  Step 1: Select Your Partnership Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("driver")}
                    className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                      role === "driver"
                        ? "bg-teal-900/30 border-teal-500 ring-2 ring-teal-500/30 text-white"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-lg mb-2">
                      <CarOutlined />
                    </div>
                    <span className="font-bold text-sm block">Chauffeur / Driver</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Operate vehicle and drive guest tours</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("tour_guide")}
                    className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                      role === "tour_guide"
                        ? "bg-teal-900/30 border-teal-500 ring-2 ring-teal-500/30 text-white"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-lg mb-2">
                      <CompassOutlined />
                    </div>
                    <span className="font-bold text-sm block">Tour Guide</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">SLTDA certified heritage & wildlife escort</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("both")}
                    className={`p-4 rounded-2xl border text-left transition relative overflow-hidden flex flex-col justify-between ${
                      role === "both"
                        ? "bg-teal-900/30 border-teal-500 ring-2 ring-teal-500/30 text-white"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center text-lg mb-2">
                      <SafetyCertificateOutlined />
                    </div>
                    <span className="font-bold text-sm block">Driver & Guide</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">Combined driving and tourist lecturer</span>
                  </button>
                </div>
              </div>

              {/* 2. Personal & Contact Details */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">
                  Step 2: Personal & Contact Information
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Legal Name *</label>
                    <div className="relative">
                      <UserOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sunil Jayawardena"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
                    <div className="relative">
                      <MailOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number (WhatsApp) *</label>
                    <div className="relative">
                      <PhoneOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+94 77 123 4567"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {role === "tour_guide" ? "Tour Guide License / SLTDA No. *" : "Driver's License / Accreditation No. *"}
                    </label>
                    <div className="relative">
                      <IdcardOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="e.g. DRV-LK-9021 or GUI-LK-3310"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Languages Spoken */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                  Step 3: Languages Spoken
                </label>
                <p className="text-xs text-slate-400 mb-3">Select all languages you can comfortably communicate in with international guests.</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isSelected
                            ? "bg-teal-600 text-white border-teal-500"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        {isSelected && <CheckCircleOutlined className="mr-1 text-[10px]" />}
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Vehicle Details (Only if Driver or Both) */}
              {(role === "driver" || role === "both") && (
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-4">
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                    <CarOutlined />
                    <span>Step 4: Assigned Vehicle Specification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vehicle Category</label>
                      <select
                        value={vehicleCategory}
                        onChange={(e) => setVehicleCategory(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      >
                        {VEHICLE_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Vehicle Model *</label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="e.g. Toyota KDH Commuter or Premio"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">License Plate Number *</label>
                      <input
                        type="text"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. WP-CAB-4421"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white uppercase focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Guest Capacity</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Account Security (Password) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-400 mb-3">
                  Step {role === "tour_guide" ? "4" : "5"}: Portal Login Credentials
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Create Password *</label>
                    <div className="relative">
                      <LockOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <LockOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Experience / Bio Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Professional Experience & Regional Specializations (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell our marketing & operations team about your tour experience, regional routes (e.g. Hill Country, Cultural Triangle, Yala safaris), and customer feedback..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-sm transition shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <LoadingOutlined />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Freelance Application for Review</span>
                      <ArrowRightOutlined />
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-slate-500 mt-3">
                  Applications undergo review by our marketing manager and operations desk prior to account activation.
                </p>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
