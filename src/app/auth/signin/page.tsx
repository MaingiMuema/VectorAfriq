import { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Sign In | VectorAfriq',
  description: 'Sign in to your VectorAfriq account',
};

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session && session.error !== 'ACCOUNT_DEACTIVATED') {
    if (session.user?.role === 'ADMIN') {
      redirect('/admin/dashboard');
    } else {
      redirect('/crm/dashboard');
    }
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <AuthForm mode="signin" />
    </Suspense>
  );
}
