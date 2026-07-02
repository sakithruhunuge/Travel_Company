import Image from "next/image";

type ProfileCardProps = {
    name: string;
    email: string;
    image?: string | null;
    provider: string;
    createdAt: string;
};

export default function ProfileCard({ name, email, image, provider, createdAt }: ProfileCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-700">
                    {image ? <Image src={image} alt={name} width={80} height={80} className="h-full w-full object-cover" /> : name[0]?.toUpperCase() || "U"}
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-900">{name}</h3>
                    <p className="text-sm text-slate-500">{email}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                            {provider === "google" ? "Google" : "Email/Password"}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Joined {new Date(createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
