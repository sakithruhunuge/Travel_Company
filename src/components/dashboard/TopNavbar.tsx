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
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-light/40 bg-white/90 backdrop-blur-md px-6 py-4 md:px-8 shadow-sm">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-brand-dark md:text-2xl">{title}</h1>
                {subtitle ? <p className="mt-0.5 text-xs font-medium text-brand-muted">{subtitle}</p> : null}
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 transition-all duration-200 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10 focus-within:bg-white">
                    <SearchOutlined className="text-slate-400 text-base" />
                    <input
                        placeholder="Search requests, destinations..."
                        className="ml-2 w-64 bg-transparent text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none"
                    />
                </div>

                <button className="relative inline-flex items-center rounded-xl p-2.5 text-slate-500 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <BellOutlined className="text-lg" />
                    <span className="absolute top-1.5 right-1.5 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white">3</span>
                </button>

                <div className="flex items-center gap-3.5 border-l border-slate-100 pl-6">
                    {user?.image ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-slate-100">
                            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" sizes="40px" />
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-orange-400 text-sm font-bold text-white shadow-sm">
                            {user?.name?.[0]?.toUpperCase() || "T"}
                        </div>
                    )}
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-bold text-brand-dark leading-tight">{user?.name || "Traveler"}</p>
                        <p className="text-xs font-medium text-brand-muted">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="inline-flex items-center justify-center rounded-xl border border-brand-light/60 p-2.5 text-brand-muted transition-all hover:bg-brand-light hover:text-brand-dark"
                        title="Sign out"
                    >
                        <LogoutOutlined className="text-base" />
                    </button>
                </div>
            </div>
        </header>
    );
}

