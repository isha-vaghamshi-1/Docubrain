"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { ChatInput } from "@/components/chat/ChatInput";
import {
  CompareResults,
  type CompareResultData,
} from "@/components/compare/CompareResults";

/**
 * Task 2 Step 5 — Compare page.
 *
 * One question → POST /api/compare → side-by-side answers + token counts.
 */
export default function ComparePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResultData | null>(null);

  async function runCompare(q: string) {
    setError(null);
    setQuestion(q);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Request failed (HTTP ${res.status})`);
        return;
      }

      setResult({
        rag: data.rag,
        direct: data.direct,
      });
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12">
      <PageHeader
        title="Compare tokens"
        description="Run the same question with RAG and with a direct LLM (full document text). See answers and token usage side by side."
      />

      {question && (
        <p className="mt-6 rounded-lg bg-blue-50 px-4 py-3 text-sm dark:bg-blue-950/40">
          <span className="opacity-60">Question: </span>
          {question}
        </p>
      )}

      {loading && (
        <p className="mt-6 text-sm opacity-60">Running both paths…</p>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {result && !loading && <CompareResults result={result} />}

      <div className="mt-auto pt-8">
        <ChatInput disabled={loading} onSend={runCompare} />
      </div>
    </main>
  );
}