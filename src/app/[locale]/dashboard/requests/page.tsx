"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/dashboard/EmptyState";
import StatsOverviewCard from "@/components/dashboard/StatsOverviewCard";
import Image from "next/image";
import { parseRequestPricing } from "@/lib/pricingParser";
import { detectRequestedServices } from "@/lib/requestedServices";
import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  CalendarOutlined,
  TeamOutlined,
  MailOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  CompassOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  CopyOutlined,
  LinkOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  AuditOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import QuotationBuilderModal from "@/components/dashboard/QuotationBuilderModal";
import AgentQuickEstimatorModal from "@/components/dashboard/AgentQuickEstimatorModal";
import TourLifecycleModal from "@/components/dashboard/TourLifecycleModal";
import CrewScheduleTimeline from "@/components/dashboard/CrewScheduleTimeline";

interface AssignedPerson {
  name?: string;
  email?: string;
  phone?: string;
}

interface RequestData {
  _id: string;
  tourId?: string;
  packageName: string;
  numberOfTravelers: number;
  preferredStartDate: string;
  specialRequests: string;
  status: string;
  createdAt: string;
  userId: string;
  userName: string;
  userEmail: string;
  tourGuide?: AssignedPerson;
  driver?: AssignedPerson;
  assignedVehicle?: any;
  agencyNotes?: string;
  pricingInputs?: any;
  quotation?: any;
  proforma?: any;
  actualInvoice?: any;
  inTourExpenses?: any[];
}

const DESTINATION_IMAGES: Record<string, string> = {
  Sigiriya: "/images/sigiriya.png",
  Galle: "/images/galle.png",
  Ella: "/images/nine_arch.png",
  "Nuwara Eliya": "/images/tea.png",
  Colombo: "/images/colombo.png",
  Bentota: "/images/bentota.png",
  Mirissa: "/images/mirissa.png",
  Kandy: "/images/kandy.png",
  Yala: "/images/yala.png",
  Dambulla: "/images/dambulla.png",
};

// Helper to parse destinations list from request text
const parseDestinations = (text: string): string[] => {
  if (!text) return [];
  const match = text.match(/(?:Selected Destinations|Custom Destinations):\s*(.*)/i);
  if (match && match[1]) {
    // Strip brackets or parentheses if any, then split by commas
    const rawList = match[1].replace(/[\[\]\(\)]/g, "");
    return rawList.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

// Helper to get fallback package image
const getPackageImage = (packageName: string): string => {
  const name = packageName.toLowerCase();
  if (name.includes("cultural")) return "/images/sigiriya.png";
  if (name.includes("southern") || name.includes("beach")) return "/images/mirissa.png";
  if (name.includes("hill") || name.includes("country")) return "/images/nine_arch.png";
  if (name.includes("safari") || name.includes("wildlife")) return "/images/yala.png";
  if (name.includes("grand") || name.includes("tour")) return "/images/colombo.png";
  return "/images/nine_arch.png";
};

export default function TenantRequestsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected" | "cancelled">("all");
  const [serviceFilter, setServiceFilter] = useState<"all" | "driver" | "guide">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Drawer details state
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modals for Marketing Officer, Agent, and Tour Lifecycle
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [isAgentEstimatorOpen, setIsAgentEstimatorOpen] = useState(false);
  const [isLifecycleOpen, setIsLifecycleOpen] = useState(false);
  const [lifecycleBooking, setLifecycleBooking] = useState<RequestData | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  // Custom adjustments and Link Copy state
  const [customCharges, setCustomCharges] = useState<number>(0);
  const [additionalTaxes, setAdditionalTaxes] = useState<number>(0);
  const [paymentLinkCopied, setPaymentLinkCopied] = useState<boolean>(false);

  // Guide & Driver assignment state
  const [tourGuideName, setTourGuideName] = useState("");
  const [tourGuideEmail, setTourGuideEmail] = useState("");
  const [tourGuidePhone, setTourGuidePhone] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [agencyNotes, setAgencyNotes] = useState("");

  // Send trip brief state
  const [briefRecipientEmail, setBriefRecipientEmail] = useState("");
  const [briefRecipientName, setBriefRecipientName] = useState("");
  const [briefRole, setBriefRole] = useState<"Tour Guide" | "Car Driver">("Tour Guide");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefSuccess, setBriefSuccess] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRequest) {
      const { metrics } = parseRequestPricing(selectedRequest.specialRequests || "");
      setCustomCharges(metrics.customCharges || 0);
      setAdditionalTaxes(metrics.additionalTaxes || 0);
      setPaymentLinkCopied(false);
      // Pre-fill guide/driver fields from persisted data
      setTourGuideName(selectedRequest.tourGuide?.name || "");
      setTourGuideEmail(selectedRequest.tourGuide?.email || "");
      setTourGuidePhone(selectedRequest.tourGuide?.phone || "");
      setDriverName(selectedRequest.driver?.name || "");
      setDriverEmail(selectedRequest.driver?.email || "");
      setDriverPhone(selectedRequest.driver?.phone || "");
      setAgencyNotes(selectedRequest.agencyNotes || "");
      // Pre-populate brief fields from existing assignment
      setBriefRecipientEmail("");
      setBriefRecipientName("");
      setBriefRole("Tour Guide");
      setBriefSuccess(false);
      setBriefError(null);
    }
  }, [selectedRequest]);

  const parsedData = selectedRequest ? parseRequestPricing(selectedRequest.specialRequests || "") : null;
  const metrics = parsedData?.metrics;
  const isCustomCalc = parsedData?.isCustomCalc;
  const travelerNotes = parsedData?.notes;

  useEffect(() => {
    if (userRole === "tenant_admin" || userRole === "super_admin" || userRole === "admin") {
      loadRequests();
    }
  }, [userRole]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/travel-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        throw new Error("Failed to load travel bookings inbox.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const body: Record<string, any> = { status: nextStatus };
      // Always persist guide/driver/notes even on simple approve
      if (tourGuideName) body.tourGuide = { name: tourGuideName, email: tourGuideEmail, phone: tourGuidePhone };
      if (driverName) body.driver = { name: driverName, email: driverEmail, phone: driverPhone };
      if (agencyNotes) body.agencyNotes = agencyNotes;

      const res = await fetch(`/api/travel-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to transition request to ${nextStatus}.`);
      }

      // Update requests locally
      setRequests((prev) =>
        prev.map((req) => (req._id === id ? { ...req, status: nextStatus } : req))
      );

      // Update drawer selection status
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest({ ...selectedRequest, status: nextStatus });
      }
    } catch (err) {
      console.error(err);
      setActionError(err instanceof Error ? err.message : "Failed to execute request action.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecalculateAndApprove = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/travel-requests/${selectedRequest._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          customCharges,
          additionalTaxes,
          tourGuide: {
            name: tourGuideName.trim() || undefined,
            email: tourGuideEmail.trim() || undefined,
            phone: tourGuidePhone.trim() || undefined,
          },
          driver: {
            name: driverName.trim() || undefined,
            email: driverEmail.trim() || undefined,
            phone: driverPhone.trim() || undefined,
          },
          agencyNotes: agencyNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to recalculate and approve.");

      await loadRequests();
      setSelectedRequest((prev) =>
        prev ? { ...prev, status: "approved", specialRequests: data.updatedSpecialRequests || prev.specialRequests } : null
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to execute calculation update.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTripBrief = async () => {
    if (!selectedRequest || !briefRecipientEmail || !briefRecipientName) return;
    setBriefLoading(true);
    setBriefSuccess(false);
    setBriefError(null);
    try {
      const res = await fetch(`/api/travel-requests/${selectedRequest._id}/send-trip-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: briefRecipientEmail,
          recipientName: briefRecipientName,
          role: briefRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send trip brief.");
      setBriefSuccess(true);
      setTimeout(() => setBriefSuccess(false), 4000);
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : "Failed to send trip brief.");
    } finally {
      setBriefLoading(false);
    }
  };

  // Guard Access
  const isAuthorizedAdmin =
    userRole === "tenant_admin" ||
    userRole === "super_admin" ||
    userRole === "admin" ||
    userRole === "marketing_officer" ||
    userRole === "travel_agent";
  if (!isAuthorizedAdmin) {
    return (
      <div className="py-20 text-center text-slate-800">
        <EmptyState title="Access Denied" description="Only tenant organization admins are authorized to view bookings." />
      </div>
    );
  }

  // Dynamic calculations for Stats Overview
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  // Counts of customer requested services
  const driverRequestsCount = requests.filter((r) => detectRequestedServices(r).driverRequested).length;
  const guideRequestsCount = requests.filter((r) => detectRequestedServices(r).guideRequested).length;

  // Filter & Search computation
  const filteredRequests = requests
    .filter((req) => {
      // Tab filter
      if (activeTab !== "all" && req.status !== activeTab) return false;

      const services = detectRequestedServices(req);

      // Service filter
      if (serviceFilter === "driver" && !services.driverRequested) return false;
      if (serviceFilter === "guide" && !services.guideRequested) return false;

      // Search text filter
      const search = searchTerm.toLowerCase().trim();
      if (!search) return true;

      if (search === "driver" || search === "car driver") {
        return services.driverRequested;
      }
      if (search === "guide" || search === "tour guide") {
        return services.guideRequested;
      }

      return (
        req.packageName.toLowerCase().includes(search) ||
        req.userName?.toLowerCase().includes(search) ||
        req.userEmail?.toLowerCase().includes(search) ||
        req._id.toLowerCase().includes(search) ||
        Boolean(services.driverName && services.driverName.toLowerCase().includes(search)) ||
        Boolean(services.guideName && services.guideName.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="space-y-8 text-left relative min-h-[75vh]">

      {/* Header Area */}
      <div className="bg-white/40 backdrop-blur-md border border-slate-200 p-6 rounded-3xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">Booking Approvals Inbox</h2>
          <p className="text-slate-500 text-xs mt-1">Review customized travel quote specifications and update coordination status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsQuotationOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B7C8A] hover:bg-[#0B7C8A]/90 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <PlusOutlined /> + New Inquiry / Quotation
          </button>
          <button
            onClick={() => setIsAgentEstimatorOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <ThunderboltOutlined /> Rapid Agent Estimator
          </button>
          <button
            onClick={loadRequests}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Refresh Inbox
          </button>
          {/* View Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UnorderedListOutlined /> Table View
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "timeline" ? "bg-[#0B7C8A] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CalendarOutlined /> Schedule Timeline (Gantt)
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <section className="w-full">
        <StatsOverviewCard stats={stats} />
      </section>

      {/* Filter and Control Bar */}
      <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Navigation Tabs and Staff Request Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex flex-wrap gap-1">
            {(["all", "pending", "approved", "rejected", "cancelled"] as const).map((tab) => {
              const count =
                tab === "all"
                  ? requests.length
                  : requests.filter((r) => r.status === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition ${activeTab === tab
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-white/40 hover:text-slate-900"
                    }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          {/* Service filter pills */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={() => setServiceFilter(serviceFilter === "driver" ? "all" : "driver")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                serviceFilter === "driver"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80"
              }`}
              title="Filter bookings where traveler requested a Car Driver"
            >
              <span>🚗 Driver</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${serviceFilter === "driver" ? "bg-white text-amber-600" : "bg-amber-200 text-amber-900"}`}>
                {driverRequestsCount}
              </span>
            </button>

            <button
              onClick={() => setServiceFilter(serviceFilter === "guide" ? "all" : "guide")}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                serviceFilter === "guide"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80"
              }`}
              title="Filter bookings where traveler requested a Tour Guide"
            >
              <span>🧭 Guide</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${serviceFilter === "guide" ? "bg-white text-indigo-600" : "bg-indigo-200 text-indigo-900"}`}>
                {guideRequestsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Search, Sort Inputs */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-initial">
            <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              placeholder="Search traveler, package, driver, guide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-200 focus:outline-none focus:border-slate-450 bg-white/70 rounded-xl text-xs font-semibold"
            />
          </div>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            className="px-3.5 py-2 border border-slate-200 focus:outline-none bg-white/70 rounded-xl text-xs font-black text-slate-650 cursor-pointer outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

      </div>

      {/* Main Inbox Table / List */}
      {/* Schedule Timeline (Gantt) View */}
      {viewMode === "timeline" && (
        <CrewScheduleTimeline
          tours={requests}
          onSelectTour={(t) => {
            setLifecycleBooking(t as any);
            setIsLifecycleOpen(true);
          }}
        />
      )}

      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900 mx-auto" />
          <p className="text-slate-450 text-xs font-bold mt-4">Loading active requests...</p>
        </div>
      ) : error ? (
        <EmptyState title="Inbox Load Error" description={error} />
      ) : filteredRequests.length === 0 ? (
        <div className="py-12 bg-white/30 rounded-3xl border border-slate-200">
          <EmptyState
            title="No Bookings Found"
            description="Adjust your search criteria or review tab filters to find requests."
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-4">Request ID</th>
                  <th className="px-5 py-4">Traveler</th>
                  <th className="px-5 py-4">Destination / Package</th>
                  <th className="px-5 py-4">Dates & Size</th>
                  <th className="px-5 py-4">Requested Staff</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Inbox View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRequests.map((req) => {
                  const services = detectRequestedServices(req);
                  return (
                    <tr
                      key={req._id}
                      onClick={() => setSelectedRequest(req)}
                      className="hover:bg-slate-50/50 cursor-pointer transition"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-slate-800">
                        {req.tourId ? (
                          <div>
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-[#0B7C8A]/10 text-[#0B7C8A] font-mono font-bold text-xs border border-[#0B7C8A]/20">
                              {req.tourId}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              #{req._id.substring(req._id.length - 6).toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <span>#{req._id.substring(req._id.length - 8).toUpperCase()}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-800">{req.userName || "Traveler"}</div>
                        <div className="text-[11px] text-slate-400 font-semibold mt-0.5">{req.userEmail}</div>
                      </td>
                      <td className="px-5 py-4 font-extrabold text-slate-800">
                        {req.packageName}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <TeamOutlined className="text-slate-400" />
                          <span>{req.numberOfTravelers} Travelers</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                          <CalendarOutlined className="text-slate-400" />
                          <span>Starts: {new Date(req.preferredStartDate).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Requested Staff / Personnel Badges */}
                      <td className="px-5 py-4">
                        {services.hasAnyServiceRequested ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            {services.driverRequested && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${
                                  services.driverAssigned
                                    ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                                    : "bg-amber-50 text-amber-900 border border-amber-300 shadow-sm"
                                }`}
                                title={services.driverReason}
                              >
                                <span>🚗</span>
                                <span>Car Driver</span>
                                {services.driverAssigned ? (
                                  <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black">
                                    ✓ Assigned
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-black">
                                    Needed
                                  </span>
                                )}
                              </span>
                            )}
                            {services.guideRequested && (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold ${
                                  services.guideAssigned
                                    ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                                    : "bg-indigo-50 text-indigo-900 border border-indigo-300 shadow-sm"
                                }`}
                                title={services.guideReason}
                              >
                                <span>🧭</span>
                                <span>Tour Guide</span>
                                {services.guideAssigned ? (
                                  <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black">
                                    ✓ Assigned
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-black">
                                    Needed
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10.5px] text-slate-400 font-medium italic">Standard Tour</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${req.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : req.status === "rejected"
                                ? "bg-red-500/10 text-red-650 border border-red-500/20"
                                : req.status === "cancelled"
                                  ? "bg-slate-100 text-slate-500 border border-slate-200"
                                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLifecycleBooking(req);
                              setIsLifecycleOpen(true);
                            }}
                            className="px-3 py-1.5 bg-[#0B7C8A] hover:bg-[#0B7C8A]/90 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
                          >
                            <AuditOutlined /> Tour Lifecycle
                          </button>
                          <button className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1">
                            <span>Details</span>
                            <ArrowRightOutlined />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-out Drawer Overlay */}
      <AnimatePresence>
        {selectedRequest && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!actionLoading) {
                  setSelectedRequest(null);
                  setActionError(null);
                }
              }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] pointer-events-auto"
            />

            {/* Right Side Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
              className="fixed top-0 right-0 h-full w-[500px] max-w-[95vw] bg-white border-l border-slate-200 z-[100] shadow-2xl flex flex-col justify-between"
            >

              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Booking Details</span>
                  <h3 className="text-lg font-black text-slate-950 mt-0.5">
                    Request ID: #{selectedRequest._id.substring(selectedRequest._id.length - 8).toUpperCase()}
                  </h3>
                </div>
                <button
                  disabled={actionLoading}
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionError(null);
                  }}
                  className="w-9 h-9 rounded-xl hover:bg-slate-100 border border-slate-200 text-slate-550 flex items-center justify-center transition disabled:opacity-50"
                >
                  <CloseOutlined />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto flex-grow space-y-6 text-left">

                {/* Action Feedback Area */}
                {actionError && (
                  <div className="p-4 bg-rose-50 border border-rose-250 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs">
                    <CloseCircleOutlined className="text-sm mt-0.5" />
                    <div>
                      <span className="font-bold block">Execution Mismatch</span>
                      <p className="mt-0.5 leading-normal">{actionError}</p>
                    </div>
                  </div>
                )}

                {/* Status and Profile Summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-250 flex items-center justify-center text-sm font-black text-slate-700">
                      {selectedRequest.userName?.charAt(0) || "T"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 leading-tight">{selectedRequest.userName || "Traveler"}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                        <MailOutlined />
                        <span>{selectedRequest.userEmail}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedRequest.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : selectedRequest.status === "rejected"
                          ? "bg-red-500/10 text-red-650 border border-red-500/20"
                          : selectedRequest.status === "cancelled"
                            ? "bg-slate-100 text-slate-500 border border-slate-200"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>

                {/* Customer Requested Staff Services Alert Banner */}
                {(() => {
                  const selectedServices = detectRequestedServices(selectedRequest);
                  if (!selectedServices.hasAnyServiceRequested) return null;
                  return (
                    <div className="bg-gradient-to-br from-amber-50/90 via-white to-indigo-50/90 border-2 border-amber-300/80 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🛎️</span>
                          <div>
                            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                              Customer Requested Staff Services
                            </h5>
                            <p className="text-[10px] text-slate-500 font-semibold">
                              Traveler specifically requested dedicated personnel for this booking
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                          Action Required
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Driver Card */}
                        {selectedServices.driverRequested && (
                          <div className={`p-3 rounded-xl border transition ${
                            selectedServices.driverAssigned
                              ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                              : "bg-amber-100/70 border-amber-400 text-amber-950 shadow-sm"
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black flex items-center gap-1.5">
                                <span>🚗</span>
                                <span>Car Driver</span>
                              </span>
                              {selectedServices.driverAssigned ? (
                                <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                  ✓ Assigned
                                </span>
                              ) : (
                                <span className="text-[9px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                                  Needed
                                </span>
                              )}
                            </div>

                            <div className="mt-2 space-y-1">
                              <p className="text-[10.5px] font-medium text-slate-700">
                                {selectedServices.driverReason}
                              </p>
                              {selectedServices.driverAssigned ? (
                                <p className="text-[10.5px] font-bold text-emerald-800 pt-1 border-t border-emerald-200/60">
                                  Assigned: {selectedServices.driverName} {selectedServices.driverPhone ? `(${selectedServices.driverPhone})` : ""}
                                </p>
                              ) : (
                                <p className="text-[10px] font-bold text-amber-800 pt-1 border-t border-amber-300/60 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>Please assign a driver below</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Guide Card */}
                        {selectedServices.guideRequested && (
                          <div className={`p-3 rounded-xl border transition ${
                            selectedServices.guideAssigned
                              ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                              : "bg-indigo-100/70 border-indigo-400 text-indigo-950 shadow-sm"
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black flex items-center gap-1.5">
                                <span>🧭</span>
                                <span>Tour Guide</span>
                              </span>
                              {selectedServices.guideAssigned ? (
                                <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                  ✓ Assigned
                                </span>
                              ) : (
                                <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                                  Needed
                                </span>
                              )}
                            </div>

                            <div className="mt-2 space-y-1">
                              <p className="text-[10.5px] font-medium text-slate-700">
                                {selectedServices.guideReason}
                              </p>
                              {selectedServices.guideAssigned ? (
                                <p className="text-[10.5px] font-bold text-indigo-800 pt-1 border-t border-indigo-200/60">
                                  Assigned: {selectedServices.guideName} {selectedServices.guidePhone ? `(${selectedServices.guidePhone})` : ""}
                                </p>
                              ) : (
                                <p className="text-[10px] font-bold text-indigo-800 pt-1 border-t border-indigo-300/60 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>Please assign a tour guide below</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Details Variables Block */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-2xl p-3">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Dates Planned</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
                      <CalendarOutlined className="text-slate-400" />
                      <span>{new Date(selectedRequest.preferredStartDate).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-3">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Group Size</span>
                    <span className="block text-sm font-bold text-slate-900 mt-1 flex items-center gap-2">
                      <TeamOutlined className="text-slate-400" />
                      <span>{selectedRequest.numberOfTravelers} Guests</span>
                    </span>
                  </div>
                </div>

                {/* Structured Cost Breakdown / Markdown View */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-black text-slate-700 uppercase">
                    <FileTextOutlined className="text-slate-400" />
                    <span>Cost Breakdown & Details</span>
                  </div>
                  <div className="p-4 space-y-4 text-xs font-semibold text-slate-700 max-h-[300px] overflow-y-auto">
                    {isCustomCalc && metrics ? (
                      <div className="space-y-4">
                        {/* Specifications details */}
                        <div className="space-y-1 text-slate-650">
                          {selectedRequest.specialRequests?.split("### 💵 Invoice Cost Breakdown")[0]?.replace("### 🌟 Custom Calculator Specifications", "").trim().split("\n").map((line: string, idx: number) => {
                            if (line.startsWith("- **")) {
                              const matchPair = line.match(/\*\*(.*)\*\*(.*)/);
                              if (matchPair) {
                                return (
                                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                                    <span className="text-slate-450 uppercase text-[9px] font-bold">{matchPair[1].replace(":", "")}</span>
                                    <span className="text-slate-800 font-extrabold">{matchPair[2].replace(/[:-\s*]/g, "").trim()}</span>
                                  </div>
                                );
                              }
                            }
                            return null;
                          })}
                        </div>

                        {/* Verified cost breakdown */}
                        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-2.5">
                          <span className="block text-[10px] text-cyan-400 font-black uppercase tracking-wider border-b border-white/10 pb-1.5">
                            Verified Invoice Details
                          </span>
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>Base Tour Cost</span>
                            <span>${metrics.baseCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>Accommodation Surcharge</span>
                            <span>${metrics.accommodationCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>Transportation Logistics</span>
                            <span>${metrics.transportCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>Destinations Entry Tickets</span>
                            <span>${metrics.destinationSurcharges.toLocaleString()}</span>
                          </div>
                          {metrics.activityCost > 0 && (
                            <div className="flex justify-between text-xs text-slate-300">
                              <span>Excursions Cost</span>
                              <span>${metrics.activityCost.toLocaleString()}</span>
                            </div>
                          )}
                          {metrics.addOnsCost > 0 && (
                            <div className="flex justify-between text-xs text-slate-300">
                              <span>Add-ons Cost</span>
                              <span>${metrics.addOnsCost.toLocaleString()}</span>
                            </div>
                          )}
                          {metrics.customCharges > 0 && (
                            <div className="flex justify-between text-xs text-amber-300">
                              <span>Custom Agency Fee</span>
                              <span>+${metrics.customCharges.toLocaleString()}</span>
                            </div>
                          )}
                          {metrics.discount > 0 && (
                            <div className="flex justify-between text-xs text-emerald-400">
                              <span>Group Discount</span>
                              <span>-${metrics.discount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-xs text-slate-300 border-t border-white/10 pt-1.5">
                            <span>Estimated Taxes (12%)</span>
                            <span>${metrics.taxes.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm font-black text-white border-t border-white/20 pt-2">
                            <span>Calculated Total</span>
                            <span className="text-cyan-400">${metrics.totalPrice.toLocaleString()} USD</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Fallback view for traditional packages */
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                            <Image
                              src={getPackageImage(selectedRequest.packageName)}
                              alt={selectedRequest.packageName}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-brand-secondary">Catalog Tour</span>
                            <h4 className="text-sm font-black text-slate-900 leading-snug">{selectedRequest.packageName}</h4>
                          </div>
                        </div>

                        {selectedRequest.specialRequests && !selectedRequest.specialRequests.includes("### 📝 Traveler Special Requests") && (
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Customer Notes</span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                              {selectedRequest.specialRequests}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Notes showing up if they calculator details exist */}
                    {selectedRequest.specialRequests?.includes("### 📝 Traveler Special Requests") && (
                      <div className="flex flex-col gap-1 border-t border-slate-150 pt-4">
                        <span className="text-slate-450 uppercase text-[10px] font-bold">Traveler Notes</span>
                        <p className="text-slate-800 mt-1 leading-relaxed bg-slate-50 border border-slate-150 p-3.5 rounded-xl font-medium">
                          {selectedRequest.specialRequests.split("### 📝 Traveler Special Requests")[1].trim() || "None"}
                        </p>
                      </div>
                    )}

                  </div>
                </div>

                {/* Guide & Driver Assignment Panel (editable when pending or approved) */}
                {(selectedRequest.status === "pending" || selectedRequest.status === "approved") && (() => {
                  const drawerServices = detectRequestedServices(selectedRequest);
                  return (
                    <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-black uppercase text-indigo-800 tracking-wider">
                          🧭 Tour Guide & Driver Assignment
                        </span>
                        {drawerServices.hasAnyServiceRequested && (
                          <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Customer Requested
                          </span>
                        )}
                      </div>

                      {/* Tour Guide */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-indigo-700 font-black uppercase tracking-wide">Tour Guide</span>
                          {drawerServices.guideRequested && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-indigo-600 text-white uppercase tracking-wider shadow-sm">
                              <span>⭐</span>
                              <span>Requested by Customer</span>
                            </span>
                          )}
                        </div>
                        {drawerServices.guideRequested && (
                          <p className="text-[10px] text-indigo-800 font-semibold bg-indigo-100/70 px-2.5 py-1 rounded-lg">
                            Customer Note: {drawerServices.guideReason}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={tourGuideName}
                            onChange={(e) => setTourGuideName(e.target.value)}
                            className="px-2.5 py-1.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-semibold text-slate-800 bg-white"
                          />
                          <input
                            type="email"
                            placeholder="Email address"
                            value={tourGuideEmail}
                            onChange={(e) => setTourGuideEmail(e.target.value)}
                            className="px-2.5 py-1.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Phone / WhatsApp (optional)"
                          value={tourGuidePhone}
                          onChange={(e) => setTourGuidePhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-semibold text-slate-800 bg-white"
                        />
                      </div>

                      {/* Divider */}
                      <div className="border-t border-indigo-100" />

                      {/* Car Driver */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-indigo-700 font-black uppercase tracking-wide">Car Driver</span>
                          {drawerServices.driverRequested && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-black bg-amber-600 text-white uppercase tracking-wider shadow-sm">
                              <span>⭐</span>
                              <span>Requested by Customer</span>
                            </span>
                          )}
                        </div>
                        {drawerServices.driverRequested && (
                          <p className="text-[10px] text-amber-900 font-semibold bg-amber-100/80 px-2.5 py-1 rounded-lg">
                            Customer Note: {drawerServices.driverReason}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="px-2.5 py-1.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-semibold text-slate-800 bg-white"
                          />
                          <input
                            type="email"
                            placeholder="Email address"
                            value={driverEmail}
                            onChange={(e) => setDriverEmail(e.target.value)}
                            className="px-2.5 py-1.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Phone / WhatsApp (optional)"
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-semibold text-slate-800 bg-white"
                        />
                      </div>

                      {/* Agency Notes */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-indigo-700 font-black uppercase tracking-wide">Agency Notes / Instructions for Assignee</span>
                        <textarea
                          rows={3}
                          placeholder="e.g. Meet at Colombo Airport Gate 3. Customer requires wheelchair access..."
                          value={agencyNotes}
                          onChange={(e) => setAgencyNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-400 text-xs font-semibold text-slate-800 bg-white resize-none"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Cost Adjustments Panel (only editable when status is 'pending') */}

                {selectedRequest.status === "pending" && isCustomCalc && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <span className="block text-[10px] font-black uppercase text-slate-800 tracking-wider">
                      🛠️ Agency Cost Adjustments
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-black uppercase">
                          Custom Agency Fee ($)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={customCharges}
                          onChange={(e) => setCustomCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-secondary text-xs font-semibold text-slate-850 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 font-black uppercase">
                          Additional Taxes ($)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={additionalTaxes}
                          onChange={(e) => setAdditionalTaxes(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-secondary text-xs font-semibold text-slate-850 bg-white"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleRecalculateAndApprove}
                      disabled={actionLoading}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition uppercase tracking-wider flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? "Processing Calculation..." : "Recalculate & Approve"}
                    </button>
                  </div>
                )}

                {/* Send Trip Brief Panel (visible when approved) */}
                {selectedRequest.status === "approved" && (
                  <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 space-y-3">
                    <span className="block text-[10px] font-black uppercase text-violet-800 tracking-wider flex items-center gap-1.5">
                      📄 Send Trip Brief PDF to Guide / Driver
                    </span>
                    <p className="text-[10px] text-violet-700 leading-normal font-semibold">
                      Generate a PDF trip brief and email it directly to the assigned tour guide or car driver.
                    </p>

                    {briefSuccess && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-[10px] font-bold">
                        ✅ Trip brief sent successfully!
                      </div>
                    )}
                    {briefError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[10px] font-bold">
                        ❌ {briefError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-violet-700 font-black uppercase">Recipient Name</label>
                        <input
                          type="text"
                          placeholder="e.g. John Silva"
                          value={briefRecipientName}
                          onChange={(e) => setBriefRecipientName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-violet-200 rounded-xl focus:outline-none focus:border-violet-400 text-xs font-semibold text-slate-800 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-violet-700 font-black uppercase">Role</label>
                        <select
                          value={briefRole}
                          onChange={(e) => setBriefRole(e.target.value as "Tour Guide" | "Car Driver")}
                          className="w-full px-2.5 py-1.5 border border-violet-200 rounded-xl focus:outline-none bg-white text-xs font-semibold text-slate-800"
                        >
                          <option value="Tour Guide">Tour Guide</option>
                          <option value="Car Driver">Car Driver</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="guide@gmail.com or driver@gmail.com"
                        value={briefRecipientEmail}
                        onChange={(e) => setBriefRecipientEmail(e.target.value)}
                        className="flex-grow px-2.5 py-1.5 border border-violet-200 rounded-xl focus:outline-none focus:border-violet-400 text-xs font-semibold text-slate-800 bg-white"
                      />
                      <button
                        onClick={handleSendTripBrief}
                        disabled={briefLoading || !briefRecipientEmail || !briefRecipientName}
                        className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-[10px] tracking-wide transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {briefLoading ? "Sending..." : "Send ▶"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer Payment Invoice Link */}
                {selectedRequest.status === "approved" && (
                  <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-4 space-y-3">
                    <span className="block text-[10px] text-emerald-800 font-black uppercase tracking-wider flex items-center gap-1.5">
                      <LinkOutlined /> Customer Payment Invoice Link
                    </span>
                    <p className="text-[10px] text-emerald-700 leading-normal font-semibold">
                      This request has been approved. Copy the link below to share with the traveler.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.protocol}//${window.location.host}/invoice/${selectedRequest._id}`
                            : `/invoice/${selectedRequest._id}`
                        }
                        className="flex-grow px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-[10px] font-semibold text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const link = `${window.location.protocol}//${window.location.host}/invoice/${selectedRequest._id}`;
                          navigator.clipboard.writeText(link);
                          setPaymentLinkCopied(true);
                          setTimeout(() => setPaymentLinkCopied(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] tracking-wide transition flex items-center gap-1"
                      >
                        <CopyOutlined />
                        <span>{paymentLinkCopied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Destination Image Visualizer */}
                <div className="space-y-3">
                  <span className="block text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                    <CompassOutlined />
                    <span>Selected Route Visualizer</span>
                  </span>

                  <div className="grid grid-cols-2 gap-3.5">
                    {parseDestinations(selectedRequest.specialRequests).length > 0 ? (
                      parseDestinations(selectedRequest.specialRequests).map((dest) => {
                        const img = DESTINATION_IMAGES[dest] || "/images/nine_arch.png";
                        return (
                          <div key={dest} className="relative rounded-2xl overflow-hidden border border-slate-200 h-28 group">
                            <Image
                              src={img}
                              alt={dest}
                              fill
                              className="object-cover group-hover:scale-105 transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-2.5 z-10">
                              <span className="text-[11px] font-black text-white">{dest}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Show single package image for legacy/curated package request
                      <div className="col-span-2 relative rounded-2xl overflow-hidden border border-slate-200 h-36 group">
                        <Image
                          src={getPackageImage(selectedRequest.packageName)}
                          alt={selectedRequest.packageName}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4 z-10">
                          <div>
                            <span className="text-[10px] text-slate-350 block uppercase font-bold tracking-wider">Package Cover</span>
                            <span className="text-sm font-black text-white mt-0.5 block">{selectedRequest.packageName}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                {selectedRequest.status === "pending" ? (
                  <div className="flex gap-4">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedRequest._id, "rejected")}
                      className="flex-1 py-3 px-4 border border-red-200 bg-white hover:bg-rose-50 text-red-650 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Reject Quote"}
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedRequest._id, "approved")}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow-[0_4px_12px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {actionLoading ? "Processing..." : "Approve Quote"}
                    </button>
                  </div>
                ) : selectedRequest.status === "approved" ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedRequest._id, "cancelled")}
                    className="w-full py-3 px-4 border border-slate-200 bg-white hover:bg-rose-50 hover:text-red-500 hover:border-red-200 text-slate-650 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {actionLoading ? "Processing..." : "Cancel Confirmed Booking"}
                  </button>
                ) : (
                  <div className="w-full py-3.5 bg-slate-100 rounded-xl text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                    Request Completed
                  </div>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Marketing Officer Quotation Builder Modal */}
      <QuotationBuilderModal
        isOpen={isQuotationOpen}
        onClose={() => setIsQuotationOpen(false)}
        onQuotationCreated={() => loadRequests()}
      />

      {/* Travel Agent Quick Estimator Modal */}
      <AgentQuickEstimatorModal
        isOpen={isAgentEstimatorOpen}
        onClose={() => setIsAgentEstimatorOpen(false)}
        onConvertToQuotation={() => {
          setIsAgentEstimatorOpen(false);
          setIsQuotationOpen(true);
        }}
      />

      {/* Tour Lifecycle Management Modal */}
      {lifecycleBooking && (
        <TourLifecycleModal
          isOpen={isLifecycleOpen}
          onClose={() => {
            setIsLifecycleOpen(false);
            setLifecycleBooking(null);
          }}
          booking={lifecycleBooking}
          onBookingUpdated={() => {
            loadRequests();
          }}
        />
      )}

    </div>
  );
}
