import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Not Found',
  description: 'The page you are looking for does not exist',
};

export default function NotFoundPage() {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-6">Page Not Found</p>
          <p className="text-gray-500">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
      </body>
    </html>
  );
}
