import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "GameNews — Últimas Notícias de Games",
  description: "Acompanhe as últimas notícias de PC, Xbox, Nintendo e PlayStation em um só lugar.",
};

// Layout raiz — apenas define as fontes e o html/body base
// O [locale]/layout.tsx adiciona o NextIntlClientProvider e o locale correto
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
