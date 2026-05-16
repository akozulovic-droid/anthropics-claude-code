import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { AiGirl, ChatMessageRow, Profile } from "@/lib/types";
import { getSignedUrl } from "@/lib/storage";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateCompanionForm } from "@/components/dashboard/create-companion-form";
import { CompanionProfile } from "@/components/dashboard/companion-profile";

export const metadata: Metadata = {
  title: "Dashboard — Aura",
};

// Image generation runs inside the create server action; allow more time.
export const maxDuration = 60;

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

  const { data: aiGirl } = await supabase
    .from("ai_girls")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle<AiGirl>();

  const imageUrl = aiGirl
    ? await getSignedUrl(supabase, aiGirl.main_image_url)
    : null;

  let chatMessages: ChatMessageRow[] = [];
  if (aiGirl) {
    const { data: rows } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);
    chatMessages = ((rows as ChatMessageRow[] | null) ?? []).reverse();
  }

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
          {aiGirl
            ? `Your companion ${aiGirl.name} is ready.`
            : "Let's create your AI companion."}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Profile not found</p>
            <p className="text-muted-foreground">
              Apply the migrations in <code>supabase/migrations</code> (0001
              and 0002) in your Supabase SQL editor.
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
            <CardTitle>{aiGirl ? "Created" : "Not created yet"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {aiGirl ? (
        <CompanionProfile
          aiGirl={aiGirl}
          imageUrl={imageUrl}
          chatMessages={chatMessages}
        />
      ) : (
        <CreateCompanionForm />
      )}
    </div>
  );
}
