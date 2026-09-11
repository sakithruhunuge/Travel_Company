"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/context/ToastContext";
import { useLocale } from "next-intl";

export default function ProfileDropdown() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const { addToast } = useToast();
    const locale = useLocale();

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
            window.location.href = `/${locale}`;
        } catch {
            addToast("error", "Could not sign out. Please try again.");
        }
    };

    if (!session) return null;

    const userName = session.user?.name || "User";

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                }}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full hover:bg-white/40 transition-all duration-300 ease-in-out cursor-pointer border border-transparent hover:border-slate-200"
                title={userName}
            >
                {session.user?.image ? (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-300 shrink-0">
                        <Image src={session.user.image} alt={userName} fill className="object-cover" sizes="32px" referrerPolicy="no-referrer" />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {userName.slice(0, 1).toUpperCase()}
                    </div>
                )}
                <div className="text-left hidden sm:block overflow-hidden">
                    <div className="text-xs sm:text-sm font-bold text-slate-900 leading-none truncate max-w-[100px] md:max-w-[130px] lg:max-w-[150px]">
                        {userName}
                    </div>
                </div>
            </button>

            {open && (
                <div role="menu" aria-label="Profile options" className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up z-50">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="text-sm font-bold text-slate-900 break-words">{userName}</div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">{session.user?.email}</div>
                    </div>
                    <div className="flex flex-col py-1.5 text-xs font-semibold text-slate-700">
                        <Link href={`/${locale}/dashboard`} onClick={() => setOpen(false)} className="px-4 py-2 hover:bg-amber-50 hover:text-slate-900 transition-colors">Dashboard</Link>
                        <Link href={`/${locale}/dashboard/profile`} onClick={() => setOpen(false)} className="px-4 py-2 hover:bg-amber-50 hover:text-slate-900 transition-colors">Profile</Link>
                        <button onClick={handleSignOut} className="text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-100 mt-1 pt-2">Sign Out</button>
                    </div>
                </div>
            )}
        </div>
    );
}
