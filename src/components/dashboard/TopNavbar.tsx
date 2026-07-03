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
        <header className="flex items-center justify-between rounded-[32px] border border-slate-200/65 bg-white/60 px-4 py-4 shadow-sm backdrop-blur-md md:px-6">
            <div>
                <h1 className="text-xl font-black text-brand-dark tracking-tight">{title}</h1>
                {subtitle ? <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p> : null}
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 rounded-full border border-slate-200/60 bg-slate-50/60 px-3 py-1.5 sm:flex">
                    {user?.image ? (
                        <div className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-100 shadow-sm">
                            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" sizes="36px" />
                        </div>
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-secondary/15 font-bold text-brand-secondary">
                            {user?.name?.[0]?.toUpperCase() || "T"}
                        </div>
                    )}
                    <div className="text-left pr-2">
                        <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name || "Traveler"}</p>
                        <p className="text-[10px] font-semibold text-slate-500">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="rounded-full bg-brand-secondary hover:bg-brand-secondary/90 hover:shadow-lg hover:shadow-brand-secondary/10 px-5 py-2 text-sm font-bold text-white transition-all duration-350"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}
