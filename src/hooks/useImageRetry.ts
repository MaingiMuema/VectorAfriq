import { useState, useCallback } from 'react';

interface UseImageRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackSrc?: string;
}

export const useImageRetry = ({
  maxRetries = 3,
  retryDelay = 1000,
  fallbackSrc = "/images/placeholder.png"
}: UseImageRetryOptions = {}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  const handleImageError = useCallback((
    originalSrc: string, 
    onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
  ) => (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      
      const timestamp = new Date().getTime();
      const newSrc = originalSrc.includes('?') 
        ? `${originalSrc}&retry=${timestamp}` 
        : `${originalSrc}?retry=${timestamp}`;
      
      setTimeout(() => {
        setCurrentSrc(newSrc);
      }, retryDelay * (retryCount + 1));
      
    } else {
      setCurrentSrc(fallbackSrc);
      if (onError) {
        onError(e);
      }
    }
  }, [retryCount, maxRetries, retryDelay, fallbackSrc]);

  return {
    currentSrc,
    setCurrentSrc,
    handleImageError,
    retryCount,
  };
};