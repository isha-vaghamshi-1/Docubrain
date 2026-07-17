"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Phase D · Step 3 — Simple nav between Chat (/) and Upload (/upload).
 * Client component because usePathname() is needed to highlight
 * the link of the page you are currently on.
 */

const links = [
  { href: "/", label: "Chat" },
  { href: "/upload", label: "Upload" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-6 px-6 py-3">
        <span className="text-sm font-bold">DocuBrain</span>
        <div className="flex gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "opacity-70 hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
