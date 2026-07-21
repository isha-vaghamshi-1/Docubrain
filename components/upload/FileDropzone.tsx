"use client";

import { forwardRef, useState, type DragEvent } from "react";

/**
 * Upload-specific: the dashed "choose files" area.
 * Supports both ways of adding PDFs:
 * - click: the label triggers the hidden <input type="file">
 * - drag & drop: drop events hand the dropped files to the parent
 * A ref is forwarded so the parent can reset the input after upload.
 */
export const FileDropzone = forwardRef<
  HTMLInputElement,
  { disabled?: boolean; onFiles: (files: FileList | null) => void }
>(function FileDropzone({ disabled, onFiles }, ref) {
  // Tracks whether files are currently being dragged over the zone,
  // so we can highlight it as a visual "drop here" cue.
  const [dragging, setDragging] = useState(false);

  function handleDragOver(e: DragEvent) {
    // Required: without preventDefault the browser opens the PDF itself.
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    onFiles(e.dataTransfer.files);
  }

  return (
    <label
      className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
        dragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
      }`}
      htmlFor="pdf-input"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="text-sm font-medium">
        {dragging ? "Drop your PDFs here" : "Click or drag PDF files here"}
      </span>
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
