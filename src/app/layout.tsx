import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Tracker",
  description: "Track your tasks and daily activity",
};

const themeScript = `
try {
  var t = localStorage.getItem("theme");
  if (t === "dark") document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}