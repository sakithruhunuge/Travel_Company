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
        <header className="flex items-center justify-between border-b border-white/10 bg-white/60 backdrop-blur-sm px-4 py-3 md:px-6 lg:px-8">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
                {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center rounded-lg bg-white/20 backdrop-blur-sm px-3 py-2">
                    <SearchOutlined className="text-slate-400" />
                    <input
                        placeholder="Search requests, destinations..."
                        className="ml-2 w-64 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none"
                    />
                </div>

                <button className="relative inline-flex items-center rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                    <BellOutlined />
                    <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs text-white">3</span>
                </button>

                <div className="hidden sm:flex items-center gap-3">
                    {user?.image ? (
                        <div className="relative h-9 w-9 overflow-hidden rounded-full">
                            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" sizes="36px" />
                        </div>
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            {user?.name?.[0]?.toUpperCase() || "T"}
                        </div>
                    )}
                    <div className="text-left">
                        <p className="text-sm font-medium text-slate-900 leading-tight">{user?.name || "Traveler"}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
                    >
                        <LogoutOutlined className="text-xs" />
                    </button>
                </div>
            </div>
        </header>
    );
}
