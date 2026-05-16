"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import {
  createCompanionAction,
  type CreateState,
} from "@/app/dashboard/actions";
import {
  PERSONALITIES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING_STYLES,
  VISUAL_STYLES,
  BACKGROUND_STYLES,
  CONVERSATION_STYLES,
  MIN_AGE,
  MAX_AGE,
} from "@/lib/companion/options";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: CreateState = {};

const ages = Array.from(
  { length: MAX_AGE - MIN_AGE + 1 },
  (_, i) => MIN_AGE + i,
);

function Field({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly string[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select id={name} name={name} defaultValue={options[0]} required>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function CreateCompanionForm() {
  const [state, formAction, isPending] = useActionState(
    createCompanionAction,
    initialState,
  );

  return (
    <Card className="relative overflow-hidden">
      {isPending && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="font-medium">Creating your companion…</p>
          <p className="text-sm text-muted-foreground">
            Generating the portrait can take ~20 seconds.
          </p>
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Create your AI companion
        </CardTitle>
        <CardDescription>
          This is a{" "}
          <span className="font-medium text-foreground">
            one-time, permanent
          </span>{" "}
          creation. Your companion is a fictional adult (18+) character and
          cannot be changed, deleted, or recreated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {state.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p>{state.error}</p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={40}
                placeholder="e.g. Aria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age (18+)</Label>
              <Select id="age" name="age" defaultValue="25" required>
                {ages.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>

            <Field
              label="Personality"
              name="personality"
              options={PERSONALITIES}
            />
            <Field
              label="Conversation style"
              name="conversationStyle"
              options={CONVERSATION_STYLES}
            />
            <Field label="Hair color" name="hairColor" options={HAIR_COLORS} />
            <Field label="Eye color" name="eyeColor" options={EYE_COLORS} />
            <Field
              label="Clothing style"
              name="clothingStyle"
              options={CLOTHING_STYLES}
            />
            <Field
              label="Visual style"
              name="visualStyle"
              options={VISUAL_STYLES}
            />
            <Field
              label="Background"
              name="backgroundStyle"
              options={BACKGROUND_STYLES}
            />
          </div>

          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              required
              className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
            />
            <span>
              I understand my companion is a fictional, AI-generated adult
              (18+) character and that this creation is permanent.
            </span>
          </label>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isPending}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Create my companion
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
