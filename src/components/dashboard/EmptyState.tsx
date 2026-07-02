type EmptyStateProps = {
    title: string;
    description: string;
    action?: React.ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
        </div>
    );
}
