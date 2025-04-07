"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { Task } from './types';
import { Button } from '@/components/ui/Button';
import { TaskDialog } from '@/components/TaskDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';

interface TaskStatus {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

interface FetchTasksResponse {
  tasks: Task[];
}

const fetchTasks = async (): Promise<FetchTasksResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
};

const useTasksQuery = () => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['tasks'] as const,
    queryFn: fetchTasks,
    select: (data: FetchTasksResponse) => data.tasks,
    enabled: !!localStorage.getItem('token'),
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

export function TasksClient() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: tasks = [], error: fetchError, isLoading } = useTasksQuery();

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Omit<Task, 'id' | 'created_at'>) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      return response.json() as Promise<Task>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Error creating task:', error);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: Task['status'] }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      return response.json() as Promise<Task>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Error updating task:', error);
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      console.error('Error deleting task:', error);
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeTask = tasks.find((task: Task) => task.id === active.id);
      const overTask = tasks.find((task: Task) => task.id === over.id);

      if (activeTask && overTask && activeTask.status !== overTask.status) {
        updateTaskMutation.mutate({ taskId: activeTask.id, status: overTask.status });
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    if (fetchError) {
      console.error('Error fetching tasks:', fetchError);
    }
  }, [fetchError]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error fetching tasks: {fetchError.message}</p>
          </div>
        </div>
      </div>
    );
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => (
              <div key={status} className="space-y-4">
                <h3 className="text-lg font-semibold">{status.replace('_', ' ')}</h3>
                <div className="space-y-2">
                  <SortableContext
                    items={tasks.filter((task: Task) => task.status === status).map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasks
                      .filter((task: Task) => task.status === status)
                      .map((task) => (
                        <div
                          key={task.id}
                          id={task.id}
                          className="p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
                          data-id={task.id}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{task.title}</h3>
                              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
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
                      ))}
                  </SortableContext>
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      </main>

      <TaskDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        task={selectedTask}
        onCreate={(taskData: Omit<Task, 'id' | 'created_at'>) => {
          createTaskMutation.mutate(taskData);
          setIsDialogOpen(false);
        }}
        onUpdate={(taskId: string, data: Partial<Task>) => {
          updateTaskMutation.mutate({ taskId, status: data.status as Task['status'] });
        }}
      />
    </div>
  );
}
