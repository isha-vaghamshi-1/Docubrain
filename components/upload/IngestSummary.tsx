import { Alert } from "@/components/ui/Alert";

/** Upload-specific: green success box with per-file chunk counts. */

export type IngestResult = {
  status: string;
  docs: { filename: string; chunks: number }[];
  chunksCount: number;
};

export function IngestSummary({ result }: { result: IngestResult }) {
  return (
    <Alert variant="success">
      <p className="font-medium">
        Indexed {result.chunksCount} chunks from {result.docs.length} file
        {result.docs.length > 1 ? "s" : ""}.
      </p>
      <ul className="mt-2 space-y-1">
        {result.docs.map((doc) => (
          <li key={doc.filename} className="flex justify-between">
            <span className="truncate">{doc.filename}</span>
            <span className="ml-4 shrink-0 opacity-70">
              {doc.chunks} chunks
            </span>
          </li>
        ))}
      </ul>
    </Alert>
  );
}
