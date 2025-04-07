'use client';

import { Metadata } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const metadata: Metadata = {
  title: 'Redirecting...',
  description: 'Redirecting to login page...',
};

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return null;
}
