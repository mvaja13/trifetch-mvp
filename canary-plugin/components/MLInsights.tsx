'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface PredictiveInsight {
  type: 'warning' | 'critical' | 'improving' | 'stable';
  title: string;
  description: string;
  confidence: number;
  affectedDepartments: string[];
  predictedDate?: string;
}

interface AnomalyDetection {
  detected: boolean;
  department: string;
  metric: 'stress' | 'fatigue' | 'cognitive_load';
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}

interface HealthRiskScore {
  overall_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  contributing_factors: {
    factor: string;
    weight: number;
    impact: number;
  }[];
  trend: 'improving' | 'stable' | 'declining';
}

interface MLRecommendation {
  priority: 'low' | 'medium' | 'high';
  category: 'intervention' | 'prevention' | 'monitoring';
  action: string;
  expectedImpact: string;
  targetDepartments: string[];
}

interface Cluster {
  id: string;
  name: string;
  departments: any[];
  characteristics: string;
  recommended_action: string;
}

interface MLInsightsData {
  timestamp: string;
  model_version: string;
  insights: {
    predictive: PredictiveInsight[];
    anomalies: AnomalyDetection[];
    health_risk: HealthRiskScore;
    recommendations: MLRecommendation[];
    clusters: {
      clusters: Cluster[];
    };
  };
  metadata: {
    departments_analyzed: number;
    data_points: number;
    confidence_threshold: number;
  };
}

export default function MLInsights() {
  const [data, setData] = useState<MLInsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/ml-insights')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load ML insights:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="mt-2 text-gray-600">Running ML models...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center py-8 text-red-600">Failed to load ML insights</div>
      </div>
    );
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'improving': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'improving': return '✅';
      default: return 'ℹ️';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  return (
    <div className="space-y-6">
      {/* Header with AI Badge */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-md p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">🤖 AI-Powered Health Insights</h2>
            <p className="text-purple-100">Machine learning analysis of employee wellbeing patterns</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Model Version</div>
            <div className="font-mono text-lg">{data.model_version}</div>
            <div className="text-xs opacity-75 mt-1">
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Health Risk Score */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">📊 Overall Health Risk Assessment</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${
                data.insights.health_risk.risk_level === 'critical' ? 'bg-red-100' :
                data.insights.health_risk.risk_level === 'high' ? 'bg-orange-100' :
                data.insights.health_risk.risk_level === 'moderate' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <div className={`text-4xl font-bold ${
                  data.insights.health_risk.risk_level === 'critical' ? 'text-red-700' :
                  data.insights.health_risk.risk_level === 'high' ? 'text-orange-700' :
                  data.insights.health_risk.risk_level === 'moderate' ? 'text-yellow-700' : 'text-green-700'
                }`}>
                  {data.insights.health_risk.overall_score}
                </div>
              </div>
              <div className="mt-3 text-lg font-semibold capitalize">{data.insights.health_risk.risk_level} Risk</div>
              <div className="text-sm text-gray-500 mt-1">
                Trend: {data.insights.health_risk.trend === 'improving' ? '📈 Improving' :
                         data.insights.health_risk.trend === 'declining' ? '📉 Declining' : '➡️ Stable'}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-semibold mb-3 text-gray-700">Contributing Factors</h4>
            <div className="space-y-3">
              {data.insights.health_risk.contributing_factors.map((factor, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{factor.factor}</span>
                    <span className="text-gray-500">Weight: {(factor.weight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        factor.impact > 0.7 ? 'bg-red-500' :
                        factor.impact > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${factor.impact * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">🔮 Predictive Analytics</h3>
        <p className="text-gray-600 mb-4">AI-forecasted trends and potential risks</p>

        <div className="space-y-4">
          {data.insights.predictive.map((insight, idx) => (
            <div key={idx} className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}>
              <div className="flex items-start">
                <div className="text-2xl mr-3">{getInsightIcon(insight.type)}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 mb-1">{insight.title}</h4>
                  <p className="text-gray-700 text-sm mb-2">{insight.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center">
                      <span className="font-semibold mr-1">Confidence:</span>
                      {(insight.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="flex items-center">
                      <span className="font-semibold mr-1">Affected:</span>
                      {insight.affectedDepartments.join(', ')}
                    </span>
                    {insight.predictedDate && (
                      <span className="flex items-center">
                        <span className="font-semibold mr-1">ETA:</span>
                        {new Date(insight.predictedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Detection */}
      {data.insights.anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">🔍 Anomaly Detection</h3>
          <p className="text-gray-600 mb-4">Unusual patterns identified by ML models</p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deviation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.insights.anomalies.map((anomaly, idx) => (
                  <tr key={idx} className={anomaly.severity === 'high' ? 'bg-red-50' : 'bg-yellow-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{anomaly.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{anomaly.metric.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{anomaly.currentValue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{anomaly.expectedValue}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${anomaly.deviation > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">💡 AI-Powered Recommendations</h3>
        <p className="text-gray-600 mb-4">Data-driven action items prioritized by ML models</p>

        <div className="space-y-4">
          {data.insights.recommendations.map((rec, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityBadge(rec.priority)}`}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {rec.category}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2">{rec.action}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Expected Impact:</span> {rec.expectedImpact}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Target:</span> {rec.targetDepartments.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Clustering */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">🎯 ML-Based Department Clustering</h3>
        <p className="text-gray-600 mb-4">Departments grouped by similar health patterns</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.insights.clusters.clusters.map((cluster, idx) => (
            <div key={idx} className={`border-2 rounded-lg p-4 ${
              cluster.id === 'high-risk' ? 'border-red-300 bg-red-50' :
              cluster.id === 'moderate-risk' ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'
            }`}>
              <h4 className="font-bold text-gray-800 mb-2">{cluster.name}</h4>
              <div className="text-2xl font-bold mb-2">
                {cluster.departments.length} {cluster.departments.length === 1 ? 'Dept' : 'Depts'}
              </div>
              <p className="text-sm text-gray-700 mb-2">{cluster.characteristics}</p>
              <div className="text-xs text-gray-600 mb-3">
                {cluster.departments.map(d => d.department).join(', ') || 'None'}
              </div>
              <div className="bg-white bg-opacity-60 rounded p-2 text-xs">
                <span className="font-semibold">Action:</span> {cluster.recommended_action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">ℹ️ About These ML Models</h4>
        <p className="text-sm text-gray-600 mb-2">
          This is a <strong>prototype implementation</strong> demonstrating ML capabilities for canary health monitoring.
          The following techniques are simulated:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 ml-4">
          <li>• <strong>Predictive Analytics:</strong> Time-series forecasting (LSTM/Prophet-style)</li>
          <li>• <strong>Anomaly Detection:</strong> Isolation Forest / Autoencoder simulation</li>
          <li>• <strong>Risk Scoring:</strong> Gradient Boosting (XGBoost/LightGBM-style)</li>
          <li>• <strong>Clustering:</strong> K-means pattern grouping</li>
          <li>• <strong>Recommendation Engine:</strong> Rule-based + collaborative filtering</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Analyzed {data.metadata.departments_analyzed} departments using {data.metadata.data_points} data points.
          Confidence threshold: {(data.metadata.confidence_threshold * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
}
