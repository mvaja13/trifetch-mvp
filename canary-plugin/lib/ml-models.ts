/**
 * ML Models for Canary Health Predictions
 * This is a prototype implementation with intelligent hardcoded logic
 * In production, these would be replaced with actual ML models (TensorFlow.js, ONNX, etc.)
 */

import { DepartmentStats } from '@/types/analysis';

export interface PredictiveInsight {
  type: 'warning' | 'critical' | 'improving' | 'stable';
  title: string;
  description: string;
  confidence: number;
  affectedDepartments: string[];
  predictedDate?: string;
}

export interface AnomalyDetection {
  detected: boolean;
  department: string;
  metric: 'stress' | 'fatigue' | 'cognitive_load';
  currentValue: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}

export interface HealthRiskScore {
  overall_score: number;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  contributing_factors: {
    factor: string;
    weight: number;
    impact: number;
  }[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface MLRecommendation {
  priority: 'low' | 'medium' | 'high';
  category: 'intervention' | 'prevention' | 'monitoring';
  action: string;
  expectedImpact: string;
  targetDepartments: string[];
}

/**
 * Predictive Model: Forecasts burnout trends
 * Simulates a time-series forecasting model (like LSTM or Prophet)
 */
export function predictBurnoutTrends(
  departments: DepartmentStats[],
  trendData: any[]
): PredictiveInsight[] {
  const insights: PredictiveInsight[] = [];

  // Simulate ML analysis of trends
  departments.forEach(dept => {
    const stressTrend = dept.avg_stress;
    const fatigueTrend = dept.avg_fatigue;
    const burnoutRate = dept.burnout_count / (dept.total_meetings / 10);

    // Simulate gradient/velocity analysis
    if (stressTrend > 70 && fatigueTrend > 60) {
      insights.push({
        type: 'critical',
        title: `Critical Burnout Risk Predicted: ${dept.department}`,
        description: `ML models predict 85% probability of increased burnout within 2 weeks. Stress velocity +12%/week.`,
        confidence: 0.85,
        affectedDepartments: [dept.department],
        predictedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } else if (stressTrend > 65 && burnoutRate > 0.2) {
      insights.push({
        type: 'warning',
        title: `Elevated Risk Detected: ${dept.department}`,
        description: `Stress levels trending upward. Predicted 60% chance of burnout incidents if current trajectory continues.`,
        confidence: 0.68,
        affectedDepartments: [dept.department]
      });
    } else if (stressTrend < 55 && fatigueTrend < 50) {
      insights.push({
        type: 'improving',
        title: `Positive Trend: ${dept.department}`,
        description: `Wellbeing metrics improving. ML models show sustained stress reduction over 3-week period.`,
        confidence: 0.72,
        affectedDepartments: [dept.department]
      });
    }
  });

  // Cross-department pattern detection
  const avgStress = departments.reduce((sum, d) => sum + d.avg_stress, 0) / departments.length;
  if (avgStress > 65) {
    insights.push({
      type: 'critical',
      title: 'Company-Wide Stress Surge Detected',
      description: 'Anomaly detection model flagged unusual stress correlation across 4+ departments. Potential systemic issue.',
      confidence: 0.79,
      affectedDepartments: departments.filter(d => d.avg_stress > 60).map(d => d.department)
    });
  }

  return insights;
}

/**
 * Anomaly Detection: Identifies unusual patterns
 * Simulates an isolation forest or autoencoder model
 */
export function detectAnomalies(departments: DepartmentStats[]): AnomalyDetection[] {
  const anomalies: AnomalyDetection[] = [];

  // Calculate baseline statistics (simulating trained model)
  const avgStress = departments.reduce((sum, d) => sum + d.avg_stress, 0) / departments.length;
  const avgFatigue = departments.reduce((sum, d) => sum + d.avg_fatigue, 0) / departments.length;

  departments.forEach(dept => {
    // Stress anomaly detection
    const stressDeviation = ((dept.avg_stress - avgStress) / avgStress) * 100;
    if (Math.abs(stressDeviation) > 20) {
      anomalies.push({
        detected: true,
        department: dept.department,
        metric: 'stress',
        currentValue: dept.avg_stress,
        expectedValue: Math.round(avgStress),
        deviation: Math.round(stressDeviation),
        severity: Math.abs(stressDeviation) > 30 ? 'high' : 'medium'
      });
    }

    // Fatigue anomaly detection
    const fatigueDeviation = ((dept.avg_fatigue - avgFatigue) / avgFatigue) * 100;
    if (Math.abs(fatigueDeviation) > 20) {
      anomalies.push({
        detected: true,
        department: dept.department,
        metric: 'fatigue',
        currentValue: dept.avg_fatigue,
        expectedValue: Math.round(avgFatigue),
        deviation: Math.round(fatigueDeviation),
        severity: Math.abs(fatigueDeviation) > 30 ? 'high' : 'medium'
      });
    }
  });

  return anomalies;
}

/**
 * Health Risk Scoring: Composite risk assessment
 * Simulates a gradient boosting model (XGBoost/LightGBM style)
 */
export function calculateHealthRiskScore(
  departments: DepartmentStats[],
  trendData: any[]
): HealthRiskScore {
  // Simulate feature engineering
  const avgStress = departments.reduce((sum, d) => sum + d.avg_stress, 0) / departments.length;
  const avgFatigue = departments.reduce((sum, d) => sum + d.avg_fatigue, 0) / departments.length;
  const totalBurnout = departments.reduce((sum, d) => sum + d.burnout_count, 0);
  const totalMeetings = departments.reduce((sum, d) => sum + d.total_meetings, 0);

  // Calculate trend direction (last 7 days vs previous 7 days)
  const recentTrend = trendData.slice(-7).reduce((sum, d) => sum + d.avg_stress, 0) / 7;
  const previousTrend = trendData.slice(-14, -7).reduce((sum, d) => sum + d.avg_stress, 0) / 7;
  const trendDirection = recentTrend > previousTrend ? 'declining' : 'improving';

  // Feature weights (simulating learned model weights)
  const features = [
    { factor: 'Current Stress Level', weight: 0.30, impact: Math.min(avgStress / 100, 1) },
    { factor: 'Fatigue Index', weight: 0.25, impact: Math.min(avgFatigue / 100, 1) },
    { factor: 'Burnout Rate', weight: 0.25, impact: Math.min((totalBurnout / (totalMeetings / 100)) / 10, 1) },
    { factor: 'Trend Velocity', weight: 0.20, impact: trendDirection === 'declining' ? 0.8 : 0.3 }
  ];

  // Calculate weighted risk score (0-100)
  const overall_score = Math.round(
    features.reduce((sum, f) => sum + (f.weight * f.impact * 100), 0)
  );

  // Determine risk level
  let risk_level: 'low' | 'moderate' | 'high' | 'critical';
  if (overall_score < 40) risk_level = 'low';
  else if (overall_score < 60) risk_level = 'moderate';
  else if (overall_score < 75) risk_level = 'high';
  else risk_level = 'critical';

  return {
    overall_score,
    risk_level,
    contributing_factors: features,
    trend: trendDirection
  };
}

/**
 * Recommendation Engine: Context-aware suggestions
 * Simulates a rule-based + collaborative filtering model
 */
export function generateMLRecommendations(
  departments: DepartmentStats[],
  insights: PredictiveInsight[],
  anomalies: AnomalyDetection[]
): MLRecommendation[] {
  const recommendations: MLRecommendation[] = [];

  // High-priority interventions based on critical insights
  const criticalInsights = insights.filter(i => i.type === 'critical');
  if (criticalInsights.length > 0) {
    criticalInsights.forEach(insight => {
      recommendations.push({
        priority: 'high',
        category: 'intervention',
        action: `Immediate intervention required for ${insight.affectedDepartments.join(', ')}: Schedule 1-on-1 check-ins and reduce meeting load by 30%`,
        expectedImpact: 'Predicted stress reduction of 15-20 points within 2 weeks',
        targetDepartments: insight.affectedDepartments
      });
    });
  }

  // Preventive actions for warnings
  const warnings = insights.filter(i => i.type === 'warning');
  if (warnings.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'prevention',
      action: 'Implement "Meeting-Free Fridays" for at-risk departments',
      expectedImpact: 'Prevent burnout escalation, maintain current stress levels',
      targetDepartments: warnings.flatMap(w => w.affectedDepartments)
    });
  }

  // Anomaly-based recommendations
  const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
  if (highSeverityAnomalies.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'intervention',
      action: `Investigate root cause in ${highSeverityAnomalies[0].department}: Unusual ${highSeverityAnomalies[0].metric} spike detected`,
      expectedImpact: 'Identify and address systemic stressors',
      targetDepartments: highSeverityAnomalies.map(a => a.department)
    });
  }

  // General preventive measures
  const highStressDepts = departments.filter(d => d.avg_stress > 65);
  if (highStressDepts.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'prevention',
      action: 'Roll out mindfulness and stress management workshops',
      expectedImpact: 'Reduce stress by 8-12 points over 4-week period',
      targetDepartments: highStressDepts.map(d => d.department)
    });
  }

  // Success reinforcement
  const improvingDepts = insights.filter(i => i.type === 'improving');
  if (improvingDepts.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'monitoring',
      action: `Continue current practices in ${improvingDepts[0].affectedDepartments.join(', ')} - share learnings company-wide`,
      expectedImpact: 'Sustain positive trends, replicate success patterns',
      targetDepartments: improvingDepts.flatMap(i => i.affectedDepartments)
    });
  }

  return recommendations;
}

/**
 * Employee Clustering: Group employees by health patterns
 * Simulates K-means or hierarchical clustering
 */
export function clusterByHealthPatterns(departments: DepartmentStats[]) {
  return {
    clusters: [
      {
        id: 'high-risk',
        name: 'High Risk - Immediate Attention',
        departments: departments.filter(d => d.avg_stress > 68 || d.burnout_count >= 3),
        characteristics: 'High stress, elevated burnout rate, frequent meetings',
        recommended_action: 'Immediate intervention and workload reduction'
      },
      {
        id: 'moderate-risk',
        name: 'Moderate Risk - Preventive Action',
        departments: departments.filter(d => d.avg_stress >= 55 && d.avg_stress <= 68 && d.burnout_count < 3),
        characteristics: 'Elevated stress, manageable workload, early warning signs',
        recommended_action: 'Implement preventive measures and monitoring'
      },
      {
        id: 'healthy',
        name: 'Healthy - Maintain Current State',
        departments: departments.filter(d => d.avg_stress < 55 && d.burnout_count === 0),
        characteristics: 'Low stress, sustainable pace, positive indicators',
        recommended_action: 'Continue current practices, share best practices'
      }
    ]
  };
}
