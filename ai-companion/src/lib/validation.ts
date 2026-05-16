// Shared input validators. Reused by server actions so that the backend
// never trusts client-side validation alone.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export const MIN_PASSWORD_LENGTH = 8;

export function passwordError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > 72) {
    // bcrypt (used by Supabase Auth) truncates beyond 72 bytes.
    return "Password must be 72 characters or fewer.";
  }
  return null;
}

export function normalizeEmail(raw: FormDataEntryValue | null): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase();
}
