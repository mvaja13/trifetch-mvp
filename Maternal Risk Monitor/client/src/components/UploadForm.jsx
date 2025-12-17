import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function UploadForm({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setMessage(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.uploadCsv(formData);
            setMessage({ type: 'success', text: 'Data uploaded successfully!' });
            setFile(null);
            // Reset input
            document.getElementById('csvInput').value = '';
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to upload CSV.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                <Upload className="w-4 h-4 mr-2" /> Data Ingestion
            </h3>

            <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                    <input
                        id="csvInput"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <FileText className={`w-8 h-8 mb-2 ${file ? 'text-blue-500' : 'text-slate-300'}`} />
                        <p className="text-sm text-slate-600 font-medium">
                            {file ? file.name : "Click to upload CSV"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">.csv files only</p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!file || uploading}
                    className="w-full bg-slate-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {uploading ? 'Processing...' : 'Upload Data'}
                </button>

                {message && (
                    <div className={`text-xs p-2 rounded flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <AlertCircle className="w-3 h-3 mr-2" /> {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}
