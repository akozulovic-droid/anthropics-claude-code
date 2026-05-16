"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import {
  getStripe,
  hasStripeEnv,
  STRIPE_PRICE_ID,
  appUrl,
} from "@/lib/stripe";
import type { Profile } from "@/lib/types";

const BILLING = "/dashboard/billing";

async function currentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  return { supabase, user, profile };
}

export async function startCheckoutAction() {
  if (!hasSupabaseEnv || !hasStripeEnv) {
    redirect(`${BILLING}?error=${encodeURIComponent("Billing is not configured.")}`);
  }

  const { supabase, user, profile } = await currentUserProfile();
  if (profile?.plan === "pro") {
    redirect(`${BILLING}?error=${encodeURIComponent("You're already on Pro.")}`);
  }

  const stripe = getStripe();
  let url: string | null = null;

  try {
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: user.id,
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${appUrl()}${BILLING}?success=1`,
      cancel_url: `${appUrl()}${BILLING}?canceled=1`,
      allow_promotion_codes: true,
    });
    url = session.url;
  } catch {
    redirect(
      `${BILLING}?error=${encodeURIComponent("Could not start checkout. Try again.")}`,
    );
  }

  if (!url) {
    redirect(
      `${BILLING}?error=${encodeURIComponent("Could not start checkout. Try again.")}`,
    );
  }
  redirect(url);
}

export async function openPortalAction() {
  if (!hasSupabaseEnv || !hasStripeEnv) {
    redirect(`${BILLING}?error=${encodeURIComponent("Billing is not configured.")}`);
  }

  const { user, profile } = await currentUserProfile();
  void user;
  if (!profile?.stripe_customer_id) {
    redirect(
      `${BILLING}?error=${encodeURIComponent("No subscription found yet.")}`,
    );
  }

  const stripe = getStripe();
  let url: string | null = null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl()}${BILLING}`,
    });
    url = session.url;
  } catch {
    redirect(
      `${BILLING}?error=${encodeURIComponent("Could not open the billing portal.")}`,
    );
  }

  if (!url) {
    redirect(
      `${BILLING}?error=${encodeURIComponent("Could not open the billing portal.")}`,
    );
  }
  redirect(url);
}
