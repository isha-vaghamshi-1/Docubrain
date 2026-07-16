import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractPdfText } from "@/lib/pdf";
import { chunkText } from "@/lib/chunking";
import { embedTexts } from "@/lib/embeddings";
import {
  ChunkRecord,
  deleteByFilename,
  ensureCollection,
  insertChunks,
} from "@/lib/zilliz";

/**
 * Step B5 — POST /api/ingest
 *
 * Receives PDFs as multipart/form-data (field name "files") and runs the
 * full ingest pipeline for each file:
 *
 *   PDF bytes -> extract text -> chunk -> embed -> replace in Zilliz
 *
 * Response: { status, docs: [{ filename, chunks }], chunksCount }
 */

// pdf-parse needs Node.js APIs, so opt out of the Edge runtime.
export const runtime = "nodejs";

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File);

    // ---- Validation (limits agreed for MVP) ----
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded. Send PDFs in the 'files' field." },
        { status: 400 }
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum is ${MAX_FILES}.` },
        { status: 400 }
      );
    }
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { error: `"${file.name}" is not a PDF.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `"${file.name}" is larger than 10MB.` },
          { status: 400 }
        );
      }
    }

    // Make sure the Zilliz collection exists before writing to it.
    await ensureCollection();

    const docs: { filename: string; chunks: number }[] = [];

    for (const file of files) {
      // 1. PDF bytes -> plain text
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = await extractPdfText(buffer);

      if (!text.trim()) {
        docs.push({ filename: file.name, chunks: 0 });
        continue; // scanned/empty PDF with no extractable text
      }

      // 2. text -> chunks
      const chunks = await chunkText(text);

      // 3. chunks -> vectors (one OpenAI call, batched by LangChain)
      const vectors = await embedTexts(chunks);

      // 4. replace: remove chunks from a previous upload of this file
      await deleteByFilename(file.name);

      // 5. store new chunks + metadata
      const docId = randomUUID();
      const records: ChunkRecord[] = chunks.map((chunk, i) => ({
        doc_id: docId,
        filename: file.name,
        chunk_index: i,
        text: chunk,
        vector: vectors[i],
      }));
      await insertChunks(records);

      docs.push({ filename: file.name, chunks: chunks.length });
    }

    const chunksCount = docs.reduce((sum, d) => sum + d.chunks, 0);
    return NextResponse.json({ status: "ok", docs, chunksCount });
  } catch (error) {
    console.error("Ingest failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Ingest failed: ${message}` },
      { status: 500 }
    );
  }
}
