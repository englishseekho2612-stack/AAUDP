/**
 * Source Processing Pipeline & Context Preparation Engine
 * 
 * Implements the standardized pipeline:
 * INPUT -> VALIDATE -> STORE -> EXTRACT -> NORMALIZE -> READY FOR AI
 * 
 * Enforces:
 * - 0 to 5 source ceiling
 * - Duplicate detection
 * - Non-destructive storage in BlobStorage
 * - Real segmentation by page / slide / section / timestamp
 * - Local search inside sources
 * - Clean preparation for Part 03 Gemini AI Engine
 */

import {
  LearningSource,
  SourceType,
  SourceSegment,
  SourcePriority,
  TeachingProject,
  AIContextPackage,
  AIOutputType,
  SupportedLanguage,
} from '../types/project';
import { blobStorage } from '../storage/blobStorage';
import { extractPDF } from './extractors/pdfExtractor';
import { extractDocx } from './extractors/docxExtractor';
import { extractPPTX } from './extractors/pptxExtractor';
import { extractImage } from './extractors/imageExtractor';
import { extractYouTube } from './extractors/youtubeExtractor';
import { extractWeb } from './extractors/webExtractor';
import { extractTextNotes } from './extractors/textExtractor';

export const MAX_SOURCES = 5;
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB ceiling

export interface AddSourceFileInput {
  file: File;
  type: SourceType;
  priority?: SourcePriority;
}

export interface AddSourceUrlInput {
  url: string;
  type: 'youtube' | 'web';
  customTitle?: string;
  notesOrTranscript?: string;
  priority?: SourcePriority;
}

export interface AddSourceTextInput {
  title: string;
  content: string;
  language?: SupportedLanguage;
  priority?: SourcePriority;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingSource?: LearningSource;
  reason?: string;
}

export interface SearchMatchResult {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  segmentId: string;
  location: string;
  heading?: string;
  matchingSnippet: string;
}

export class SourcePipelineService {
  /**
   * Check if the project can accept another source (Max 5)
   */
  canAddSource(sources: LearningSource[]): boolean {
    return sources.length < MAX_SOURCES;
  }

  /**
   * Check for duplicate sources in a project
   */
  checkDuplicate(
    sources: LearningSource[],
    identifier: { fileName?: string; fileSize?: number; url?: string; title?: string }
  ): DuplicateCheckResult {
    for (const src of sources) {
      // Check URL duplicate
      if (identifier.url && src.metadata.url) {
        if (identifier.url.trim().toLowerCase() === src.metadata.url.trim().toLowerCase()) {
          return {
            isDuplicate: true,
            existingSource: src,
            reason: `A source with this URL ("${src.name}") is already in this project.`,
          };
        }
      }

      // Check File duplicate (name and size match)
      if (
        identifier.fileName &&
        src.metadata.originalFileName &&
        identifier.fileName.toLowerCase() === src.metadata.originalFileName.toLowerCase() &&
        identifier.fileSize &&
        src.metadata.fileSize === identifier.fileSize
      ) {
        return {
          isDuplicate: true,
          existingSource: src,
          reason: `The file "${identifier.fileName}" (${(identifier.fileSize / 1024).toFixed(0)} KB) is already added.`,
        };
      }

      // Check Text title duplicate
      if (
        identifier.title &&
        src.type === 'text' &&
        identifier.title.trim().toLowerCase() === src.name.trim().toLowerCase()
      ) {
        return {
          isDuplicate: true,
          existingSource: src,
          reason: `A note titled "${identifier.title}" already exists.`,
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Process and ingest an uploaded file (PDF, DOCX, PPTX, Image)
   */
  async processFileSource(
    projectId: string,
    file: File,
    specifiedType: SourceType,
    existingCount: number,
    onProgress?: (stage: string) => void
  ): Promise<LearningSource> {
    if (existingCount >= MAX_SOURCES) {
      throw new Error('Maximum 5 sources allowed per project.');
    }

    // 1. VALIDATE
    onProgress?.('Validating format and file integrity...');
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 50MB.`);
    }

    const sourceId = `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fileName = file.name;

    // 2. STORE BINARY
    onProgress?.('Storing local project asset in offline storage...');
    const storedBlob = await blobStorage.saveBlob(projectId, fileName, file.type, file);

    // 3. EXTRACT BASED ON TYPE
    onProgress?.('Extracting document structure and content...');
    const arrayBuffer = await file.arrayBuffer();

    let segments: SourceSegment[] = [];
    let extractedText = '';
    let wordCount = 0;
    let characterCount = 0;
    let pageCount: number | undefined;
    let slideCount: number | undefined;
    let dimensions: { width: number; height: number } | undefined;
    let statusMessage = 'Source processed successfully.';

    try {
      if (specifiedType === 'pdf') {
        const pdfResult = await extractPDF(sourceId, arrayBuffer);
        pageCount = pdfResult.pageCount;
        extractedText = pdfResult.extractedText;
        segments = pdfResult.segments;
        wordCount = pdfResult.wordCount;
        characterCount = pdfResult.characterCount;
        statusMessage = pdfResult.statusMessage || `Extracted ${pageCount} pages.`;
      } else if (specifiedType === 'docx') {
        const docxResult = await extractDocx(sourceId, fileName, arrayBuffer);
        extractedText = docxResult.extractedText;
        segments = docxResult.segments;
        wordCount = docxResult.wordCount;
        characterCount = docxResult.characterCount;
        statusMessage = docxResult.statusMessage || `Extracted ${segments.length} sections.`;
      } else if (specifiedType === 'pptx') {
        const pptxResult = await extractPPTX(sourceId, fileName, arrayBuffer);
        slideCount = pptxResult.slideCount;
        extractedText = pptxResult.extractedText;
        segments = pptxResult.segments;
        wordCount = pptxResult.wordCount;
        characterCount = pptxResult.characterCount;
        statusMessage = pptxResult.statusMessage || `Extracted ${slideCount} slides.`;
      } else if (specifiedType === 'image') {
        const imgResult = await extractImage(sourceId, fileName, file);
        dimensions = imgResult.dimensions;
        segments = imgResult.segments;
        statusMessage = imgResult.statusMessage;
      }
    } catch (extractErr: any) {
      // Even if text extraction failed, file is stored safely
      return {
        id: sourceId,
        projectId,
        type: specifiedType,
        name: fileName,
        originalRef: storedBlob.blobId,
        blobId: storedBlob.blobId,
        metadata: {
          originalFileName: fileName,
          fileSize: file.size,
          mimeType: file.type,
          pageCount,
          slideCount,
        },
        status: 'error',
        stage: 'failed',
        statusMessage: extractErr?.message || 'Extraction failed.',
        errorMessage: extractErr?.message || 'Extraction failed.',
        segments: [],
        priority: 'supporting',
        selectedForAI: false,
        orderIndex: existingCount,
        createdTimestamp: Date.now(),
        updatedTimestamp: Date.now(),
      };
    }

    // 4. NORMALIZE & RETURN READY SOURCE
    onProgress?.('Ready for AI.');

    return {
      id: sourceId,
      projectId,
      type: specifiedType,
      name: fileName,
      originalRef: storedBlob.blobId,
      blobId: storedBlob.blobId,
      metadata: {
        originalFileName: fileName,
        fileSize: file.size,
        mimeType: file.type,
        pageCount,
        slideCount,
        dimensions,
        lastExtractedLength: characterCount,
      },
      status: 'ready',
      stage: 'ready',
      statusMessage,
      extractedText,
      segments,
      wordCount,
      characterCount,
      priority: existingCount === 0 ? 'primary' : 'supporting',
      selectedForAI: true,
      orderIndex: existingCount,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    };
  }

  /**
   * Process YouTube URL Source
   */
  async processYouTubeSource(
    projectId: string,
    url: string,
    customTitle: string | undefined,
    notesOrTranscript: string | undefined,
    existingCount: number
  ): Promise<LearningSource> {
    if (existingCount >= MAX_SOURCES) {
      throw new Error('Maximum 5 sources allowed per project.');
    }

    const sourceId = `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ytResult = await extractYouTube(sourceId, url, customTitle, notesOrTranscript);

    return {
      id: sourceId,
      projectId,
      type: 'youtube',
      name: ytResult.title,
      originalRef: url,
      metadata: {
        url,
        videoId: ytResult.videoId,
        hasTranscript: ytResult.hasTranscript,
        transcriptSource: ytResult.hasTranscript ? 'manual' : 'pending',
      },
      status: 'ready',
      stage: 'ready',
      statusMessage: ytResult.statusMessage,
      segments: ytResult.segments,
      priority: existingCount === 0 ? 'primary' : 'supporting',
      selectedForAI: true,
      orderIndex: existingCount,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    };
  }

  /**
   * Process Web URL Source
   */
  async processWebSource(
    projectId: string,
    url: string,
    customTitle: string | undefined,
    pastedText: string | undefined,
    existingCount: number
  ): Promise<LearningSource> {
    if (existingCount >= MAX_SOURCES) {
      throw new Error('Maximum 5 sources allowed per project.');
    }

    const sourceId = `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const webResult = await extractWeb(sourceId, url, customTitle, pastedText);

    return {
      id: sourceId,
      projectId,
      type: 'web',
      name: webResult.title,
      originalRef: webResult.url,
      metadata: {
        url: webResult.url,
        domain: webResult.domain,
      },
      status: 'ready',
      stage: 'ready',
      statusMessage: webResult.statusMessage,
      extractedText: webResult.extractedText,
      segments: webResult.segments,
      priority: existingCount === 0 ? 'primary' : 'supporting',
      selectedForAI: true,
      orderIndex: existingCount,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    };
  }

  /**
   * Process Text / Notes Source
   */
  processTextSource(
    projectId: string,
    title: string,
    content: string,
    language: SupportedLanguage = 'en',
    existingCount: number
  ): LearningSource {
    if (existingCount >= MAX_SOURCES) {
      throw new Error('Maximum 5 sources allowed per project.');
    }

    const sourceId = `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const textResult = extractTextNotes(sourceId, title, content, language);

    return {
      id: sourceId,
      projectId,
      type: 'text',
      name: textResult.title,
      originalRef: `text://${sourceId}`,
      metadata: {
        lastExtractedLength: textResult.characterCount,
      },
      status: 'ready',
      stage: 'ready',
      statusMessage: textResult.statusMessage,
      extractedText: textResult.extractedText,
      segments: textResult.segments,
      wordCount: textResult.wordCount,
      characterCount: textResult.characterCount,
      priority: existingCount === 0 ? 'primary' : 'supporting',
      selectedForAI: true,
      orderIndex: existingCount,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
    };
  }

  /**
   * Search Inside Sources
   * Finds matching segments across all project sources by keyword/phrase.
   */
  searchSources(sources: LearningSource[], query: string): SearchMatchResult[] {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const matches: SearchMatchResult[] = [];

    for (const source of sources) {
      if (!source.segments || source.segments.length === 0) continue;

      for (const segment of source.segments) {
        const textLower = segment.text.toLowerCase();
        const matchIdx = textLower.indexOf(cleanQuery);

        if (matchIdx !== -1) {
          // Extract a 120-char snippet around the match
          const start = Math.max(0, matchIdx - 40);
          const end = Math.min(segment.text.length, matchIdx + cleanQuery.length + 60);
          const snippet = (start > 0 ? '...' : '') + segment.text.substring(start, end).trim() + (end < segment.text.length ? '...' : '');

          matches.push({
            sourceId: source.id,
            sourceName: source.name,
            sourceType: source.type,
            segmentId: segment.segmentId,
            location: segment.location,
            heading: segment.heading,
            matchingSnippet: snippet,
          });

          // Cap at 30 matching snippets to avoid UI overload
          if (matches.length >= 30) return matches;
        }
      }
    }

    return matches;
  }

  /**
   * Standardized AI Context Package Builder (Section 37 & 50)
   * Prepares the exact grounding bundle for Part 03 Gemini AI Engine.
   */
  buildAIContextPackage(
    project: TeachingProject,
    taskId?: AIOutputType
  ): AIContextPackage {
    const activeSources = project.sources.filter((s) => s.selectedForAI !== false && s.status === 'ready');
    
    let totalSegments = 0;
    let totalWords = 0;

    const sourcePackages = activeSources.map((s) => {
      const segs = s.segments || [];
      totalSegments += segs.length;
      totalWords += s.wordCount || 0;

      return {
        sourceId: s.id,
        title: s.name,
        type: s.type,
        priority: s.priority || 'supporting',
        segments: segs,
        totalWords: s.wordCount || 0,
      };
    });

    return {
      projectId: project.id,
      projectName: project.name,
      language: project.language,
      teacherInstructions: project.teacherInstructions,
      sources: sourcePackages,
      totalSegments,
      totalWordCount: totalWords,
      targetTask: taskId,
      generatedAt: Date.now(),
    };
  }
}

export const sourcePipeline = new SourcePipelineService();
