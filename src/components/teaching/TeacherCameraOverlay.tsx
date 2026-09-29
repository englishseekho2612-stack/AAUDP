import React, { useRef, useEffect, useState } from 'react';
import { CameraLayoutMode } from '../../types/teaching';
import { cameraService } from '../../services/teaching/cameraService';
import {
  RefreshCw,
  Move,
  Maximize2,
  Minimize2,
  X,
  Sliders,
} from 'lucide-react';

export type BubbleSize = 'small' | 'medium' | 'large';

interface TeacherCameraOverlayProps {
  layout: CameraLayoutMode;
  onClose: () => void;
  onChangeLayout: (layout: CameraLayoutMode) => void;
  stream: MediaStream | null;
  initialSize?: BubbleSize;
}

export const TeacherCameraOverlay: React.FC<TeacherCameraOverlayProps> = ({
  layout,
  onClose,
  onChangeLayout,
  stream,
  initialSize = 'medium',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Position state (distance from right and bottom edges in px)
  const [position, setPosition] = useState({ x: 24, y: 84 });
  const [isDragging, setIsDragging] = useState(false);
  const [bubbleSize, setBubbleSize] = useState<BubbleSize>(initialSize);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, startRight: 0, startBottom: 0 });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Camera video autoplay notice:', err);
      });
    }
  }, [stream]);

  const handleFlipCamera = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cameraService.toggleFacingMode();
    } catch (e) {
      console.warn('Could not flip camera:', e);
    }
  };

  // Cycle bubble size: small -> medium -> large -> small
  const handleToggleSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBubbleSize((prev) => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      return 'small';
    });
  };

  // Pointer event handlers with pointer capture for flawless dragging on mouse, touch & stylus
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (layout !== 'bubble') return;
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;

    const el = e.currentTarget;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }

    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startRight: position.x,
      startBottom: position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    // Moving pointer RIGHT (positive dx) means distance from right edge DECREASES
    const dx = e.clientX - dragStartRef.current.pointerX;
    // Moving pointer DOWN (positive dy) means distance from bottom edge DECREASES
    const dy = e.clientY - dragStartRef.current.pointerY;

    // Viewport bounds calculation
    const sizePx = bubbleSize === 'small' ? 108 : bubbleSize === 'large' ? 176 : 140;
    const maxRight = Math.max(10, (window.innerWidth || 1000) - sizePx - 20);
    const maxBottom = Math.max(10, (window.innerHeight || 800) - sizePx - 20);

    const newRight = Math.min(Math.max(10, dragStartRef.current.startRight - dx), maxRight);
    const newBottom = Math.min(Math.max(10, dragStartRef.current.startBottom - dy), maxBottom);

    setPosition({ x: newRight, y: newBottom });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // fallback
      }
    }
  };

  if (layout === 'off' || !stream) {
    return null;
  }

  // Dimension classes based on size
  const bubbleDimensions =
    bubbleSize === 'small'
      ? 'w-24 h-24 sm:w-28 sm:h-28'
      : bubbleSize === 'large'
      ? 'w-36 h-36 sm:w-44 sm:h-44'
      : 'w-28 h-28 sm:w-36 sm:h-36';

  // 1. BUBBLE LAYOUT (Floating teacher circle / avatar)
  if (layout === 'bubble') {
    return (
      <div
        id="teacher-camera-bubble"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
          touchAction: 'none',
        }}
        className={`fixed z-40 select-none cursor-grab active:cursor-grabbing transition-transform ${
          isDragging ? 'scale-105 shadow-2xl ring-4 ring-emerald-500' : 'hover:scale-102 shadow-xl ring-2 ring-emerald-500/80'
        } rounded-full`}
        title="Teacher Camera (Drag anywhere on board)"
      >
        <div className={`relative ${bubbleDimensions} rounded-full overflow-hidden border-2 border-emerald-400 bg-slate-950 shadow-2xl transition-all`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Teacher Badge */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur-xs text-[9px] font-bold text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 pointer-events-none whitespace-nowrap">
            Arpit Sir
          </div>

          {/* Size Indicator Badge (bottom) */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-slate-900/80 text-[8px] font-bold uppercase text-slate-300 px-1.5 py-0.2 rounded-full pointer-events-none">
            {bubbleSize}
          </div>

          {/* Quick Action Overlay on Hover/Focus */}
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
            <button
              type="button"
              onClick={handleFlipCamera}
              title="Flip Camera"
              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-xs cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleToggleSize}
              title={`Resize Bubble (Current: ${bubbleSize})`}
              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-xs cursor-pointer transition-colors"
            >
              <Sliders className="w-3 h-3 text-amber-300" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeLayout('pip');
              }}
              title="Switch to PiP Box"
              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-xs cursor-pointer transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Turn Camera Off"
              className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-full cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. PIP LAYOUT (Bottom-right rectangle)
  if (layout === 'pip') {
    return (
      <div
        id="teacher-camera-pip"
        className="fixed bottom-6 right-6 z-40 group select-none rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-2xl bg-slate-950 w-44 sm:w-56 aspect-video"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />

        <div className="absolute top-2 left-2 bg-slate-900/80 text-[10px] font-bold text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
          Teacher Cam
        </div>

        {/* Action Header */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-1.5 py-0.5 rounded-lg backdrop-blur-xs">
          <button
            type="button"
            onClick={handleFlipCamera}
            title="Flip Camera"
            className="p-1 text-white hover:text-emerald-300 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onChangeLayout('bubble')}
            title="Switch to Floating Bubble"
            className="p-1 text-white hover:text-emerald-300 cursor-pointer"
          >
            <Move className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Turn Camera Off"
            className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // 3. FULLSCREEN LAYOUT
  if (layout === 'fullscreen') {
    return (
      <div
        id="teacher-camera-fullscreen"
        className="fixed inset-0 z-40 bg-slate-950 flex items-center justify-center"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-xl backdrop-blur-xs">
          <button
            type="button"
            onClick={handleFlipCamera}
            className="text-xs text-white flex items-center gap-1 hover:text-emerald-300 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Flip</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeLayout('bubble')}
            className="text-xs text-white flex items-center gap-1 hover:text-emerald-300 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Floating Bubble</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Side-by-side or embedded layout
  return (
    <div
      id="teacher-camera-side-by-side"
      className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex items-center justify-center"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded-lg backdrop-blur-xs">
        <button
          type="button"
          onClick={handleFlipCamera}
          title="Flip Camera"
          className="p-1 text-white hover:text-emerald-300 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChangeLayout('bubble')}
          title="Switch to Floating Bubble"
          className="p-1 text-white hover:text-emerald-300 cursor-pointer"
        >
          <Move className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Turn Camera Off"
          className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
