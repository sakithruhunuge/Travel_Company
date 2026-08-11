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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalTenants: 0, activeTenants: 0, suspendedTenants: 0, totalRequests: 0, planBreakdown: {},
  });
  const [isLoadingRegistry, setIsLoadingRegistry] = useState(true);
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
  const [editingTenant, setEditingTenant] = useState<TenantData | null>(null);
  const [brandLogo, setBrandLogo] = useState("");
  const [brandPrimary, setBrandPrimary] = useState("#FF8B50");
  const [brandSecondary, setBrandSecondary] = useState("#25A5FE");
  const [brandTagline, setBrandTagline] = useState("");
  const [brandError, setBrandError] = useState("");
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const isSuperAdmin = session?.user && (session.user as any).role === "super_admin";
  useEffect(() => { if (isSuperAdmin) loadTenants(); }, [isSuperAdmin]);

  const loadTenants = async () => {
    setIsLoadingRegistry(true);
    try {
      const res = await fetch("/api/admin/tenants");
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
        setStats(data.stats || { totalTenants: 0, activeTenants: 0, suspendedTenants: 0, totalRequests: 0, planBreakdown: {} });
      }
    } catch (err) { console.error("Failed to load tenants:", err); }
    finally { setIsLoadingRegistry(false); }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError(""); setIsSubmittingLogin(true);
    try {
      const result = await signIn("credentials", { redirect: false, email, password });
      if (result?.error) setLoginError(result.error); else router.refresh();
    } catch { setLoginError("Unexpected login failure"); }
    finally { setIsSubmittingLogin(false); }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault(); setCreateError(""); setIsCreating(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTenantName, slug: newTenantSlug || undefined, customDomain: newTenantDomain || undefined, plan: newTenantPlan, adminName: newAdminName, adminEmail: newAdminEmail, adminPassword: newAdminPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error || "Failed to create tenant"); }
      else {
        setIsCreateOpen(false);
        setNewTenantName(""); setNewTenantSlug(""); setNewTenantDomain(""); setNewTenantPlan("free");
        setNewAdminName(""); setNewAdminEmail(""); setNewAdminPassword("");
        loadTenants();
      }
    } catch { setCreateError("Communication failure during registration"); }
    finally { setIsCreating(false); }
  };

  const handleToggleSuspension = async (tenant: TenantData) => {
    const nextStatus = tenant.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
      if (res.ok) loadTenants();
    } catch { console.error("Toggle failed"); }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!window.confirm("Permanently delete this organization? This is irreversible.")) return;
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, { method: "DELETE" });
      if (res.ok) loadTenants();
    } catch { console.error("Deletion failed"); }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingTenant) return;
    setBrandError(""); setIsSavingBranding(true);
    try {
      const res = await fetch(`/api/admin/tenants/${editingTenant.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding: { logoUrl: brandLogo, primaryColor: brandPrimary, secondaryColor: brandSecondary, tagline: brandTagline } }),
      });
      const data = await res.json();
      if (!res.ok) setBrandError(data.error || "Failed to update branding");
      else { setEditingTenant(null); loadTenants(); }
    } catch { setBrandError("Server timeout during branding update"); }
    finally { setIsSavingBranding(false); }
  };

  const openBrandingModal = (tenant: TenantData) => {
    setEditingTenant(tenant); setBrandLogo(tenant.branding?.logoUrl || "");
    setBrandPrimary(tenant.branding?.primaryColor || "#FF8B50");
    setBrandSecondary(tenant.branding?.secondaryColor || "#25A5FE");
    setBrandTagline(tenant.branding?.tagline || "");
  };

  if (sessionStatus === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#eef2ff 0%,#faf5ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif", padding: "1rem" }}>
        <div style={{ maxWidth: 420, width: "100%", background: "#fff", borderRadius: 18, padding: "2.5rem", boxShadow: "0 20px 60px rgba(99,102,241,.12),0 4px 16px rgba(0,0,0,.06)", border: "1px solid #e8eaf0" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 10, padding: "7px 16px", marginBottom: 14 }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>HORIZON SAAS CORE</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: 0 }}>SuperAdmin Portal</h1>
            <p style={{ color: "#64748b", fontSize: 13, marginTop: 8 }}>Sign in with platform authority credentials</p>
          </div>
          {loginError && (<div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 9, padding: "10px 14px", fontSize: 12, fontWeight: 600, marginBottom: 20 }}>{loginError}</div>)}
          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 6 }}>Platform Email</label>
              <input type="email" required style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", outline: "none", background: "#f8fafc", boxSizing: "border-box" as const }} placeholder="admin@travelcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 6 }}>Consular Password</label>
              <input type="password" required style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#0f172a", outline: "none", background: "#f8fafc", boxSizing: "border-box" as const }} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={isSubmittingLogin} style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: isSubmittingLogin ? "not-allowed" : "pointer", marginTop: 8, boxShadow: "0 4px 12px rgba(99,102,241,.3)", opacity: isSubmittingLogin ? .7 : 1 }}>
              {isSubmittingLogin ? "Authenticating..." : "Access Console"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',system-ui,sans-serif}
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #f8fafc; }
    ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; border: 1.5px solid #f8fafc; }
    ::-webkit-scrollbar-thumb:hover { background: #333333; }
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .sa-wrap{display:flex;min-height:100vh;font-family:'Inter',system-ui,sans-serif;background:#f1f5f9}
    .sa-sidebar{width:280px;min-width:280px;background:#fff;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:40}
    .sa-logo{display:flex;align-items:center;justify-content:center;padding:14px;border-bottom:1px solid #f1f5f9;min-height:60px}
    .sa-logo-img{height:36px;width:auto;max-width:168px;object-fit:contain;object-position:center;display:block}
    .sa-nav-section{padding:14px 10px 2px}
    .sa-nav-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;padding:0 8px;margin-bottom:4px}
    .sa-nav-item{display:flex;align-items:center;gap:9px;padding:10px 14px;border-radius:7px;color:#64748b;font-size:15px;font-weight:500;cursor:pointer;transition:all .15s;margin-bottom:1px}
    .sa-nav-item:hover{background:#f8fafc;color:#1e293b}
    .sa-nav-item.active{background:linear-gradient(135deg,#eef2ff,#f3f0ff);color:#6366f1;font-weight:600}
    .sa-nav-badge{margin-left:auto;background:#6366f1;color:#fff;font-size:10px;font-weight:700;border-radius:999px;padding:1px 7px}
    .sa-nav-chip{margin-left:auto;background:#fef3c7;color:#d97706;font-size:9px;font-weight:700;letter-spacing:.04em;border-radius:4px;padding:2px 5px}
    .sa-sidebar-footer{margin-top:auto;padding:14px 10px;border-top:1px solid #f1f5f9}
    .sa-team-card{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:9px;background:#f8fafc;cursor:pointer;margin-bottom:8px;transition:background .15s}
    .sa-team-card:hover{background:#f1f5f9}
    .sa-team-av{width:30px;height:30px;border-radius:7px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;flex-shrink:0}
    .sa-team-name{font-size:12px;font-weight:700;color:#1e293b}
    .sa-team-role{font-size:10px;color:#94a3b8}
    .sa-upgrade{width:100%;padding:8px;background:#fff;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s}
    .sa-upgrade:hover{border-color:#6366f1;color:#6366f1}
    .sa-main{margin-left:280px;flex:1;display:flex;flex-direction:column;min-height:100vh}
    .sa-topbar{background:#fff;border-bottom:1px solid #e2e8f0;padding:0 26px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,.04)}
    .sa-topbar-title{font-size:19px;font-weight:800;color:#0f172a}
    .sa-topbar-right{display:flex;align-items:center;gap:10px}
    .sa-search{display:flex;align-items:center;gap:7px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 12px;color:#94a3b8;font-size:12.5px;cursor:text;transition:border .15s}
    .sa-search:hover{border-color:#c7d0dc}
    .sa-kbd{font-size:10px;color:#c7d0dc;background:#f1f5f9;border-radius:4px;padding:1px 6px;margin-left:8px}
    .sa-icon-btn{width:34px;height:34px;border-radius:7px;background:transparent;border:none;display:flex;align-items:center;justify-content:center;color:#64748b;cursor:pointer;transition:all .15s;flex-shrink:0}
    .sa-icon-btn:hover{background:#f1f5f9;border-color:#c7d0dc}
    .sa-profile{display:flex;align-items:center;gap:9px;background:transparent;border:none;border-radius:9px;padding:5px 12px 5px 7px;cursor:pointer;transition:background .15s}
    .sa-profile:hover{background:#f1f5f9}
    .sa-profile-av{width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;flex-shrink:0}
    .sa-profile-name{font-size:12.5px;font-weight:700;color:#1e293b}
    .sa-profile-role{font-size:9.5px;color:#94a3b8;font-weight:500}
    .sa-logout{padding:6px 13px;background:#fff;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;transition:all .15s}
    .sa-logout:hover{border-color:#fecdd3;color:#e11d48;background:#fff1f2}
    .sa-body{padding:26px;flex:1;animation:fadeUp .3s ease}
    .sa-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:26px}
    .sa-stat-card{background:#fff;border-radius:13px;padding:19px 20px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04);display:flex;justify-content:space-between;align-items:flex-start;transition:transform .2s,box-shadow .2s}
    .sa-stat-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08)}
    .sa-stat-label{font-size:10.5px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em}
    .sa-stat-val{font-size:28px;font-weight:800;color:#0f172a;margin-top:5px;line-height:1}
    .sa-stat-badge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;border-radius:6px;padding:2px 7px;margin-top:7px}
    .sa-stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .sa-section{background:#fff;border-radius:15px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,.04);overflow:hidden}
    .sa-section-hd{padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center}
    .sa-section-title{font-size:15px;font-weight:800;color:#0f172a}
    .sa-section-sub{font-size:11.5px;color:#94a3b8;margin-top:2px}
    .sa-create-btn{padding:8px 17px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(99,102,241,.25);transition:all .15s;white-space:nowrap}
    .sa-create-btn:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(99,102,241,.35)}
    .sa-orgs{padding:20px;display:flex;flex-direction:column;gap:14px}
    .sa-org-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:13px;padding:18px 20px;transition:box-shadow .2s,border-color .2s}
    .sa-org-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.07);border-color:#c7d0dc}
    .sa-org-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
    .sa-org-name{font-size:14.5px;font-weight:800;color:#0f172a}
    .sa-org-id{font-size:9.5px;color:#94a3b8;font-family:'Courier New',monospace;margin-top:3px}
    .sa-badge-row{display:flex;align-items:center;gap:7px}
    .sa-plan-badge{font-size:9.5px;font-weight:700;letter-spacing:.06em;padding:3px 8px;border-radius:5px;text-transform:uppercase;background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0}
    .sa-status-badge{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:.04em}
    .sa-dot{width:6px;height:6px;border-radius:50%;display:inline-block}
    .sa-org-body{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:14px}
    .sa-info-label{font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
    .sa-info-val{font-size:12.5px;font-weight:600;color:#374151}
    .sa-info-sub{font-size:11px;color:#6366f1;margin-top:2px}
    .sa-metrics{display:flex;gap:18px}
    .sa-metric{display:flex;align-items:center;gap:6px}
    .sa-metric-val{font-size:13px;font-weight:700;color:#374151}
    .sa-metric-lbl{font-size:10.5px;color:#94a3b8}
    .sa-divider{border:none;border-top:1px solid #e2e8f0;margin:0 0 13px}
    .sa-actions{display:flex;gap:7px;flex-wrap:wrap}
    .sa-btn{padding:6px 14px;border-radius:7px;font-size:12px;font-weight:600;border:1.5px solid transparent;cursor:pointer;transition:all .15s}
    .sa-btn-ghost{background:#fff;border-color:#e2e8f0;color:#374151}
    .sa-btn-ghost:hover{border-color:#6366f1;color:#6366f1;background:#eef2ff}
    .sa-btn-warn{background:#fffbeb;border-color:#fde68a;color:#d97706}
    .sa-btn-warn:hover{background:#fef3c7;border-color:#f59e0b}
    .sa-btn-success{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a}
    .sa-btn-success:hover{background:#dcfce7;border-color:#86efac}
    .sa-btn-danger{background:#fff1f2;border-color:#fecdd3;color:#e11d48}
    .sa-btn-danger:hover{background:#ffe4e6;border-color:#fda4af}
    .sa-center{padding:56px 20px;text-align:center;color:#94a3b8;font-size:13.5px;font-weight:500}
    .sa-spinner{width:26px;height:26px;border-radius:50%;border:3px solid #e2e8f0;border-top-color:#6366f1;animation:spin .8s linear infinite;margin:0 auto 10px}
    .sa-footer{background:#fff;border-top:1px solid #e2e8f0;padding:14px 26px;text-align:center;color:#94a3b8;font-size:11.5px;font-weight:500}
    .sa-backdrop{position:fixed;inset:0;z-index:50;background:rgba(15,23,42,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px}
    .sa-modal{background:#fff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 24px 80px rgba(0,0,0,.16);width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;animation:fadeUp .25s ease}
    .sa-modal-hd{padding:20px 24px 16px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center}
    .sa-modal-title{font-size:16px;font-weight:800;color:#0f172a}
    .sa-modal-sub{font-size:11.5px;color:#94a3b8;margin-top:2px}
    .sa-modal-close{width:28px;height:28px;border-radius:6px;background:#f1f5f9;border:none;font-size:15px;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
    .sa-modal-close:hover{background:#fee2e2;color:#dc2626}
    .sa-modal-body{padding:22px 24px;overflow-y:auto;flex:1}
    .sa-modal-ft{padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:9px}
    .sa-field{margin-bottom:14px}
    .sa-field-label{display:block;font-size:10.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
    .sa-input{width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:13px;color:#0f172a;background:#f8fafc;outline:none;transition:border .2s;font-family:inherit}
    .sa-input:focus{border-color:#6366f1;background:#fff}
    .sa-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .sa-step-hd{font-size:10.5px;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
    .sa-step-div{border:none;border-top:1px solid #f1f5f9;margin:18px 0}
    .sa-err{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:9px 13px;font-size:12px;font-weight:600;margin-bottom:14px}
    .sa-btn-primary{padding:8px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(99,102,241,.25);transition:all .15s}
    .sa-btn-primary:hover{transform:translateY(-1px);box-shadow:0 5px 14px rgba(99,102,241,.35)}
    .sa-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .sa-btn-secondary{padding:8px 16px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#374151;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
    .sa-btn-secondary:hover{border-color:#c7d0dc;background:#f1f5f9}
    .sa-color-row{display:flex;gap:9px;align-items:center}
    .sa-color-swatch{width:38px;height:38px;border-radius:8px;border:1.5px solid #e2e8f0;cursor:pointer;flex-shrink:0}
    @media(max-width:900px){.sa-stat-grid{grid-template-columns:repeat(2,1fr)}.sa-org-body{grid-template-columns:1fr 1fr}.sa-sidebar{display:none}.sa-main{margin-left:0}}
  `;

  return (
    <>
      <style>{CSS}</style>
      <div className="sa-wrap">
        <aside className="sa-sidebar">
          <div className="sa-logo">
            <img src="/images/horizon.png" alt="Horizon SaaS Core" className="sa-logo-img" />
          </div>
          <div className="sa-nav-section">
            <div className="sa-nav-label">General</div>
            <div className="sa-nav-item active">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              Dashboard
            </div>
            <div className="sa-nav-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
              Manage Packages
            </div>
            <div className="sa-nav-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              Approve Bookings
            </div>
          </div>
          <div className="sa-nav-section">
            <div className="sa-nav-label">Tools</div>

            <div className="sa-nav-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              Manage Users
            </div>
            <div className="sa-nav-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>
              Analytics
            </div>

          </div>
          <div className="sa-nav-section">
            <div className="sa-nav-label">Support</div>
            <div className="sa-nav-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              Profile
            </div>
            <div className="sa-nav-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              Settings
            </div>
            <div className="sa-nav-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              Help
            </div>
          </div>
          <div className="sa-sidebar-footer">
            <button className="sa-logout" style={{ width: "100%", padding: "10px" }} onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}>Logout</button>
            <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '12px' }}>© 2026 Horizon Travel</div>
          </div>
        </aside>

        <div className="sa-main">
          <header className="sa-topbar">
            <div className="sa-search" style={{ minWidth: '350px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Search
              </div>
              <span className="sa-kbd">⌘ + F</span>
            </div>
            <div className="sa-topbar-right">
              <div className="sa-icon-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              </div>
              <div className="sa-icon-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <div className="sa-profile">
                <div className="sa-profile-av">{session.user?.name?.charAt(0).toUpperCase() ?? "A"}</div>
                <div>
                  <div className="sa-profile-name">{session.user?.name ?? "Active Operator"}</div>
                  <div className="sa-profile-role">Active Operator</div>
                </div>
              </div>
            </div>
          </header>

          <main className="sa-body">
            <div className="sa-topbar-title" style={{ marginBottom: '24px', fontSize: '22px', fontWeight: 600 }}>Global SuperAdmin Registry</div>
            <div className="sa-stat-grid">
              <div className="sa-stat-card">
                <div>
                  <div className="sa-stat-label">Total Tenant Spaces</div>
                  <div className="sa-stat-val">{stats.totalTenants}</div>
                  <div className="sa-stat-badge" style={{ background: "#ede9fe", color: "#7c3aed" }}>↑ All time</div>
                </div>
                <div className="sa-stat-icon" style={{ background: "#ede9fe" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="1" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                </div>
              </div>
              <div className="sa-stat-card">
                <div>
                  <div className="sa-stat-label">Active Subscriptions</div>
                  <div className="sa-stat-val" style={{ color: "#059669" }}>{stats.activeTenants}</div>
                  <div className="sa-stat-badge" style={{ background: "#d1fae5", color: "#059669" }}>↑ Online</div>
                </div>
                <div className="sa-stat-icon" style={{ background: "#d1fae5" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
              </div>
              <div className="sa-stat-card">
                <div>
                  <div className="sa-stat-label">Suspended Tenants</div>
                  <div className="sa-stat-val" style={{ color: "#dc2626" }}>{stats.suspendedTenants}</div>
                  <div className="sa-stat-badge" style={{ background: "#fee2e2", color: "#dc2626" }}>! Flagged</div>
                </div>
                <div className="sa-stat-icon" style={{ background: "#fee2e2" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
              </div>
              <div className="sa-stat-card">
                <div>
                  <div className="sa-stat-label">Total User Bookings</div>
                  <div className="sa-stat-val" style={{ color: "#2563eb" }}>{stats.totalRequests}</div>
                  <div className="sa-stat-badge" style={{ background: "#dbeafe", color: "#2563eb" }}>↑ Requests</div>
                </div>
                <div className="sa-stat-icon" style={{ background: "#dbeafe" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
              </div>
            </div>

            {/* ── Charts Row ── */}
            {(() => {
              // ── Donut Chart: Plan Distribution ──
              const planColors: Record<string, string> = {
                free: "#a5b4fc",
                basic: "#6366f1",
                premium: "#8b5cf6",
                enterprise: "#0f172a",
              };
              const planFallback: Record<string, number> = { free: 3, basic: 5, premium: 4, enterprise: 2 };
              const planData = (stats.planBreakdown && Object.keys(stats.planBreakdown).length > 0)
                ? stats.planBreakdown
                : planFallback;
              const planEntries = Object.entries(planData);
              const planTotal = planEntries.reduce((s, [, v]) => s + v, 0) || 1;

              // Build SVG arcs (cx=100, cy=100, r=76, stroke-width=32)
              const cx = 100, cy = 100, r = 76, sw = 32;
              const circumference = 2 * Math.PI * r;
              let offset = 0;
              const arcs = planEntries.map(([plan, count]) => {
                const pct = count / planTotal;
                const dash = pct * circumference;
                const arc = { plan, count, pct, dash, offset };
                offset += dash;
                return arc;
              });

              // ── Area Line Chart: 7-Day Bookings ──
              const bookingDays = [
                { day: "Mon", bookings: 38 },
                { day: "Tue", bookings: 62 },
                { day: "Wed", bookings: 45 },
                { day: "Thu", bookings: 91 },
                { day: "Fri", bookings: 74 },
                { day: "Sat", bookings: 110 },
                { day: "Sun", bookings: 83 },
              ];
              const W = 420, H = 140, PAD = { t: 14, r: 16, b: 32, l: 38 };
              const maxB = Math.max(...bookingDays.map(d => d.bookings));
              const innerW = W - PAD.l - PAD.r;
              const innerH = H - PAD.t - PAD.b;
              const pts = bookingDays.map((d, i) => ({
                x: PAD.l + (i / (bookingDays.length - 1)) * innerW,
                y: PAD.t + innerH - (d.bookings / maxB) * innerH,
                ...d,
              }));
              const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
              const areaPath = `M${pts[0].x},${PAD.t + innerH} ` +
                pts.map(p => `L${p.x},${p.y}`).join(" ") +
                ` L${pts[pts.length - 1].x},${PAD.t + innerH} Z`;

              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.7fr", gap: "18px", marginBottom: "26px" }}>

                  {/* ── Card 1: Donut ── */}
                  <div style={{ background: "#fff", borderRadius: "13px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.04)", padding: "22px 24px", display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>Plan Distribution</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "20px" }}>Breakdown by subscription tier</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "32px" }}>
                      {/* SVG Donut */}
                      <svg width="200" height="200" viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
                        {arcs.map(({ plan, dash, offset: o }) => (
                          <circle
                            key={plan}
                            cx={cx} cy={cy} r={r}
                            fill="none"
                            stroke={planColors[plan] ?? "#cbd5e1"}
                            strokeWidth={sw}
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-o + circumference * 0.25}
                            strokeLinecap="butt"
                            style={{ transition: "stroke-dasharray .6s ease" }}
                          />
                        ))}
                        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="26" fontWeight="800" fill="#0f172a">{planTotal}</text>
                        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="#94a3b8">Tenants</text>
                      </svg>
                      {/* Legend */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                        {arcs.map(({ plan, count, pct }) => (
                          <div key={plan} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: planColors[plan] ?? "#cbd5e1", flexShrink: 0 }} />
                            <div style={{ flex: 1, fontSize: "12px", color: "#475569", textTransform: "capitalize", fontWeight: 600 }}>{plan}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{count} <span style={{ color: "#c7d0dc" }}>({Math.round(pct * 100)}%)</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Card 2: Area Line Chart ── */}
                  <div style={{ background: "#fff", borderRadius: "13px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.04)", padding: "22px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Platform Booking Activity</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "16px" }}>Total bookings across all tenants — last 7 days</div>
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", background: "#eef2ff", borderRadius: "6px", padding: "3px 10px" }}>
                        {bookingDays.reduce((s, d) => s + d.bookings, 0)} total
                      </div>
                    </div>
                    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>
                      {/* Horizontal grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map(f => {
                        const y = PAD.t + innerH - f * innerH;
                        return (
                          <g key={f}>
                            <line x1={PAD.l} y1={y} x2={PAD.l + innerW} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                            <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#c7d0dc">{Math.round(f * maxB)}</text>
                          </g>
                        );
                      })}
                      {/* Area fill */}
                      <path d={areaPath} fill="url(#areaGrad)" />
                      {/* Line */}
                      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                      {/* Dots + day labels */}
                      {pts.map(p => (
                        <g key={p.day}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2.5" />
                          <text x={p.x} y={PAD.t + innerH + 18} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">{p.day}</text>
                        </g>
                      ))}
                    </svg>
                  </div>

                </div>
              );
            })()}

            {/* ── Two-Column Layout: Leaderboard & Organizations ── */}
            <div style={{ display: "grid", gridTemplateColumns: "35% 1fr", gap: "24px", marginBottom: "26px", alignItems: "start" }}>

              {/* ── Left Column: Leaderboard ── */}
              {(() => {
                const topAgencies = [
                  { name: "Apex Travel", cust: 1240 },
                  { name: "Wanderlust Inc", cust: 980 },
                  { name: "Global Nomads", cust: 850 },
                  { name: "Vista Tours", cust: 620 },
                  { name: "Horizon Travel", cust: 410 },
                ];
                const aMax = Math.max(...topAgencies.map(d => d.cust));
                const lW = 340, lH = 155;
                const rowH = lH / topAgencies.length;
                const labelW = 140, numW = 44;
                const trackW = lW - labelW - numW;

                return (
                  <div style={{ background: "#fff", borderRadius: "13px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.04)", padding: "22px 24px", display: "flex", flexDirection: "column", alignSelf: "flex-start" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "3px" }}>Top Performing Agencies</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "20px" }}>Ranked by total customer count</div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                      <svg width="100%" viewBox={`0 0 ${lW} ${lH}`} style={{ overflow: "visible" }}>
                        {topAgencies.map((agency, i) => {
                          const fy = i * rowH;
                          const barW = (agency.cust / aMax) * trackW;
                          const opacity = 1 - i * 0.13;
                          return (
                            <g key={agency.name} transform={`translate(0,${fy})`}>
                              {/* Rank badge */}
                              <rect x="0" y={rowH / 2 - 9} width="18" height="18" fill={i === 0 ? "#fef3c7" : "#f1f5f9"} rx="5" />
                              <text x="9" y={rowH / 2 + 5} textAnchor="middle" fontSize="10" fontWeight="800" fill={i === 0 ? "#d97706" : "#94a3b8"}>{i + 1}</text>
                              {/* Agency name */}
                              <text x="26" y={rowH / 2 + 4} fontSize="11.5" fontWeight="600" fill="#1e293b">{agency.name}</text>
                              {/* Track */}
                              <rect x={labelW} y={rowH / 2 - 5} width={trackW} height="10" fill="#f1f5f9" rx="5" />
                              {/* Fill */}
                              <rect x={labelW} y={rowH / 2 - 5} width={barW} height="10" fill="#6366f1" rx="5" opacity={opacity} />
                              {/* Value */}
                              <text x={labelW + trackW + 8} y={rowH / 2 + 4} fontSize="11" fontWeight="700" fill="#475569">{agency.cust.toLocaleString()}</text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                );
              })()}

              {/* ── Right Column: Registered Organizations ── */}
              <div className="sa-section" style={{ margin: 0 }}>
                <div className="sa-section-hd">
                  <div>
                    <div className="sa-section-title">Registered Organizations</div>
                    <div className="sa-section-sub">Tenant spaces and domain metadata controls.</div>
                  </div>
                  <button className="sa-create-btn" onClick={() => setIsCreateOpen(true)}>+ Create Tenant Space</button>
                </div>
                <div className="sa-orgs">
                  {isLoadingRegistry ? (
                    <div className="sa-center"><div className="sa-spinner" />Loading organizations...</div>
                  ) : tenants.length === 0 ? (
                    <div className="sa-center">No registered tenant spaces found.</div>
                  ) : (
                    tenants.map((tenant) => (
                      <div className="sa-org-card" key={tenant.id}>
                        <div className="sa-org-top">
                          <div>
                            <div className="sa-org-name">{tenant.name}</div>
                            <div className="sa-org-id">ID: {tenant.id}</div>
                          </div>
                          <div className="sa-badge-row">
                            <span className="sa-plan-badge">{tenant.plan.toUpperCase()}</span>
                            <span className="sa-status-badge" style={tenant.status === "active" ? { background: "#d1fae5", color: "#059669" } : { background: "#fee2e2", color: "#dc2626" }}>
                              <span className="sa-dot" style={{ background: tenant.status === "active" ? "#10b981" : "#ef4444" }} />
                              {tenant.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="sa-org-body">
                          <div>
                            <div className="sa-info-label">Site / Domain</div>
                            <div className="sa-info-val">{tenant.slug}.localhost</div>
                            {tenant.customDomain && <div className="sa-info-sub">{tenant.customDomain}</div>}
                          </div>
                          <div>
                            <div className="sa-info-label">Metrics</div>
                            <div className="sa-metrics">
                              <div className="sa-metric">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                <div><div className="sa-metric-val">{tenant.customerCount}</div><div className="sa-metric-lbl">Customers</div></div>
                              </div>
                              <div className="sa-metric">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4c-.7 0-1.5.3-2 .8L13 8.2 4.8 6.4l-1.6 1.6 6 3.5-3.5 3.5-2-.6-1.4 1.4 3.5 1.5 1.5 3.5 1.4-1.4-.6-2 3.5-3.5 3.5 6 1.6-1.6z" /></svg>
                                <div><div className="sa-metric-val">{tenant.requestCount}</div><div className="sa-metric-lbl">Requests</div></div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="sa-info-label">Plan</div>
                            <div className="sa-info-val" style={{ textTransform: "capitalize" }}>{tenant.plan}</div>
                          </div>
                        </div>
                        <hr className="sa-divider" />
                        <div className="sa-actions">
                          <button className="sa-btn sa-btn-ghost" onClick={() => openBrandingModal(tenant)}>🎨 Branding</button>
                          <button className={`sa-btn ${tenant.status === "active" ? "sa-btn-warn" : "sa-btn-success"}`} onClick={() => handleToggleSuspension(tenant)}>
                            {tenant.status === "active" ? "⏸ Suspend" : "▶ Activate"}
                          </button>
                          <button className="sa-btn sa-btn-danger" onClick={() => handleDeleteTenant(tenant.id)}>🗑 Delete</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div> {/* End Two-Column Layout */}
          </main>

        </div>
      </div>

      {isCreateOpen && (
        <div className="sa-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-hd">
              <div><div className="sa-modal-title">Create Tenant Space</div><div className="sa-modal-sub">Register a new organization and admin account.</div></div>
              <button className="sa-modal-close" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTenant} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div className="sa-modal-body">
                {createError && <div className="sa-err">{createError}</div>}
                <div className="sa-step-hd">1. Space Configuration</div>
                <div className="sa-grid2">
                  <div className="sa-field"><label className="sa-field-label">Tenant Name</label><input type="text" required className="sa-input" placeholder="Apex Travel" value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)} /></div>
                  <div className="sa-field"><label className="sa-field-label">Tenant Slug (Optional)</label><input type="text" className="sa-input" placeholder="apex" style={{ fontFamily: "monospace" }} value={newTenantSlug} onChange={(e) => setNewTenantSlug(e.target.value)} /></div>
                  <div className="sa-field"><label className="sa-field-label">Custom Domain (Optional)</label><input type="text" className="sa-input" placeholder="apextravel.com" value={newTenantDomain} onChange={(e) => setNewTenantDomain(e.target.value)} /></div>
                  <div className="sa-field"><label className="sa-field-label">Subscription Plan</label>
                    <select className="sa-input" value={newTenantPlan} onChange={(e) => setNewTenantPlan(e.target.value)}>
                      <option value="free">Free Trial</option><option value="basic">Basic Plan</option><option value="premium">Premium Plan</option><option value="enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                </div>
                <hr className="sa-step-div" />
                <div className="sa-step-hd">2. Tenant Administrator Account</div>
                <div className="sa-field"><label className="sa-field-label">Administrator Name</label><input type="text" required className="sa-input" placeholder="John Doe" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} /></div>
                <div className="sa-grid2">
                  <div className="sa-field"><label className="sa-field-label">Console Email</label><input type="email" required className="sa-input" placeholder="admin@apextravel.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} /></div>
                  <div className="sa-field"><label className="sa-field-label">Console Password</label><input type="password" required className="sa-input" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} /></div>
                </div>
              </div>
              <div className="sa-modal-ft">
                <button type="button" className="sa-btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="sa-btn-primary" disabled={isCreating}>{isCreating ? "Provisioning..." : "Create & Initialize"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTenant && (
        <div className="sa-backdrop" onClick={() => setEditingTenant(null)}>
          <div className="sa-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-hd">
              <div><div className="sa-modal-title">Edit Branding</div><div className="sa-modal-sub">Configure the look for {editingTenant.name}.</div></div>
              <button className="sa-modal-close" onClick={() => setEditingTenant(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveBranding} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div className="sa-modal-body">
                {brandError && <div className="sa-err">{brandError}</div>}
                <div className="sa-field"><label className="sa-field-label">Logo Image</label><LogoUpload value={brandLogo} onChange={setBrandLogo} disabled={isSavingBranding} theme="light" /></div>
                <div className="sa-field"><label className="sa-field-label">Tagline / Motto</label><input type="text" className="sa-input" placeholder="Explore Your Next Adventure" value={brandTagline} onChange={(e) => setBrandTagline(e.target.value)} /></div>
                <div className="sa-grid2">
                  <div className="sa-field">
                    <label className="sa-field-label">Primary Color</label>
                    <div className="sa-color-row"><input type="color" className="sa-color-swatch" value={brandPrimary} onChange={(e) => setBrandPrimary(e.target.value)} /><input type="text" className="sa-input" style={{ fontFamily: "monospace", textTransform: "uppercase" }} value={brandPrimary} onChange={(e) => setBrandPrimary(e.target.value)} /></div>
                  </div>
                  <div className="sa-field">
                    <label className="sa-field-label">Secondary Color</label>
                    <div className="sa-color-row"><input type="color" className="sa-color-swatch" value={brandSecondary} onChange={(e) => setBrandSecondary(e.target.value)} /><input type="text" className="sa-input" style={{ fontFamily: "monospace", textTransform: "uppercase" }} value={brandSecondary} onChange={(e) => setBrandSecondary(e.target.value)} /></div>
                  </div>
                </div>
              </div>
              <div className="sa-modal-ft">
                <button type="button" className="sa-btn-secondary" onClick={() => setEditingTenant(null)}>Cancel</button>
                <button type="submit" className="sa-btn-primary" disabled={isSavingBranding}>{isSavingBranding ? "Saving..." : "Save Branding"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
