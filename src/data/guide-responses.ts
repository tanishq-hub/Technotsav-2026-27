import { FESTIVAL_EVENTS } from "@/lib/festival";

export type GuideIntent = {
  phrases: string[];
  response: string;
  followUps: string[];
};

/** Curated answers use only festival and college details confirmed by the organizers. */
export const GUIDE_INTENTS: GuideIntent[] = [
  {
    phrases: ["when is technotsav", "when is the festival", "festival date", "event date", "date of technotsav", "when does it start"],
    response: "The event date shown is Friday, 27 November 2026. The countdown targets 00:00 IST that day; the schedule has not been provided yet.",
    followUps: ["What activities are listed?", "What is Technotsav?", "How can I register?"],
  },
  {
    phrases: ["activities", "events at technotsav", "what events", "competitions", "event list", "which activities"],
    response: `The 2026–27 lineup lists ${FESTIVAL_EVENTS.map(({ name, description }) => `${name} (${description})`).join(", ")}.`,
    followUps: ["What is Technotsav?", "When is the festival?", "Tell me about NMFC"],
  },
  {
    phrases: ["registration", "register", "sign up", "registration form", "how can i join"],
    response: "Registration details and form fields haven’t been confirmed yet. Check back here after the organizers share the registration information.",
    followUps: ["What activities are listed?", "When is the festival?", "What is Technotsav?"],
  },
  {
    phrases: ["about nmfc", "about the college", "nirmala memorial", "nmfc", "college"],
    response: "Nirmala Memorial Foundation College of Commerce and Science (Autonomous) was established in 2003 and is affiliated with the University of Mumbai. The college focuses on education and student development for the western suburbs and surrounding areas.",
    followUps: ["What is Technotsav?", "What activities are listed?", "What is the theme?"],
  },
  {
    phrases: ["what is technotsav", "about technotsav", "tell me about technotsav", "festival", "intercollegiate"],
    response: "Technotsav is an intercollegiate technical festival started in 2013 by the Department of B.Sc. IT, CS and DS. It gives undergraduate and postgraduate students a platform to showcase their technical skills and enthusiasm.",
    followUps: ["What activities are listed?", "What is the theme?", "When is the festival?"],
  },
  {
    phrases: ["theme", "space ai", "space x ai", "space × ai", "tagline", "decoding infinity"],
    response: "The theme is Space × AI. The tagline is “Decoding Infinity. Defining Tomorrow.”",
    followUps: ["What is Technotsav?", "What activities are listed?", "When is the festival?"],
  },
  {
    phrases: ["is this ai", "are you ai", "real ai", "live ai", "who am i talking to"],
    response: "I’m the Technotsav Guide, a preset-response helper—not a live AI or human operator. I can answer only questions covered by the information confirmed so far.",
    followUps: ["What can I ask you?", "What activities are listed?", "Tell me about NMFC"],
  },
  {
    phrases: ["what can i ask you", "what can you answer", "what do you know"],
    response: "I can share the confirmed festival date, theme and tagline, listed activities, a short Technotsav overview, NMFC details, and the current registration status.",
    followUps: ["What is the theme?", "What activities are listed?", "How can I register?"],
  },
];

export const GUIDE_SUGGESTIONS = [
  "What is Technotsav?",
  "Tell me about NMFC",
  "What activities are listed?",
  "When is the festival?",
  "How can I register?",
];

const DEFAULT_FOLLOW_UPS = ["What is Technotsav?", "What activities are listed?", "When is the festival?", "How can I register?"];

function getIntent(input: string) {
  const normalized = input.toLocaleLowerCase().replace(/[^a-z0-9\s×]/g, " ").replace(/\s+/g, " ").trim();
  return GUIDE_INTENTS.find(({ phrases }) =>
    phrases.some((phrase) => normalized.includes(phrase.toLocaleLowerCase())),
  );
}

export function getGuideResponse(input: string) {
  const intent = getIntent(input);
  return intent?.response ?? "I don’t have a confirmed answer for that yet. Choose one of the topics below to explore confirmed Technotsav information.";
}

export function getGuideFollowUps(input: string) {
  return getIntent(input)?.followUps ?? DEFAULT_FOLLOW_UPS;
}
