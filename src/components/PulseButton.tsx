import { motion } from "framer-motion";

interface PulseButtonProps {
  signatureColor: string; // hex
  onTap?: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
}

const PulseButton = ({ signatureColor, onTap, onHoldStart, onHoldEnd }: PulseButtonProps) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute w-36 h-36 rounded-full"
        style={{
          background: `radial-gradient(circle, ${signatureColor}22 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Glassmorphic button */}
      <motion.button
        className="relative w-24 h-24 rounded-full backdrop-blur-xl cursor-pointer focus:outline-none"
        style={{
          background: `linear-gradient(135deg, hsla(0,0%,100%,0.08), hsla(0,0%,100%,0.03))`,
          border: `1px solid hsla(0,0%,100%,0.1)`,
          boxShadow: `0 0 40px ${signatureColor}15, inset 0 1px 0 hsla(0,0%,100%,0.1)`,
        }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onClick={onTap}
        onPointerDown={onHoldStart}
        onPointerUp={onHoldEnd}
        onPointerLeave={onHoldEnd}
      >
        {/* Inner subtle light */}
        <motion.div
          className="absolute inset-3 rounded-full"
          style={{
            background: `radial-gradient(circle at 40% 35%, ${signatureColor}18, transparent 60%)`,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.button>
    </div>
  );
};

export default PulseButton;
