import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState(""); // NEW: State for the name
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

    try {
      if (isSignUp) {
        const { error, data } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else if (data?.user) {
          // NEW: Save the user's name to the profiles table right after sign up
          await supabase.from("profiles").update({ name: name }).eq("user_id", data.user.id);
          navigate("/"); 
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center px-8">
      <motion.div
        className="w-full max-w-xs flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80 }}
      >
        <h1 className="text-white text-3xl font-light tracking-widest">tether</h1>
        <p className="text-white/50 text-xs tracking-wide">
          {isSignUp ? "create your connection" : "welcome back"}
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          
          {/* THE NEW NAME INPUT (Only shows during sign up) */}
          <AnimatePresence>
            {isSignUp && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                type="text"
                placeholder="your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            )}
          </AnimatePresence>

          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                className="text-red-400 text-xs text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
            {message && (
              <motion.p
                className="text-white/70 text-xs text-center"
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
            className="w-full py-3 mt-2 rounded-lg bg-white/10 text-white text-xs font-medium tracking-[0.2em] uppercase hover:bg-white/15 transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "..." : isSignUp ? "sign up" : "sign in"}
          </motion.button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
          className="text-white/40 text-xs hover:text-white transition-colors"
        >
          {isSignUp ? "already have an account? sign in" : "need an account? sign up"}
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;