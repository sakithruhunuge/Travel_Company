"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/context/ToastContext";

export default function ProfileDropdown() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        function onDoc(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut({ redirect: false });
            addToast("info", "Signed out");
            // reload will be handled by parent navigation if needed
            window.location.href = "/";
        } catch {
            addToast("error", "Could not sign out. Please try again.");
        }
    };

    if (!session) return null;

    return (
        <div ref={ref} className="relative">
            <button
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
                {session.user?.image ? (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200">
                        <Image src={session.user.image} alt={session.user.name || "Avatar"} fill className="object-cover" sizes="36px" referrerPolicy="no-referrer" />
                    </div>
                ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold">{(session.user?.name || "").slice(0, 1)}</div>
                )}
                <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-800 leading-none">{session.user?.name}</div>
                    <div className="text-xxs text-slate-500">Account</div>
                </div>
            </button>

            {open && (
                <div role="menu" aria-label="Profile options" className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-lg overflow-hidden animate-fade-in-up z-50">
                    <div className="p-3 border-b border-slate-100">
                        <div className="text-sm font-bold text-slate-800">{session.user?.name}</div>
                        <div className="text-xxs text-slate-500 truncate">{session.user?.email}</div>
                    </div>
                    <div className="flex flex-col py-2">
                        <Link href="/dashboard" className="px-4 py-2 text-sm hover:bg-slate-50">Dashboard</Link>
                        <Link href="/dashboard/profile" className="px-4 py-2 text-sm hover:bg-slate-50">Profile</Link>
                        <button onClick={handleSignOut} className="text-left px-4 py-2 text-sm hover:bg-slate-50">Sign Out</button>
                    </div>
                </div>
            )}
        </div>
    );
}
