"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call for presentation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      addToast("success", "If an account with that email exists, we have sent a password reset link.");
      setEmail("");
    } catch (error) {
      console.error("Password reset error:", error);
      addToast("error", "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-stretch bg-white">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2">
        {/* Left side - Forgot Password Form */}
        <section className="flex items-center justify-center p-8 lg:p-16 bg-[#F5F2EB]">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="font-serif text-4xl text-slate-900">Reset Password</h1>
                <p className="text-sm text-slate-500">Enter your email to receive a password reset link.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent border border-slate-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  &larr; Back to Login
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Right side - Mountain/Landscape Image */}
        <section className="hidden lg:flex relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-[#F5F2EB] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-0">
            <Image
              src="/images/sigiriya.png"
              alt="Mountain landscape"
              fill
              className="object-cover"
              priority
            />
          </div>
        </section>
      </div>
    </main>
  );
}
