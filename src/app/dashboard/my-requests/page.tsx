"use client";

import { useEffect, useState } from "react";
import RequestCard, { type RequestCardData } from "@/components/dashboard/RequestCard";
import LoadingSkeleton from "@/components/dashboard/LoadingSkeleton";
import EmptyState from "@/components/dashboard/EmptyState";

export default function MyRequestsPage() {
    const [requests, setRequests] = useState<RequestCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const loadRequests = async () => {
        try {
            const res = await fetch("/api/travel-requests");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load requests");
            setRequests(data.requests || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleCancel = async (id: string) => {
        try {
            setCancellingId(id);
            const res = await fetch(`/api/travel-requests/${id}/cancel`, { method: "PATCH" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to cancel request");
            await loadRequests();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to cancel request");
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">My Travel Requests</h2>
                        <p className="mt-1 text-sm text-slate-500">Track your pending, approved, and cancelled journeys.</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <LoadingSkeleton />
            ) : error ? (
                <EmptyState title="Unable to load requests" description={error} />
            ) : requests.length === 0 ? (
                <EmptyState title="No travel requests yet" description="Submit a request through the travel form to see it appear here." />
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <RequestCard key={request._id} request={request} onCancel={handleCancel} isCancelling={cancellingId === request._id} />
                    ))}
                </div>
            )}
        </div>
    );
}
