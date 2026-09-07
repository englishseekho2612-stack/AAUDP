import React, { useState, useMemo } from 'react';
import { LearningSource, SourceType } from '../../types/project';
import { sourcePipeline, SearchMatchResult } from '../../services/sourcePipeline';
import { Search, X, FileText, Youtube, Globe, Presentation, FileSpreadsheet, ChevronRight } from 'lucide-react';

interface SourceSearchBarProps {
  sources: LearningSource[];
  onSelectMatch: (sourceId: string, segmentId: string) => void;
}

export const SourceSearchBar: React.FC<SourceSearchBarProps> = ({
  sources,
  onSelectMatch,
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const results = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];
    return sourcePipeline.searchSources(sources, query);
  }, [sources, query]);

  const getSourceIcon = (type: SourceType) => {
    switch (type) {
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5 text-red-500" />;
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-orange-500" />;
      case 'docx':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />;
      case 'pptx':
        return <Presentation className="w-3.5 h-3.5 text-amber-500" />;
      case 'web':
        return <Globe className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  if (sources.length === 0) return null;

  return (
    <div id="source-search-section" className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          id="input-source-search"
          placeholder="Search keywords across your sources (e.g., Seagull, Gravity, Newton)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsExpanded(false);
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Live Search Dropdown */}
      {isExpanded && query.trim().length >= 2 && (
        <div
          id="source-search-results-dropdown"
          className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto p-2 space-y-1 text-xs"
        >
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
            <span>
              Matches for &ldquo;{query}&rdquo; ({results.length})
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>

          {results.length === 0 ? (
            <div className="p-4 text-center text-slate-400">
              No matching keywords found across the added sources.
            </div>
          ) : (
            results.map((match, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectMatch(match.sourceId, match.segmentId);
                  setIsExpanded(false);
                }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-indigo-50/60 dark:hover:bg-slate-800 transition-colors flex items-start justify-between gap-3 group cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-slate-700"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getSourceIcon(match.sourceType)}
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {match.sourceName}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
                      {match.location}
                    </span>
                    {match.heading && (
                      <span className="text-[10px] text-slate-400 truncate max-w-xs">
                        ({match.heading})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {match.matchingSnippet}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-1" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
