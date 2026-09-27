import { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from '@/components/auth/AuthForm';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Sign Up | VectorAfriq',
  description: 'Create your VectorAfriq account',
};

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/');
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <AuthForm mode="signup" />
    </Suspense>
  );
}
