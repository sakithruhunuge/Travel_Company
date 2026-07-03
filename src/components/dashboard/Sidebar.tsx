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
        <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5">
                <p className="text-base font-bold tracking-wide text-slate-800">
                    HORIZON<span className="text-teal-700">TRAVEL</span>
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">Dashboard</p>
            </div>

            <nav className="flex-1 space-y-0.5 px-3 py-4">
                {menuItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (pathname.startsWith(item.href + "/") && item.href !== "/dashboard");
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                                isActive
                                    ? "bg-teal-50 text-teal-800 border-l-2 border-teal-700 pl-[10px]"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                            }`}
                        >
                            <Icon className={`text-base ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-200 px-3 py-4">
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-800"
                >
                    <LogoutOutlined className="text-base text-slate-400" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
