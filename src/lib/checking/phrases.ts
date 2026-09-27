/** Phrase that says the same thing in fewer words. */
export const WORDY: Record<string, string> = {
  "in order to": "to",
  "due to the fact that": "because",
  "at this point in time": "now",
  "in the event that": "if",
  "for the purpose of": "to",
  "in spite of the fact that": "although",
  "a large number of": "many",
  "with regard to": "about",
  "prior to": "before",
  "in the near future": "soon",
  "each and every": "every",
  "on a daily basis": "daily",
};

/** Formal word with a plainer one that does the same job. */
export const PLAINER: Record<string, string> = {
  utilize: "use",
  utilise: "use",
  leverage: "use",
  commence: "start",
  facilitate: "help",
  endeavor: "try",
  endeavour: "try",
  ascertain: "find out",
  approximately: "about",
  purchase: "buy",
  sufficient: "enough",
  additional: "more",
  assist: "help",
  demonstrate: "show",
  subsequently: "later",
};

export const HEDGES = [
  "just",
  "sort of",
  "kind of",
  "basically",
  "perhaps",
  "maybe",
];

export const WEAK_WORDS = ["very", "really", "extremely", "quite"];

/** Common misspellings, checked locally so spelling works without the server. */
export const MISSPELLINGS: Record<string, string> = {
  recieve: "receive",
  recieved: "received",
  seperate: "separate",
  definately: "definitely",
  occured: "occurred",
  accomodate: "accommodate",
  untill: "until",
  wether: "whether",
  alot: "a lot",
  teh: "the",
  thier: "their",
  beleive: "believe",
  goverment: "government",
  enviroment: "environment",
  neccessary: "necessary",
  reccomend: "recommend",
  succesful: "successful",
  tommorow: "tomorrow",
  wich: "which",
  shiped: "shipped",
  calender: "calendar",
  adress: "address",
  begining: "beginning",
  publically: "publicly",
};

/** Past participles that do not end in "ed", for the passive voice check. */
export const IRREGULAR_PARTICIPLES = [
  "written",
  "sent",
  "done",
  "made",
  "seen",
  "taken",
  "given",
  "shown",
  "known",
  "kept",
  "held",
  "built",
  "found",
  "paid",
  "told",
  "brought",
  "bought",
  "taught",
  "chosen",
  "drawn",
];
