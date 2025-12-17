import { NextResponse } from 'next/server';
import { DepartmentStats } from '@/types/analysis';
import {
  predictBurnoutTrends,
  detectAnomalies,
  calculateHealthRiskScore,
  generateMLRecommendations,
  clusterByHealthPatterns
} from '@/lib/ml-models';

export async function GET() {
  // Simulate fetching current data (in production, this would come from database)
  const departments: DepartmentStats[] = [
    {
      department: 'Engineering',
      avg_stress: 68,
      avg_fatigue: 62,
      burnout_count: 3,
      total_meetings: 145
    },
    {
      department: 'Product',
      avg_stress: 54,
      avg_fatigue: 48,
      burnout_count: 1,
      total_meetings: 98
    },
    {
      department: 'Sales',
      avg_stress: 72,
      avg_fatigue: 58,
      burnout_count: 4,
      total_meetings: 203
    },
    {
      department: 'Marketing',
      avg_stress: 51,
      avg_fatigue: 45,
      burnout_count: 0,
      total_meetings: 76
    },
    {
      department: 'Customer Success',
      avg_stress: 63,
      avg_fatigue: 55,
      burnout_count: 2,
      total_meetings: 187
    }
  ];

  // Generate 30 days of trend data
  const trendData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    avg_stress: Math.floor(Math.random() * 30) + 50,
    avg_fatigue: Math.floor(Math.random() * 25) + 45,
    meetings_count: Math.floor(Math.random() * 30) + 20
  }));

  // Run ML models
  const predictiveInsights = predictBurnoutTrends(departments, trendData);
  const anomalies = detectAnomalies(departments);
  const healthRiskScore = calculateHealthRiskScore(departments, trendData);
  const recommendations = generateMLRecommendations(departments, predictiveInsights, anomalies);
  const clusters = clusterByHealthPatterns(departments);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    model_version: 'v1.0.0-prototype',
    insights: {
      predictive: predictiveInsights,
      anomalies: anomalies,
      health_risk: healthRiskScore,
      recommendations: recommendations,
      clusters: clusters
    },
    metadata: {
      departments_analyzed: departments.length,
      data_points: trendData.length,
      confidence_threshold: 0.65
    }
  });
}
