export const R2_MEDIA_ORIGIN = "https://technotsav-media.luckymobilebarhi.in";
const R2_PLANET_MEDIA = `${R2_MEDIA_ORIGIN}/planets`;

export const ASSETS = {
  spaceVideo: `${R2_PLANET_MEDIA}/space_v2.mp4`,
  solarSystemVideo: "/solar_system_v2.mp4",
  sunVideo: `${R2_PLANET_MEDIA}/sun_v1.mp4`,
  mercuryVideo: `${R2_PLANET_MEDIA}/mercury_v1.mp4`,
  venusVideo: `${R2_PLANET_MEDIA}/venus_v1.mp4`,
  earthVideo: `${R2_PLANET_MEDIA}/earth_v1.mp4`,
  marsVideo: `${R2_PLANET_MEDIA}/mars_v1.mp4`,
  jupiterVideo: `${R2_PLANET_MEDIA}/jupiter_v1.mp4`,
  saturnVideo: `${R2_PLANET_MEDIA}/saturn_v1.mp4`,
  uranusVideo: `${R2_PLANET_MEDIA}/uranus_v1.mp4`,
  neptuneVideo: `${R2_PLANET_MEDIA}/neptune_v1.mp4`,
} as const;

export type PlanetKey = "sun" | "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune";
export type PlanetDestination = Exclude<PlanetKey, "sun">;

export type AboutPanel = {
  section: "ABOUT NMFC" | "ABOUT TECHNOTSAV";
  title: string;
  paragraphs: string[];
  highlights?: string[];
};

export const SUN_ABOUT_PANELS: AboutPanel[] = [
  {
    section: "ABOUT NMFC",
    title: "Nirmala Memorial Foundation College",
    paragraphs: [
      "Established in 2003, Nirmala Memorial Foundation College of Commerce and Science (Autonomous), affiliated with the University of Mumbai, is a premier Mumbai college known for quality education.",
      "It caters primarily to students in the western suburbs and outskirts.",
      "The institute offers B.Com. and self-financing courses, postgraduate programmes such as M.Com, and a Ph.D. centre for research scholars.",
    ],
  },
  {
    section: "ABOUT NMFC",
    title: "A commitment to growth",
    paragraphs: [
      "Managed by educationally strong leaders, Nirmala College is proactive in ensuring quality education.",
      "Socially committed, it focuses on providing education, training, and knowledge enhancement to youth in Malad and Kandivali.",
      "Dedicated teachers provide individual attention, aiding students’ success. Through debates, workshops, seminars, competitions, and sports, the college fosters enthusiastic participation.",
      "The college aims for students’ overall development by offering opportunities to nurture talents, build careers, and become responsible citizens.",
    ],
  },
  {
    section: "ABOUT TECHNOTSAV",
    title: "A technical festival since 2013",
    paragraphs: [
      "Technotsav is an intercollegiate technical festival started in 2013 by the departments of B.Sc. IT, CS, DS, and AI/ML.",
      "It aims to provide a platform for UG and PG students to showcase their technical prowess, talent, and enthusiasm.",
    ],
  },
  {
    section: "ABOUT TECHNOTSAV",
    title: "A one-day festival on campus",
    paragraphs: [
      "The activities culminate in a grand one-day intercollegiate festival held on the NMFC campus.",
      "With each passing year, we anticipate the event will attract an increasing number of participants due to the enthusiasm and energy it has fostered.",
      "On the occasion of Technotsav, we invite dignitaries and academicians from the field of education from various universities and colleges, as well as other reputable IT industries.",
    ],
  },
];

export const PLANETS: { key: PlanetDestination; name: string }[] = [
  { key: "mercury", name: "Code in Dark" },
  { key: "venus", name: "Web Verse" },
  { key: "earth", name: "Cosmic Hunt" },
  { key: "mars", name: "Cyber Arena" },
  { key: "jupiter", name: "Astro Bots" },
  { key: "saturn", name: "Orbit Hack" },
  { key: "uranus", name: "The Cosmic Matrix" },
  { key: "neptune", name: "Astro Bitz" },
];

type PlanetState = {
  name: string;
  next: PlanetDestination | null;
  number: string;
  background: string;
  facts: [string, string][];
};

export const PLANET_STATES: Record<PlanetKey, PlanetState> = {
  sun: { name: "Sun", next: "mercury", number: "[01]", background: ASSETS.sunVideo, facts: [["Type:", "A G-type main-sequence star at the center of our Solar System."], ["Age:", "About 4.6 billion years."], ["Temperature:", "The visible photosphere is about 5,500 °C."], ["Composition:", "A hot plasma made mostly of hydrogen and helium."]] },
  mercury: { name: "Mercury", next: "venus", number: "[02]", background: ASSETS.mercuryVideo, facts: [["Distance:", "About 58 million km from the Sun."], ["Year:", "88 Earth days."], ["Temperature:", "From about 430 °C by day to -180 °C at night."], ["Atmosphere:", "A very thin exosphere containing oxygen, sodium, hydrogen, helium, and potassium."]] },
  venus: { name: "Venus", next: "earth", number: "[03]", background: ASSETS.venusVideo, facts: [["Distance:", "108.2 million km from the Sun."], ["Year:", "225 Earth days."], ["Temperature:", "Around 465 °C — the hottest planet in the Solar System."], ["Atmosphere:", "Extremely dense, mostly carbon dioxide, with clouds of sulfuric acid."]] },
  earth: { name: "Earth", next: "mars", number: "[04]", background: ASSETS.earthVideo, facts: [["Distance:", "149.6 million km from the Sun."], ["Year:", "365.25 Earth days."], ["Temperature:", "Average surface temperature around 15 °C."], ["Atmosphere:", "Mostly nitrogen and oxygen, supporting life and liquid water."]] },
  mars: { name: "Mars", next: "jupiter", number: "[05]", background: ASSETS.marsVideo, facts: [["Distance:", "About 228 million km (1.5 astronomical units)."], ["Year:", "One Martian year is equal to 687 Earth days."], ["Temperature:", "Around -60 °C, dropping to -125 °C at the poles in winter."], ["Atmosphere:", "Very thin, consisting of 95% carbon dioxide, with frequent dust storms."]] },
  jupiter: { name: "Jupiter", next: "saturn", number: "[06]", background: ASSETS.jupiterVideo, facts: [["Distance:", "About 778 million km (5.2 astronomical units) from the Sun."], ["Year:", "About 11.9 Earth years."], ["Temperature:", "Cloud-top temperatures average about -110 °C."], ["Atmosphere:", "Mostly hydrogen and helium, with clouds and powerful storms."]] },
  saturn: { name: "Saturn", next: "uranus", number: "[07]", background: ASSETS.saturnVideo, facts: [["Distance:", "About 1.43 billion km (9.6 astronomical units) from the Sun."], ["Year:", "About 29.4 Earth years."], ["Temperature:", "Cloud-top temperatures average about -140 °C."], ["Atmosphere:", "Mostly hydrogen and helium, with visible cloud bands and storms."]] },
  uranus: { name: "Uranus", next: "neptune", number: "[08]", background: ASSETS.uranusVideo, facts: [["Distance:", "About 2.87 billion km (19.2 astronomical units) from the Sun."], ["Year:", "About 84 Earth years."], ["Temperature:", "Atmospheric temperatures can fall to about -195 °C."], ["Atmosphere:", "Hydrogen and helium, with methane that contributes to its blue-green color."]] },
  neptune: { name: "Neptune", next: null, number: "[09]", background: ASSETS.neptuneVideo, facts: [["Distance:", "About 4.5 billion km (30 astronomical units) from the Sun."], ["Year:", "About 165 Earth years."], ["Temperature:", "Atmospheric temperatures can fall to about -200 °C."], ["Atmosphere:", "Hydrogen and helium with methane; winds can exceed 2,000 km/h."]] },
};
