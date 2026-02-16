import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTether } from "@/hooks/useTether";
import ColorPicker from "@/components/ColorPicker";
import PulseButton from "@/components/PulseButton";
import PairScreen from "@/components/PairScreen";
import AuraBackground from "@/components/AuraBackground";
import EphemeralStatus from "@/components/EphemeralStatus";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const {
    tether,
    myProfile,
    partnerProfile,
    loading: tetherLoading,
    isPaired,
    isPartnerOnline,
    isPartnerHolding,
    sendHeartbeat,
    updateSignatureColor,
    updateStatus,
    createTether,
    joinTether,
    fetchTether,
  } = useTether();

  const [showColorPicker, setShowColorPicker] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  // FIX: Safely check if the user needs to pick a color (null or default)
  useEffect(() => {
    if (myProfile) {
      const needsColor = !myProfile.signature_color || myProfile.signature_color === "#53B8E8";
      const hasLocallySet = localStorage.getItem("tether_color_set");
      
      if (needsColor && !hasLocallySet) {
        setShowColorPicker(true);
      }
    }
  }, [myProfile]);

  const handleColorSelected = async (color: { hex: string }) => {
    await updateSignatureColor(color.hex);
    localStorage.setItem("tether_color_set", "true");
    setShowColorPicker(false);
  };

  const sendNudge = useCallback(async () => {
    if (isPartnerOnline) return;
    try {
      await supabase.functions.invoke("send-nudge");
    } catch (e) {
      // Silently fail
    }
  }, [isPartnerOnline]);

  if (authLoading || tetherLoading) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-[#050505] overflow-hidden">
      <AnimatePresence mode="wait">
        {showColorPicker ? (
          <ColorPicker key="picker" onColorSelected={handleColorSelected} />
        ) : !isPaired ? (
          <PairScreen
            key="pair"
            onCreateTether={createTether}
            onJoinTether={joinTether}
          />
        ) : (
          <motion.div
            key="main"
            className="fixed inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <AuraBackground
              myColor={myProfile?.signature_color || "#53B8E8"}
              partnerColor={partnerProfile?.signature_color || null}
              partnerOnline={isPartnerOnline}
            />

            <div className="relative z-10 flex flex-col items-center">
              <PulseButton
                signatureColor={myProfile?.signature_color || "#53B8E8"}
                isPartnerHolding={isPartnerHolding}
                onHoldStart={() => sendHeartbeat(true)}
                onHoldEnd={() => sendHeartbeat(false)}
                onTap={sendNudge}
              />

              <EphemeralStatus
                myStatus={myProfile?.current_status}
                myStatusSetAt={myProfile?.status_set_at}
                partnerStatus={partnerProfile?.current_status}
                partnerStatusSetAt={partnerProfile?.status_set_at}
                onUpdateStatus={updateStatus}
              />
            </div>

            <button
              onClick={signOut}
              className="fixed bottom-6 text-white/10 text-[10px] hover:text-white/30 transition-colors uppercase tracking-widest"
            >
              sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;