import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in — Aura",
};

// Next.js 16: `searchParams` is a Promise and must be awaited.
export default async function LoginPage(props: {
  searchParams: Promise<{ confirmed?: string; error?: string }>;
}) {
  const { confirmed, error } = await props.searchParams;
  return (
    <LoginForm confirmed={confirmed === "1"} errorParam={error} />
  );
}
