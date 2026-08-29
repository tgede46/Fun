import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fun",
  description: "Atelier desktop — canvas, IA et focus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
