import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisById } from '@/lib/storage';
import { AnalysisResult } from '@/types/analysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const analysis = getAnalysisById(id);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Transform storage record to API format
    const result: AnalysisResult = {
      analysis_id: analysis.id,
      status: analysis.status as 'processing' | 'completed' | 'failed',
      created_at: analysis.createdAt,
      completed_at: analysis.completedAt,
      meeting_metadata: {
        duration_minutes: Math.floor(analysis.duration / 60),
        participant_count: analysis.participantCount,
        meeting_type: analysis.meetingType
      },
      biomarkers: {
        stress_score: analysis.stressScore,
        fatigue_index: analysis.fatigueIndex,
        cognitive_load: analysis.cognitiveLoad,
        meeting_sentiment: analysis.sentiment as 'positive' | 'neutral' | 'negative',
        burnout_risk: analysis.burnoutRisk as 'low' | 'moderate' | 'high'
      },
      timeline: analysis.timeline,
      recommendations: analysis.recommendations
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}
