// Shared by server actions and the forms that call them. Lives outside the "use server"
// files because those may only export async functions.
export type FormState = {
  error?: string;
  // Increments on every success. Forms use it as a React key, so a successful save
  // remounts the fields empty while a failed one keeps what was typed.
  resetKey?: number;
  // Echoed back on failure so the email field is not cleared.
  email?: string;
  // Shown on success when the form stays on screen, e.g. "Check your inbox".
  message?: string;
};

export const initialFormState: FormState = {};

// Invite codes are 6 characters from the alphabet in generate_join_code().
export function cleanJoinCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(code) ? code : null;
}
