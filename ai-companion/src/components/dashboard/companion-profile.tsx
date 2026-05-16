import Image from "next/image";
import { ImageOff, Lock } from "lucide-react";
import type {
  AiGirl,
  ChatMessageRow,
  GalleryItem,
} from "@/lib/types";
import type { CreditStatus } from "@/lib/credits";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { ImageGenerator } from "@/components/dashboard/image-generator";
import { Gallery } from "@/components/dashboard/gallery";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function CompanionProfile({
  aiGirl,
  imageUrl,
  chatMessages,
  credits,
  gallery,
}: {
  aiGirl: AiGirl;
  imageUrl: string | null;
  chatMessages: ChatMessageRow[];
  credits: CreditStatus;
  gallery: GalleryItem[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        {/* Fixed main image area */}
        <Card className="overflow-hidden">
          <div className="relative aspect-square w-full bg-secondary">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`Portrait of ${aiGirl.name}`}
                fill
                sizes="340px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="size-8" />
                <p className="text-sm">Image unavailable</p>
              </div>
            )}
          </div>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{aiGirl.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                <Lock className="size-3" /> Permanent
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {aiGirl.age} · {aiGirl.personality}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Companion profile</CardTitle>
            <CardDescription>
              Created on{" "}
              {new Date(aiGirl.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              . This is a fictional AI character and cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Detail label="Hair" value={aiGirl.hair_color} />
            <Detail label="Eyes" value={aiGirl.eye_color} />
            <Detail label="Clothing" value={aiGirl.clothing_style} />
            <Detail label="Visual style" value={aiGirl.style} />
            <Detail label="Background" value={aiGirl.background_style} />
            <Detail
              label="Conversation"
              value={aiGirl.conversation_style}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
        <ChatPanel
          companionName={aiGirl.name}
          initialMessages={chatMessages}
        />
        <ImageGenerator
          companionName={aiGirl.name}
          remaining={credits.remaining}
          limit={credits.limit}
          plan={credits.plan}
        />
      </div>

      <Gallery items={gallery} />
    </div>
  );
}
