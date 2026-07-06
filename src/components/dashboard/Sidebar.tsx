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
        <aside className="flex h-full w-full flex-col bg-white/35 backdrop-blur-lg text-slate-700 border-r border-white/20 shadow-xl">
            <div className="px-6 py-6 border-b border-white/20 bg-white/10">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-primary to-orange-400 flex items-center justify-center font-black text-white text-base shadow-sm">
                        HZ
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">HORIZON TRAVEL</p>
                        <p className="text-[10px] font-semibold uppercase text-slate-400">Curated Journeys</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-6">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isActive
                                    ? "bg-white/60 text-slate-900 border border-white/40 shadow-sm"
                                    : "text-slate-600 hover:bg-white/30 hover:text-slate-900"
                                }`}
                        >
                            <Icon className="text-base" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/20 bg-white/10 p-4">
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-white/30 hover:text-slate-900 transition-colors duration-200"
                >
                    <LogoutOutlined className="text-base" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
