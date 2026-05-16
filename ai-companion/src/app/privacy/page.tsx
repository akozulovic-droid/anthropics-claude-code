import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy — Aura" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="2026-05-16">
      <h2 className="text-lg font-medium text-foreground">Data we store</h2>
      <p>
        We store your account email, companion configuration, chat history,
        and generated images so the service can function. Authentication is
        handled by Supabase.
      </p>
      <h2 className="text-lg font-medium text-foreground">Third parties</h2>
      <p>
        We use Supabase (auth, database, storage), Stripe (billing), and an AI
        provider (chat and image generation). Your prompts may be processed by
        these providers.
      </p>
      <h2 className="text-lg font-medium text-foreground">Your choices</h2>
      <p>
        You can request deletion of your account and associated data by
        contacting support.
      </p>
    </LegalPage>
  );
}
