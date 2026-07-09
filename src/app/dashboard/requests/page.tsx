"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EmptyState from "@/components/dashboard/EmptyState";

interface RequestData {
  _id: string;
  packageName: string;
  numberOfTravelers: number;
  preferredStartDate: string;
  specialRequests: string;
  status: string;
  createdAt: string;
  userId: string;
}

export default function TenantRequestsPage() {
  const { data: session } = useSession();

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (userRole === "tenant_admin") {
      loadRequests();
    }
  }, [userRole]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/travel-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        throw new Error("Failed to load requests list");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failure");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/travel-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        loadRequests();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Guard Access
  if (userRole !== "tenant_admin") {
    return (
      <div className="py-20 text-center text-slate-800">
        <EmptyState title="Access Denied" description="Only organization administrators can review travel bookings." />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      <div className="bg-white/40 backdrop-blur-md border border-slate-200 p-6 rounded-3xl">
        <h2 className="text-2xl font-black text-slate-900 leading-tight">Review Bookings</h2>
        <p className="text-slate-500 text-xs mt-1">Review and coordinate traveler trip requests.</p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-900 mx-auto" />
        </div>
      ) : error ? (
        <EmptyState title="Booking Load Error" description={error} />
      ) : requests.length === 0 ? (
        <div className="py-12 bg-white/30 rounded-3xl border border-slate-200 p-8">
          <EmptyState title="No Bookings Submitted" description="Travel request submissions will list here for approval." />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Package</th>
                  <th className="px-6 py-4">Travelers</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {req._id.substring(req._id.length - 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">
                      {req.packageName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">
                      {req.numberOfTravelers} Travelers
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-semibold">
                      {new Date(req.preferredStartDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        req.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : req.status === "rejected" || req.status === "cancelled"
                          ? "bg-red-500/10 text-red-600 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(req._id, "approved")}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req._id, "rejected")}
                            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition"
                          >
                            Reject
                          </button>
                        </>
                      ) : req.status === "approved" ? (
                        <button
                          onClick={() => handleUpdateStatus(req._id, "cancelled")}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-650 font-bold text-xs rounded-lg transition"
                        >
                          Cancel Booking
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">No Actions</span>
                      )}
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
