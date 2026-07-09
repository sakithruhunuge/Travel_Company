import React from "react";
import { FileTextOutlined } from "@ant-design/icons";

export default function AdminReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-white">System Reports</h1>
                <p className="text-slate-400 text-sm mt-1">Export database logs, booking statistics, and financial audits as PDF/CSV.</p>
            </div>
            
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-12 text-center">
                <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
                    <FileTextOutlined className="text-2xl text-teal-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No documents compiled</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    Generate visual summaries and database exports of your monthly operational statistics.
                </p>
            </div>
        </div>
    );
}
