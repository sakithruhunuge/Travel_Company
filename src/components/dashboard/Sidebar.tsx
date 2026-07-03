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
        <aside className="flex h-full w-full flex-col bg-brand-light/60 backdrop-blur-sm border-r border-white/10">
            <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg font-bold tracking-tight text-slate-900">HORIZON <span className="text-teal-600">TRAVEL</span></p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">Dashboard</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${isActive
                                    ? "bg-brand-primary/10 text-brand-primary shadow-sm"
                                    : "text-slate-600 hover:bg-white/30 hover:text-brand-dark"
                                }`}>
                        >
                            <Icon className={`text-lg ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-100 px-4 py-4">
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
                >
                    <LogoutOutlined className="text-base text-slate-500" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
