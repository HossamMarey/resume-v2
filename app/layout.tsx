import { Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import { fontVariables } from "@/lib/font";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning

      className={cn("h-full antialiased ", fontVariables)}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>


            <main  >{children}</main>


          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
