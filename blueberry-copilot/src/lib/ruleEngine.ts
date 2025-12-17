import type { IntakeSummary } from '@/types';

interface KeywordFlag {
  k: string[];
  flag: string;
}

const KEYWORD_FLAGS: KeywordFlag[] = [
  {
    k: ["breathing fast", "fast breathing", "breathing difficulty", "difficulty breathing", "retractions", "grunting", "apnea"],
    flag: "respiratory distress"
  },
  {
    k: ["blue", "cyanosis", "bluish"],
    flag: "cyanosis"
  },
  {
    k: ["seizure", "convulsion", "jerking"],
    flag: "seizures"
  },
  {
    k: ["very sleepy", "unresponsive", "hard to wake", "lethargic"],
    flag: "unresponsive/poor responsiveness"
  },
  {
    k: ["not drinking", "not feeding", "dehydrated", "few wet diapers"],
    flag: "poor intake/dehydration"
  },
  {
    k: ["stridor", "drooling", "difficulty swallowing"],
    flag: "airway compromise"
  }
];

const EMERGENCY_FLAGS = new Set([
  "respiratory distress",
  "cyanosis",
  "seizures",
  "airway compromise"
]);

export function detectRuleFlags(text: string): string[] {
  const lc = text.toLowerCase();
  const found = new Set<string>();

  KEYWORD_FLAGS.forEach(entry => {
    for (const kw of entry.k) {
      if (lc.includes(kw)) {
        found.add(entry.flag);
        break;
      }
    }
  });

  return Array.from(found);
}

export function escalateTriage(
  currentTriage: IntakeSummary['triage'],
  ruleFlags: string[]
): IntakeSummary['triage'] {
  // Check for emergency-level flags
  const hasEmergencyFlag = ruleFlags.some(flag => EMERGENCY_FLAGS.has(flag));
  if (hasEmergencyFlag) {
    return 'emergency';
  }

  // If any rule flags exist, ensure at least "high"
  if (ruleFlags.length > 0) {
    if (currentTriage === 'low' || currentTriage === 'moderate') {
      return 'high';
    }
  }

  return currentTriage;
}

export function augmentSummary(
  summary: IntakeSummary,
  rawText: string
): IntakeSummary {
  const ruleFlags = detectRuleFlags(rawText);

  // Merge flags uniquely
  const allFlags = Array.from(new Set([...summary.red_flags, ...ruleFlags]));

  // Escalate triage if needed
  const escalatedTriage = escalateTriage(summary.triage, ruleFlags);

  return {
    ...summary,
    red_flags: allFlags,
    triage: escalatedTriage
  };
}
