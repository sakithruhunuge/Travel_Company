"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    AppstoreOutlined,
    SendOutlined,
    HistoryOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
} from "@ant-design/icons";

type SidebarProps = {
    onNavigate?: () => void;
    onLogout: () => void;
};

const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: AppstoreOutlined },
    { href: "/dashboard/my-requests", label: "My Travel Requests", icon: SendOutlined },
    { href: "/dashboard/request-history", label: "Request History", icon: HistoryOutlined },
    { href: "/dashboard/profile", label: "Profile", icon: UserOutlined },
    { href: "/dashboard/settings", label: "Settings", icon: SettingOutlined },
];

export default function Sidebar({ onNavigate, onLogout }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="flex h-full w-full flex-col bg-slate-900 text-slate-100 border-r border-slate-800 shadow-xl">
            <div className="px-6 py-6 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-brand-primary flex items-center justify-center font-black text-slate-950 text-base tracking-wider shadow-md shadow-brand-primary/20">
                        HZ
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-wider text-white">HORIZON TRAVEL</p>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-primary">Curated Journeys</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1.5 px-4 py-6">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${isActive
                                ? "bg-brand-primary text-slate-950 shadow-lg shadow-brand-primary/25 scale-[1.02]"
                                : "text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-1"
                                }`}
                        >
                            <Icon className={`text-base ${isActive ? "text-slate-950" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-brand-dark/80 bg-brand-dark/80 p-4">
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold text-brand-secondary transition-all duration-200 hover:bg-brand-secondary/10 hover:text-brand-secondary/90"
                >
                    <LogoutOutlined className="text-base" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
