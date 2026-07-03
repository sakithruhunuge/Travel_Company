"use client";

import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import GoogleButton from "@/components/GoogleButton";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const restoreForm = searchParams.get("restoreForm") === "true";

  let callbackUrl = searchParams.get("callbackUrl") || (restoreForm ? "/plan-trip" : "/dashboard");
  if (restoreForm && (callbackUrl === "/dashboard" || callbackUrl === "/login" || callbackUrl === "/signup")) {
    callbackUrl = "/plan-trip";
  }

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-sky-100 via-slate-50 to-indigo-50">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-brand-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-semibold text-slate-500">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 py-12">
        <section className="hidden md:flex flex-col justify-center rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative h-full w-full bg-gradient-to-br from-sky-400 to-indigo-100 p-12 flex items-center">
            <div className="max-w-lg text-white">
              <h1 className="text-4xl font-extrabold leading-tight">Discover Sri Lanka</h1>
              <p className="mt-4 text-sm opacity-90">Handcrafted tours, local advisors, and unforgettable experiences tailored for you.</p>
              <div className="mt-6 rounded-3xl overflow-hidden shadow-lg ring-1 ring-white/10">
                <Image src="/images/hero_bg.png" alt="Travel illustration" width={720} height={520} className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-md p-10 rounded-3xl border border-white/20 shadow-2xl relative z-10">
            {status === "authenticated" ? (
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto text-brand-primary">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Already Signed In</h2>
                  <p className="text-sm text-slate-500">You have an active secure session.</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 text-left">
                  {session.user?.image ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-200">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User image"}
                        fill
                        className="object-cover"
                        sizes="48px"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-slate-200 flex items-center justify-center font-bold text-brand-primary uppercase text-lg">
                      {session.user?.name ? session.user.name[0] : "U"}
                    </div>
                  )}
                  <div>
                    <span className="block text-sm font-bold text-slate-900 leading-tight">{session.user?.name}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{session.user?.email}</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push(callbackUrl)}
                  className="w-full py-4 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold rounded-xl hover:shadow-lg hover:shadow-brand-primary/20 transition-all duration-200"
                >
                  Proceed
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <span className="text-2xl font-black tracking-tight text-brand-dark">
                    HORIZON<span className="text-brand-primary">TRAVEL</span>
                  </span>
                  <h2 className="text-3xl font-black text-slate-950 tracking-tight pt-2">
                    Welcome to TravelMate
                  </h2>
                  <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                    Sign in to book your travel experiences
                  </p>
                </div>

                <LoginForm />

                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <GoogleButton />

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400 font-medium">
                    Protected and encrypted hybrid authentication system.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <svg className="animate-spin h-10 w-10 text-brand-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-semibold text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
