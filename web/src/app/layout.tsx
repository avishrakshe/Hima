import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const sans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const display = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.name} | ${site.tagline}`,
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#07110f",
  colorScheme: "dark",
};

/** Marks JS as available before first paint so scroll-reveal never hides content for no-JS visitors. */
const jsFlag = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} ${mono.variable} ${display.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: jsFlag }} />
      </head>
      <body className="grain min-h-screen overflow-x-hidden bg-ink text-bone">{children}</body>
    </html>
  );
}
