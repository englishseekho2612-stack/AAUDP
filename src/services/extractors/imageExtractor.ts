/**
 * Image Source Extractor
 * Validates dimensions, format, and prepares vision metadata for Gemini in Part 03.
 */

import { SourceSegment } from '../../types/project';

export interface ImageExtractionResult {
  dimensions: { width: number; height: number };
  aspectRatio: string;
  segments: SourceSegment[];
  statusMessage: string;
}

export async function extractImage(
  sourceId: string,
  fileName: string,
  blob: Blob
): Promise<ImageExtractionResult> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);

      // Compute approximate common aspect ratio
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(width, height);
      const ratioStr = divisor > 1 ? `${width / divisor}:${height / divisor}` : `${width}x${height}`;

      const segment: SourceSegment = {
        segmentId: `${sourceId}_img`,
        sourceId,
        location: 'Visual Asset',
        heading: fileName,
        text: `Image: ${fileName} (${width}×${height}, ${blob.type || 'image'}). Ready for vision analysis.`,
      };

      resolve({
        dimensions: { width, height },
        aspectRatio: ratioStr,
        segments: [segment],
        statusMessage: `Image loaded: ${width}×${height} pixels (${(blob.size / 1024).toFixed(1)} KB). Ready for teaching visual reference.`,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image. File may be corrupted or in an unsupported format.'));
    };

    img.src = objectUrl;
  });
}
