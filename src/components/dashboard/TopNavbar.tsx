"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { LogoutOutlined } from "@ant-design/icons";

type TopNavbarProps = {
    title: string;
    subtitle?: string;
};

export default function TopNavbar({ title, subtitle }: TopNavbarProps) {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-6 lg:px-8">
            <div>
                <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
                {subtitle ? (
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">{subtitle}</p>
                ) : null}
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 sm:flex">
                    {user?.image ? (
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-slate-200">
                            <Image
                                src={user.image}
                                alt={user.name || "User"}
                                fill
                                className="object-cover"
                                sizes="32px"
                            />
                        </div>
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
                            {user?.name?.[0]?.toUpperCase() || "T"}
                        </div>
                    )}
                    <div className="text-left">
                        <p className="text-sm font-medium text-slate-800 leading-tight">
                            {user?.name || "Traveler"}
                        </p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
                >
                    <LogoutOutlined className="text-xs" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
}
