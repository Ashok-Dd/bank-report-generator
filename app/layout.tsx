import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank Intelligence Brief Generator | CoComply",
  description:
    "Generate Bank Intelligence Brief PDFs from structured JSON data. Preserves original template layout with placeholder replacement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
