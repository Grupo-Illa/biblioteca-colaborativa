import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ProvedorTema } from "@/components/theme-provider";
import "./globals.css";

const fonteSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fonteMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Acervo — Biblioteca Interna",
  description:
    "Plataforma interna de aluguel de livros: explore o acervo, filtre por preferências e favorite seus títulos.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8f0c9" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a18" },
  ],
};

// Roda antes da pintura para evitar piscar o tema errado na primeira carga.
const scriptTema = `(function(){try{var t=localStorage.getItem('acervo-tema');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function LayoutRaiz({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fonteSans.variable} ${fonteMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
        <ProvedorTema>{children}</ProvedorTema>
      </body>
    </html>
  );
}
