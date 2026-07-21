import type { TokenSummary } from "@/lib/tokens";

/**
 * Task 2 Step 5 — Side-by-side RAG vs Direct results + token table.
 */

export interface ComparePathResult {
  answer: string;
  tokens: TokenSummary;
  sources?: { filename: string; chunk_index: number; score: number }[];
}

export interface CompareResultData {
  rag: ComparePathResult;
  direct: ComparePathResult;
}

function TokenRows({ tokens }: { tokens: TokenSummary }) {
  const rows: { label: string; value: number; bold?: boolean }[] = [
    { label: "Embedding", value: tokens.embedding },
    { label: "Prompt", value: tokens.prompt },
    { label: "Completion", value: tokens.completion },
    { label: "Total", value: tokens.total, bold: true },
  ];

  return (
    <dl className="mt-3 space-y-1 border-t border-gray-200 pt-3 text-sm dark:border-gray-700">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4">
          <dt className={row.bold ? "font-semibold" : "opacity-70"}>
            {row.label}
          </dt>
          <dd className={row.bold ? "font-semibold tabular-nums" : "tabular-nums"}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PathColumn({
  title,
  subtitle,
  result,
}: {
  title: string;
  subtitle: string;
  result: ComparePathResult;
}) {
  return (
    <section className="flex min-w-0 flex-1 flex-col rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 text-xs opacity-60">{subtitle}</p>
      <p className="mt-4 flex-1 whitespace-pre-wrap text-sm leading-relaxed">
        {result.answer}
      </p>
      <TokenRows tokens={result.tokens} />
    </section>
  );
}

export function CompareResults({ result }: { result: CompareResultData }) {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-col gap-4 md:flex-row">
        <PathColumn
          title="With RAG"
          subtitle="Top-k chunks via vector search"
          result={result.rag}
        />
        <PathColumn
          title="Direct LLM"
          subtitle="All uploaded document text"
          result={result.direct}
        />
      </div>
      <p className="text-xs opacity-60">
        RAG usually uses fewer prompt tokens because it only sends the most
        relevant chunks. Direct LLM includes all uploaded document text.
      </p>
    </div>
  );
}