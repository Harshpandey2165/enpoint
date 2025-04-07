import { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginServer() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <LoginClient />
      </body>
    </html>
  );
}
