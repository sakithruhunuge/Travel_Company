"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import SettingsCard from "@/components/dashboard/SettingsCard";
import { useTranslations } from "next-intl";
import { useTenant } from "@/context/TenantBrandingContext";
import LogoUpload from "@/components/LogoUpload";

type SessionUser = {
    provider?: string;
};

const inputClassName =
    "w-full rounded-lg border border-brand-light/70 bg-brand-light/50 px-4 py-2.5 text-sm text-brand-dark transition-colors duration-200 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20";

export default function SettingsPage() {
    const { data: session } = useSession();
    const provider = (session?.user as SessionUser | undefined)?.provider || "credentials";
    const tenant = useTenant();
    const userRole = (session?.user as any)?.role;

    // ── Password change state ──
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const t = useTranslations("Dashboard.Settings");

    // ── Branding customizer state ──
    const [logoUrl, setLogoUrl] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#FF8B50");
    const [secondaryColor, setSecondaryColor] = useState("#25A5FE");
    const [tagline, setTagline] = useState("");
    const [brandingSuccess, setBrandingSuccess] = useState("");
    const [brandingError, setBrandingError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (tenant?.branding) {
            setLogoUrl(tenant.branding.logoUrl || "");
            setPrimaryColor(tenant.branding.primaryColor || "#FF8B50");
            setSecondaryColor(tenant.branding.secondaryColor || "#25A5FE");
            setTagline(tenant.branding.tagline || "");
        }
    }, [tenant]);

    const handleBrandingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBrandingSuccess("");
        setBrandingError("");
        setIsSaving(true);

        try {
            const res = await fetch("/api/tenant/branding", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    logoUrl,
                    primaryColor,
                    secondaryColor,
                    tagline,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setBrandingError(data.error || "Failed to update branding settings");
            } else {
                setBrandingSuccess("Branding settings saved successfully! Reloading to apply changes...");
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (err) {
            setBrandingError("Failed to save changes due to a communication timeout");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        if (password !== confirmPassword) {
            setError(t("mismatch"));
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/user/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || t("error"));
            setMessage(t("success"));
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : t("error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Branding Customizer (tenant_admin only) ── */}
            {userRole === "tenant_admin" && (
                <SettingsCard
                    title="Branding Customizer"
                    description="Configure the look-and-feel variables of your booking portal."
                >
                    {brandingSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-4 py-3 rounded-2xl text-xs font-semibold mb-6">
                            {brandingSuccess}
                        </div>
                    )}
                    {brandingError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-2xl text-xs font-semibold mb-6">
                            {brandingError}
                        </div>
                    )}

                    <form onSubmit={handleBrandingSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Company Name</label>
                            <input
                                type="text"
                                disabled
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-400 font-semibold focus:outline-none"
                                value={tenant.name || ""}
                            />
                            <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">Organization name settings cannot be edited directly from tenant panels.</span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Logo Image</label>
                            <LogoUpload
                                value={logoUrl}
                                onChange={setLogoUrl}
                                disabled={isSaving}
                                theme="light"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Brand Tagline</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-slate-800 transition"
                                placeholder="Crafting premium Ceylon escapes"
                                value={tagline}
                                onChange={(e) => setTagline(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Primary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-10 h-10 border border-slate-200 bg-white rounded-xl cursor-pointer"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition font-mono uppercase"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-550 uppercase tracking-wider mb-2">Secondary Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-10 h-10 border border-slate-200 bg-white rounded-xl cursor-pointer"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition font-mono uppercase"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-md"
                            >
                                {isSaving ? "Saving Configuration..." : "Save Branding Settings"}
                            </button>
                        </div>
                    </form>
                </SettingsCard>
            )}

            {/* ── Security ── */}
            <SettingsCard title={t("security")} description={t("securityDesc")}>
                {provider === "google" ? (
                    <p className="text-sm text-brand-muted">{t("googleManaged")}</p>
                ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-brand-muted">
                                {t("newPassword")}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClassName}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-brand-muted">
                                {t("confirmPassword")}
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClassName}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-light/40"
                        >
                            {loading ? t("updating") : t("changePassword")}
                        </button>
                        {message ? <p className="text-sm font-medium text-brand-secondary">{message}</p> : null}
                        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
                    </form>
                )}
            </SettingsCard>

            <SettingsCard title={t("session")} description={t("sessionDesc")}>
                <button
                    onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                    className="rounded-lg border border-brand-light/70 px-5 py-2.5 text-sm font-medium text-brand-dark transition-colors duration-200 hover:bg-brand-light"
                >
                    {t("logout")}
                </button>
            </SettingsCard>

            <SettingsCard title={t("deleteAccount")} description={t("deleteDesc")}>
                <div className="space-y-3">
                    <input
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder={t("placeholder")}
                        className={inputClassName}
                    />
                    <button className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700 transition-colors duration-200 hover:bg-rose-100">
                        {t("deleteButton")}
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
}
