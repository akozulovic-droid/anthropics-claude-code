import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { signOutAction } from "@/app/(auth)/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Account settings — Aura" };
export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Account settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your account and subscription details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>
            Signed in as {user?.email ?? "your account"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Row label="Email" value={user?.email ?? "—"} />
          <Row
            label="Plan"
            value={(profile?.plan ?? "free").toUpperCase()}
          />
          <Row label="Member since" value={memberSince} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
          <CardDescription>
            Upgrade, manage, or cancel your plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/billing">Go to billing</Link>
          </Button>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost">
              Log out
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Your companion is a fictional AI character. See our{" "}
        <Link href="/ai-disclaimer" className="underline">
          AI disclaimer
        </Link>
        ,{" "}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="underline">
          terms
        </Link>
        .
      </p>
    </div>
  );
}
