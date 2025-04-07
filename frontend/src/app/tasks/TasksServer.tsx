import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Task } from './types';
import TasksClient from './TasksClient';

export const metadata: Metadata = {
  title: 'Tasks',
  description: 'Task management dashboard',
};

export async function TasksServer() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return null;
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="space-y-4">
          {tasks?.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white rounded-lg shadow"
            >
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            </div>
          ))}
        </div>
      </body>
    </html>
  );
}
