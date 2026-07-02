type SettingsCardProps = {
    title: string;
    description: string;
    children: React.ReactNode;
};

export default function SettingsCard({ title, description, children }: SettingsCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            {children}
        </div>
    );
}
