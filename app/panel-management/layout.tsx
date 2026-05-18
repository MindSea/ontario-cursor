import type { Viewport } from "next";

/** Stable mobile width/scale; suppresses iOS input zoom like Inbox. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PanelManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
