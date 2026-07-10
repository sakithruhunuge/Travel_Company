"use client";

import React, { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LogoUpload from "@/components/LogoUpload";

interface TenantData {
  id: string;
  name: string;
  slug: string;
  customDomain: string | null;
  plan: string;
  status: string;
  requestCount: number;
  customerCount: number;
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    tagline?: string;
  };
}

interface StatsData {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalRequests: number;
  planBreakdown: Record<string, number>;
}

export default function SuperAdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Authentication states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Registry states
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    totalRequests: 0,
    planBreakdown: {},
  });
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);

  // Tenant form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSlug, setNewTenantSlug] = useState("");
  const [newTenantDomain, setNewTenantDomain] = useState("");
  const [newTenantPlan, setNewTenantPlan] = useState("free");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Branding edit states
  const [editingTenant, setEditingTenant] = useState<TenantData | null>(null);
  const [brandLogo, setBrandLogo] = useState("");
  const [brandPrimary, setBrandPrimary] = useState("#FF8B50");
  const [brandSecondary, setBrandSecondary] = useState("#25A5FE");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandError, setBrandError] = useState("");
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const isSuperAdmin = session?.user && (session.user as any).role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      loadTenants();
    }
  }, [isSuperAdmin]);

  const loadTenants = async () => {
    setIsLoadingRegistry(true);
    try {
      const res = await fetch("/api/admin/tenants");
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
        setStats(data.stats || {
          totalTenants: 0,
          activeTenants: 0,
          suspendedTenants: 0,
          totalRequests: 0,
          planBreakdown: {},
        });
      }
    } catch (err) {
      console.error("Failed to load tenants registry:", err);
    } finally {
      setIsLoadingRegistry(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmittingLogin(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setLoginError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setLoginError("Unexpected login failure");
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setIsCreating(true);

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTenantName,
          slug: newTenantSlug || undefined,
          customDomain: newTenantDomain || undefined,
          plan: newTenantPlan,
          adminName: newAdminName,
          adminEmail: newAdminEmail,
          adminPassword: newAdminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create tenant");
      } else {
        setIsCreateOpen(false);
        setNewTenantName("");
        setNewTenantSlug("");
        setNewTenantDomain("");
        setNewTenantPlan("free");
        setNewAdminName("");
        setNewAdminEmail("");
        setNewAdminPassword("");
        loadTenants();
      }
    } catch (err) {
      setCreateError("Communication failure during registration");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleSuspension = async (tenant: TenantData) => {
    const nextStatus = tenant.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadTenants();
      }
    } catch (err) {
      console.error("Toggle tenant suspension failed:", err);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this organization? This action is irreversible.")) return;

    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadTenants();
      }
    } catch (err) {
      console.error("Tenant deletion failed:", err);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setBrandError("");
    setIsSavingBranding(true);

    try {
      const res = await fetch(`/api/admin/tenants/${editingTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branding: {
            logoUrl: brandLogo,
            primaryColor: brandPrimary,
            secondaryColor: brandSecondary,
            tagline: brandTagline,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBrandError(data.error || "Failed to update branding");
      } else {
        setEditingTenant(null);
        loadTenants();
      }
    } catch (err) {
      setBrandError("Failed to update branding due to server timeout");
    } finally {
      setIsSavingBranding(false);
    }
  };

  const openBrandingModal = (tenant: TenantData) => {
    setEditingTenant(tenant);
    setBrandLogo(tenant.branding?.logoUrl || "");
    setBrandPrimary(tenant.branding?.primaryColor || "#FF8B50");
    setBrandSecondary(tenant.branding?.secondaryColor || "#25A5FE");
    setBrandTagline(tenant.branding?.tagline || "");
  };

  // Rendering Loader
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  // LOGIN SCREEN (Unauthenticated SuperAdmin)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center font-sans px-4">
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-widest block mb-2">Platform Console</span>
            <h1 className="text-3xl font-black tracking-tight text-white">SuperAdmin Portal</h1>
            <p className="text-slate-400 text-sm mt-2">Sign in using platform authority credentials.</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs mb-6 font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Platform Email</label>
              <input
                type="email"
                required
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                placeholder="admin@travelcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consular Password</label>
              <input
                type="password"
                required
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full font-bold shadow-lg shadow-cyan-500/20 active:scale-95 duration-300 transition-all text-sm mt-3"
            >
              {isSubmittingLogin ? "Authenticating Authority..." : "Access Console"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // SUPERADMIN DASHBOARD SCREEN (Authenticated)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-white/10 px-8 py-5 flex justify-between items-center">
        <div>
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider block">Horizon SaaS Core</span>
          <h1 className="text-xl font-black text-white">Global SuperAdmin Registry</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-slate-950 border border-cyan-500/30 text-cyan-400 text-xs font-bold px-3.5 py-1.5 rounded-full">
            Active Operator: {session.user.name}
          </span>
          <button
            onClick={() => signOut()}
            className="px-4.5 py-1.5 bg-slate-800 hover:bg-red-900/40 text-xs font-bold rounded-full text-slate-300 hover:text-red-400 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-10">
        {/* Statistics Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center shadow-lg">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Total Tenant Spaces</span>
              <span className="block text-3xl font-black mt-2 text-white">{stats.totalTenants}</span>
            </div>
            <div className="text-3xl text-cyan-400">🏢</div>
          </div>
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center shadow-lg">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Active Subscriptions</span>
              <span className="block text-3xl font-black mt-2 text-emerald-400">{stats.activeTenants}</span>
            </div>
            <div className="text-3xl text-emerald-400">⚡</div>
          </div>
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center shadow-lg">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Suspended Tenants</span>
              <span className="block text-3xl font-black mt-2 text-red-400">{stats.suspendedTenants}</span>
            </div>
            <div className="text-3xl text-red-400">⚠️</div>
          </div>
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl flex justify-between items-center shadow-lg">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Total User Bookings</span>
              <span className="block text-3xl font-black mt-2 text-blue-400">{stats.totalRequests}</span>
            </div>
            <div className="text-3xl text-blue-400">✈️</div>
          </div>
        </section>

        {/* Tenant Registry Registry Panel */}
        <section className="bg-slate-900 border border-white/5 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-white">Registered Organizations</h2>
              <p className="text-slate-400 text-xs mt-1">Tenant spaces and domain metadata controls.</p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-full transition shadow-lg shadow-cyan-600/20"
            >
              + Create Tenant Space
            </button>
          </div>

          <div className="overflow-x-auto">
            {isLoadingRegistry ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto" />
              </div>
            ) : tenants.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-semibold">No registered tenant spaces found.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-8 py-4">Name / ID</th>
                    <th className="px-6 py-4">Slug / Domain</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Metrics</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-8 py-5">
                        <div className="font-bold text-white">{tenant.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">{tenant.id}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-slate-300 font-semibold">{tenant.slug}.localhost</div>
                        {tenant.customDomain && (
                          <div className="text-xs text-cyan-400 mt-1">{tenant.customDomain}</div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full uppercase bg-slate-950 border border-white/10 text-slate-300">
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            tenant.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-xs">
                        <div>👥 {tenant.customerCount} Customers</div>
                        <div className="mt-1">✈️ {tenant.requestCount} Requests</div>
                      </td>
                      <td className="px-8 py-5 text-right space-x-2">
                        <button
                          onClick={() => openBrandingModal(tenant)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg text-slate-200 transition"
                        >
                          Branding
                        </button>
                        <button
                          onClick={() => handleToggleSuspension(tenant)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                            tenant.status === "active"
                              ? "bg-amber-900/30 hover:bg-amber-900/50 text-amber-300"
                              : "bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-300"
                          }`}
                        >
                          {tenant.status === "active" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(tenant.id)}
                          className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-xs font-bold rounded-lg text-red-400 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* CREATE TENANT SPACE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Create Tenant Space</h3>
                <p className="text-slate-400 text-xs mt-1">Register a new organization and admin account.</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="p-8 space-y-6 overflow-y-auto flex-grow text-left">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-semibold">
                  {createError}
                </div>
              )}

              {/* Step 1: Tenant Registry settings */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">1. Space Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tenant Name</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                      placeholder="Apex Travel"
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tenant Slug (Optional)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition font-mono"
                      placeholder="apex"
                      value={newTenantSlug}
                      onChange={(e) => setNewTenantSlug(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Custom Domain (Optional)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                      placeholder="apextravel.com"
                      value={newTenantDomain}
                      onChange={(e) => setNewTenantDomain(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Subscription Plan</label>
                    <select
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                      value={newTenantPlan}
                      onChange={(e) => setNewTenantPlan(e.target.value)}
                    >
                      <option value="free">Free Trial</option>
                      <option value="basic">Basic Plan</option>
                      <option value="premium">Premium Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Tenant Admin Account Creation */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">2. Tenant Administrator Account</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Administrator Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                    placeholder="John Doe"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Console Email</label>
                    <input
                      type="email"
                      required
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                      placeholder="admin@apextravel.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Console Password</label>
                    <input
                      type="password"
                      required
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-505 text-white text-xs font-bold rounded-full transition shadow-lg shadow-cyan-600/20"
                >
                  {isCreating ? "Provisioning..." : "Create & Initialize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BRANDING MODAL */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden text-left">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Edit Branding</h3>
                <p className="text-slate-400 text-xs mt-1">Configure layout look for {editingTenant.name}.</p>
              </div>
              <button
                onClick={() => setEditingTenant(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBranding} className="p-8 space-y-5">
              {brandError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl text-xs font-semibold">
                  {brandError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Logo Image</label>
                <LogoUpload
                  value={brandLogo}
                  onChange={setBrandLogo}
                  disabled={isSavingBranding}
                  theme="dark"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tagline / Motto</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Explore Your Next Adventure"
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 border border-white/10 bg-slate-950 rounded-xl cursor-pointer"
                      value={brandPrimary}
                      onChange={(e) => setBrandPrimary(e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono uppercase"
                      value={brandPrimary}
                      onChange={(e) => setBrandPrimary(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 border border-white/10 bg-slate-950 rounded-xl cursor-pointer"
                      value={brandSecondary}
                      onChange={(e) => setBrandSecondary(e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono uppercase"
                      value={brandSecondary}
                      onChange={(e) => setBrandSecondary(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-full transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBranding}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-full transition shadow-lg shadow-cyan-600/20"
                >
                  {isSavingBranding ? "Saving Changes..." : "Save Branding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
