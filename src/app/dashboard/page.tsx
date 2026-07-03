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
        <div className="space-y-6">
            {/* Welcome Banner */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)] lg:p-8">
                <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
                    <div className="space-y-4 text-left">
                        <span className="inline-flex text-xs font-medium uppercase tracking-wider text-teal-700">
                            Sri Lanka Curated Journeys
                        </span>
                        <h2 className="text-2xl font-semibold leading-tight text-slate-800 sm:text-3xl">
                            Welcome back, {session?.user?.name || "Traveler"}
                        </h2>
                        <p className="max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
                            Manage your Sri Lanka travel plans, requests, and preferences from one secure dashboard.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link
                                href="/dashboard/my-requests"
                                className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-700"
                            >
                                View Requests
                            </Link>
                            <Link
                                href="/dashboard/profile"
                                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
                            >
                                Update Profile
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div
                            className="relative overflow-hidden rounded-lg h-36 bg-cover bg-center"
                            style={{
                                backgroundImage:
                                    "url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80')",
                            }}
                        >
                            <div className="absolute inset-0 bg-slate-900/50" />
                            <div className="absolute inset-0 flex flex-col justify-end p-4 text-left">
                                <p className="text-xs font-medium uppercase tracking-wider text-teal-300">Travel tip</p>
                                <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-100">
                                    The best time to visit Sri Lanka is between December and April for sunny beaches and lush hill country.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Widgets */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <div className="md:col-span-2 xl:col-span-4">
                        <EmptyState title="Unable to load dashboard stats" description={error} />
                    </div>
                ) : stats ? (
                    <>
                        <StatCard
                            title="Total Requests"
                            value={stats.total}
                            description="All travel requests submitted"
                            icon={<SendOutlined className="text-lg" />}
                            accent="bg-slate-100 text-slate-600"
                        />
                        <StatCard
                            title="Pending Requests"
                            value={stats.pending}
                            description="Awaiting team review"
                            icon={<ClockCircleOutlined className="text-lg" />}
                            accent="bg-amber-50 text-amber-700"
                        />
                        <StatCard
                            title="Approved Requests"
                            value={stats.approved}
                            description="Confirmed by the travel team"
                            icon={<CheckCircleOutlined className="text-lg" />}
                            accent="bg-emerald-50 text-emerald-700"
                        />
                        <StatCard
                            title="Rejected Requests"
                            value={stats.rejected}
                            description="Requests needing updates"
                            icon={<CloseCircleOutlined className="text-lg" />}
                            accent="bg-rose-50 text-rose-700"
                        />
                    </>
                ) : null}
            </section>

            {/* Suggested & Support */}
            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)] sm:p-8 text-left">
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
                            <div
                                key={place.name}
                                className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors duration-200 hover:border-slate-300"
                            >
                                <div
                                    className="h-28 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${place.image})` }}
                                />
                                <div className="p-4">
                                    <p className="font-medium text-slate-800">{place.name}</p>
                                    <p className="mt-1 text-xs text-slate-500">{place.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)] sm:p-8 text-left">
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
                                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-100"
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
