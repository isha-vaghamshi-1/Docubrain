"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { MessageList, type ChatMessage } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";

/**
 * Phase D · Step 2 — Chat page (home route "/").
 *
 * Owns the conversation state and the call to POST /api/chat.
 * Per the MVP decision, only the answer text is shown — no sources.
 */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendQuestion(question: string) {
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Request failed (HTTP ${res.status})`);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", text: data.answer }]);
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <PageHeader
        title="DocuBrain Chat"
        description="Ask questions about your uploaded PDFs."
      />

      <MessageList messages={messages} loading={loading} />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="mt-4">
        <ChatInput disabled={loading} onSend={sendQuestion} />
      </div>
    </main>
  );
}
