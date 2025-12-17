'use client';

import { useState } from 'react';
import AudioUploadAdvanced from '@/components/AudioUploadAdvanced';
import AnalysisResults from '@/components/AnalysisResults';
import MeetingHeatmap from '@/components/MeetingHeatmap';
import AudioWaveform from '@/components/AudioWaveform';
import AnalysisHistory from '@/components/AnalysisHistory';
import PDFExport from '@/components/PDFExport';
import HRDashboard from '@/components/HRDashboard';
import MLInsights from '@/components/MLInsights';
import { AnalysisResult } from '@/types/analysis';

export default function Home() {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'dashboard' | 'ml-insights'>('upload');

  const handleAnalysisComplete = async (id: string, file: File) => {
    setAnalysisId(id);
    setAudioFile(file);
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/analyses/${id}`);
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysis(null);
    setAnalysisId(null);
    setAudioFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                🐦 Canary Wellbeing Insights
                <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">v2.0 Advanced</span>
              </h1>
              <p className="text-blue-100 mt-1">
                AI-powered corporate wellbeing dashboard with real-time analysis
              </p>
            </div>
            <div className="text-right text-sm">
              <div className="text-blue-100">Database: SQLite</div>
              <div className="text-blue-100">WebSocket: Active</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Enhanced Tab Navigation */}
        <div className="mb-6 flex space-x-1 border-b border-gray-300 bg-white rounded-t-lg shadow-sm">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'upload'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
              Meeting Analysis
            </div>
            {activeTab === 'upload' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'history'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Analysis History
            </div>
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'dashboard'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              HR Dashboard
            </div>
            {activeTab === 'dashboard' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ml-insights')}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === 'ml-insights'
                ? 'text-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              ML Insights
              <span className="ml-1 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-0.5 rounded-full">NEW</span>
            </div>
            {activeTab === 'ml-insights' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t"></div>
            )}
          </button>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div>
            {!analysis ? (
              <AudioUploadAdvanced onAnalysisComplete={handleAnalysisComplete} />
            ) : null}

            {loading && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Finalizing analysis...</p>
                <p className="text-sm text-gray-500 mt-2">Generating insights and recommendations</p>
              </div>
            )}

            {analysis && !loading && (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <button
                    onClick={handleNewAnalysis}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Analyze New Meeting
                  </button>

                  <PDFExport analysis={analysis} />
                </div>

                <AnalysisResults analysis={analysis} />

                {/* Audio Waveform */}
                {audioFile && (
                  <AudioWaveform audioFile={audioFile} timeline={analysis.timeline} />
                )}

                <MeetingHeatmap analysis={analysis} />
              </>
            )}

            {!analysis && !loading && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">✨ New Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      🤖
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">AI-Powered ML Insights</h3>
                      <p className="text-sm text-gray-600">Predictive burnout detection, anomaly alerts, and smart recommendations</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      🎵
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Audio Waveform</h3>
                      <p className="text-sm text-gray-600">Play and visualize your meeting audio with real-time stress overlays</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                      ⚡
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Real-Time Progress</h3>
                      <p className="text-sm text-gray-600">Watch analysis progress through WebSocket updates</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      💾
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">SQLite Database</h3>
                      <p className="text-sm text-gray-600">All analyses are now stored and can be reviewed later</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                      📄
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">PDF Export</h3>
                      <p className="text-sm text-gray-600">Download professional PDF reports of your analyses</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                      🎯
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Smart Clustering</h3>
                      <p className="text-sm text-gray-600">ML-based grouping of departments by health patterns</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && <AnalysisHistory />}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && <HRDashboard />}

        {/* ML Insights Tab */}
        {activeTab === 'ml-insights' && <MLInsights />}
      </div>

      <footer className="bg-gray-900 text-gray-300 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm font-medium">Built by Gautam for Trifetch Product Trial</p>
              <p className="text-xs text-gray-400 mt-1">
                Advanced features: ML Insights • Real-time WebSocket • SQLite Database • Audio Processing • PDF Export
              </p>
            </div>
            <div className="text-sm text-right">
              <p className="font-medium">Powered by Canary Speech Technology (Mock)</p>
              <p className="text-xs text-gray-400">Next.js 15 • Prisma • Socket.IO • WaveSurfer.js</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
