import { redirect } from "next/navigation";

export default function AdminPage({ params: { locale } }: { params: { locale: string } }) {
    redirect(`/${locale}/admin/dashboard`);
}
