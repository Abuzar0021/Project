/**
 * Sample drafts for new accounts. They are written with contractions
 * throughout, so the voice profile learns a clear habit from them.
 */

export interface SeedDraft {
  title: string;
  tags: string[];
  minutesAgo: number;
  paragraphs: string[];
}

export const PRICING_UPDATE: SeedDraft = {
  title: "Pricing update for early customers",
  tags: ["customers", "launch"],
  minutesAgo: 4,
  paragraphs: [
    "Starting next month, everyone who joined before March will keep their current rate for a full year. The new pricing was decided by the team after three weeks of calls with people like you. We wanted to be clear about it early.",
    "You don't need to do anything in order to keep your rate, since it will be applied to your account automatically and you will recieve a confirmation email once the change goes live, along with a copy of your current invoice and a short note explaining what changes for new customers after that date.",
    "If you want to utilize the annual plan instead, reply to this email. We shall be delighted to switch it for you. Thanks for being here early.",
    "Mira, for the Northwind team",
  ],
};

export const SEED_DRAFTS: SeedDraft[] = [
  PRICING_UPDATE,
  {
    title: "Q4 board memo",
    tags: ["internal"],
    minutesAgo: 180,
    paragraphs: [
      "Here's where we landed this quarter. Revenue grew eleven percent, churn held steady, and we're finally seeing the annual plan pull its weight. We'll walk through the numbers on Thursday, but I wanted you to have the short version first.",
      "The good news is that the onboarding changes did what we hoped. New teams reach their first finished draft in under a day now, and they don't drop off in week two the way they used to. It's the clearest signal we've had that the product is getting easier to start.",
      "The harder part is hiring. We've got two open roles in support and we'll need both filled before the spring launch. I'd rather slow the launch by a month than ship it with a team that's stretched thin.",
      "We're not asking for new budget. We'd like your read on the launch timing and on whether the support roles should be senior hires. If you can't make Thursday, send questions my way and I'll answer them in writing.",
      "Mira",
    ],
  },
  {
    title: "Reply to Hanna re: refund",
    tags: ["customers"],
    minutesAgo: 1500,
    paragraphs: [
      "Hi Hanna,",
      "Thanks for writing in, and I'm sorry the renewal caught you off guard. You're right that the reminder email should have gone out a week earlier. That's on us, and we've already fixed the setting that caused it.",
      "We'll refund the full amount today. It usually takes three to five days to show up on your card, depending on your bank. You don't need to do anything else, and your drafts stay exactly where they are.",
      "For what it's worth, we're also changing how renewals work for everyone. From next month you'll get a reminder two weeks ahead and another three days before any charge.",
      "If you'd like to stay on the monthly plan instead, reply and we'll switch it over. There's no charge for changing, and we won't renew anything without telling you first.",
      "Thanks again for flagging it. It helps more than you'd think.",
      "Talk soon,",
      "Mira",
    ],
  },
  {
    title: "Onboarding email 2",
    tags: ["launch"],
    minutesAgo: 4400,
    paragraphs: [
      "Welcome back. By now you've written your first draft in Margin, so here's what's worth trying next.",
      "Press J to move to the next note and Enter to accept it. If a suggestion doesn't fit, press S and Margin won't raise it again. We'll keep learning from the drafts you write, so the notes get more useful the longer you use it.",
      "Turn on the rhythm gutter with R. Each bar is a sentence, and the long ones turn amber. It's the quickest way we've found to spot a paragraph that's getting heavy.",
      "You can also drop in a few things you've written before, like emails or posts. Margin uses them to learn how you sound, and it never shares them or trains anything else on them.",
      "Next week we'll show you how the voice meter works and why it doesn't want you to sound like everyone else.",
      "The Margin team",
    ],
  },
];
