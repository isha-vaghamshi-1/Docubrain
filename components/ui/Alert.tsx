import type { ReactNode } from "react";

/**
 * Common alert box for feedback messages.
 * variant="error"   → red   (validation / request failures)
 * variant="success" → green (successful operations)
 */
const styles = {
  error: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  success: "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300",
} as const;

export function Alert({
  variant,
  children,
}: {
  variant: keyof typeof styles;
  children: ReactNode;
}) {
  return (
    <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}
