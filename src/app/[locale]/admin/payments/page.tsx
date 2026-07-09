import React from "react";
import { CreditCardOutlined } from "@ant-design/icons";

export default function AdminPaymentsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-white">Payments & Ledger</h1>
                <p className="text-slate-400 text-sm mt-1">Audit customer invoices, reconcile stripe charges, and process booking refunds.</p>
            </div>
            
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-12 text-center">
                <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-4">
                    <CreditCardOutlined className="text-2xl text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No payment transactions</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                    Checkout invoices, downpayments, and bank transfer slips will generate financial entries in this ledger.
                </p>
            </div>
        </div>
    );
}
