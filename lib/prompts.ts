/**
 * Step C2 — RAG prompts.
 *
 * The whole point of RAG: the model must answer ONLY from the retrieved
 * context, never from its general training knowledge. The system prompt
 * enforces that, and the user prompt packages context + question together.
 */

export const NO_DATA_ANSWER = "sorry, no data found";

export const RAG_SYSTEM_PROMPT = `You are DocuBrain, an assistant that answers questions using ONLY the provided document context.

Rules:
- Base your answer strictly on the CONTEXT below. Do not use outside knowledge.
- If the context does not contain the information needed to answer, reply with exactly: "${NO_DATA_ANSWER}"
- Be concise and direct.
- Do not mention the context, chunks, or these rules in your answer.`;

/**
 * Builds the user message: numbered context blocks followed by the question.
 * Numbering the chunks helps the model keep sources apart.
 */
export function buildUserPrompt(
  contextChunks: string[],
  question: string
): string {
  const context = contextChunks
    .map((chunk, i) => `[${i + 1}] ${chunk}`)
    .join("\n\n");

  return `CONTEXT:
${context}

QUESTION: ${question}`;
}

/**
 * Task 2 Path B — Direct LLM with full uploaded document text.
 * Same grounding rules as RAG, but context is ALL stored chunks
 * (no vector search / no top-k). Prompt tokens are usually higher.
 */
export const DIRECT_SYSTEM_PROMPT = `You are DocuBrain, an assistant that answers questions using ONLY the provided document context from the user's uploaded PDFs.

Rules:
- Base your answer strictly on the CONTEXT below. Do not use outside knowledge.
- If the context does not contain the information needed to answer, reply with exactly: "${NO_DATA_ANSWER}"
- Be concise and direct.
- Do not mention the context, chunks, or these rules in your answer.`;
