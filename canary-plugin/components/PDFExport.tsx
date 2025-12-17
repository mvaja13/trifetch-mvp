'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult } from '@/types/analysis';

interface PDFExportProps {
  analysis: AnalysisResult;
}

export default function PDFExport({ analysis }: PDFExportProps) {
  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Blue
    doc.text('Canary Wellbeing Insights', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // Gray
    doc.text('Meeting Analysis Report', 20, 28);

    // Analysis ID and Date
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Analysis ID: ${analysis.analysis_id}`, 20, 38);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 44);

    // Meeting Metadata Section
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('Meeting Information', 20, 56);

    const meetingData = [
      ['Duration', `${analysis.meeting_metadata.duration_minutes} minutes`],
      ['Participants', `${analysis.meeting_metadata.participant_count} people`],
      ['Meeting Type', analysis.meeting_metadata.meeting_type],
      ['Date', new Date(analysis.created_at).toLocaleDateString()],
    ];

    autoTable(doc, {
      startY: 60,
      head: [],
      body: meetingData,
      theme: 'plain',
      styles: { fontSize: 10 },
      margin: { left: 20 }
    });

    // Biomarker Scores Section
    const currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Biomarker Scores', 20, currentY);

    const biomarkerData = [
      ['Stress Score', `${analysis.biomarkers.stress_score}`, getScoreLevel(analysis.biomarkers.stress_score)],
      ['Fatigue Index', `${analysis.biomarkers.fatigue_index}`, getScoreLevel(analysis.biomarkers.fatigue_index)],
      ['Cognitive Load', `${analysis.biomarkers.cognitive_load}`, getScoreLevel(analysis.biomarkers.cognitive_load)],
      ['Meeting Sentiment', analysis.biomarkers.meeting_sentiment.toUpperCase(), '-'],
      ['Burnout Risk', analysis.biomarkers.burnout_risk.toUpperCase(), '-'],
    ];

    autoTable(doc, {
      startY: currentY + 4,
      head: [['Metric', 'Score', 'Level']],
      body: biomarkerData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
      styles: { fontSize: 10 },
      margin: { left: 20 }
    });

    // Recommendations Section
    const recY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Recommendations', 20, recY);

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    let textY = recY + 6;
    analysis.recommendations.forEach((rec, index) => {
      const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 170);
      doc.text(lines, 20, textY);
      textY += lines.length * 5;
    });

    // Timeline Summary
    if (textY < 250) {
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Timeline Summary', 20, textY + 4);

      const peakStress = Math.max(...analysis.timeline.map(t => t.stress_level));
      const avgStress = analysis.timeline.reduce((sum, t) => sum + t.stress_level, 0) / analysis.timeline.length;
      const peakCognitive = Math.max(...analysis.timeline.map(t => t.cognitive_load));

      const timelineData = [
        ['Peak Stress Level', `${peakStress.toFixed(0)}`],
        ['Average Stress Level', `${avgStress.toFixed(0)}`],
        ['Peak Cognitive Load', `${peakCognitive.toFixed(0)}`],
      ];

      autoTable(doc, {
        startY: textY + 8,
        head: [],
        body: timelineData,
        theme: 'plain',
        styles: { fontSize: 10 },
        margin: { left: 20 }
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        'Generated with Canary Wellbeing Insights',
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    doc.save(`canary-analysis-${analysis.analysis_id.slice(0, 8)}.pdf`);
  };

  const getScoreLevel = (score: number): string => {
    if (score >= 70) return 'HIGH';
    if (score >= 50) return 'MODERATE';
    return 'HEALTHY';
  };

  return (
    <button
      onClick={generatePDF}
      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
      </svg>
      Export PDF Report
    </button>
  );
}
