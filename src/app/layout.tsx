import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-secondary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "YouMevo - Let's share moment together",
  description: "YouMevo application landing page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${rajdhani.variable}`}>
        {children}
      </body>
    </html>
  );
}
