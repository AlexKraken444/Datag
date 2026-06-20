"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/game";

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

export function ChatBox({ messages, onSend }: Props) {
  const [v, setV] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  return (
    <div className="card flex flex-col gap-2 h-72">
      <div className="text-sm text-muted">Чат комнаты</div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto text-sm space-y-1 pr-1"
      >
        {messages.length === 0 && (
          <div className="text-muted/60 italic">Сообщений пока нет</div>
        )}
        {messages.map((m) => (
          <div key={m.id}>
            {m.system ? (
              <span className="text-muted italic">— {m.text}</span>
            ) : (
              <>
                <span className="text-accent font-medium">{m.from}: </span>
                <span>{m.text}</span>
              </>
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = v.trim();
          if (!t) return;
          onSend(t);
          setV("");
        }}
        className="flex gap-2"
      >
        <input
          className="input flex-1"
          placeholder="Напиши сообщение…"
          value={v}
          onChange={(e) => setV(e.target.value)}
          maxLength={240}
        />
        <button className="btn-primary" type="submit">
          Отправить
        </button>
      </form>
    </div>
  );
}
