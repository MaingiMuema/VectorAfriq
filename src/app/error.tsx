'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { FaHome, FaRedo, FaExclamationTriangle } from 'react-icons/fa';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page render error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <FaExclamationTriangle className="text-[#468AD1] w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error while loading this page. Our team
            has been notified and is working to fix it.
          </p>

          {error.digest && (
            <p className="text-xs text-gray-400 mb-6">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors"
            >
              <FaRedo className="mr-2" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaHome className="mr-2" />
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}