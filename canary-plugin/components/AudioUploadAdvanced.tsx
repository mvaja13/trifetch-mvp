'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface AudioUploadAdvancedProps {
  onAnalysisComplete: (analysisId: string, file: File) => void;
}

export default function AudioUploadAdvanced({ onAnalysisComplete }: AudioUploadAdvancedProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketIo = io();

    socketIo.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socketIo.on('analysisProgress', (data) => {
      console.log('Progress update:', data);
      setProgress(data.progress);
      setStage(data.stage);
      setMessage(data.message);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      setProgress(0);
      setStage('');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file || !socket) {
      setError('Please select an audio file');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

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

      // Notify WebSocket server to start progress updates
      socket.emit('startAnalysis', { analysisId: data.analysis_id });

      // Wait for completion
      setTimeout(() => {
        onAnalysisComplete(data.analysis_id, file);
        setUploading(false);
      }, 5500);

    } catch (err) {
      setError('Failed to upload audio file. Please try again.');
      console.error(err);
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('audio/') || droppedFile.name.endsWith('.mp3') || droppedFile.name.endsWith('.wav')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please drop an audio file');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Meeting Audio</h2>
      <p className="text-gray-600 mb-4">
        Upload a meeting recording to analyze team stress, fatigue, and wellbeing metrics.
      </p>

      <div className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => document.getElementById('audio-upload')?.click()}
        >
          {!file ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">MP3, WAV, M4A up to 100MB</p>
            </>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-1 1v2H6a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V3a1 1 0 10-2 0v2zm3 4v2a1 1 0 11-2 0V6H8v2a1 1 0 11-2 0V6H6v11a1 1 0 001 1h6a1 1 0 001-1V6h-2z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="ml-4 text-red-600 hover:text-red-700"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          <input
            id="audio-upload"
            type="file"
            accept="audio/*,.mp3,.wav,.m4a"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{message || 'Processing...'}</span>
              <span className="text-blue-600 font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="capitalize">{stage}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Analyze Meeting
            </>
          )}
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>✨ Real-time Processing:</strong> Watch as we analyze your meeting audio through multiple stages including preprocessing, feature extraction, and biomarker analysis. All data is stored securely in our database.
        </p>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
