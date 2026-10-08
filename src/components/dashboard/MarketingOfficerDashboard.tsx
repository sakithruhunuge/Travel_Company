"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTenant } from "@/context/TenantBrandingContext";
import { useLocale } from "next-intl";
import {
  UserOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  FilePdfOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TeamOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  DownloadOutlined,
  CalendarOutlined,
  CarOutlined,
  FilterOutlined,
  ReloadOutlined,
  RiseOutlined,
  CheckOutlined,
  GlobalOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  FundProjectionScreenOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import LeadIntakeModal from "./LeadIntakeModal";
import MarketingItineraryCustomizerModal from "./MarketingItineraryCustomizerModal";
import AgentQuickEstimatorModal from "./AgentQuickEstimatorModal";
import QuotationBuilderModal from "./QuotationBuilderModal";
import EmptyState from "./EmptyState";

interface LeadRequest {
  _id: string;
  tourId?: string;
  packageName: string;
  userName: string;
  userEmail: string;
  numberOfTravelers: number;
  preferredStartDate: string;
  submittedTotal?: number;
  status: string;
  createdAt: string;
  specialRequests?: string;
  quotation?: any;
  source?: string;
}

export default function MarketingOfficerDashboard() {
  const { data: session } = useSession();
  const tenant = useTenant();
  const locale = useLocale();
  const primaryColor = tenant?.branding?.primaryColor || "#FF8B50";

  const [leads, setLeads] = useState<LeadRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "quoted" | "approved">("all");

  // Modals state
  const [isLeadIntakeOpen, setIsLeadIntakeOpen] = useState(false);
  const [isItineraryCustomizerOpen, setIsItineraryCustomizerOpen] = useState(false);
  const [isAgentEstimatorOpen, setIsAgentEstimatorOpen] = useState(false);
  const [isQuotationBuilderOpen, setIsQuotationBuilderOpen] = useState(false);

  // Shared payload passed between tools
  const [activeLeadData, setActiveLeadData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/travel-requests");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.requests || []);
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load inquiries");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch sales pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      const matchesSearch =
        item.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.packageName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item._id?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === "all") return true;
      if (activeFilter === "pending") return item.status === "pending";
      if (activeFilter === "quoted") return item.status === "quoted" || Boolean(item.quotation);
      if (activeFilter === "approved") return item.status === "approved";
      return true;
    });
  }, [leads, searchQuery, activeFilter]);

  // KPI Calculations
  const totalLeads = leads.length;
  const pendingLeads = leads.filter((l) => l.status === "pending").length;
  const quotedLeads = leads.filter((l) => l.status === "quoted" || Boolean(l.quotation)).length;
  const approvedTours = leads.filter((l) => l.status === "approved").length;
  const pipelineValue = leads.reduce((sum, l) => sum + (Number(l.submittedTotal) || 0), 0);
  const conversionRate = totalLeads > 0 ? Math.round((approvedTours / totalLeads) * 100) : 0;

  // Handle cross-modal transfers
  const handleProceedToEstimateFromLead = (leadData: any) => {
    setActiveLeadData(leadData);
    setIsAgentEstimatorOpen(true);
  };

  const handleProceedToQuotationFromLead = (leadData: any) => {
    setActiveLeadData(leadData);
    setIsQuotationBuilderOpen(true);
  };

  const handleConvertToQuotationFromEstimator = (estimateData: any) => {
    const formattedData = {
      ...activeLeadData,
      numberOfTravelers: estimateData.travelers,
      hotelTier: estimateData.hotelTier,
      transportMode: `Private ${estimateData.vehicleType}`,
      duration: `${estimateData.days} Days / ${Math.max(1, estimateData.days - 1)} Nights`,
      markupPercent: estimateData.commissionPercent,
      lineItems: [
        {
          title: `Vehicle Transit (${estimateData.vehicleType}, ${estimateData.days} Days)`,
          description: "Dedicated transport with fuel, highway tolls & driver expenses",
          quantity: 1,
          unitPrice: estimateData.breakdown?.vehicleTransit || 600,
        },
        {
          title: `Hotel Accommodations (${estimateData.hotelTier})`,
          description: `${estimateData.rooms} Rooms for ${estimateData.travelers} Guests`,
          quantity: Math.max(1, estimateData.days - 1),
          unitPrice: Math.round((estimateData.breakdown?.hotelAccommodations || 700) / Math.max(1, estimateData.days - 1)),
        },
        {
          title: "Excursion Tickets & Activities",
          description: "Major landmarks, entry passes & safari permits",
          quantity: estimateData.travelers,
          unitPrice: Math.round((estimateData.breakdown?.excursionsAndPasses || 200) / Math.max(1, estimateData.travelers)),
        },
      ],
    };
    setActiveLeadData(formattedData);
    setIsAgentEstimatorOpen(false);
    setIsQuotationBuilderOpen(true);
  };

  const handleConvertToQuotationFromItinerary = (itineraryData: any) => {
    setActiveLeadData(itineraryData);
    setIsItineraryCustomizerOpen(false);
    setIsQuotationBuilderOpen(true);
  };

  const handleOpenQuotationForLead = (lead: LeadRequest) => {
    setActiveLeadData({
      customerName: lead.userName,
      customerEmail: lead.userEmail,
      numberOfTravelers: lead.numberOfTravelers,
      packageName: lead.packageName,
      preferredStartDate: lead.preferredStartDate,
      specialRequests: lead.specialRequests,
    });
    setIsQuotationBuilderOpen(true);
  };

  const handleOpenEstimatorForLead = (lead: LeadRequest) => {
    setActiveLeadData({
      customerName: lead.userName,
      customerEmail: lead.userEmail,
      travelers: lead.numberOfTravelers,
      packageName: lead.packageName,
    });
    setIsAgentEstimatorOpen(true);
  };

  const handleOpenItineraryForLead = (lead: LeadRequest) => {
    setActiveLeadData({
      customerName: lead.userName,
      numberOfTravelers: lead.numberOfTravelers,
      packageName: lead.packageName,
    });
    setIsItineraryCustomizerOpen(true);
  };

  return (
    <div className="space-y-8 text-left max-w-7xl mx-auto pb-12">
      {/* Executive Command Header - Glass Effect with Tenant Primary Color Shading */}
      <section
        className="relative overflow-hidden rounded-3xl border border-white/60 shadow-xl p-7 md:p-10 text-slate-900 backdrop-blur-2xl transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.45) 55%, ${primaryColor}18 100%)`,
        }}
      >
        {/* Subtle Ambient Radial Glows shaded with tenant primary color */}
        <div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl pointer-events-none opacity-25 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full blur-3xl pointer-events-none opacity-20 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider border shadow-sm backdrop-blur-sm"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  borderColor: `${primaryColor}35`,
                  color: primaryColor,
                }}
              >
                <SafetyCertificateOutlined />
                Marketing Officer Hub
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 border border-white/80 bg-white/70 backdrop-blur-sm rounded-full px-3.5 py-1 shadow-sm">
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                {tenant?.name || "Ceylon Travel"}
              </span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Sales & Inquiries Workspace
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 font-medium max-w-xl leading-relaxed">
                Welcome back, <span className="font-extrabold text-slate-900">{session?.user?.name || "Marketing Officer"}</span>. Manage live traveler inquiries, build day-by-day itineraries, produce branded Quotation PDFs, and calculate instant ballpark estimates.
              </p>
            </div>

            {/* Quick Action Dock */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => {
                  setActiveLeadData(null);
                  setIsLeadIntakeOpen(true);
                }}
                style={{ backgroundColor: primaryColor }}
                className="inline-flex items-center gap-2 rounded-xl text-white font-extrabold px-5 py-2.5 text-xs shadow-lg hover:brightness-105 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <PlusOutlined className="text-sm font-black" />
                New Lead Intake
              </button>

              <button
                onClick={() => {
                  setActiveLeadData(null);
                  setIsItineraryCustomizerOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white/70 hover:bg-white text-slate-800 border border-white/80 hover:border-slate-300 px-4 py-2.5 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm backdrop-blur-sm"
              >
                <CompassOutlined className="text-emerald-600 text-sm" />
                Itinerary Customizer
              </button>

              <button
                onClick={() => {
                  setActiveLeadData(null);
                  setIsAgentEstimatorOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white/70 hover:bg-white text-slate-800 border border-white/80 hover:border-slate-300 px-4 py-2.5 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm backdrop-blur-sm"
              >
                <ThunderboltOutlined className="text-amber-600 text-sm" />
                Quick Estimator
              </button>

              <button
                onClick={() => {
                  setActiveLeadData(null);
                  setIsQuotationBuilderOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white/70 hover:bg-white text-slate-800 border border-white/80 hover:border-slate-300 px-4 py-2.5 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm backdrop-blur-sm"
              >
                <FilePdfOutlined className="text-rose-600 text-sm" />
                Quotation PDF
              </button>
            </div>
          </div>

          {/* Quick Performance Badge */}
          <div
            className="rounded-2xl border border-white/80 p-5 backdrop-blur-xl flex flex-col justify-between h-full min-w-[260px] shadow-sm"
            style={{
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.5) 100%)`,
            }}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Conversion Efficiency
              </span>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-3xl font-black text-slate-900">{conversionRate}%</span>
                <span
                  className="text-xs font-bold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${primaryColor}18`,
                    color: primaryColor,
                  }}
                >
                  <RiseOutlined /> Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {approvedTours} of {totalLeads} inquiries converted into confirmed tours
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200/70 mt-4 flex items-center justify-between text-xs text-slate-600">
              <span>Pipeline Inflow:</span>
              <span className="font-extrabold text-slate-900">{leads.length} Bookings</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Professional KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">
              <TeamOutlined />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 tracking-tight">{totalLeads}</p>
            <span className="text-[11px] font-bold text-slate-500">All channels</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Walk-ins, phone, WhatsApp & web</p>
        </div>

        {/* Card 2: Active Quotes */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Quotes</span>
            <div className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">
              <FilePdfOutlined />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-3xl font-black text-orange-600 tracking-tight">{quotedLeads}</p>
            <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">In review</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Formal proposals issued to guests</p>
        </div>

        {/* Card 3: Confirmed Tours */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirmed Tours</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              <CheckCircleOutlined />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-3xl font-black text-emerald-600 tracking-tight">{approvedTours}</p>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Approved</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Ready for guide & vehicle dispatch</p>
        </div>

        {/* Card 4: Pipeline Value */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Value</span>
            <div className="h-8 w-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-sm font-bold">
              <DollarOutlined />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              ${pipelineValue >= 1000 ? `${(pipelineValue / 1000).toFixed(1)}k` : pipelineValue.toLocaleString()}
            </p>
            <span className="text-[11px] font-bold text-slate-500">USD</span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-medium">Estimated gross booking revenue</p>
        </div>
      </section>

      {/* 4 Professional Tool Cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tool 1 */}
        <div
          onClick={() => {
            setActiveLeadData(null);
            setIsLeadIntakeOpen(true);
          }}
          className="group cursor-pointer rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition">
                <UserOutlined />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                Inflow
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition">
                Lead Intake UI
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Log fresh inquiries from phone, WhatsApp, walk-ins, and agency partners with customer details & budget.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600">
            <span>Open Intake Form</span>
            <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tool 2 */}
        <div
          onClick={() => {
            setActiveLeadData(null);
            setIsItineraryCustomizerOpen(true);
          }}
          className="group cursor-pointer rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition">
                <CompassOutlined />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Planner
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition">
                Itinerary Customizer
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Configure day-by-day journeys, hotel meal plans, landmark excursions, and transit vehicles.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>Build Route</span>
            <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tool 3 */}
        <div
          onClick={() => {
            setActiveLeadData(null);
            setIsAgentEstimatorOpen(true);
          }}
          className="group cursor-pointer rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition">
                <ThunderboltOutlined />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Rapid
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition">
                Agent Quick Estimator
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Compute instant ballpark quotes during incoming traveler phone calls with real-time margins.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
            <span>Calculate Ballpark</span>
            <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Tool 4 */}
        <div
          onClick={() => {
            setActiveLeadData(null);
            setIsQuotationBuilderOpen(true);
          }}
          className="group cursor-pointer rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-lg font-bold group-hover:scale-105 transition">
                <FilePdfOutlined />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                Branded PDF
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 group-hover:text-rose-600 transition">
                Quotation PDF Generator
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Export client proposals with line items, tax markups, organization branding, and terms.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
            <span>Generate Document</span>
            <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* Main Table: Inquiries & Pipeline Management */}
      <section className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Control Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              <h2 className="text-lg md:text-xl font-black text-slate-900">
                Active Inquiries & Quotation Pipeline
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Filter by stage, customize day-by-day itineraries, and dispatch quotations directly to guests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <SearchOutlined className="absolute left-3.5 top-3 text-slate-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest or package..."
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-slate-800 focus:ring-1 focus:ring-slate-800 outline-none w-56 sm:w-64 transition"
              />
            </div>

            <button
              onClick={loadData}
              title="Refresh Pipeline"
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition text-xs"
            >
              <ReloadOutlined />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="px-6 md:px-8 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: `All Inquiries (${leads.length})` },
            { id: "pending", label: `Pending Leads (${pendingLeads})` },
            { id: "quoted", label: `Active Quotes (${quotedLeads})` },
            { id: "approved", label: `Confirmed Tours (${approvedTours})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeFilter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900 mx-auto" />
            <p className="mt-3 text-xs font-semibold text-slate-500">Loading pipeline inquiries...</p>
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState title="Unable to load inquiries" description={error} />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Inquiries found"
              description="Click 'New Lead Intake' above to log a new traveler inquiry or adjust search filters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Guest Contact</th>
                  <th className="px-6 py-4">Tour / Package</th>
                  <th className="px-6 py-4">Travel Dates</th>
                  <th className="px-6 py-4">Pipeline Value</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredLeads.map((item) => {
                  const isQuoted = item.status === "quoted" || Boolean(item.quotation);
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Guest Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                            {item.userName?.charAt(0)?.toUpperCase() || "G"}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs leading-tight">
                              {item.userName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Package Column */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">
                          {item.packageName}
                        </span>
                        {item.specialRequests && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                            {item.specialRequests}
                          </p>
                        )}
                      </td>

                      {/* Travel Dates & Travelers */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <CalendarOutlined className="text-slate-400 text-[11px]" />
                          {new Date(item.preferredStartDate).toLocaleDateString()}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {item.numberOfTravelers} Travelers
                        </span>
                      </td>

                      {/* Total Column */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-900">
                          {item.submittedTotal ? `$${item.submittedTotal.toLocaleString()}` : "—"}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isQuoted
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : item.status === "rejected"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.status === "approved"
                                ? "bg-emerald-500"
                                : isQuoted
                                ? "bg-orange-500"
                                : item.status === "rejected"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {item.status}
                        </span>
                      </td>

                      {/* Action Tool Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEstimatorForLead(item)}
                            title="Quick Ballpark Estimate"
                            className="p-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition text-xs font-bold"
                          >
                            <ThunderboltOutlined />
                          </button>

                          <button
                            onClick={() => handleOpenItineraryForLead(item)}
                            title="Customize Day-by-Day Itinerary"
                            className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition text-xs font-bold"
                          >
                            <CompassOutlined />
                          </button>

                          <button
                            onClick={() => handleOpenQuotationForLead(item)}
                            title="Generate Quotation PDF"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
                          >
                            <FilePdfOutlined />
                            Quote
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Integrated Modals */}
      <LeadIntakeModal
        isOpen={isLeadIntakeOpen}
        onClose={() => setIsLeadIntakeOpen(false)}
        onLeadSaved={() => loadData()}
        onProceedToEstimate={handleProceedToEstimateFromLead}
        onProceedToQuotation={handleProceedToQuotationFromLead}
      />

      <MarketingItineraryCustomizerModal
        isOpen={isItineraryCustomizerOpen}
        onClose={() => setIsItineraryCustomizerOpen(false)}
        initialData={activeLeadData}
        onConvertToQuotation={handleConvertToQuotationFromItinerary}
      />

      <AgentQuickEstimatorModal
        isOpen={isAgentEstimatorOpen}
        onClose={() => setIsAgentEstimatorOpen(false)}
        onConvertToQuotation={handleConvertToQuotationFromEstimator}
      />

      <QuotationBuilderModal
        isOpen={isQuotationBuilderOpen}
        onClose={() => setIsQuotationBuilderOpen(false)}
        initialData={activeLeadData}
        onQuotationCreated={() => loadData()}
      />
    </div>
  );
}
