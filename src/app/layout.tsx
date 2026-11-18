import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "myexpencess — Personal expense tracker",
    template: "%s | myexpencess",
  },
  description:
    "Track your daily expenses, organize spending with your own categories, and understand your monthly spending.",
  openGraph: {
    title: "myexpencess",
    description: "A simpler way to understand where your money goes.",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
