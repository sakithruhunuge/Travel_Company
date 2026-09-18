"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseOutlined,
  CalculatorOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  CalendarOutlined,
  CarOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

interface AgentQuickEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvertToQuotation?: (estimateData: any) => void;
}

export default function AgentQuickEstimatorModal({
  isOpen,
  onClose,
  onConvertToQuotation,
}: AgentQuickEstimatorModalProps) {
  const [days, setDays] = useState(7);
  const [travelers, setTravelers] = useState(2);
  const [hotelTier, setHotelTier] = useState("4-Star Premium");
  const [vehicleType, setVehicleType] = useState("Van");
  const [commissionPercent, setCommissionPercent] = useState(10);

  const [estimate, setEstimate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateEstimate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/agent/quick-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days,
          travelers,
          hotelTier,
          vehicleType,
          commissionPercent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEstimate(data.estimate);
      }
    } catch (err) {
      console.error("Quick estimate error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      calculateEstimate();
    }
  }, [isOpen, days, travelers, hotelTier, vehicleType, commissionPercent]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl text-lg">
                <ThunderboltOutlined />
              </div>
              <div>
                <h2 className="text-lg font-bold">Travel Agent Rapid Estimator</h2>
                <p className="text-xs text-white/80">
                  Instant ballpark calculation for prospective guest phone inquiries & B2B margins
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="p-6 space-y-5 text-slate-800">
            {/* Quick Selectors */}
            <div className="grid grid-cols-2 gap-4">
              {/* Duration Slider */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CalendarOutlined /> Tour Duration
                  </label>
                  <span className="text-xs font-bold text-amber-700">{days} Days</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="21"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>2 Days</span>
                  <span>7 Days</span>
                  <span>14 Days</span>
                  <span>21 Days</span>
                </div>
              </div>

              {/* Travelers Slider */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TeamOutlined /> Travelers (Pax)
                  </label>
                  <span className="text-xs font-bold text-amber-700">{travelers} Pax</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={travelers}
                  onChange={(e) => setTravelers(parseInt(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>1 Solo</span>
                  <span>2 Couple</span>
                  <span>4 Family</span>
                  <span>14 Group</span>
                </div>
              </div>
            </div>

            {/* Hotel Tier & Vehicle Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Category</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["3-Star", "4-Star", "5-Star"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setHotelTier(t === "3-Star" ? "3-Star Standard" : t === "4-Star" ? "4-Star Premium" : "5-Star Luxury")}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        hotelTier.includes(t)
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Class</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "Sedan", val: "Car / Sedan" },
                    { label: "Van", val: "Van" },
                    { label: "Coach", val: "Mini-Coach" },
                  ].map((v) => (
                    <button
                      key={v.val}
                      type="button"
                      onClick={() => setVehicleType(v.val)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        vehicleType === v.val
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Agent Commission Margin */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <DollarOutlined /> Agent Commission / Margin Split
                </label>
                <span className="text-xs font-bold text-amber-800">{commissionPercent}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(parseInt(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[11px] text-amber-800/80 mt-1">
                Adjusts your net commission profit margin above baseline agency provider rates.
              </p>
            </div>

            {/* Real-Time Calculation Result Card */}
            {estimate && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                      Rough Quote Estimate ({days} Days / {travelers} Pax)
                    </span>
                    <div className="text-2xl font-black text-white mt-0.5">
                      ${estimate.suggestedRetailTotal.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-white/70">USD Retail</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
                      Your Commission
                    </span>
                    <div className="text-lg font-bold text-emerald-400">
                      +${estimate.commissionAmount.toLocaleString()}{" "}
                      <span className="text-xs font-normal text-white/70">({commissionPercent}%)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/5 p-2 rounded-lg">
                    <div className="text-white/60 text-[10px]">Net B2B Cost</div>
                    <div className="font-semibold text-white mt-0.5">
                      ${estimate.netCost.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg">
                    <div className="text-white/60 text-[10px]">Per Person</div>
                    <div className="font-semibold text-amber-300 mt-0.5">
                      ${estimate.pricePerPerson.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg">
                    <div className="text-white/60 text-[10px]">Accommodations</div>
                    <div className="font-semibold text-white mt-0.5">
                      {estimate.rooms} Room(s)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (onConvertToQuotation && estimate) {
                  onConvertToQuotation(estimate);
                }
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-md transition-all"
            >
              Convert to Formal Quotation <ArrowRightOutlined />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
