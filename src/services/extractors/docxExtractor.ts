/**
 * Word Document (DOCX / DOC) Extractor
 * Extracts paragraphs, headings, and lists using mammoth.
 */

import mammoth from 'mammoth';
import { SourceSegment } from '../../types/project';

export interface DocxExtractionResult {
  extractedText: string;
  segments: SourceSegment[];
  wordCount: number;
  characterCount: number;
  statusMessage?: string;
}

export async function extractDocx(
  sourceId: string,
  fileName: string,
  arrayBuffer: ArrayBuffer
): Promise<DocxExtractionResult> {
  const isLegacyDoc = fileName.toLowerCase().endsWith('.doc') && !fileName.toLowerCase().endsWith('.docx');

  if (isLegacyDoc) {
    // Check if it's secretly a docx with .doc extension or true legacy binary
    try {
      const testResult = await mammoth.extractRawText({ arrayBuffer });
      if (testResult.value && testResult.value.trim().length > 0) {
        return processExtractedText(sourceId, testResult.value);
      }
    } catch {
      throw new Error(
        'Legacy binary .doc format cannot be parsed directly in the browser. Please open the file in Word or Google Docs and save as .docx format.'
      );
    }
  }

  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value.trim();

    if (!rawText) {
      return {
        extractedText: '',
        segments: [],
        wordCount: 0,
        characterCount: 0,
        statusMessage: 'The document was opened successfully but contains no readable text content.',
      };
    }

    return processExtractedText(sourceId, rawText);
  } catch (err: any) {
    console.error('DOCX extraction error:', err);
    throw new Error(
      `Unable to parse Word document: ${err?.message || 'Unsupported or corrupted document format.'}`
    );
  }
}

function processExtractedText(sourceId: string, rawText: string): DocxExtractionResult {
  // Split document into structural sections by double line breaks
  const rawParagraphs = rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const segments: SourceSegment[] = [];
  let totalWords = 0;

  rawParagraphs.forEach((para, index) => {
    const words = para.split(/\s+/).filter(Boolean).length;
    totalWords += words;

    // First short line can serve as a heading
    const firstLine = para.split('\n')[0].trim();
    const candidateHeading = firstLine.length < 70 && !firstLine.includes('.') ? firstLine : undefined;

    segments.push({
      segmentId: `${sourceId}_sec${index + 1}`,
      sourceId,
      location: `Section ${index + 1}`,
      heading: candidateHeading,
      text: para,
    });
  });

  return {
    extractedText: rawText,
    segments,
    wordCount: totalWords,
    characterCount: rawText.length,
    statusMessage: `Extracted ${totalWords.toLocaleString()} words across ${segments.length} section(s).`,
  };
}
