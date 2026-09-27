/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface VisitorTrackerProps {
  enabled?: boolean;
}

export default function VisitorTracker({ enabled = true }: VisitorTrackerProps) {
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastPageRef = useRef<string>('');
  const configRef = useRef<any>(null);

  // Generate or get session ID
  const getSessionId = () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitor_session_id', sessionId);
    }
    
    sessionIdRef.current = sessionId;
    return sessionId;
  };

  // Fetch tracking configuration
  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/analytics/track');
      const data = await response.json();
      if (data.success) {
        configRef.current = data.config;
        return data.config;
      }
    } catch (error) {
      // Error fetching tracking config - silently fail
    }
    return null;
  };

  // Track page view
  const trackPageView = useCallback(async (page: string, isExit = false) => {
    if (!enabled) return;
    
    const config = configRef.current || await fetchConfig();
    if (!config?.visitorTrackingEnabled) return;

    const sessionId = getSessionId();
    const currentTime = Date.now();
    const timeOnPage = currentTime - startTimeRef.current;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          page,
          title: document.title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          loadTime: (() => {
            // Use modern Performance API if available
            if (typeof performance !== 'undefined') {
              // Prefer performance.timing if available and valid
              if (performance.timing) {
                const { loadEventEnd, navigationStart } = performance.timing;
                if (loadEventEnd > 0 && navigationStart > 0) {
                  const loadMs = loadEventEnd - navigationStart;
                  // Sanity check: load time should be positive and under 60s
                  if (loadMs > 0 && loadMs < 60000) return Math.round(loadMs);
                }
              }
              // Fallback: use performance.now() which is time since page load
              return Math.round(performance.now());
            }
            return 0;
          })(),
          scrollDepth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100) || 0,
          timeOnPage: Math.round(timeOnPage / 1000), // Convert to seconds
          exitPage: isExit,
        }),
      });
    } catch (error) {
      // Error tracking page view - silently fail
    }
  }, [enabled]);

  // Track scroll depth
  const trackScrollDepth = () => {
    const scrollPercentage = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    // Store max scroll depth in session storage
    const currentMaxScroll = parseInt(sessionStorage.getItem('max_scroll_depth') || '0');
    if (scrollPercentage > currentMaxScroll) {
      sessionStorage.setItem('max_scroll_depth', scrollPercentage.toString());
    }
  };

  // Handle page visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      // Track exit when page becomes hidden
      trackPageView(pathname, true);
    }
  }, [pathname, trackPageView]);

  // Handle beforeunload
  const handleBeforeUnload = useCallback(() => {
    trackPageView(pathname, true);
  }, [pathname, trackPageView]);

  // Initialize tracking on mount and path change
  useEffect(() => {
    if (!enabled) return;

    // Track page view for new page
    if (pathname !== lastPageRef.current) {
      // Track exit for previous page if it exists
      if (lastPageRef.current) {
        trackPageView(lastPageRef.current, true);
      }
      
      // Reset start time for new page
      startTimeRef.current = Date.now();
      
      // Track new page view
      trackPageView(pathname);
      
      lastPageRef.current = pathname;
    }

    // Add event listeners
    const scrollHandler = () => trackScrollDepth();
    window.addEventListener('scroll', scrollHandler, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', scrollHandler);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, enabled, trackPageView, handleVisibilityChange, handleBeforeUnload]);

  // Track periodic updates (every 30 seconds)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      trackPageView(pathname);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [pathname, enabled, trackPageView]);

  return null; // This component doesn't render anything
}

// Google Analytics component
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  useEffect(() => {
    if (!measurementId) return;

    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    // Initialize Google Analytics
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_title: document.title,
        page_location: window.location.href,
      });
    `;
    document.head.appendChild(script2);

    // Cleanup
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [measurementId]);

  return null;
}

// Combined Analytics Provider
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fetch analytics configuration and initialize tracking
    const initializeAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/track');
        const data = await response.json();
        
        if (data.success && data.config) {
          const { googleAnalyticsEnabled, googleAnalyticsId, visitorTrackingEnabled } = data.config;
          
          // Note: Google Analytics script is now loaded in layout.tsx
          // We can still configure additional tracking options here if needed
          if (googleAnalyticsEnabled && googleAnalyticsId) {
            // Additional configuration can be added here if needed
          }
        }
      } catch (error) {
        // Error initializing analytics - silently fail
      }
    };

    initializeAnalytics();
  }, []);

  return (
    <>
      <VisitorTracker />
      {children}
    </>
  );
}
