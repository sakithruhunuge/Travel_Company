type EmptyStateProps = {
    title: string;
    description: string;
    action?: React.ReactNode;
};

export default function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
            {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
        </div>
    );
}
