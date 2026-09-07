import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MindMapContent, MindMapNode, MindMapNodeType } from '../../types/ai';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Info,
  Search,
  Eye,
  Layers,
  Compass,
  ArrowRight,
  ArrowDown,
} from 'lucide-react';

interface MindMapCanvasProps {
  mindMap: MindMapContent | null;
  selectedNodeId: string | null;
  onSelectNode: (node: MindMapNode) => void;
  displayMode?: 'tree' | 'radial' | 'left_to_right' | 'top_to_bottom';
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  mindMap,
  selectedNodeId,
  onSelectNode,
  displayMode: initialDisplayMode = 'left_to_right',
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [layoutStyle, setLayoutStyle] = useState<'left_to_right' | 'top_to_bottom' | 'radial'>(
    initialDisplayMode === 'top_to_bottom' ? 'top_to_bottom' : 'left_to_right'
  );
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Search matches
  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);

  // Fallback demo mind map root node if not yet generated
  const rootNode: MindMapNode = mindMap?.rootNode || {
    id: 'root_photosynthesis',
    parentId: null,
    title: 'Photosynthesis Core Curriculum',
    nodeType: 'ROOT',
    shortDescription: 'Conversion of solar light into bio-chemical fuel by green plants.',
    detailedExplanation:
      'Photosynthesis is the fundamental biological process wherein phototrophic autotrophs capture electromagnetic radiation via chlorophyll complexes to fix carbon dioxide into hexose sugars while splitting water into oxygen.',
    keyPoints: [
      'Site: Chloroplasts (thylakoids & stroma)',
      'Input: Light, H2O, CO2',
      'Output: C6H12O6, O2, H2O',
      'Two coupled phases: Light reactions & Calvin Cycle',
    ],
    examples: [
      'Mesophyll palisade cells orienting chloroplasts toward incident sunlight',
    ],
    questions: [
      'Why is water photolysis crucial for the continuous replenishment of PS II electrons?',
    ],
    sourceReferences: [
      { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 1' },
    ],
    children: [
      {
        id: 'node_chloroplast',
        parentId: 'root_photosynthesis',
        title: 'Chloroplast Structure',
        nodeType: 'CONCEPT',
        shortDescription: 'Specialized photosynthetic plastids housing grana and stroma.',
        detailedExplanation:
          'Contains thylakoids stacked into grana bathed in aqueous stroma fluid.',
        keyPoints: ['Double membrane envelope', 'Thylakoid lumen proton reservoir', 'Stroma RuBisCO concentration'],
        examples: ['Grana stacking maximizes photon capture per unit volume'],
        questions: ['What is the function of the thylakoid membrane?'],
        sourceReferences: [
          { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 2' },
        ],
        children: [
          {
            id: 'node_thylakoid',
            parentId: 'node_chloroplast',
            title: 'Thylakoid Membrane & Pigments',
            nodeType: 'DEFINITION',
            shortDescription: 'Membrane site of chlorophyll a, b and carotenoids.',
            detailedExplanation: 'Houses the light harvesting complexes and ATP synthase.',
            keyPoints: ['Chlorophyll a & b absorb blue and red light', 'Reflects green wavelength'],
            examples: ['Autumn leaf color change when chlorophyll degrades'],
            questions: ['Which wavelengths of light are most effective for photosynthesis?'],
            sourceReferences: [
              { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 2' },
            ],
          },
        ],
      },
      {
        id: 'node_light_reactions',
        parentId: 'root_photosynthesis',
        title: 'Light Reactions (Thylakoids)',
        nodeType: 'PROCESS',
        shortDescription: 'Photolysis of H2O and synthesis of ATP & NADPH.',
        detailedExplanation:
          'Solar photons induce electron excitation, non-cyclic photophosphorylation, and proton pumping.',
        keyPoints: ['Photolysis of water produces O2', 'Photosystems II and I in series', 'Z-scheme electron cascade'],
        examples: ['Photolysis reaction: 2H2O -> 4H+ + 4e- + O2'],
        questions: ['Where does the oxygen released in photosynthesis come from?'],
        sourceReferences: [
          { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 3' },
        ],
      },
      {
        id: 'node_calvin_cycle',
        parentId: 'root_photosynthesis',
        title: 'Calvin Cycle (Stroma)',
        nodeType: 'PROCESS',
        shortDescription: 'Light-independent fixation of CO2 into glucose.',
        detailedExplanation:
          'Carbon dioxide is fixed by RuBisCO enzyme into 3-PGA, then reduced using ATP and NADPH into G3P.',
        keyPoints: ['Fixation of CO2 by RuBisCO', 'Reduction phase requires ATP & NADPH', 'RuBP regeneration completes the cycle'],
        examples: ['C3 pathway active in temperate crops like wheat and rice'],
        questions: ['Why does the Calvin cycle slow down in prolonged darkness even though it is light-independent?'],
        sourceReferences: [
          { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 4' },
        ],
      },
      {
        id: 'node_factors',
        parentId: 'root_photosynthesis',
        title: 'Limiting Factors',
        nodeType: 'COMPARISON',
        shortDescription: 'Environmental constraints on photosynthetic rate.',
        detailedExplanation:
          'Blackman’s Principle of Limiting Factors: light intensity, CO2 concentration, and temperature dictate overall speed.',
        keyPoints: ['Light saturation plateau', 'CO2 enrichment increases yield in greenhouses', 'Thermal denaturation of RuBisCO at high temperatures'],
        examples: ['Commercial greenhouse CO2 enrichment to 1000 ppm'],
        questions: ['How does temperature affect photosynthetic rate?'],
        sourceReferences: [
          { sourceName: 'Photosynthesis Core Biology Curriculum', location: 'Section 5' },
        ],
      },
    ],
  };

  // Search indexing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setActiveMatchIdx(0);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches: string[] = [];

    function search(node: MindMapNode) {
      if (
        node.title.toLowerCase().includes(q) ||
        node.shortDescription?.toLowerCase().includes(q) ||
        node.nodeType?.toLowerCase().includes(q)
      ) {
        matches.push(node.id);
      }
      if (node.children) {
        node.children.forEach(search);
      }
    }
    search(rootNode);
    setSearchMatches(matches);
    setActiveMatchIdx(0);
  }, [searchQuery, rootNode]);

  // Focused branch checker
  const isNodeInFocus = useMemo(() => {
    if (!focusedNodeId) return () => true;

    const allowed = new Set<string>();
    function addDescendants(node: MindMapNode) {
      allowed.add(node.id);
      if (node.children) node.children.forEach(addDescendants);
    }

    function searchAncestors(node: MindMapNode, targetId: string): boolean {
      if (node.id === targetId) {
        allowed.add(node.id);
        addDescendants(node);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (searchAncestors(child, targetId)) {
            allowed.add(node.id);
            return true;
          }
        }
      }
      return false;
    }

    searchAncestors(rootNode, focusedNodeId);
    return (id: string) => allowed.has(id);
  }, [focusedNodeId, rootNode]);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedNodes(new Set());
  const collapseAll = () => {
    const all = new Set<string>();
    function walk(n: MindMapNode) {
      if (n.id !== rootNode.id) all.add(n.id);
      if (n.children) n.children.forEach(walk);
    }
    walk(rootNode);
    setCollapsedNodes(all);
  };

  // Node type badge helper
  const getNodeTypeBadge = (type?: MindMapNodeType) => {
    const t = type || 'CONCEPT';
    switch (t) {
      case 'ROOT':
        return { label: 'Root', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 'CONCEPT':
        return { label: 'Concept', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'SUBTOPIC':
        return { label: 'Subtopic', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'DEFINITION':
        return { label: 'Definition', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'EXAMPLE':
        return { label: 'Example', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'PROCESS':
        return { label: 'Process', bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 'COMPARISON':
        return { label: 'Comparison', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
      case 'IMPORTANT POINT':
        return { label: 'Key Point', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'QUESTION':
        return { label: 'Checkpoint', bg: 'bg-violet-500/20 text-violet-300 border-violet-500/40' };
      case 'FORMULA':
        return { label: 'Formula', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      default:
        return { label: t, bg: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  // Render a node and its children recursively
  const renderNode = (node: MindMapNode, depth = 0) => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isCollapsed = collapsedNodes.has(node.id);
    const inFocus = isNodeInFocus(node.id);
    const isMatch = searchMatches.includes(node.id);
    const isActiveMatch = searchMatches[activeMatchIdx] === node.id;
    const badge = getNodeTypeBadge(node.nodeType);

    const isHorizontal = layoutStyle === 'left_to_right';

    return (
      <div
        key={node.id}
        className={`flex ${
          isHorizontal ? 'items-start gap-4 my-2' : 'flex-col items-center gap-4 my-2'
        } transition-opacity duration-200 ${inFocus ? 'opacity-100' : 'opacity-25 hover:opacity-80'}`}
      >
        {/* Node Bubble */}
        <div
          id={`mindmap-node-${node.id}`}
          onClick={() => onSelectNode(node)}
          className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border select-none ${
            isSelected
              ? 'bg-indigo-950/90 text-white border-indigo-400 ring-2 ring-indigo-400/40 scale-102 shadow-xl shadow-indigo-950/50'
              : isActiveMatch
              ? 'bg-amber-950 text-amber-100 border-amber-400 ring-2 ring-amber-400 scale-102'
              : isMatch
              ? 'bg-amber-950/40 text-amber-200 border-amber-500/60'
              : depth === 0
              ? 'bg-slate-900 text-white border-slate-700 hover:border-indigo-400 shadow-md'
              : depth === 1
              ? 'bg-slate-900 text-slate-100 border-slate-800 hover:border-indigo-500 shadow-sm'
              : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-indigo-400 shadow-xs'
          }`}
          style={{ minWidth: depth === 0 ? '240px' : '220px', maxWidth: '300px' }}
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}
            >
              {badge.label}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedNodeId(focusedNodeId === node.id ? null : node.id);
                }}
                title={focusedNodeId === node.id ? 'Exit Focus' : 'Focus Branch'}
                className={`p-1 rounded transition-colors ${
                  focusedNodeId === node.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3 h-3" />
              </button>

              {hasChildren && (
                <button
                  onClick={(e) => toggleCollapse(node.id, e)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title={isCollapsed ? 'Expand Children' : 'Collapse Children'}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>

          <h4 className="text-xs sm:text-sm font-bold leading-snug">{node.title}</h4>

          {node.shortDescription && (
            <p className="text-[11px] mt-1.5 text-slate-400 line-clamp-2 leading-relaxed">
              {node.shortDescription}
            </p>
          )}

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-semibold text-indigo-400 group-hover:text-indigo-300">
              Explore Details →
            </span>
            {hasChildren && (
              <span className="text-[10px] text-slate-500 font-mono">
                {node.children!.length} subtopics
              </span>
            )}
          </div>
        </div>

        {/* Children Branch */}
        {hasChildren && !isCollapsed && (
          <div
            className={`flex ${
              isHorizontal ? 'flex-col border-l-2 border-indigo-500/30 pl-4 space-y-2' : 'flex-row border-t-2 border-indigo-500/30 pt-4 gap-4'
            } relative`}
          >
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="mindmap-canvas-container"
      className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none"
    >
      {/* Top Controls Toolbar: Search, Layout & Zoom */}
      <div className="p-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 z-10">
        {/* Search */}
        <div className="relative flex items-center bg-slate-850 border border-slate-700/80 rounded-lg px-2.5 py-1">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search concepts in mind map..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-36 sm:w-56 bg-transparent text-xs text-slate-200 outline-none pl-2 placeholder-slate-500"
          />
          {searchMatches.length > 0 && (
            <span className="text-[10px] font-mono text-amber-400 font-bold ml-1">
              {searchMatches.length} found
            </span>
          )}
        </div>

        {/* Center: Layout switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setLayoutStyle('left_to_right')}
            title="Horizontal Tree"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              layoutStyle === 'left_to_right'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRight className="w-3 h-3" />
            <span className="hidden sm:inline">Horizontal</span>
          </button>
          <button
            onClick={() => setLayoutStyle('top_to_bottom')}
            title="Vertical Tree"
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              layoutStyle === 'top_to_bottom'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDown className="w-3 h-3" />
            <span className="hidden sm:inline">Vertical</span>
          </button>
        </div>

        {/* Right: Expand/Collapse, Focus Clear & Zoom */}
        <div className="flex items-center gap-1.5">
          {focusedNodeId && (
            <button
              onClick={() => setFocusedNodeId(null)}
              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded font-semibold"
            >
              Exit Focus
            </button>
          )}

          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
          >
            Expand
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
          >
            Collapse
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
              title="Zoom Out"
              className="p-1 text-slate-300 hover:text-white rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1 text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))}
              title="Zoom In"
              className="p-1 text-slate-300 hover:text-white rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Reset Zoom"
              className="p-1 text-slate-300 hover:text-white rounded"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Infinite Canvas Viewport */}
      <div
        id="mindmap-zoomable-viewport"
        className="flex-1 overflow-auto p-12 relative flex items-center justify-start"
      >
        <div
          className="transition-transform duration-100 origin-top-left"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {renderNode(rootNode)}
        </div>
      </div>
    </div>
  );
};
