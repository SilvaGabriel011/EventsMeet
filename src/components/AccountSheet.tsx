"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Theme } from "@/lib/themes";
import { getSupabase } from "@/lib/supabase";
import { fetchMyProfile, saveMyProfile } from "@/lib/social";

interface AccountSheetProps {
  open: boolean;
  user: User | null;
  theme: Theme;
  onClose: () => void;
}

type Step = "email" | "code";

export default function AccountSheet({ open, user, theme: t, onClose }: AccountSheetProps) {
  const sb = getSupabase();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sb || !user) return;
    fetchMyProfile(sb, user.id)
      .then((p) => {
        setName(p.displayName);
        setContact(p.contact);
      })
      .catch(() => setMsg("Could not load your profile."));
  }, [open, sb, user]);

  if (!sb) return null;

  const sendCode = async () => {
    setBusy(true);
    setMsg(null);
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setStep("code");
      setMsg("Check your email for the 6-digit code.");
    }
  };

  const verifyCode = async () => {
    setBusy(true);
    setMsg(null);
    const { error } = await sb.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setStep("email");
      setCode("");
      setMsg(null);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setBusy(true);
    setMsg(null);
    try {
      await saveMyProfile(sb, user.id, { displayName: name, contact });
      setMsg("Profile saved ✓");
    } catch {
      setMsg("Could not save — try again.");
    }
    setBusy(false);
  };

  const signOut = async () => {
    await sb.auth.signOut();
    setStep("email");
    setMsg(null);
  };

  const input = `w-full rounded-xl px-4 py-3 text-sm outline-none ${t.panelCard} ${t.panelTitle} placeholder:opacity-50`;
  const label = `mb-1 block text-xs font-semibold ${t.panelMuted}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col shadow-2xl ${t.panelBg}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            <div className={`flex items-center justify-between border-b p-5 ${t.panelBorder}`}>
              <h2 className={`text-lg font-bold ${t.panelTitle}`}>
                {user ? "My account" : "Sign in"}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close account"
                className={`rounded-full p-2 ${t.panelClose}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {!user && step === "email" && (
                <>
                  <p className={`text-sm ${t.panelMuted}`}>
                    Sign in to sync your saved events across devices, auto-sync your
                    Apple Calendar, and see who else is going. No password — we email
                    you a code.
                  </p>
                  <div>
                    <label className={label}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={input}
                      autoComplete="email"
                    />
                  </div>
                  <button
                    onClick={sendCode}
                    disabled={busy || !email.includes("@")}
                    className={`w-full rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-40 ${t.primaryBtn}`}
                  >
                    {busy ? "Sending…" : "Email me a code"}
                  </button>
                </>
              )}

              {!user && step === "code" && (
                <>
                  <div>
                    <label className={label}>6-digit code sent to {email}</label>
                    <input
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="123456"
                      className={`${input} tracking-[0.3em]`}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button
                    onClick={verifyCode}
                    disabled={busy || code.trim().length < 6}
                    className={`w-full rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-40 ${t.primaryBtn}`}
                  >
                    {busy ? "Checking…" : "Sign in"}
                  </button>
                  <button
                    onClick={() => setStep("email")}
                    className={`w-full text-center text-xs font-semibold ${t.panelMuted}`}
                  >
                    Use a different email
                  </button>
                </>
              )}

              {user && (
                <>
                  <p className={`text-xs ${t.panelMuted}`}>Signed in as {user.email}</p>
                  <div>
                    <label className={label}>Display name (shown to other goers)</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Gabriel"
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>
                      Contact — revealed ONLY on a mutual match (e.g. @instagram)
                    </label>
                    <input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="@yourhandle"
                      className={input}
                    />
                  </div>
                  <button
                    onClick={saveProfile}
                    disabled={busy}
                    className={`w-full rounded-full px-5 py-3 text-sm font-bold transition disabled:opacity-40 ${t.primaryBtn}`}
                  >
                    {busy ? "Saving…" : "Save profile"}
                  </button>
                  <button
                    onClick={signOut}
                    className={`w-full text-center text-xs font-semibold ${t.panelMuted} hover:text-rose-400`}
                  >
                    Sign out
                  </button>
                </>
              )}

              {msg && <p className={`text-center text-xs ${t.panelMuted}`}>{msg}</p>}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
