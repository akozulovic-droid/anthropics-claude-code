import Link from "next/link";
import {
  Sparkles,
  MessageCircleHeart,
  ImagePlus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

const features = [
  {
    icon: Sparkles,
    title: "Design your companion",
    body: "Pick a name, personality, look and style. A one-time creation that's uniquely yours.",
  },
  {
    icon: MessageCircleHeart,
    title: "Chat anytime",
    body: "Unlimited, context-aware conversations that remember what you've talked about.",
  },
  {
    icon: ImagePlus,
    title: "Generate images",
    body: "Create new portraits of your companion. 3 a month on Free, 20 on Pro.",
  },
  {
    icon: ShieldCheck,
    title: "Safe by design",
    body: "Adult fictional characters only. No minors, no real people, no explicit content.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight brand-text">
          Aura
        </span>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5" /> 18+ only · Fictional AI
              characters
            </span>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
              Meet your <span className="brand-text">AI companion</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
              Create a one-of-a-kind, fictional AI companion. Customize her
              personality and look, then chat and generate images — all in one
              elegant dashboard.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Create yours free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free plan included · No card required
            </p>
          </div>

          <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-card p-6 shadow-xl shadow-black/20"
              >
                <div className="flex size-10 items-center justify-center rounded-md brand-gradient text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
