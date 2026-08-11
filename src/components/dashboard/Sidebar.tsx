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
    HomeOutlined,
    GiftOutlined,
    CheckCircleOutlined,
    TeamOutlined,
    LineChartOutlined,
} from "@ant-design/icons";
import { useLocale, useTranslations } from "next-intl";

type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
    title: string;
    items: NavItem[];
};

type SidebarProps = {
    onNavigate?: () => void;
    onLogout: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
};

export default function Sidebar({ onNavigate, onLogout, isCollapsed = false, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const locale = useLocale();
    const t = useTranslations("Dashboard.Sidebar");
    const { data: session } = useSession();
    const tenant = useTenant();
    const userRole = (session?.user as any)?.role;

    const rawSlug = (session?.user?.slug || tenant?.slug || "ceylon").toUpperCase();
    const tenantSlug = rawSlug.endsWith("TRAVEL") ? rawSlug.slice(0, -6) : rawSlug;
    const initial = tenantSlug.charAt(0) || "C";

    // ── Build grouped nav ──────────────────────────────────────────────────────
    const generalGroup: NavGroup = {
        title: "General",
        items: [
            { href: `/${locale}`, label: t("home"), icon: HomeOutlined },
            { href: `/${locale}/dashboard`, label: t("dashboard"), icon: AppstoreOutlined },
            ...(userRole === "tenant_admin"
                ? [
                      { href: `/${locale}/dashboard/packages`, label: "Manage Packages", icon: GiftOutlined },
                      { href: `/${locale}/dashboard/requests`, label: "Approve Bookings", icon: CheckCircleOutlined },
                  ]
                : []),
        ],
    };

    const myTripsGroup: NavGroup | null =
        userRole !== "tenant_admin"
            ? {
                  title: "My Trips",
                  items: [
                      { href: `/${locale}/dashboard/my-requests`, label: t("myRequests"), icon: SendOutlined },
                      { href: `/${locale}/dashboard/request-history`, label: t("requestHistory"), icon: HistoryOutlined },
                  ],
              }
            : null;

    const toolsGroup: NavGroup | null =
        userRole === "tenant_admin"
            ? {
                  title: "Tools",
                  items: [
                      { href: `/${locale}/dashboard/users`, label: "Manage Users", icon: TeamOutlined },
                      { href: `/${locale}/dashboard/analytics`, label: "Analytics", icon: LineChartOutlined },
                  ],
              }
            : null;

    const accountGroup: NavGroup = {
        title: "Account",
        items: [
            { href: `/${locale}/dashboard/profile`, label: t("profile"), icon: UserOutlined },
            { href: `/${locale}/dashboard/settings`, label: t("settings"), icon: SettingOutlined },
        ],
    };

    const navGroups: NavGroup[] = [
        generalGroup,
        ...(myTripsGroup ? [myTripsGroup] : []),
        ...(toolsGroup ? [toolsGroup] : []),
        accountGroup,
    ];

    // ── Shared link renderer ───────────────────────────────────────────────────
    const renderLink = (item: NavItem) => {
        const isActive =
            item.href === `/${locale}`
                ? pathname === `/${locale}`
                : pathname === item.href ||
                  (pathname.startsWith(item.href + "/") && item.href !== `/${locale}/dashboard`);
        const Icon = item.icon;

        return (
            <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3.5 px-4"} rounded-xl py-2.5 text-[15px] font-semibold transition-all ${
                    isActive
                        ? "bg-white/60 text-slate-900 border border-white/40 shadow-sm"
                        : "text-slate-600 hover:bg-white/30 hover:text-slate-900"
                }`}
            >
                <Icon className="text-base flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
            </Link>
        );
    };

    return (
        <aside className="flex h-full w-full flex-col bg-white/35 backdrop-blur-lg text-slate-700 border-r border-white/20 shadow-xl overflow-hidden">
            {/* ── Logo / brand header ─────────────────────────────────────────── */}
            <div
                className={`px-4 py-5 border-b border-white/20 bg-white/10 flex items-center justify-center ${
                    isCollapsed ? "flex-col gap-4" : ""
                }`}
            >
                {isCollapsed ? (
                    <Link href={`/${locale}`} className="text-xl font-black tracking-wider text-brand-primary">
                        {initial}
                    </Link>
                ) : (
                    <Link href={`/${locale}`} className="flex items-center gap-2">
                        <span className="text-base font-black tracking-wider text-slate-900">
                            {tenantSlug}
                            <span className="text-brand-primary font-medium">
                                TRAVEL
                            </span>
                        </span>
                    </Link>
                )}
            </div>

            {/* ── Grouped navigation ──────────────────────────────────────────── */}
            <nav className="flex-grow overflow-y-auto px-3 py-4 space-y-1">
                {navGroups.map((group) => (
                    <div key={group.title} className="mb-1">
                        {/* Category heading — hidden when collapsed */}
                        {!isCollapsed && (
                            <p
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    color: "#94a3b8",
                                    paddingLeft: "16px",
                                    paddingTop: "12px",
                                    paddingBottom: "4px",
                                    margin: 0,
                                }}
                            >
                                {group.title}
                            </p>
                        )}
                        {/* Divider line visible in collapsed mode to separate groups */}
                        {isCollapsed && (
                            <div
                                style={{
                                    height: "1px",
                                    background: "rgba(148,163,184,0.25)",
                                    margin: "8px 6px",
                                }}
                            />
                        )}
                        <div className="space-y-1">{group.items.map(renderLink)}</div>
                    </div>
                ))}
            </nav>

            {/* ── Footer / logout ─────────────────────────────────────────────── */}
            <div className="border-t border-white/20 bg-white/10 p-4 mt-auto">
                {isCollapsed ? (
                    /* Collapsed: icon-only round button */
                    <button
                        onClick={onLogout}
                        title={t("logout")}
                        className="flex w-full items-center justify-center rounded-xl py-3 text-slate-500 hover:bg-white/30 hover:text-slate-900 transition-colors duration-200"
                    >
                        <LogoutOutlined className="text-base" />
                    </button>
                ) : (
                    /* Expanded: full-width outline button + copyright */
                    <>
                        <button
                            onClick={onLogout}
                            style={{
                                width: "100%",
                                padding: "10px",
                                background: "transparent",
                                border: "1.5px solid #e2e8f0",
                                borderRadius: "8px",
                                color: "#64748b",
                                fontWeight: 600,
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "border-color .15s, color .15s, background .15s",
                                textAlign: "center",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "#cbd5e1";
                                (e.currentTarget as HTMLButtonElement).style.color = "#1e293b";
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.25)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                                (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                            }}
                        >
                            {t("logout")}
                        </button>
                        <p
                            style={{
                                marginTop: "12px",
                                fontSize: "10.5px",
                                textAlign: "center",
                                color: "#94a3b8",
                            }}
                        >
                            © 2026 {(tenant as any)?.name ?? `${tenantSlug} Travel`}
                        </p>
                    </>
                )}
            </div>
        </aside>
    );
}
