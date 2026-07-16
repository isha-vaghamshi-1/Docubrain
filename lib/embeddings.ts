import { OpenAIEmbeddings } from "@langchain/openai";
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

/** Embed many texts at once (LangChain batches the API calls for us). */
export function embedTexts(texts: string[]): Promise<number[][]> {
  return embeddings.embedDocuments(texts);
}

/** Embed a single query/question. */
export function embedQuery(text: string): Promise<number[]> {
  return embeddings.embedQuery(text);
}
