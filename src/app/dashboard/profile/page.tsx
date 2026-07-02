"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ProfileCard from "@/components/dashboard/ProfileCard";
import SettingsCard from "@/components/dashboard/SettingsCard";

type SessionUser = {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string;
    createdAt?: string | null;
};

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [name, setName] = useState("");
    const [image, setImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user) {
            const user = session.user as SessionUser;
            setName(user.name || "");
            setImage(user.image || "");
        }
    }, [session]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, image }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update profile");
            await update();
            setMessage("Profile updated successfully.");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <ProfileCard name={session?.user?.name || "Traveler"} email={session?.user?.email || ""} image={(session?.user as SessionUser | undefined)?.image || null} provider={(session?.user as SessionUser | undefined)?.provider || "credentials"} createdAt={(session?.user as SessionUser | undefined)?.createdAt || new Date().toISOString()} />

            <form onSubmit={handleUpdateProfile} className="space-y-6">
                <SettingsCard title="Profile details" description="Update your public profile information.">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                            <input value={session?.user?.email || ""} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Profile photo URL</label>
                            <input value={image} onChange={(e) => setImage(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="https://..." />
                        </div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <button type="submit" disabled={loading} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                            {loading ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                    {message ? <p className="mt-4 text-sm font-medium text-emerald-600">{message}</p> : null}
                    {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
                </SettingsCard>
            </form>
        </div>
    );
}
