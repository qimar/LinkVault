import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Provider from "@/components/provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LinkVault",
  description: "Your personalized link in bio",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} bg-[var(--background)] min-h-screen text-[var(--foreground)]`}>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
