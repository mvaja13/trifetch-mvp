'use client';

import { useState } from 'react';

interface AudioUploadProps {
  onAnalysisComplete: (analysisId: string) => void;
}

export default function AudioUpload({ onAnalysisComplete }: AudioUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio_file', file);

      const response = await fetch('/api/v1/analyses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      setTimeout(() => {
        onAnalysisComplete(data.analysis_id);
      }, 2000);

    } catch (err) {
      setError('Failed to upload audio file. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Meeting Audio</h2>
      <p className="text-gray-600 mb-4">
        Upload a meeting recording to analyze team stress, fatigue, and wellbeing metrics.
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="audio-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Audio File
          </label>
          <input
            id="audio-upload"
            type="file"
            accept="audio/*,.mp3,.wav,.m4a"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            Selected: <span className="font-medium">{file.name}</span>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Processing...' : 'Analyze Meeting'}
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Privacy Notice:</strong> This is a demo application with mock analysis.
          No actual audio processing occurs. All data is simulated for demonstration purposes.
        </p>
      </div>
    </div>
  );
}
