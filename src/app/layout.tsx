import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SlideFlow — Generator Presentasi HTML + PPTX",
  description:
    "Ubah dokumen sumber (PDF, Word, Excel, PowerPoint, teks) menjadi 7 slide presentasi profesional: slide garis besar, detail deskripsi menjadi catatan pembicara lisan. Ekspor HTML full-motion dan PPTX dengan chart asli.",
  keywords: ["SlideFlow", "generator presentasi", "PPTX", "HTML deck", "speaker notes", "laporan", "AI"],
  authors: [{ name: "Z.ai" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "SlideFlow",
    description: "Dokumen sumber → 7 slide profesional + catatan pembicara lisan",
    siteName: "SlideFlow",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
