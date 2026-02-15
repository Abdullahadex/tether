import { motion, AnimatePresence } from "framer-motion";

export const PulseButton = ({ signatureColor, onHoldStart, onHoldEnd, isPartnerHolding }: any) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Echo Ripple when partner holds */}
      <AnimatePresence>
        {isPartnerHolding && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute w-48 h-48 rounded-full border border-white/20"
          />
        )}
      </AnimatePresence>

      <motion.button
        onPointerDown={onHoldStart}
        onPointerUp={onHoldEnd}
        onPointerLeave={onHoldEnd}
        className="relative z-10 w-48 h-48 rounded-full border border-white/10 backdrop-blur-xl bg-white/[0.02] flex items-center justify-center shadow-2xl"
        whileTap={{ scale: 0.95 }}
        animate={{
          borderColor: isPartnerHolding ? `${signatureColor}44` : "rgba(255,255,255,0.1)",
          scale: isPartnerHolding ? [1, 1.05, 1] : 1
        }}
        transition={{ duration: 0.8, repeat: isPartnerHolding ? Infinity : 0 }}
      >
        <div 
          className="w-1.5 h-1.5 rounded-full opacity-20"
          style={{ backgroundColor: signatureColor }}
        />
      </motion.button>
    </div>
  );
};