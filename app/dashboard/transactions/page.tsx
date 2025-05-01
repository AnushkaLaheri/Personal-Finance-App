"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowUp, Calendar, ChevronDown, Filter, Plus, Search } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { TransactionForm } from "@/components/transaction-form"
import useAuth from "@/hooks/useAuth"
import api from "@/lib/api"

// Define transaction interface
interface Transaction {
  _id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
}

export default function TransactionsPage() {
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams();

  // Fetch transactions from backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await api.get('/transactions');
        
        // Convert string dates to Date objects
        const formattedTransactions = response.data.map((transaction: any) => ({
          ...transaction,
          date: new Date(transaction.date)
        }));
        
        setTransactions(formattedTransactions);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError(`Failed to load transactions: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        setLoading(false);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    };

    fetchTransactions();
  }, [router]);

  // Show transaction form if 'add=1' is in the query params
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setShowTransactionForm(true);
    }
  }, [searchParams]);

  // Extract unique categories from transactions
  const categories = Array.from(new Set(transactions.map((t) => t.category)))

  const filteredTransactions = transactions.filter((transaction) => {
    if (searchQuery && !transaction.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    if (
      selectedDate &&
      !(
        transaction.date.getDate() === selectedDate.getDate() &&
        transaction.date.getMonth() === selectedDate.getMonth() &&
        transaction.date.getFullYear() === selectedDate.getFullYear()
      )
    ) {
      return false
    }

    if (selectedCategories.length > 0 && !selectedCategories.includes(transaction.category)) {
      return false
    }

    if (selectedTypes.length > 0) {
      const type = transaction.amount > 0 ? "income" : "expense"
      if (!selectedTypes.includes(type)) {
        return false
      }
    }

    return true
  })

  // Handle adding a new transaction
  const handleAddTransaction = async (newTransaction: any) => {
    try {
      let transactionToAdd = { ...newTransaction };
      if (transactionToAdd.type === "expense" && transactionToAdd.amount > 0) {
        transactionToAdd.amount = -Math.abs(transactionToAdd.amount);
      }
      if (transactionToAdd.type === "income" && transactionToAdd.amount < 0) {
        transactionToAdd.amount = Math.abs(transactionToAdd.amount);
      }

      await api.post('/transactions', transactionToAdd);
      const response = await api.get('/transactions');
      const formattedTransactions = response.data.map((transaction: any) => ({
        ...transaction,
        date: new Date(transaction.date),
      }));
      setTransactions(formattedTransactions);
      setShowTransactionForm(false);
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR', // Set currency to INR
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View and manage all your transactions</p>
        </div>
        <Button onClick={() => setShowTransactionForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {showTransactionForm && <TransactionForm onClose={() => setShowTransactionForm(false)} onSubmit={handleAddTransaction} />}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              {selectedDate && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-center text-sm"
                    onClick={() => setSelectedDate(undefined)}
                  >
                    Clear Date
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Transaction Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedTypes.includes("income")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTypes([...selectedTypes, "income"])
                  } else {
                    setSelectedTypes(selectedTypes.filter((t) => t !== "income"))
                  }
                }}
              >
                Income
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedTypes.includes("expense")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTypes([...selectedTypes, "expense"])
                  } else {
                    setSelectedTypes(selectedTypes.filter((t) => t !== "expense"))
                  }
                }}
              >
                Expense
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Categories</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, category])
                    } else {
                      setSelectedCategories(selectedCategories.filter((c) => c !== category))
                    }
                  }}
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-center text-sm"
                  onClick={() => {
                    setSelectedCategories([])
                    setSelectedTypes([])
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{format(transaction.date, "MMM d, yyyy")}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      transaction.amount > 0 ? "text-emerald-500" : "text-rose-500",
                    )}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {transaction.amount > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      {formatter.format(Math.abs(transaction.amount))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
