/**
 * Task 2 Step 1 — Token summary helpers.
 *
 * Shared shape used by the Compare flow (RAG vs direct LLM)
 * so both paths report tokens the same way.
 */

export interface TokenSummary {
  /** Tokens used to embed the question (0 for direct LLM). */
  embedding: number;
  /** Chat input / prompt tokens. */
  prompt: number;
  /** Chat output / completion tokens. */
  completion: number;
  /** embedding + prompt + completion. */
  total: number;
}

/**
 * Build a TokenSummary from partial counts.
 * Missing fields default to 0; total is always recomputed.
 */
export function formatTokenSummary(parts: {
  embedding?: number;
  prompt?: number;
  completion?: number;
}): TokenSummary {
  const embedding = parts.embedding ?? 0;
  const prompt = parts.prompt ?? 0;
  const completion = parts.completion ?? 0;

  return {
    embedding,
    prompt,
    completion,
    total: embedding + prompt + completion,
  };
}

/** Empty / zero usage — useful when a path skips the LLM (e.g. no-data). */
export function emptyTokenSummary(): TokenSummary {
  return formatTokenSummary({});
}
