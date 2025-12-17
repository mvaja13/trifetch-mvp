import React, { useEffect, useState } from 'react';
import { X, Save, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

export default function PatientModal({ patientId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDetails();
    }, [patientId]);

    const fetchDetails = async () => {
        try {
            const res = await api.getPatientDetails(patientId);
            setData(res.data);
        } catch (err) {
            console.error("Failed to load patient details", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!note.trim()) return;
        setSubmitting(true);
        try {
            await api.addNote(patientId, note, 'Clinician');
            setNote('');
            fetchDetails(); // refresh notes
        } catch (err) {
            alert("Failed to save note");
        } finally {
            setSubmitting(false);
        }
    };

    if (!patientId) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Patient {data?.patient_id || patientId}</h2>
                        <p className="text-sm text-slate-500">Gestational Age: {data?.gestational_age_weeks} weeks</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-slate-400">Loading details...</div>
                ) : (
                    <div className="overflow-y-auto p-6 space-y-8">
                        {/* Chart Section */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2" /> Risk Trend (Last 5)
                            </h3>
                            <div className="h-48 w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data?.history ? [...data.history].reverse() : []}>
                                        <XAxis dataKey="timestamp" hide />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="risk_score"
                                            stroke="#f43f5e"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#f43f5e' }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* Notes Section */}
                        <section>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Clinician Notes</h3>

                            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                                {data?.notes?.length === 0 && <p className="text-sm text-slate-400 italic">No notes yet.</p>}
                                {data?.notes?.map(n => (
                                    <div key={n.id} className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                                        <p className="text-slate-700">{n.note_text}</p>
                                        <div className="mt-2 flex justify-between text-xs text-slate-400">
                                            <span>{n.created_by}</span>
                                            <span>{new Date(n.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="relative">
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Add a clinical note (e.g., 'Patient advised to rest')..."
                                    className="w-full p-3 pr-12 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none h-24 text-sm"
                                />
                                <button
                                    onClick={handleSaveNote}
                                    disabled={!note.trim() || submitting}
                                    className="absolute bottom-3 right-3 p-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
