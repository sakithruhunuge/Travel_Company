type StatCardProps = {
    title: string;
    value: number | string;
    description: string;
    icon: React.ReactNode;
    accent: string;
};

export default function StatCard({ title, value, description, icon, accent }: StatCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-800">{value}</p>
                    <p className="mt-1.5 text-sm text-slate-500">{description}</p>
                </div>
                <div className={`flex-shrink-0 rounded-lg p-2.5 ${accent}`}>{icon}</div>
            </div>
        </div>
    );
}
