import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Redirecting...',
  description: 'Redirecting to login page...',
};

export default function Home() {
  redirect('/login');
  return null;
}
