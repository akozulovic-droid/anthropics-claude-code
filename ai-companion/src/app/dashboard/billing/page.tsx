import type { Metadata } from "next";
import { CheckCircle2, AlertCircle, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasStripeEnv } from "@/lib/stripe";
import type { Profile } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startCheckoutAction, openPortalAction } from "./actions";

export const metadata: Metadata = { title: "Billing — Aura" };
export const dynamic = "force-dynamic";

type SubRow = {
  status: string | null;
  current_period_end: string | null;
};

export default async function BillingPage(props: {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
    error?: string;
  }>;
}) {
  const { success, canceled, error } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubRow>();

  const isPro = profile?.plan === "pro";
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your subscription and image credits.
        </p>
      </div>

      {success && (
        <div className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>Subscription active. It may take a few seconds to reflect here.</p>
        </div>
      )}
      {canceled && (
        <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
          Checkout canceled. No charge was made.
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardDescription>Current plan</CardDescription>
          <CardTitle className="flex items-center gap-2 capitalize">
            {isPro && <Crown className="size-5 text-primary" />}
            {profile?.plan ?? "free"}
            <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
              {isPro ? "20 images/mo" : "3 images/mo"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasStripeEnv && (
            <p className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
              Stripe is not configured. Set the Stripe environment variables
              to enable subscriptions.
            </p>
          )}

          {isPro ? (
            <>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                <span className="font-medium text-foreground">
                  {sub?.status ?? profile?.subscription_status ?? "active"}
                </span>
                {periodEnd && <> · Renews/ends on {periodEnd}</>}
              </p>
              <p className="text-sm text-muted-foreground">
                If you cancel, you keep Pro until the end of the current
                billing period, then return to Free automatically.
              </p>
              <form action={openPortalAction}>
                <Button type="submit" disabled={!hasStripeEnv}>
                  Manage subscription
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro for{" "}
                <span className="font-medium text-foreground">
                  20 image generations per month
                </span>
                . Cancel anytime from the billing portal.
              </p>
              <form action={startCheckoutAction}>
                <Button type="submit" size="lg" disabled={!hasStripeEnv}>
                  Upgrade to Pro
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Aura companions are fictional AI characters. Subscriptions only change
        your monthly image credits.
      </p>
    </div>
  );
}
