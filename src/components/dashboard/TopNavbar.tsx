"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

type TopNavbarProps = {
    title: string;
    subtitle?: string;
};

export default function TopNavbar({ title, subtitle }: TopNavbarProps) {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <header className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur md:px-6">
            <div>
                <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
            </div>

            <div className="flex items-center gap-3">
                <button className="rounded-full border border-slate-200 bg-slate-50 p-3 text-slate-600 transition hover:bg-slate-100">
                    🔔
                </button>

                <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
                    {user?.image ? (
                        <div className="relative h-9 w-9 overflow-hidden rounded-full">
                            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" sizes="36px" />
                        </div>
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700">
                            {user?.name?.[0] || "U"}
                        </div>
                    )}
                    <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900">{user?.name || "Traveler"}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
