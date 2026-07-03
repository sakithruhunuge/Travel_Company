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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)] transition-colors duration-200 hover:border-slate-300">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Package</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-800">{request.packageName}</h3>
                </div>
                <StatusBadge status={request.status} />
            </div>

            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Travelers</p>
                    <p className="mt-1 tabular-nums font-medium text-slate-800">{request.numberOfTravelers}</p>
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Preferred date</p>
                    <p className="mt-1 tabular-nums font-medium text-slate-800">
                        {new Date(request.preferredStartDate).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Submitted</p>
                    <p className="mt-1 tabular-nums font-medium text-slate-800">
                        {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Special requests</p>
                    <p className="mt-1 font-medium text-slate-800">{request.specialRequests || "None"}</p>
                </div>
            </div>

            {showActions ? (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                    <Link
                        href={`/dashboard/request-history?id=${request._id}`}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-100"
                    >
                        View Details
                    </Link>
                    {request.status === "pending" && onCancel ? (
                        <button
                            onClick={() => onCancel(request._id)}
                            disabled={isCancelling}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors duration-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isCancelling ? "Cancelling..." : "Cancel Request"}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
