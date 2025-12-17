import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { v4 as uuidv4 } from 'uuid';
import InputForm from '@/components/InputForm';
import SummaryCard from '@/components/SummaryCard';
import Timeline from '@/components/Timeline';
import { augmentSummary } from '@/lib/ruleEngine';
import { getIntakes, saveIntake, updateIntakeNotes } from '@/lib/storage';
import type { IntakeSummary, IntakeRecord } from '@/types';

// Set to true to use mock endpoint (no API key needed)
const USE_MOCK = false;

interface PrefillData {
  rawText: string;
  ageMonths: string;
  tempC: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIntake, setCurrentIntake] = useState<IntakeRecord | null>(null);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [prefillData, setPrefillData] = useState<PrefillData | null>(null);

  // Load intakes from localStorage on mount
  useEffect(() => {
    setIntakes(getIntakes());
  }, []);

  const handleSubmit = async (data: {
    rawText: string;
    ageMonths?: number;
    tempC?: number;
    imageFile?: File;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = USE_MOCK ? '/api/mock-summarize' : '/api/summarize';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_text: data.rawText,
          age_months: data.ageMonths,
          temp_c: data.tempC,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const summary: IntakeSummary = await response.json();

      // Apply rule engine to augment the summary
      const augmentedSummary = augmentSummary(summary, data.rawText);

      // Create intake record
      const record: IntakeRecord = {
        id: uuidv4(),
        raw_text: data.rawText,
        age_months: data.ageMonths,
        temp_c: data.tempC,
        summary: augmentedSummary,
        notes: '',
        created_at: new Date().toISOString(),
      };

      // Save to localStorage
      saveIntake(record);

      // Update state
      setCurrentIntake(record);
      setIntakes(getIntakes());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectIntake = (intake: IntakeRecord) => {
    setCurrentIntake(intake);
    setError(null);
  };

  const handleNotesChange = useCallback((notes: string) => {
    if (!currentIntake) return;

    // Update localStorage
    updateIntakeNotes(currentIntake.id, notes);

    // Update current intake state
    setCurrentIntake(prev => prev ? { ...prev, notes } : null);

    // Refresh intakes list
    setIntakes(getIntakes());
  }, [currentIntake]);

  return (
    <>
      <Head>
        <title>Blueberry Co-Pilot — Intake Demo</title>
        <meta name="description" content="Pediatric clinical intake assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/80 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Intake</h1>
                  <p className="text-xs text-slate-600 font-medium">AI-Powered Patient Assessment</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-slate-600 font-medium">Gemini AI</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Input Form */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 p-7 sticky top-24 hover:shadow-xl transition-shadow duration-300">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Patient Information
                </h2>
                <InputForm onSubmit={handleSubmit} isLoading={isLoading} prefillData={prefillData} />

                {/* Demo Cases */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest mb-3">Sample Cases</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPrefillData({
                          rawText: "My 3-year-old has had a runny nose and cough for 4 days, low fever last night (100.8F), still eating okay but less than usual. No breathing problems.",
                          ageMonths: "36",
                          tempC: "38.2"
                        });
                      }}
                      className="w-full text-left text-xs px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg font-medium transition-colors border border-blue-200"
                    >
                      URI with Fever
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrefillData({
                          rawText: "My 6-month-old baby is breathing very fast and pulling in between ribs, not feeding well, and had temperature 103F last night. Very sleepy.",
                          ageMonths: "6",
                          tempC: "39.4"
                        });
                      }}
                      className="w-full text-left text-xs px-4 py-3 bg-red-50 hover:bg-red-100 text-red-900 rounded-lg font-medium transition-colors border border-red-200"
                    >
                      Respiratory Distress
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Summary Card */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 p-8 min-h-[600px] hover:shadow-xl transition-shadow duration-300">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="font-semibold text-red-900">Error</p>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isLoading ? (
                      <div className="flex items-center justify-center h-80">
                        <div className="text-center">
                          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <p className="text-slate-600 font-medium">Analyzing patient intake...</p>
                        </div>
                      </div>
                    ) : currentIntake ? (
                      <SummaryCard
                        summary={currentIntake.summary}
                        notes={currentIntake.notes}
                        onNotesChange={handleNotesChange}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-80 text-center">
                        <div>
                          <svg className="w-20 h-20 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-slate-600 font-medium text-lg">No Assessment Yet</p>
                          <p className="text-slate-500 text-sm mt-2">Enter patient information to generate an assessment</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300 sticky top-24 max-h-[calc(100vh-120px)] overflow-hidden">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      History
                    </h3>
                    <Timeline
                      intakes={intakes}
                      selectedId={currentIntake?.id}
                      onSelect={handleSelectIntake}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white mt-12">
          <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs text-slate-500 font-medium">
            <p>Clinical assessment tool for demonstration purposes only. Do not use with real patient data.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
