/**
 * Text / Notes Extractor
 * Processes pasted notes, lesson transcripts, and textbook raw text into segmented paragraphs.
 */

import { SourceSegment, SupportedLanguage } from '../../types/project';

export interface TextExtractionResult {
  title: string;
  extractedText: string;
  language: SupportedLanguage;
  segments: SourceSegment[];
  wordCount: number;
  characterCount: number;
  statusMessage: string;
}

export function extractTextNotes(
  sourceId: string,
  title: string,
  content: string,
  language: SupportedLanguage = 'en'
): TextExtractionResult {
  const cleanTitle = title.trim() || 'Teacher Notes';
  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new Error('Note content cannot be empty. Please enter lesson or note text.');
  }

  const rawParagraphs = cleanContent.split(/\n\s*\n/).filter(Boolean);
  const segments: SourceSegment[] = [];
  let totalWords = 0;

  rawParagraphs.forEach((para, index) => {
    const words = para.split(/\s+/).filter(Boolean).length;
    totalWords += words;

    const firstLine = para.split('\n')[0].trim();
    const candidateHeading = firstLine.length < 80 && !firstLine.includes('.') ? firstLine : undefined;

    segments.push({
      segmentId: `${sourceId}_note_${index + 1}`,
      sourceId,
      location: `Paragraph ${index + 1}`,
      heading: candidateHeading,
      text: para.trim(),
    });
  });

  return {
    title: cleanTitle,
    extractedText: cleanContent,
    language,
    segments,
    wordCount: totalWords,
    characterCount: cleanContent.length,
    statusMessage: `Registered note: ${totalWords.toLocaleString()} words across ${segments.length} paragraph(s).`,
  };
}
