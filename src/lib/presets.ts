import { chorePoints } from "@/lib/points";

// Quick-pick titles. Their points come from the same keyword rules as any typed title
// (src/lib/points.ts, mirrored in supabase/schema.sql), so the chips can never disagree
// with what the database awards.
export const CHORE_PRESETS = [
  "Did the dishes",
  "Wiped the table",
  "Took out the bins",
  "Emptied the dishwasher",
  "Cooked for the flat",
  "Did a shopping run",
  "Vacuumed",
  "Cleaned the bathroom",
  "Cleaned the kitchen",
].map((title) => ({ title, points: chorePoints(title) }));

export const FORFEIT_PRESETS = [
  "Pay for a group dinner",
  "Cook for the flat",
  "Deep clean the kitchen",
  "Do everyone's dishes for a week",
  "Buy the next cleaning supplies",
] as const;
