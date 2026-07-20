"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTenant } from "@/context/TenantBrandingContext";
import {
    AppstoreOutlined,
    SendOutlined,
    HistoryOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    HomeOutlined,
    GiftOutlined,
    CheckCircleOutlined,
    BgColorsOutlined,
    TeamOutlined,
    LineChartOutlined,
} from "@ant-design/icons";

type SidebarProps = {
    onNavigate?: () => void;
    onLogout: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
};

export default function Sidebar({ onNavigate, onLogout, isCollapsed = false, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const tenant = useTenant();
    const userRole = (session?.user as any)?.role;

    const rawSlug = (session?.user?.slug || tenant?.slug || "ceylon").toUpperCase();
    const tenantSlug = rawSlug.endsWith("TRAVEL") ? rawSlug.slice(0, -6) : rawSlug;
    const initial = tenantSlug.charAt(0) || "C";

    // Dynamically compile navigation links based on user context roles
    const menuItems = [
        { href: "/", label: "Home", icon: HomeOutlined },
        { href: "/dashboard", label: "Dashboard", icon: AppstoreOutlined },
    ];

    if (userRole === "tenant_admin") {
        menuItems.push(
            { href: "/dashboard/packages", label: "Manage Packages", icon: GiftOutlined },
            { href: "/dashboard/requests", label: "Approve Bookings", icon: CheckCircleOutlined },
            { href: "/dashboard/branding", label: "Customizer", icon: BgColorsOutlined },
            { href: "/dashboard/users", label: "Manage Users", icon: TeamOutlined },
            { href: "/dashboard/analytics", label: "Analytics", icon: LineChartOutlined }
        );
    } else {
        menuItems.push(
            { href: "/dashboard/my-requests", label: "My Travel Requests", icon: SendOutlined },
            { href: "/dashboard/request-history", label: "Request History", icon: HistoryOutlined }
        );
    }

    menuItems.push(
        { href: "/dashboard/profile", label: "Profile", icon: UserOutlined },
        { href: "/dashboard/settings", label: "Settings", icon: SettingOutlined }
    );

    return (
        <aside className="flex h-full w-full flex-col bg-white/35 backdrop-blur-lg text-slate-700 border-r border-white/20 shadow-xl overflow-hidden">
            <div className={`px-4 py-6 border-b border-white/20 bg-white/10 flex ${isCollapsed ? "flex-col items-center gap-4" : "items-center justify-between"}`}>
                {isCollapsed ? (
                    <Link href="/" className="text-xl font-black tracking-wider text-brand-primary">
                        {initial}
                    </Link>
                ) : (
                    <Link href="/" className="flex items-center gap-2 group transition-all duration-300 ease-in-out">
                        <span className="text-base font-black tracking-wider text-slate-900 group-hover:text-brand-primary transition-all duration-300 ease-in-out">
                            {tenantSlug}<span className="text-brand-primary group-hover:text-brand-secondary transition-all duration-300 ease-in-out font-medium">TRAVEL</span>
                        </span>
                    </Link>
                )}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="text-slate-500 hover:text-slate-900 transition-colors p-1 rounded-md hover:bg-white/40 flex items-center justify-center"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <MenuUnfoldOutlined className="text-lg" /> : <MenuFoldOutlined className="text-lg" />}
                    </button>
                )}
            </div>

            <nav className="flex-grow overflow-y-auto space-y-1 px-3 py-6">
                {menuItems.map((item) => {
                    const isActive = item.href === "/" 
                        ? pathname === "/" 
                        : (pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard"));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            title={isCollapsed ? item.label : undefined}
                            className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3.5 px-4"} rounded-xl py-3 text-sm font-semibold transition-all ${isActive
                                    ? "bg-white/60 text-slate-900 border border-white/40 shadow-sm"
                                    : "text-slate-600 hover:bg-white/30 hover:text-slate-900"
                                }`}
                        >
                            <Icon className="text-base flex-shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/20 bg-white/10 p-4 mt-auto">
                <button
                    onClick={onLogout}
                    title={isCollapsed ? "Logout" : undefined}
                    className={`flex w-full items-center ${isCollapsed ? "justify-center px-2" : "gap-3.5 px-4"} rounded-xl py-3 text-sm font-semibold text-slate-650 hover:bg-white/30 hover:text-slate-900 transition-colors duration-200`}
                >
                    <LogoutOutlined className="text-base flex-shrink-0" />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
