/**
 * Knowledge Export & Print Service
 * Supports PNG, SVG, PDF (Print), and Standalone Offline Interactive HTML Export
 */

import { MindMapContent, MindMapNode } from '../../types/ai';

export class KnowledgeExportService {
  /**
   * Export the DOM SVG or HTML element as SVG file
   */
  public static exportToSVG(elementId: string, filename: string = 'knowledge-map.svg'): boolean {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error(`Export error: element #${elementId} not found`);
      return false;
    }

    try {
      const svgEl = el.querySelector('svg') || (el.tagName.toLowerCase() === 'svg' ? (el as unknown as SVGSVGElement) : null);
      let svgContent = '';

      if (svgEl) {
        const serializer = new XMLSerializer();
        svgContent = serializer.serializeToString(svgEl);
      } else {
        // Wrap HTML content in foreignObject SVG
        const rect = el.getBoundingClientRect();
        const width = Math.max(800, rect.width);
        const height = Math.max(600, rect.height);
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${el.innerHTML}
            </div>
          </foreignObject>
        </svg>`;
      }

      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Failed to export SVG:', err);
      return false;
    }
  }

  /**
   * Export the visual element as PNG
   */
  public static async exportToPNG(elementId: string, filename: string = 'knowledge-map.png'): Promise<boolean> {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error(`Export error: element #${elementId} not found`);
      return false;
    }

    try {
      const svgEl = el.querySelector('svg');
      const rect = el.getBoundingClientRect();
      const width = Math.max(1200, rect.width * 2);
      const height = Math.max(800, rect.height * 2);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Fill background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, width, height);

      let svgXml = '';
      if (svgEl) {
        svgXml = new XMLSerializer().serializeToString(svgEl);
      } else {
        svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color:white;font-family:sans-serif;">
              ${el.innerHTML}
            </div>
          </foreignObject>
        </svg>`;
      }

      const img = new Image();
      const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });

      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (err) {
      console.warn('PNG canvas render fallback:', err);
      // Fallback: trigger SVG export if canvas rasterization is blocked
      return this.exportToSVG(elementId, filename.replace('.png', '.svg'));
    }
  }

  /**
   * Export Standalone Offline Interactive HTML File
   */
  public static exportToInteractiveHTML(
    content: MindMapContent,
    filename: string = 'interactive-knowledge-map.html'
  ): boolean {
    try {
      const sanitizedData = JSON.stringify(content).replace(/</g, '\\u003c');
      const title = content.title || 'Interactive Knowledge Map';

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Arpit Academy Udaipura</title>
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #131b2e;
      --card: #1c2640;
      --card-border: #2a3859;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --highlight: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--card-border);
      padding: 1rem 1.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      border-radius: 4px;
      background: rgba(99, 102, 241, 0.2);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .search-input {
      background: var(--card);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 0.45rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      width: 220px;
    }
    .btn {
      background: var(--card);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 0.45rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn:hover {
      background: var(--accent);
      border-color: var(--accent);
    }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
    }
    main {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
    }
    #tree-container {
      flex: 1;
      overflow: auto;
      padding: 2.5rem;
    }
    .tree-node-wrapper {
      position: relative;
      margin-left: 1.75rem;
      border-left: 2px solid var(--card-border);
      padding-left: 1rem;
      margin-bottom: 0.75rem;
    }
    .tree-node-wrapper.root {
      margin-left: 0;
      border-left: none;
      padding-left: 0;
    }
    .node-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 0.85rem 1.1rem;
      max-width: 500px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }
    .node-card:hover {
      border-color: var(--accent);
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.2);
    }
    .node-card.selected {
      border-color: var(--highlight);
      background: #243254;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.4);
    }
    .node-card.match {
      border-color: #f59e0b;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.4);
    }
    .node-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }
    .node-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
    }
    .node-desc {
      font-size: 0.82rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    .node-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.5rem;
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .toggle-btn {
      background: #223050;
      border: 1px solid var(--card-border);
      color: #93c5fd;
      border-radius: 4px;
      padding: 0.15rem 0.45rem;
      font-size: 0.75rem;
      cursor: pointer;
    }
    /* Side Drawer */
    #detail-drawer {
      width: 420px;
      background: var(--surface);
      border-left: 1px solid var(--card-border);
      padding: 1.5rem;
      overflow-y: auto;
      display: none;
    }
    #detail-drawer.open {
      display: block;
    }
    .drawer-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .drawer-section {
      margin-top: 1.25rem;
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 1rem;
    }
    .drawer-section h4 {
      font-size: 0.8rem;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }
    .list-item {
      font-size: 0.85rem;
      color: var(--text);
      margin-bottom: 0.4rem;
      padding-left: 1rem;
      position: relative;
    }
    .list-item::before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--accent);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-title">${escapeHtml(title)}</div>
      <span class="badge">Offline Interactive</span>
    </div>
    <div class="controls">
      <input type="text" id="search-box" class="search-input" placeholder="Search concepts...">
      <button class="btn" onclick="expandAll()">Expand All</button>
      <button class="btn" onclick="collapseAll()">Collapse All</button>
      <button class="btn" onclick="window.print()">Print / PDF</button>
    </div>
  </header>

  <main>
    <div id="tree-container"></div>
    <div id="detail-drawer">
      <button class="btn" style="float:right;" onclick="closeDrawer()">✕</button>
      <div id="drawer-content"></div>
    </div>
  </main>

  <script>
    const data = ${sanitizedData};
    const expandedMap = {};
    let selectedNodeId = null;

    function initExpanded(node) {
      expandedMap[node.id] = true;
      if (node.children) {
        node.children.forEach(initExpanded);
      }
    }
    initExpanded(data.rootNode);

    function renderNode(node, isRoot = false) {
      const isExpanded = expandedMap[node.id] !== false;
      const isSelected = selectedNodeId === node.id;
      const hasChildren = node.children && node.children.length > 0;

      let html = '<div class="tree-node-wrapper ' + (isRoot ? 'root' : '') + '">';
      html += '<div class="node-card ' + (isSelected ? 'selected' : '') + '" onclick="selectNode(\\'' + node.id + '\\')">';
      html += '<div class="node-header">';
      html += '<span class="node-title">' + escapeHtml(node.title) + '</span>';
      if (node.nodeType) {
        html += '<span class="badge">' + escapeHtml(node.nodeType) + '</span>';
      }
      html += '</div>';
      if (node.shortDescription) {
        html += '<p class="node-desc">' + escapeHtml(node.shortDescription) + '</p>';
      }
      html += '<div class="node-footer">';
      html += '<span>' + (hasChildren ? node.children.length + ' subtopics' : 'Leaf concept') + '</span>';
      if (hasChildren) {
        html += '<button class="toggle-btn" onclick="event.stopPropagation(); toggleNode(\\'' + node.id + '\\')">' + (isExpanded ? '− Collapse' : '+ Expand') + '</button>';
      }
      html += '</div>';
      html += '</div>';

      if (hasChildren && isExpanded) {
        html += '<div class="node-children">';
        for (const child of node.children) {
          html += renderNode(child, false);
        }
        html += '</div>';
      }

      html += '</div>';
      return html;
    }

    function renderTree() {
      const container = document.getElementById('tree-container');
      container.innerHTML = renderNode(data.rootNode, true);
    }

    function findNode(node, id) {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const res = findNode(child, id);
          if (res) return res;
        }
      }
      return null;
    }

    function selectNode(id) {
      selectedNodeId = id;
      renderTree();
      const node = findNode(data.rootNode, id);
      if (!node) return;

      const drawer = document.getElementById('detail-drawer');
      const content = document.getElementById('drawer-content');
      drawer.classList.add('open');

      let body = '<div class="drawer-title">' + escapeHtml(node.title) + '</div>';
      if (node.nodeType) {
        body += '<span class="badge">' + escapeHtml(node.nodeType) + '</span>';
      }
      if (node.detailedExplanation) {
        body += '<div class="drawer-section"><h4>Explanation</h4><p style="font-size:0.9rem;line-height:1.5;">' + escapeHtml(node.detailedExplanation) + '</p></div>';
      }
      if (node.keyPoints && node.keyPoints.length) {
        body += '<div class="drawer-section"><h4>Important Points</h4>';
        node.keyPoints.forEach(p => body += '<div class="list-item">' + escapeHtml(p) + '</div>');
        body += '</div>';
      }
      if (node.examples && node.examples.length) {
        body += '<div class="drawer-section"><h4>Classroom Examples</h4>';
        node.examples.forEach(e => body += '<div class="list-item">' + escapeHtml(e) + '</div>');
        body += '</div>';
      }
      if (node.questions && node.questions.length) {
        body += '<div class="drawer-section"><h4>Checkpoint Questions</h4>';
        node.questions.forEach(q => body += '<div class="list-item">' + escapeHtml(q) + '</div>');
        body += '</div>';
      }
      if (node.sourceReferences && node.sourceReferences.length) {
        body += '<div class="drawer-section"><h4>Source Grounding</h4>';
        node.sourceReferences.forEach(s => body += '<div class="list-item"><strong>' + escapeHtml(s.sourceName) + '</strong> (' + escapeHtml(s.location) + ')</div>');
        body += '</div>';
      }

      content.innerHTML = body;
    }

    function toggleNode(id) {
      expandedMap[id] = !expandedMap[id];
      renderTree();
    }

    function expandAll() {
      function expand(n) {
        expandedMap[n.id] = true;
        if (n.children) n.children.forEach(expand);
      }
      expand(data.rootNode);
      renderTree();
    }

    function collapseAll() {
      function collapse(n) {
        expandedMap[n.id] = false;
        if (n.children) n.children.forEach(collapse);
      }
      collapse(data.rootNode);
      expandedMap[data.rootNode.id] = true;
      renderTree();
    }

    function closeDrawer() {
      document.getElementById('detail-drawer').classList.remove('open');
      selectedNodeId = null;
      renderTree();
    }

    document.getElementById('search-box').addEventListener('input', function(e) {
      const q = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.node-card');
      cards.forEach(card => {
        if (!q) {
          card.classList.remove('match');
        } else if (card.textContent.toLowerCase().includes(q)) {
          card.classList.add('match');
        } else {
          card.classList.remove('match');
        }
      });
    });

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    renderTree();
  </script>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Interactive HTML export failed:', err);
      return false;
    }
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
