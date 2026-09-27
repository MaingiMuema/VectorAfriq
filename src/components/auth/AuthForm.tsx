'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiMail, FiAlertCircle } from 'react-icons/fi';
import { ACCOUNT_DEACTIVATED_ERROR } from '@/lib/authConstants';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountDeactivated, setAccountDeactivated] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealMessage, setAppealMessage] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);
  const [appealSuccess, setAppealSuccess] = useState('');
  const [appealError, setAppealError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Surface Google OAuth deactivation redirects (?error=ACCOUNT_DEACTIVATED)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (
      urlError === ACCOUNT_DEACTIVATED_ERROR ||
      urlError === 'AccessDenied' ||
      (urlError && urlError.includes(ACCOUNT_DEACTIVATED_ERROR))
    ) {
      setAccountDeactivated(true);
      setError('');
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear deactivation state when user edits credentials
    if (accountDeactivated) {
      setAccountDeactivated(false);
      setShowAppealForm(false);
      setAppealSuccess('');
      setAppealError('');
    }
  };

  const isDeactivatedError = (err?: string | null) => {
    if (!err) return false;
    return (
      err === ACCOUNT_DEACTIVATED_ERROR ||
      err.includes(ACCOUNT_DEACTIVATED_ERROR) ||
      decodeURIComponent(err).includes(ACCOUNT_DEACTIVATED_ERROR)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAccountDeactivated(false);
    setAppealSuccess('');
    setAppealError('');

    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const text = await res.text();
          let message = text || 'Registration failed';
          try {
            const json = JSON.parse(text);
            if (json?.error) message = json.error;
          } catch {
            // keep raw text
          }
          throw new Error(message);
        }
      }

      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        if (isDeactivatedError(result.error)) {
          setAccountDeactivated(true);
          setError('');
        } else {
          // NextAuth may collapse custom errors to CredentialsSignin —
          // double-check account status so deactivated users still see the CTA.
          try {
            const statusRes = await fetch('/api/auth/account-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email }),
            });
            const statusData = await statusRes.json();
            if (statusData?.deactivated) {
              setAccountDeactivated(true);
              setError('');
            } else {
              setError('Invalid credentials');
            }
          } catch {
            setError('Invalid credentials');
          }
        }
      } else {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/crm/dashboard');
        }
        router.refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      if (isDeactivatedError(message)) {
        setAccountDeactivated(true);
        setError('');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/crm/dashboard' });
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppealLoading(true);
    setAppealError('');
    setAppealSuccess('');

    try {
      const res = await fetch('/api/auth/reactivation-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || undefined,
          message: appealMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit appeal');
      }

      setAppealSuccess(
        data.message ||
          'Your reactivation appeal has been sent to our support team.'
      );
      setShowAppealForm(false);
      setAppealMessage('');
    } catch (err) {
      setAppealError(
        err instanceof Error ? err.message : 'Failed to submit appeal'
      );
    } finally {
      setAppealLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'signin' ? (
              <>
                Or{' '}
                <Link href="/auth/signup" className="font-medium text-[#468AD1] hover:text-[#514f63]">
                  create a new account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/auth/signin" className="font-medium text-[#468AD1] hover:text-[#514f63]">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {accountDeactivated && mode === 'signin' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex gap-3">
                <FiAlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Account deactivated
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Your account has been deactivated. Please contact an administrator
                    to request reactivation. You cannot sign in until your account is reactivated.
                  </p>
                </div>
              </div>

              {appealSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                  {appealSuccess}
                </div>
              )}

              {!showAppealForm && !appealSuccess && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAppealForm(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-[#468AD1] hover:bg-[#514f63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
                  >
                    <FiMail className="h-4 w-4" />
                    Contact Admin / Appeal Reactivation
                  </button>
                  <a
                    href="mailto:support@vectorafriqproperties.co.ke?subject=Account%20Reactivation%20Request"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-amber-900 bg-white border border-amber-300 hover:bg-amber-50"
                  >
                    Email support
                  </a>
                </div>
              )}

              {showAppealForm && (
                <div className="border-t border-amber-200 pt-3 space-y-3">
                  <p className="text-sm text-amber-900 font-medium">
                    Submit a reactivation appeal
                  </p>
                  {appealError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                      {appealError}
                    </div>
                  )}
                  <div>
                    <label htmlFor="appeal-email" className="block text-xs font-medium text-amber-900 mb-1">
                      Account email
                    </label>
                    <input
                      id="appeal-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      name="email"
                      className="appearance-none rounded relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#468AD1] focus:border-[#468AD1] sm:text-sm bg-white"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="appeal-message" className="block text-xs font-medium text-amber-900 mb-1">
                      Message to admin (optional)
                    </label>
                    <textarea
                      id="appeal-message"
                      rows={3}
                      value={appealMessage}
                      onChange={(e) => setAppealMessage(e.target.value)}
                      maxLength={2000}
                      className="appearance-none rounded relative block w-full px-3 py-2 border border-amber-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#468AD1] focus:border-[#468AD1] sm:text-sm bg-white"
                      placeholder="Please explain why you would like your account reactivated..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAppealSubmit}
                      disabled={appealLoading || !formData.email}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-[#468AD1] hover:bg-[#514f63] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {appealLoading ? 'Sending...' : 'Submit Appeal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppealForm(false);
                        setAppealError('');
                      }}
                      className="px-4 py-2 text-sm font-medium rounded-md text-amber-900 bg-white border border-amber-300 hover:bg-amber-50"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-amber-700">
                    Appeals are sent to support@vectorafriqproperties.co.ke
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#468AD1] focus:border-[#468AD1] focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#468AD1] focus:border-[#468AD1] focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#468AD1] focus:border-[#468AD1] focus:z-10 sm:text-sm"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'signin' && (
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-[#468AD1] hover:text-[#514f63]"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#468AD1] hover:bg-[#514f63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#468AD1]"
              >
                <FcGoogle className="h-5 w-5 mr-2" />
                Google
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
