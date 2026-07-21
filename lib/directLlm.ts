import { chatWithUsage } from "./llm";
import {
  buildUserPrompt,
  DIRECT_SYSTEM_PROMPT,
  NO_DATA_ANSWER,
} from "./prompts";
import { formatTokenSummary, type TokenSummary } from "./tokens";
import { listAllChunkTexts } from "./zilliz";

/**
 * Task 2 Step 3 — Path B: Direct LLM (no RAG retrieval).
 *
 * Uses the same uploaded PDFs as RAG, but sends ALL stored chunk text
 * to the chat model (no question embedding, no top-k vector search).
 * That usually means more prompt tokens than RAG.
 */

export interface DirectAnswer {
  answer: string;
  tokens: TokenSummary;
}

/** Answer using full uploaded document text (no vector search). */
export async function answerQuestionDirect(
  question: string
): Promise<DirectAnswer> {
  const chunks = await listAllChunkTexts();

  if (chunks.length === 0) {
    return {
      answer: NO_DATA_ANSWER,
      tokens: formatTokenSummary({ embedding: 0 }),
    };
  }

  const { answer, usage } = await chatWithUsage({
    system: DIRECT_SYSTEM_PROMPT,
    user: buildUserPrompt(chunks, question),
  });

  return {
    answer,
    tokens: formatTokenSummary({
      embedding: 0,
      prompt: usage.prompt,
      completion: usage.completion,
    }),
  };
}