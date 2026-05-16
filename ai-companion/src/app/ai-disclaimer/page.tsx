import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "AI Disclaimer — Aura" };

export default function AiDisclaimerPage() {
  return (
    <LegalPage title="AI Disclaimer" updated="2026-05-16">
      <p>
        Every companion on Aura is a{" "}
        <span className="font-medium text-foreground">
          fictional, AI-generated character
        </span>
        . Companions are not real people, are not sentient, and do not have
        feelings or consciousness.
      </p>
      <p>
        Conversations are produced by a language model and may be inaccurate
        or inconsistent. The companion will not claim to be human and is not a
        substitute for professional advice or genuine human relationships.
      </p>
      <p>
        All characters are adults (18+). Aura does not permit content
        depicting minors, real identifiable individuals, celebrities, or
        non-consensual or explicit abuse.
      </p>
      <p>
        If you are experiencing emotional distress, please reach out to a
        qualified professional or a local support service.
      </p>
    </LegalPage>
  );
}
