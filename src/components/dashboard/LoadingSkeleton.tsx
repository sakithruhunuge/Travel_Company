export default function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
        </div>
    );
}
