import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Zap, ZapOff, X, Camera, RefreshCw, AlertCircle, Volume2 } from 'lucide-react';
import { getSettings } from '../utils/storage';
import { triggerScanSuccessFeedback } from '../utils/feedback';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  title?: string;
  subtitle?: string;
  autoCloseOnScan?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Pindai Barcode',
  subtitle = 'Arahkan kamera ke barcode kemasan barang',
  autoCloseOnScan = true,
}) => {
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const settings = getSettings();

  // Helper to toggle torch directly on the video stream track
  const setTorchState = useCallback(async (enable: boolean) => {
    try {
      const videoEl = document.querySelector('#toko-qu-scanner-container video') as HTMLVideoElement;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          if (capabilities.torch) {
            await track.applyConstraints({
              advanced: [{ torch: enable } as any],
            });
            setTorchOn(enable);
            setTorchSupported(true);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Torch control not supported or failed:', e);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    setIsInitializing(true);
    setScannerError(null);
    setTorchOn(false);
    setTorchSupported(false);

    const scannerId = 'toko-qu-scanner-container';

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            const now = Date.now();
            const clean = decodedText.trim();
            // Debounce scanner to avoid rapid fire of same code
            if (clean === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 2000) {
              return;
            }

            lastScannedCodeRef.current = clean;
            lastScannedTimeRef.current = now;

            // Trigger sound & haptic vibration as requested by user!
            triggerScanSuccessFeedback(settings);

            onScanSuccess(clean);

            if (autoCloseOnScan) {
              onClose();
            }
          },
          () => {
            // Frame parse error - ignore standard noise
          }
        );

        if (!isMounted) return;
        setIsInitializing(false);

        // Check torch support & auto-torch if enabled in settings
        setTimeout(async () => {
          if (!isMounted) return;
          const videoEl = document.querySelector('#toko-qu-scanner-container video') as HTMLVideoElement;
          if (videoEl && videoEl.srcObject) {
            const stream = videoEl.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            if (track) {
              const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
              if (capabilities.torch) {
                setTorchSupported(true);
                // "Kasih pengaturan buat kaya flash pas buka menu scan barcode buat cej harga"
                if (settings.scanAutoTorch) {
                  await setTorchState(true);
                }
              }
            }
          }
        }, 600);

      } catch (err: any) {
        if (!isMounted) return;
        console.error('Scanner init error:', err);
        setScannerError(
          err?.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser.'
        );
        setIsInitializing(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .then(() => {
              html5QrCodeRef.current?.clear();
            })
            .catch(() => {});
        } else {
          html5QrCodeRef.current.clear();
        }
      }
    };
  }, [isOpen, facingMode, autoCloseOnScan, onClose, onScanSuccess, setTorchState, settings.scanAutoTorch]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      triggerScanSuccessFeedback(settings);
      onScanSuccess(manualCode.trim());
      setManualCode('');
      if (autoCloseOnScan) {
        onClose();
      }
    }
  };

  const handleToggleTorch = async () => {
    await setTorchState(!torchOn);
  };

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          <div id="toko-qu-scanner-container" className="w-full h-full min-h-[300px]"></div>

          {/* Aiming Reticle / Scan Line overlay */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="relative w-64 h-36 border-2 border-amber-400/80 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center">
              <div className="absolute inset-x-0 h-0.5 bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse"></div>
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-amber-300"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-amber-300"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-amber-300"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-amber-300"></div>
            </div>
            <p className="text-xs font-medium text-amber-300/90 mt-3 drop-shadow bg-black/50 px-3 py-1 rounded-full">
              Posisikan garis merah/kuning tepat di barcode
            </p>
          </div>

          {/* Quick Floating Controls (Flash & Switch Cam) */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {torchSupported && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg ${
                  torchOn
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-bold'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                title={torchOn ? 'Matikan Lampu Senter' : 'Nyalakan Lampu Senter'}
              >
                {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleSwitchCamera}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md shadow-lg transition-colors"
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Scanner Indicators */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-slate-300 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md">
            {settings.scanVibrate && <span className="flex items-center gap-1">📳 Getar Aktif</span>}
            {settings.soundBeep && (
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-emerald-400" /> Bip
              </span>
            )}
          </div>

          {/* Loading or Error State */}
          {isInitializing && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-slate-300 z-20">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-3" />
              <p className="font-medium text-sm">Menyiapkan kamera Toko Qu...</p>
              <p className="text-xs text-slate-400 mt-1">Nyalakan senter jika barcode di tempat gelap</p>
            </div>
          )}

          {scannerError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center text-slate-200 z-20">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
              <p className="font-semibold text-rose-400 text-sm">Kamera Tidak Dapat Dibuka</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{scannerError}</p>
              <p className="text-xs text-amber-400 mt-2 font-medium">
                Kamu tetap bisa mengetik nomor barcode di bawah ini:
              </p>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Bar */}
        <div className="p-3 bg-slate-800 border-t border-slate-700">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Atau ketik barcode manual di sini..."
              className="flex-1 px-3 py-2 text-sm bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg transition-colors"
            >
              OK
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
