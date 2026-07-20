"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { LogoutOutlined, SearchOutlined, BellOutlined } from "@ant-design/icons";

type TopNavbarProps = {
    title: string;
    subtitle?: string;
};

export default function TopNavbar({ title, subtitle }: TopNavbarProps) {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/20 bg-white/35 backdrop-blur-lg px-6 py-4 md:px-8 shadow-sm">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 md:text-2xl">{title}</h1>
                {subtitle ? <p className="mt-0.5 text-xs font-semibold text-slate-500">{subtitle}</p> : null}
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center rounded-xl bg-white/40 border border-white/30 px-3.5 py-2 transition-all duration-200 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-white/20 focus-within:bg-white/60">
                    <SearchOutlined className="text-slate-500 text-base" />
                    <input
                        placeholder="Search requests, destinations..."
                        className="ml-2 w-64 bg-transparent text-sm placeholder:text-slate-450 text-slate-850 focus:outline-none"
                    />
                </div>

                <button className="relative inline-flex items-center rounded-xl p-2.5 text-slate-600 hover:bg-white/30 transition-colors border border-transparent hover:border-white/20">
                    <BellOutlined className="text-lg" />
                    <span className="absolute top-1.5 right-1.5 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">3</span>
                </button>

                <div className="flex items-center gap-3.5 border-l border-white/25 pl-6">
                    {user?.image ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/40">
                            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" sizes="40px" />
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold text-white shadow-sm">
                            {user?.name?.[0]?.toUpperCase() || "T"}
                        </div>
                    )}
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name || "Traveler"}</p>
                        <p className="text-xs font-semibold text-slate-500">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
                        className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/20 p-2.5 text-slate-600 transition-all hover:bg-white/50 hover:text-slate-900"
                        title="Sign out"
                    >
                        <LogoutOutlined className="text-base" />
                    </button>
                </div>
            </div>
        </header>
    );
}

