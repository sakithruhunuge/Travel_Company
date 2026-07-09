"use client";

import React, { useEffect, useState } from "react";
import { 
    InboxOutlined, 
    CheckOutlined, 
    CloseOutlined, 
    LoadingOutlined, 
    ClockCircleOutlined,
    SearchOutlined,
    UserOutlined,
    CalendarOutlined
} from "@ant-design/icons";
import { useToast } from "@/context/ToastContext";

interface ITravelRequest {
    _id: string;
    userName: string;
    userEmail: string;
    packageName: string;
    numberOfTravelers: number;
    preferredStartDate: string;
    specialRequests?: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
}

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<ITravelRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { addToast } = useToast();

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/admin/requests");
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                // In Request Center we only want to show pending requests
                setRequests(data.requests || []);
            }
        } catch {
            addToast("error", "Failed to fetch inquiries");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAction = async (id: string, status: "approved" | "rejected") => {
        try {
            const res = await fetch(`/api/admin/requests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                addToast("success", `Request ${status} successfully`);
                fetchRequests();
            }
        } catch {
            addToast("error", `Failed to transition request to ${status}`);
        }
    };

    const pendingRequests = requests.filter(r => r.status === "pending");
    const filteredRequests = pendingRequests.filter(r => 
        r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.packageName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Request Center</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage, approve, or reject incoming client travel bookings.</p>
                </div>
                
                {/* Search bar */}
                <div className="relative w-full md:w-72 shrink-0">
                    <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by customer or package..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-full border border-slate-800 bg-slate-900/50 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-550 outline-none focus:border-brand-primary"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-slate-500">
                    <LoadingOutlined className="text-2xl text-brand-primary mb-3 block" />
                    Loading Pending Bookings...
                </div>
            ) : pendingRequests.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                    <InboxOutlined className="text-4xl text-slate-500 mb-4 block mx-auto" />
                    <h3 className="text-lg font-bold text-white mb-1">No pending inquiries</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                        Your booking inbox is empty. All incoming travel submissions are up to date!
                    </p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-500">No match found for &quot;{searchQuery}&quot;</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredRequests.map((req) => (
                        <div key={req._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <UserOutlined className="text-slate-500 text-xs" />
                                        <div>
                                            <div className="font-bold text-white text-xs">{req.userName}</div>
                                            <div className="text-xxs text-slate-500">{req.userEmail}</div>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xxs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                                        <ClockCircleOutlined className="text-[10px]" /> Pending
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Itinerary Package</span>
                                        <span className="font-bold text-slate-200">{req.packageName}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Number of Travelers</span>
                                        <span className="font-bold text-white">{req.numberOfTravelers} Travelers</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Preferred Date</span>
                                        <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
                                            <CalendarOutlined className="text-xxs" />
                                            {new Date(req.preferredStartDate).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}
                                        </span>
                                    </div>
                                    {req.specialRequests && (
                                        <div className="bg-slate-950/30 rounded-xl p-3 border border-slate-850 mt-2">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Special Notes</div>
                                            <p className="text-[11px] text-slate-400 italic leading-relaxed">&ldquo;{req.specialRequests}&rdquo;</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-5 border-t border-slate-800/40 mt-5">
                                <button
                                    onClick={() => handleAction(req._id, "rejected")}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 active:scale-95 text-xs font-bold py-2 rounded-xl transition-all"
                                >
                                    <CloseOutlined /> Reject
                                </button>
                                <button
                                    onClick={() => handleAction(req._id, "approved")}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 text-xs font-bold py-2 rounded-xl transition-all"
                                >
                                    <CheckOutlined /> Approve Booking
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
