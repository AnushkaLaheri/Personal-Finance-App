"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowDown, ArrowUp, CreditCard, DollarSign, Plus, Target, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TransactionForm } from "@/components/transaction-form"
import { NotificationBanner } from "@/components/notification-banner"
import { RecentTransactions } from "@/components/recent-transactions"
import BalanceChart from "@/components/balance-chart"
import useAuth from "@/hooks/useAuth"
import api from "@/lib/api"
import { usePreferences } from '@/context/PreferencesContext';


export default function DashboardPage() {
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [notifications, setNotifications] = useState([
    "You've reached 90% of your Food budget",
    "You're 75% towards your Vacation goal!"
  ])
  const [transactions, setTransactions] = useState<any[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [transactionsError, setTransactionsError] = useState<string | null>(null)
  const [goals, setGoals] = useState<any[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  const { user, getProfile, loading, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if token exists in localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem('token') : null;
    
    if (!token) {
      // No token, redirect to login
      router.push("/login");
    } else if (!user) {
      // Token exists but no user data, fetch profile
      getProfile().catch(err => {
        console.error("Failed to get profile:", err);
        // If profile fetch fails (e.g., invalid token), redirect to login
        if (typeof window !== "undefined") {
          localStorage.removeItem('token');
        }
        router.push("/login");
      });
    }
  }, [user, router, getProfile]);

  // Fetch transactions for dashboard
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await api.get('/transactions');
        const formatted = response.data.map((t: any) => ({
          ...t,
          date: new Date(t.date),
          amount: Number(t.amount),
        }))
        setTransactions(formatted)
        setTransactionsLoading(false)
      } catch (err: any) {
        setTransactionsError("Failed to load transactions")
        setTransactionsLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  // Fetch goals for savings calculation
  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await api.get('/goals');
      setGoals(response.data);
    } catch (err) {
      // Optionally handle error
    } finally {
      setGoalsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    // Listen for goalsUpdated event
    const handleGoalsUpdated = () => {
      setGoalsLoading(true);
      fetchGoals();
    };
    window.addEventListener("goalsUpdated", handleGoalsUpdated);
    return () => {
      window.removeEventListener("goalsUpdated", handleGoalsUpdated);
    };
  }, []);

  // Example: Refetch goals after a transaction or goal update
  // Call fetchGoals() after adding/updating a goal or transaction

  // Calculate total savings from goals
  const totalGoalSavings = goals.reduce(
    (sum, goal) => sum + (goal.savedAmount || 0), // <-- use savedAmount, not currentAmount
    0
  );

  if (loading) {
    return <p className="text-center text-lg">Loading...</p>
  }

  if (!user) {
    return <p className="text-center text-red-500">{error || "Loading..."}</p>
  }

  // Force INR everywhere
  const userCurrency = "INR";
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: userCurrency,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-4">Welcome, {user.name}!</h1>
          
        </div>
        <Button asChild>
          <Link href="/dashboard/transactions?add=1">
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Link>
        </Button>
      </div>

      {notifications.map((notification, index) => (
        <NotificationBanner
          key={index}
          onDismiss={() => {
            setNotifications(notifications.filter((_, i) => i !== index))
          }}
        >
          {notification}
        </NotificationBanner>
      ))}

      {showTransactionForm && (
        <TransactionForm
          onClose={() => setShowTransactionForm(false)}
          onSubmit={async () => setShowTransactionForm(false)}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {transactions.length > 0
                ? formatter.format(transactions.reduce((sum, t) => sum + t.amount, 0))
                : formatter.format(user.totalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {transactions.length > 0
                ? formatter.format(
                    transactions
                      .filter((t) => t.amount > 0)
                      .reduce((sum, t) => sum + t.amount, 0)
                  )
                : formatter.format(user.income || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <ArrowDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {transactions.length > 0
                ? formatter.format(
                    transactions
                      .filter((t) => t.amount < 0)
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                  )
                : formatter.format(user.expenses || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goalsLoading ? "Loading..." : formatter.format(totalGoalSavings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +{formatter.format(user.savingsIncrease || 0)} from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Balance Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <BalanceChart data={[
                  { name: 'Income', balance: transactions.reduce((sum, t) => t.amount > 0 ? sum + t.amount : sum, 0) },
                  { name: 'Expenses', balance: transactions.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(t.amount) : sum, 0) },
                  { name: 'Savings', balance: totalGoalSavings },
                  { name: 'Balance', balance: transactions.reduce((sum, t) => sum + t.amount, 0) }
                ]} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  {transactions.length > 0
                    ? `You made ${transactions.length} transactions this month`
                    : "No transactions yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center text-muted-foreground">Loading transactions...</div>
                ) : transactionsError ? (
                  <div className="text-center text-red-500">{transactionsError}</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center text-muted-foreground">No transactions found.</div>
                ) : (
                  <ul className="divide-y">
                    {transactions
                      .sort((a, b) => b.date - a.date)
                      .slice(0, 5)
                      .map((t) => (
                        <li key={t._id} className="py-2 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{t.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.category} &middot; {t.date.toLocaleDateString()}
                            </div>
                          </div>
                          <div className={t.amount > 0 ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
                            {t.amount > 0 ? "+" : "-"}{formatter.format(Math.abs(t.amount))}
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/transactions">
                  <Button variant="outline" className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    View All Transactions
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Budget Status</CardTitle>
                <CardDescription>Your monthly budget progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Food & Dining</div>
                      <div className="text-sm text-muted-foreground">
                        {formatter.format(450)} / {formatter.format(500)}
                      </div>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Housing</div>
                      <div className="text-sm text-muted-foreground">
                        {formatter.format(1200)} / {formatter.format(1500)}
                      </div>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Transportation</div>
                      <div className="text-sm text-muted-foreground">
                        {formatter.format(250)} / {formatter.format(400)}
                      </div>
                    </div>
                    <Progress value={62.5} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Entertainment</div>
                      <div className="text-sm text-muted-foreground">
                        {formatter.format(120)} / {formatter.format(200)}
                      </div>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Manage Budgets
                </Button>
              </CardFooter>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Savings Goals</CardTitle>
                <CardDescription>Track your progress towards your goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goalsLoading ? (
                    <div>Loading...</div>
                  ) : goals.length === 0 ? (
                    <div>No goals found.</div>
                  ) : (
                    goals.slice(0, 2).map((goal) => (
                      <div className="space-y-2" key={goal._id}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{goal.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatter.format(goal.savedAmount || 0)} / {formatter.format(goal.targetAmount || 0)}
                          </div>
                        </div>
                        <Progress value={Math.round((goal.savedAmount / goal.targetAmount) * 100)} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          Monthly Budget: {formatter.format(goal.monthlyBudget || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Target date: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "Ongoing"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/goals">
                <Button variant="outline" className="w-full">
                  View All Goals
                </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


