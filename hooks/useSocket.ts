"use client";

import { useEffect } from "react";
import { useSocketStore } from "@/stores/useSocketStore";

export function useSocket() {
  const socket = useSocketStore((s) => s.socket);
  const connect = useSocketStore((s) => s.connect);
  useEffect(() => {
    if (!socket) connect();
  }, [socket, connect]);
  return socket;
}
