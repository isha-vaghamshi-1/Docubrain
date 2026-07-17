"use client";

import { useEffect, useRef } from "react";

/**
 * Chat-specific: the conversation history.
 * User messages align right (blue), assistant answers align left (gray).
 * Auto-scrolls to the newest message.
 */

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export function MessageList({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-center text-sm opacity-50">
        Ask a question about your uploaded PDFs to get started.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto py-6">
      {messages.map((message, i) => (
        <div
          key={i}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
              message.role === "user"
                ? "rounded-br-sm bg-blue-600 text-white"
                : "rounded-bl-sm bg-gray-100 dark:bg-gray-800"
            }`}
          >
            {message.text}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-2.5 text-sm opacity-60 dark:bg-gray-800">
            Thinking…
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
