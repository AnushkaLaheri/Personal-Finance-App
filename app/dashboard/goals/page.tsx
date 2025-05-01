"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Check, Plus, Target } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

import { usePreferences } from '@/context/PreferencesContext'; // Import PreferencesContext

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  targetAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Target amount must be a positive number",
  }),
  currentAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Current amount must be a non-negative number",
  }),
  targetDate: z.date().nullable(),
  description: z.string().optional(),
  // monthlyBudget removed
})

//import { useNotifications } from "@/context/NotificationsContext"; // Example path

export default function GoalsPage() {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const { currency } = usePreferences(); // Use PreferencesContext
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });

  useEffect(() => {
    api.get("/goals")
      .then((res) => {
        setGoals(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching goals:", error);
        setLoading(false);
        setError("Failed to fetch goals.");
      });
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: null,
      description: "",
      // monthlyBudget removed
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      const res = await api.post("/goals", {
        title: values.name,
        targetAmount: Number(values.targetAmount),
        deadline: values.targetDate,
        savedAmount: Number(values.currentAmount),
        // monthlyBudget removed
      });
      if (res.status >= 200 && res.status < 300) {
        const newGoal = res.data;
        setGoals((prev) => [...prev, newGoal]);
        setShowGoalForm(false);
        form.reset();
      } else {
        setError("Failed to add goal. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to add goal. Please check your connection.");
    }
  }

  const updateForm = useForm<{ currentAmount: string; date: Date | undefined }>({
    defaultValues: {
      currentAmount: "",
      date: undefined,
    },
  });

  // Prefill current amount and date when dialog opens
  useEffect(() => {
    if (selectedGoal) {
      updateForm.setValue("currentAmount", selectedGoal.savedAmount?.toString() || "0");
      updateForm.setValue("date", selectedGoal.deadline ? new Date(selectedGoal.deadline) : undefined);
    }
  }, [selectedGoal, updateForm]);

  // Add this helper function at the top (after imports)
  // Replace the alert-based sendNotification with an API call
  async function sendNotification(message: string, type: "completed" | "warning" | "info" | "transaction" = "info", goalId?: string, transactionId?: string) {
    try {
      await api.post('/notifications', {
        message,
        type,
        goalId,
        transactionId,
      });
      // fetchNotifications(); // Remove or comment out this line
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  async function updateProgress(goalId: string, additionalAmount: number, newDate: Date | null) {
    try {
      const goal = goals.find((goal) => goal._id === goalId);
      if (!goal) {
        setError("Goal not found.");
        return;
      }

      const newSavedAmount = goal.savedAmount + additionalAmount;
      const targetAmount = goal.targetAmount;
      const deadline = newDate ?? goal.deadline ? new Date(newDate ?? goal.deadline) : undefined;

      // Calculate progress and time to deadline
      const progress = Math.round((newSavedAmount / targetAmount) * 100);
      let notificationSent = false;

      // 1. Notify if target achieved
      if (newSavedAmount >= targetAmount) {
        sendNotification(`Congratulations! You have achieved your goal: "${goal.title}".`);
        notificationSent = true;
      }
      // 2. Notify if progress reaches 80% (and wasn't already >= 80%)
      else if (
        progress >= 80 &&
        Math.round((goal.savedAmount / targetAmount) * 100) < 80
      ) {
        sendNotification(`Great job! You're 80% of the way to your goal: "${goal.title}".`);
        notificationSent = true;
      }
      // 3. Notify if deadline is within 1 month (and not already notified)
      if (deadline) {
        const now = new Date();
        const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        if (
          deadline > now &&
          deadline <= oneMonthFromNow
        ) {
          sendNotification(`Reminder: Only 1 month left to reach your goal "${goal.title}".`);
          notificationSent = true;
        }
      }

      const res = await api.put(`/goals/${goalId}`, {
        savedAmount: newSavedAmount,
        deadline: newDate,
        status: newSavedAmount >= targetAmount ? "achieved" : goal.status, // Optionally update status
      });

      if (res.status >= 200 && res.status < 300) {
        const updatedGoal = res.data;
        setGoals((prev: any[]) =>
          prev.map((goal: any) => (goal._id === updatedGoal._id ? updatedGoal : goal))
        );
        setSelectedGoal(null);
      } else {
        setError("Failed to update progress. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update progress. Please check your connection.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">Track and manage your financial goals</p>
        </div>
        <Button onClick={() => setShowGoalForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div>Loading...</div>
        ) : (
          goals.map((goal) => {
            const progress = Math.round((goal.savedAmount / goal.targetAmount) * 100);
            const remaining = goal.targetAmount - goal.savedAmount;

            return (
              <Card key={goal._id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{goal.title}</CardTitle>
                    </div>
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        progress === 100 ? "bg-emerald-100 dark:bg-emerald-900" : "bg-muted"
                      )}
                    >
                      {progress === 100 ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Target className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Current</div>
                        <div className="font-medium">{formatter.format(goal.savedAmount)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Target</div>
                        <div className="font-medium">{formatter.format(goal.targetAmount)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Remaining</div>
                        <div className="font-medium">{formatter.format(remaining)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Target Date</div>
                        <div className="font-medium">
                          {goal.deadline ? format(new Date(goal.deadline), "MMM d, yyyy") : "Ongoing"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedGoal(goal)}
                  >
                    Update Progress
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* Update Progress Dialog */}
      {selectedGoal && (
        <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
              <DialogDescription>Update the saved amount and target date for your goal</DialogDescription>
            </DialogHeader>
            <Form {...updateForm}>
              <form
                onSubmit={updateForm.handleSubmit((values) => {
                  const newProgress = Number(values.currentAmount);
                  const newDate = values.date ?? null;
                  if (!isNaN(newProgress)) {
                    updateProgress(selectedGoal._id, newProgress, newDate);
                  } else {
                    setError("Please enter a valid number for the current amount.");
                  }
                })}
                className="space-y-4"
              >
                <FormField
                  control={updateForm.control}
                  name="currentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Amount</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={updateForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setSelectedGoal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      {showGoalForm && (
        <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
              <DialogDescription>Fill in the details to create a new savings goal.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Buy a laptop" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Saved Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowGoalForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Goal</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
