"use client";

import React, { useEffect, useState } from "react";
import { 
    CalendarOutlined, 
    LoadingOutlined, 
    SearchOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    UndoOutlined
} from "@ant-design/icons";
import { useToast } from "@/context/ToastContext";

interface IBooking {
    _id: string;
    userName: string;
    userEmail: string;
    packageName: string;
    numberOfTravelers: number;
    preferredStartDate: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
}

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { addToast } = useToast();

    const fetchBookings = async () => {
        try {
            const res = await fetch("/api/admin/requests");
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                // Bookings console displays requests that are approved or rejected
                setBookings(data.requests || []);
            }
        } catch {
            addToast("error", "Failed to fetch bookings ledger");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRevert = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/requests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "pending" })
            });
            const data = await res.json();
            if (data.error) {
                addToast("error", data.error);
            } else {
                addToast("info", "Booking reverted back to pending queue");
                fetchBookings();
            }
        } catch {
            addToast("error", "Failed to revert booking status");
        }
    };

    const bookingRecords = bookings.filter(r => r.status === "approved" || r.status === "rejected");
    const filteredBookings = bookingRecords.filter(b =>
        b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.packageName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Bookings Ledger</h1>
                    <p className="text-slate-400 text-sm mt-1">Audit finalized travel itineraries, customer lists, and action history.</p>
                </div>
                
                {/* Search bar */}
                <div className="relative w-full md:w-72 shrink-0">
                    <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search booking or client..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-full border border-slate-800 bg-slate-900/50 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-550 outline-none focus:border-brand-primary"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="py-20 text-center text-slate-500">
                    <LoadingOutlined className="text-2xl text-brand-primary mb-3 block" />
                    Loading Bookings Ledger...
                </div>
            ) : bookingRecords.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
                    <CalendarOutlined className="text-4xl text-slate-500 mb-4 block mx-auto" />
                    <h3 className="text-lg font-bold text-white mb-1">No booking records found</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                        Approved inquiries and payment authorizations will populate listings in this operational database.
                    </p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-500">No bookings match &quot;{searchQuery}&quot;</div>
            ) : (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-xxs font-black tracking-wider uppercase bg-slate-950/20">
                                    <th className="py-4 px-6">Booking Reference</th>
                                    <th className="py-4 px-6">Customer Details</th>
                                    <th className="py-4 px-6">Date Scheduled</th>
                                    <th className="py-4 px-6">Travelers</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 text-right">Options</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-xs">
                                {filteredBookings.map((book) => (
                                    <tr key={book._id} className="group hover:bg-slate-800/10 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-300">
                                            #{book._id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-white">{book.userName}</div>
                                            <div className="text-xxs text-slate-500">{book.userEmail}</div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-400 font-semibold">
                                            {new Date(book.preferredStartDate).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-400">{book.numberOfTravelers} Travelers</td>
                                        <td className="py-4 px-6">
                                            {book.status === "approved" ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <CheckCircleOutlined className="text-[10px]" /> Approved
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                    <CloseCircleOutlined className="text-[10px]" /> Rejected
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => handleRevert(book._id)}
                                                className="text-slate-450 hover:text-white hover:bg-slate-850 p-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ml-auto text-xxs font-bold border border-slate-800 bg-slate-900"
                                                title="Revert to Pending"
                                            >
                                                <UndoOutlined /> Revert to Pending
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
