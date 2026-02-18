import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EphemeralStatusProps {
  myStatus: string | null;
  myStatusSetAt: string | null;
  partnerStatus: string | null;
  partnerStatusSetAt: string | null;
  onUpdateStatus: (status: string) => Promise<void>;
}

const isExpired = (setAt: string | null) => {
  if (!setAt) return true;
  return Date.now() - new Date(setAt).getTime() > 60 * 60 * 1000;
};

const EphemeralStatus = ({
  myStatus,
  myStatusSetAt,
  partnerStatus,
  partnerStatusSetAt,
  onUpdateStatus,
}: EphemeralStatusProps) => {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const isSavingRef = useRef(false);

  const activePartnerStatus = useMemo(
    () => (partnerStatus && !isExpired(partnerStatusSetAt) ? partnerStatus : null),
    [partnerStatus, partnerStatusSetAt]
  );

  const activeMyStatus = useMemo(
    () => (myStatus && !isExpired(myStatusSetAt) ? myStatus : null),
    [myStatus, myStatusSetAt]
  );

  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    await onUpdateStatus(input.trim());
    setEditing(false);
    setInput("");
    isSavingRef.current = false;
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      <AnimatePresence>
        {activePartnerStatus && (
          <motion.p
            className="text-foreground/60 text-sm font-light tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring" }}
          >
            {activePartnerStatus}
          </motion.p>
        )}
      </AnimatePresence>

      {editing ? (
        <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 20))}
            maxLength={20}
            placeholder="feeling..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            onBlur={handleSubmit}
            className="bg-transparent border-b border-foreground/20 text-foreground text-sm text-center w-40 py-1 focus:outline-none focus:border-foreground/40 placeholder:text-muted-foreground/50"
          />
          <span className="text-muted-foreground text-xs">{input.length}/20</span>
        </motion.div>
      ) : (
        <motion.button
          onClick={() => { setEditing(true); setInput(activeMyStatus || ""); }}
          className="text-muted-foreground/40 text-xs hover:text-muted-foreground transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {activeMyStatus || "tap to share a feeling"}
        </motion.button>
      )}
    </div>
  );
};

export default EphemeralStatus;
