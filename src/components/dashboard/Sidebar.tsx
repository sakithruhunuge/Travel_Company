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
        <aside className="flex h-full w-full flex-col rounded-[32px] border border-white/10 bg-brand-dark/95 p-5 text-white shadow-2xl backdrop-blur-md">
            <div className="px-3 py-3">
                <p className="text-2xl font-black tracking-[0.2em] text-brand-primary">HORIZON</p>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mt-1">TRAVEL</p>
            </div>

            <nav className="mt-8 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 hover:translate-x-0.5 ${isActive ? "bg-brand-primary text-brand-dark shadow-lg shadow-brand-primary/25" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
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
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-400 transition-colors duration-200 hover:bg-rose-500/10"
                >
                    <span>↩</span>
                    Logout
                </button>
            </div>
        </aside>
    );
}
