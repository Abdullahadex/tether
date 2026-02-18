import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTether } from "@/hooks/useTether";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import ColorPicker from "@/components/ColorPicker";
import PulseButton from "@/components/PulseButton";
import PairScreen from "@/components/PairScreen";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
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
    lastNudgeAt,
    sendHeartbeat,
    sendNudgeSignal,
    updateSignatureColor,
    updateStatus,
    createTether,
    joinTether,
  } = useTether();

  const { subscribeToPush, isSubscribed } = usePushNotifications();

  const hasPushEnabled = isSubscribed || (myProfile?.push_subscription !== null);

  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!lastNudgeAt) return;
    toast("Your partner sent a nudge.");
  }, [lastNudgeAt]);

  const handleColorSelected = async (color: { hex: string }) => {
    await updateSignatureColor(color.hex);
    localStorage.setItem("tether_color_set", "true");
    setShowColorPicker(false);
  };

  const sendNudge = useCallback(async () => {
    try {
      const deliveredInApp = await sendNudgeSignal();
      const { error } = await supabase.functions.invoke("send-nudge", {
        body: { tetherId: tether?.id ?? null },
      });
      if (deliveredInApp) {
        toast.success("Nudge sent.");
      } else if (!error) {
        toast.success("Nudge sent. They'll get a notification when they're back.");
      }
      if (error) {
        console.error("Push nudge failed:", error);
      }
    } catch (e) {
      console.error("Nudge failed:", e);
      toast.error("Could not send nudge.");
    }
  }, [sendNudgeSignal, tether?.id]);

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
            <PWAInstallPrompt hasPushEnabled={hasPushEnabled} />
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

            {!hasPushEnabled && (
              <button
                onClick={subscribeToPush}
                className="fixed top-12 px-6 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs uppercase tracking-widest backdrop-blur-md z-50 hover:bg-white/20 transition-colors"
              >
                Enable Nudges
              </button>
            )}

            <button
              onClick={signOut}
              className="fixed bottom-6 text-white/10 text-[10px] hover:text-white/30 transition-colors uppercase tracking-widest z-50"
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