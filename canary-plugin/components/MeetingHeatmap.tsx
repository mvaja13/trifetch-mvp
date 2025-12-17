'use client';

import { AnalysisResult } from '@/types/analysis';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MeetingHeatmapProps {
  analysis: AnalysisResult;
}

export default function MeetingHeatmap({ analysis }: MeetingHeatmapProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Meeting Timeline</h2>
      <p className="text-gray-600 mb-4">
        Minute-by-minute stress levels and cognitive load throughout the meeting
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={analysis.timeline}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            label={{ value: 'Meeting Time', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="stress_level"
            stroke="#ef4444"
            strokeWidth={2}
            name="Stress Level"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="engagement"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Cognitive Load"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-red-50 p-3 rounded-md">
          <div className="text-xs text-red-600 font-medium">Peak Stress</div>
          <div className="text-lg font-bold text-red-700">
            {analysis.timeline.length > 0 ? Math.max(...analysis.timeline.map(t => t.stress_level)).toFixed(0) : '0'}
          </div>
        </div>
        <div className="bg-blue-50 p-3 rounded-md">
          <div className="text-xs text-blue-600 font-medium">Peak Cognitive Load</div>
          <div className="text-lg font-bold text-blue-700">
            {analysis.timeline.length > 0 ? Math.max(...analysis.timeline.map(t => t.engagement)).toFixed(0) : '0'}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-md">
          <div className="text-xs text-green-600 font-medium">Avg Stress</div>
          <div className="text-lg font-bold text-green-700">
            {analysis.timeline.length > 0 ? (analysis.timeline.reduce((sum, t) => sum + t.stress_level, 0) / analysis.timeline.length).toFixed(0) : '0'}
          </div>
        </div>
      </div>
    </div>
  );
}
