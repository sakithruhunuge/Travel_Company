"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import SettingsCard from "@/components/dashboard/SettingsCard";

type SessionUser = {
    provider?: string;
};

const inputClassName =
    "w-full rounded-lg border border-brand-light/70 bg-brand-light/50 px-4 py-2.5 text-sm text-brand-dark transition-colors duration-200 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20";

export default function SettingsPage() {
    const { data: session } = useSession();
    const provider = (session?.user as SessionUser | undefined)?.provider || "credentials";
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState("");

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/user/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not update password");
            setMessage("Password updated successfully.");
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <SettingsCard title="Security" description="Manage your account security settings.">
                {provider === "google" ? (
                    <p className="text-sm text-brand-muted">Password is managed through your Google account.</p>
                ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-brand-muted">
                                New password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClassName}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-brand-muted">
                                Confirm password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputClassName}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-light/40"
                        >
                            {loading ? "Updating..." : "Change password"}
                        </button>
                        {message ? <p className="text-sm font-medium text-brand-secondary">{message}</p> : null}
                        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
                    </form>
                )}
            </SettingsCard>

            <SettingsCard title="Session" description="Sign out of your current dashboard session.">
                <button
                    onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                    className="rounded-lg border border-brand-light/70 px-5 py-2.5 text-sm font-medium text-brand-dark transition-colors duration-200 hover:bg-brand-light"
                >
                    Logout
                </button>
            </SettingsCard>

            <SettingsCard title="Delete account" description="This action is irreversible and removes your account and travel requests.">
                <div className="space-y-3">
                    <input
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className={inputClassName}
                    />
                    <button className="rounded-lg border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700 transition-colors duration-200 hover:bg-rose-100">
                        Delete account
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
}
