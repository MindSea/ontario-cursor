import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messaging",
  description:
    "Operational messaging between navigators, patients, and primary care providers.",
};

export default function MessagingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
