import { motion } from "framer-motion";

interface AuraBackgroundProps {
  myColor: string;
  partnerColor: string | null;
  partnerOnline: boolean;
}

const AuraBackground = ({ myColor, partnerColor, partnerOnline }: AuraBackgroundProps) => {
  return (
    <motion.div 
      className="fixed inset-0 z-0 bg-[#050505]"
      animate={{
        background: partnerOnline && partnerColor
          ? `radial-gradient(circle at center, ${partnerColor}15 0%, #050505 100%)` 
          : `radial-gradient(circle at center, ${myColor}05 0%, #050505 100%)`
      }}
      transition={{ duration: 2.5, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </motion.div>
  );
};

export default AuraBackground;