import type { Metadata } from "next";
import "./LandingPage.module.css";

export const metadata: Metadata = {
  title: "T4SKS — Система управления производством контента",
  description: "Единая платформа для SMM, дизайнеров и фотографов",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="landing-root-container">
      {children}
    </div>
  );
}