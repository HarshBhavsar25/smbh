"use client";

import { useState, useEffect } from "react";
import { Download, HelpCircle, X } from "lucide-react";

interface InstallAppButtonProps {
  appName?: string;
  /** Extra Tailwind classes on the outer button wrapper */
  className?: string;
}

export default function InstallAppButton({
  appName = "Shree Mauli Hostel",
  className = "",
}: InstallAppButtonProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect mobile
    const check = () => {
      const mobile =
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ||
        window.innerWidth < 768;
      setIsMobile(mobile);
    };
    check();
    window.addEventListener("resize", check);

    // Hide if already running as standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener("resize", check);
  }, []);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  // Listen for the native install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Don't render on desktop or if already installed as PWA
  if (!isMobile || installed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <>
      <button
        onClick={handleInstall}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer ${className}`}
        title={`Install ${appName}`}
      >
        <Download size={12} />
        Install App
      </button>

      {/* Manual Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl max-w-xs w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-white">Install {appName}</h3>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>
            {isiOS ? (
              <p className="text-muted-foreground text-xs leading-relaxed">
                In Safari, tap the{" "}
                <span className="text-white font-semibold">Share</span> button (
                <span className="text-white">⬆</span>) at the bottom, then choose{" "}
                <span className="text-white font-semibold">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="text-muted-foreground text-xs leading-relaxed">
                Tap the browser menu (⋮) and select{" "}
                <span className="text-white font-semibold">Install App</span> or{" "}
                <span className="text-white font-semibold">Add to Home Screen</span>.
              </p>
            )}
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full mt-5 py-2 bg-[#1c1c21] hover:bg-white/5 text-white font-semibold text-xs rounded-xl border border-white/5 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
