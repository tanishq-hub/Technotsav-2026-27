import type { Metadata } from "next";
import { PlanetPortal } from "@/components/planet-portal/PlanetPortal";

export const metadata: Metadata = {
  title: "Events & Planet Portal",
  description: "Explore the interplanetary festival destinations and intercollegiate IT competitions at Technotsav 2026–27.",
};

export default function EventsPage() {
  return <PlanetPortal />;
}
