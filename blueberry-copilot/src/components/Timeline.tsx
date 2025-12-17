import type { IntakeRecord } from '@/types';

interface TimelineProps {
  intakes: IntakeRecord[];
  selectedId?: string;
  onSelect: (intake: IntakeRecord) => void;
}

const TRIAGE_DOT_COLORS = {
  emergency: 'bg-red-600',
  high: 'bg-orange-600',
  moderate: 'bg-amber-500',
  low: 'bg-green-600',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export default function Timeline({ intakes, selectedId, onSelect }: TimelineProps) {
  if (intakes.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-slate-500 text-sm font-medium">No history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {intakes.map((intake) => (
          <button
            key={intake.id}
            onClick={() => onSelect(intake)}
            className={`w-full text-left p-3 rounded-xl border transition-all ${
              selectedId === intake.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${TRIAGE_DOT_COLORS[intake.summary.triage]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className={`font-semibold text-xs truncate ${selectedId === intake.id ? 'text-blue-900' : 'text-slate-900'}`}>
                    {intake.summary.chief_concern}
                  </p>
                  <span className="text-[10px] text-slate-500 flex-shrink-0 font-medium">
                    {formatDate(intake.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {truncateText(intake.raw_text, 50)}
                </p>
                {intake.age_months && (
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium">
                      {intake.age_months}mo
                    </span>
                    {intake.temp_c && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium">
                        {intake.temp_c}°C
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
