type SettingsCardProps = {
    title: string;
    description: string;
    children: React.ReactNode;
};

export default function SettingsCard({ title, description, children }: SettingsCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
            <div className="mb-5 border-b border-slate-100 pb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            {children}
        </div>
    );
}
