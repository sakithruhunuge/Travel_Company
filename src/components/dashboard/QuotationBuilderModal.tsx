"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseOutlined,
  FilePdfOutlined,
  PlusOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

interface QuotationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuotationCreated?: (quotationData: any) => void;
}

interface LineItem {
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function QuotationBuilderModal({
  isOpen,
  onClose,
  onQuotationCreated,
}: QuotationBuilderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [numberOfTravelers, setNumberOfTravelers] = useState(2);
  const [packageName, setPackageName] = useState("Custom Tailor-Made Tour");
  const [preferredStartDate, setPreferredStartDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [duration, setDuration] = useState("7 Days / 6 Nights");
  const [destinations, setDestinations] = useState("Colombo, Kandy, Ella, Yala, Mirissa");
  const [hotelTier, setHotelTier] = useState("4-Star Premium");
  const [transportMode, setTransportMode] = useState("Private Air-Conditioned Van");
  const [markupPercent, setMarkupPercent] = useState(12);
  const [notes, setNotes] = useState("All entrance tickets and daily breakfast included.");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      title: "Private Dedicated Vehicle & Chauffeur",
      description: "Includes fuel, highway tolls, parking & driver daily allowance",
      quantity: 1,
      unitPrice: 700,
    },
    {
      title: "Hotel Accommodations (4-Star Premium)",
      description: "Twin-sharing rooms with complimentary breakfast (6 nights)",
      quantity: 6,
      unitPrice: 130,
    },
    {
      title: "Excursion Tickets & Safari Passes",
      description: "Sigiriya Rock, Yala Safari Jeep & Kandy Temple tickets",
      quantity: 2,
      unitPrice: 110,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        title: "Additional Excursion / Service",
        description: "",
        quantity: 1,
        unitPrice: 50,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItem, val: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    setLineItems(updated);
  };

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const markupAmount = (subtotal * markupPercent) / 100;
  const grandTotal = subtotal + markupAmount;
  const perPersonTotal = numberOfTravelers > 0 ? grandTotal / numberOfTravelers : 0;

  const handleSubmit = async (downloadPdf = false) => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!customerName || !customerEmail || !preferredStartDate) {
      setErrorMsg("Please fill in customer name, email, and preferred start date.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (downloadPdf) {
        // Direct download via window/form
        const response = await fetch("/api/quotations/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            customerEmail,
            customerPhone,
            numberOfTravelers,
            packageName,
            preferredStartDate,
            duration,
            destinations,
            hotelTier,
            transportMode,
            lineItems,
            markupPercent,
            notes,
            saveAsLead: true,
            downloadPdf: true,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to generate quotation PDF");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Quotation-${customerName.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setSuccessMsg("Quotation PDF generated and downloaded successfully!");
      } else {
        const response = await fetch("/api/quotations/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerName,
            customerEmail,
            customerPhone,
            numberOfTravelers,
            packageName,
            preferredStartDate,
            duration,
            destinations,
            hotelTier,
            transportMode,
            lineItems,
            markupPercent,
            notes,
            saveAsLead: true,
            downloadPdf: false,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save quotation");

        setSuccessMsg("Quotation saved as a live booking lead!");
        if (onQuotationCreated) onQuotationCreated(data);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-200"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#0B7C8A] to-[#041A16] px-6 py-5 text-white flex justify-between items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-1">
                Marketing Officer Tool
              </div>
              <h2 className="text-xl font-bold">Prepare Formal Tour Quotation</h2>
              <p className="text-xs text-white/80">
                Capture inbound telephone/email lead, customize day-by-day services, and generate a branded proposal document.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors text-white text-lg"
            >
              <CloseOutlined />
            </button>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6 text-slate-800">
            {errorMsg && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                <CheckCircleOutlined />
                {successMsg}
              </div>
            )}

            {/* Section 1: Customer Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <UserOutlined /> Guest Inbound Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Dr. Thomas Mueller"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+49 170 1234567"
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Tour Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Package / Tour Title</label>
                <input
                  type="text"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Preferred Start Date *</label>
                <input
                  type="date"
                  value={preferredStartDate}
                  onChange={(e) => setPreferredStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Number of Travelers</label>
                <input
                  type="number"
                  min="1"
                  value={numberOfTravelers}
                  onChange={(e) => setNumberOfTravelers(parseInt(e.target.value) || 1)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="7 Days / 6 Nights"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hotel Category</label>
                <select
                  value={hotelTier}
                  onChange={(e) => setHotelTier(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                >
                  <option>3-Star Comfort</option>
                  <option>4-Star Premium</option>
                  <option>5-Star Luxury Boutique</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Type</label>
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
                >
                  <option>Private Sedan (1-3 Pax)</option>
                  <option>Private Air-Conditioned Van (4-8 Pax)</option>
                  <option>Luxury SUV (1-4 Pax)</option>
                  <option>Mini Coach (9-15 Pax)</option>
                </select>
              </div>
            </div>

            {/* Destinations */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Planned Destinations / Route</label>
              <input
                type="text"
                value={destinations}
                onChange={(e) => setDestinations(e.target.value)}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
              />
            </div>

            {/* Section 3: Itemized Service Line Items */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Itemized Cost Breakdown & Inclusions
                </h3>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0B7C8A]/10 text-[#0B7C8A] text-xs font-semibold hover:bg-[#0B7C8A]/20 transition-colors"
                >
                  <PlusOutlined /> Add Service Line
                </button>
              </div>

              <div className="space-y-2.5">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Service item title"
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, "title", e.target.value)}
                        className="w-full text-xs font-semibold px-2.5 py-1.5 border rounded outline-none mb-1"
                      />
                      <input
                        type="text"
                        placeholder="Description / inclusions note"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        className="w-full text-[11px] text-slate-500 px-2.5 py-1 border rounded outline-none"
                      />
                    </div>
                    <div className="w-16">
                      <label className="block text-[10px] text-slate-400">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full text-xs px-2 py-1.5 border rounded text-center"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] text-slate-400">Rate ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full text-xs px-2 py-1.5 border rounded text-right"
                      />
                    </div>
                    <div className="w-24 text-right pt-4">
                      <span className="text-xs font-bold text-slate-800">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="pt-4 text-slate-400 hover:text-rose-500 text-xs px-1"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary & Markup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Marketing Margin / Markup (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(parseInt(e.target.value))}
                    className="flex-1 accent-[#0B7C8A]"
                  />
                  <span className="text-xs font-bold text-[#0B7C8A] w-12 text-right">
                    {markupPercent}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Markup covers agency operational overhead and commission margins.
                </p>
              </div>

              <div className="space-y-1 text-right text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Net Estimated Subtotal:</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Agency Markup ({markupPercent}%):</span>
                  <span className="font-semibold">+${markupAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#0B7C8A] pt-2 border-t border-slate-200">
                  <span>Total Quotation:</span>
                  <span className="text-base">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  ≈ ${perPersonTotal.toFixed(2)} per person ({numberOfTravelers} travelers)
                </div>
              </div>
            </div>

            {/* Special Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quotation Terms & Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-[#0B7C8A] outline-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 disabled:opacity-50"
              >
                <FilePdfOutlined /> Download Quotation PDF
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0B7C8A] text-white text-xs font-semibold hover:bg-[#0B7C8A]/90 shadow-md disabled:opacity-50"
              >
                <DollarCircleOutlined /> Save as Live Booking Lead
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
