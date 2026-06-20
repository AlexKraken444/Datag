"use client";

// Datak — current room state and chat. Nickname now lives in useProfileStore
// (persistent across sessions). This store holds only the ephemeral room
// snapshot the active connection feeds in.

import { create } from "zustand";
import type { ChatMessage, RoomState } from "@/types/game";

interface RoomStore {
  room: RoomState | null;
  setRoom: (r: RoomState | null) => void;
  pushChat: (m: ChatMessage) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  room: null,
  setRoom: (r) => set({ room: r }),
  pushChat: (m) =>
    set((s) =>
      s.room
        ? { room: { ...s.room, chat: [...s.room.chat, m].slice(-80) } }
        : s,
    ),
}));
