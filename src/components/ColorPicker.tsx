import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_COLORS = [
  { name: "Rose", hsl: "340 82% 65%", hex: "#F06292" },
  { name: "Coral", hsl: "16 85% 66%", hex: "#EF7B5B" },
  { name: "Amber", hsl: "38 92% 60%", hex: "#F5B041" },
  { name: "Emerald", hsl: "160 60% 50%", hex: "#33C9A0" },
  { name: "Sky", hsl: "200 80% 62%", hex: "#53B8E8" },
  { name: "Violet", hsl: "270 70% 65%", hex: "#9B72CF" },
  { name: "Fuchsia", hsl: "300 65% 60%", hex: "#C94EC9" },
  { name: "Peach", hsl: "20 90% 72%", hex: "#F7A07A" },
];

interface ColorPickerProps {
  onColorSelected: (color: { name: string; hsl: string; hex: string }) => void;
}

const ColorPicker = ({ onColorSelected }: ColorPickerProps) => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50 px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h1
        className="text-foreground text-xl font-light tracking-wide mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 80 }}
      >
        Choose your color
      </motion.h1>
      <motion.p
        className="text-muted-foreground text-sm mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        This is how your partner will feel you
      </motion.p>

      <div className="grid grid-cols-4 gap-4 mb-12">
        {PRESET_COLORS.map((color, i) => (
          <motion.button
            key={color.name}
            className="relative w-14 h-14 rounded-full focus:outline-none"
            style={{ backgroundColor: color.hex }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.06, type: "spring", stiffness: 200, damping: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelected(i)}
          >
            <AnimatePresence>
              {selected === i && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-foreground"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.25, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected !== null && (
          <motion.button
            className="px-8 py-3 rounded-full text-sm font-medium tracking-wide"
            style={{
              backgroundColor: PRESET_COLORS[selected].hex,
              color: "#000",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onColorSelected(PRESET_COLORS[selected])}
          >
            This is me
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ColorPicker;
