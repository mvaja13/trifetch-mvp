import type { NextApiRequest, NextApiResponse } from 'next';
import type { IntakeSummary, SummarizeRequest } from '@/types';

const MOCK_RESPONSES: Record<string, IntakeSummary> = {
  moderate: {
    chief_concern: "URI with low-grade fever",
    duration: "4 days",
    key_symptoms: [
      "runny nose",
      "cough",
      "low fever 38.2°C",
      "decreased appetite",
      "no respiratory distress"
    ],
    red_flags: [],
    triage: "moderate",
    follow_up_questions: [
      "Any difficulty breathing or fast breathing?",
      "Is the child drinking fluids well?",
      "Any ear pain or tugging at ears?",
      "Any rash or skin changes?",
      "How many wet diapers in the last 24 hours?"
    ],
    possible_causes: [
      "viral upper respiratory infection",
      "early otitis media",
      "allergic rhinitis"
    ],
    hpi: "3-year-old presents with 4 days of coryza and cough, low-grade fever (38.2°C), and mildly decreased oral intake; no respiratory distress noted, eating but less than usual."
  },
  emergency: {
    chief_concern: "fast breathing & poor feeding",
    duration: "1 day",
    key_symptoms: [
      "tachypnea",
      "intercostal retractions",
      "poor feeding",
      "fever 39.4°C",
      "lethargy"
    ],
    red_flags: [
      "respiratory distress",
      "poor intake/dehydration",
      "unresponsive/poor responsiveness"
    ],
    triage: "emergency",
    follow_up_questions: [
      "Is there any blueness around lips or face?",
      "Number of wet diapers in last 12 hours?",
      "Is the baby responsive to voice or touch?",
      "Any grunting sounds with breathing?",
      "Has there been any vomiting?"
    ],
    possible_causes: [
      "bronchiolitis",
      "pneumonia",
      "viral URI with dehydration"
    ],
    hpi: "Infant, 6 months, presenting with 1 day of rapid breathing with intercostal retractions, decreased oral intake, and fever 39.4°C; appears lethargic. Recommend urgent evaluation for respiratory compromise and dehydration."
  }
};

function selectMockResponse(rawText: string, ageMonths?: number, tempC?: number): IntakeSummary {
  const text = rawText.toLowerCase();

  // Check for emergency indicators
  const emergencyKeywords = [
    'breathing fast', 'fast breathing', 'retractions', 'pulling in',
    'not feeding', 'very sleepy', 'lethargic', 'blue', 'seizure',
    'unresponsive', 'hard to wake'
  ];

  const hasEmergencyKeyword = emergencyKeywords.some(kw => text.includes(kw));
  const isYoungInfantWithFever = ageMonths !== undefined && ageMonths <= 6 && tempC !== undefined && tempC >= 38.5;

  if (hasEmergencyKeyword || isYoungInfantWithFever) {
    return MOCK_RESPONSES.emergency;
  }

  return MOCK_RESPONSES.moderate;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { raw_text, age_months, temp_c } = req.body as SummarizeRequest;

  if (!raw_text || typeof raw_text !== 'string') {
    return res.status(400).json({ error: 'raw_text is required' });
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const response = selectMockResponse(raw_text, age_months, temp_c);
  return res.status(200).json(response);
}
