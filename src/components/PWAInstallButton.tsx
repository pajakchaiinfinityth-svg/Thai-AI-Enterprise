import React, { useState } from 'react';
import { Download, WifiOff, Wifi } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gold-500/15 border border-gold-500/30 px-3 py-1.5 text-xs font-bold text-gold-400 shadow-sm hover:bg-gold-500 hover:text-white transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-bold text-gold-400 hover:bg-gold-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          Install on iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white">Install on iPhone / iPad</h3>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-gold-500 py-2.5 text-sm font-bold text-white hover:bg-gold-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 border border-amber-400/40 px-4 py-2 text-xs font-bold text-black shadow-2xl backdrop-blur-md">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>Offline Mode — Accessing IndexedDB cached briefings & learning log</span>
    </div>
  );
};
