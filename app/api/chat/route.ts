import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/graph/ragGraph";

/**
 * Step C4 — POST /api/chat
 *
 * Body:     { "question": "..." }
 * Response: { "answer": "...", "sources": [...] }
 *           or { "answer": "sorry, no data found", "sources": [] }
 *
 * (The UI will only display the answer — sources stay in the API response
 * for debugging/tuning the score threshold.)
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const question = body?.question;

    if (typeof question !== "string" || question.trim() === "") {
      return NextResponse.json(
        { error: "Body must be JSON: { \"question\": \"...\" }" },
        { status: 400 }
      );
    }

    const { answer, sources } = await answerQuestion(question.trim());

    return NextResponse.json({
      answer,
      // Keep the payload small: filename + score are enough for tuning.
      sources: sources.map((s) => ({
        filename: s.filename,
        chunk_index: s.chunk_index,
        score: s.score,
      })),
    });
  } catch (error) {
    console.error("Chat failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Chat failed: ${message}` },
      { status: 500 }
    );
  }
}
