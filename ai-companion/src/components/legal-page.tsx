import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-3xl px-6 py-6">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight brand-text"
        >
          Aura
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: {updated}
        </p>
        <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
          <p className="rounded-md border border-border bg-secondary/40 p-4 text-sm">
            This is a placeholder document for the MVP. Replace it with
            legal copy reviewed by a qualified professional before launch.
          </p>
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
