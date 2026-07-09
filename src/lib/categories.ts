export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Rent",
  "Entertainment",
  "Healthcare",
  "Education",
  "Others",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelancing",
  "Business",
  "Investment",
  "Gifts",
  "Others",
] as const;

export const MOODS = [
  { key: "happy", label: "Happy", emoji: "😊" },
  { key: "necessary", label: "Necessary", emoji: "🧾" },
  { key: "regret", label: "Regret", emoji: "😩" },
  { key: "impulsive", label: "Impulsive", emoji: "⚡" },
  { key: "reward", label: "Reward", emoji: "🎁" },
  { key: "investment", label: "Investment", emoji: "📈" },
] as const;

export const CATEGORY_ICON: Record<string, string> = {
  Food: "🍜",
  Travel: "✈️",
  Shopping: "🛍️",
  Bills: "💡",
  Rent: "🏠",
  Entertainment: "🎬",
  Healthcare: "🩺",
  Education: "📚",
  Salary: "💰",
  Freelancing: "💼",
  Business: "🏢",
  Investment: "📈",
  Gifts: "🎁",
  Others: "•",
};
