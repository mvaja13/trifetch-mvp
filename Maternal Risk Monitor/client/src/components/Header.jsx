import React from 'react';
import { Activity } from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center shadow-sm">
            <div className="bg-rose-100 p-2 rounded-lg mr-3">
                <Activity className="text-rose-600 w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                Maternal Risk Mini-Monitor <span className="text-slate-400 font-normal ml-2 text-sm">(Demo)</span>
            </h1>
        </header>
    );
}
