"use client";

// Datak — bidirectional sync between useProfileStore (localStorage) and the
// server-side profile (Prisma). Pulls once on auth, then pushes any local
// change debounced 800ms.

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useProfileStore } from "@/stores/useProfileStore";

export function CloudSync() {
  const { data: session, status } = useSession();
  const setProfileFromCloud = useProfileStore((s) => s.setProfileFromCloud);
  const profile = useProfileStore((s) => s.profile);
  const pulled = useRef(false);
  const pushTimer = useRef<number | null>(null);

  // --- pull once when authenticated ---
  useEffect(() => {
    if (status !== "authenticated") {
      pulled.current = false;
      return;
    }
    if (pulled.current) return;
    pulled.current = true;
    fetch("/api/profile/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.profile) setProfileFromCloud(d.profile);
      })
      .catch(() => {/* ignore */});
  }, [status, setProfileFromCloud]);

  // --- push (debounced) on local profile changes ---
  useEffect(() => {
    if (status !== "authenticated" || !pulled.current) return;
    if (pushTimer.current) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      fetch("/api/profile/me", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          coins: profile.coins,
          upgrades: profile.upgrades,
          matchesPlayed: profile.matchesPlayed,
        }),
      }).catch(() => {/* ignore */});
    }, 800);
    return () => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current);
    };
  }, [profile.coins, profile.upgrades, profile.matchesPlayed, status]);

  // mark unused session as used so eslint is quiet
  void session;
  return null;
}
