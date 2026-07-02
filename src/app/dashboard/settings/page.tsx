"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import SettingsCard from "@/components/dashboard/SettingsCard";

type SessionUser = {
    provider?: string;
};

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
                    <p className="text-sm text-slate-600">Password is managed through your Google account.</p>
                ) : (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">New password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm password</label>
                            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                        </div>
                        <button type="submit" disabled={loading} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                            {loading ? "Updating..." : "Change password"}
                        </button>
                        {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}
                        {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
                    </form>
                )}
            </SettingsCard>

            <SettingsCard title="Session" description="Sign out of your current dashboard session.">
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600">
                    Logout
                </button>
            </SettingsCard>

            <SettingsCard title="Delete account" description="This action is irreversible and removes your account and travel requests.">
                <div className="space-y-3">
                    <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type DELETE to confirm" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                    <button className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100">
                        Delete account
                    </button>
                </div>
            </SettingsCard>
        </div>
    );
}
