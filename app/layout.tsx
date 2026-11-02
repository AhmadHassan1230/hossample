import type { Metadata } from "next";
import { Bodoni_Moda } from "next/font/google";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import SmoothScroll from "@/components/ui/SmoothScroll";
import Curtain from "@/components/navigation/Curtain";

// Display: BDO Grotesk (LC Tipografi, OFL). Text: Argentum Sans (OFL). Serif only inside the HoS logo.
const display = localFont({
  src: [
    { path: "./fonts/bdo-grotesk/BDOGrotesk-Light.woff2", weight: "300" },
    { path: "./fonts/bdo-grotesk/BDOGrotesk-Regular.woff2", weight: "400" },
    { path: "./fonts/bdo-grotesk/BDOGrotesk-Medium.woff2", weight: "500" },
    { path: "./fonts/bdo-grotesk/BDOGrotesk-DemiBold.woff2", weight: "600" },
  ],
  variable: "--font-display",
  display: "swap",
});
const sans = localFont({
  src: [
    { path: "../node_modules/@fontsource/argentum-sans/files/argentum-sans-latin-300-normal.woff2", weight: "300" },
    { path: "../node_modules/@fontsource/argentum-sans/files/argentum-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../node_modules/@fontsource/argentum-sans/files/argentum-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../node_modules/@fontsource/argentum-sans/files/argentum-sans-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--font-sans",
  display: "swap",
});
const logo = Bodoni_Moda({ subsets: ["latin"], weight: ["500"], variable: "--font-logo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "House of Sultana — Architecture, Interiors, Furniture", template: "%s — House of Sultana" },
  description: "House of Sultana is a multidisciplinary design studio in Pakistan: architecture, interiors and furniture.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${logo.variable} ${GeistMono.variable}`}>
      <body>
        <SmoothScroll />
        <Header />
        <main>{children}</main>
        <Footer />
        <Curtain />
      </body>
    </html>
  );
}
