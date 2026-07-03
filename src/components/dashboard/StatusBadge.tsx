type StatusBadgeProps = {
    status: string;
};

const statusStyles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
    approved: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    rejected: "bg-rose-50 text-rose-700 border border-rose-100",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const normalized = status.toLowerCase();
    return (
        <span
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                statusStyles[normalized] || "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
        >
            {normalized}
        </span>
    );
}
