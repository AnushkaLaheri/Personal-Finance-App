import type React from "react"
import Link from "next/link"
import { Coins } from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between border-b">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Coins className="h-6 w-6 text-primary" />
          <span>FinanceTracker</span>
        </Link>
        <ModeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">{children}</main>
      <footer className="border-t py-4 px-6">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FinanceTracker. All rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
