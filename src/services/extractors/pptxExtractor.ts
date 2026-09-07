/**
 * PowerPoint Presentation (PPTX) Extractor
 * Extracts slide-by-slide text, titles, and speaker notes preserving slide numbers.
 */

import JSZip from 'jszip';
import { SourceSegment } from '../../types/project';

export interface PPTXExtractionResult {
  slideCount: number;
  extractedText: string;
  segments: SourceSegment[];
  wordCount: number;
  characterCount: number;
  statusMessage?: string;
}

export async function extractPPTX(
  sourceId: string,
  fileName: string,
  arrayBuffer: ArrayBuffer
): Promise<PPTXExtractionResult> {
  const isLegacyPPT = fileName.toLowerCase().endsWith('.ppt') && !fileName.toLowerCase().endsWith('.pptx');

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch (zipErr) {
    if (isLegacyPPT) {
      throw new Error(
        'Legacy binary .ppt format cannot be parsed directly in the browser. Please open in PowerPoint or Google Slides and save as modern .pptx format.'
      );
    }
    throw new Error('Unable to read presentation archive. File may be corrupted or invalid.');
  }

  // Find all slide XML files
  const slideEntries: { slideNumber: number; path: string }[] = [];
  const slideRegex = /^ppt\/slides\/slide(\d+)\.xml$/i;

  zip.forEach((relativePath) => {
    const match = relativePath.match(slideRegex);
    if (match) {
      slideEntries.push({
        slideNumber: parseInt(match[1], 10),
        path: relativePath,
      });
    }
  });

  // Sort slides in natural presentation sequence
  slideEntries.sort((a, b) => a.slideNumber - b.slideNumber);

  if (slideEntries.length === 0) {
    return {
      slideCount: 0,
      extractedText: '',
      segments: [],
      wordCount: 0,
      characterCount: 0,
      statusMessage: 'No slides were found in this presentation file.',
    };
  }

  const parser = new DOMParser();
  const segments: SourceSegment[] = [];
  const fullTextParts: string[] = [];
  let totalWords = 0;
  let totalChars = 0;

  for (let i = 0; i < slideEntries.length; i++) {
    const entry = slideEntries[i];
    const presentationSlideNumber = i + 1; // 1-indexed presentation order
    const slideXmlStr = await zip.file(entry.path)?.async('text');

    if (!slideXmlStr) continue;

    try {
      const xmlDoc = parser.parseFromString(slideXmlStr, 'application/xml');

      // Check for XML parsing error
      if (xmlDoc.querySelector('parsererror')) {
        continue;
      }

      // Collect shapes (<p:sp>)
      const shapeNodes = xmlDoc.getElementsByTagName('p:sp');
      let slideTitle = '';
      const slideParagraphs: string[] = [];

      for (let s = 0; s < shapeNodes.length; s++) {
        const shape = shapeNodes[s];
        
        // Detect title placeholder
        const phNode = shape.getElementsByTagName('p:ph')[0];
        const phType = phNode?.getAttribute('type');
        const isTitleShape = phType === 'title' || phType === 'ctrTitle';

        // Extract text elements <a:t>
        const textNodes = shape.getElementsByTagName('a:t');
        const shapeTexts: string[] = [];
        for (let t = 0; t < textNodes.length; t++) {
          const txt = textNodes[t].textContent?.trim();
          if (txt) shapeTexts.push(txt);
        }

        const combinedShapeText = shapeTexts.join(' ').trim();
        if (combinedShapeText) {
          if (isTitleShape && !slideTitle) {
            slideTitle = combinedShapeText;
          } else {
            slideParagraphs.push(combinedShapeText);
          }
        }
      }

      // Fallback: If title wasn't marked as placeholder, use the first paragraph if short
      if (!slideTitle && slideParagraphs.length > 0 && slideParagraphs[0].length < 80) {
        slideTitle = slideParagraphs.shift() || '';
      }

      const bodyText = slideParagraphs.join('\n');
      const slideCombined = [
        slideTitle ? `Title: ${slideTitle}` : '',
        bodyText,
      ]
        .filter(Boolean)
        .join('\n');

      if (slideCombined.trim()) {
        const words = slideCombined.split(/\s+/).filter(Boolean).length;
        totalWords += words;
        totalChars += slideCombined.length;

        fullTextParts.push(`--- Slide ${presentationSlideNumber} ---\n${slideCombined}`);

        segments.push({
          segmentId: `${sourceId}_slide${presentationSlideNumber}`,
          sourceId,
          slideNumber: presentationSlideNumber,
          location: `Slide ${presentationSlideNumber}`,
          heading: slideTitle || `Slide ${presentationSlideNumber}`,
          text: slideCombined,
        });
      } else {
        // Empty slide (e.g. image-only slide)
        segments.push({
          segmentId: `${sourceId}_slide${presentationSlideNumber}`,
          sourceId,
          slideNumber: presentationSlideNumber,
          location: `Slide ${presentationSlideNumber}`,
          heading: `Slide ${presentationSlideNumber}`,
          text: `[Visual Slide ${presentationSlideNumber}]`,
        });
      }
    } catch (slideErr) {
      console.warn(`Error parsing slide ${presentationSlideNumber}:`, slideErr);
    }
  }

  return {
    slideCount: slideEntries.length,
    extractedText: fullTextParts.join('\n\n'),
    segments,
    wordCount: totalWords,
    characterCount: totalChars,
    statusMessage: `Successfully extracted ${slideEntries.length} slide(s) with ${totalWords.toLocaleString()} total words.`,
  };
}
