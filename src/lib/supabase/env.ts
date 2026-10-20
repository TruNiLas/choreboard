// The only two Supabase values allowed in this app. Both are public by design: the
// publishable key can do nothing that Row Level Security does not allow.
export const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseKey = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is missing. Add it to .env.local (and to Vercel's environment variables).`);
  }
  return value;
}
