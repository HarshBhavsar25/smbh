"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Download, HelpCircle } from "lucide-react";

export default function InstallBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // 1. Detect if the user is on a mobile device and banner was not dismissed
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;

      const isDismissed = sessionStorage.getItem("pwa-banner-dismissed");
      setIsMobile(isMobileDevice);
      setIsVisible(isMobileDevice && !isDismissed);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // 2. Register service worker for PWA support
  useEffect(() => {
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered on scope:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  // 3. Listen for the native PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!isVisible || !isMobile) return null;

  // Determine App Name and Details based on route
  const isAttendanceRoute = pathname === "/sjabcxyz";
  const appName = isAttendanceRoute ? "MAuli attendance" : "Shree Mauli Hostel";
  const appDesc = isAttendanceRoute ? "Staff Attendance Portal" : "Student & Admin Portal";
  const appIconText = isAttendanceRoute ? "MA" : "SM";

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setIsVisible(false);
      }
    } else {
      // If native prompt is not available (e.g. iOS Safari), show instructions
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-banner-dismissed", "true");
    setIsVisible(false);
  };

  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-[#0c0c0e]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between text-white shadow-lg transition-all animate-fade-in">
      {/* App Info */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white text-xs shadow-md">
          {appIconText}
        </div>
        <div>
          <h4 className="font-bold text-xs leading-snug">{appName}</h4>
          <p className="text-[10px] text-muted-foreground">{appDesc}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="px-3.5 py-1.5 bg-primary text-primary-foreground font-bold text-[10px] rounded-lg flex items-center gap-1 hover:bg-primary/95 transition-all cursor-pointer uppercase tracking-wider"
        >
          <Download size={11} /> Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 hover:bg-white/5 text-muted-foreground hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Manual Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121214] border border-white/10 p-5 rounded-2xl max-w-xs w-full text-center shadow-2xl">
            <HelpCircle className="w-10 h-10 text-primary mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-2">How to Install</h3>
            {isiOS ? (
              <p className="text-muted-foreground text-xs leading-relaxed mb-5">
                Tap the <span className="text-white font-semibold">Share</span> button in Safari,
                scroll down and select <span className="text-white font-semibold">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="text-muted-foreground text-xs leading-relaxed mb-5">
                Tap the browser menu (three dots in upper right) and select <span className="text-white font-semibold">Install App</span> or <span className="text-white font-semibold">Add to Home Screen</span>.
              </p>
            )}
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-2 bg-[#1c1c21] hover:bg-white/5 text-white font-semibold text-xs rounded-xl border border-white/5 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
