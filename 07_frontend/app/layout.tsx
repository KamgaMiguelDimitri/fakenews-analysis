import type { Metadata } from "next";
import { Space_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FakeNews Analyzer",
  description: "Détection de fake news par IA — FakeNews Analyzer V1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceMono.variable} ${dmSans.variable}`}>
      <body className="bg-background text-white font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
