"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CloseOutlined, MenuOutlined } from "@ant-design/icons";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNavbar from "@/components/dashboard/TopNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (status !== "authenticated") return;
        if (!session?.user) {
            router.replace("/login");
        }
    }, [router, session, status]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-brand-light">
                <div className="text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-light border-t-brand-dark" />
                    <p className="mt-4 text-sm font-medium text-brand-muted">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-brand-light to-white">
            <div className="flex min-h-screen">
                {/* Desktop sidebar */}
                <div className="hidden lg:flex lg:w-64 lg:flex-shrink-0">
                    <Sidebar onNavigate={() => undefined} onLogout={() => signOut({ callbackUrl: "/login" })} />
                </div>

                <div className="flex flex-1 flex-col min-w-0">
                    {/* Mobile header bar */}
                    <div className="flex items-center gap-3 border-b border-brand-light/70 bg-white px-4 py-3 lg:hidden">
                        <button
                            onClick={() => setMobileSidebarOpen((prev) => !prev)}
                            className="inline-flex items-center gap-2 rounded-lg border border-brand-light/70 px-3 py-2 text-sm font-medium text-brand-muted transition-colors duration-200 hover:bg-brand-light"
                            aria-label={mobileSidebarOpen ? "Close menu" : "Open menu"}
                        >
                            {mobileSidebarOpen ? (
                                <>
                                    <CloseOutlined className="text-xs" />
                                    Close
                                </>
                            ) : (
                                <>
                                    <MenuOutlined className="text-xs" />
                                    Menu
                                </>
                            )}
                        </button>
                        <span className="text-sm font-semibold text-brand-dark">Horizon Travel</span>
                    </div>

                    {/* Mobile sidebar overlay */}
                    {mobileSidebarOpen ? (
                        <div className="fixed inset-0 z-40 lg:hidden">
                            <div
                                className="absolute inset-0 bg-brand-dark/10"
                                onClick={() => setMobileSidebarOpen(false)}
                            />
                            <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-lg">
                                <Sidebar
                                    onNavigate={() => setMobileSidebarOpen(false)}
                                    onLogout={() => signOut({ callbackUrl: "/login" })}
                                />
                            </div>
                        </div>
                    ) : null}

                    <TopNavbar title="Dashboard" subtitle="Manage your Sri Lanka plans" />

                    <main className="flex-1 p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">{children}</main>
                </div>
            </div>
        </div>
    );
}
