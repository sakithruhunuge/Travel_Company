export default function LoadingSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
        </div>
    );
}
