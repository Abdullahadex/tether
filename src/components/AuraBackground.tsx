import { motion } from "framer-motion";

export const AuraBackground = ({ myColor, partnerColor, partnerOnline }: any) => {
  return (
    <motion.div 
      className="fixed inset-0 z-0 bg-[#050505]"
      animate={{
        background: partnerOnline 
          ? `radial-gradient(circle at center, ${partnerColor}22 0%, #050505 100%)` 
          : `radial-gradient(circle at center, ${myColor}08 0%, #050505 100%)`
      }}
      transition={{ duration: 2, ease: "easeInOut" }}
    >
      {/* Subtle grain/noise to add depth to the darkness */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </motion.div>
  );
};