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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xl font-semibold text-slate-600">
                    {image ? (
                        <Image src={image} alt={name} width={64} height={64} className="h-full w-full object-cover" />
                    ) : (
                        name[0]?.toUpperCase() || "U"
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">{name}</h3>
                    <p className="text-sm text-slate-500">{email}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-slate-600">
                            {provider === "google" ? "Google" : "Email/Password"}
                        </span>
                        <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Joined {new Date(createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
