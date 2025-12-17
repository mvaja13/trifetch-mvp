'use client';

import { AnalysisResult } from '@/types/analysis';

interface AnalysisResultsProps {
  analysis: AnalysisResult;
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBurnoutColor = (risk: string) => {
    if (risk === 'high') return 'bg-red-100 text-red-800';
    if (risk === 'moderate') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'negative') return 'bg-red-100 text-red-800';
    if (sentiment === 'neutral') return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Analysis Results</h2>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-600">Duration</div>
            <div className="text-2xl font-bold text-gray-800">
              {analysis.meeting_metadata.duration_minutes} min
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-600">Participants</div>
            <div className="text-2xl font-bold text-gray-800">
              {analysis.meeting_metadata.participant_count}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-600">Meeting Type</div>
            <div className="text-2xl font-bold text-gray-800 capitalize">
              {analysis.meeting_metadata.meeting_type}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Biomarker Scores</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Stress Score</div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.biomarkers.stress_score)}`}>
              {analysis.biomarkers.stress_score}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  analysis.biomarkers.stress_score >= 70
                    ? 'bg-red-600'
                    : analysis.biomarkers.stress_score >= 50
                    ? 'bg-yellow-600'
                    : 'bg-green-600'
                }`}
                style={{ width: `${analysis.biomarkers.stress_score}%` }}
              ></div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Fatigue Index</div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.biomarkers.fatigue_index)}`}>
              {analysis.biomarkers.fatigue_index}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  analysis.biomarkers.fatigue_index >= 70
                    ? 'bg-red-600'
                    : analysis.biomarkers.fatigue_index >= 50
                    ? 'bg-yellow-600'
                    : 'bg-green-600'
                }`}
                style={{ width: `${analysis.biomarkers.fatigue_index}%` }}
              ></div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Cognitive Load</div>
            <div className={`text-3xl font-bold ${getScoreColor(analysis.biomarkers.cognitive_load)}`}>
              {analysis.biomarkers.cognitive_load}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  analysis.biomarkers.cognitive_load >= 70
                    ? 'bg-red-600'
                    : analysis.biomarkers.cognitive_load >= 50
                    ? 'bg-yellow-600'
                    : 'bg-green-600'
                }`}
                style={{ width: `${analysis.biomarkers.cognitive_load}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Meeting Sentiment</div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getSentimentColor(analysis.biomarkers.meeting_sentiment)}`}>
              {analysis.biomarkers.meeting_sentiment}
            </span>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Burnout Risk</div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getBurnoutColor(analysis.biomarkers.burnout_risk)}`}>
              {analysis.biomarkers.burnout_risk}
            </span>
          </div>
        </div>
      </div>

      {analysis.recommendations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Recommendations</h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
