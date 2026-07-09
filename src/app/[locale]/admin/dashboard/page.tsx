import { dbConnect } from "@/lib/mongodb";
import TravelRequest from "@/models/TravelRequest";
import User from "@/models/User";
import { sriLankaPackages } from "@/data/packages";
import Link from "next/link";
import {
    CompassOutlined,
    InboxOutlined,
    TeamOutlined,
    DollarOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    RightOutlined,
    PlusOutlined
} from "@ant-design/icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    await dbConnect();

    // Fetch metrics from the database
    const [
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        totalCustomers,
        recentRequests
    ] = await Promise.all([
        TravelRequest.countDocuments(),
        TravelRequest.countDocuments({ status: "pending" }),
        TravelRequest.countDocuments({ status: "approved" }),
        TravelRequest.countDocuments({ status: "rejected" }),
        User.countDocuments({ role: "customer" }),
        TravelRequest.find().sort({ createdAt: -1 }).limit(5)
    ]);

    // Let's generate some mock values for display stats
    const mockRevenue = approvedRequests * 850; // assuming an average value of $850 per package
    const activePackagesCount = sriLankaPackages.length;

    const stats = [
        {
            title: "Total Revenue Est.",
            value: `$${mockRevenue.toLocaleString()}`,
            change: "+15.2%",
            trend: "up",
            icon: DollarOutlined,
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        },
        {
            title: "Travel Requests",
            value: totalRequests,
            change: `+${recentRequests.length} new`,
            trend: "up",
            icon: InboxOutlined,
            color: "text-brand-primary bg-brand-primary/10 border-brand-primary/20",
        },
        {
            title: "Total Customers",
            value: totalCustomers,
            change: "+8.4%",
            trend: "up",
            icon: TeamOutlined,
            color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        },
        {
            title: "Active Packages",
            value: activePackagesCount,
            change: "Static Data",
            trend: "neutral",
            icon: CompassOutlined,
            color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        },
    ];

    const quickActions = [
        {
            title: "Create Package",
            desc: "Add a new Sri Lankan travel package",
            href: "/en/admin/packages",
            icon: PlusOutlined,
            color: "hover:border-brand-primary/40 hover:bg-brand-primary/5",
        },
        {
            title: "Review Requests",
            desc: `${pendingRequests} pending customer bookings`,
            href: "/en/admin/requests",
            icon: CalendarOutlined,
            color: "hover:border-indigo-500/40 hover:bg-indigo-500/5",
        },
        {
            title: "Customer Database",
            desc: `Inspect ${totalCustomers} registered customers`,
            href: "/en/admin/customers",
            icon: TeamOutlined,
            color: "hover:border-cyan-500/40 hover:bg-cyan-500/5",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">System Overview</h1>
                    <p className="text-slate-400 text-sm mt-1">Real-time metrics, recent actions, and pending bookings inbox.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3.5 py-1.5 rounded-full font-semibold">
                        DB Connection: <span className="text-emerald-400 font-bold">Online</span>
                    </span>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between hover:border-slate-700/80 transition-all duration-300 group"
                        >
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                                    {stat.title}
                                </span>
                                <h3 className="text-2xl font-black text-white tracking-tight">{stat.value}</h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    {stat.trend === "up" && <ArrowUpOutlined className="text-xxs text-emerald-400" />}
                                    {stat.trend === "down" && <ArrowDownOutlined className="text-xxs text-rose-400" />}
                                    <span
                                        className={`text-xs font-bold ${stat.trend === "up"
                                                ? "text-emerald-400"
                                                : stat.trend === "down"
                                                    ? "text-rose-400"
                                                    : "text-slate-500"
                                            }`}
                                    >
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="text-lg" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Bookings / Requests */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-white">Recent Requests Inbox</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Showing the latest travel inquiries from the site.</p>
                        </div>
                        <Link
                            href="/en/admin/requests"
                            className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1"
                        >
                            View All <RightOutlined className="text-xxs" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-500 text-xxs font-black tracking-wider uppercase">
                                    <th className="pb-3 pl-1">Customer</th>
                                    <th className="pb-3">Package Requested</th>
                                    <th className="pb-3">Travelers</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3 pr-1 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-xs">
                                {recentRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                                            No travel requests have been submitted yet.
                                        </td>
                                    </tr>
                                ) : (
                                    recentRequests.map((req) => {
                                        return (
                                            <tr key={req._id.toString()} className="group hover:bg-slate-800/20 transition-colors">
                                                <td className="py-4 pl-1">
                                                    <div className="font-bold text-white">{req.userName}</div>
                                                    <div className="text-xxs text-slate-500">{req.userEmail}</div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="font-semibold text-slate-350">{req.packageName}</span>
                                                </td>
                                                <td className="py-4">
                                                    <span className="text-slate-400 font-bold">{req.numberOfTravelers}</span>
                                                </td>
                                                <td className="py-4">
                                                    {req.status === "pending" && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                            <ClockCircleOutlined className="text-[10px]" /> Pending
                                                        </span>
                                                    )}
                                                    {req.status === "approved" && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircleOutlined className="text-[10px]" /> Approved
                                                        </span>
                                                    )}
                                                    {req.status === "rejected" && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xxs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                                            <CloseCircleOutlined className="text-[10px]" /> Rejected
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 pr-1 text-right text-slate-500 font-medium">
                                                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick actions & breakdowns */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
                        <div>
                            <h2 className="text-lg font-black text-white">Quick Operations</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Deploy changes or inspect databases immediately.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            {quickActions.map((action, idx) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={idx}
                                        href={action.href}
                                        className={`flex items-start gap-3.5 p-3 rounded-xl border border-slate-800/60 bg-slate-950/20 transition-all duration-300 group ${action.color}`}
                                    >
                                        <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-800 transition-colors shrink-0">
                                            <Icon className="text-sm" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white leading-none mb-1 flex items-center gap-1">
                                                {action.title}
                                                <RightOutlined className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-xxs font-medium text-slate-500 leading-normal">{action.desc}</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Booking Status breakdown bar chart mock */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4">
                        <div>
                            <h2 className="text-lg font-black text-white">Request Breakdown</h2>
                            <p className="text-slate-500 text-xs mt-0.5">Performance index of customer operations.</p>
                        </div>

                        <div className="space-y-3.5">
                            {/* Approved requests */}
                            <div>
                                <div className="flex justify-between text-xxs font-bold text-slate-400 mb-1.5">
                                    <span>Approved Requests</span>
                                    <span>{approvedRequests} / {totalRequests}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Pending requests */}
                            <div>
                                <div className="flex justify-between text-xxs font-bold text-slate-400 mb-1.5">
                                    <span>Pending Requests</span>
                                    <span>{pendingRequests} / {totalRequests}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full"
                                        style={{ width: `${totalRequests > 0 ? (pendingRequests / totalRequests) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Rejected requests */}
                            <div>
                                <div className="flex justify-between text-xxs font-bold text-slate-400 mb-1.5">
                                    <span>Rejected Requests</span>
                                    <span>{rejectedRequests} / {totalRequests}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-rose-500 rounded-full"
                                        style={{ width: `${totalRequests > 0 ? (rejectedRequests / totalRequests) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
