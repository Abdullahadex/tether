import { motion, AnimatePresence } from "framer-motion";

interface PulseButtonProps {
  signatureColor: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onTap: () => void;
  isPartnerHolding: boolean;
}

const PulseButton = ({ signatureColor, onHoldStart, onHoldEnd, onTap, isPartnerHolding }: PulseButtonProps) => {
  return (
    <div className="relative flex items-center justify-center py-12">
      <AnimatePresence>
        {isPartnerHolding && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-48 h-48 rounded-full border border-white/20"
          />
        )}
      </AnimatePresence>

      <motion.button
        onPointerDown={onHoldStart}
        onPointerUp={onHoldEnd}
        onPointerLeave={onHoldEnd}
        onClick={onTap}
        className="relative z-10 w-48 h-48 rounded-full border border-white/5 backdrop-blur-2xl bg-white/[0.01] flex items-center justify-center shadow-2xl"
        whileTap={{ scale: 0.94 }}
        animate={{
          scale: isPartnerHolding ? [1, 1.03, 1] : 1,
          borderColor: isPartnerHolding ? `${signatureColor}44` : "rgba(255,255,255,0.05)"
        }}
        transition={{ duration: 0.8, repeat: isPartnerHolding ? Infinity : 0 }}
      >
        <div 
          className="w-1.5 h-1.5 rounded-full"
          style={{ 
            backgroundColor: signatureColor,
            boxShadow: `0 0 15px ${signatureColor}` 
          }}
        />
      </motion.button>
    </div>
  );
};

export default PulseButton;