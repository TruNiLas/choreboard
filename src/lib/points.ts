// Mirrors chore_words(), chore_category() and chore_points() in supabase/schema.sql, so
// the form can preview the points before saving. Keep both in sync. The database is what
// actually awards points; this file only predicts them.

const ACCENTS = "áàâäãåéèêëíìîïóòôöõúùûüñç";
const PLAIN = "aaaaaaeeeeiiiiooooouuuunc";

// "Limpié el baño." -> " limpie el bano ". The padding lets " word" match at the start of
// a word and " word " match only the whole word, like the SQL LIKE patterns.
export function choreWords(title: string) {
  const plain = [...title.toLowerCase()].map((char) => PLAIN[ACCENTS.indexOf(char)] ?? char).join("");
  return ` ${plain.replace(/[^a-z0-9]+/g, " ").trim()} `;
}

type Group = { key: string; label: string; points: number; any: string[]; also?: string[] };

// Highest points first: the first group that matches wins.
const GROUPS: Group[] = [
  {
    key: "bathroom",
    label: "bathroom",
    points: 3,
    any: [" bathroom", " toilet", " loo ", " wc ", " bano", " aseo", " inodoro", " vater"],
  },
  {
    key: "kitchen",
    label: "kitchen",
    points: 3,
    any: [" kitchen", " cocina ", " hob", " oven", " stove", " fridge", " freezer", " nevera", " horno", " vitro"],
    also: [" clean", " scrub", " mop", " bleach", " disinfect", " degrease", " limpi", " freg", " frieg", " desinfect"],
  },
  {
    key: "floors",
    label: "floors",
    points: 2,
    any: [" vacuum", " hoover", " mop", " sweep", " swept", " floor", " aspira", " aspire", " barri ", " barrer", " suelo", " fregona"],
  },
  {
    key: "cooking",
    label: "cooking",
    points: 2,
    any: [
      " cook ", " cooked", " cooking", " cocine ", " cocinar", " cocino ", " cocinamos", " made dinner",
      " made lunch", " hice la cena", " hice la comida", " prepare la cena", " prepare la comida",
    ],
  },
  {
    key: "shopping",
    label: "shopping",
    points: 2,
    any: [" shop", " groceries", " grocery", " supermarket", " compra", " compre ", " mercadona", " super "],
  },
];

export function choreGroup(title: string) {
  const words = choreWords(title);
  const has = (keywords: string[]) => keywords.some((keyword) => words.includes(keyword));
  return GROUPS.find((group) => has(group.any) && (!group.also || has(group.also))) ?? null;
}

export function chorePoints(title: string) {
  return choreGroup(title)?.points ?? 1;
}

// What the once-a-day brake compares: the keyword group, or the words themselves when no
// group matched. Same rule as set_chore_points().
export function repeatKey(title: string, category: string | null) {
  return category ?? `words:${choreWords(title)}`;
}
