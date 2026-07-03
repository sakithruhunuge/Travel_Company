"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import StatCard from "@/components/dashboard/StatCard";
import LoadingSkeleton from "@/components/dashboard/LoadingSkeleton";
import EmptyState from "@/components/dashboard/EmptyState";
import SettingsCard from "@/components/dashboard/SettingsCard";
import Link from "next/link";

export default function DashboardHomePage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<{ total: number; pending: number; approved: number; rejected: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-brand-dark via-brand-secondary to-brand-dark text-white shadow-2xl relative glow-teal">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="grid gap-8 p-8 lg:grid-cols-[1.35fr_0.65fr] lg:p-10 relative z-10">
                    <div className="space-y-5 text-left">
                        <span className="inline-flex rounded-full bg-brand-primary/10 border border-brand-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">
                            Sri Lanka Curated Journeys
                        </span>
                        <h2 className="text-3xl font-black leading-tight sm:text-4xl tracking-tight">
                            Welcome back, {session?.user?.name || "Traveler"}
                        </h2>
                        <p className="max-w-xl text-sm text-slate-300 sm:text-base leading-relaxed">
                            Manage your Sri Lanka travel plans, requests, and preferences from one secure dashboard.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Link href="/dashboard/my-requests" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-brand-dark transition-all duration-300 hover:bg-brand-primary/95 hover:shadow-lg hover:shadow-brand-primary/20 hover:scale-[1.02]">
                                View Requests
                            </Link>
                            <Link href="/dashboard/profile" className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]">
                                Update Profile
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                        <div className="relative overflow-hidden rounded-[20px] border border-white/10 h-36 bg-[url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center">
                            <div className="absolute inset-0 bg-brand-dark/70" />
                            <div className="absolute inset-0 p-5 flex flex-col justify-end text-left">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-primary">Travel tip</p>
                                <p className="mt-2 text-xs text-slate-200 font-semibold leading-relaxed">The best time to visit Sri Lanka is between December and April for sunny beaches and lush hill country.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Widgets */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading ? (
                    <>
                        <LoadingSkeleton />
                    </>
                ) : error ? (
                    <div className="md:col-span-2 xl:col-span-4">
                        <EmptyState title="Unable to load dashboard stats" description={error} />
                    </div>
                ) : stats ? (
                    <>
                        <StatCard title="Total Requests" value={stats.total} description="All travel requests submitted" icon={<span className="text-2xl">✈</span>} accent="bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20" />
                        <StatCard title="Pending Requests" value={stats.pending} description="Awaiting team review" icon={<span className="text-2xl">⏳</span>} accent="bg-brand-primary/10 text-brand-primary border border-brand-primary/20" />
                        <StatCard title="Approved Requests" value={stats.approved} description="Confirmed by the travel team" icon={<span className="text-2xl">✓</span>} accent="bg-emerald-50 text-emerald-700 border border-emerald-200" />
                        <StatCard title="Rejected Requests" value={stats.rejected} description="Requests needing updates" icon={<span className="text-2xl">✕</span>} accent="bg-rose-50 text-rose-700 border border-rose-200" />
                    </>
                ) : null}
            </section>

            {/* Suggested & Support */}
            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-[32px] border border-slate-200/60 bg-white/70 backdrop-blur-sm p-6 sm:p-8 shadow-sm text-left">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-brand-dark tracking-tight">Suggested Sri Lanka destinations</h3>
                            <p className="text-xs font-semibold text-slate-500 mt-1">Our team recommends these iconic places for your next escape.</p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {[
                            { name: "Sigiriya Rock", desc: "Unearth ancient royal ruins", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80" },
                            { name: "Ella Train Journey", desc: "Ride the world's most scenic rails", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80" },
                            { name: "Nuwara Eliya Hills", desc: "Mist-covered tea estates & falls", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80" },
                            { name: "Mirissa Coastline", desc: "Surf breaks & whale watching", image: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=800&q=80" },
                        ].map((place) => (
                            <div key={place.name} className="group overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
                                <div className="h-28 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(${place.image})` }} />
                                <div className="p-4">
                                    <p className="font-bold text-slate-900">{place.name}</p>
                                    <p className="text-xs text-slate-500 mt-1">{place.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[32px] border border-slate-200/60 bg-white/70 backdrop-blur-sm p-6 sm:p-8 shadow-sm text-left flex flex-col">
                    <h3 className="text-lg font-black text-brand-dark tracking-tight">Need help planning?</h3>
                    <p className="mt-2 text-sm text-slate-500 leading-relaxed">Our Ceylon travel specialists can tailor the itinerary around your preferences and schedule.</p>
                    <div className="mt-6 space-y-3 flex-grow">
                        {[
                            "Best beaches and surf spots",
                            "Scenic train routes and tea country",
                            "Wildlife safaris and cultural heritage",
                        ].map((tip) => (
                            <div key={tip} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-100/70 p-4 text-xs font-bold text-slate-700 shadow-sm hover:translate-x-1 hover:border-brand-primary/20 transition-all duration-300">
                                <span className="text-brand-secondary font-black">➔</span>
                                {tip}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Settings & Controls */}
            <section className="grid gap-6 lg:grid-cols-2">
                <SettingsCard title="Quick settings" description="Access your account controls from the main dashboard.">
                    <div className="space-y-4 text-left">
                        <p className="text-sm font-semibold text-slate-600">
                            {session?.user?.name ? `Signed in as ${session.user.name}` : "Signed in to your Horizon Travel account."}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link href="/dashboard/settings" className="rounded-full bg-brand-secondary hover:bg-brand-secondary/90 hover:shadow-lg hover:shadow-brand-secondary/20 px-6 py-2.5 text-xs font-bold text-white transition-all duration-300">
                                Open Full Settings
                            </Link>
                            <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-full border border-slate-200 hover:bg-slate-50 px-6 py-2.5 text-xs font-bold text-slate-700 transition-all duration-300">
                                Logout
                            </button>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard title="Account status" description="See how your dashboard account is connected.">
                    <div className="space-y-4 text-sm text-slate-600 text-left">
                        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                            <p className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">Sign-in method</p>
                            <p className="mt-1.5 font-bold text-brand-secondary text-sm">{(session?.user as { provider?: string } | undefined)?.provider === "google" ? "Google Account Connection" : "Email & Password Secure Login"}</p>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Use the full settings page for password changes and other account actions.</p>
                    </div>
                </SettingsCard>
            </section>
        </div>
    );
}
