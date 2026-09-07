import React, { useRef, useEffect, useState } from 'react';
import { CameraLayoutMode } from '../../types/teaching';
import { cameraService } from '../../services/teaching/cameraService';
import {
  Video,
  VideoOff,
  RefreshCw,
  Move,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';

interface TeacherCameraOverlayProps {
  layout: CameraLayoutMode;
  onClose: () => void;
  onChangeLayout: (layout: CameraLayoutMode) => void;
  stream: MediaStream | null;
}

export const TeacherCameraOverlay: React.FC<TeacherCameraOverlayProps> = ({
  layout,
  onClose,
  onChangeLayout,
  stream,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Position state for floating 'bubble' and 'pip'
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Camera video autoplay notice:', err);
      });
    }
  }, [stream]);

  const handleFlipCamera = async () => {
    try {
      await cameraService.toggleFacingMode();
    } catch (e) {
      console.warn('Could not flip camera:', e);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (layout !== 'bubble') return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setPosition({
      x: Math.max(10, dragStartRef.current.startX + dx),
      y: Math.max(10, dragStartRef.current.startY + dy),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (layout === 'off' || !stream) {
    return null;
  }

  // Bubble Layout (Floating circle)
  if (layout === 'bubble') {
    return (
      <div
        id="teacher-camera-bubble"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="absolute z-30 cursor-move group select-none shadow-2xl transition-shadow hover:ring-4 hover:ring-indigo-500/50 rounded-full"
        style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
      >
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-3 border-indigo-500 bg-slate-900 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />

          {/* Hover Action Controls */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={handleFlipCamera}
              title="Flip Front/Back Camera"
              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeLayout('pip')}
              title="Switch to PiP"
              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-xs cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Turn Camera Off"
              className="p-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PiP Layout (Bottom-right rectangle)
  if (layout === 'pip') {
    return (
      <div
        id="teacher-camera-pip"
        className="absolute bottom-6 right-6 z-30 group select-none rounded-2xl overflow-hidden border-2 border-indigo-500/70 shadow-2xl bg-slate-900 w-52 sm:w-64 aspect-video"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
        />

        {/* Action Header */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-1.5 py-0.5 rounded-lg backdrop-blur-xs">
          <button
            onClick={handleFlipCamera}
            title="Flip Camera"
            className="p-1 text-white hover:text-indigo-300 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={() => onChangeLayout('bubble')}
            title="Switch to Bubble"
            className="p-1 text-white hover:text-indigo-300 cursor-pointer"
          >
            <Move className="w-3 h-3" />
          </button>
          <button
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

  // Fullscreen Layout
  if (layout === 'fullscreen') {
    return (
      <div
        id="teacher-camera-fullscreen"
        className="absolute inset-0 z-30 bg-slate-950 flex items-center justify-center"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl backdrop-blur-xs">
          <button
            onClick={handleFlipCamera}
            className="text-xs text-white flex items-center gap-1 hover:text-indigo-300 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Flip</span>
          </button>
          <button
            onClick={() => onChangeLayout('bubble')}
            className="text-xs text-white flex items-center gap-1 hover:text-indigo-300 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      </div>
    );
  }

  // Side by Side Layout is rendered inside the layout grid in TeachingStudio
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
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg backdrop-blur-xs">
        <button
          onClick={handleFlipCamera}
          title="Flip Camera"
          className="p-1 text-white hover:text-indigo-300 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChangeLayout('bubble')}
          title="Switch to Floating Bubble"
          className="p-1 text-white hover:text-indigo-300 cursor-pointer"
        >
          <Move className="w-3.5 h-3.5" />
        </button>
        <button
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
