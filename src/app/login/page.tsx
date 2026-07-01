"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import GoogleButton from "@/components/GoogleButton";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Automatically redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-sky-400 via-sky-50 to-indigo-100 px-4 sm:px-6 lg:px-8 relative overflow-hidden py-12">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-white/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md p-10 rounded-3xl border border-white/20 shadow-2xl relative z-10 transition-all duration-300 hover:shadow-brand-primary/5">
        {status === "authenticated" ? (
          // Authenticated State View
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

            {/* Profile Detail Card */}
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

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push("/")}
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/95 text-white font-extrabold rounded-xl hover:shadow-lg hover:shadow-brand-primary/20 transition-all duration-200"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => signOut()}
                className="w-full py-4 bg-white border border-slate-200 hover:border-slate-300 text-rose-600 hover:bg-slate-50 font-bold rounded-xl transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          // Unauthenticated Hybrid Login Card View
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

            {/* Credentials Login Form */}
            <LoginForm />

            {/* Visual Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Google OAuth Login Trigger */}
            <GoogleButton />

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400 font-medium">
                Protected and encrypted hybrid authentication system.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
