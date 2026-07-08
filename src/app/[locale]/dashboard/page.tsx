"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import StatsOverviewCard from "@/components/dashboard/StatsOverviewCard";
import EmptyState from "@/components/dashboard/EmptyState";
import SettingsCard from "@/components/dashboard/SettingsCard";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DashboardHomePage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<{ total: number; pending: number; approved: number; rejected: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const t = useTranslations("Dashboard.Home");

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await fetch("/api/dashboard/stats");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to load stats");
                setStats(data.stats);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load stats");
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const provider = (session?.user as { provider?: string } | undefined)?.provider || "credentials";

    return (
        <div className="space-y-10">
            {/* Welcome Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-white/45 backdrop-blur-md border border-white/30 text-slate-800 p-8 md:p-10 lg:p-12 shadow-sm">
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-orange-200/35 to-orange-300/0 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-orange-200/15 to-orange-300/0 blur-2xl pointer-events-none" />

                <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-center">
                    <div className="space-y-6 text-left">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 border border-white/50 shadow-sm">
                            {t("curatedJourneys")}
                        </span>
                        <h2 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl tracking-tight">
                            {t("welcome", { name: session?.user?.name || "Traveler" })}
                        </h2>
                        <p className="max-w-2xl text-base leading-relaxed text-slate-600 font-medium">
                            {t("managePlans")}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link
                                href="/dashboard/my-requests"
                                className="rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                {t("viewRequests")}
                            </Link>
                            <Link
                                href="/dashboard/profile"
                                className="rounded-xl border border-white/50 bg-white/40 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-white/60 hover:border-white/70 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                {t("updateProfile")}
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-xl border border-white/30">
                        <div className="relative h-44 w-full rounded-2xl bg-cover bg-center shadow-inner" style={{ backgroundImage: "linear-gradient(180deg, rgba(34,34,34,0.12), rgba(34,34,34,0.85)), url('/images/sigiriya.png')" }}>
                            <div className="absolute inset-0 flex flex-col justify-end p-6 text-left">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-350">{t("travelTip")}</p>
                                <p className="mt-1.5 text-sm font-semibold text-white leading-relaxed">{t("sigiriyaTip")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Widgets */}
            <section className="w-full">
                {loading ? (
                    <div className="h-32 animate-pulse rounded-2xl bg-white/40 backdrop-blur-sm border border-slate-200" />
                ) : error ? (
                    <EmptyState title={t("unableLoadStats")} description={error} />
                ) : stats ? (
                    <StatsOverviewCard stats={stats} />
                ) : null}
            </section>

            {/* Suggested & Support */}
            <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-3xl bg-white/40 backdrop-blur-md p-6 border border-slate-200 sm:p-8 text-left">
                    <div>
                        <span className="inline-flex items-center rounded-full bg-white/60 border border-white/40 px-3 py-1 text-xs font-semibold text-brand-muted">
                            {t("recommendations")}
                        </span>
                        <h3 className="mt-3.5 text-xl font-bold text-slate-900 tracking-tight">
                            {t("suggestedDestinations")}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-brand-muted">
                            {t("ourTeamRecommends")}
                        </p>
                    </div>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        {[
                            {
                                name: "Sigiriya Rock",
                                desc: "Unearth ancient royal ruins",
                                image: "/images/sigiriya.png",
                            },
                            {
                                name: "Ella Train Journey",
                                desc: "Ride the world's most scenic rails",
                                image: "/images/nine_arch.png",
                            },
                            {
                                name: "Nuwara Eliya Hills",
                                desc: "Mist-covered tea estates & falls",
                                image: "/images/tea.png",
                            },
                            {
                                name: "Mirissa Coastline",
                                desc: "Surf breaks & whale watching",
                                image: "/images/mirissa.png",
                            },
                        ].map((place) => (
                            <div key={place.name} className="group overflow-hidden rounded-2xl bg-white/20 border border-slate-200 transition-all duration-300 hover:-translate-y-1">
                                <div className="h-32 w-full overflow-hidden">
                                    <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${place.image})` }} />
                                </div>
                                <div className="p-4">
                                    <p className="font-bold text-slate-850 group-hover:text-slate-900 transition-colors">{place.name}</p>
                                    <p className="mt-1 text-xs font-semibold text-brand-muted">{place.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col rounded-3xl bg-white/40 backdrop-blur-md text-slate-800 p-6 sm:p-8 text-left border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-slate-700/10 blur-2xl pointer-events-none" />

                    <span className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-650 border border-white/50 self-start">
                        {t("support")}
                    </span>
                    <h3 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">{t("needHelp")}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
                        {t("specialistsTailor")}
                    </p>
                    <div className="mt-6 flex-grow space-y-3 relative z-10">
                        {[
                            t("tip1"),
                            t("tip2"),
                            t("tip3"),
                        ].map((tip) => (
                            <div
                                key={tip}
                                className="flex items-center gap-3.5 rounded-xl bg-white/30 hover:bg-white/50 border border-white/20 p-4 text-xs font-bold text-slate-705 transition-all hover:translate-x-1"
                            >
                                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-slate-400" />
                                {tip}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Settings & Controls */}
            <section className="grid gap-6 lg:grid-cols-2">
                <SettingsCard title={t("quickSettings")} description={t("accessControls")}>
                    <div className="space-y-4 text-left">
                        <p className="text-sm font-medium text-brand-muted">
                            {session?.user?.name
                                ? t("signedInAs", { name: session.user.name })
                                : t("signedInHorizon")}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link
                                href="/dashboard/settings"
                                className="rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white transition-colors duration-200 hover:bg-slate-850 shadow-md"
                            >
                                {t("openFullSettings")}
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="rounded-xl border border-white/40 bg-white/20 px-5 py-3 text-xs font-bold text-slate-700 transition-colors duration-200 hover:bg-white/60 hover:border-white/50 backdrop-blur-sm"
                            >
                                {t("logout")}
                            </button>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard title={t("accountStatus")} description={t("seeConnected")}>
                    <div className="space-y-4 text-sm text-brand-muted text-left">
                        <div className="rounded-xl border border-white/30 bg-white/25 backdrop-blur-sm p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t("signinMethod")}</p>
                            <p className="mt-1 font-bold text-slate-800">
                                {provider === "google"
                                    ? t("googleConnection")
                                    : t("passwordLogin")}
                            </p>
                        </div>
                        <p className="text-xs font-medium text-brand-muted">
                            {t("fullSettingsNotice")}
                        </p>
                    </div>
                </SettingsCard>
            </section>
        </div>
    );
}


