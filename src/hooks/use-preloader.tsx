"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PreloaderContextType {
  isInitialLoadComplete: boolean;
  setInitialLoadComplete: (isComplete: boolean) => void;
}

const PreloaderContext = createContext<PreloaderContextType | undefined>(undefined);

export const usePreloader = () => {
  const context = useContext(PreloaderContext);
  if (!context) {
    throw new Error('usePreloader must be used within a PreloaderProvider');
  }
  return context;
};

export const PreloaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isInitialLoadComplete, setInitialLoadComplete] = useState(false);

  return (
    <PreloaderContext.Provider value={{ isInitialLoadComplete, setInitialLoadComplete }}>
      {children}
    </PreloaderContext.Provider>
  );
};
