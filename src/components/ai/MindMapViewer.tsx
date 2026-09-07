/**
 * Interactive Mind Map Viewer & Editor
 * Sections 13, 14, 15, 16: Tree/Radial/Outline modes, node detail drawer,
 * granular node AI actions (Explain More, Simplify, Example, Quiz), teacher editing,
 * and 3-layer versioning (AI vs Teacher).
 */

import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  List,
  GitFork,
  Compass,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  Sparkles,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Download,
  RotateCcw,
  Layers,
  ChevronDown,
  ChevronRight,
  Save,
  MessageSquare,
  FileText,
  ExternalLink,
  Split,
  Eye,
} from 'lucide-react';
import { MindMapContent, MindMapNode } from '../../types/ai';
import { ProjectAIOutput, SupportedLanguage } from '../../types/project';
import { aiTaskService } from '../../services/ai/aiTaskService';
import { KnowledgeExportService } from '../../services/export/knowledgeExportService';
import { VisualTreeCanvas } from '../knowledge/VisualTreeCanvas';
import { KnowledgeOutlineView } from '../knowledge/KnowledgeOutlineView';
import { Button, Badge } from '../common/UIControls';

export interface MindMapViewerProps {
  output: ProjectAIOutput<MindMapContent>;
  language: SupportedLanguage;
  onSaveTeacherEdits: (editedContent: MindMapContent) => void;
  onRestoreAI: () => void;
  onSwitchView: (view: 'ai' | 'teacher' | 'split') => void;
  onOpenSourceSnippet?: (sourceName: string, location: string) => void;
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  output,
  language,
  onSaveTeacherEdits,
  onRestoreAI,
  onSwitchView,
  onOpenSourceSnippet,
}) => {
  // Determine which content to render based on activeView & presence of edits
  const isTeacherEdited = Boolean(output.teacherEditedContent);
  const activeContent: MindMapContent =
    output.activeView === 'ai' || !output.teacherEditedContent
      ? (output.rawAiContent as MindMapContent)
      : (output.teacherEditedContent as MindMapContent);

  const [workingMap, setWorkingMap] = useState<MindMapContent>(
    JSON.parse(JSON.stringify(activeContent || { title: 'Empty Mind Map', rootNode: { id: 'root', title: 'Concept', children: [] } }))
  );

  const [displayMode, setDisplayMode] = useState<'visual_tree' | 'tree' | 'radial' | 'outline'>('visual_tree');
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(workingMap?.rootNode || null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node editing state in detail panel
  const [isEditingNode, setIsEditingNode] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editShortDesc, setEditShortDesc] = useState<string>('');
  const [editDetailedDesc, setEditDetailedDesc] = useState<string>('');
  const [teacherNotesText, setTeacherNotesText] = useState<string>('');

  // AI Sub-action modal or inline result
  const [aiActionResult, setAiActionResult] = useState<{
    action: string;
    text: string;
  } | null>(null);
  const [isCallingNodeAi, setIsCallingNodeAi] = useState<boolean>(false);

  // Sync state if output changes externally
  React.useEffect(() => {
    if (activeContent) {
      setWorkingMap(JSON.parse(JSON.stringify(activeContent)));
      setSelectedNode(activeContent.rootNode);
    }
  }, [output.activeView, output.lastModifiedAt]);

  // Update edit form when selected node changes
  React.useEffect(() => {
    if (selectedNode) {
      setEditTitle(selectedNode.title);
      setEditShortDesc(selectedNode.shortDescription || '');
      setEditDetailedDesc(selectedNode.detailedExplanation || '');
      setTeacherNotesText(selectedNode.teacherNotes || '');
      setIsEditingNode(false);
      setAiActionResult(null);
    }
  }, [selectedNode?.id]);

  if (!activeContent || !activeContent.rootNode) {
    return (
      <div className="p-12 text-center text-slate-500">
        <GitFork className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700 dark:text-slate-300">No Mind Map content generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">Use "Create with AI" to generate a concept map.</p>
      </div>
    );
  }

  // Find & update node in recursive tree
  const updateNodeInTree = (nodeId: string, updater: (n: MindMapNode) => MindMapNode) => {
    const clone: MindMapContent = JSON.parse(JSON.stringify(workingMap));

    function visit(current: MindMapNode): boolean {
      if (current.id === nodeId) {
        const updated = updater(current);
        Object.assign(current, updated);
        return true;
      }
      if (current.children) {
        for (const child of current.children) {
          if (visit(child)) return true;
        }
      }
      return false;
    }

    visit(clone.rootNode);
    setWorkingMap(clone);
    onSaveTeacherEdits(clone);

    // Also update selectedNode
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => (prev ? updater({ ...prev }) : null));
    }
  };

  // Add child node
  const handleAddChildNode = (parentId: string) => {
    const newNode: MindMapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parentId,
      title: 'New Subtopic',
      shortDescription: 'Add brief summary here',
      detailedExplanation: 'Add detailed teacher explanations or source notes here.',
      keyPoints: [],
      examples: [],
      questions: [],
      sourceReferences: [],
      teacherNotes: '',
      isExpanded: true,
      children: [],
    };

    updateNodeInTree(parentId, (parent) => ({
      ...parent,
      children: [...(parent.children || []), newNode],
    }));

    setSelectedNode(newNode);
    setIsEditingNode(true);
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === workingMap.rootNode.id) {
      alert('Cannot delete the root node.');
      return;
    }

    const clone: MindMapContent = JSON.parse(JSON.stringify(workingMap));

    function removeChild(parent: MindMapNode): boolean {
      if (parent.children) {
        const index = parent.children.findIndex((c) => c.id === nodeId);
        if (index !== -1) {
          parent.children.splice(index, 1);
          return true;
        }
        for (const child of parent.children) {
          if (removeChild(child)) return true;
        }
      }
      return false;
    }

    removeChild(clone.rootNode);
    setWorkingMap(clone);
    onSaveTeacherEdits(clone);
    setSelectedNode(clone.rootNode);
  };

  // Save direct node update (e.g. from VisualTreeCanvas)
  const handleSaveNode = (updatedNode: MindMapNode) => {
    updateNodeInTree(updatedNode.id, () => updatedNode);
  };

  // Save node edits from drawer
  const handleSaveNodeEdits = () => {
    if (!selectedNode) return;
    updateNodeInTree(selectedNode.id, (n) => ({
      ...n,
      title: editTitle.trim() || n.title,
      shortDescription: editShortDesc,
      detailedExplanation: editDetailedDesc,
      teacherNotes: teacherNotesText,
    }));
    setIsEditingNode(false);
  };

  // Trigger granular AI node actions
  const handleRunNodeAI = async (action: 'explain_more' | 'simplify' | 'example' | 'question' | 'quiz') => {
    if (!selectedNode) return;
    setIsCallingNodeAi(true);
    setAiActionResult(null);

    const labels: Record<string, string> = {
      explain_more: 'Deep Explanation',
      simplify: 'Simplified for Students',
      example: 'Real-world Examples & Analogies',
      question: 'Class Discussion Questions',
      quiz: 'Quick Check MCQ',
    };

    try {
      const res = await aiTaskService.executeNodeAction({
        action,
        nodeTitle: selectedNode.title,
        nodeContext: `${selectedNode.shortDescription}\n${selectedNode.detailedExplanation}`,
        sourceReferences: selectedNode.sourceReferences.map((s) => `${s.sourceName} (${s.location})`).join(', '),
        language,
      });

      setAiActionResult({
        action: labels[action] || action,
        text: res,
      });
    } catch (err: any) {
      setAiActionResult({
        action: 'Error',
        text: err.message || 'Failed to generate node action.',
      });
    } finally {
      setIsCallingNodeAi(false);
    }
  };

  // Pan & Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.min(Math.max(0.4, z + delta), 2.5));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target as HTMLElement).tagName !== 'BUTTON') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Export JSON, Outline, Interactive HTML, PNG, or SVG
  const handleExport = async (format: 'json' | 'text' | 'html' | 'svg' | 'png') => {
    const filename = `${workingMap.title.replace(/\s+/g, '_')}_knowledge_map`;

    if (format === 'html') {
      KnowledgeExportService.exportToInteractiveHTML(workingMap, `${filename}.html`);
      return;
    }

    if (format === 'svg') {
      KnowledgeExportService.exportToSVG('mindmap-canvas-container', `${filename}.svg`);
      return;
    }

    if (format === 'png') {
      await KnowledgeExportService.exportToPNG('mindmap-canvas-container', `${filename}.png`);
      return;
    }

    let content = '';
    let exportFilename = filename;
    let type = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify(workingMap, null, 2);
      exportFilename += '.json';
      type = 'application/json';
    } else {
      function buildOutline(n: MindMapNode, depth = 0): string {
        const indent = '  '.repeat(depth);
        let str = `${indent}* ${n.title}\n`;
        if (n.shortDescription) str += `${indent}  - ${n.shortDescription}\n`;
        if (n.sourceReferences && n.sourceReferences.length > 0) {
          str += `${indent}  [Source: ${n.sourceReferences.map((s) => `${s.sourceName} ${s.location}`).join(', ')}]\n`;
        }
        if (n.children) {
          for (const c of n.children) {
            str += buildOutline(c, depth + 1);
          }
        }
        return str;
      }
      content = `KNOWLEDGE MAP OUTLINE: ${workingMap.title}\n====================================\n\n` + buildOutline(workingMap.rootNode);
      exportFilename += '_outline.txt';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="mindmap-viewer-wrapper" className="flex flex-col h-[780px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Mind Map Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 gap-3">
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {workingMap.title}
              {isTeacherEdited ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Teacher Edited
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Original AI Output
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive node-based teaching map • Click any node to explore or edit
            </p>
          </div>
        </div>

        {/* View Layout Mode Buttons */}
        <div className="flex items-center gap-2">
          {/* Layer toggles (AI vs Teacher vs Split) */}
          {isTeacherEdited && (
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs mr-2">
              <button
                type="button"
                onClick={() => onSwitchView('ai')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  output.activeView === 'ai'
                    ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-indigo-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Original AI
              </button>
              <button
                type="button"
                onClick={() => onSwitchView('teacher')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  output.activeView === 'teacher'
                    ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-amber-600'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Teacher Edits
              </button>
            </div>
          )}

          {/* Mode switch: Visual Tree, Mind Map (Radial), Classic Tree, Outline */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            <button
              id="btn-mode-visual-tree"
              type="button"
              onClick={() => setDisplayMode('visual_tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                displayMode === 'visual_tree'
                  ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              Visual Tree
            </button>
            <button
              id="btn-mode-radial"
              type="button"
              onClick={() => setDisplayMode('radial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                displayMode === 'radial'
                  ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Mind Map
            </button>
            <button
              id="btn-mode-tree"
              type="button"
              onClick={() => setDisplayMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                displayMode === 'tree'
                  ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Classic Tree
            </button>
            <button
              id="btn-mode-outline"
              type="button"
              onClick={() => setDisplayMode('outline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                displayMode === 'outline'
                  ? 'bg-white dark:bg-slate-900 shadow-xs font-bold text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Outline
            </button>
          </div>

          {/* Canvas Zoom & Pan Controls (For Classic Tree & Radial modes) */}
          {(displayMode === 'tree' || displayMode === 'radial') && (
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
                title="Zoom Out"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-lg cursor-pointer"
              >
                <ZoomOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <span className="px-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                title="Zoom In"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg cursor-pointer"
              >
                <ZoomIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                title="Reset Zoom"
                className="p-1.5 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          )}

          {/* Non-destructive restore AI version */}
          {isTeacherEdited && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRestoreAI}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              title="Revert all teacher edits back to original AI output"
            >
              Restore AI
            </Button>
          )}

          {/* Export Dropdown */}
          <div className="relative group">
            <Button size="sm" variant="outline" icon={<Download className="w-3.5 h-3.5" />}>
              Export
            </Button>
            <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 hidden group-hover:block z-30 text-xs">
              <button
                type="button"
                onClick={() => handleExport('html')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
              >
                <ExternalLink className="w-4 h-4 text-indigo-500" />
                Interactive HTML (.html)
              </button>
              <button
                type="button"
                onClick={() => handleExport('png')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
              >
                <Eye className="w-4 h-4 text-emerald-500" />
                Image Snapshot (.png)
              </button>
              <button
                type="button"
                onClick={() => handleExport('svg')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer font-medium"
              >
                <Split className="w-4 h-4 text-amber-500" />
                Vector Graphic (.svg)
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => handleExport('text')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                Text Outline (.txt)
              </button>
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Mind Map JSON (.json)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mind Map Canvas & Side Detail Drawer Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Canvas Area */}
        <div
          id="mindmap-canvas-container"
          className={`flex-1 relative overflow-hidden select-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] ${
            displayMode === 'tree' || displayMode === 'radial' ? 'cursor-grab active:cursor-grabbing' : 'overflow-y-auto'
          }`}
          onWheel={displayMode === 'tree' || displayMode === 'radial' ? handleWheel : undefined}
          onMouseDown={displayMode === 'tree' || displayMode === 'radial' ? handleMouseDown : undefined}
          onMouseMove={displayMode === 'tree' || displayMode === 'radial' ? handleMouseMove : undefined}
          onMouseUp={displayMode === 'tree' || displayMode === 'radial' ? handleMouseUp : undefined}
          onMouseLeave={displayMode === 'tree' || displayMode === 'radial' ? handleMouseUp : undefined}
        >
          {/* Display Mode 0: VISUAL TREE (Rich Hierarchical Canvas) */}
          {displayMode === 'visual_tree' && (
            <VisualTreeCanvas
              content={workingMap}
              selectedNode={selectedNode}
              onSelectNode={(n) => setSelectedNode(n)}
              onUpdateNode={(updated) => handleSaveNode(updated)}
              className="w-full h-full"
            />
          )}

          {/* Display Mode 1: TREE VIEW */}
          {displayMode === 'tree' && (
            <div
              className="absolute transition-transform duration-75 origin-top-left p-12 min-w-full"
              style={{
                transform: `translate(${pan.x + 80}px, ${pan.y + 60}px) scale(${zoom})`,
              }}
            >
              <TreeNodeItem
                node={workingMap.rootNode}
                selectedNodeId={selectedNode?.id}
                onSelectNode={(n) => setSelectedNode(n)}
                onAddChild={handleAddChildNode}
                level={0}
              />
            </div>
          )}

          {/* Display Mode 2: RADIAL VIEW */}
          {displayMode === 'radial' && (
            <div
              className="absolute transition-transform duration-75 origin-center w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <RadialMindMapLayout
                rootNode={workingMap.rootNode}
                selectedNodeId={selectedNode?.id}
                onSelectNode={(n) => setSelectedNode(n)}
              />
            </div>
          )}

          {/* Display Mode 3: OUTLINE / LIST VIEW */}
          {displayMode === 'outline' && (
            <div className="h-full overflow-y-auto">
              <KnowledgeOutlineView
                content={workingMap}
                selectedNode={selectedNode}
                onSelectNode={(n) => setSelectedNode(n)}
              />
            </div>
          )}
        </div>

        {/* Node Detail & Action Drawer (Right Side) */}
        {selectedNode && (
          <div
            id="node-detail-drawer"
            className="w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full z-20 shadow-xl overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate uppercase tracking-wider">
                  Node Details
                </h4>
              </div>
              <div className="flex items-center gap-1">
                {!isEditingNode && (
                  <button
                    type="button"
                    onClick={() => setIsEditingNode(true)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Edit Node"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {selectedNode.id !== workingMap.rootNode.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Delete Node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isEditingNode ? (
                /* Edit Node Form */
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Node Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Short Summary / One-liner
                    </label>
                    <input
                      type="text"
                      value={editShortDesc}
                      onChange={(e) => setEditShortDesc(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Detailed Pedagogical Explanation
                    </label>
                    <textarea
                      rows={4}
                      value={editDetailedDesc}
                      onChange={(e) => setEditDetailedDesc(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditingNode(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleSaveNodeEdits} icon={<Save className="w-3.5 h-3.5" />}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Node Info */
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {selectedNode.title}
                    </h3>
                    {selectedNode.shortDescription && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {selectedNode.shortDescription}
                      </p>
                    )}
                  </div>

                  {/* Detailed Explanation */}
                  {selectedNode.detailedExplanation && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Detailed Explanation
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedNode.detailedExplanation}
                      </p>
                    </div>
                  )}

                  {/* Key Points */}
                  {selectedNode.keyPoints && selectedNode.keyPoints.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Key Points
                      </span>
                      <ul className="space-y-1">
                        {selectedNode.keyPoints.map((pt, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples */}
                  {selectedNode.examples && selectedNode.examples.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Examples & Analogies
                      </span>
                      <ul className="space-y-1">
                        {selectedNode.examples.map((ex, i) => (
                          <li key={i} className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-200 dark:border-amber-900/50">
                            💡 {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Discussion Questions */}
                  {selectedNode.questions && selectedNode.questions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Classroom Discussion Questions
                      </span>
                      <ul className="space-y-1">
                        {selectedNode.questions.map((q, i) => (
                          <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="font-bold text-indigo-500">Q{i + 1}:</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Grounded Source References */}
                  {selectedNode.sourceReferences && selectedNode.sourceReferences.length > 0 && (
                    <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        Grounded Source Citations
                      </span>
                      {selectedNode.sourceReferences.map((ref, idx) => (
                        <div
                          key={idx}
                          onClick={() => onOpenSourceSnippet?.(ref.sourceName, ref.location)}
                          className="text-xs text-indigo-900 dark:text-indigo-200 bg-white/70 dark:bg-slate-900/70 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors"
                        >
                          <div>
                            <span className="font-semibold">{ref.sourceName}</span>
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 ml-1.5">
                              • {ref.location}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Teacher Notes Area (Stored persistently) */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Teacher Notes (Private)
                    </span>
                    <textarea
                      rows={2}
                      value={teacherNotesText}
                      onChange={(e) => setTeacherNotesText(e.target.value)}
                      onBlur={() => {
                        updateNodeInTree(selectedNode.id, (n) => ({
                          ...n,
                          teacherNotes: teacherNotesText,
                        }));
                      }}
                      placeholder="Add private classroom reminders, student questions, or blackboard layout notes..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Section 15: Granular Node AI Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      AI Node Assistant
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={isCallingNodeAi}
                        onClick={() => handleRunNodeAI('explain_more')}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer disabled:opacity-50"
                      >
                        📖 Explain More
                      </button>
                      <button
                        type="button"
                        disabled={isCallingNodeAi}
                        onClick={() => handleRunNodeAI('simplify')}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer disabled:opacity-50"
                      >
                        🧩 Simplify
                      </button>
                      <button
                        type="button"
                        disabled={isCallingNodeAi}
                        onClick={() => handleRunNodeAI('example')}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer disabled:opacity-50"
                      >
                        💡 Real Example
                      </button>
                      <button
                        type="button"
                        disabled={isCallingNodeAi}
                        onClick={() => handleRunNodeAI('quiz')}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer disabled:opacity-50"
                      >
                        ❓ Check Quiz
                      </button>
                    </div>

                    {isCallingNodeAi && (
                      <div className="flex items-center gap-2 text-xs text-indigo-600 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
                        <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Generating grounded response...
                      </div>
                    )}

                    {aiActionResult && (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                          <span>{aiActionResult.action}</span>
                          <button
                            type="button"
                            onClick={() => setAiActionResult(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            ×
                          </button>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {aiActionResult.text}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Child Node Button */}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleAddChildNode(selectedNode.id)}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add Subtopic to "{selectedNode.title}"
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------------------
// SUB-COMPONENT: Tree Node Item (Recursive Layout)
// -------------------------------------------------------------------------
interface TreeNodeItemProps {
  node: MindMapNode;
  selectedNodeId?: string;
  onSelectNode: (node: MindMapNode) => void;
  onAddChild: (parentId: string) => void;
  level: number;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  selectedNodeId,
  onSelectNode,
  onAddChild,
  level,
}) => {
  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex items-center gap-8 my-3">
      {/* Node Box */}
      <div
        id={`tree-node-${node.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectNode(node);
        }}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none max-w-xs shrink-0 shadow-sm ${
          isSelected
            ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/60'
            : level === 0
            ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 font-bold'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-xs font-bold leading-tight ${
              level === 0
                ? 'text-indigo-700 dark:text-indigo-300 text-sm'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {node.title}
          </h4>
          {node.sourceReferences && node.sourceReferences.length > 0 && (
            <span
              className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"
              title={`${node.sourceReferences.length} source references`}
            />
          )}
        </div>
        {node.shortDescription && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-tight">
            {node.shortDescription}
          </p>
        )}
      </div>

      {/* Children Branches */}
      {hasChildren && (
        <div className="flex flex-col border-l-2 border-indigo-200 dark:border-indigo-900/60 pl-8 space-y-2 relative">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onAddChild={onAddChild}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------------------
// SUB-COMPONENT: Radial Layout
// -------------------------------------------------------------------------
interface RadialProps {
  rootNode: MindMapNode;
  selectedNodeId?: string;
  onSelectNode: (node: MindMapNode) => void;
}

const RadialMindMapLayout: React.FC<RadialProps> = ({
  rootNode,
  selectedNodeId,
  onSelectNode,
}) => {
  const branches = rootNode.children || [];
  const radius = 240;

  return (
    <div className="relative w-[600px] h-[600px] flex items-center justify-center">
      {/* Central Hub */}
      <div
        onClick={() => onSelectNode(rootNode)}
        className={`z-10 p-5 rounded-full border-2 text-center cursor-pointer shadow-lg w-44 h-44 flex flex-col items-center justify-center transition-all ${
          selectedNodeId === rootNode.id
            ? 'border-indigo-600 bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900'
            : 'border-indigo-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-indigo-600'
        }`}
      >
        <span className="text-xs font-black uppercase tracking-wider leading-tight">
          {rootNode.title}
        </span>
        <span className="text-[10px] opacity-75 mt-1">Core Concept</span>
      </div>

      {/* Radial Satellite Nodes */}
      {branches.map((branch, idx) => {
        const angle = (idx / branches.length) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const isSelected = selectedNodeId === branch.id;

        return (
          <div
            key={branch.id}
            onClick={() => onSelectNode(branch)}
            className={`absolute z-10 p-3 rounded-xl border max-w-[160px] text-center cursor-pointer shadow-md transition-all ${
              isSelected
                ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/80 font-bold'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
          >
            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {branch.title}
            </h5>
            {branch.shortDescription && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {branch.shortDescription}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// -------------------------------------------------------------------------
// SUB-COMPONENT: Outline / List View
// -------------------------------------------------------------------------
interface OutlineProps {
  node: MindMapNode;
  selectedNodeId?: string;
  onSelectNode: (node: MindMapNode) => void;
  onAddChild: (parentId: string) => void;
  onDeleteNode: (id: string) => void;
  level: number;
}

const OutlineNodeList: React.FC<OutlineProps> = ({
  node,
  selectedNodeId,
  onSelectNode,
  onAddChild,
  onDeleteNode,
  level,
}) => {
  const isSelected = selectedNodeId === node.id;
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className={`space-y-1.5 ${level > 0 ? 'ml-6 pl-3 border-l border-slate-200 dark:border-slate-800' : ''}`}>
      <div
        onClick={() => onSelectNode(node)}
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
          isSelected
            ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {node.children && node.children.length > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div className="truncate">
            <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {node.title}
            </h5>
            {node.shortDescription && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {node.shortDescription}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id);
            }}
            className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
            title="Add subtopic"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && node.children && (
        <div className="space-y-1.5">
          {node.children.map((child) => (
            <OutlineNodeList
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onAddChild={onAddChild}
              onDeleteNode={onDeleteNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
