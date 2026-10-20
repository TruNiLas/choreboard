// Keep CHORE_PRESETS in sync with chore_points() in supabase/schema.sql. The database is
// what actually awards points; this list only drives the quick-pick buttons.
export const CHORE_PRESETS = [
  { title: "Did the dishes", points: 1 },
  { title: "Wiped the table", points: 1 },
  { title: "Took out the bins", points: 1 },
  { title: "Emptied the dishwasher", points: 1 },
  { title: "Cooked for the flat", points: 2 },
  { title: "Did a shopping run", points: 2 },
  { title: "Vacuumed", points: 2 },
  { title: "Cleaned the bathroom", points: 3 },
  { title: "Cleaned the kitchen", points: 3 },
] as const;

export const FORFEIT_PRESETS = [
  "Pay for a group dinner",
  "Cook for the flat",
  "Deep clean the kitchen",
  "Do everyone's dishes for a week",
  "Buy the next cleaning supplies",
] as const;
