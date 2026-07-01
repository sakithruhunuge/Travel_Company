"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { sriLankaPackages } from "@/data/packages";
import Link from "next/link";

export default function TravelRequestForm() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    packageName: "",
    packageId: "",
    numberOfTravelers: 1,
    preferredStartDate: "",
    specialRequests: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "packageName") {
      const selectedPkg = sriLankaPackages.find((pkg) => pkg.name === value);
      setFormData((prev) => ({
        ...prev,
        packageName: value,
        packageId: selectedPkg ? selectedPkg.id : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "numberOfTravelers" ? Number(value) : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionStatus !== "authenticated") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/travel-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit request.");
      }

      setStatus("success");
      setFormData({
        packageName: "",
        packageId: "",
        numberOfTravelers: 1,
        preferredStartDate: "",
        specialRequests: "",
      });

      // Redirect after a short delay to the requests dashboard
      setTimeout(() => {
        router.push("/my-requests");
      }, 3000);

    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to submit request.";
      setStatus("error");
      setErrorMessage(msg);
    }
  };

  const isAuthenticated = sessionStatus === "authenticated";

  return (
    <section id="plan-trip" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Plan Your Vacation
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-dark tracking-tight">
            Customize Your Sri Lanka Journey
          </h2>
          <p className="text-base text-slate-500">
            Tell us about your travel plans and our local experts will craft a personalized itinerary specifically for you.
          </p>
        </div>

        <div className="bg-slate-50 p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-sm w-full">
          {status === "success" ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-brand-dark">Request Submitted Successfully!</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your travel request has been received. Redirecting you to your requests dashboard...
              </p>
              <div className="pt-4">
                <Link
                  href="/my-requests"
                  className="px-6 py-3 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition-colors"
                >
                  View My Requests Now
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {status === "error" && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {errorMessage}
                </div>
              )}

              {/* Authentication Guard Warning Overlay */}
              {!isAuthenticated && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-left space-y-4 mb-6">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-bold text-amber-800">Please sign in to submit your travel request.</h4>
                      <p className="text-xs text-amber-700 mt-1">To ensure your custom itineraries are saved securely, you must have an authenticated user account.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => signIn("google")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      Sign in with Google
                    </button>
                    <Link
                      href="/login"
                      className="inline-flex items-center px-4 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-primary/95 transition-colors cursor-pointer"
                    >
                      Login with Email
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="packageName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Select Package
                  </label>
                  <select
                    id="packageName"
                    name="packageName"
                    required
                    disabled={!isAuthenticated}
                    value={formData.packageName}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose a Package...</option>
                    {sriLankaPackages.map((pkg) => (
                      <option key={pkg.id} value={pkg.name}>
                        {pkg.name} ({pkg.duration})
                      </option>
                    ))}
                    <option value="Custom Sri Lanka Tour">Customized Tailor-Made Tour</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="numberOfTravelers" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Number of Travelers
                  </label>
                  <input
                    id="numberOfTravelers"
                    type="number"
                    name="numberOfTravelers"
                    required
                    min={1}
                    disabled={!isAuthenticated}
                    value={formData.numberOfTravelers}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="preferredStartDate" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Preferred Start Date
                  </label>
                  <input
                    id="preferredStartDate"
                    type="date"
                    name="preferredStartDate"
                    required
                    disabled={!isAuthenticated}
                    value={formData.preferredStartDate}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col justify-end text-left">
                  {/* Informational context if user is signed in */}
                  {isAuthenticated && session?.user && (
                    <div className="bg-slate-100/85 px-4 py-2.5 rounded-xl border border-slate-200/50">
                      <span className="block text-xxs font-bold text-slate-400 uppercase tracking-wider">Submitting As</span>
                      <span className="block text-xs font-bold text-slate-700 mt-0.5 truncate">{session.user.name} ({session.user.email})</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="specialRequests" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Special Requests / Notes
                </label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  rows={4}
                  disabled={!isAuthenticated}
                  value={formData.specialRequests}
                  onChange={handleChange}
                  placeholder="E.g., dietary preferences, specific hotel categories, interests (surfing, hiking), flight detail notes..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={status === "loading" || !isAuthenticated}
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold rounded-xl hover:shadow-lg hover:shadow-brand-primary/25 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {status === "loading" ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Travel Request...
                  </>
                ) : (
                  "Submit Travel Request"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
