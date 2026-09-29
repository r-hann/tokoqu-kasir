import { AppSettings } from '../types/pos';

let audioCtx: AudioContext | null = null;

export function playBeepSound(frequency = 1900, durationMs = 85) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Envelope to avoid click sounds
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch (err) {
    console.warn('Audio feedback error:', err);
  }
}

export function triggerVibrate(pattern: number | number[] = 90) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    console.warn('Vibration feedback error:', err);
  }
}

export function triggerScanSuccessFeedback(settings: Pick<AppSettings, 'soundBeep' | 'scanVibrate'>) {
  if (settings.scanVibrate) {
    triggerVibrate([80, 40, 80]); // Distinct tactile feedback
  }
  if (settings.soundBeep) {
    playBeepSound(2100, 90);
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
