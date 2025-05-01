"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Preferences {
  currency: string;
  dateFormat: string;
  theme: string;
}

interface PreferencesProviderProps {
  children: ReactNode;
}

interface PreferencesContextType {
  currency: string;
  setCurrency: (currency: string) => void;
}

interface PreferencesProviderProps {
  children: ReactNode; // Define children prop type
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState('INR'); // Set default currency to INR

  return (
    <PreferencesContext.Provider value={{ currency, setCurrency }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};