"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Chat-specific: question input + send button.
 * Owns only its own text; submitting hands the question to the parent
 * and clears the field. Wrapped in a <form> so Enter submits too.
 */
export function ChatInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (question: string) => void;
}) {
  const [text, setText] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const question = text.trim();
    if (!question || disabled) return;
    onSend(question);
    setText("");
  }

  return (
    <form onSubmit={submit} className="flex gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask something about your documents…"
        disabled={disabled}
        className="flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 disabled:opacity-40 dark:border-gray-700"
      />
      <Button type="submit" disabled={disabled || text.trim() === ""}>
        Send
      </Button>
    </form>
  );
}
