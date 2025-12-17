import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Filter, AlertTriangle, ChevronRight, Activity } from 'lucide-react';

export default function PatientTable({ patients, onSelectPatient, onFilterChange, onSortChange }) {
    const [highRiskOnly, setHighRiskOnly] = useState(false);
    const [sortDesc, setSortDesc] = useState(false);

    const toggleFilter = () => {
        const newVal = !highRiskOnly;
        setHighRiskOnly(newVal);
        onFilterChange(newVal ? 'high' : '');
    };

    const toggleSort = () => {
        const newVal = !sortDesc;
        setSortDesc(newVal);
        onSortChange(newVal ? 'risk_desc' : '');
    };

    const getRiskColor = (score) => {
        if (score > 70) return 'bg-red-100 text-red-700 border-red-200';
        if (score >= 40) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Controls */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-800 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-slate-400" /> Patient List
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={toggleFilter}
                        className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${highRiskOnly ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Filter className="w-3 h-3 mr-1.5" /> High Risk Only {">"} 70
                    </button>
                    <button
                        onClick={toggleSort}
                        className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${sortDesc ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        Risk {sortDesc ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">Patient ID</th>
                            <th className="px-6 py-3">GA (Wks)</th>
                            <th className="px-6 py-3">Latest Risk</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Updated</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                    {patients.length === 0 ? "No patients found." : "No matches found."}
                                </td>
                            </tr>
                        )}
                        {patients.map(p => (
                            <tr
                                key={p.patient_id}
                                onClick={() => onSelectPatient(p.patient_id)}
                                className={`hover:bg-slate-50 cursor-pointer transition-colors group ${p.flag === 'rising' ? 'bg-amber-50/30' : ''}`}
                            >
                                <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${p.flag === 'rising' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {p.patient_id.substring(3)}
                                    </div>
                                    <div>
                                        {p.patient_id}
                                        {p.flag === 'rising' && (
                                            <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider flex items-center mt-0.5">
                                                <ArrowUp className="w-3 h-3 mr-0.5" /> Rising
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{p.gestational_age_weeks}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getRiskColor(p.risk_score)}`}>
                                        {p.risk_score}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                        {p.risk_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-xs">
                                    {p.timestamp ? new Date(p.timestamp).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
