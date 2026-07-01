"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
    const { status } = useSession();
    const router = useRouter();

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
            <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />

            <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md p-10 rounded-3xl border border-white/20 shadow-2xl relative z-10">
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
                        <Link href="/login" className="font-semibold text-brand-primary hover:text-brand-primary/90">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
