export type GuideIntent = {
  phrases: string[];
  response: string;
};

/** Curated answers use only festival and college details confirmed by the organizers. */
export const GUIDE_INTENTS: GuideIntent[] = [
  {
    phrases: ["when is technotsav", "when is the festival", "festival date", "event date", "date of technotsav", "when does it start"],
    response: "The current event date is 27 November 2026. The countdown targets 00:00 IST that day; more schedule details have not been provided yet.",
  },
  {
    phrases: ["activities", "events at technotsav", "what events", "competitions", "event list", "which activities"],
    response: "The activities listed so far are Model Making, Logic Unlock, Digital Detours, Pixarel, Virtual Battle, Robogrip, and Quiztron. More details can be added when they’re confirmed.",
  },
  {
    phrases: ["registration", "register", "sign up", "registration form", "how can i join"],
    response: "Registration details and form fields haven’t been confirmed yet. Check back here after the organizers share the registration information.",
  },
  {
    phrases: ["about nmfc", "about the college", "nirmala memorial", "nmfc", "college"],
    response: "Nirmala Memorial Foundation College of Commerce and Science (Autonomous) was established in 2003 and is affiliated with the University of Mumbai. The college focuses on education and student development for the western suburbs and surrounding areas.",
  },
  {
    phrases: ["what is technotsav", "about technotsav", "tell me about technotsav", "festival", "intercollegiate"],
    response: "Technotsav is an intercollegiate technical festival started in 2013 by the Department of B.Sc. IT, CS and DS. It gives undergraduate and postgraduate students a platform to showcase their technical skills and enthusiasm.",
  },
  {
    phrases: ["theme", "space ai", "space x ai", "space × ai", "tagline", "decoding infinity"],
    response: "The theme is Space × AI. The tagline is “Decoding Infinity. Defining Tomorrow.”",
  },
  {
    phrases: ["is this ai", "are you ai", "real ai", "live ai", "who am i talking to"],
    response: "I’m the Technotsav Guide, a preset-response helper—not a live AI or human operator. I can answer only questions covered by the information confirmed so far.",
  },
];

export const GUIDE_SUGGESTIONS = [
  "What is Technotsav?",
  "Tell me about NMFC",
  "What activities are listed?",
  "When is the festival?",
  "How can I register?",
];

export function getGuideResponse(input: string) {
  const normalized = input.toLocaleLowerCase().replace(/[^a-z0-9\s×]/g, " ").replace(/\s+/g, " ").trim();
  const intent = GUIDE_INTENTS.find(({ phrases }) =>
    phrases.some((phrase) => normalized.includes(phrase.toLocaleLowerCase())),
  );
  return intent?.response ?? "I don’t have a confirmed answer for that yet. Try asking about Technotsav, NMFC, the listed activities, the date, or registration.";
}
