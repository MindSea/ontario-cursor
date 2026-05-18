import type { Viewport } from "next";

/** Stable mobile width/scale; suppresses iOS input zoom like Clinic Flow. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
