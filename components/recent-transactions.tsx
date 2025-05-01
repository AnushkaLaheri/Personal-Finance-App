"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

const transactions = [
  {
    id: 1,
    description: "Grocery Shopping",
    amount: -120.5,
    date: "Today",
    category: "Food & Dining",
  },
  {
    id: 2,
    description: "Salary Deposit",
    amount: 2500.0,
    date: "Yesterday",
    category: "Income",
  },
  {
    id: 3,
    description: "Electric Bill",
    amount: -85.2,
    date: "May 15, 2023",
    category: "Utilities",
  },
  {
    id: 4,
    description: "Freelance Payment",
    amount: 350.0,
    date: "May 14, 2023",
    category: "Income",
  },
  {
    id: 5,
    description: "Restaurant Dinner",
    amount: -65.3,
    date: "May 12, 2023",
    category: "Food & Dining",
  },
  {
    id: 6,
    description: "Pen",
    amount: -5.0,
    date: "May 1, 2025",
    category: "Office Supplies",
  },
]

export function RecentTransactions() {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR', // Set currency to INR
  });

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const formattedAmount = formatter.format(Math.abs(transaction.amount));
        return (
          <div key={transaction.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  transaction.amount > 0 ? "bg-emerald-100 dark:bg-emerald-900" : "bg-rose-100 dark:bg-rose-900",
                )}
              >
                {transaction.amount > 0 ? (
                  <ArrowUp className="h-5 w-5 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-rose-500" />
                )}
              </div>
              <div>
                <div className="font-medium">{transaction.description}</div>
                <div className="text-xs text-muted-foreground">
                  {transaction.category} • {transaction.date}
                </div>
              </div>
            </div>
            <div className={cn("font-medium", transaction.amount > 0 ? "text-emerald-500" : "text-rose-500")}>
              {transaction.amount > 0 ? "+" : ""}{formattedAmount}
            </div>
          </div>
        );
      })}
    </div>
  )
}
