import { useState, useRef, useEffect } from 'react';

interface PrefillData {
  rawText: string;
  ageMonths: string;
  tempC: string;
}

interface InputFormProps {
  onSubmit: (data: {
    rawText: string;
    ageMonths?: number;
    tempC?: number;
    imageFile?: File;
  }) => void;
  isLoading: boolean;
  prefillData?: PrefillData | null;
}

export default function InputForm({ onSubmit, isLoading, prefillData }: InputFormProps) {
  const [rawText, setRawText] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [tempC, setTempC] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle prefill data from parent
  useEffect(() => {
    if (prefillData) {
      setRawText(prefillData.rawText);
      setAgeMonths(prefillData.ageMonths);
      setTempC(prefillData.tempC);
    }
  }, [prefillData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    onSubmit({
      rawText: rawText.trim(),
      ageMonths: ageMonths ? parseInt(ageMonths, 10) : undefined,
      tempC: tempC ? parseFloat(tempC) : undefined,
      imageFile: imageFile || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="rawText" className="block text-sm font-semibold text-slate-900 mb-2">
          Chief Complaint
        </label>
        <textarea
          id="rawText"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Describe the patient's main concern and relevant symptoms..."
          className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-slate-900 placeholder-slate-400"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ageMonths" className="block text-sm font-semibold text-slate-900 mb-2">
            Age (months)
          </label>
          <input
            id="ageMonths"
            type="number"
            min="0"
            max="216"
            value={ageMonths}
            onChange={(e) => setAgeMonths(e.target.value)}
            placeholder="0–216"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="tempC" className="block text-sm font-semibold text-slate-900 mb-2">
            Temperature (°C)
          </label>
          <input
            id="tempC"
            type="number"
            step="0.1"
            min="35"
            max="43"
            value={tempC}
            onChange={(e) => setTempC(e.target.value)}
            placeholder="35–43"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-900 placeholder-slate-400"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">
          Attachment (optional)
        </label>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer"
            disabled={isLoading}
          />
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-16 w-16 object-cover rounded-lg border border-slate-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-slate-800 shadow-sm"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !rawText.trim()}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
            <span>Generating Assessment...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Generate Assessment</span>
          </>
        )}
      </button>
    </form>
  );
}
