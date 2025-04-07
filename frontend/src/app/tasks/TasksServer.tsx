import { Metadata } from 'next';
import TasksClient from './TasksClient';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'Task management dashboard',
};

export default function TasksServer() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <TasksClient />
      </body>
    </html>
  );
}
