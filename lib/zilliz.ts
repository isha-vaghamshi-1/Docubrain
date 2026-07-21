import {
  DataType,
  MetricType,
  MilvusClient,
  type RowData,
} from "@zilliz/milvus2-sdk-node";
import { EMBEDDING_DIM, env } from "./env";

/**
 * Zilliz Cloud (Milvus) client.
 *
 * Responsibilities:
 * - ensureCollection: create the collection + index on first use (Phase B)
 * - deleteByFilename:  remove old chunks when a PDF is re-uploaded (Phase B)
 * - insertChunks:      store chunk text + vector + metadata (Phase B)
 * - searchChunks:      similarity search for the chat pipeline (Phase C)
 */

export interface ChunkRecord {
  doc_id: string;
  filename: string;
  chunk_index: number;
  text: string;
  vector: number[];
}

// Reuse one client across requests (Next.js keeps module state between
// invocations in the same server process).
let client: MilvusClient | null = null;

export function getZillizClient(): MilvusClient {
  if (!client) {
    client = new MilvusClient({
      address: env.zillizUri,
      token: env.zillizToken,
    });
  }
  return client;
}

let collectionReady = false;

/**
 * Create the collection if it does not exist, then load it into memory.
 *
 * Schema:
 * - id          auto-generated primary key
 * - doc_id      which upload this chunk belongs to
 * - filename    original PDF name (used for replace-on-reupload)
 * - chunk_index position of the chunk inside the document
 * - text        the chunk text itself (returned to the LLM later)
 * - vector      1536-dim OpenAI embedding, compared with COSINE similarity
 */
export async function ensureCollection(): Promise<void> {
  if (collectionReady) return;

  const milvus = getZillizClient();
  const { value: exists } = await milvus.hasCollection({
    collection_name: env.zillizCollection,
  });

  if (!exists) {
    await milvus.createCollection({
      collection_name: env.zillizCollection,
      fields: [
        {
          name: "id",
          data_type: DataType.Int64,
          is_primary_key: true,
          autoID: true,
        },
        { name: "doc_id", data_type: DataType.VarChar, max_length: 64 },
        { name: "filename", data_type: DataType.VarChar, max_length: 512 },
        { name: "chunk_index", data_type: DataType.Int64 },
        { name: "text", data_type: DataType.VarChar, max_length: 8192 },
        {
          name: "vector",
          data_type: DataType.FloatVector,
          dim: EMBEDDING_DIM,
        },
      ],
    });

    await milvus.createIndex({
      collection_name: env.zillizCollection,
      field_name: "vector",
      index_type: "AUTOINDEX",
      metric_type: MetricType.COSINE,
    });
  }

  // A collection must be loaded before search/delete can run against it.
  await milvus.loadCollectionSync({
    collection_name: env.zillizCollection,
  });

  collectionReady = true;
}

/** Replace behavior: drop all chunks of a previously uploaded file. */
export async function deleteByFilename(filename: string): Promise<void> {
  const milvus = getZillizClient();
  await milvus.delete({
    collection_name: env.zillizCollection,
    filter: `filename == "${filename.replace(/"/g, '\\"')}"`,
  });
}

/** Insert the chunks of one document. */
export async function insertChunks(records: ChunkRecord[]): Promise<void> {
  if (records.length === 0) return;
  const milvus = getZillizClient();
  const res = await milvus.insert({
    collection_name: env.zillizCollection,
    // Milvus SDK expects generic row objects, so widen our typed records.
    data: records.map((r): RowData => ({ ...r })),
  });
  if (res.status.error_code !== "Success") {
    throw new Error(`Zilliz insert failed: ${res.status.reason}`);
  }
}

/** One search hit: a stored chunk plus its similarity score. */
export interface RetrievedChunk {
  text: string;
  filename: string;
  chunk_index: number;
  /** COSINE similarity: 1 = identical meaning, 0 = unrelated. */
  score: number;
}

/**
 * Step C1 — Vector similarity search.
 *
 * Takes the already-embedded question vector and asks Zilliz for the
 * `topK` most similar chunks. Because the collection uses the COSINE
 * metric, each hit comes back with a score where HIGHER = more similar.
 * The grade node will later compare these scores to the threshold.
 */
export async function searchChunks(
  queryVector: number[],
  topK: number = env.topK
): Promise<RetrievedChunk[]> {
  await ensureCollection();

  const milvus = getZillizClient();
  const res = await milvus.search({
    collection_name: env.zillizCollection,
    data: [queryVector],
    limit: topK,
    output_fields: ["text", "filename", "chunk_index"],
  });

  if (res.status.error_code !== "Success") {
    throw new Error(`Zilliz search failed: ${res.status.reason}`);
  }

  return res.results.map((hit) => ({
    text: String(hit.text),
    filename: String(hit.filename),
    chunk_index: Number(hit.chunk_index),
    score: Number(hit.score),
  }));
}

/**
 * Task 2 Path B — load ALL stored chunk texts (no vector search).
 * Used to send full uploaded document content straight to the LLM.
 */
export async function listAllChunkTexts(): Promise<string[]> {
  await ensureCollection();

  const milvus = getZillizClient();
  const res = await milvus.query({
    collection_name: env.zillizCollection,
    filter: "chunk_index >= 0",
    output_fields: ["text", "filename", "chunk_index"],
    limit: 16384,
  });

  if (res.status.error_code !== "Success") {
    throw new Error(`Zilliz query failed: ${res.status.reason}`);
  }

  const rows = [...res.data].sort((a, b) => {
    const byFile = String(a.filename).localeCompare(String(b.filename));
    if (byFile !== 0) return byFile;
    return Number(a.chunk_index) - Number(b.chunk_index);
  });

  return rows.map((row) => String(row.text));
}
