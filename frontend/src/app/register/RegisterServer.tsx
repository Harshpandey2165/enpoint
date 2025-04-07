import { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create a new account',
};

export default function RegisterServer() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <RegisterClient />
      </body>
    </html>
  );
}
