/**
 * Camera Hardware & Stream Service
 * 
 * Supports:
 * - Device enumeration (Front / Back / External webcams)
 * - User facing vs. Environment facing toggle
 * - Safe permissions check with clear human-readable status
 * - Stream lifecycle management (stop tracks on unmount)
 */

export interface CameraDevice {
  deviceId: string;
  label: string;
  facingMode?: 'user' | 'environment';
}

export class CameraService {
  private currentStream: MediaStream | null = null;
  private activeDeviceId: string | null = null;
  private facingMode: 'user' | 'environment' = 'user';
  private detectedDevices: CameraDevice[] = [];
  private isCameraActive = false;

  async detectCameras(): Promise<CameraDevice[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => {
          let label = d.label || `Camera ${index + 1}`;
          const isBack = /back|rear|environment/i.test(label);
          const isFront = /front|user|facetime/i.test(label);

          return {
            deviceId: d.deviceId,
            label: `${label}${isBack ? ' 📷 (Rear)' : isFront ? ' 🤳 (Front)' : ''}`,
            facingMode: isBack ? ('environment' as const) : ('user' as const),
          };
        });

      this.detectedDevices = videoInputs;
      if (!this.activeDeviceId && videoInputs.length > 0) {
        this.activeDeviceId = videoInputs[0].deviceId;
      }
      return videoInputs;
    } catch (err) {
      console.warn('Could not enumerate cameras:', err);
      return [];
    }
  }

  async startCamera(deviceId?: string, facing?: 'user' | 'environment'): Promise<MediaStream> {
    this.stopCamera();

    const targetDeviceId = deviceId || this.activeDeviceId || undefined;
    const targetFacing = facing || this.facingMode;

    const constraints: MediaStreamConstraints = {
      video: targetDeviceId
        ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: targetFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };

    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isCameraActive = true;
      if (targetDeviceId) {
        this.activeDeviceId = targetDeviceId;
      }
      this.facingMode = targetFacing;

      // Re-populate device labels once permission granted
      await this.detectCameras();

      return this.currentStream;
    } catch (err: unknown) {
      this.isCameraActive = false;
      const errorObj = err as Error;
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        throw new Error('Camera access was denied by user or browser permission policy.');
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        throw new Error('No camera hardware detected on this device.');
      } else if (errorObj.name === 'NotReadableError' || errorObj.name === 'TrackStartError') {
        throw new Error('Camera is currently in use by another application.');
      }
      throw new Error(`Failed to access camera: ${errorObj.message}`);
    }
  }

  async toggleFacingMode(): Promise<MediaStream> {
    const nextFacing = this.facingMode === 'user' ? 'environment' : 'user';
    return this.startCamera(undefined, nextFacing);
  }

  getStream(): MediaStream | null {
    return this.currentStream;
  }

  isActive(): boolean {
    return this.isCameraActive;
  }

  getActiveDeviceId(): string | null {
    return this.activeDeviceId;
  }

  getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }

  getDetectedDevices(): CameraDevice[] {
    return this.detectedDevices;
  }

  stopCamera() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
    this.isCameraActive = false;
  }
}

export const cameraService = new CameraService();
