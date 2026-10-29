import type { PlanetDestination } from "@/lib/planets";

export type EventPanel = {
  section: string;
  title: string;
  paragraphs: string[];
  highlights?: string[];
};

export type PlanetEvent = {
  flyerTitle: string;
  eventName: string;
  rounds: string;
  panels: EventPanel[];
};

/** Inter-college event information transcribed from the supplied 2026 rule PDFs. */
export const PLANET_EVENTS: Record<PlanetDestination, PlanetEvent> = {
  mercury: {
    flyerTitle: "Code in Dark",
    eventName: "Blind Typing",
    rounds: "Two progressive rounds · Moderate, then Hard",
    panels: [
      {
        section: "The challenge",
        title: "Accuracy at speed.",
        paragraphs: [
          "Take on a timed blind-typing challenge at an assigned computer, reproducing the text shown on a common display.",
          "The rounds progress from Moderate to Hard, testing focus, rhythm, and precision under pressure.",
        ],
        highlights: ["Individual event", "Two progressive rounds", "Assigned computers"],
      },
      {
        section: "How it works",
        title: "Every character counts.",
        paragraphs: [
          "The final score accounts for typing speed and accuracy, with errors reducing the net speed. Participants must preserve punctuation and any intentional spelling shown in the source text.",
          "If scores are tied, accuracy, net speed, and spelling errors are used as tie-breakers; an additional test may be used if the tie persists.",
        ],
        highlights: ["Speed and accuracy", "Error-aware scoring", "Tie-break test if needed"],
      },
      {
        section: "Event details",
        title: "Join the next round.",
        paragraphs: [
          "Event date: Friday, 27 November 2026. Start time: To be announced.",
          "Prize money and recognition will be awarded to the top two winners.",
        ],
      },
    ],
  },
  venus: {
    flyerTitle: "Web Verse",
    eventName: "Web Designing Competition",
    rounds: "One 60-minute round",
    panels: [
      {
        section: "The challenge",
        title: "Design for the unknown.",
        paragraphs: [
          "Build a website from a problem statement and theme revealed at the event. The brief is to be interpreted on the spot, so clear thinking matters as much as visual craft.",
          "This is an individual, single-round competition with a 60-minute build window.",
        ],
        highlights: ["Individual event", "One 60-minute round", "Theme revealed on the spot"],
      },
      {
        section: "Rules of the arena",
        title: "Create within the brief.",
        paragraphs: [
          "Use the provided lab computers and Google AI Studio only. Up to five prompts are allowed; exceeding the limit attracts a deduction, while more than ten prompts leads to disqualification.",
          "Pre-built work, copied material, and outside assistance are not allowed. Report technical issues to the organizers.",
        ],
        highlights: ["Provided lab PCs", "Google AI Studio only", "Prompt limit applies"],
      },
      {
        section: "Event details",
        title: "Bring your ideas to life.",
        paragraphs: [
          "Work is judged for relevance to the announced problem and theme. Event date: Friday, 27 November 2026. Start time: To be announced.",
          "Prize money and recognition will be awarded to the top two winners.",
        ],
      },
    ],
  },
  earth: {
    flyerTitle: "Cosmic Hunt",
    eventName: "Digital Detour · Treasure Hunt",
    rounds: "Six QR-linked clues · 30-minute limit",
    panels: [
      {
        section: "The challenge",
        title: "Follow the clues.",
        paragraphs: [
          "Work as a team of four to solve a route of six QR-linked clues across the campus. Each team follows its own route with help from an assigned volunteer.",
          "The hunt has a 30-minute limit, and multiple colour-coded routes may run at the same time.",
        ],
        highlights: ["Teams of four", "Six clues", "30-minute limit"],
      },
      {
        section: "Play fair, move smart",
        title: "The route is the puzzle.",
        paragraphs: [
          "Participants should not use their personal phones; the assigned volunteer manages the QR route. Teams must report to the organizers one hour before the scheduled start.",
          "Hints add two minutes, a wrong location adds one minute, and misbehaviour adds five minutes. A second offence can result in disqualification.",
        ],
        highlights: ["Volunteer-managed QR clues", "Penalties affect time", "Second offence: disqualification"],
      },
      {
        section: "Event details",
        title: "Find the final signal.",
        paragraphs: [
          "Teams are ranked by clues solved, then by adjusted elapsed time and penalties. Event date: Friday, 27 November 2026. Start time: To be announced.",
          "Prize money and recognition will be awarded to the top two winning teams.",
        ],
      },
    ],
  },
  mars: {
    flyerTitle: "Cyber Arena",
    eventName: "BGMI · Stumble Guys",
    rounds: "Match-specific rounds to be announced by organizers",
    panels: [
      {
        section: "The challenge",
        title: "Two games. One arena.",
        paragraphs: [
          "Cyber Arena brings the inter-collegiate BGMI and Stumble Guys competitions together under one event banner.",
          "Represent your college, read the match, and make every move count. Only the inter-college formats are included here.",
        ],
        highlights: ["Inter-collegiate BGMI", "Inter-collegiate Stumble Guys", "Represent your college"],
      },
      {
        section: "Tournament conduct",
        title: "Play with focus.",
        paragraphs: [
          "Participants must follow the match format and organizer instructions for their game. Unsporting conduct, unfair play, or disruption can lead to penalties or removal from the event.",
          "Match-specific lobbies, rounds, and operating instructions will be communicated by the organizers.",
        ],
        highlights: ["Follow organizer instructions", "Fair play is required", "Match details at the event"],
      },
      {
        section: "Event details",
        title: "Enter the arena.",
        paragraphs: [
          "Event date: Friday, 27 November 2026. Start time: To be announced.",
          "Prize money and recognition will be awarded to the top two winners in each inter-college game.",
        ],
      },
    ],
  },
  jupiter: {
    flyerTitle: "Astro Bots",
    eventName: "RoboGrip",
    rounds: "One race attempt · maximum 7 minutes",
    panels: [
      {
        section: "The challenge",
        title: "Build. Grip. Navigate.",
        paragraphs: [
          "Guide your robot through a course of obstacles and checkpoints. Teams may have up to four members, with one driver operating the robot at a time and one assistant allowed to hold its wire.",
          "Each robot gets one race attempt, with a maximum run time of seven minutes.",
        ],
        highlights: ["Teams of up to four", "One attempt", "Seven-minute race limit"],
      },
      {
        section: "Robot specifications",
        title: "Engineer within the limits.",
        paragraphs: [
          "The robot must fit within 300 × 250 × 300 mm, with a ±5 mm tolerance, and use an electric supply below 25 V.",
          "A robot may skip up to five hurdles. If it becomes stuck at a checkpoint, organizers may reset the robot or blocks while the timer continues.",
        ],
        highlights: ["Maximum 300 × 250 × 300 mm", "Below 25 V", "Up to five skipped hurdles"],
      },
      {
        section: "Event details",
        title: "Navigate and grip your way to victory.",
        paragraphs: [
          "Driver assignments and race instructions are governed by the event rules. Event date: Friday, 27 November 2026. Start time: To be announced.",
          "Prize money and recognition will be awarded to the winners and runner-up.",
        ],
      },
    ],
  },
  saturn: {
    flyerTitle: "Orbit Hack",
    eventName: "Bug Bounty",
    rounds: "Two rounds · 20 minutes, then 45 minutes",
    panels: [
      {
        section: "The challenge",
        title: "Find the fault. Fix the code.",
        paragraphs: [
          "Debug code through two rounds: a 20-minute first round followed by a more challenging 45-minute round.",
          "The event tests careful analysis, accurate fixes, and the ability to explain technical decisions.",
        ],
        highlights: ["Individual event", "20-minute first round", "45-minute final round"],
      },
      {
        section: "Rules of engagement",
        title: "Work with the supplied tools.",
        paragraphs: [
          "Personal devices, internet access, ChatGPT, and other AI tools are not permitted. Participants must use only the resources supplied for the event.",
          "Judging considers correct fixes, accuracy without regressions, efficiency, technical understanding, and compliance with the rules.",
        ],
        highlights: ["No internet or personal devices", "No AI tools", "Use supplied resources only"],
      },
      {
        section: "Event details",
        title: "Trace the bug to its source.",
        paragraphs: [
          "Time efficiency may be used as a tie-breaker. Event date: Friday, 27 November 2026. Start time: To be announced.",
          "Prize money and recognition will be awarded to the top two winners.",
        ],
      },
    ],
  },
  uranus: {
    flyerTitle: "The Cosmic Matrix",
    eventName: "Prompt War",
    rounds: "Three timed rounds · 10, 7, and 7 minutes",
    panels: [
      {
        section: "The challenge",
        title: "Think in prompts.",
        paragraphs: [
          "Compete solo across three timed rounds: 10 minutes, 7 minutes, and 7 minutes. The image shown in round two is displayed for 5 minutes, and the round-three image for 3 minutes.",
          "The supplied rules specify Gemini as the only approved AI model and prohibit pre-written prompts. The first generated result is final.",
        ],
        highlights: ["Individual event", "Three timed rounds", "First result is final"],
      },
      {
        section: "Rules of the arena",
        title: "Create in the moment.",
        paragraphs: [
          "Do not share prompts, use prepared prompts, or use unauthorized apps. Follow the submission and screenshot instructions given by organizers.",
          "The rules document names Gemini while also stating that internet will not be provided. The organizer-provided model access and connectivity arrangement should be confirmed before the event.",
        ],
        highlights: ["No pre-written prompts", "No prompt sharing", "Model access to be confirmed"],
      },
      {
        section: "Event details",
        title: "Make every prompt count.",
        paragraphs: [
          "Event date: Friday, 27 November 2026. Start time: To be announced. Follow the organizer’s submission instructions for each round.",
          "Prize money and recognition will be awarded to the top two winners.",
        ],
      },
    ],
  },
  neptune: {
    flyerTitle: "Astro Bitz",
    eventName: "Quiztron · IT Quiz",
    rounds: "Three rounds · AI Battle, AI Circuit, and AI Master Round",
    panels: [
      {
        section: "The challenge",
        title: "Three rounds of discovery.",
        paragraphs: [
          "Take on three individual multiple-choice rounds: AI Battle (10 minutes), AI Circuit (15 minutes), and AI Master Round (15 minutes).",
          "The rounds carry one, five, and ten points per correct answer respectively. There is no negative marking, and a round auto-submits when its timer ends.",
        ],
        highlights: ["Individual MCQ quiz", "Three rounds", "No negative marking"],
      },
      {
        section: "Event details",
        title: "Knowledge in orbit.",
        paragraphs: [
          "Scores are based on total points. Digital materials are not allowed during the quiz. Event date: Friday, 27 November 2026. Start time: To be announced.",
          "Prize money and recognition will be awarded to the top two winners.",
        ],
        highlights: ["AI Battle · AI Circuit · AI Master Round", "Top score determines ranking"],
      },
    ],
  },
  pluto: {
    flyerTitle: "Orbital Expo",
    eventName: "Project Exhibition",
    rounds: "Group event · Teams of 2 to 4",
    panels: [
      {
        section: "The challenge",
        title: "Innovate and exhibit.",
        paragraphs: [
          "Orbital Expo is an intercollegiate working model and project exhibition competition.",
          "Teams of 2 to 4 participants showcase their innovative software, hardware, or AI/ML solutions before a panel of expert judges.",
        ],
        highlights: ["Group event · Teams of 2–4", "Working models & software", "Inter-collegiate competition"],
      },
      {
        section: "Event details",
        title: "Registration & submission.",
        paragraphs: [
          "Event date: Friday, 27 November 2026. Start time: 10 am onwards.",
          "Registration for Orbital Expo is conducted via its dedicated Google Form. Submit team members and project abstracts to enter.",
        ],
        highlights: ["Google Form registration", "Awards & certificates"],
      },
    ],
  },
};

