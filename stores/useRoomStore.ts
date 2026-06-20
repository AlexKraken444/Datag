"use client";

import { create } from "zustand";
import type { ChatMessage, RoomState } from "@/types/game";

interface RoomStore {
  nickname: string;
  setNickname: (n: string) => void;
  room: RoomState | null;
  setRoom: (r: RoomState | null) => void;
  pushChat: (m: ChatMessage) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  nickname:
    (typeof window !== "undefined" &&
      window.localStorage.getItem("datag.nick")) ||
    "",
  setNickname: (n) => {
    if (typeof window !== "undefined") window.localStorage.setItem("datag.nick", n);
    set({ nickname: n });
  },
  room: null,
  setRoom: (r) => set({ room: r }),
  pushChat: (m) =>
    set((s) =>
      s.room
        ? { room: { ...s.room, chat: [...s.room.chat, m].slice(-80) } }
        : s,
    ),
}));
