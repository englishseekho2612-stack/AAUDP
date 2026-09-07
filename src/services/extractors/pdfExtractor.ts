/**
 * PDF Source Extractor
 * Extracts page-by-page text, headings, and structure while preserving page citations.
 */

import { SourceSegment } from '../../types/project';

export interface PDFExtractionResult {
  pageCount: number;
  extractedText: string;
  segments: SourceSegment[];
  wordCount: number;
  characterCount: number;
  hasTextStream: boolean;
  statusMessage?: string;
}

export async function extractPDF(
  sourceId: string,
  arrayBuffer: ArrayBuffer
): Promise<PDFExtractionResult> {
  try {
    // Dynamically import pdfjs-dist to avoid blocking app initialization
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure worker source safely using cdnjs fallback
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const segments: SourceSegment[] = [];
    const fullTextParts: string[] = [];

    let totalWords = 0;
    let totalChars = 0;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageLines: string[] = [];
        let currentLine = '';
        let lastY: number | null = null;

        for (const item of textContent.items) {
          if ('str' in item) {
            const textItem = item as { str: string; transform: number[] };
            const y = textItem.transform[5];

            if (lastY !== null && Math.abs(y - lastY) > 5) {
              if (currentLine.trim()) {
                pageLines.push(currentLine.trim());
              }
              currentLine = textItem.str;
            } else {
              currentLine += (currentLine ? ' ' : '') + textItem.str;
            }
            lastY = y;
          }
        }

        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }

        const pageText = pageLines.join('\n').trim();

        if (pageText) {
          fullTextParts.push(`--- Page ${pageNum} ---\n${pageText}`);

          const wordsOnPage = pageText.split(/\s+/).filter(Boolean).length;
          totalWords += wordsOnPage;
          totalChars += pageText.length;

          // Identify candidate heading if the first line is concise
          const firstLine = pageLines[0] || '';
          const candidateHeading = firstLine.length < 80 && !firstLine.includes('.') ? firstLine : undefined;

          segments.push({
            segmentId: `${sourceId}_p${pageNum}`,
            sourceId,
            pageNumber: pageNum,
            location: `Page ${pageNum}`,
            heading: candidateHeading,
            text: pageText,
          });
        }
      } catch (pageErr) {
        console.warn(`Error extracting page ${pageNum}:`, pageErr);
      }
    }

    const combinedText = fullTextParts.join('\n\n');
    const hasTextStream = segments.length > 0 && totalWords > 0;

    return {
      pageCount: numPages,
      extractedText: combinedText,
      segments,
      wordCount: totalWords,
      characterCount: totalChars,
      hasTextStream,
      statusMessage: hasTextStream
        ? `Successfully extracted ${totalWords.toLocaleString()} words across ${numPages} page(s).`
        : `PDF has ${numPages} page(s), but contains scanned image pages with no selectable text stream.`,
    };
  } catch (err: any) {
    console.error('PDF extraction error:', err);
    throw new Error(
      err?.message?.includes('password')
        ? 'This PDF is password protected. Please unlock it before importing.'
        : `Could not parse PDF: ${err?.message || 'Invalid or corrupted file.'}`
    );
  }
}
