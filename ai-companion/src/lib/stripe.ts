import Stripe from "stripe";

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET ?? "";
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";

export const hasStripeEnv =
  STRIPE_SECRET_KEY.length > 0 && STRIPE_PRICE_ID.length > 0;

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured (see .env.example).");
  }
  if (!client) {
    client = new Stripe(STRIPE_SECRET_KEY);
  }
  return client;
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

// Stripe subscription statuses that grant the Pro plan.
export function planForStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing" ? "pro" : "free";
}
