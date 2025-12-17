export interface TimelinePoint {
  minute: number;
  stress_level: number;
  cognitive_load: number;
}

export interface AnalysisResult {
  analysis_id: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  meeting_metadata: {
    duration_minutes: number;
    participant_count: number;
    meeting_type: string;
  };
  biomarkers: {
    stress_score: number;
    fatigue_index: number;
    cognitive_load: number;
    meeting_sentiment: 'positive' | 'neutral' | 'negative';
    burnout_risk: 'low' | 'moderate' | 'high';
  };
  timeline: TimelinePoint[];
  recommendations: string[];
}

export interface AnalysisRequest {
  audio_file: File;
  meeting_metadata?: {
    duration_minutes?: number;
    participant_count?: number;
    meeting_type?: string;
  };
}

export interface DepartmentStats {
  department: string;
  avg_stress: number;
  avg_fatigue: number;
  burnout_count: number;
  total_meetings: number;
}
