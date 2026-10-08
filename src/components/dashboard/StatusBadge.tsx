import { useTranslations } from "next-intl";

type StatusBadgeProps = {
    status: string;
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  quoted: "bg-sky-50 text-sky-700 border border-sky-200",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  allocated: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  proforma_issued: "bg-amber-100 text-amber-900 border border-amber-300",
  active_tour: "bg-purple-50 text-purple-700 border border-purple-200 animate-pulse",
  reconciling: "bg-orange-50 text-orange-700 border border-orange-200",
  completed: "bg-teal-50 text-teal-800 border border-teal-300",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
  cancelled: "bg-slate-100 text-slate-600 border border-slate-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status ? status.toLowerCase() : "pending";
  const displayLabel = normalized.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize tracking-wide ${
        statusStyles[normalized] || "bg-slate-100 text-slate-700 border border-slate-200"
      }`}
    >
      {displayLabel}
    </span>
  );
}
