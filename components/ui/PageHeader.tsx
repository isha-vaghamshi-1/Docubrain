/**
 * Common page header: title + one-line description.
 * Used on both the Upload and Chat pages.
 */
export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description && <p className="mt-1 text-sm opacity-70">{description}</p>}
    </header>
  );
}
