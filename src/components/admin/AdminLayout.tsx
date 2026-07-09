"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { CloseOutlined, MenuOutlined, BellOutlined, SearchOutlined } from "@ant-design/icons";
import AdminSidebar from "./AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const locale = useLocale();

    useEffect(() => {
        if (status !== "authenticated") return;
        if (!session?.user) {
            router.replace(`/${locale}/login`);
        }
    }, [router, session, status, locale]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-brand-primary" />
                    <p className="mt-4 text-sm font-medium text-slate-400">Loading Horizon Admin...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return null;
    }

    const user = session.user as { name?: string | null; email?: string | null; image?: string | null; role?: string };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden font-sans">
            {/* SaaS style neon background accents */}
            <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[700px] w-[700px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

            <div className="flex min-h-screen relative z-10">
                {/* Desktop sidebar */}
                <div className={`hidden lg:flex ${isCollapsed ? "w-20" : "w-64"} transition-all duration-300 ease-in-out flex-shrink-0 h-screen fixed top-0 left-0 z-20`}>
                    <AdminSidebar 
                        onNavigate={() => undefined} 
                        onLogout={() => signOut({ callbackUrl: `/${locale}/login` })} 
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                    />
                </div>

                <div className={`flex flex-1 flex-col min-w-0 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"} transition-all duration-300 ease-in-out`}>
                    {/* Top Navbar */}
                    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 shadow-sm">
                        {/* Mobile sidebar toggle button */}
                        <div className="flex items-center gap-4 lg:hidden">
                            <button
                                onClick={() => setMobileSidebarOpen((prev) => !prev)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                                aria-label="Toggle menu"
                            >
                                {mobileSidebarOpen ? <CloseOutlined /> : <MenuOutlined />}
                            </button>
                            <span className="text-sm font-black tracking-wider text-white">HORIZON <span className="text-brand-primary font-medium">ADMIN</span></span>
                        </div>

                        {/* Breadcrumbs / Page Title (Desktop) */}
                        <div className="hidden lg:flex items-center gap-2 text-sm">
                            <span className="text-slate-500 font-medium">Admin</span>
                            <span className="text-slate-700">/</span>
                            <span className="text-slate-300 capitalize font-semibold">{pathname.split("/").pop()}</span>
                        </div>

                        {/* Search, Notifications & Profile actions */}
                        <div className="flex items-center gap-4 ml-auto">
                            {/* Search bar */}
                            <div className="relative hidden md:block w-64">
                                <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search packages, bookings..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-full border border-slate-800 bg-slate-900/50 py-1.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-brand-primary focus:bg-slate-900"
                                />
                            </div>

                            {/* Notifications bell */}
                            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                                <BellOutlined />
                                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
                            </button>

                            {/* Profile dropdown / badge */}
                            <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                                {user.image ? (
                                    <img src={user.image} alt={user.name || "Admin"} className="h-8 w-8 rounded-full object-cover border border-slate-800 shrink-0" />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-bold text-sm shrink-0">
                                        {user.name ? user.name[0]?.toUpperCase() : "A"}
                                    </div>
                                )}
                                <div className="hidden xl:block text-left">
                                    <div className="text-xs font-bold text-white leading-none mb-0.5">{user.name}</div>
                                    <div className="text-xxs font-medium text-brand-primary tracking-wider uppercase leading-none">{user.role?.replace("_", " ")}</div>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Mobile sidebar overlay panel */}
                    <AnimatePresence>
                        {mobileSidebarOpen && (
                            <div className="fixed inset-0 z-40 lg:hidden">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                                    onClick={() => setMobileSidebarOpen(false)}
                                />
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "-100%" }}
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                    className="absolute inset-y-0 left-0 w-64 bg-slate-900"
                                >
                                    <AdminSidebar
                                        onNavigate={() => setMobileSidebarOpen(false)}
                                        onLogout={() => signOut({ callbackUrl: `/${locale}/login` })}
                                        isCollapsed={false}
                                    />
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Core dashboard workspace content */}
                    <AnimatePresence mode="wait">
                        <motion.main
                            key={pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-grow flex-1 p-6 md:p-8 lg:p-10 w-full max-w-7xl mx-auto"
                        >
                            {children}
                        </motion.main>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
