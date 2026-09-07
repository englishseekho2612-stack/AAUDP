import React, { useState } from 'react';
import {
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Search,
  BookOpen,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { MindMapContent, MindMapNode, MindMapNodeType } from '../../types/ai';

export interface KnowledgeOutlineViewProps {
  content: MindMapContent;
  selectedNode: MindMapNode | null;
  onSelectNode: (node: MindMapNode) => void;
  className?: string;
}

export const KnowledgeOutlineView: React.FC<KnowledgeOutlineViewProps> = ({
  content,
  selectedNode,
  onSelectNode,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    function walk(n: MindMapNode) {
      map[n.id] = true;
      if (n.children) n.children.forEach(walk);
    }
    if (content?.rootNode) walk(content.rootNode);
    return map;
  });

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    function walk(n: MindMapNode) {
      next[n.id] = true;
      if (n.children) n.children.forEach(walk);
    }
    if (content?.rootNode) walk(content.rootNode);
    setExpandedNodes(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    function walk(n: MindMapNode) {
      next[n.id] = false;
      if (n.children) n.children.forEach(walk);
    }
    if (content?.rootNode) {
      walk(content.rootNode);
      next[content.rootNode.id] = true;
    }
    setExpandedNodes(next);
  };

  // Export outline as plain text
  const handleCopyOutline = () => {
    if (!content?.rootNode) return;

    let text = `${content.title || 'Knowledge Outline'}\n`;
    text += '='.repeat(content.title?.length || 18) + '\n\n';

    function walkText(node: MindMapNode, prefix: string) {
      text += `${prefix} ${node.title} [${node.nodeType || 'CONCEPT'}]\n`;
      if (node.shortDescription) {
        text += `${prefix}   - Summary: ${node.shortDescription}\n`;
      }
      if (node.keyPoints && node.keyPoints.length > 0) {
        text += `${prefix}   - Key Points:\n`;
        node.keyPoints.forEach((kp) => {
          text += `${prefix}     * ${kp}\n`;
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((c, idx) => {
          walkText(c, `${prefix}.${idx + 1}`);
        });
      }
    }

    walkText(content.rootNode, '1');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Recursive Item Renderer
  const renderItem = (node: MindMapNode, prefix: string, depth: number): React.ReactNode => {
    const q = searchQuery.toLowerCase().trim();
    const isMatch =
      !q ||
      node.title.toLowerCase().includes(q) ||
      node.shortDescription?.toLowerCase().includes(q) ||
      node.nodeType?.toLowerCase().includes(q);

    const isExpanded = expandedNodes[node.id] !== false;
    const isSelected = selectedNode?.id === node.id;
    const hasChildren = Boolean(node.children && node.children.length > 0);

    return (
      <div key={node.id} className="relative select-text">
        <div
          onClick={() => onSelectNode(node)}
          className={`flex items-start gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer ${
            isSelected
              ? 'bg-indigo-950/70 border border-indigo-500/80 text-white shadow-xs'
              : 'hover:bg-slate-850 text-slate-300 border border-transparent'
          } ${!isMatch ? 'opacity-40' : 'opacity-100'}`}
          style={{ paddingLeft: `${Math.max(12, depth * 22)}px` }}
        >
          {/* Expand toggle */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors shrink-0 mt-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          )}

          {/* Section Numbering */}
          <span className="font-mono text-xs text-indigo-400 font-bold shrink-0 mt-0.5">
            {prefix}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-100">
                {node.title}
              </span>

              {node.nodeType && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {node.nodeType}
                </span>
              )}

              {node.isExamFocus && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-950/60 text-rose-400 border border-rose-800/60">
                  Exam Focus
                </span>
              )}
            </div>

            {node.shortDescription && (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {node.shortDescription}
              </p>
            )}

            {/* Quick bullets when expanded */}
            {isExpanded && node.keyPoints && node.keyPoints.length > 0 && (
              <ul className="mt-2 space-y-1 pl-3 border-l border-slate-800 text-xs text-slate-300">
                {node.keyPoints.map((pt, i) => (
                  <li key={i} className="list-disc list-inside text-slate-400">
                    <span className="text-slate-300">{pt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children!.map((child, idx) =>
              renderItem(child, `${prefix}.${idx + 1}`, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="knowledge-outline-container"
      className={`h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Top Toolbar */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-400 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Structured Outline View</span>
          </div>

          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
          >
            Collapse All
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="flex items-center gap-1.5 bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search outline..."
              className="bg-transparent text-xs text-slate-200 outline-none w-32 sm:w-44"
            />
          </div>

          {/* Copy outline button */}
          <button
            onClick={handleCopyOutline}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Outline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {content?.rootNode ? (
          renderItem(content.rootNode, '1', 0)
        ) : (
          <div className="text-center p-12 text-slate-500">No outline content loaded.</div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Click any section to inspect grounded explanations and checkpoint questions.</span>
        <span>Accessible • Screen-reader ready</span>
      </div>
    </div>
  );
};
