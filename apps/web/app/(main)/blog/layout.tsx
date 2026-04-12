import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Articles",
  description:
    "Read the latest tutorials, tips, and insights on mastering new languages.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
