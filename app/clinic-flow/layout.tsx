import type { Viewport } from "next";

/** Stable mobile width/scale; clinic-flow page is a client component and cannot export viewport. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ClinicFlowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
