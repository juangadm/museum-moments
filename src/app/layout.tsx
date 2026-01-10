import type { Metadata } from "next";
import { Azeret_Mono, Lora, Gupter } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

// Azeret Mono for headings/display text
const azeretMono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
  display: "swap",
});

// Liter is not on Google Fonts - using Lora as a refined serif alternative
// that captures the editorial, museum-catalog feel
const liter = Lora({
  variable: "--font-liter",
  subsets: ["latin"],
  display: "swap",
});

// Gupter Bold for the Museum Moments logo
const gupter = Gupter({
  weight: "700",
  variable: "--font-gupter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Museum Moments",
    template: "%s — Museum Moments",
  },
  description:
    "A curated archive of design moments. Stop the slop. Build the beautiful.",
  keywords: [
    "design",
    "inspiration",
    "archive",
    "curation",
    "web design",
    "typography",
    "branding",
  ],
  authors: [{ name: "Juan Gabriel Delgado" }],
  creator: "Juan Gabriel Delgado",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Museum Moments",
    title: "Museum Moments",
    description:
      "A curated archive of design moments. Stop the slop. Build the beautiful.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Museum Moments",
    description:
      "A curated archive of design moments. Stop the slop. Build the beautiful.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${azeretMono.variable} ${liter.variable} ${gupter.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
