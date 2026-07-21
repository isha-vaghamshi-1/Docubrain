import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { env } from "../env";
import { embedQueryWithUsage } from "../embeddings";
import { chatWithUsage } from "../llm";
import { buildUserPrompt, NO_DATA_ANSWER, RAG_SYSTEM_PROMPT } from "../prompts";
import { formatTokenSummary, type TokenSummary } from "../tokens";
import { searchChunks, type RetrievedChunk } from "../zilliz";

/**
 * Step C3 — LangGraph RAG pipeline (+ Task 2 Step 2 token capture).
 *
 * The graph mirrors the plan:
 *
 *   START -> retrieve -> grade -> (generate | respond) -> respond -> END
 *
 * - retrieve: embed the question (with usage), fetch topK chunks from Zilliz
 * - grade:    if the best score is below the threshold, flag no_data
 * - generate: (only when data exists) call OpenAI with grounded prompt + usage
 * - respond:  produce the final answer ("sorry, no data found" if no_data)
 *
 * Token fields stay in state so no-data answers still report embedding tokens.
 */

// ---- Graph state ----------------------------------------------------------
const RagState = Annotation.Root({
  question: Annotation<string>,
  chunks: Annotation<RetrievedChunk[]>,
  noData: Annotation<boolean>,
  answer: Annotation<string>,
  embeddingTokens: Annotation<number>,
  promptTokens: Annotation<number>,
  completionTokens: Annotation<number>,
});

type RagStateType = typeof RagState.State;

// ---- Nodes ----------------------------------------------------------------

/** 1. retrieve — embed the question (count tokens) and search Zilliz. */
async function retrieve(state: RagStateType) {
  const { vector, tokens } = await embedQueryWithUsage(state.question);
  const chunks = await searchChunks(vector);
  return { chunks, embeddingTokens: tokens };
}

/** 2. grade — decide whether the retrieved chunks are relevant enough. */
function grade(state: RagStateType) {
  const bestScore = Math.max(0, ...state.chunks.map((c) => c.score));
  return { noData: bestScore < env.retrievalScoreThreshold };
}

/** 3. generate — call OpenAI with the grounded prompt (only if data exists). */
async function generate(state: RagStateType) {
  const { answer, usage } = await chatWithUsage({
    system: RAG_SYSTEM_PROMPT,
    user: buildUserPrompt(
      state.chunks.map((c) => c.text),
      state.question
    ),
  });

  return {
    answer,
    promptTokens: usage.prompt,
    completionTokens: usage.completion,
  };
}

/** 4. respond — final node: fixed no-data answer or the generated one. */
function respond(state: RagStateType) {
  if (state.noData || !state.answer?.trim()) {
    return { answer: NO_DATA_ANSWER };
  }
  return { answer: state.answer };
}

// ---- Wiring ---------------------------------------------------------------

/** After grading, either generate an answer or skip straight to respond. */
function afterGrade(state: RagStateType): "generate" | "respond" {
  return state.noData ? "respond" : "generate";
}

const graph = new StateGraph(RagState)
  .addNode("retrieve", retrieve)
  .addNode("grade", grade)
  .addNode("generate", generate)
  .addNode("respond", respond)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "grade")
  .addConditionalEdges("grade", afterGrade)
  .addEdge("generate", "respond")
  .addEdge("respond", END)
  .compile();

export interface RagAnswer {
  answer: string;
  sources: RetrievedChunk[];
  tokens: TokenSummary;
}

/** Public entry point used by the chat API (and later Compare). */
export async function answerQuestion(question: string): Promise<RagAnswer> {
  const result = await graph.invoke({
    question,
    embeddingTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
  });

  return {
    answer: result.answer,
    sources: result.noData ? [] : result.chunks,
    tokens: formatTokenSummary({
      embedding: result.embeddingTokens ?? 0,
      prompt: result.promptTokens ?? 0,
      completion: result.completionTokens ?? 0,
    }),
  };
}
