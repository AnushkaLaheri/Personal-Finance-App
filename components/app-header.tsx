"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Bell, Search, CheckCircle, AlertTriangle, Info, DollarSign } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import Link from "next/link";

type Notification = {
  _id: string;
  message: string;
  type: "completed" | "warning" | "info" | "transaction";
  createdAt: string;
  goalId?: string;
  transactionId?: string;
  seen?: boolean;
};

export function AppHeader() {
  const [isClient, setIsClient] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userData, setUserData] = useState<null | { name: string; email: string; profilePicture: string }>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    async function fetchUserData() {
      try {
        const response = await api.get('/auth/profile');
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
    fetchUserData();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function markAllAsSeen() {
    try {
        const response = await api.put('/notifications/markAsSeen');
        setNotifications(prev => prev.map(n => ({ ...n, seen: true })));
    } catch (error) {
        // Cast 'error' to an 'Error' object
        if (error instanceof Error) {
            console.error('Failed to mark notifications as seen:', error.message);
        } else {
            console.error('An unexpected error occurred:', error);
        }
    }
}



  function getNotificationIcon(type: string) {
    switch (type) {
      case "completed":
        return <CheckCircle className="text-emerald-500 w-4 h-4 mr-2" />;
      case "warning":
        return <AlertTriangle className="text-amber-500 w-4 h-4 mr-2" />;
      case "transaction":
        return <DollarSign className="text-blue-500 w-4 h-4 mr-2" />;
      default:
        return <Info className="text-gray-400 w-4 h-4 mr-2" />;
    }
  }

  if (!isClient || !userData) return null;

  return (
    <header className="border-b h-14 flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden w-8" />
      <div className="hidden md:flex md:w-96">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search transactions..." className="w-full pl-8" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu
          open={dropdownOpen}
          onOpenChange={(open) => {
            setDropdownOpen(open);
            if (open) markAllAsSeen();
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                {notifications.filter(n => !n.seen).length}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`flex flex-row items-start py-2 gap-2 ${
                  notification.seen
                    ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-500"
                    : "bg-muted/40"
                }`}
              >
                {getNotificationIcon(notification.type)}
                <div>
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={userData.profilePicture} alt="User" />
                <AvatarFallback>{userData.name ? userData.name.charAt(0) : ""}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
