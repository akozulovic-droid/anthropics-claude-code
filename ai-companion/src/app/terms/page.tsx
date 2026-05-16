import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service — Aura" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="2026-05-16">
      <h2 className="text-lg font-medium text-foreground">1. Eligibility</h2>
      <p>
        You must be at least 18 years old to use Aura. By using the service
        you represent and warrant that you are an adult.
      </p>
      <h2 className="text-lg font-medium text-foreground">
        2. Acceptable use
      </h2>
      <p>
        AI companions are fictional characters. You may not attempt to create
        depictions of minors, real identifiable people, celebrities, or any
        non-consensual, abusive, or explicit content. Violations may result in
        suspension.
      </p>
      <h2 className="text-lg font-medium text-foreground">3. Service</h2>
      <p>
        Aura is provided on an &quot;as is&quot; basis for entertainment
        purposes. Generated content may be inaccurate and should not be relied
        upon.
      </p>
    </LegalPage>
  );
}
