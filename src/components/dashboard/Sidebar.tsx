"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
    onNavigate?: () => void;
    onLogout: () => void;
};

const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: "▣" },
    { href: "/dashboard/my-requests", label: "My Travel Requests", icon: "✈" },
    { href: "/dashboard/request-history", label: "Request History", icon: "⏱" },
    { href: "/dashboard/profile", label: "Profile", icon: "👤" },
    { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar({ onNavigate, onLogout }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="flex h-full w-full flex-col rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-slate-100 shadow-2xl">
            <div className="px-3 py-3">
                <p className="text-xl font-black tracking-[0.2em] text-amber-400">HORIZON</p>
                <p className="text-sm text-slate-400">TRAVEL</p>
            </div>

            <nav className="mt-8 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-white/10 text-white shadow-inner" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                        >
                            <span className="text-base">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t border-white/10 pt-4">
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
                >
                    <span>↩</span>
                    Logout
                </button>
            </div>
        </aside>
    );
}
