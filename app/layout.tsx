import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { Navbar } from "@/components/layout/navbar";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from "@/components/legal/legal-page";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "RentGH — Ghana Rental & Property Finder",
    template: "%s | RentGH",
  },
  description:
    "Find houses, apartments, rooms, hostels and land for rent or sale across all 16 regions of Ghana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white text-slate-900 antialiased`}
      >
        <Navbar />
        <div className="min-h-[calc(100vh-9rem)]">{children}</div>
        <footer className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-7 text-center text-sm text-slate-500 sm:px-6">
            <p className="font-semibold text-slate-700">
              Rent<span className="text-emerald-700">GH</span>
            </p>
            <p className="max-w-xl">
              Find your next home in Ghana — houses, apartments, rooms,
              hostels and land across all 16 regions.
            </p>
            <nav
              aria-label="Legal and safety"
              className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-medium text-slate-600"
            >
              <Link href="/safety" className="hover:text-emerald-800 hover:underline">
                Safety tips
              </Link>
              <Link href="/terms" className="hover:text-emerald-800 hover:underline">
                Terms of Use
              </Link>
              <Link href="/privacy" className="hover:text-emerald-800 hover:underline">
                Privacy Policy
              </Link>
            </nav>
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="font-medium text-slate-600">Support:</span>
              <a
                href={`tel:${SUPPORT_PHONE_TEL}`}
                className="font-medium text-emerald-700 hover:underline"
              >
                {SUPPORT_PHONE_DISPLAY}
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-emerald-700 hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p className="text-xs text-slate-400">
              © {currentYear} RentGH. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
