/**
 * Central place to read + validate environment variables.
 * Import `env` from here instead of using `process.env` directly,
 * so a missing key fails fast with a clear error message.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local (see .env.example).`
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got: "${raw}"`);
  }
  return parsed;
}

export const env = {
  // Required
  openaiApiKey: required("OPENAI_API_KEY"),
  zillizUri: required("ZILLIZ_URI"),
  zillizToken: required("ZILLIZ_TOKEN"),

  // Optional (with defaults from the plan)
  zillizCollection: optional("ZILLIZ_COLLECTION", "docubrain"),
  openaiChatModel: optional("OPENAI_CHAT_MODEL", "gpt-4o-mini"),
  openaiEmbedModel: optional("OPENAI_EMBED_MODEL", "text-embedding-3-small"),
  topK: optionalNumber("TOP_K", 5),
  retrievalScoreThreshold: optionalNumber("RETRIEVAL_SCORE_THRESHOLD", 0.35),
} as const;

/** Embedding dimension for text-embedding-3-small (fixed by the Zilliz schema). */
export const EMBEDDING_DIM = 1536;
