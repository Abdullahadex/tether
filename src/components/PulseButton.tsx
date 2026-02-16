import { useState } from "react";
import { motion } from "framer-motion";

interface PulseButtonProps {
  signatureColor: string;
  isPartnerHolding: boolean;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onTap: () => void;
}

const PulseButton = ({
  signatureColor,
  isPartnerHolding,
  onHoldStart,
  onHoldEnd,
  onTap,
}: PulseButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = () => {
    setIsPressed(true);
    onHoldStart();
  };

  const handlePointerUp = () => {
    if (isPressed) {
      setIsPressed(false);
      onHoldEnd();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-10 mt-8">
      
      {/* THE GLOWING ORB (Heartbeat) */}
      <motion.div
        className="relative flex items-center justify-center rounded-full select-none touch-none cursor-pointer"
        style={{ width: 180, height: 180 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        animate={
          isPartnerHolding
            ? { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" } }
            : isPressed
            ? { scale: 0.92 }
            : { scale: 1 }
        }
      >
        {/* Deep ambient blur behind the button */}
        <motion.div
          className="absolute inset-0 rounded-full blur-3xl"
          style={{ backgroundColor: signatureColor }}
          animate={{
            opacity: isPressed || isPartnerHolding ? 0.6 : 0.15,
            scale: isPressed || isPartnerHolding ? 1.2 : 0.8,
          }}
          transition={{ duration: 0.4 }}
        />

        {/* Rotating subtle outer ring */}
        <motion.div
          className="absolute inset-2 rounded-full border border-white/10 border-t-white/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />

        {/* The Glass Orb itself */}
        <div 
          className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full backdrop-blur-md bg-white/5 border border-white/10 shadow-2xl overflow-hidden"
          style={{ boxShadow: isPressed ? `0 0 40px ${signatureColor}50` : `0 0 15px ${signatureColor}20` }}
        >
          {/* Inner glowing core */}
          <motion.div
            className="w-16 h-16 rounded-full blur-md"
            style={{ backgroundColor: signatureColor }}
            animate={{
              scale: isPartnerHolding ? [1, 1.4, 1] : isPressed ? 1.8 : 1,
              opacity: isPartnerHolding ? 1 : isPressed ? 0.8 : 0.4,
            }}
            transition={isPartnerHolding ? { repeat: Infinity, duration: 0.8 } : { duration: 0.3 }}
          />
        </div>
      </motion.div>

      {/* THE CONTROLS / LABELS */}
      <div className="flex flex-col items-center gap-5">
        <p className="text-white/30 text-[9px] tracking-[0.4em] uppercase font-medium">
          Hold to send heartbeat
        </p>
        
        {/* THE "I MISS YOU" BUTTON */}
        <motion.button
          onClick={onTap}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white/80 transition-colors text-[10px] tracking-[0.2em] uppercase backdrop-blur-sm"
        >
          tap to say "i miss you"
        </motion.button>
      </div>

    </div>
  );
};

export default PulseButton;