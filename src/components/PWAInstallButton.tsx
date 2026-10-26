// AFRICAN CROWNS: EMPIRES OF THE SUN
// PWA Install Prompt Hook & UI Button

import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone app mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold shadow-md transition"
      >
        <span>📲</span>
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-700/60 bg-black/40 text-amber-200 text-xs font-medium hover:bg-amber-950/60 transition"
        >
          <span>📲</span>
          <span>Install on Android / iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
            <div className="w-full max-w-sm rounded-2xl bg-[#24130a] border border-amber-600 p-5 text-amber-100 shadow-2xl">
              <h3 className="text-sm font-bold text-amber-300">Install to Home Screen</h3>
              <p className="mt-2 text-xs text-amber-100/90 leading-relaxed">
                1. Tap the browser menu (or Share button on Safari).<br />
                2. Select <strong>Add to Home screen</strong> or <strong>Install App</strong>.<br />
                3. Launch directly from your home screen for an authentic fullscreen mobile experience!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-amber-600 py-2 text-xs font-bold text-stone-950 hover:bg-amber-500 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
