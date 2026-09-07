import React, { useState, useEffect, useRef } from 'react';
import { cameraService, CameraDevice } from '../../services/teaching/cameraService';
import { CameraLayoutMode } from '../../types/teaching';
import {
  Video,
  VideoOff,
  RefreshCw,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react';

interface CameraSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayout: CameraLayoutMode;
  onChangeLayout: (layout: CameraLayoutMode) => void;
  onCameraToggled: (active: boolean) => void;
}

export const CameraSettingsModal: React.FC<CameraSettingsModalProps> = ({
  isOpen,
  onClose,
  activeLayout,
  onChangeLayout,
  onCameraToggled,
}) => {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    cameraService
      .detectCameras()
      .then((devs) => {
        setDevices(devs);
        const curId = cameraService.getActiveDeviceId() || devs[0]?.deviceId || '';
        setActiveDeviceId(curId);
        setFacing(cameraService.getFacingMode());

        if (cameraService.isActive()) {
          const s = cameraService.getStream();
          setStream(s);
          if (videoPreviewRef.current && s) {
            videoPreviewRef.current.srcObject = s;
          }
        } else {
          // Start preview stream
          cameraService
            .startCamera(curId)
            .then((s) => {
              setStream(s);
              if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = s;
              }
              onCameraToggled(true);
            })
            .catch((err) => {
              setError(err.message);
            });
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [isOpen, onCameraToggled]);

  if (!isOpen) return null;

  const handleDeviceChange = async (newDeviceId: string) => {
    setActiveDeviceId(newDeviceId);
    try {
      setError(null);
      const s = await cameraService.startCamera(newDeviceId);
      setStream(s);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = s;
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleFlip = async () => {
    try {
      setError(null);
      const s = await cameraService.toggleFacingMode();
      setStream(s);
      setFacing(cameraService.getFacingMode());
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = s;
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div
      id="camera-settings-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Camera Configuration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Device selection, live preview and placement layout
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Live Preview Viewport */}
          <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {stream && !error ? (
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : error ? (
              <div className="p-4 text-center text-rose-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
                <p className="font-semibold text-xs">{error}</p>
                <p className="text-[11px] text-slate-500">
                  Ensure camera permissions are allowed in your browser settings.
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-500">
                <VideoOff className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                <span>Camera feed inactive</span>
              </div>
            )}

            {/* Quick action badges on preview */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={handleFlip}
                className="px-2.5 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Flip ({facing === 'user' ? 'Front' : 'Rear'})</span>
              </button>
            </div>
          </div>

          {/* Camera Device Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Camera Input Source
            </label>
            <select
              id="select-camera-device"
              value={activeDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Placement Layout Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Overlay Layout Placement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'bubble', name: 'Floating Bubble', desc: 'Draggable circle' },
                { id: 'pip', name: 'PiP', desc: 'Corner 16:9 box' },
                { id: 'side_by_side', name: 'Side by Side', desc: '50% split' },
                { id: 'fullscreen', name: 'Fullscreen', desc: 'Full canvas' },
              ].map((layoutOpt) => (
                <button
                  key={layoutOpt.id}
                  onClick={() => onChangeLayout(layoutOpt.id as CameraLayoutMode)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    activeLayout === layoutOpt.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs block">{layoutOpt.name}</span>
                  <span className="text-[10px] text-slate-400 block">{layoutOpt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Apply Camera Settings
          </button>
        </div>
      </div>
    </div>
  );
};
