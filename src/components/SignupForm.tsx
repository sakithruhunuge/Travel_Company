"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function SignupForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // Validation errors state
    const [errors, setErrors] = useState<{name?: string; email?: string; password?: string; confirmPassword?: string}>({});
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawCallback = searchParams.get("callbackUrl");
    const restoreForm = searchParams.get("restoreForm") === "true";
    const { addToast } = useToast();
    const DEFAULT_FORM_URL = "/plan-trip";
    const DEFAULT_FALLBACK = "/dashboard";

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- Client-Side Validation ---
        const newErrors: {name?: string; email?: string; password?: string; confirmPassword?: string} = {};
        
        // Name validation
        if (!/^[a-zA-Z\s]+$/.test(name)) {
            newErrors.name = "Name can only contain letters and spaces.";
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            newErrors.email = "Please enter a valid email address.";
        }
        
        // Password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            newErrors.password = "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        }
        
        // Confirm Password validation
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);

        // Prevent submission if errors exist
        if (Object.keys(newErrors).length > 0) {
            return;
        }
        // ------------------------------

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Unable to create your account right now.");
                setIsLoading(false);
                return;
            }

            setSuccess("Account created successfully. Signing you in...");

            const signInResponse = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (signInResponse?.error) {
                setError("Account created, but we could not sign you in automatically.");
                setIsLoading(false);
                router.push("/login");
            } else {
                let callbackUrl = rawCallback || null;
                if (restoreForm && (!callbackUrl || callbackUrl === "/dashboard" || callbackUrl === "/login" || callbackUrl === "/signup")) {
                    callbackUrl = DEFAULT_FORM_URL;
                }
                const targetUrl = callbackUrl || DEFAULT_FALLBACK;
                router.push(targetUrl);
                router.refresh();
            }
        } catch {
            addToast("error", "An unexpected error occurred. Please try again.");
            setError("An unexpected error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSignup} className="space-y-4 text-left">
            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-600 text-xs font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {success}
                </div>
            )}

            <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Full Name
                </label>
                <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    placeholder="John Doe"
                    className={`w-full bg-transparent border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-slate-900'} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-slate-900 transition-all placeholder:text-slate-400`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                    Email Address
                </label>
                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="name@example.com"
                    className={`w-full bg-transparent border ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-slate-900'} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-slate-900 transition-all placeholder:text-slate-400`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    placeholder="••••••••"
                    className={`w-full bg-transparent border ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-slate-900'} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-slate-900 transition-all placeholder:text-slate-400`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                    Confirm Password
                </label>
                <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    placeholder="••••••••"
                    className={`w-full bg-transparent border ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-slate-900'} rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:border-slate-900 transition-all placeholder:text-slate-400`}
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                    </>
                ) : (
                    "Create Account"
                )}
            </button>
        </form>
    );
}
