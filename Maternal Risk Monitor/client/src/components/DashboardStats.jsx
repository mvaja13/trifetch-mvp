import React from 'react';
import { Users, Activity, TrendingUp } from 'lucide-react';

export default function DashboardStats({ patients }) {
    const total = patients.length;
    const highRisk = patients.filter(p => p.risk_score > 70).length;
    const rising = patients.filter(p => p.flag === 'rising').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Patients */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Monitored</p>
                    <h3 className="text-3xl font-bold text-slate-900">{total}</h3>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                </div>
            </div>

            {/* High Risk */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="z-10">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">High Risk Cases</p>
                    <h3 className="text-3xl font-bold text-rose-600">{highRisk}</h3>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl z-10">
                    <Activity className="w-6 h-6 text-rose-600" />
                </div>
                {/* Subtle background flair */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-50 rounded-full opacity-50 z-0" />
            </div>

            {/* Rising Risk */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Rising Trends</p>
                    <h3 className="text-3xl font-bold text-amber-500">{rising}</h3>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-amber-500" />
                </div>
            </div>
        </div>
    );
}
