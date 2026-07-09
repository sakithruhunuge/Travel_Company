import React from "react";
import { BarChartOutlined } from "@ant-design/icons";

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-white">Analytics Hub</h1>
                <p className="text-slate-400 text-sm mt-1">Track destination popularity, traffic graphs, conversion ratios, and sales.</p>
            </div>
            
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-12 text-center">
                <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
                    <BarChartOutlined className="text-2xl text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Compiling traffic profiles</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    Data pipelines are aggregating booking patterns and traveler demographics. Insights compile on every cycle.
                </p>
            </div>
        </div>
    );
}
