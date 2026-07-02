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
            <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 text-white shadow-2xl">
                <div className="grid gap-8 p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
                    <div className="space-y-4">
                        <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                            Sri Lanka Curated Journeys
                        </span>
                        <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                            Welcome back, {session?.user?.name || "Traveler"}
                        </h2>
                        <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                            Manage your Sri Lanka travel plans, requests, and preferences from one secure dashboard.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/dashboard/my-requests" className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
                                View Requests
                            </Link>
                            <Link href="/dashboard/profile" className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                Update Profile
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                        <div className="rounded-[20px] border border-white/10 bg-[url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center p-6">
                            <div className="rounded-2xl bg-slate-950/70 p-4 backdrop-blur">
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Travel tip</p>
                                <p className="mt-2 text-sm text-slate-200">The best time to visit Sri Lanka is between December and April for sunny beaches and lush hill country.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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
                        <StatCard title="Total Requests" value={stats.total} description="All travel requests submitted" icon={<span className="text-2xl">✈</span>} accent="bg-sky-100 text-sky-700" />
                        <StatCard title="Pending Requests" value={stats.pending} description="Awaiting team review" icon={<span className="text-2xl">⏳</span>} accent="bg-amber-100 text-amber-700" />
                        <StatCard title="Approved Requests" value={stats.approved} description="Confirmed by the travel team" icon={<span className="text-2xl">✓</span>} accent="bg-emerald-100 text-emerald-700" />
                        <StatCard title="Rejected Requests" value={stats.rejected} description="Requests needing updates" icon={<span className="text-2xl">✕</span>} accent="bg-rose-100 text-rose-700" />
                    </>
                ) : null}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Suggested Sri Lanka destinations</h3>
                            <p className="text-sm text-slate-500">Our team recommends these iconic places for your next escape.</p>
                        </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {[
                            { name: "Sigiriya", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80" },
                            { name: "Ella", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80" },
                            { name: "Nuwara Eliya", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80" },
                            { name: "Mirissa", image: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=800&q=80" },
                        ].map((place) => (
                            <div key={place.name} className="overflow-hidden rounded-2xl border border-slate-200">
                                <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${place.image})` }} />
                                <div className="p-4">
                                    <p className="font-semibold text-slate-900">{place.name}</p>
                                    <p className="text-sm text-slate-500">A breathtaking stop on your Sri Lanka journey.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Need help planning?</h3>
                    <p className="mt-2 text-sm text-slate-500">Our travel specialists can tailor the itinerary around your preferences and schedule.</p>
                    <div className="mt-6 space-y-3">
                        {[
                            "Best beaches and surf spots",
                            "Scenic train routes and tea country",
                            "Wildlife safaris and cultural heritage",
                        ].map((tip) => (
                            <div key={tip} className="rounded-2xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
                                {tip}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <SettingsCard title="Quick settings" description="Access your account controls from the main dashboard.">
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                            {session?.user?.name ? `Signed in as ${session.user.name}` : "Signed in to your Horizon Travel account."}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/dashboard/settings" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                                Open full settings
                            </Link>
                            <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                Logout
                            </button>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard title="Account status" description="See how your dashboard account is connected.">
                    <div className="space-y-3 text-sm text-slate-600">
                        <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="font-semibold text-slate-900">Sign-in method</p>
                            <p className="mt-1">{(session?.user as { provider?: string } | undefined)?.provider === "google" ? "Google account" : "Email and password"}</p>
                        </div>
                        <p>Use the full settings page for password changes and other account actions.</p>
                    </div>
                </SettingsCard>
            </section>
        </div>
    );
}
