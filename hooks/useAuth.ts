import { useState } from 'react';
import { AxiosError } from 'axios';
import api from '../lib/api';

export interface User {
  name: string;
  totalBalance: number;
  income?: number;
  expenses?: number;
  recentTransactions?: any[];
  chartData?: any[];
  savings?: number;
  savingsIncrease?: number;
  preferences?: { // Add this block
    currency?: string;
    theme?: string;
  };
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // <-- Add this line

  interface UserData {
    email: string;
    password: string;
  }
  
  interface RegisterUser extends UserData {
    name: string;
    confirmPassword: string;
  }

  // Register user
  const registerUser = async (userData: RegisterUser) => {
    setLoading(true);
    setError(null);  // Reset any previous errors
    setSuccess(null); // Reset previous success
    try {
      console.log("Registering user with data:", userData);

      const { name, email, password, confirmPassword } = userData;

      // Validate password and confirm password
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // Validate email format
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isValidEmail) {
        setError("Please enter a valid email.");
        setLoading(false);
        return;
      }

      // Send { name, email, password, confirmPassword } to API
      const response = await api.post('/auth/register', { name, email, password, confirmPassword });

      setSuccess("Successfully registered! Please login to continue."); // Show success message
      setUser(null); // Clear user state
      localStorage.removeItem('token'); // Remove JWT token if set
      setLoading(false);  // Set loading to false
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (err.response?.data.message === "User already exists") {
          setError("This email is already registered. Please log in.");
        } else {
          setError(err.response?.data.message || "An error occurred");
        }
      } else {
        setError("An unknown error occurred");
      }
      setUser(null); // Clear user data in case of error
      setLoading(false);
    }
  };
  
  

  // Login user
  const loginUser = async (userData: UserData): Promise<User> => {
    setLoading(true);
    setError(null);  // Reset previous errors
    try {
      const response = await api.post('/auth/login', userData); // Correct URL format
      localStorage.setItem('token', response.data.token); // Save JWT token
      setUser(response.data.user);
      return response.data;
    } catch (err: unknown) {
      handleError(err);
      throw err; // Important to throw error for .catch() in page.tsx
    } finally {
      setLoading(false);
    }
  };

  // Get profile
  const getProfile = async (): Promise<User> => {
    setLoading(true);
    setError(null);  // Reset previous errors
    try {
      const response = await api.get('/auth/profile'); // <-- FIXED endpoint
      setUser(response.data);
      return response.data;
    } catch (err: unknown) {
      handleError(err);
      throw err; // Throw error for proper error handling
    } finally {
      setLoading(false);
    }
  };

  // Handle errors uniformly
  const handleError = (err: unknown) => {
    if (err instanceof AxiosError) {
      console.error("API Error:", err.response?.data?.message || err.message);
      setError(err.response?.data?.message || "An error occurred");
    } else if (err instanceof Error) {
      console.error("Unexpected Error:", err.message);
      setError(err.message);
    } else {
      console.error("Unknown error:", err);
      setError("An unknown error occurred");
    }
  };

  return { user, loading, error, success, registerUser, loginUser, getProfile };
}

export default useAuth;
