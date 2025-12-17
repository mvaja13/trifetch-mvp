import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ANALYSES_FILE = path.join(DATA_DIR, 'analyses.json');

export interface StoredAnalysis {
  id: string;
  createdAt: string;
  completedAt?: string;
  status: string;
  fileName: string;
  fileSize: number;
  duration: number;
  participantCount: number;
  meetingType: string;
  stressScore: number;
  fatigueIndex: number;
  cognitiveLoad: number;
  sentiment: string;
  burnoutRisk: string;
  timeline: Array<{
    timestamp: string;
    stress_level: number;
    engagement: number;
  }>;
  recommendations: string[];
  audioUrl?: string;
}

// Ensure data directory and file exist
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(ANALYSES_FILE)) {
    fs.writeFileSync(ANALYSES_FILE, JSON.stringify([], null, 2));
  }
}

// Read all analyses
export function readAnalyses(): StoredAnalysis[] {
  ensureDataFile();

  try {
    const data = fs.readFileSync(ANALYSES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading analyses:', error);
    return [];
  }
}

// Write all analyses
function writeAnalyses(analyses: StoredAnalysis[]) {
  ensureDataFile();
  fs.writeFileSync(ANALYSES_FILE, JSON.stringify(analyses, null, 2));
}

// Create a new analysis
export function createAnalysis(analysis: StoredAnalysis): StoredAnalysis {
  const analyses = readAnalyses();
  analyses.push(analysis);
  writeAnalyses(analyses);
  return analysis;
}

// Get analysis by ID
export function getAnalysisById(id: string): StoredAnalysis | null {
  const analyses = readAnalyses();
  return analyses.find(a => a.id === id) || null;
}

// Update analysis
export function updateAnalysis(id: string, updates: Partial<StoredAnalysis>): StoredAnalysis | null {
  const analyses = readAnalyses();
  const index = analyses.findIndex(a => a.id === id);

  if (index === -1) {
    return null;
  }

  analyses[index] = { ...analyses[index], ...updates };
  writeAnalyses(analyses);
  return analyses[index];
}

// Get recent analyses
export function getRecentAnalyses(limit: number = 10): StoredAnalysis[] {
  const analyses = readAnalyses();
  return analyses
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
