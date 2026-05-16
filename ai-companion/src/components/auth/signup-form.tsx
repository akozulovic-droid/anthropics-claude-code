"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { signUpAction, type AuthState } from "@/app/(auth)/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "./submit-button";

const initialState: AuthState = {};

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start free. Your AI companion is a fictional, adult (18+) character.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.notice ? (
          <div className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>{state.notice}</p>
          </div>
        ) : (
          <form action={formAction} className="space-y-4" noValidate>
            {state.error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p>{state.error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Name (optional)</Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                placeholder="Alex"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="ageConfirmed"
                className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
              />
              <span>
                I confirm I am 18 years or older and understand companions are
                fictional AI characters.
              </span>
            </label>

            <SubmitButton>Create account</SubmitButton>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
