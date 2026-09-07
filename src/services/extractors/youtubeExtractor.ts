/**
 * YouTube Source Validator & Metadata Extractor
 * Safely extracts Video ID, high-resolution thumbnail, and embeds without illegal downloading.
 * Provides a clean transcript integration point for Part 03 without faking captions.
 */

import { SourceSegment } from '../../types/project';

export interface YouTubeValidationResult {
  isValid: boolean;
  videoId?: string;
  normalizedUrl?: string;
  thumbnailUrl?: string;
  embedUrl?: string;
  error?: string;
}

export function validateYouTubeUrl(inputUrl: string): YouTubeValidationResult {
  const cleanUrl = inputUrl.trim();
  if (!cleanUrl) {
    return { isValid: false, error: 'Please enter a YouTube video URL.' };
  }

  // Common YouTube URL regex (watch?v=, youtu.be/, shorts/, embed/)
  const ytRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/i;
  const match = cleanUrl.match(ytRegex);

  if (!match || !match[1]) {
    return {
      isValid: false,
      error: 'Invalid YouTube URL. Examples: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID',
    };
  }

  const videoId = match[1];
  return {
    isValid: true,
    videoId,
    normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
  };
}

export interface YouTubeExtractionResult {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  segments: SourceSegment[];
  hasTranscript: boolean;
  statusMessage: string;
}

export async function extractYouTube(
  sourceId: string,
  url: string,
  customTitle?: string,
  userSuppliedTranscript?: string
): Promise<YouTubeExtractionResult> {
  const validation = validateYouTubeUrl(url);
  if (!validation.isValid || !validation.videoId) {
    throw new Error(validation.error || 'Invalid YouTube video URL.');
  }

  const videoId = validation.videoId;
  const displayTitle = customTitle?.trim() || `YouTube Video (${videoId})`;
  const segments: SourceSegment[] = [];

  let hasTranscript = false;
  let statusMessage = 'YouTube video reference validated and stored.';

  if (userSuppliedTranscript && userSuppliedTranscript.trim()) {
    hasTranscript = true;
    const lines = userSuppliedTranscript.trim().split(/\n+/);
    lines.forEach((line, idx) => {
      // Check if line starts with timestamp like [01:23] or 01:23
      const timeMatch = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(.*)$/);
      const timestamp = timeMatch ? timeMatch[1] : undefined;
      const text = timeMatch ? timeMatch[2] : line;

      segments.push({
        segmentId: `${sourceId}_yt_${idx + 1}`,
        sourceId,
        location: timestamp ? `Timestamp ${timestamp}` : `Segment ${idx + 1}`,
        timestamp,
        heading: timestamp ? `At ${timestamp}` : undefined,
        text: text.trim(),
      });
    });
    statusMessage = `YouTube video registered with ${segments.length} timestamped transcript segment(s).`;
  } else {
    // Default reference segment (No fake transcripts)
    segments.push({
      segmentId: `${sourceId}_yt_ref`,
      sourceId,
      location: 'Video Reference',
      heading: displayTitle,
      text: `YouTube reference: ${validation.normalizedUrl}. Video ID: ${videoId}. Ready for Gemini YouTube grounding in Part 03.`,
    });
    statusMessage = 'YouTube video verified. Transcripts will be linked via the Part 03 AI engine.';
  }

  return {
    videoId,
    title: displayTitle,
    thumbnailUrl: validation.thumbnailUrl || '',
    segments,
    hasTranscript,
    statusMessage,
  };
}
