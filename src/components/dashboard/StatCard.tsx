type StatCardProps = {
    title: string;
    value: number | string;
    description: string;
    icon: React.ReactNode;
    accent: string;
};

export default function StatCard({ title, value, description, icon, accent }: StatCardProps) {
    return (
        <div className="rounded-2xl bg-white/60 backdrop-blur-sm p-6 shadow-lg ring-1 ring-white/10 border border-white/10 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{title}</p>
                    <div className="mt-3 flex items-baseline gap-3">
                        <p className="text-3xl font-extrabold tabular-nums text-brand-dark">{value}</p>
                        <p className="text-sm text-brand-muted">{description}</p>
                    </div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm text-white ${accent}`}>
                    <div className="text-xl">{icon}</div>
                </div>
            </div>
        </div>
    );
}
