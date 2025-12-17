export interface IntakeSummary {
  chief_concern: string;
  duration: string;
  key_symptoms: string[];
  red_flags: string[];
  triage: 'emergency' | 'high' | 'moderate' | 'low';
  follow_up_questions: string[];
  possible_causes: string[];
  hpi: string;
}

export interface SummarizeRequest {
  raw_text: string;
  age_months?: number;
  temp_c?: number;
  attachments?: string[];
}

export interface IntakeRecord {
  id: string;
  raw_text: string;
  age_months?: number;
  temp_c?: number;
  summary: IntakeSummary;
  notes: string;
  created_at: string;
}
