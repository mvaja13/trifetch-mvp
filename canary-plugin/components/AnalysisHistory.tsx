'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HistoricalAnalysis {
  id: string;
  createdAt: string;
  fileName: string;
  stressScore: number;
  fatigueIndex: number;
  cognitiveLoad: number;
  sentiment: string;
  burnoutRisk: string;
}

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<HistoricalAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/v1/analyses');
      const data = await response.json();
      setAnalyses(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center py-8">Loading history...</div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Analysis History</h2>
        <div className="text-center py-8 text-gray-600">
          No analyses yet. Upload your first meeting recording to get started!
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = analyses
    .slice(0, 10)
    .reverse()
    .map((analysis, index) => ({
      name: `Meeting ${index + 1}`,
      stress: analysis.stressScore,
      fatigue: analysis.fatigueIndex,
      cognitive: analysis.cognitiveLoad,
      date: new Date(analysis.createdAt).toLocaleDateString()
    }));

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBurnoutBadge = (risk: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[risk as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Analysis History</h2>
      <p className="text-gray-600 mb-6">
        Track your team's wellbeing trends over time
      </p>

      {/* Trend Chart */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Historical Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={2} name="Stress" />
            <Line type="monotone" dataKey="fatigue" stroke="#f59e0b" strokeWidth={2} name="Fatigue" />
            <Line type="monotone" dataKey="cognitive" stroke="#3b82f6" strokeWidth={2} name="Cognitive Load" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Analysis List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Recent Analyses</h3>
        {analyses.map((analysis) => (
          <div
            key={analysis.id}
            onClick={() => setSelectedAnalysis(selectedAnalysis === analysis.id ? null : analysis.id)}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedAnalysis === analysis.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-gray-900">{analysis.fileName}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getBurnoutBadge(analysis.burnoutRisk)}`}>
                    {analysis.burnoutRisk} risk
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(analysis.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.stressScore)}`}>
                    {analysis.stressScore}
                  </div>
                  <div className="text-xs text-gray-600">Stress</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.fatigueIndex)}`}>
                    {analysis.fatigueIndex}
                  </div>
                  <div className="text-xs text-gray-600">Fatigue</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.cognitiveLoad)}`}>
                    {analysis.cognitiveLoad}
                  </div>
                  <div className="text-xs text-gray-600">Cognitive</div>
                </div>
              </div>

              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  selectedAnalysis === analysis.id ? 'transform rotate-180' : ''
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>

            {selectedAnalysis === analysis.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Analysis ID:</span>
                    <span className="ml-2 text-gray-900 font-mono text-xs">{analysis.id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Sentiment:</span>
                    <span className="ml-2 text-gray-900 capitalize">{analysis.sentiment}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Avg Stress</div>
          <div className="text-2xl font-bold text-blue-700">
            {(analyses.reduce((sum, a) => sum + a.stressScore, 0) / analyses.length).toFixed(0)}
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-sm text-yellow-600 font-medium">Avg Fatigue</div>
          <div className="text-2xl font-bold text-yellow-700">
            {(analyses.reduce((sum, a) => sum + a.fatigueIndex, 0) / analyses.length).toFixed(0)}
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-sm text-red-600 font-medium">High Risk</div>
          <div className="text-2xl font-bold text-red-700">
            {analyses.filter(a => a.burnoutRisk === 'high').length}
          </div>
        </div>
      </div>
    </div>
  );
}
