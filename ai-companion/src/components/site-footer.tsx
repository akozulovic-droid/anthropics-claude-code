import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 px-6 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl leading-relaxed">
          Aura companions are{" "}
          <span className="font-medium text-foreground">
            fictional, adult (18+) AI-generated characters
          </span>
          . They are not real people. For entertainment purposes only.
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/ai-disclaimer" className="hover:text-foreground">
            AI Disclaimer
          </Link>
        </nav>
      </div>
    </footer>
  );
}
