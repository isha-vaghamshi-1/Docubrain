import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../env";
import { embedQuery } from "../embeddings";
import { searchChunks, type RetrievedChunk } from "../zilliz";
import { buildUserPrompt, NO_DATA_ANSWER, RAG_SYSTEM_PROMPT } from "../prompts";

/**
 * Step C3 — LangGraph RAG pipeline.
 *
 * The graph mirrors the plan:
 *
 *   START -> retrieve -> grade -> (generate | respond) -> respond -> END
 *
 * - retrieve: embed the question, fetch topK chunks from Zilliz
 * - grade:    if the best score is below the threshold, flag no_data
 * - generate: (only when data exists) call OpenAI with grounded prompt
 * - respond:  produce the final answer ("sorry, no data found" if no_data)
 */

// ---- Graph state ----------------------------------------------------------
// Annotation.Root defines the shared state that flows between nodes.
// Each node receives the current state and returns the fields it updates.
const RagState = Annotation.Root({
  question: Annotation<string>,
  chunks: Annotation<RetrievedChunk[]>,
  noData: Annotation<boolean>,
  answer: Annotation<string>,
});

type RagStateType = typeof RagState.State;

// ---- Nodes ----------------------------------------------------------------

/** 1. retrieve — embed the question and search Zilliz. */
async function retrieve(state: RagStateType) {
  const vector = await embedQuery(state.question);
  const chunks = await searchChunks(vector);
  return { chunks };
}

/** 2. grade — decide whether the retrieved chunks are relevant enough. */
function grade(state: RagStateType) {
  const bestScore = Math.max(0, ...state.chunks.map((c) => c.score));
  return { noData: bestScore < env.retrievalScoreThreshold };
}

/** 3. generate — call OpenAI with the grounded prompt (only if data exists). */
async function generate(state: RagStateType) {
  const llm = new ChatOpenAI({
    apiKey: env.openaiApiKey,
    model: env.openaiChatModel,
    temperature: 0,
  });

  const response = await llm.invoke([
    { role: "system", content: RAG_SYSTEM_PROMPT },
    {
      role: "user",
      content: buildUserPrompt(
        state.chunks.map((c) => c.text),
        state.question
      ),
    },
  ]);

  return { answer: response.text };
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

/** Public entry point used by the chat API. */
export async function answerQuestion(
  question: string
): Promise<{ answer: string; sources: RetrievedChunk[] }> {
  const result = await graph.invoke({ question });
  return {
    answer: result.answer,
    sources: result.noData ? [] : result.chunks,
  };
}
