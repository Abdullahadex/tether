import { motion } from "framer-motion";

interface AuraBackgroundProps {
  myColor: string;
  partnerColor: string | null;
  partnerOnline: boolean;
  bothOnline: boolean;
  synced: boolean;
}

const AuraBackground = ({ myColor, partnerColor, partnerOnline, bothOnline, synced }: AuraBackgroundProps) => {
  // No partner or partner offline → subtle own color glow
  // Partner online solo → partner's color glow
  // Both online → blended gradient
  // Synced heartbeat → intensified pulsing blend

  const intensity = synced ? 0.5 : bothOnline ? 0.3 : partnerOnline ? 0.2 : 0.05;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* My own subtle ambient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 60%, ${myColor}${Math.round(intensity * 0.3 * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Partner glow */}
      {partnerOnline && partnerColor && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{
            opacity: synced ? [0.4, 0.8, 0.4] : bothOnline ? [0.2, 0.4, 0.2] : [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: synced ? 0.68 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            background: bothOnline
              ? `radial-gradient(ellipse at 40% 40%, ${partnerColor}66 0%, transparent 50%), radial-gradient(ellipse at 60% 60%, ${myColor}66 0%, transparent 50%)`
              : `radial-gradient(ellipse at 50% 50%, ${partnerColor}44 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Synced pulse flash */}
      {synced && partnerColor && (
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.68, repeat: Infinity }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${partnerColor}88 0%, ${myColor}44 30%, transparent 60%)`,
          }}
        />
      )}
    </div>
  );
};

export default AuraBackground;
