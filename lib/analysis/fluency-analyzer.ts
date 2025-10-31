/**
 * Fluency Analysis System
 *
 * This is a MOCK implementation for MVP.
 * Production version should use Google Cloud Speech-to-Text API
 * or similar speech recognition service.
 */

export interface FluencyAnalysisResult {
  speechRate: number;        // モーラ/秒 (mora per second)
  pauseFrequency: number;    // ポーズ/分 (pauses per minute)
  fillerCount: number;       // フィラーワード数 (total filler words)
  totalDuration: number;     // 秒 (total seconds)
  overallScore: number;      // 1-5 (overall rating)
}

/**
 * Generate random number within range
 */
function randomInRange(min: number, max: number, decimals: number = 1): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

/**
 * Calculate overall score based on individual metrics
 *
 * Scoring criteria:
 * - Speech Rate: Higher is better (2.5-4.0 モーラ/秒)
 * - Pause Frequency: Lower is better (5-15 ポーズ/分)
 * - Filler Count: Lower is better (3-20)
 *
 * Scale: 1-5
 * - 5: Excellent
 * - 4: Good
 * - 3: Average
 * - 2: Needs improvement
 * - 1: Needs significant work
 */
function calculateOverallScore(
  speechRate: number,
  pauseFrequency: number,
  fillerCount: number,
  totalDuration: number
): number {
  // Speech rate score (2.5-4.0 range, higher is better)
  const speechRateScore = (() => {
    if (speechRate >= 3.5) return 5;
    if (speechRate >= 3.2) return 4;
    if (speechRate >= 2.9) return 3;
    if (speechRate >= 2.6) return 2;
    return 1;
  })();

  // Pause frequency score (5-15 range, optimal is 7-10)
  const pauseScore = (() => {
    if (pauseFrequency >= 7 && pauseFrequency <= 10) return 5;
    if (pauseFrequency >= 6 && pauseFrequency <= 12) return 4;
    if (pauseFrequency >= 5 && pauseFrequency <= 14) return 3;
    if (pauseFrequency >= 4 || pauseFrequency <= 15) return 2;
    return 1;
  })();

  // Filler count score (normalized by duration)
  const fillersPerMinute = (fillerCount / totalDuration) * 60;
  const fillerScore = (() => {
    if (fillersPerMinute <= 0.5) return 5;
    if (fillersPerMinute <= 1.0) return 4;
    if (fillersPerMinute <= 1.5) return 3;
    if (fillersPerMinute <= 2.5) return 2;
    return 1;
  })();

  // Weighted average (speech rate is most important)
  const weightedScore =
    speechRateScore * 0.4 + pauseScore * 0.3 + fillerScore * 0.3;

  // Round to 1 decimal place
  return Number(weightedScore.toFixed(1));
}

/**
 * Mock fluency analysis
 *
 * In production, this would:
 * 1. Download video from videoUrl
 * 2. Extract audio track
 * 3. Send to Google Cloud Speech-to-Text API
 * 4. Analyze transcript for:
 *    - Speaking rate (mora per second)
 *    - Pause frequency and duration
 *    - Filler words (あの、えっと、まあ、そう、なんか)
 *    - Overall fluency score
 *
 * For MVP, we generate realistic mock data.
 */
export async function analyzeFluency(
  videoUrl: string,
  interviewId: string
): Promise<FluencyAnalysisResult> {
  console.log(`🔍 [Mock Analysis] Starting fluency analysis for interview ${interviewId}`);
  console.log(`   Video URL: ${videoUrl}`);

  // Simulate processing time (1-3 seconds)
  const processingTime = randomInRange(1000, 3000, 0);
  await new Promise((resolve) => setTimeout(resolve, processingTime));

  // Generate realistic mock duration (10-25 minutes)
  const totalDuration = Math.floor(randomInRange(600, 1500, 0)); // seconds

  // Generate mock metrics
  const speechRate = randomInRange(2.5, 4.0, 2); // モーラ/秒
  const pauseFrequency = randomInRange(5, 15, 1); // ポーズ/分
  const fillerCount = Math.floor(randomInRange(3, 20, 0)); // total count

  // Calculate overall score
  const overallScore = calculateOverallScore(
    speechRate,
    pauseFrequency,
    fillerCount,
    totalDuration
  );

  const result: FluencyAnalysisResult = {
    speechRate,
    pauseFrequency,
    fillerCount,
    totalDuration,
    overallScore,
  };

  console.log(`✅ [Mock Analysis] Analysis complete:`);
  console.log(`   Speech Rate: ${speechRate} モーラ/秒`);
  console.log(`   Pause Frequency: ${pauseFrequency} ポーズ/分`);
  console.log(`   Filler Count: ${fillerCount}`);
  console.log(`   Total Duration: ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s`);
  console.log(`   Overall Score: ${overallScore}/5`);

  return result;
}

/**
 * Get score interpretation
 */
export function getScoreInterpretation(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 4.0) {
    return {
      label: "優秀",
      color: "green",
      description: "非常に流暢で自然な話し方です。ビジネスシーンでも問題なく活躍できるレベルです。",
    };
  } else if (score >= 3.0) {
    return {
      label: "良好",
      color: "yellow",
      description: "基本的に流暢ですが、さらに改善の余地があります。",
    };
  } else if (score >= 2.0) {
    return {
      label: "要改善",
      color: "orange",
      description: "流暢性に課題があります。練習によって改善が期待できます。",
    };
  } else {
    return {
      label: "要強化",
      color: "red",
      description: "流暢性に大きな課題があります。集中的な練習が必要です。",
    };
  }
}

/**
 * Get benchmark data for comparison
 */
export function getBenchmarkData(): {
  speechRate: { min: number; max: number; avg: number };
  pauseFrequency: { min: number; max: number; avg: number };
  fillerCount: { min: number; max: number; avg: number };
  overallScore: { min: number; max: number; avg: number };
} {
  return {
    speechRate: { min: 2.5, max: 4.0, avg: 3.2 },
    pauseFrequency: { min: 5, max: 15, avg: 8.5 },
    fillerCount: { min: 3, max: 20, avg: 10 },
    overallScore: { min: 1, max: 5, avg: 3.5 },
  };
}

/**
 * Production implementation placeholder
 *
 * Example with Google Cloud Speech-to-Text:
 *
 * import speech from '@google-cloud/speech';
 * import ffmpeg from 'fluent-ffmpeg';
 *
 * async function analyzeWithGoogleAPI(videoUrl: string) {
 *   // 1. Extract audio from video
 *   const audioBuffer = await extractAudio(videoUrl);
 *
 *   // 2. Send to Speech-to-Text API
 *   const client = new speech.SpeechClient();
 *   const [response] = await client.recognize({
 *     config: {
 *       encoding: 'LINEAR16',
 *       sampleRateHertz: 16000,
 *       languageCode: 'ja-JP',
 *       enableWordTimeOffsets: true,
 *       enableAutomaticPunctuation: true,
 *     },
 *     audio: { content: audioBuffer },
 *   });
 *
 *   // 3. Analyze transcript
 *   const transcript = response.results
 *     .map(result => result.alternatives[0])
 *     .join(' ');
 *
 *   // 4. Calculate metrics
 *   const speechRate = calculateSpeechRate(response);
 *   const pauseFrequency = calculatePauses(response);
 *   const fillerCount = countFillers(transcript);
 *
 *   return { speechRate, pauseFrequency, fillerCount };
 * }
 */
