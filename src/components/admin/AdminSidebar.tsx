"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    DashboardOutlined,
    CalendarOutlined,
    TeamOutlined,
    CreditCardOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    HomeOutlined,
    InboxOutlined,
    CompassOutlined,
    MessageOutlined,
    BarChartOutlined,
    FileTextOutlined
} from "@ant-design/icons";
import { useLocale } from "next-intl";

type AdminSidebarProps = {
    onNavigate?: () => void;
    onLogout: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
};

export default function AdminSidebar({ onNavigate, onLogout, isCollapsed = false, onToggleCollapse }: AdminSidebarProps) {
    const pathname = usePathname();
    const locale = useLocale();

    const menuItems = [
        { href: `/${locale}`, label: "Back to Site", icon: HomeOutlined },
        { href: `/${locale}/admin/dashboard`, label: "Dashboard", icon: DashboardOutlined },
        { href: `/${locale}/admin/packages`, label: "Packages", icon: CompassOutlined },
        { href: `/${locale}/admin/bookings`, label: "Bookings", icon: CalendarOutlined },
        { href: `/${locale}/admin/requests`, label: "Request Center", icon: InboxOutlined },
        { href: `/${locale}/admin/customers`, label: "Customers", icon: TeamOutlined },
        { href: `/${locale}/admin/reviews`, label: "Reviews", icon: MessageOutlined },
        { href: `/${locale}/admin/payments`, label: "Payments", icon: CreditCardOutlined },
        { href: `/${locale}/admin/analytics`, label: "Analytics", icon: BarChartOutlined },
        { href: `/${locale}/admin/reports`, label: "Reports", icon: FileTextOutlined },
        { href: `/${locale}/admin/settings`, label: "Settings", icon: SettingOutlined },
    ];

    return (
        <aside className="flex h-full w-full flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
            {/* Header / Brand */}
            <div className={`px-4 py-6 border-b border-slate-800 bg-slate-950 flex ${isCollapsed ? "flex-col items-center gap-4" : "items-center justify-between"}`}>
                {isCollapsed ? (
                    <Link href={`/${locale}/admin/dashboard`} className="text-xl font-black tracking-wider text-brand-primary">
                        H
                    </Link>
                ) : (
                    <Link href={`/${locale}/admin/dashboard`} className="flex items-center gap-2 group transition-all duration-300">
                        <span className="text-base font-black tracking-wider text-white group-hover:text-brand-primary transition-all duration-300">
                            HORIZON<span className="text-brand-primary font-medium">ADMIN</span>
                        </span>
                    </Link>
                )}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-center"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />}
                    </button>
                )}
            </div>

            {/* Nav Menu */}
            <nav className="flex-grow overflow-y-auto space-y-1.5 px-3 py-6">
                {menuItems.map((item) => {
                    const isActive = item.href === `/${locale}`
                        ? pathname === `/${locale}`
                        : (pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== `/${locale}/admin/dashboard`));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            title={isCollapsed ? item.label : undefined}
                            className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3.5 px-4"} rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${isActive
                                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }`}
                        >
                            <Icon className="text-base flex-shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="border-t border-slate-800 bg-slate-950 p-4 mt-auto">
                <button
                    onClick={onLogout}
                    title={isCollapsed ? "Logout" : undefined}
                    className={`flex w-full items-center ${isCollapsed ? "justify-center px-2" : "gap-3.5 px-4"} rounded-xl py-3 text-sm font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-350 transition-colors duration-200`}
                >
                    <LogoutOutlined className="text-base flex-shrink-0" />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
