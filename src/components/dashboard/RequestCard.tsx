import Link from "next/link";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("Dashboard.MyRequests");

    return (
        <div className="rounded-2xl bg-white/60 backdrop-blur-sm p-6 border border-slate-200 transition-transform hover:-translate-y-0.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{t("package")}</p>
                    <h3 className="mt-1 text-lg font-semibold text-brand-dark">{request.packageName}</h3>
                </div>
                <StatusBadge status={request.status} />
            </div>

            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{t("travelers")}</p>
                    <p className="mt-1 tabular-nums font-medium text-brand-dark">{request.numberOfTravelers}</p>
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{t("preferredDate")}</p>
                    <p className="mt-1 tabular-nums font-medium text-brand-dark">
                        {new Date(request.preferredStartDate).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{t("submitted")}</p>
                    <p className="mt-1 tabular-nums font-medium text-brand-dark">
                        {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-brand-muted">{t("specialRequests")}</p>
                    <p className="mt-1 font-medium text-brand-dark">{request.specialRequests || t("none")}</p>
                </div>
            </div>

            {showActions ? (
                <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                    <Link
                        href={`/dashboard/request-history?id=${request._id}`}
                        className="rounded-md bg-white/10 border border-white/10 px-4 py-2 text-sm font-medium text-brand-dark transition-colors duration-200 hover:bg-white/20"
                    >
                        {t("viewDetails")}
                    </Link>
                    {request.status === "pending" && onCancel ? (
                        <button
                            onClick={() => onCancel(request._id)}
                            disabled={isCancelling}
                            className="rounded-md bg-rose-55/80 border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition-colors duration-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isCancelling ? t("cancelling") : t("cancelRequest")}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
