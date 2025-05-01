import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PreferencesProvider } from '@/context/PreferencesContext';
import { AppHeader } from '@/components/app-header';
import { AppNav } from '@/components/app-nav';

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Personal Finance App",
  description: "Manage your personal finances with ease",
  generator: 'v0.dev'
}

// Ensure only one default export
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <PreferencesProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </PreferencesProvider>
      </body>
    </html>
  )
}

import './globals.css'


