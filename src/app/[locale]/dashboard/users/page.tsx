"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  CopyOutlined,
  LockOutlined,
  MailOutlined,
  CloseOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTenant } from "@/context/TenantBrandingContext";

interface UserData {
  _id: string;
  name: string;
  email: string;
  provider: string;
  role: string;
  status: string;
  createdAt?: string;
}

export default function TenantUsersPage() {
  const { data: session } = useSession();
  const tenant = useTenant();
  const primaryColor = tenant?.branding?.primaryColor || "#FF8B50";
  const userRole = (session?.user as any)?.role;

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab: "staff" or "customers"
  const [activeTab, setActiveTab] = useState<"staff" | "customers">("staff");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"marketing_officer" | "travel_agent">("marketing_officer");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (userRole === "tenant_admin" || userRole === "super_admin") {
      loadUsers();
    }
  }, [userRole]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tenant/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load user registry");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failure");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(pwd);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formEmail.trim() || !formPassword) {
      setFormError("All fields are required.");
      return;
    }

    if (formPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch("/api/tenant/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
          status: "active",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user account.");
      }

      setCreatedCredentials({
        email: formEmail.trim(),
        pass: formPassword,
        role: formRole === "marketing_officer" ? "Marketing Officer" : "Travel Agent",
      });

      // Reload users list
      await loadUsers();

      // Reset input form
      setFormName("");
      setFormEmail("");
      setFormPassword("");
    } catch (err: any) {
      setFormError(err.message || "Failed to create officer account.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserData) => {
    const nextStatus = user.status === "active" ? "suspended" : "active";
    setActionLoadingId(user._id);
    try {
      const res = await fetch("/api/tenant/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user._id, status: nextStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, status: nextStatus } : u))
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Are you sure you want to permanently remove ${user.name}?`)) return;
    setActionLoadingId(user._id);
    try {
      const res = await fetch(`/api/tenant/users?id=${user._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Login Credentials for ${createdCredentials.role}:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.pass}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter users by active tab
  const staffUsers = users.filter((u) => u.role === "marketing_officer" || u.role === "travel_agent");
  const customerUsers = users.filter((u) => u.role === "customer" || !u.role);

  const displayedUsers = activeTab === "staff" ? staffUsers : customerUsers;

  // Guard Access
  if (userRole !== "tenant_admin" && userRole !== "super_admin") {
    return (
      <div className="py-20 text-center text-slate-800">
        <EmptyState title="Access Denied" description="Only organization administrators can manage user accounts." />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white/45 backdrop-blur-md border border-white/30 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-650 border border-white/50 shadow-sm">
            Access & Team Management
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mt-2">
            User & Staff Registry
          </h2>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Create Marketing Officer logins, manage agency staff, and monitor customer accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedCredentials(null);
            setFormError(null);
            handleGeneratePassword();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs md:text-sm font-bold text-white shadow-lg hover:bg-slate-850 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <PlusOutlined />
          Create Marketing Officer
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
            activeTab === "staff"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white/40 text-slate-600 hover:bg-white/60 border border-slate-200"
          }`}
        >
          <SafetyCertificateOutlined />
          Marketing Officers & Staff ({staffUsers.length})
        </button>

        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all ${
            activeTab === "customers"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white/40 text-slate-600 hover:bg-white/60 border border-slate-200"
          }`}
        >
          <UserOutlined />
          Registered Customers ({customerUsers.length})
        </button>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900 mx-auto" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Loading user records...</p>
        </div>
      ) : error ? (
        <EmptyState title="Registry Load Error" description={error} />
      ) : displayedUsers.length === 0 ? (
        <div className="py-12 bg-white/30 rounded-3xl border border-slate-200 p-8">
          <EmptyState
            title={activeTab === "staff" ? "No Marketing Officers Registered" : "No Customers Registered"}
            description={
              activeTab === "staff"
                ? "Click 'Create Marketing Officer' above to create login credentials for your marketing team."
                : "Customer accounts registered under your domain will display here."
            }
          />
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-md border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Account Holder</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Auth Method</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {displayedUsers.map((u) => {
                  const isStaff = u.role === "marketing_officer" || u.role === "travel_agent";
                  return (
                    <tr key={u._id} className="hover:bg-white/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                            {u.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 leading-tight">{u.name}</p>
                            <span className="text-[11px] text-slate-400 font-medium">ID: {u._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {u.email}
                      </td>
                      <td className="px-6 py-4">
                        {u.role === "marketing_officer" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-orange-100 text-orange-800 border border-orange-200 rounded-lg">
                            <SafetyCertificateOutlined className="text-orange-600" />
                            Marketing Officer
                          </span>
                        ) : u.role === "travel_agent" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-blue-100 text-blue-800 border border-blue-200 rounded-lg">
                            Travel Agent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-650 border border-slate-200 rounded-lg">
                            Customer
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 border border-slate-200/70 rounded-lg text-slate-600 uppercase">
                          {u.provider || "credentials"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            u.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-600 border border-red-500/20"
                          }`}
                        >
                          {u.status === "active" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                          {u.status || "active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Historical"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isStaff && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={actionLoadingId === u._id}
                              title={u.status === "active" ? "Suspend Officer Account" : "Activate Officer Account"}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                                u.status === "active"
                                  ? "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                  : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              }`}
                            >
                              {u.status === "active" ? "Suspend" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={actionLoadingId === u._id}
                              title="Delete Officer Account"
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition border border-red-100"
                            >
                              <DeleteOutlined />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Marketing Officer Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-8 text-left"
            >
              {/* Header - Glass Shaded with Tenant Primary Color */}
              <div
                className="relative overflow-hidden px-7 py-5 flex justify-between items-center border-b border-white/60 backdrop-blur-2xl"
                style={{
                  background: `linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.6) 50%, ${primaryColor}18 100%)`,
                }}
              >
                {/* Ambient Radial Glow with primaryColor */}
                <div
                  className="absolute -top-16 -right-16 h-44 w-44 rounded-full blur-2xl pointer-events-none opacity-30"
                  style={{ backgroundColor: primaryColor }}
                />
                <div
                  className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full blur-2xl pointer-events-none opacity-20"
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
                    <SafetyCertificateOutlined />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Create Marketing Officer Account</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Provision credentials to access the dynamic marketing workspace
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-white/80 text-slate-400 hover:text-slate-800 flex items-center justify-center transition relative z-10 shadow-sm border border-slate-200/50"
                >
                  <CloseOutlined />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-5">
                {/* Success Card */}
                {createdCredentials ? (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                      <CheckCircleOutlined className="text-base text-emerald-600" />
                      Account Created Successfully!
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Please copy these login credentials and send them to the officer. They can now log in via your portal's sign-in page.
                    </p>
                    <div className="bg-white rounded-xl border border-emerald-200 p-3.5 space-y-1.5 font-mono text-xs text-slate-800">
                      <p>
                        <span className="text-slate-400 font-sans">Role:</span>{" "}
                        <span className="font-bold text-orange-600">{createdCredentials.role}</span>
                      </p>
                      <p>
                        <span className="text-slate-400 font-sans">Email:</span>{" "}
                        <span className="font-bold">{createdCredentials.email}</span>
                      </p>
                      <p>
                        <span className="text-slate-400 font-sans">Password:</span>{" "}
                        <span className="font-bold text-slate-900">{createdCredentials.pass}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={handleCopyCredentials}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/60 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition"
                      >
                        {copied ? <CheckOutlined /> : <CopyOutlined />}
                        {copied ? "Copied to Clipboard!" : "Copy Credentials"}
                      </button>

                      <button
                        onClick={() => {
                          setCreatedCredentials(null);
                          setIsModalOpen(false);
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    {formError && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                        <CloseCircleOutlined />
                        {formError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Officer Full Name
                      </label>
                      <div className="relative">
                        <UserOutlined className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g. Kasun Perera"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Work Email Address
                      </label>
                      <div className="relative">
                        <MailOutlined className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="marketing@yourcompany.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                          Temporary Password
                        </label>
                        <button
                          type="button"
                          onClick={handleGeneratePassword}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700"
                        >
                          <ReloadOutlined className="text-[10px]" />
                          Generate Strong
                        </button>
                      </div>
                      <div className="relative">
                        <LockOutlined className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 text-sm font-mono font-bold text-slate-800 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                        Portal Role Assignment
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormRole("marketing_officer")}
                          className={`p-3 rounded-xl border text-left transition ${
                            formRole === "marketing_officer"
                              ? "border-orange-500 bg-orange-50/50 shadow-sm"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <p className="font-extrabold text-xs text-slate-900">Marketing Officer</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Lead intake, quotes, estimator & itineraries
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormRole("travel_agent")}
                          className={`p-3 rounded-xl border text-left transition ${
                            formRole === "travel_agent"
                              ? "border-blue-500 bg-blue-50/50 shadow-sm"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <p className="font-extrabold text-xs text-slate-900">Travel Agent</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Booking processing & rapid estimates
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                      >
                        {formSubmitting ? "Creating Account..." : "Create Account"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
}
