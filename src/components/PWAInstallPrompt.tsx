import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PWA_DISMISS_KEY = "tether_pwa_prompt_dismissed";

const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window as any).standalone === true;

interface PWAInstallPromptProps {
  hasPushEnabled?: boolean;
}

export const PWAInstallPrompt = ({ hasPushEnabled }: PWAInstallPromptProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isMobile() || isStandalone()) return;
    if (localStorage.getItem(PWA_DISMISS_KEY)) return;
    setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(PWA_DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show || hasPushEnabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2"
      >
        <div className="max-w-sm mx-auto rounded-xl bg-white/10 border border-white/20 backdrop-blur-md p-4 text-center">
          <p className="text-white/90 text-sm mb-3">
            Add Tether to your Home Screen to get nudge notifications when the app is closed.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={dismiss}
              className="px-4 py-2 rounded-lg bg-white/20 text-white text-xs font-medium hover:bg-white/30 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
