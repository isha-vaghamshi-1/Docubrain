import { PDFParse } from "pdf-parse";

/**
 * Step B1 — PDF text extraction.
 *
 * Takes the raw bytes of an uploaded PDF and returns its plain text.
 * We use pdf-parse v2, whose API is:
 *   1. create a PDFParse instance with the binary data
 *   2. call getText() -> { text, pages }
 *   3. destroy() to free memory (important when processing many files)
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
