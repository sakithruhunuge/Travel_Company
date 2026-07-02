import Link from "next/link";
import StatusBadge from "@/components/dashboard/StatusBadge";

export type RequestCardData = {
    _id: string;
    packageName: string;
    packageId?: string;
    numberOfTravelers: number;
    preferredStartDate: string;
    specialRequests?: string;
    status: string;
    createdAt: string;
};

type RequestCardProps = {
    request: RequestCardData;
    showActions?: boolean;
    onCancel?: (id: string) => void;
    isCancelling?: boolean;
};

export default function RequestCard({ request, showActions = true, onCancel, isCancelling = false }: RequestCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">Package</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{request.packageName}</h3>
                </div>
                <StatusBadge status={request.status} />
            </div>

            <div className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
                <div>
                    <p className="font-medium text-slate-500">Travelers</p>
                    <p className="mt-1 font-semibold text-slate-900">{request.numberOfTravelers}</p>
                </div>
                <div>
                    <p className="font-medium text-slate-500">Preferred date</p>
                    <p className="mt-1 font-semibold text-slate-900">{new Date(request.preferredStartDate).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="font-medium text-slate-500">Submitted</p>
                    <p className="mt-1 font-semibold text-slate-900">{new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="font-medium text-slate-500">Special requests</p>
                    <p className="mt-1 font-semibold text-slate-900">{request.specialRequests || "None"}</p>
                </div>
            </div>

            {showActions ? (
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/dashboard/request-history?id=${request._id}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        View Details
                    </Link>
                    {request.status === "pending" && onCancel ? (
                        <button
                            onClick={() => onCancel(request._id)}
                            disabled={isCancelling}
                            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                            {isCancelling ? "Cancelling..." : "Cancel Request"}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
