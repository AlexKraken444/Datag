"use client";

// Datag — singleton Socket.IO client wrapped in a Zustand store.

import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/socket";

type DatagSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketStore {
  socket: DatagSocket | null;
  connected: boolean;
  connect: () => DatagSocket;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,
  connect: () => {
    const existing = get().socket;
    if (existing) return existing;
    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const s: DatagSocket = io(url, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    s.on("connect", () => set({ connected: true }));
    s.on("disconnect", () => set({ connected: false }));
    set({ socket: s });
    return s;
  },
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false });
  },
}));
