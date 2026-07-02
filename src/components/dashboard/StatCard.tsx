type StatCardProps = {
    title: string;
    value: number | string;
    description: string;
    icon: React.ReactNode;
    accent: string;
};

export default function StatCard({ title, value, description, icon, accent }: StatCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
                    <p className="mt-2 text-sm text-slate-500">{description}</p>
                </div>
                <div className={`rounded-2xl p-3 ${accent}`}>{icon}</div>
            </div>
        </div>
    );
}
