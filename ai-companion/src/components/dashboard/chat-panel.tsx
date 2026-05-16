"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import type { ChatMessageRow } from "@/lib/types";
import { MAX_MESSAGE_LENGTH } from "@/lib/ai/chat";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = Pick<ChatMessageRow, "role" | "content"> & { id: string };

export function ChatPanel({
  companionName,
  initialMessages,
}: {
  companionName: string;
  initialMessages: ChatMessageRow[];
}) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong.");
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(text);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.reply.id,
          role: "assistant",
          content: data.reply.content,
        },
      ]);
    } catch {
      toast.error("Network error. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex h-[560px] flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Chat with {companionName}</CardTitle>
        <CardDescription>
          {companionName} is a fictional AI character — replies are
          AI-generated, not from a real person.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-md border border-border bg-secondary/20 p-4"
        >
          {messages.length === 0 && (
            <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              Say hello to {companionName} to start the conversation.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                  m.role === "user"
                    ? "brand-gradient text-primary-foreground"
                    : "border border-border bg-card",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {companionName} is typing…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={`Message ${companionName}…`}
            disabled={sending}
            className="flex-1 resize-none rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={sending || input.trim().length === 0}
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
