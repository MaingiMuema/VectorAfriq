'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaHome, FaSearch, FaSpinner } from 'react-icons/fa';

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after 3 seconds
    const redirectTimeout = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <FaSearch className="mx-auto text-gray-400 w-16 h-16 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          {/* Redirect notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <FaSpinner className="animate-spin" />
              <span>
                Redirecting to homepage in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}...
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] transition-colors"
            >
              <FaHome className="mr-2" />
              Go to Home Now
            </Link>
            <Link
              href="/for-sale"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaSearch className="mr-2" />
              Browse Properties
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
