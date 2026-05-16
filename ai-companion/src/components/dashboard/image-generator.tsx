"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MAX_PROMPT_LENGTH = 500;

export function ImageGenerator({
  companionName,
  remaining,
  limit,
  plan,
}: {
  companionName: string;
  remaining: number;
  limit: number;
  plan: "free" | "pro";
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const noCredits = remaining <= 0;

  async function generate() {
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();

      if (res.status === 402) {
        toast.error(data.message ?? "No image credits left.");
        router.refresh();
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "Could not generate the image.");
        return;
      }

      toast.success("Image added to your gallery.");
      setPrompt("");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImagePlus className="size-5 text-primary" />
          Generate an image
        </CardTitle>
        <CardDescription>
          New portraits of {companionName}, kept as consistent as possible.{" "}
          <span className="font-medium text-foreground">
            {remaining}
          </span>{" "}
          of {limit} credits left this month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {noCredits ? (
          <div className="rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Sparkles className="size-4 text-primary" />
              You&apos;ve used all your image credits this month.
            </p>
            <p className="mt-1 text-muted-foreground">
              {plan === "free"
                ? "Upgrade to Pro for 20 images per month."
                : "Your credits reset at the start of next month."}
            </p>
            {plan === "free" && (
              <Button asChild size="sm" className="mt-3">
                <Link href="/dashboard/billing">Upgrade to Pro</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              maxLength={MAX_PROMPT_LENGTH}
              disabled={busy}
              placeholder={`e.g. ${companionName} reading a book in a sunny park`}
              className="w-full resize-none rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
            />
            <Button
              onClick={generate}
              disabled={busy || prompt.trim().length === 0}
              className="w-full"
              size="lg"
            >
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Generating…" : "Generate image"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
