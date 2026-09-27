export type PlanId = "free" | "pro" | "team";
export type Period = "yearly" | "monthly";

export interface Plan {
  id: PlanId;
  name: string;
  price: Record<Period, number>;
  unit?: string;
  tag?: string;
  description: string;
  cta: string;
  highlight?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: { yearly: 0, monthly: 0 },
    description: "For occasional writing and trying Margin out.",
    cta: "Get started",
    features: [
      "Spelling and grammar",
      "Margin notes",
      "Up to 20 drafts",
      "Light and dark themes",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: { yearly: 12, monthly: 15 },
    unit: "per month",
    tag: "Most writers",
    description: "For people who write every day and care how they sound.",
    cta: "Start 14-day trial",
    highlight: true,
    features: [
      "Everything in Free",
      "Clarity and tone notes",
      "Sentence rhythm",
      "Sounds-like-you voice profile",
      "Stet memory across drafts",
      "Unlimited drafts",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: { yearly: 18, monthly: 22 },
    unit: "per member / month",
    description: "For teams that publish under one name.",
    cta: "Start 14-day trial",
    features: [
      "Everything in Pro",
      "Shared style guide",
      "Team word list and stet list",
      "Admin and billing controls",
      "Google sign-in for the whole team",
    ],
  },
];

export const YEARLY_SAVING = "−20%";

export const TRIAL_DAYS = 14;

export interface CompareGroup {
  name: string;
  rows: { label: string; values: [string, string, string] }[];
}

export const COMPARE: CompareGroup[] = [
  {
    name: "Checking",
    rows: [
      { label: "Spelling and grammar", values: ["Yes", "Yes", "Yes"] },
      { label: "Clarity and tone", values: ["No", "Yes", "Yes"] },
      { label: "Sentence rhythm", values: ["No", "Yes", "Yes"] },
    ],
  },
  {
    name: "Your voice",
    rows: [
      { label: "Voice profile", values: ["No", "Personal", "Personal + team"] },
      { label: "Stet memory", values: ["This draft", "All drafts", "Shared"] },
    ],
  },
  {
    name: "Workspace",
    rows: [
      { label: "Drafts", values: ["20", "Unlimited", "Unlimited"] },
      { label: "Members", values: ["1", "1", "Unlimited"] },
    ],
  },
];

export const FAQ = [
  {
    q: "What happens after the trial?",
    a: "You pick a plan or drop to Free. We email you three days before the trial ends, and nothing is charged without a card on file.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes, from Settings in one click. Yearly plans are refunded for the unused months.",
  },
  {
    q: "How does the voice profile learn?",
    a: "From the drafts you write in Margin, plus any past writing you choose to upload. You can reset it whenever you want.",
  },
  {
    q: "Do you offer discounts?",
    a: "Students and non-profits get Pro at half price. Write to us from your school or organisation email.",
  },
];

export function planById(id: string | null | undefined): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}
