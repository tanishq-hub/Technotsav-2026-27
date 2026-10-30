import type { Metadata } from "next";
import { RegistrationView } from "@/components/registration/RegistrationView";

export const metadata: Metadata = {
  title: "Registration",
  description: "Register your college delegation or individual entries for Technotsav 2026–27.",
};

export default function RegistrationPage() {
  return <RegistrationView />;
}
