"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import PropertyLoadingOverlay from "@/components/properties/PropertyLoadingOverlay";

const NAVIGATION_TIMEOUT = 20000; // 20 second auto-clear timeout

interface NavigationLoadingContextType {
  setLoading: (loading: boolean, message?: string) => void;
  isLoading: boolean;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  setLoading: () => { },
  isLoading: false,
});

export const useNavigationLoading = () => useContext(NavigationLoadingContext);

function NavigationLoadingHandler({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading property");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear loading on route change
  useEffect(() => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  // Set loading with optional message
  const setLoading = useCallback((loading: boolean, message?: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsLoading(loading);
    if (message) {
      setLoadingMessage(message);
    } else {
      setLoadingMessage("Loading Resources");
    }

    // Set automatic timeout to prevent infinite loading (safety net)
    if (loading) {
      timeoutRef.current = setTimeout(() => {
        console.warn('[NavigationLoading] Auto-clearing loading state due to timeout');
        setIsLoading(false);
      }, NAVIGATION_TIMEOUT);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <NavigationLoadingContext.Provider value={{ setLoading, isLoading }}>
      {isLoading && (
        <PropertyLoadingOverlay message={loadingMessage} />
      )}
      {children}
    </NavigationLoadingContext.Provider>
  );
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <NavigationLoadingHandler>{children}</NavigationLoadingHandler>
    </Suspense>
  );
}
