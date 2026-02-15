import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account");
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center px-8">
      <motion.div
        className="w-full max-w-xs flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80 }}
      >
        <h1 className="text-foreground text-2xl font-light tracking-widest">tether</h1>
        <p className="text-muted-foreground text-xs tracking-wide">
          {isSignUp ? "create your account" : "welcome back"}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                className="text-destructive text-xs text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
            {message && (
              <motion.p
                className="text-foreground/70 text-xs text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-foreground/10 text-foreground text-sm font-medium tracking-wide hover:bg-foreground/15 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "..." : isSignUp ? "sign up" : "sign in"}
          </motion.button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
          className="text-muted-foreground text-xs hover:text-foreground transition-colors"
        >
          {isSignUp ? "already have an account? sign in" : "need an account? sign up"}
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
