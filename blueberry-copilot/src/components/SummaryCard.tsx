import { useState, useEffect, useRef } from 'react';
import type { IntakeSummary } from '@/types';

interface SummaryCardProps {
  summary: IntakeSummary;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const TRIAGE_COLORS = {
  emergency: 'bg-red-600 text-white shadow-lg shadow-red-200',
  high: 'bg-orange-600 text-white shadow-lg shadow-orange-200',
  moderate: 'bg-amber-500 text-white shadow-lg shadow-amber-200',
  low: 'bg-green-600 text-white shadow-lg shadow-green-200',
};

const TRIAGE_LABELS = {
  emergency: 'EMERGENCY',
  high: 'HIGH PRIORITY',
  moderate: 'MODERATE',
  low: 'LOW PRIORITY',
};

export default function SummaryCard({ summary, notes, onNotesChange }: SummaryCardProps) {
  const [copiedHpi, setCopiedHpi] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [checkedQuestions, setCheckedQuestions] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play alert sound for emergency triage
  useEffect(() => {
    if (summary.triage === 'emergency') {
      // Create a simple beep sound
      try {
        const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 200);
      } catch {
        // Audio not supported
      }
    }
  }, [summary.triage]);

  const copyToClipboard = async (text: string, type: 'hpi' | 'full') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'hpi') {
        setCopiedHpi(true);
        setTimeout(() => setCopiedHpi(false), 2000);
      } else {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 2000);
      }
    } catch {
      console.error('Failed to copy');
    }
  };

  const getFullSummaryText = () => {
    return `Chief Concern: ${summary.chief_concern}
Duration: ${summary.duration}
Triage: ${summary.triage.toUpperCase()}

Key Symptoms:
${summary.key_symptoms.map(s => `- ${s}`).join('\n')}

Red Flags:
${summary.red_flags.length > 0 ? summary.red_flags.map(f => `- ${f}`).join('\n') : '- None identified'}

Follow-Up Questions:
${summary.follow_up_questions.map(q => `- ${q}`).join('\n')}

Possible Causes:
${summary.possible_causes.map(c => `- ${c}`).join('\n')}

HPI:
${summary.hpi}`;
  };

  const toggleQuestion = (index: number) => {
    const newChecked = new Set(checkedQuestions);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedQuestions(newChecked);
  };

  return (
    <div className="space-y-6">
      {/* Chief Concern & Triage */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Chief Concern</h3>
          <p className="text-3xl font-bold text-slate-900">{summary.chief_concern}</p>
          <p className="text-sm text-slate-600 mt-2">Duration: <span className="font-medium text-slate-900">{summary.duration}</span></p>
        </div>
        <div className={`px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap ${TRIAGE_COLORS[summary.triage]} ${summary.triage === 'emergency' ? 'animate-pulse' : ''}`}>
          {TRIAGE_LABELS[summary.triage]}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4"></div>

      {/* Red Flags */}
      {summary.red_flags.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-red-900 flex items-center gap-2 mb-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Critical Alerts
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.red_flags.map((flag, i) => (
              <span key={i} className="px-3 py-1 bg-red-100 text-red-900 rounded-full text-xs font-semibold">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Symptoms */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Key Symptoms</h4>
        <ul className="grid grid-cols-1 gap-2">
          {summary.key_symptoms.map((symptom, i) => (
            <li key={i} className="flex items-center gap-2 text-slate-700">
              <span className="flex-shrink-0 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              {symptom}
            </li>
          ))}
        </ul>
      </div>

      {/* Follow-Up Questions */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Follow-Up Questions</h4>
        <div className="space-y-2">
          {summary.follow_up_questions.map((question, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={checkedQuestions.has(i)}
                onChange={() => toggleQuestion(i)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-slate-700 text-sm ${checkedQuestions.has(i) ? 'line-through text-slate-400' : ''}`}>
                {question}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Possible Causes */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Possible Causes</h4>
        <div className="flex flex-wrap gap-2">
          {summary.possible_causes.map((cause, i) => (
            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-sm font-medium">
              {cause}
            </span>
          ))}
        </div>
      </div>

      {/* HPI */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-blue-900">History of Present Illness</h4>
          <button
            onClick={() => copyToClipboard(summary.hpi, 'hpi')}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 font-medium"
          >
            {copiedHpi ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <p className="text-slate-800 text-sm leading-relaxed">{summary.hpi}</p>
      </div>

      {/* Copy Full Summary */}
      <button
        onClick={() => copyToClipboard(getFullSummaryText(), 'full')}
        className="w-full py-2.5 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
      >
        {copiedFull ? (
          <>
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Assessment Copied!
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Full Assessment
          </>
        )}
      </button>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-semibold text-slate-900 mb-2">
          Clinical Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add clinical notes here..."
          className="w-full h-20 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-slate-900 placeholder-slate-400"
        />
      </div>
    </div>
  );
}
