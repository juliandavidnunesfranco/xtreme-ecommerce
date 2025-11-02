"use client";

import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePreloader } from '@/hooks/use-preloader';
import PreLoader from '@/components/preloader';

const PreloaderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isInitialLoadComplete, setInitialLoadComplete } = usePreloader();

  useEffect(() => {
    if (!isInitialLoadComplete) {
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 5000); // Corresponds to the preloader's animation time

      return () => clearTimeout(timer);
    }
  }, [isInitialLoadComplete, setInitialLoadComplete]);

  return (
    <>
      <AnimatePresence>
        {!isInitialLoadComplete && <PreLoader />}
      </AnimatePresence>
      {children}
    </>
  );
};

export default PreloaderWrapper;
