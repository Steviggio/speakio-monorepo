import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import Providers from "./providers";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Speakio",
    template: "%s | Speakio",
  },
  description: "A curation directory for language learning resources.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      fr: "/fr",
    },
  },
  openGraph: {
    title: "Speakio",
    description: "A curation directory for language learning resources.",
    url: "/",
    siteName: "Speakio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speakio",
    description: "A curation directory for language learning resources.",
  },
};

const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {umamiUrl && umamiWebsiteId && (
          <Script
            src={`${umamiUrl}/script.js`}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}

