/** Official Google Form link for Orbital Expo project registration. */
export const ORBITAL_EXPO_GOOGLE_FORM_URL = "https://forms.gle/technotsav-orbital-expo";

export const GROUP_REGISTRATION_EVENTS = [
  { id: "orbital-expo", label: "Orbital Expo · Project Exhibition", min: 2, max: 4, externalUrl: ORBITAL_EXPO_GOOGLE_FORM_URL },
  { id: "cyber-arena-bgmi", label: "Cyber Arena · BGMI", min: 3, max: 4 },
  { id: "cosmic-hunt", label: "Cosmic Hunt · Treasure Hunt", min: 3, max: 4 },
  { id: "astro-bots-robogrip", label: "Astro Bots · RoboGrip", min: 2, max: 2 },
] as const;

export const INDIVIDUAL_REGISTRATION_EVENTS = [
  { id: "cyber-arena-stumble-guys", label: "Cyber Arena · Stumble Guys" },
  { id: "code-in-dark", label: "Code in Dark · Blind Typing" },
  { id: "web-verse", label: "Web Verse · Web Designing" },
  { id: "orbit-hack", label: "Orbit Hack · Bug Bounty" },
  { id: "cosmic-matrix", label: "The Cosmic Matrix · Prompt War" },
  { id: "astro-bitz-quiztron", label: "Astro Bitz · Quiztron (IT Quiz)" },
] as const;
