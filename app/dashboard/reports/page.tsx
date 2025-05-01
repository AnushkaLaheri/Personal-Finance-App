"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChevronDown, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/api"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FCCDE5"]

type FinancialSummary = {
  income: number
  expenses: number
  balance?: number
}

type ExpenseCategory = {
  name: string
  value: number
}

type MonthlyData = {
  name: string
  income: number
  expenses: number
}

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("monthly")
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCategory[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReportData() {
      setLoading(true)
      try {
        const [expensesRes, monthlyRes, summaryRes] = await Promise.all([
          api.get("/reports/expenses-by-category"),
          api.get("/reports/monthly-summary"),
          api.get("/reports")
        ])
        setExpensesByCategory(expensesRes.data)
        setMonthlyData(monthlyRes.data)
        setSummary(summaryRes.data)
      } catch (error) {
        console.error("Error fetching report data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchReportData()
  }, [])

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'INR', // Set currency to INR
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground">Analyze your financial data with detailed reports</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {timeRange === "monthly" ? "Monthly" : timeRange === "quarterly" ? "Quarterly" : "Yearly"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTimeRange("monthly")}>Monthly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange("quarterly")}>Quarterly</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange("yearly")}>Yearly</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
                <CardDescription>Monthly comparison of income and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loading ? (
                    <div>Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData.map(item => ({
                          ...item,
                          expenses: Math.abs(item.expenses)
                        }))}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatter.format(value)} /> {/* Ensure value is a number */}
                        <Legend />
                        <Bar dataKey="income" fill="#10b981" name="Income" />
                        <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Distribution of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {loading ? (
                    <div>Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        {(() => {
                          const absData = expensesByCategory.map(item => ({
                            ...item,
                            value: Math.abs(item.value)
                          }));
                          const total = absData.reduce((sum, item) => sum + item.value, 0);
                          return (
                            <Pie
                              data={absData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) =>
                                total > 0
                                  ? `${name}: ${((value / total) * 100).toFixed(1)}%`
                                  : `${name}: 0%`
                              }
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {absData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                          );
                        })()}
                        <Tooltip formatter={(value: number) => formatter.format(value)} /> {/* Ensure value is a number */}
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Key financial metrics for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Income</p>
                  <p className="text-2xl font-bold">
                    {loading || !summary ? "Loading..." : formatter.format(summary.income)}
                  </p>
                  <p className="text-xs text-emerald-500">+12% from last period</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">
                    {loading || !summary ? "Loading..." : formatter.format(Math.abs(summary.expenses))}
                  </p>
                  <p className="text-xs text-rose-500">+5% from last period</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net Savings</p>
                  <p className="text-2xl font-bold">
                    {loading || !summary ? "Loading..." : formatter.format(summary.income - Math.abs(summary.expenses))}
                  </p>
                  <p className="text-xs text-emerald-500">+32% from last period</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <p className="text-2xl font-bold">
                    {loading || !summary
                      ? "Loading..."
                      : summary.income
                        ? `${Math.max(0, ((1 - Math.abs(summary.expenses) / summary.income) * 100)).toFixed(1)}%`
                        : "0%"}
                  </p>
                  <p className="text-xs text-emerald-500">+4.2% from last period</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income Analysis</CardTitle>
              <CardDescription>Detailed breakdown of your income sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Income analysis charts will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Analysis</CardTitle>
              <CardDescription>Detailed breakdown of your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Expense analysis charts will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Savings Analysis</CardTitle>
              <CardDescription>Track your savings progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Savings analysis charts will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
