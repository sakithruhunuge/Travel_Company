type StatusBadgeProps = {
    status: string;
};

const statusStyles: Record<string, string> = {
    pending: "bg-amber-100/70 text-amber-800 border border-amber-200",
    approved: "bg-emerald-100/70 text-emerald-800 border border-emerald-200",
    rejected: "bg-rose-100/70 text-rose-800 border border-rose-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const normalized = status.toLowerCase();
    return (
        <span
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold capitalize tracking-wide ${statusStyles[normalized] || "bg-white/10 text-slate-700 border border-white/10"
                }`}
        >
            {normalized}
        </span>
    );
}
