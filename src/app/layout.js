import { Geist, Geist_Mono, Open_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AppInitializer from "@/components/AppInitializer";
import { Suspense } from "react";
import Header from "@/components/header";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "DFX",
  description: "Document workspace",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH_URL ?? ""}/logo.png`,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${openSans.variable} font-[family-name:var(--font-open-sans)] antialiased overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense>
            <AppInitializer />
          </Suspense>
          <div className="min-h-screen h-screen flex flex-col items-start bg-gray-100 p-1 overflow-x-hidden overflow-y-auto">
            <header className="z-50 w-full">
              <Header />
            </header>

            <main className="w-full h-full">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
