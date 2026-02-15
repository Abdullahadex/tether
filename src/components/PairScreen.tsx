import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PairScreenProps {
  onCreateTether: () => Promise<any>;
  onJoinTether: (code: string) => Promise<{ error?: string }>;
}

const PairScreen = ({ onCreateTether, onJoinTether }: PairScreenProps) => {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [pairCode, setPairCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const data = await onCreateTether();
    if (data) setGeneratedCode(data.pair_code);
    setMode("create");
    setLoading(false);
  };

  const handleJoin = async () => {
    setError("");
    setLoading(true);
    const result = await onJoinTether(pairCode);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h2
        className="text-foreground text-xl font-light tracking-wide mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        connect to your person
      </motion.h2>
      <motion.p
        className="text-muted-foreground text-xs mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        create a link or enter their code
      </motion.p>

      <AnimatePresence mode="wait">
        {mode === "choose" && (
          <motion.div key="choose" className="flex flex-col gap-3 w-full max-w-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.button
              onClick={handleCreate}
              disabled={loading}
              className="py-3 rounded-lg bg-foreground/10 text-foreground text-sm tracking-wide hover:bg-foreground/15 transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              create a tether
            </motion.button>
            <motion.button
              onClick={() => setMode("join")}
              className="py-3 rounded-lg border border-border text-muted-foreground text-sm tracking-wide hover:text-foreground transition-colors"
              whileTap={{ scale: 0.97 }}
            >
              enter a code
            </motion.button>
          </motion.div>
        )}

        {mode === "create" && generatedCode && (
          <motion.div key="create" className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-muted-foreground text-xs">share this code with your partner</p>
            <div className="text-foreground text-3xl font-mono tracking-[0.3em] select-all">{generatedCode}</div>
            <p className="text-muted-foreground text-xs mt-4">waiting for them to join...</p>
          </motion.div>
        )}

        {mode === "join" && (
          <motion.div key="join" className="flex flex-col items-center gap-3 w-full max-w-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <input
              type="text"
              placeholder="enter code"
              value={pairCode}
              onChange={(e) => setPairCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-center text-lg font-mono tracking-[0.3em] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors uppercase"
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
            <motion.button
              onClick={handleJoin}
              disabled={loading || pairCode.length < 4}
              className="w-full py-3 rounded-lg bg-foreground/10 text-foreground text-sm tracking-wide hover:bg-foreground/15 transition-colors disabled:opacity-50"
              whileTap={{ scale: 0.97 }}
            >
              {loading ? "..." : "connect"}
            </motion.button>
            <button onClick={() => setMode("choose")} className="text-muted-foreground text-xs hover:text-foreground transition-colors">back</button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PairScreen;
