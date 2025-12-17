'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioWaveformProps {
  audioFile: File;
  timeline: Array<{ minute: number; stress_level: number }>;
}

export default function AudioWaveform({ audioFile, timeline }: AudioWaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Create WaveSurfer instance
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#3b82f6',
      progressColor: '#1d4ed8',
      cursorColor: '#ef4444',
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 100,
      barGap: 2,
    });

    // Load audio file
    const objectUrl = URL.createObjectURL(audioFile);
    wavesurfer.current.load(objectUrl);

    // Event listeners
    wavesurfer.current.on('ready', () => {
      setDuration(wavesurfer.current?.getDuration() || 0);
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));

    return () => {
      wavesurfer.current?.destroy();
      URL.revokeObjectURL(objectUrl);
    };
  }, [audioFile]);

  const togglePlayPause = () => {
    wavesurfer.current?.playPause();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get stress level for current time
  const getCurrentStressLevel = () => {
    const currentMinute = Math.floor(currentTime / 60);
    const timelineEntry = timeline.find(t => t.minute === currentMinute + 1);
    return timelineEntry?.stress_level || 50;
  };

  const stressLevel = getCurrentStressLevel();
  const stressColor = stressLevel >= 70 ? 'bg-red-500' : stressLevel >= 50 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Audio Analysis</h3>

      {/* Waveform */}
      <div ref={waveformRef} className="mb-4"></div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={togglePlayPause}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {isPlaying ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Play
            </>
          )}
        </button>

        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Real-time Stress Indicator */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Current Stress Level</span>
          <span className={`text-2xl font-bold ${
            stressLevel >= 70 ? 'text-red-600' :
            stressLevel >= 50 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {stressLevel.toFixed(0)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${stressColor}`}
            style={{ width: `${stressLevel}%` }}
          ></div>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {stressLevel >= 70 ? '⚠️ High stress detected' :
           stressLevel >= 50 ? '⚡ Moderate stress' : '✅ Healthy range'}
        </div>
      </div>
    </div>
  );
}
