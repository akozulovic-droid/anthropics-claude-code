import type { Metadata } from "next";
import { Sparkles, ImagePlus, MessageCircleHeart, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard — Aura",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const name = profile?.full_name || user?.email?.split("@")[0] || "there";
  const plan = profile?.plan ?? "free";
  const limit = profile?.monthly_image_limit ?? 3;
  const used = profile?.image_credits_used_this_month ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome, {name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s your companion workspace.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Profile not found</p>
            <p className="text-muted-foreground">
              Your profile row could not be loaded. Make sure the database
              migration in <code>supabase/migrations</code> has been applied.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle className="flex items-center gap-2 capitalize">
              {plan}
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                {plan === "pro" ? "20 images/mo" : "3 images/mo"}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Image credits this month</CardDescription>
            <CardTitle>
              {Math.max(0, limit - used)} / {limit}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>AI companion</CardDescription>
            <CardTitle>
              {profile?.ai_girl_created ? "Created" : "Not created yet"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="size-5 text-primary" />
            Your AI companion
          </CardTitle>
          <CardDescription>
            Companion creation, chat, and image generation arrive in the next
            phases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Sparkles,
                label: "Create companion",
                hint: "One-time, permanent setup (Phase 2)",
              },
              {
                icon: MessageCircleHeart,
                label: "Chat",
                hint: "Context-aware conversations (Phase 3)",
              },
              {
                icon: ImagePlus,
                label: "Generate images",
                hint: "Credit-based gallery (Phase 4)",
              },
            ].map(({ icon: Icon, label, hint }) => (
              <div
                key={label}
                className="rounded-md border border-dashed border-border p-4"
              >
                <Icon className="size-5 text-muted-foreground" />
                <p className="mt-3 font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{hint}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
