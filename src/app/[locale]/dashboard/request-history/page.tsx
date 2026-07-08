"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import RequestCard, { type RequestCardData } from "@/components/dashboard/RequestCard";
import LoadingSkeleton from "@/components/dashboard/LoadingSkeleton";
import EmptyState from "@/components/dashboard/EmptyState";
import StatusBadge from "@/components/dashboard/StatusBadge";

export default function RequestHistoryPage() {
    const searchParams = useSearchParams();
    const selectedId = searchParams.get("id");
    const [requests, setRequests] = useState<RequestCardData[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<RequestCardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                const res = await fetch("/api/travel-requests");
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to load history");
                setRequests(data.requests || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load history");
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, []);

    useEffect(() => {
        if (!selectedId) {
            setSelectedRequest(null);
            return;
        }

        const request = requests.find((item) => item._id === selectedId);
        setSelectedRequest(request || null);
    }, [requests, selectedId]);

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-brand-light/70 bg-brand-light p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">History</p>
                <h2 className="mt-1 text-xl font-semibold text-brand-dark">Request History</h2>
                <p className="mt-1 text-sm text-brand-muted">
                    Review all of your submitted requests and their latest status.
                </p>
            </div>

            {selectedRequest ? (
                <div className="rounded-xl border border-brand-light/70 bg-brand-light p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-light/70 pb-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">
                                Request Details
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-brand-dark">
                                {selectedRequest.packageName}
                            </h3>
                        </div>
                        <StatusBadge status={selectedRequest.status} />
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-brand-light/70 bg-brand-light p-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">
                                Traveler Count
                            </p>
                            <p className="mt-1 tabular-nums text-lg font-medium text-brand-dark">
                                {selectedRequest.numberOfTravelers}
                            </p>
                        </div>
                        <div className="rounded-lg border border-brand-light/70 bg-brand-light p-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">Travel Date</p>
                            <p className="mt-1 tabular-nums text-lg font-medium text-brand-dark">
                                {new Date(selectedRequest.preferredStartDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="rounded-lg border border-brand-light/70 bg-brand-light p-4 md:col-span-2">
                            <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">
                                Special Requests
                            </p>
                            <p className="mt-1 text-base font-medium text-brand-dark">
                                {selectedRequest.specialRequests || "None"}
                            </p>
                        </div>
                    </div>

                    {selectedRequest.status === "approved" ? (
                        <div className="mt-5 rounded-lg border border-brand-secondary/30 bg-brand-secondary/10 p-4 text-sm text-brand-secondary">
                            Our travel team will contact you shortly.
                        </div>
                    ) : null}
                </div>
            ) : null}

            {loading ? (
                <LoadingSkeleton />
            ) : error ? (
                <EmptyState title="Unable to load request history" description={error} />
            ) : requests.length === 0 ? (
                <EmptyState
                    title="No history found"
                    description="Your completed and past travel requests will appear here."
                />
            ) : (
                <div className="grid gap-4">
                    {requests.map((request) => (
                        <RequestCard key={request._id} request={request} showActions={false} />
                    ))}
                </div>
            )}
        </div>
    );
}
