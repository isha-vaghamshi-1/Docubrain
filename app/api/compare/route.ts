import { NextResponse } from "next/server";
import { answerQuestionDirect } from "@/lib/directLlm";
import { answerQuestion } from "@/lib/graph/ragGraph";

/**
 * Task 2 Step 4 — POST /api/compare
 *
 * Runs the same question on both paths and returns answers + token usage.
 *
 * Body:     { "question": "..." }
 * Response: { "rag": { answer, sources, tokens }, "direct": { answer, tokens } }
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const question = body?.question;

    if (typeof question !== "string" || question.trim() === "") {
      return NextResponse.json(
        { error: 'Body must be JSON: { "question": "..." }' },
        { status: 400 }
      );
    }

    const q = question.trim();

    // Run both paths in parallel for a faster compare.
    const [rag, direct] = await Promise.all([
      answerQuestion(q),
      answerQuestionDirect(q),
    ]);

    return NextResponse.json({
      rag: {
        answer: rag.answer,
        sources: rag.sources.map((s) => ({
          filename: s.filename,
          chunk_index: s.chunk_index,
          score: s.score,
        })),
        tokens: rag.tokens,
      },
      direct: {
        answer: direct.answer,
        tokens: direct.tokens,
      },
    });
  } catch (error) {
    console.error("Compare failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Compare failed: ${message}` },
      { status: 500 }
    );
  }
}