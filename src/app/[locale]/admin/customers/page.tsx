"use client";

import React, { useEffect, useState } from "react";
import { 
    TeamOutlined, 
    LoadingOutlined, 
    SearchOutlined,
    CheckCircleOutlined,
    StopOutlined,
    UnlockOutlined
} from "@ant-design/icons";
import { useToast } from "@/context/ToastContext";

interface ICustomer {
    _id: string;
    name: string;
    email: string;
    image?: string;
    status: "active" | "suspended";
    createdAt: string;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<ICustomer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { addToast } = useToast();

    const fetchCustomers = async () => {
        try {
            const res = await fetch("/api/admin/customers");
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                setCustomers(data.customers || []);
            }
        } catch {
            addToast("error", "Failed to fetch customer directory");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleStatus = async (customer: ICustomer) => {
        const nextStatus = customer.status === "active" ? "suspended" : "active";
        const message = customer.status === "active" 
            ? `Are you sure you want to suspend account for ${customer.name}? This will instantly revoke their access.`
            : `Reactivate account for ${customer.name}?`;

        if (!confirm(message)) return;

        try {
            const res = await fetch(`/api/admin/customers/${customer._id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus })
            });
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                addToast("success", `Customer is now ${nextStatus}`);
                fetchCustomers();
            }
        } catch {
            addToast("error", "Failed to toggle account permission status");
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Customers Directory</h1>
                    <p className="text-slate-400 text-sm mt-1">Audit active profiles, search client registrations, and suspend/activate user permissions.</p>
                </div>
                
                {/* Search bar */}
                <div className="relative w-full md:w-72 shrink-0">
                    <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search client by name/email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-full border border-slate-800 bg-slate-900/50 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-550 outline-none focus:border-brand-primary"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-slate-500">
                    <LoadingOutlined className="text-2xl text-brand-primary mb-3 block" />
                    Loading Customers Registry...
                </div>
            ) : customers.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                    <TeamOutlined className="text-4xl text-slate-500 mb-4 block mx-auto" />
                    <h3 className="text-lg font-bold text-white mb-1">No customers registered</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                        Registered client accounts and authenticated OAuth profiles will populate this catalog.
                    </p>
                </div>
            ) : filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-slate-500">No client matches &quot;{searchQuery}&quot;</div>
            ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-xxs font-black tracking-wider uppercase bg-slate-950/20">
                                    <th className="py-4 px-6">Customer Profile</th>
                                    <th className="py-4 px-6">Email Address</th>
                                    <th className="py-4 px-6">Registered Date</th>
                                    <th className="py-4 px-6">Access State</th>
                                    <th className="py-4 px-6 text-right">Access Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-xs">
                                {filteredCustomers.map((c) => (
                                    <tr key={c._id} className="group hover:bg-slate-800/10 transition-colors">
                                        <td className="py-4 px-6 flex items-center gap-3">
                                            {c.image ? (
                                                <img src={c.image} alt={c.name} className="h-8 w-8 rounded-full object-cover border border-slate-800 shrink-0" />
                                            ) : (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold shrink-0">
                                                    {c.name[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <span className="font-bold text-white group-hover:text-brand-primary transition-colors">{c.name}</span>
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-slate-350">{c.email}</td>
                                        <td className="py-4 px-6 text-slate-400">
                                            {new Date(c.createdAt).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}
                                        </td>
                                        <td className="py-4 px-6">
                                            {c.status === "active" ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircleOutlined className="text-[10px]" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                    <StopOutlined className="text-[10px]" /> Suspended
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => toggleStatus(c)}
                                                className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xxs font-bold transition-all ml-auto shrink-0 border ${
                                                    c.status === "active"
                                                        ? "text-rose-450 bg-rose-950/20 border-rose-500/30 hover:bg-rose-955/30"
                                                        : "text-emerald-450 bg-emerald-955/20 border-emerald-500/30 hover:bg-emerald-955/30"
                                                }`}
                                            >
                                                {c.status === "active" ? (
                                                    <>
                                                        <StopOutlined /> Suspend User
                                                    </>
                                                ) : (
                                                    <>
                                                        <UnlockOutlined /> Reactivate
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
