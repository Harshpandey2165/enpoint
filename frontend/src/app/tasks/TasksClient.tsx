'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/Button';
import { TaskDialog } from '@/components/TaskDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
};

const columns = {
  TODO: { title: 'To Do', color: 'bg-gray-100' },
  IN_PROGRESS: { title: 'In Progress', color: 'bg-blue-50' },
  DONE: { title: 'Done', color: 'bg-green-50' },
};

export default function TasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/tasks', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: Partial<Task> & { id: string }) => {
      const res = await fetch(`http://localhost:3001/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleDragEnd = (result: import('react-beautiful-dnd').DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as Task['status'];
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateTaskMutation.mutate({ id: taskId, status: newStatus });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Task Management</h1>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setSelectedTask(null);
                setIsDialogOpen(true);
              }}
            >
              Add Task
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(columns).map(([status, { title, color }]) => (
              <div key={status} className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">{title}</h2>
                <Droppable droppableId={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`${color} p-4 rounded-lg min-h-[200px]`}
                    >
                      {tasks
                        .filter((task) => task.status === status)
                        .map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white p-4 rounded-lg shadow mb-3 cursor-pointer hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-medium">{task.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {task.description}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setIsDialogOpen(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteTaskMutation.mutate(task.id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </main>

      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        task={selectedTask}
      />
    </div>
  );
}
