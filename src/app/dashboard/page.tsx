"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
    SendOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    RightOutlined,
} from "@ant-design/icons";
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
        <div className="space-y-8">
            {/* Welcome Banner */}
            <section className="rounded-2xl bg-gradient-to-r from-white via-slate-50 to-white p-6 shadow-lg lg:p-8">
                <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] items-center">
                    <div className="space-y-4 text-left">
                        <span className="inline-flex text-xs font-semibold uppercase tracking-wider text-teal-600">
                            Sri Lanka Curated Journeys
                        </span>
                        <h2 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                            Welcome back, {session?.user?.name || "Traveler"}
                        </h2>
                        <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                            Manage your Sri Lanka travel plans, requests, and preferences from one secure and
                            beautiful dashboard.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-3">
                            <Link
                                href="/dashboard/my-requests"
                                className="rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-teal-500 transition"
                            >
                                View Requests
                            </Link>
                            <Link
                                href="/dashboard/profile"
                                className="rounded-md border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Update Profile
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-xl overflow-hidden">
                        <div className="relative h-40 w-full rounded-xl bg-cover bg-center shadow-inner" style={{ backgroundImage: "linear-gradient(180deg, rgba(15,23,42,0.15), rgba(255,255,255,0.1)), url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80')" }}>
                            <div className="absolute inset-0 flex flex-col justify-end p-5 text-left">
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-100">Travel tip</p>
                                <p className="mt-1 text-sm font-medium text-white drop-shadow">The best time to visit Sri Lanka is December–April for sunny beaches and lush hill country.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Widgets */}
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="md:col-span-2 xl:col-span-4">
                        <EmptyState title="Unable to load dashboard stats" description={error} />
                    </div>
                ) : stats ? (
                    <>
                        <StatCard title="Total Requests" value={stats.total} description="All travel requests" icon={<SendOutlined />} accent="bg-gradient-to-br from-brand-primary to-brand-secondary" />
                        <StatCard title="Pending" value={stats.pending} description="Awaiting review" icon={<ClockCircleOutlined />} accent="bg-gradient-to-br from-yellow-400 to-amber-400" />
                        <StatCard title="Approved" value={stats.approved} description="Confirmed trips" icon={<CheckCircleOutlined />} accent="bg-gradient-to-br from-brand-secondary to-emerald-400" />
                        <StatCard title="Rejected" value={stats.rejected} description="Needs attention" icon={<CloseCircleOutlined />} accent="bg-gradient-to-br from-rose-600 to-rose-400" />
                    </>
                ) : null}
            </section>

            {/* Suggested & Support */}
            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8 text-left">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Recommendations
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-800">
                            Suggested Sri Lanka destinations
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Our team recommends these iconic places for your next escape.
                        </p>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {[
                            {
                                name: "Sigiriya Rock",
                                desc: "Unearth ancient royal ruins",
                                image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
                            },
                            {
                                name: "Ella Train Journey",
                                desc: "Ride the world's most scenic rails",
                                image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
                            },
                            {
                                name: "Nuwara Eliya Hills",
                                desc: "Mist-covered tea estates & falls",
                                image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
                            },
                            {
                                name: "Mirissa Coastline",
                                desc: "Surf breaks & whale watching",
                                image: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=800&q=80",
                            },
                        ].map((place) => (
                            <div key={place.name} className="overflow-hidden rounded-xl bg-white shadow-sm transition-transform hover:-translate-y-1">
                                <div className="h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${place.image})` }} />
                                <div className="p-4">
                                    <p className="font-semibold text-slate-900">{place.name}</p>
                                    <p className="mt-1 text-sm text-slate-500">{place.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col rounded-2xl bg-white p-6 shadow-lg sm:p-8 text-left">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Support</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-800">Need help planning?</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        Our Ceylon travel specialists can tailor the itinerary around your preferences and schedule.
                    </p>
                    <div className="mt-5 flex-grow space-y-2">
                        {[
                            "Best beaches and surf spots",
                            "Scenic train routes and tea country",
                            "Wildlife safaris and cultural heritage",
                        ].map((tip) => (
                            <div
                                key={tip}
                                className="flex items-center gap-3 rounded-lg bg-slate-50 p-3.5 text-sm text-slate-700 transition-transform hover:-translate-y-0.5"
                            >
                                <RightOutlined className="flex-shrink-0 text-xs text-teal-700" />
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
                        <p className="text-sm text-slate-600">
                            {session?.user?.name
                                ? `Signed in as ${session.user.name}`
                                : "Signed in to your Horizon Travel account."}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link
                                href="/dashboard/settings"
                                className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-700"
                            >
                                Open Full Settings
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard title="Account status" description="See how your dashboard account is connected.">
                    <div className="space-y-4 text-sm text-slate-600 text-left">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Sign-in method</p>
                            <p className="mt-1.5 font-medium text-slate-800">
                                {(session?.user as { provider?: string } | undefined)?.provider === "google"
                                    ? "Google Account Connection"
                                    : "Email & Password Secure Login"}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500">
                            Use the full settings page for password changes and other account actions.
                        </p>
                    </div>
                </SettingsCard>
            </section>
        </div>
    );
}
