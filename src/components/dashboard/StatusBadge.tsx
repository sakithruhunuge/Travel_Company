type StatusBadgeProps = {
    status: string;
};

const statusStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const normalized = status.toLowerCase();
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[normalized] || "bg-slate-100 text-slate-700"}`}>
            {normalized}
        </span>
    );
}
