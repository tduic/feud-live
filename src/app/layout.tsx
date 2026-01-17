import "./globals.css";

export const metadata = {
  title: "Feud Live (5v5v5v5)",
  description: "Live Family-Feud-style lobby, buzzer, question board, scoreboard, and timer"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
