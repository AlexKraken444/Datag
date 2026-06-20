"use client";

// Datag — wraps the tree with Auth.js SessionProvider and runs CloudSync
// so logged-in users have their profile auto-synced to the server.

import { SessionProvider } from "next-auth/react";
import { CloudSync } from "./CloudSync";
import type { ReactNode } from "react";

export function AuthProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CloudSync />
      {children}
    </SessionProvider>
  );
}
