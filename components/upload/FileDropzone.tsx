"use client";

import { forwardRef } from "react";

/**
 * Upload-specific: the dashed "click to choose files" area.
 * The real <input type="file"> is hidden; the label triggers it.
 * A ref is forwarded so the parent can reset the input after upload.
 */
export const FileDropzone = forwardRef<
  HTMLInputElement,
  { disabled?: boolean; onFiles: (files: FileList | null) => void }
>(function FileDropzone({ disabled, onFiles }, ref) {
  return (
    <label
      className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
      htmlFor="pdf-input"
    >
      <span className="text-sm font-medium">Click to choose PDF files</span>
      <span className="mt-1 text-xs opacity-60">
        (multiple selection supported)
      </span>
      <input
        id="pdf-input"
        ref={ref}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </label>
  );
});
