import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Step B2 — Text chunking.
 *
 * Long documents cannot be embedded in one shot, so we split the text into
 * overlapping chunks:
 * - chunkSize 1000: each chunk is ~1000 characters (a good default for RAG)
 * - chunkOverlap 200: neighbouring chunks share 200 chars so that a sentence
 *   cut at a boundary still appears fully in at least one chunk
 *
 * RecursiveCharacterTextSplitter tries to split on paragraphs first, then
 * sentences, then words — so chunks stay as coherent as possible.
 */
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function chunkText(text: string): Promise<string[]> {
  return splitter.splitText(text);
}
