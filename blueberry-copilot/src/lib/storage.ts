import type { IntakeRecord } from '@/types';

const STORAGE_KEY = 'blueberry_intakes';
const MAX_RECORDS = 5;

export function getIntakes(): IntakeRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as IntakeRecord[];
  } catch {
    return [];
  }
}

export function saveIntake(record: IntakeRecord): void {
  if (typeof window === 'undefined') return;

  const intakes = getIntakes();

  // Add new record at the beginning
  intakes.unshift(record);

  // Keep only the last MAX_RECORDS
  const trimmed = intakes.slice(0, MAX_RECORDS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function updateIntakeNotes(id: string, notes: string): void {
  if (typeof window === 'undefined') return;

  const intakes = getIntakes();
  const index = intakes.findIndex(r => r.id === id);

  if (index !== -1) {
    intakes[index].notes = notes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(intakes));
  }
}

export function getIntakeById(id: string): IntakeRecord | undefined {
  const intakes = getIntakes();
  return intakes.find(r => r.id === id);
}
