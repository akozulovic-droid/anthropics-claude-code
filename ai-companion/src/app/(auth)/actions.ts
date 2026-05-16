"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";
import {
  isValidEmail,
  normalizeEmail,
  passwordError,
} from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export type AuthState = {
  error?: string;
  notice?: string;
};

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}

async function appOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = await headers();
  return h.get("origin") ?? "http://localhost:3000";
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim().slice(0, 120);
  const ageConfirmed = formData.get("ageConfirmed") === "on";

  // Backend validation — never trust the client.
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }
  const pwErr = passwordError(password);
  if (pwErr) return { error: pwErr };
  if (!ageConfirmed) {
    return { error: "You must confirm that you are 18 years or older." };
  }

  // Basic abuse brake: 5 sign-up attempts / 10 min per IP.
  const ip = await clientIp();
  if (!checkRateLimit(`signup:${ip}`, 5, 10 * 60_000).allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = await createClient();
  const origin = await appOrigin();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    notice:
      "Account created. Check your inbox for a confirmation email, then log in.",
  };
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email) || password.length === 0) {
    return { error: "Please enter your email and password." };
  }

  // Basic brute-force brake: 8 attempts / 5 min per IP + email.
  const ip = await clientIp();
  if (!checkRateLimit(`login:${ip}:${email}`, 8, 5 * 60_000).allowed) {
    return {
      error: "Too many login attempts. Please wait a few minutes.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Avoid leaking whether the email exists.
    return { error: "Invalid email or password, or email not confirmed yet." };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  // If Supabase isn't configured there is nothing to sign out of.
  if (!SUPABASE_URL) redirect("/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
