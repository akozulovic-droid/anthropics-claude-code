import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  STRIPE_WEBHOOK_SECRET,
  hasStripeEnv,
  planForStatus,
} from "@/lib/stripe";
import { hasServiceRole } from "@/lib/supabase/config";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PeriodFields = {
  current_period_start?: number;
  current_period_end?: number;
};

function toISO(unix: number | null | undefined): string | null {
  return typeof unix === "number" ? new Date(unix * 1000).toISOString() : null;
}

async function resolveUserId(
  admin: ReturnType<typeof createAdminClient>,
  opts: { userId?: string | null; customerId?: string | null },
): Promise<string | null> {
  if (opts.userId) return opts.userId;
  if (opts.customerId) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", opts.customerId)
      .maybeSingle<{ id: string }>();
    return data?.id ?? null;
  }
  return null;
}

async function applySubscription(
  admin: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const userId = await resolveUserId(admin, {
    userId: subscription.metadata?.user_id ?? null,
    customerId,
  });
  if (!userId) return;

  const status = subscription.status;
  const plan = planForStatus(status);
  const limit = plan === "pro" ? 20 : 3;

  const subWithPeriod = subscription as Stripe.Subscription & PeriodFields;
  const item = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & PeriodFields)
    | undefined;
  const periodStart = toISO(
    subWithPeriod.current_period_start ?? item?.current_period_start,
  );
  const periodEnd = toISO(
    subWithPeriod.current_period_end ?? item?.current_period_end,
  );

  await admin
    .from("profiles")
    .update({
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      monthly_image_limit: limit,
    })
    .eq("id", userId);

  await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status,
        plan,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
}

export async function POST(request: Request) {
  if (!hasStripeEnv || !STRIPE_WEBHOOK_SECRET || !hasServiceRole) {
    return NextResponse.json(
      { error: "Billing is not configured." },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature ?? "",
      STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription =
            await stripe.subscriptions.retrieve(subId);
          if (
            session.client_reference_id &&
            !subscription.metadata?.user_id
          ) {
            subscription.metadata = {
              ...subscription.metadata,
              user_id: session.client_reference_id,
            };
          }
          await applySubscription(admin, subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(
          admin,
          event.data.object as Stripe.Subscription,
        );
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;
        const userId = await resolveUserId(admin, { customerId });
        if (userId) {
          await admin
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("id", userId);
          await admin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return NextResponse.json(
      { error: "Webhook handler error." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
