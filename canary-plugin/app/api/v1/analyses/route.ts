import { NextRequest, NextResponse } from 'next/server';
import { createAnalysis, getRecentAnalyses, updateAnalysis } from '@/lib/storage';
import { parseBuffer } from 'music-metadata';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio_file') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Parse audio metadata to get duration
    let durationSeconds = Math.floor(Math.random() * 2700) + 900; // Default: 15-60 minutes in seconds

    try {
      const buffer = Buffer.from(await audioFile.arrayBuffer());
      const metadata = await parseBuffer(buffer, { mimeType: audioFile.type });
      if (metadata.format.duration) {
        durationSeconds = Math.floor(metadata.format.duration);
        // If audio is too short (< 30 seconds), use mock duration for demo
        if (durationSeconds < 30) {
          durationSeconds = Math.floor(Math.random() * 2700) + 900; // 15-60 minutes
        }
      }
    } catch (error) {
      console.log('Could not parse audio metadata, using random duration');
    }

    // Generate biomarker data
    const stressScore = Math.floor(Math.random() * 40) + 30;
    const fatigueIndex = Math.floor(Math.random() * 50) + 25;
    const cognitiveLoad = Math.floor(Math.random() * 45) + 30;

    const sentiments = ['positive', 'neutral', 'negative'] as const;
    const sentiment = stressScore > 70 ? 'negative' : stressScore > 50 ? 'neutral' : sentiments[Math.floor(Math.random() * sentiments.length)];

    const burnoutRisk = stressScore > 70 && fatigueIndex > 70 ? 'high' :
                        stressScore > 50 || fatigueIndex > 60 ? 'moderate' : 'low';

    const participantCount = Math.floor(Math.random() * 10) + 3;
    const meetingTypes = ['standup', 'planning', 'review', 'all-hands'];
    const meetingType = meetingTypes[Math.floor(Math.random() * meetingTypes.length)];

    // Generate timeline (sample every 30 seconds for better visualization)
    const sampleInterval = 30; // seconds
    const numSamples = Math.floor(durationSeconds / sampleInterval);
    const timeline = Array.from({ length: numSamples }, (_, i) => {
      const seconds = i * sampleInterval;
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return {
        timestamp: `${minutes}:${String(secs).padStart(2, '0')}`,
        stress_level: Math.max(20, Math.min(100, stressScore + (Math.random() - 0.5) * 30)),
        engagement: Math.floor(Math.random() * 40) + 60
      };
    });

    // Generate recommendations
    const recommendations: string[] = [];
    if (stressScore > 70) {
      recommendations.push('Consider scheduling breaks between meetings');
      recommendations.push('High stress detected - recommend wellness check-in');
    }
    if (fatigueIndex > 70) {
      recommendations.push('Team showing signs of fatigue - reduce meeting frequency');
    }
    if (cognitiveLoad > 75) {
      recommendations.push('High cognitive load - simplify meeting agenda');
    }
    if (recommendations.length === 0) {
      recommendations.push('Team wellbeing metrics within healthy range');
    }

    // Save to JSON storage
    const analysisId = randomUUID();
    const analysis = createAnalysis({
      id: analysisId,
      createdAt: new Date().toISOString(),
      status: 'processing',
      fileName: audioFile.name,
      fileSize: audioFile.size,
      duration: durationSeconds, // Store in seconds
      participantCount,
      meetingType,
      stressScore,
      fatigueIndex,
      cognitiveLoad,
      sentiment,
      burnoutRisk,
      timeline,
      recommendations,
    });

    // Simulate processing delay
    setTimeout(() => {
      updateAnalysis(analysisId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
    }, 5000);

    return NextResponse.json({
      analysis_id: analysis.id,
      status: 'processing',
      message: 'Audio file received and processing started',
      estimated_completion_seconds: 5
    }, { status: 202 });
  } catch (error) {
    console.error('Error processing audio upload:', error);
    return NextResponse.json(
      { error: 'Failed to process audio file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const analyses = getRecentAnalyses(10);
    return NextResponse.json(analyses);
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}
