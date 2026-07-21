import { ChatOpenAI } from "@langchain/openai";
import { env } from "./env";

/**
 * Task 2 Step 1 — OpenAI chat helper that returns the answer AND token usage.
 *
 * Existing RAG generate() only returned text. Compare needs usage from
 * LangChain's usage_metadata (input_tokens / output_tokens / total_tokens).
 */

export interface ChatUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface ChatWithUsageResult {
  answer: string;
  usage: ChatUsage;
}

export interface ChatWithUsageParams {
  system: string;
  user: string;
}

function readUsage(response: {
  usage_metadata?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  response_metadata?: Record<string, unknown>;
}): ChatUsage {
  const meta = response.usage_metadata;
  if (meta) {
    const prompt = meta.input_tokens ?? 0;
    const completion = meta.output_tokens ?? 0;
    return {
      prompt,
      completion,
      total: meta.total_tokens ?? prompt + completion,
    };
  }

  // Fallback for older LangChain shapes (tokenUsage on response_metadata).
  const legacy = response.response_metadata?.tokenUsage as
    | {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
      }
    | undefined;

  const prompt = legacy?.promptTokens ?? 0;
  const completion = legacy?.completionTokens ?? 0;
  return {
    prompt,
    completion,
    total: legacy?.totalTokens ?? prompt + completion,
  };
}

/** Shared chat model instance (same model for RAG and direct paths). */
function getChatModel(): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: env.openaiApiKey,
    model: env.openaiChatModel,
    temperature: 0,
  });
}

/**
 * Call OpenAI chat and return answer + prompt/completion/total tokens.
 */
export async function chatWithUsage(
  params: ChatWithUsageParams
): Promise<ChatWithUsageResult> {
  const llm = getChatModel();

  const response = await llm.invoke([
    { role: "system", content: params.system },
    { role: "user", content: params.user },
  ]);

  return {
    answer: response.text,
    usage: readUsage(response),
  };
}
