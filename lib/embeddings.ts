import { OpenAIEmbeddings } from "@langchain/openai";
import OpenAI from "openai";
import { env } from "./env";

/**
 * Step B3 — OpenAI embeddings client.
 *
 * One shared instance used by both pipelines:
 * - ingest: embed every chunk of every PDF
 * - chat:   embed the user's question the same way
 *
 * Both MUST use the same model (text-embedding-3-small, dim 1536),
 * otherwise question vectors and chunk vectors would not be comparable.
 */
export const embeddings = new OpenAIEmbeddings({
  apiKey: env.openaiApiKey,
  model: env.openaiEmbedModel,
});

/** Direct OpenAI client — used when we need embedding token usage (Task 2). */
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return openai;
}

/** Embed many texts at once (LangChain batches the API calls for us). */
export function embedTexts(texts: string[]): Promise<number[][]> {
  return embeddings.embedDocuments(texts);
}

/** Embed a single query/question. */
export function embedQuery(text: string): Promise<number[]> {
  return embeddings.embedQuery(text);
}

/**
 * Embed a query and return the vector plus embedding token count.
 * Used by the RAG compare path so we can show embedding tokens.
 */
export async function embedQueryWithUsage(
  text: string
): Promise<{ vector: number[]; tokens: number }> {
  const res = await getOpenAI().embeddings.create({
    model: env.openaiEmbedModel,
    input: text,
  });

  const vector = res.data[0]?.embedding;
  if (!vector) {
    throw new Error("OpenAI embeddings returned no vector");
  }

  return {
    vector,
    tokens: res.usage?.total_tokens ?? res.usage?.prompt_tokens ?? 0,
  };
}
