import React from "react";
import { SettingOutlined } from "@ant-design/icons";

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-white">System Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Configure business defaults, tax profiles, currency integrations, and notification targets.</p>
            </div>
            
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-12 text-center">
                <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
                    <SettingOutlined className="text-2xl text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Operational settings defaults loaded</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    Manage API access keys, toggle maintenance blocks, and configure dynamic currency calculations.
                </p>
            </div>
        </div>
    );
}
