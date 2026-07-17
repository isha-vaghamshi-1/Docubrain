"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { FileList } from "@/components/upload/FileList";
import {
  IngestSummary,
  type IngestResult,
} from "@/components/upload/IngestSummary";

/**
 * Phase D · Step 1 — Upload page.
 *
 * Owns the state + logic (file selection, validation, calling /api/ingest);
 * all rendering is delegated to components under components/.
 */

const MAX_FILES = 8;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (same limits as the API)

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResult | null>(null);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    setError(null);
    setResult(null);

    const next = [...files];
    for (const file of Array.from(selected)) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError(`"${file.name}" is not a PDF.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" is larger than 10MB.`);
        return;
      }
      // skip duplicates by name
      if (!next.some((f) => f.name === file.name)) next.push(file);
    }
    if (next.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed.`);
      return;
    }
    setFiles(next);
  }

  function removeFile(name: string) {
    setFiles(files.filter((f) => f.name !== name));
    setError(null);
  }

  async function upload() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Upload failed (HTTP ${res.status})`);
        return;
      }

      setResult(data);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <PageHeader
        title="Upload PDFs"
        description={`Up to ${MAX_FILES} PDF files, 10MB each. Re-uploading a file replaces its previous content.`}
      />

      <FileDropzone ref={inputRef} disabled={uploading} onFiles={addFiles} />

      <FileList files={files} disabled={uploading} onRemove={removeFile} />

      <Button
        onClick={upload}
        disabled={files.length === 0 || uploading}
        className="mt-6 w-full"
      >
        {uploading
          ? "Uploading & indexing…"
          : `Upload ${files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : ""}`}
      </Button>

      {error && <Alert variant="error">{error}</Alert>}
      {result && <IngestSummary result={result} />}
    </main>
  );
}
