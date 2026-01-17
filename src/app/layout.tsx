import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Feud Live",
  description: "Live Family-Feud-style lobby, buzzer, question board, scoreboard, and timer"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
