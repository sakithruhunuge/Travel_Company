"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import Link from "next/link";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  CarOutlined,
  CompassOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  CheckOutlined,
  ReloadOutlined,
  SettingOutlined,
  GlobalOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  SendOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/context/TenantBrandingContext";

interface Applicant {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "driver" | "tour_guide" | "both";
  licenseNumber: string;
  languages: string[];
  vehicleDetails?: {
    category: string;
    plateNumber: string;
    model: string;
    capacity: number;
  };
  employmentType: "permanent" | "freelance";
  approvalStatus: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  status: "available" | "on_tour" | "off_duty";
  rating: number;
  activeToursCount: number;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function CrewManagementPage() {
  const { data: session } = useSession();
  const locale = useLocale();
  const tenant = useTenant();
  const primaryColor = tenant?.branding?.primaryColor || "#0B7C8A";
  const userRole = (session?.user as any)?.role;

  const isAuthorized = ["tenant_admin", "marketing_officer", "travel_agent", "super_admin", "admin"].includes(userRole);

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, freelancers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: "pending" | "approved" | "rejected" | "all"
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Registration Mode Setting
  const [regMode, setRegMode] = useState<"public" | "invite_only" | "disabled">("invite_only");
  const [updatingMode, setUpdatingMode] = useState(false);
  const [modeSuccess, setModeSuccess] = useState(false);

  // Rejection modal
  const [selectedApplicantForReject, setSelectedApplicantForReject] = useState<Applicant | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Detail inspection modal
  const [inspectApplicant, setInspectApplicant] = useState<Applicant | null>(null);

  // Direct Candidate Invite Modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidateRole, setCandidateRole] = useState<"driver" | "tour_guide" | "both">("driver");
  const [customInviteNote, setCustomInviteNote] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState("");
  const [inviteErrorMsg, setInviteErrorMsg] = useState("");

  // Review success alert banner
  const [reviewSuccessAlert, setReviewSuccessAlert] = useState<string | null>(null);

  // Copied invite link
  const [copiedLink, setCopiedLink] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [applicantsRes, settingsRes] = await Promise.all([
        fetch("/api/driver-guide/applicants"),
        fetch("/api/tenant/settings/partner-registration"),
      ]);

      if (applicantsRes.ok) {
        const data = await applicantsRes.json();
        setApplicants(data.applicants || []);
        if (data.stats) setStats(data.stats);
      } else {
        const data = await applicantsRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load crew registry");
      }

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.partnerRegistrationMode) {
          setRegMode(sData.partnerRegistrationMode);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load crew data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const handleReview = async (applicantId: string, action: "approve" | "reject", reason?: string) => {
    setActionLoadingId(applicantId);
    try {
      const res = await fetch(`/api/driver-guide/applicants/${applicantId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review action failed");

      // Update state locally
      setApplicants((prev) =>
        prev.map((a) =>
          a._id === applicantId
            ? {
                ...a,
                approvalStatus: action === "approve" ? "approved" : "rejected",
                status: action === "approve" ? "available" : a.status,
                rejectionReason: action === "reject" ? reason : undefined,
              }
            : a
        )
      );

      // Recompute stats
      setStats((prev) => ({
        ...prev,
        pending: action === "approve" ? prev.pending - 1 : prev.pending - 1,
        approved: action === "approve" ? prev.approved + 1 : prev.approved,
        rejected: action === "reject" ? prev.rejected + 1 : prev.rejected,
      }));

      setSelectedApplicantForReject(null);
      setRejectReason("");

      if (data.message) {
        setReviewSuccessAlert(data.message);
        setTimeout(() => setReviewSuccessAlert(null), 6000);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateRegMode = async (mode: "public" | "invite_only" | "disabled") => {
    setUpdatingMode(true);
    setModeSuccess(false);
    try {
      const res = await fetch("/api/tenant/settings/partner-registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerRegistrationMode: mode }),
      });
      if (res.ok) {
        setRegMode(mode);
        setModeSuccess(true);
        setTimeout(() => setModeSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to update registration mode:", err);
    } finally {
      setUpdatingMode(false);
    }
  };

  const getInviteUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${locale}/join/crew`;
    }
    return `/${locale}/join/crew`;
  };

  const handleCopyInviteLink = () => {
    const url = getInviteUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateEmail || !candidateEmail.includes("@")) {
      setInviteErrorMsg("A valid candidate email address is required");
      return;
    }
    setSendingInvite(true);
    setInviteErrorMsg("");
    setInviteSuccessMsg("");
    try {
      const res = await fetch("/api/driver-guide/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName,
          candidateEmail,
          role: candidateRole,
          customMessage: customInviteNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");
      setInviteSuccessMsg(`Invitation successfully dispatched to ${candidateEmail}!`);
      setTimeout(() => {
        setCandidateName("");
        setCandidateEmail("");
        setCustomInviteNote("");
        setInviteSuccessMsg("");
        setIsInviteModalOpen(false);
      }, 2200);
    } catch (err: any) {
      setInviteErrorMsg(err?.message || "Failed to send invite");
    } finally {
      setSendingInvite(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="py-20 text-center">
        <EmptyState
          title="Access Denied"
          description="Only organization administrators and marketing officers can manage crew registrations."
        />
      </div>
    );
  }

  const filteredApplicants = applicants.filter((a) => {
    if (activeTab !== "all" && a.approvalStatus !== activeTab) return false;
    if (roleFilter !== "all" && a.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Review Alert Notification */}
      {reviewSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-emerald-600 text-base" />
            <span>{reviewSuccessAlert}</span>
          </div>
          <button
            onClick={() => setReviewSuccessAlert(null)}
            className="text-emerald-500 hover:text-emerald-800 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-md border border-white/30 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700 border border-teal-500/20 shadow-sm">
            Operations & Fleet Desk
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mt-2">
            Drivers & Tour Guides
          </h2>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Review freelance applications, approve crew credentials, and manage fleet dispatch availability.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition"
          >
            <SendOutlined />
            <span>Send Direct Invitation</span>
          </button>

          <button
            onClick={handleCopyInviteLink}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            {copiedLink ? <CheckOutlined className="text-teal-600" /> : <CopyOutlined />}
            <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <ReloadOutlined className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Visibility & Registration Mode Settings Card */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/80 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center text-lg">
              <GlobalOutlined />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Partner Registration Visibility</h4>
              <p className="text-xs text-slate-500">
                Choose how prospective freelance drivers and guides discover the onboarding portal.
              </p>
            </div>
          </div>

          {/* Mode Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handleUpdateRegMode("public")}
              disabled={updatingMode}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                regMode === "public"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Public (Website Links)
            </button>

            <button
              onClick={() => handleUpdateRegMode("invite_only")}
              disabled={updatingMode}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                regMode === "invite_only"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Invite Only (Direct Link)
            </button>

            <button
              onClick={() => handleUpdateRegMode("disabled")}
              disabled={updatingMode}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                regMode === "disabled"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {modeSuccess && (
          <div className="mt-3 text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircleOutlined /> Settings saved successfully.
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Pending Review</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-500">{stats.pending}</span>
            <span className="text-[11px] text-amber-600/80 font-medium">Needs Action</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Active Crew Roster</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-teal-600">{stats.approved}</span>
            <span className="text-[11px] text-teal-600/80 font-medium">Ready for Dispatch</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Freelancers</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{stats.freelancers}</span>
            <span className="text-[11px] text-slate-500 font-medium">Partner Network</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white/50 backdrop-blur-md border border-white/40 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Rejected / Archived</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-400">{stats.rejected}</span>
            <span className="text-[11px] text-slate-400 font-medium">Declined</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Role Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "pending"
                ? "bg-amber-500 text-white shadow"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <ClockCircleOutlined />
            <span>Pending Review</span>
            {stats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white text-amber-600 text-[10px] font-black">
                {stats.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "approved"
                ? "bg-teal-600 text-white shadow"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <CheckCircleOutlined />
            <span>Approved Crew ({stats.approved})</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "rejected"
                ? "bg-slate-700 text-white shadow"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            <CloseCircleOutlined />
            <span>Rejected ({stats.rejected})</span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-white/60"
            }`}
          >
            All Manifest
          </button>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Roles</option>
            <option value="driver">Chauffeurs / Drivers</option>
            <option value="tour_guide">Tour Guides</option>
            <option value="both">Driver & Guide</option>
          </select>
        </div>
      </div>

      {/* Applicants / Crew List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">Loading crew registry...</div>
      ) : filteredApplicants.length === 0 ? (
        <div className="py-16 text-center bg-white/40 rounded-3xl border border-white/50">
          <EmptyState
            title={`No ${activeTab === "pending" ? "pending applications" : "crew records found"}`}
            description={
              activeTab === "pending"
                ? "All freelance applications have been reviewed! New submissions will appear here."
                : "No crew members match the selected criteria."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApplicants.map((applicant) => {
            const isDriver = applicant.role === "driver" || applicant.role === "both";
            const isGuide = applicant.role === "tour_guide" || applicant.role === "both";

            return (
              <motion.div
                key={applicant._id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/70 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-3"
              >
                {/* Top Row: Name, Role Badge, Status */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{applicant.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {applicant.employmentType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-teal-700 capitalize">
                        {applicant.role === "both" ? "Driver & Tour Guide" : applicant.role.replace("_", " ")}
                      </span>
                      <span>•</span>
                      <span>License: {applicant.licenseNumber}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {applicant.approvalStatus === "pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        <ClockCircleOutlined /> Pending
                      </span>
                    )}
                    {applicant.approvalStatus === "approved" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircleOutlined /> Active
                      </span>
                    )}
                    {applicant.approvalStatus === "rejected" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                        <CloseCircleOutlined /> Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5 truncate">
                    <MailOutlined className="text-slate-400" />
                    <span className="truncate">{applicant.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <PhoneOutlined className="text-slate-400" />
                    <span className="truncate">{applicant.phone}</span>
                  </div>
                </div>

                {/* Vehicle Specs (if driver) */}
                {isDriver && applicant.vehicleDetails && (
                  <div className="flex items-center justify-between text-xs bg-teal-50/50 border border-teal-100 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CarOutlined className="text-teal-700" />
                      <span className="font-semibold text-slate-800">
                        {applicant.vehicleDetails.model} ({applicant.vehicleDetails.category})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-teal-800 uppercase">
                      {applicant.vehicleDetails.plateNumber}
                    </span>
                  </div>
                )}

                {/* Languages */}
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[11px] text-slate-400 mr-1">Languages:</span>
                  {applicant.languages?.map((lang) => (
                    <span
                      key={lang}
                      className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>

                {/* Rejection Reason if any */}
                {applicant.rejectionReason && (
                  <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <strong>Reason:</strong> {applicant.rejectionReason}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setInspectApplicant(applicant)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    <EyeOutlined /> View Details
                  </button>

                  <div className="flex items-center gap-2">
                    {applicant.approvalStatus === "pending" && (
                      <>
                        <button
                          onClick={() => setSelectedApplicantForReject(applicant)}
                          disabled={actionLoadingId === applicant._id}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 transition"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => handleReview(applicant._id, "approve")}
                          disabled={actionLoadingId === applicant._id}
                          className="px-4 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition"
                        >
                          {actionLoadingId === applicant._id ? "Approving..." : "Approve & Activate"}
                        </button>
                      </>
                    )}

                    {applicant.approvalStatus === "rejected" && (
                      <button
                        onClick={() => handleReview(applicant._id, "approve")}
                        disabled={actionLoadingId === applicant._id}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                      >
                        Re-evaluate & Approve
                      </button>
                    )}

                    {applicant.approvalStatus === "approved" && (
                      <span className="text-[11px] text-slate-400">
                        Assigned Tours: <strong className="text-slate-700">{applicant.activeToursCount || 0}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {selectedApplicantForReject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Reject Application: {selectedApplicantForReject.name}
            </h3>
            <p className="text-xs text-slate-600">
              Please provide feedback explaining why the freelance application is not accepted at this time. This will be included in their email notice.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. License verification incomplete, or vehicle specifications do not meet standard requirements."
              className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedApplicantForReject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(selectedApplicantForReject._id, "reject", rejectReason)}
                disabled={actionLoadingId === selectedApplicantForReject._id}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Applicant Inspection Modal */}
      {inspectApplicant && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{inspectApplicant.name}</h3>
              <button
                onClick={() => setInspectApplicant(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Role</span>
                  <span className="font-bold capitalize">{inspectApplicant.role.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">License Number</span>
                  <span className="font-bold">{inspectApplicant.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span>{inspectApplicant.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone</span>
                  <span>{inspectApplicant.phone}</span>
                </div>
              </div>

              {inspectApplicant.vehicleDetails && (
                <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-100 space-y-1">
                  <span className="font-bold text-teal-900 block">Vehicle Specifications</span>
                  <p><strong>Model:</strong> {inspectApplicant.vehicleDetails.model}</p>
                  <p><strong>Category:</strong> {inspectApplicant.vehicleDetails.category}</p>
                  <p><strong>Plate:</strong> {inspectApplicant.vehicleDetails.plateNumber}</p>
                  <p><strong>Capacity:</strong> {inspectApplicant.vehicleDetails.capacity} Passengers</p>
                </div>
              )}

              {inspectApplicant.notes && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="font-bold text-slate-900 block mb-1">Applicant Bio & Notes:</span>
                  <p className="text-slate-600 leading-relaxed">{inspectApplicant.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectApplicant(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Candidate Invitation Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send Direct Candidate Invitation</h3>
                <p className="text-xs text-slate-500">
                  Invite a freelance chauffeur or guide via Email, WhatsApp, or Direct Link.
                </p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {inviteSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                <CheckCircleOutlined />
                <span>{inviteSuccessMsg}</span>
              </div>
            )}

            {inviteErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {inviteErrorMsg}
              </div>
            )}

            <form onSubmit={handleSendEmailInvite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Candidate Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Sunil Perera"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Candidate Role
                  </label>
                  <select
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                  >
                    <option value="driver">Chauffeur / Driver</option>
                    <option value="tour_guide">Tour Guide</option>
                    <option value="both">Driver & Guide</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate Email Address *
                </label>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Personal Invitation Message (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customInviteNote}
                  onChange={(e) => setCustomInviteNote(e.target.value)}
                  placeholder="e.g. We have upcoming Hill Country tours next month and would love you to join our fleet..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <MailOutlined />
                  <span>{sendingInvite ? "Sending Email..." : "Send Email Invitation"}</span>
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate pr-2 font-mono text-[11px]">{getInviteUrl()}</span>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="font-bold text-teal-700 hover:text-teal-800 whitespace-nowrap"
              >
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
