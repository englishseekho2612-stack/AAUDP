/**
 * Web URL Source Extractor
 * Safe URL validation, domain extraction, and sanitized content processing without script execution.
 */

import { SourceSegment } from '../../types/project';

export interface WebValidationResult {
  isValid: boolean;
  normalizedUrl?: string;
  domain?: string;
  error?: string;
}

export function validateWebUrl(inputUrl: string): WebValidationResult {
  const clean = inputUrl.trim();
  if (!clean) {
    return { isValid: false, error: 'Web URL cannot be empty.' };
  }

  try {
    const parsed = new URL(clean.startsWith('http://') || clean.startsWith('https://') ? clean : `https://${clean}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTP and HTTPS web links are supported.' };
    }
    return {
      isValid: true,
      normalizedUrl: parsed.href,
      domain: parsed.hostname,
    };
  } catch {
    return { isValid: false, error: 'Invalid web address format. Please enter a valid URL.' };
  }
}

export interface WebExtractionResult {
  url: string;
  domain: string;
  title: string;
  extractedText: string;
  segments: SourceSegment[];
  statusMessage: string;
}

export async function extractWeb(
  sourceId: string,
  url: string,
  customTitle?: string,
  pastedText?: string
): Promise<WebExtractionResult> {
  const valid = validateWebUrl(url);
  if (!valid.isValid || !valid.normalizedUrl || !valid.domain) {
    throw new Error(valid.error || 'Invalid web URL.');
  }

  const title = customTitle?.trim() || `${valid.domain}`;
  const segments: SourceSegment[] = [];

  if (pastedText && pastedText.trim()) {
    const rawParas = pastedText.trim().split(/\n\s*\n/).filter(Boolean);
    rawParas.forEach((para, idx) => {
      segments.push({
        segmentId: `${sourceId}_web_${idx + 1}`,
        sourceId,
        location: `Article Section ${idx + 1}`,
        heading: idx === 0 ? title : undefined,
        text: para.trim(),
      });
    });
    return {
      url: valid.normalizedUrl,
      domain: valid.domain,
      title,
      extractedText: pastedText.trim(),
      segments,
      statusMessage: `Web reference registered with ${segments.length} content section(s).`,
    };
  }

  // Pure Web reference without faking page content
  segments.push({
    segmentId: `${sourceId}_web_ref`,
    sourceId,
    location: 'Web Reference',
    heading: title,
    text: `Web Source: ${valid.normalizedUrl} (${valid.domain}). Full web text extraction is routed to the Part 03 AI search & URL grounding pipeline.`,
  });

  return {
    url: valid.normalizedUrl,
    domain: valid.domain,
    title,
    extractedText: '',
    segments,
    statusMessage: `Web link verified (${valid.domain}). Extraction queue ready for Part 03.`,
  };
}
