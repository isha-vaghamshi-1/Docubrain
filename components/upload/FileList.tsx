"use client";

/** Upload-specific: list of selected files with size + remove button. */

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({
  files,
  disabled,
  onRemove,
}: {
  files: File[];
  disabled?: boolean;
  onRemove: (name: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <ul className="mt-6 space-y-2">
      {files.map((file) => (
        <li
          key={file.name}
          className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-800"
        >
          <span className="truncate">{file.name}</span>
          <span className="ml-4 flex shrink-0 items-center gap-3">
            <span className="text-xs opacity-60">{formatSize(file.size)}</span>
            <button
              type="button"
              onClick={() => onRemove(file.name)}
              className="text-xs text-red-600 hover:underline"
              disabled={disabled}
            >
              Remove
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
