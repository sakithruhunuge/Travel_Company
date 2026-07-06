"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import StatCard from "@/components/dashboard/StatCard";
import LoadingSkeleton from "@/components/dashboard/LoadingSkeleton";
import EmptyState from "@/components/dashboard/EmptyState";
import SettingsCard from "@/components/dashboard/SettingsCard";
import Link from "next/link";
import { signOut } from "next-auth/react";

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
        <div className="space-y-10">
            {/* Welcome Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-brand-dark text-white p-8 md:p-10 lg:p-12 shadow-xl">
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-brand-primary/20 to-orange-400/0 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-amber-400/10 to-brand-primary/0 blur-2xl pointer-events-none" />

                <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-center">
                    <div className="space-y-6 text-left">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-primary border border-brand-primary/20">
                            Sri Lanka Curated Journeys
                        </span>
                        <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl tracking-tight">
                            Welcome back, <span className="text-brand-primary">{session?.user?.name || "Traveler"}</span>
                        </h2>
                        <p className="max-w-2xl text-base leading-relaxed text-brand-light/80 font-medium">
                            Manage your Sri Lanka travel plans, requests, and preferences from one secure and
                            beautiful dashboard.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link
                                href="/dashboard/my-requests"
                                className="rounded-xl bg-brand-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                            >
                                View Requests
                            </Link>
                            <Link
                                href="/dashboard/profile"
                                className="rounded-xl border border-brand-light/70 bg-brand-dark/80 px-6 py-3.5 text-sm font-bold text-brand-light hover:bg-brand-dark/90 hover:border-brand-dark/70 transition-all duration-200"
                            >
                                Update Profile
                            </Link>
                        </div>
                    </div>
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-brand-dark/50">
                        <div className="relative h-44 w-full rounded-2xl bg-cover bg-center shadow-inner" style={{ backgroundImage: "linear-gradient(180deg, rgba(34,34,34,0.12), rgba(34,34,34,0.85)), url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80')" }}>
                            <div className="absolute inset-0 flex flex-col justify-end p-6 text-left">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Travel tip</p>
                                <p className="mt-1.5 text-sm font-semibold text-white leading-relaxed">The best time to visit Sri Lanka is December–April for sunny beaches and lush hill country.</p>
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
                        <StatCard
                            title="Total Requests"
                            value={stats.total}
                            description="All travel requests"
                            imageUrl="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80"
                        />
                        <StatCard
                            title="Pending"
                            value={stats.pending}
                            description="Awaiting review"
                            imageUrl="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80"
                        />
                        <StatCard
                            title="Approved"
                            value={stats.approved}
                            description="Confirmed trips"
                            imageUrl="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80"
                        />
                        <StatCard
                            title="Rejected"
                            value={stats.rejected}
                            description="Needs attention"
                            imageUrl="https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?auto=format&fit=crop&w=400&q=80"
                        />
                    </>
                ) : null}
            </section>

            {/* Suggested & Support */}
            <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-brand-light/70 sm:p-8 text-left">
                    <div>
                        <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-muted">
                            Recommendations
                        </span>
                        <h3 className="mt-3.5 text-xl font-bold text-brand-dark tracking-tight">
                            Suggested Sri Lanka destinations
                        </h3>
                        <p className="mt-1 text-sm font-medium text-brand-muted">
                            Our team recommends these iconic places for your next escape.
                        </p>
                    </div>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
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
                            <div key={place.name} className="group overflow-hidden rounded-2xl bg-brand-light border border-brand-light/70 hover:border-brand-primary/20 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                                <div className="h-32 w-full overflow-hidden">
                                    <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${place.image})` }} />
                                </div>
                                <div className="p-4">
                                    <p className="font-bold text-brand-dark group-hover:text-brand-primary transition-colors">{place.name}</p>
                                    <p className="mt-1 text-xs font-semibold text-brand-muted">{place.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col rounded-3xl bg-brand-dark text-white p-6 shadow-xl sm:p-8 text-left border border-brand-dark/70 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-brand-primary/10 blur-2xl pointer-events-none" />

                    <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary border border-brand-primary/20 self-start">
                        Support
                    </span>
                    <h3 className="mt-4 text-xl font-bold text-white tracking-tight">Need help planning?</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-light/70 font-medium">
                        Our Ceylon travel specialists can tailor the itinerary around your preferences and schedule.
                    </p>
                    <div className="mt-6 flex-grow space-y-3 relative z-10">
                        {[
                            "Best beaches and surf spots",
                            "Scenic train routes and tea country",
                            "Wildlife safaris and cultural heritage",
                        ].map((tip) => (
                            <div
                                key={tip}
                                className="flex items-center gap-3.5 rounded-xl bg-brand-dark/40 hover:bg-brand-dark/80 border border-brand-dark/70 p-4 text-xs font-bold text-white transition-all hover:translate-x-1"
                            >
                                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-primary shadow-md shadow-brand-primary/50" />
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
                        <p className="text-sm font-medium text-brand-muted">
                            {session?.user?.name
                                ? `Signed in as ${session.user.name}`
                                : "Signed in to your Horizon Travel account."}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                            <Link
                                href="/dashboard/settings"
                                className="rounded-xl bg-brand-dark px-5 py-3 text-xs font-bold text-white transition-colors duration-200 hover:bg-brand-dark/90 shadow-md"
                            >
                                Open Full Settings
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="rounded-xl border border-brand-light/70 bg-white px-5 py-3 text-xs font-bold text-brand-dark transition-colors duration-200 hover:bg-brand-light hover:border-brand-light/70"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard title="Account status" description="See how your dashboard account is connected.">
                    <div className="space-y-4 text-sm text-brand-muted text-left">
                        <div className="rounded-xl border border-brand-light/70 bg-brand-light p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Sign-in method</p>
                            <p className="mt-1 font-bold text-brand-dark">
                                {(session?.user as { provider?: string } | undefined)?.provider === "google"
                                    ? "Google Account Connection"
                                    : "Email & Password Secure Login"}
                            </p>
                        </div>
                        <p className="text-xs font-medium text-brand-muted">
                            Use the full settings page for password changes and other account actions.
                        </p>
                    </div>
                </SettingsCard>
            </section>
        </div>
    );
}


