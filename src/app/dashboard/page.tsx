"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import StatsOverviewCard from "@/components/dashboard/StatsOverviewCard";
import EmptyState from "@/components/dashboard/EmptyState";
import SettingsCard from "@/components/dashboard/SettingsCard";
import { useTenant } from "@/context/TenantBrandingContext";

export default function DashboardHomePage() {
  const { data: session } = useSession();
  const tenant = useTenant();
  const [stats, setStats] = useState<{ total: number; pending: number; approved: number; rejected: number } | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load statistics
        const statsRes = await fetch("/api/dashboard/stats");
        const statsData = await statsRes.json();
        if (!statsRes.ok) throw new Error(statsData.error || "Failed to load stats");
        setStats(statsData.stats);

        // Load travel requests (if Tenant Admin, we can show a list of recent items)
        const requestsRes = await fetch("/api/travel-requests");
        if (requestsRes.ok) {
          const reqsData = await requestsRes.json();
          setRecentRequests(reqsData.requests?.slice(0, 5) || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userRole]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/travel-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Refresh local stats & requests list
        const statsRes = await fetch("/api/dashboard/stats");
        const statsData = await statsRes.json();
        if (statsRes.ok) setStats(statsData.stats);

        const requestsRes = await fetch("/api/travel-requests");
        if (requestsRes.ok) {
          const reqsData = await requestsRes.json();
          setRecentRequests(reqsData.requests?.slice(0, 5) || []);
        }
      }
    } catch (err) {
      console.error("Failed to update travel request status:", err);
    }
  };

  // -------------------------------------------------------------
  // TENANT ADMIN VIEW
  // -------------------------------------------------------------
  if (userRole === "tenant_admin") {
    return (
      <div className="space-y-10 text-left">
        {/* Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-white/45 backdrop-blur-md border border-white/30 text-slate-800 p-8 md:p-10 lg:p-12 shadow-sm">
          <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-200/35 to-blue-300/0 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-cyan-200/15 to-cyan-300/0 blur-2xl pointer-events-none" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-650 border border-white/50 shadow-sm">
                Tenant Portal Controls
              </span>
              <h2 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl tracking-tight">
                Organization Hub
              </h2>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 font-medium font-sans">
                Manage travel packages, review booking requests, update company branding, and analyze user statistics.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/dashboard/requests"
                  className="rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Manage Bookings
                </Link>
                <Link
                  href="/dashboard/packages"
                  className="rounded-xl border border-white/50 bg-white/40 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-white/60 hover:border-white/70 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Customize Packages
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-white/30 p-6 bg-slate-900 text-slate-100 flex flex-col justify-between h-44">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Branding customization</p>
                <p className="mt-2 text-sm font-semibold text-slate-350 leading-relaxed">
                  Make your booking portal uniquely yours. Customize layout colors, taglines, and upload your official logo.
                </p>
              </div>
              <Link href="/dashboard/branding" className="text-xs font-black text-cyan-400 hover:text-cyan-300 self-start mt-2">
                Configure Brand Options &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Statistics Panels */}
        <section className="w-full">
          {loading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-white/40 backdrop-blur-sm border border-slate-200" />
          ) : error ? (
            <EmptyState title="Unable to load dashboard stats" description={error} />
          ) : stats ? (
            <StatsOverviewCard stats={stats} />
          ) : null}
        </section>

        {/* Recent Requests Approval list */}
        <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl bg-white/45 backdrop-blur-md p-6 border border-slate-200 sm:p-8 shadow-sm">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/60 border border-white/40 px-3 py-1 text-xs font-semibold text-brand-muted">
                Approvals Inbox
              </span>
              <h3 className="mt-3.5 text-xl font-bold text-slate-900 tracking-tight">
                Recent travel requests
              </h3>
              <p className="mt-1 text-sm font-medium text-brand-muted">
                Review and update status coordinates of newly submitted travel bookings.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {recentRequests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-semibold">No recent bookings submitted.</div>
              ) : (
                recentRequests.map((req) => (
                  <div
                    key={req._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/30 border border-white/40 hover:bg-white/50 transition"
                  >
                    <div>
                      <span className="text-[10px] font-black uppercase text-brand-secondary">
                        {req.packageName}
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-base mt-1">
                        Request ID: {req._id.substring(req._id.length - 8).toUpperCase()}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        Travelers: {req.numberOfTravelers} | Date: {new Date(req.preferredStartDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase mr-2 ${
                          req.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : req.status === "rejected" || req.status === "cancelled"
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {req.status}
                      </span>

                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(req._id, "approved")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req._id, "rejected")}
                            className="px-3 py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick links settings card */}
          <div className="flex flex-col rounded-3xl bg-white/40 backdrop-blur-md p-6 sm:p-8 border border-slate-200 relative overflow-hidden">
            <span className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-650 border border-white/50 self-start">
              Actions
            </span>
            <h3 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">Quick Operations</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
              Administrative functions mapped directly for rapid portal management.
            </p>
            <div className="mt-6 flex-grow space-y-3 relative z-10">
              <Link
                href="/dashboard/branding"
                className="flex items-center gap-3.5 rounded-xl bg-white/30 hover:bg-white/50 border border-white/20 p-4 text-xs font-bold text-slate-700 transition hover:translate-x-1"
              >
                🎨 Change Theme Colors
              </Link>
              <Link
                href="/dashboard/users"
                className="flex items-center gap-3.5 rounded-xl bg-white/30 hover:bg-white/50 border border-white/20 p-4 text-xs font-bold text-slate-700 transition hover:translate-x-1"
              >
                👥 View Customer Registry
              </Link>
              <Link
                href="/dashboard/analytics"
                className="flex items-center gap-3.5 rounded-xl bg-white/30 hover:bg-white/50 border border-white/20 p-4 text-xs font-bold text-slate-700 transition hover:translate-x-1"
              >
                📊 Run Performance Report
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CUSTOMER VIEW (Keep original client-side codes)
  // -------------------------------------------------------------
  return (
    <div className="space-y-10 text-left">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-white/45 backdrop-blur-md border border-white/30 text-slate-800 p-8 md:p-10 lg:p-12 shadow-sm">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-orange-200/35 to-orange-300/0 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-orange-200/15 to-orange-300/0 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 border border-white/50 shadow-sm">
              Sri Lanka Curated Journeys
            </span>
            <h2 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl tracking-tight">
              Welcome back, <span className="text-slate-800 font-extrabold">{session?.user?.name || "Traveler"}</span>
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 font-medium">
              Manage your Sri Lanka travel plans, requests, and preferences from one secure and beautiful dashboard.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/dashboard/my-requests"
                className="rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                View Requests
              </Link>
              <Link
                href="/dashboard/profile"
                className="rounded-xl border border-white/50 bg-white/40 px-6 py-3.5 text-sm font-bold text-slate-700 hover:bg-white/60 hover:border-white/70 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Update Profile
              </Link>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl border border-white/30">
            <div
              className="relative h-44 w-full rounded-2xl bg-cover bg-center shadow-inner"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(34,34,34,0.12), rgba(34,34,34,0.85)), url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80')",
              }}
            >
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-350">Travel tip</p>
                <p className="mt-1.5 text-sm font-semibold text-white leading-relaxed">
                  The best time to visit Sri Lanka is December–April for sunny beaches and lush hill country.
                </p>
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
          <EmptyState title="Unable to load dashboard stats" description={error} />
        ) : stats ? (
          <StatsOverviewCard stats={stats} />
        ) : null}
      </section>

      {/* Suggested & Support */}
      <section className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl bg-white/40 backdrop-blur-md p-6 border border-slate-200 sm:p-8">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/60 border border-white/40 px-3 py-1 text-xs font-semibold text-brand-muted">
              Recommendations
            </span>
            <h3 className="mt-3.5 text-xl font-bold text-slate-900 tracking-tight">Suggested Sri Lanka destinations</h3>
            <p className="mt-1 text-sm font-medium text-brand-muted">
              Our team recommends these iconic places for your next escape.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { name: "Sigiriya Rock", desc: "Unearth ancient royal ruins", image: "/images/sigiriya.png" },
              { name: "Ella Train Journey", desc: "Ride the world's most scenic rails", image: "/images/nine_arch.png" },
              { name: "Nuwara Eliya Hills", desc: "Mist-covered tea estates & falls", image: "/images/tea.png" },
              { name: "Mirissa Coastline", desc: "Surf breaks & whale watching", image: "/images/mirissa.png" },
            ].map((place) => (
              <div
                key={place.name}
                className="group overflow-hidden rounded-2xl bg-white/20 border border-slate-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-32 w-full overflow-hidden">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${place.image})` }}
                  />
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-850 group-hover:text-slate-900 transition-colors">{place.name}</p>
                  <p className="mt-1 text-xs font-semibold text-brand-muted">{place.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-3xl bg-white/40 backdrop-blur-md text-slate-800 p-6 sm:p-8 border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-slate-700/10 blur-2xl pointer-events-none" />
          <span className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-slate-650 border border-white/50 self-start">
            Support
          </span>
          <h3 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">Need help planning?</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 font-medium">
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
        <SettingsCard title="Quick settings" description="Access your account controls from the main dashboard.">
          <div className="space-y-4">
            <p className="text-sm font-medium text-brand-muted">
              {session?.user?.name
                ? `Signed in as ${session.user.name}`
                : `Signed in to your ${tenant?.name || "Ceylon Travel"} account.`}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/dashboard/settings"
                className="rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white transition-colors duration-200 hover:bg-slate-850 shadow-md"
              >
                Open Full Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                className="rounded-xl border border-white/40 bg-white/20 px-5 py-3 text-xs font-bold text-slate-700 transition-colors duration-200 hover:bg-white/60 hover:border-white/50 backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Account status" description="See how your dashboard account is connected.">
          <div className="space-y-4 text-sm text-brand-muted">
            <div className="rounded-xl border border-white/30 bg-white/25 backdrop-blur-sm p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Sign-in method</p>
              <p className="mt-1 font-bold text-slate-800">
                {(session?.user as any)?.provider === "google" ? "Google OAuth Login" : "Email & Password Credential"}
              </p>
            </div>
          </div>
        </SettingsCard>
      </section>
    </div>
  );
}
