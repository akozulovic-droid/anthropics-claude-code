import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

// Auth depends on per-request cookies — never prerender this subtree.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No auth backend configured -> nobody can be authenticated.
  if (!hasSupabaseEnv) {
    redirect("/login");
  }

  // Defense in depth: the proxy already gates /dashboard, but we also
  // verify the session here so a page never renders without a user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight brand-text"
            >
              Aura
            </Link>
            <nav className="hidden gap-4 sm:flex">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="size-4" />
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        Aura companions are fictional AI-generated characters, not real
        people. For entertainment only.
      </footer>
    </div>
  );
}
