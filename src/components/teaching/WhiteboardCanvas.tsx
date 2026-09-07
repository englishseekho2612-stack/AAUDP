import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  AnnotationStroke,
  AnnotationTool,
  Point,
  LaserPointerState,
} from '../../types/teaching';

interface WhiteboardCanvasProps {
  isStandaloneWhiteboard?: boolean;
  activeTool: AnnotationTool;
  penColor: string;
  penSize: number;
  strokes: AnnotationStroke[];
  onStrokesChange: (strokes: AnnotationStroke[]) => void;
  showAnnotations: boolean;
  isFrozen: boolean;
  onSnapshotReady?: (canvas: HTMLCanvasElement) => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  isStandaloneWhiteboard = false,
  activeTool,
  penColor,
  penSize,
  strokes,
  onStrokesChange,
  showAnnotations,
  isFrozen,
  onSnapshotReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<Point[]>([]);
  const [laserPoint, setLaserPoint] = useState<LaserPointerState>({
    active: false,
    x: 0,
    y: 0,
    lastUpdated: 0,
  });

  // Redraw canvas whenever strokes, tool, visibility or frozen mode changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If standalone whiteboard, draw clean solid background
    if (isStandaloneWhiteboard) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle dot grid
      ctx.fillStyle = '#e2e8f0';
      const gap = 32;
      for (let x = gap; x < canvas.width; x += gap) {
        for (let y = gap; y < canvas.height; y += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // If annotations are hidden, don't draw strokes (Section 29)
    if (!showAnnotations) return;

    // Draw all completed strokes
    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length === 0) continue;

      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;

      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.35;
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      if (stroke.tool === 'pen' || stroke.tool === 'highlighter') {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.tool === 'line') {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      } else if (stroke.tool === 'arrow') {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const headlen = stroke.size * 3 + 8;
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(
          p2.x - headlen * Math.cos(angle - Math.PI / 6),
          p2.y - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          p2.x - headlen * Math.cos(angle + Math.PI / 6),
          p2.y - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      } else if (stroke.tool === 'rect') {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (stroke.tool === 'circle') {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        const rx = Math.abs(p2.x - p1.x) / 2;
        const ry = Math.abs(p2.y - p1.y) / 2;
        const cx = Math.min(p1.x, p2.x) + rx;
        const cy = Math.min(p1.y, p2.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (stroke.tool === 'text' && stroke.text) {
        ctx.font = `${stroke.size * 4 + 12}px sans-serif`;
        ctx.fillText(stroke.text, stroke.points[0].x, stroke.points[0].y);
      }

      ctx.restore();
    }
  }, [strokes, isStandaloneWhiteboard, showAnnotations]);

  // Canvas Resize Observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redraw();
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [redraw]);

  // Trigger redraw on strokes change
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle Laser pointer fade out loop (Section 28)
  useEffect(() => {
    if (!laserPoint.active) return;
    const interval = setInterval(() => {
      if (Date.now() - laserPoint.lastUpdated > 1200) {
        setLaserPoint((p) => ({ ...p, active: false }));
      }
    }, 150);
    return () => clearInterval(interval);
  }, [laserPoint]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const p = getCanvasCoords(e);

    // Laser pointer mode (Section 28)
    if (activeTool === 'laser') {
      setLaserPoint({
        active: true,
        x: p.x,
        y: p.y,
        lastUpdated: Date.now(),
      });
      return;
    }

    // Eraser mode: remove stroke touching this point
    if (activeTool === 'eraser') {
      const filtered = strokes.filter((s) => {
        return !s.points.some((pt) => Math.hypot(pt.x - p.x, pt.y - p.y) < 18);
      });
      if (filtered.length !== strokes.length) {
        onStrokesChange(filtered);
      }
      return;
    }

    // Text tool: prompt for text placement
    if (activeTool === 'text') {
      const text = window.prompt('Enter annotation text:');
      if (text && text.trim()) {
        const newStroke: AnnotationStroke = {
          id: `stroke_${Date.now()}`,
          tool: 'text',
          points: [p],
          color: penColor,
          size: penSize,
          opacity: 1,
          text: text.trim(),
          timestamp: Date.now(),
        };
        onStrokesChange([...strokes, newStroke]);
      }
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [p];
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const p = getCanvasCoords(e);

    if (activeTool === 'laser') {
      setLaserPoint({
        active: true,
        x: p.x,
        y: p.y,
        lastUpdated: Date.now(),
      });
      return;
    }

    if (!isDrawingRef.current) return;

    currentPointsRef.current.push(p);

    // Fast direct drawing to canvas during stroke creation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      ctx.save();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.35 : 1;

      const pts = currentPointsRef.current;
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Shape tools: redraw to show live bounding guide
      redraw();
      ctx.save();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
      const pts = currentPointsRef.current;
      const p1 = pts[0];
      const p2 = pts[pts.length - 1];

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      } else if (activeTool === 'rect') {
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (activeTool === 'circle') {
        const rx = Math.abs(p2.x - p1.x) / 2;
        const ry = Math.abs(p2.y - p1.y) / 2;
        const cx = Math.min(p1.x, p2.x) + rx;
        const cy = Math.min(p1.y, p2.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPointsRef.current.length > 0) {
      const newStroke: AnnotationStroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        tool: activeTool,
        points: [...currentPointsRef.current],
        color: penColor,
        size: penSize,
        opacity: activeTool === 'highlighter' ? 0.35 : 1,
        timestamp: Date.now(),
      };
      onStrokesChange([...strokes, newStroke]);
    }
    currentPointsRef.current = [];
  };

  return (
    <div
      id="whiteboard-canvas-wrapper"
      className="absolute inset-0 pointer-events-auto z-10 select-none overflow-hidden touch-none"
    >
      <canvas
        ref={canvasRef}
        id="whiteboard-annotation-canvas"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className={`w-full h-full block ${
          activeTool === 'laser'
            ? 'cursor-none'
            : activeTool === 'eraser'
            ? 'cursor-cell'
            : activeTool === 'text'
            ? 'cursor-text'
            : 'cursor-crosshair'
        }`}
      />

      {/* Laser Pointer Dot (Section 28) */}
      {laserPoint.active && (
        <div
          id="laser-pointer-dot"
          className="absolute w-5 h-5 rounded-full bg-rose-500 shadow-[0_0_18px_6px_rgba(244,63,94,0.9)] pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 z-50 animate-ping"
          style={{ left: laserPoint.x, top: laserPoint.y }}
        />
      )}

      {/* Freeze Screen Badge (Section 25) */}
      {isFrozen && (
        <div
          id="frozen-screen-indicator"
          className="absolute top-4 left-4 bg-cyan-600/90 text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg backdrop-blur-xs flex items-center gap-2 pointer-events-none z-30"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Screen Frozen — Notes Enabled</span>
        </div>
      )}
    </div>
  );
};
