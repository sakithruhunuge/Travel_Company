"use client";

import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SignupForm from "@/components/SignupForm";

function SignupContent() {
    const { status } = useSession();
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
                <div className="hidden md:flex flex-col justify-center rounded-3xl overflow-hidden shadow-2xl">
                    <div className="relative h-full w-full bg-gradient-to-br from-sky-400 to-indigo-100 p-12 flex items-center">
                        <div className="max-w-lg text-white">
                            <h1 className="text-4xl font-extrabold leading-tight">Start Your Journey</h1>
                            <p className="mt-4 text-sm opacity-90">Create your free account and begin planning personalized tours with local experts.</p>
                            <div className="mt-6">
                                <Image src="/images/hero_bg.png" alt="Travel" width={720} height={520} className="rounded-2xl shadow-lg w-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center">
                    <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-md p-10 rounded-3xl border border-white/20 shadow-2xl relative z-10">
                        <div className="text-center space-y-2">
                            <span className="text-2xl font-black tracking-tight text-brand-dark">
                                HORIZON<span className="text-brand-primary">TRAVEL</span>
                            </span>
                            <h2 className="text-3xl font-black text-slate-950 tracking-tight pt-2">
                                Create your account
                            </h2>
                            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                                Join TravelMate to plan your next adventure.
                            </p>
                        </div>

                        <SignupForm />

                        <div className="text-center pt-2">
                            <p className="text-sm text-slate-500">
                                Already have an account?{' '}
                                <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}${restoreForm ? "&restoreForm=true" : ""}`} className="font-semibold text-brand-primary hover:text-brand-primary/90">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <svg className="animate-spin h-10 w-10 text-brand-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-semibold text-slate-500">Loading...</p>
                </div>
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
}
