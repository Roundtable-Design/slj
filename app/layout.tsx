import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Literata,
  Manrope,
  Source_Serif_4,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { COURSE_TITLE } from "@/lib/site-branding";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif-cormorant",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif-source",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-serif-literata",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: COURSE_TITLE,
  description: "A discussion course",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${sourceSerif.variable} ${literata.variable} ${manrope.variable}`}
    >
      <body className="min-h-screen antialiased">
        <AuthSessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
